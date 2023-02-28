// noinspection JSUnusedGlobalSymbols

import {
  ContinueInvesting,
  HardWork,
  Invested,
  Loss,
  ManualAprChanged,
  Paused,
  Rebalance,
  RevisionIncreased,
  SetStrategyCapacity,
  StrategyAdded,
  StrategyRemoved,
  StrategyScheduled,
  StrategySplitterAbi,
  Upgraded,
  WithdrawFromStrategy
} from "./types/templates/StrategySplitterTemplate/StrategySplitterAbi";
import {SplitterEntity, StrategyEntity, StrategyHistory, TokenEntity} from "./types/schema";
import {StrategyTemplate} from './types/templates'
import {Address, BigDecimal, BigInt} from "@graphprotocol/graph-ts";
import {StrategyAbi} from "./types/templates/StrategyTemplate/StrategyAbi";
import {ProxyAbi} from "./types/templates/StrategySplitterTemplate/ProxyAbi";
import {ADDRESS_ZERO, HUNDRED_BD, ZERO_BD} from "./constants";
import {VaultAbi} from "./types/templates/StrategySplitterTemplate/VaultAbi";
import {formatUnits} from "./helpers/common-helper";
import {saveStrategyHistory, updateStrategyData} from "./helpers/strategy-helper";
import {StrategySplitterAbi as StrategySplitterAbiCommon} from "./common/StrategySplitterAbi";
import {StrategyAbi as StrategyAbiCommon} from "./common/StrategyAbi";

// ***************************************************
//             ADD/REMOVE STRATEGIES
// ***************************************************

export function handleStrategyAdded(event: StrategyAdded): void {
  const strategy = getOrCreateStrategy(event.params.strategy.toHexString());
  saveStrategyHistory(strategy, event.block.timestamp.toI32());
  strategy.splitter = event.address.toHexString();
  strategy.save();
}

export function handleStrategyScheduled(event: StrategyScheduled): void {
  const splitter = SplitterEntity.load(event.address.toHexString()) as SplitterEntity;
  const arr = splitter.scheduledStrategies;
  arr.push(event.params.strategy.toHexString());
  splitter.scheduledStrategies = arr;
  splitter.save();
}

export function handleScheduledStrategyRemove(event: StrategyScheduled): void {
  const splitter = SplitterEntity.load(event.address.toHexString()) as SplitterEntity;
  const arr = splitter.scheduledStrategies;
  const strategy = event.params.strategy;
  let id = -1;
  for (let i = 0; i < arr.length; i++) {
    if (strategy.equals(Address.fromString(arr[i]))) {
      id = i;
    }
  }
  arr[id] = arr[arr.length - 1];
  arr.pop();
  splitter.scheduledStrategies = arr;
  splitter.save();
}

export function handleStrategyRemoved(event: StrategyRemoved): void {
  const strategy = getOrCreateStrategy(event.params.strategy.toHexString());
  strategy.splitter = ADDRESS_ZERO;
  strategy.save();
}

// ***************************************************
//                 STATE CHANGES
// ***************************************************

export function handleManualAprChanged(event: ManualAprChanged): void {
  const strategy = getOrCreateStrategy(event.params.strategy.toHexString());
  const splitterCtr = StrategySplitterAbi.bind(event.address);

  strategy.apr = event.params.newApr.toBigDecimal();
  strategy.averageApr = splitterCtr.averageApr(event.params.strategy).toBigDecimal()

  saveStrategyHistory(strategy, event.block.timestamp.toI32());
  strategy.save();
}

export function handleLoss(event: Loss): void {
  const splitter = SplitterEntity.load(event.address.toHexString()) as SplitterEntity;
  const strategy = getOrCreateStrategy(event.params.strategy.toHexString());

  const loss = formatUnits(event.params.amount, BigInt.fromI32(strategy.assetTokenDecimals));

  splitter.loss = splitter.loss.plus(loss);
  strategy.loss = strategy.loss.plus(loss);

  splitter.save();
  strategy.save();
}

export function handleInvested(event: Invested): void {
  _updateStrategyData(event.params.strategy.toHexString(), event.block.timestamp.toI32());
}

export function handleWithdrawFromStrategy(event: WithdrawFromStrategy): void {
  _updateStrategyData(event.params.strategy.toHexString(), event.block.timestamp.toI32());
}

export function handlePaused(event: Paused): void {
  const strategy = getOrCreateStrategy(event.params.strategy.toHexString());
  strategy.paused = true;
  strategy.save();
}

export function handleContinueInvesting(event: ContinueInvesting): void {
  const strategy = getOrCreateStrategy(event.params.strategy.toHexString());
  strategy.paused = false;
  strategy.save();
}

export function handleUpgraded(event: Upgraded): void {
  const splitter = SplitterEntity.load(event.address.toHexString()) as SplitterEntity;
  const implementations = splitter.implementations;
  implementations.push(event.params.implementation.toHexString())
  splitter.implementations = implementations;
  splitter.save()
}

export function handleRevisionIncreased(event: RevisionIncreased): void {
  const splitter = SplitterEntity.load(event.address.toHexString()) as SplitterEntity;
  splitter.revision = event.params.value.toI32();
  splitter.save();
}

