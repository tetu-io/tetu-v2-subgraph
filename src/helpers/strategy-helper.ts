import {ControllerEntity, StrategyEntity, StrategyHistory} from "../types/schema";
import {Address, BigDecimal, BigInt} from "@graphprotocol/graph-ts";
import {formatUnits, getPrice} from "./common-helper";
import {HUNDRED_BD, RATIO_DENOMINATOR, ZERO_BD} from "../constants";
import {StrategySplitterAbi} from "../common/StrategySplitterAbi";
import {StrategyAbi} from "../common/StrategyAbi";
import {VaultAbi} from "../types/templates/StrategySplitterTemplate/VaultAbi";
import {ProxyAbi} from "../types/templates/StrategySplitterTemplate/ProxyAbi";
import {StrategyTemplate} from "../types/templates";
import {IPairStrategyAbi} from "../types/templates/StrategyTemplate/IPairStrategyAbi";
import {LiquidatorAbi as LiquidatorAbiCommon} from "../common/LiquidatorAbi";
import {LiquidatorAbi} from "../types/templates/MultiGaugeTemplate/LiquidatorAbi";


export function getOrCreateStrategy(address: string): StrategyEntity | null {
  let strategy = StrategyEntity.load(address);

  if (!strategy) {
    strategy = new StrategyEntity(address);
    const strategyCtr = StrategyAbi.bind(Address.fromString(address));
    const splitterAdrT = strategyCtr.try_splitter();
    if (splitterAdrT.reverted) {
      return null;
    }
    const splitterAdr = splitterAdrT.value;
    const splitterCtr = StrategySplitterAbi.bind(splitterAdr);
    const vaultAdr = splitterCtr.vault();
    const vaultCtr = VaultAbi.bind(vaultAdr);
    const proxy = ProxyAbi.bind(Address.fromString(address))
    const compoundDenominator = RATIO_DENOMINATOR.toBigDecimal();
    const aprDenominator = RATIO_DENOMINATOR.toBigDecimal();

    strategy.version = strategyCtr.STRATEGY_VERSION();
    strategy.revision = strategyCtr.revision().toI32();
    strategy.createdTs = strategyCtr.created().toI32();
    strategy.createdBlock = strategyCtr.createdBlock().toI32();
    strategy.implementations = [proxy.implementation().toHexString()];
    strategy.splitter = splitterAdr.toHexString();
    strategy.asset = strategyCtr.asset().toHexString();
    strategy.assetTokenDecimals = vaultCtr.decimals();

    strategy.name = strategyCtr.NAME();
    const n = strategyCtr.try_strategySpecificName();
    if (!n.reverted) {
      strategy.specificName = n.value;
    }
    strategy.platform = strategyCtr.PLATFORM();

    strategy.compoundRatio = strategyCtr.compoundRatio().toBigDecimal().times(BigDecimal.fromString('100')).div(compoundDenominator);
    strategy.paused = splitterCtr.pausedStrategies(Address.fromString(address));
    strategy.apr = splitterCtr.strategiesAPR(Address.fromString(address)).toBigDecimal().times(BigDecimal.fromString('100')).div(aprDenominator);
    strategy.averageApr = splitterCtr.averageApr(Address.fromString(address)).toBigDecimal().times(BigDecimal.fromString('100')).div(aprDenominator);
    strategy.lastHardWork = splitterCtr.lastHardWorks(Address.fromString(address)).toI32();
    strategy.tvl = formatUnits(strategyCtr.totalAssets(), BigInt.fromI32(strategy.assetTokenDecimals));
    strategy.profit = BigDecimal.fromString('0');
    strategy.loss = BigDecimal.fromString('0');
    strategy.capacity = BigDecimal.fromString('0');
    strategy.tvlAllocationPercent = BigDecimal.fromString('0');

    strategy.feesClaimed = BigDecimal.fromString('0');
    strategy.rewardsClaimed = BigDecimal.fromString('0');
    strategy.profitCovered = BigDecimal.fromString('0');
    strategy.lossCoveredFromInsurance = BigDecimal.fromString('0');
    strategy.lossCoveredFromRewards = BigDecimal.fromString('0');

    StrategyTemplate.create(Address.fromString(address));
    strategy.save();
  }

  return strategy;
}

