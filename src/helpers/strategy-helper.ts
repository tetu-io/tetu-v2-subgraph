import {StrategyEntity, StrategyHistory} from "../types/schema";
import {Address, BigDecimal, BigInt} from "@graphprotocol/graph-ts";
import {formatUnits} from "./common-helper";
import {HUNDRED_BD, RATIO_DENOMINATOR, ZERO_BD} from "../constants";
import {StrategySplitterAbi} from "../common/StrategySplitterAbi";
import {StrategyAbi} from "../common/StrategyAbi";
import {VaultAbi} from "../types/templates/StrategySplitterTemplate/VaultAbi";
import {ProxyAbi} from "../types/templates/StrategySplitterTemplate/ProxyAbi";
import {StrategyTemplate} from "../types/templates";


export function getOrCreateStrategy(address: string): StrategyEntity {
  let strategy = StrategyEntity.load(address);

  if (!strategy) {
    strategy = new StrategyEntity(address);
    const strategyCtr = StrategyAbi.bind(Address.fromString(address));
    const splitterAdr = strategyCtr.splitter();
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
    if(!n.reverted) {
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

    StrategyTemplate.create(Address.fromString(address));
    strategy.save();
  }

  return strategy;
}

export function saveStrategyHistory(strategy: StrategyEntity, time: i32): void {
  const h = new StrategyHistory(strategy.id + '_' + BigInt.fromI32(time).toString());
  h.strategy = strategy.id;
  h.time = time;

  h.tvl = strategy.tvl;
  h.profit = strategy.profit;
  h.loss = strategy.loss;
  h.apr = strategy.apr;
  h.averageApr = strategy.averageApr;
  h.tvlAllocationPercent = strategy.tvlAllocationPercent;

  h.save();
}

export function updateStrategyData(
  strategy: StrategyEntity,
  time: i32,
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
  saveStrategyHistory(strategy, time);
  strategy.save();
}