export function handleSetStrategyCapacity(event: SetStrategyCapacity): void {
  const strategy = getOrCreateStrategy(event.params.strategy.toHexString());
  const asset = getOrCreateToken(strategy.asset);
  strategy.capacity = formatUnits(event.params.capacity, BigInt.fromI32(asset.decimals));
  strategy.save();
}


// ***************************************************
//                    HARD WORK
// ***************************************************

export function handleHardWork(event: HardWork): void {
  const splitter = SplitterEntity.load(event.address.toHexString()) as SplitterEntity;
  const strategy = getOrCreateStrategy(event.params.strategy.toHexString());
  const splitterCtr = StrategySplitterAbi.bind(event.address);
  const aprDenominator = BigDecimal.fromString('100_000');

  const earned = formatUnits(event.params.earned, BigInt.fromI32(strategy.assetTokenDecimals));
  const lost = formatUnits(event.params.lost, BigInt.fromI32(strategy.assetTokenDecimals));
  const tvl = formatUnits(event.params.tvl, BigInt.fromI32(strategy.assetTokenDecimals));
  const apr = event.params.apr.toBigDecimal().times(BigDecimal.fromString('100')).div(aprDenominator);
  const avgApr = event.params.avgApr.toBigDecimal().times(BigDecimal.fromString('100')).div(aprDenominator);

  splitter.profit = splitter.profit.plus(earned);
  splitter.loss = splitter.loss.plus(lost);

  strategy.profit = strategy.profit.plus(earned);
  strategy.loss = strategy.loss.plus(lost);
  strategy.tvl = tvl;
  strategy.apr = apr;
  strategy.averageApr = avgApr;
  const totalAssets = formatUnits(splitterCtr.totalAssets(), BigInt.fromI32(strategy.assetTokenDecimals));
  if (totalAssets.equals(ZERO_BD)) {
    strategy.tvlAllocationPercent = ZERO_BD;
  } else {
    strategy.tvlAllocationPercent = strategy.tvl.times(HUNDRED_BD).div(totalAssets);
  }

  strategy.lastHardWork = event.block.timestamp.toI32();

  saveStrategyHistory(strategy, event.block.timestamp.toI32());
  splitter.save();
  strategy.save();
}

// ***************************************************
//                    REBALANCE
// ***************************************************

export function handleRebalance(event: Rebalance): void {
  _updateStrategyData(event.params.lowStrategy.toHexString(), event.block.timestamp.toI32());
  _updateStrategyData(event.params.topStrategy.toHexString(), event.block.timestamp.toI32());
}

// ***************************************************
//                    HELPERS
// ***************************************************

function getOrCreateStrategy(address: string): StrategyEntity {
  let strategy = StrategyEntity.load(address);

  if (!strategy) {
    strategy = new StrategyEntity(address);
    const strategyCtr = StrategyAbi.bind(Address.fromString(address));
    const splitterAdr = strategyCtr.splitter();
    const splitterCtr = StrategySplitterAbi.bind(splitterAdr);
    const vaultAdr = splitterCtr.vault();
    const vaultCtr = VaultAbi.bind(vaultAdr);
    const proxy = ProxyAbi.bind(Address.fromString(address))
    const compoundDenominator = strategyCtr.COMPOUND_DENOMINATOR();
    const aprDenominator = BigDecimal.fromString('100000');

    strategy.version = strategyCtr.STRATEGY_VERSION();
    strategy.revision = strategyCtr.revision().toI32();
    strategy.createdTs = strategyCtr.created().toI32();
    strategy.createdBlock = strategyCtr.createdBlock().toI32();
    strategy.implementations = [proxy.implementation().toHexString()];
    strategy.splitter = splitterAdr.toHexString();
    strategy.asset = strategyCtr.asset().toHexString();
    strategy.assetTokenDecimals = vaultCtr.decimals();

    strategy.name = strategyCtr.NAME();
    strategy.platform = strategyCtr.PLATFORM();

    strategy.compoundRatio = strategyCtr.compoundRatio().toBigDecimal().times(BigDecimal.fromString('100')).div(compoundDenominator.toBigDecimal());
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

function _updateStrategyData(strategyAdr: string, time: i32): void {
  const strategy = getOrCreateStrategy(strategyAdr);
  updateStrategyData(
    strategy,
    time,
    changetype<StrategySplitterAbiCommon>(StrategySplitterAbi.bind(Address.fromString(strategy.splitter))),
    changetype<StrategyAbiCommon>(StrategyAbi.bind(Address.fromString(strategyAdr))),
  )
}

function getOrCreateToken(tokenAdr: string): TokenEntity {
  let token = TokenEntity.load(tokenAdr);
  if (!token) {
    token = new TokenEntity(tokenAdr);
    const tokenCtr = VaultAbi.bind(Address.fromString(tokenAdr));

    token.symbol = tokenCtr.symbol();
    token.name = tokenCtr.name();
    token.decimals = tokenCtr.decimals();
    token.usdPrice = ZERO_BD;
    token.save();
  }
  return token;
}