export function saveStrategyHistory(strategy: StrategyEntity, time: i32, block: i32): void {
  const h = new StrategyHistory(strategy.id + '_' + BigInt.fromI32(time).toString());
  h.strategy = strategy.id;
  h.time = time;
  h.block = block;
  h.tvl = strategy.tvl;
  h.profit = strategy.profit;
  h.loss = strategy.loss;
  h.apr = strategy.apr;
  h.averageApr = strategy.averageApr;
  h.tvlAllocationPercent = strategy.tvlAllocationPercent;

  h.feesClaimed = strategy.feesClaimed;
  h.rewardsClaimed = strategy.rewardsClaimed;
  h.profitCovered = strategy.profitCovered;
  h.lossCoveredFromInsurance = strategy.lossCoveredFromInsurance;
  h.lossCoveredFromRewards = strategy.lossCoveredFromRewards;

  h.save();
}

export function updateStrategyData(
  strategy: StrategyEntity,
  time: i32,
  block: i32,
  splitterCtr: StrategySplitterAbi,
  strategyCtr: StrategyAbi
): void {
  strategy.tvl = formatUnits(strategyCtr.totalAssets(), BigInt.fromI32(strategy.assetTokenDecimals));
  const totalAssets = formatUnits(splitterCtr.totalAssets(), BigInt.fromI32(strategy.assetTokenDecimals));
  if (totalAssets.equals(ZERO_BD)) {
    strategy.tvlAllocationPercent = ZERO_BD;
  } else {
    strategy.tvlAllocationPercent = strategy.tvl.times(HUNDRED_BD).div(totalAssets);
  }
  saveStrategyHistory(strategy, time, block);
  strategy.save();
}

export function getFeesClaimed(stretegyAddress: Address, fee0: BigInt, fee1: BigInt, assetDecimals: BigInt): BigDecimal {
  const strategyCtr = IPairStrategyAbi.bind(stretegyAddress);
  const version: string = strategyCtr.STRATEGY_VERSION();
  if (getMajorVersion(version) >= 2) {
    const controller = ControllerEntity.load(strategyCtr.controller().toHexString()) as ControllerEntity;
    const defaultState = strategyCtr.getDefaultState();
    const tokenA = defaultState.getAddr()[0]
    const tokenB = defaultState.getAddr()[1]
    const depositorSwapTokens = defaultState.getBoolValues()[1]
    if (depositorSwapTokens) {
      const feeB = getPrice(
          changetype<LiquidatorAbiCommon>(LiquidatorAbi.bind(Address.fromString(controller.liquidator))),
          tokenB.toHexString(),
          tokenA.toHexString(),
          fee0
      )
      return formatUnits(fee1.plus(feeB), assetDecimals);
    }

    const feeB = getPrice(
        changetype<LiquidatorAbiCommon>(LiquidatorAbi.bind(Address.fromString(controller.liquidator))),
        tokenB.toHexString(),
        tokenA.toHexString(),
        fee1
    )
    return formatUnits(fee0.plus(feeB), assetDecimals);
  }

  return BigDecimal.zero();
}

export function getRewardsClaimed(stretegyAddress: Address, reward0: BigInt, reward1: BigInt, assetDecimals: BigInt, rewardToken0: Address, rewardToken1: Address): BigDecimal {
  const strategyCtr = IPairStrategyAbi.bind(stretegyAddress);
  const version: string = strategyCtr.STRATEGY_VERSION();
  if (getMajorVersion(version) >= 2) {
    const controller = ControllerEntity.load(strategyCtr.controller().toHexString()) as ControllerEntity;
    const defaultState = strategyCtr.getDefaultState();
    const tokenA = defaultState.getAddr()[0]
    const reward0InAssetForm = reward0.gt(BigInt.fromI32(0)) ? getPrice(
        changetype<LiquidatorAbiCommon>(LiquidatorAbi.bind(Address.fromString(controller.liquidator))),
        rewardToken0.toHexString(),
        tokenA.toHexString(),
        reward0
    ) : BigInt.fromI32(0)
    const reward1InAssetForm = reward1.gt(BigInt.fromI32(0)) ? getPrice(
        changetype<LiquidatorAbiCommon>(LiquidatorAbi.bind(Address.fromString(controller.liquidator))),
        rewardToken1.toHexString(),
        tokenA.toHexString(),
        reward1
    ) : BigInt.fromI32(0)
    return formatUnits(reward0InAssetForm.plus(reward1InAssetForm), assetDecimals);
  }

  return BigDecimal.zero();
}

export function getMajorVersion(version: string): number {
  return parseInt(version.split('.')[0]);
}
