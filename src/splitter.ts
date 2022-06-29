// noinspection JSUnusedGlobalSymbols

import {
  ContinueInvesting,
  HardWork, Invested, Loss,
  ManualAprChanged,
  Paused,
  Rebalance,
  RevisionIncreased,
  StrategyAdded,
  StrategyRemoved,
  StrategyScheduled,
  StrategySplitter,
  Upgraded
} from "./types/templates/StrategySplitter/StrategySplitter";
import {SplitterEntity, StrategyEntity, StrategyHistory} from "./types/schema";
import {Strategy as StrategyTemplate} from './types/templates'
import {Address, BigDecimal, BigInt, log} from "@graphprotocol/graph-ts";
import {Strategy} from "./types/templates/Strategy/Strategy";
import {Proxy} from "./types/templates/StrategySplitter/Proxy";
import {ADDRESS_ZERO} from "./constants";
import {WithdrawFromStrategy} from "./types/VaultFactory/StrategySplitter";

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
  const splitterCtr = StrategySplitter.bind(event.address);

  strategy.apr = event.params.newApr.toBigDecimal();
  strategy.averageApr = splitterCtr.averageApr(event.params.strategy).toBigDecimal()

  saveStrategyHistory(strategy, event.block.timestamp.toI32());
  strategy.save();
}

export function handleLoss(event: Loss): void {
  const splitter = SplitterEntity.load(event.address.toHexString()) as SplitterEntity;
  const strategy = getOrCreateStrategy(event.params.strategy.toHexString());

  splitter.loss = splitter.loss.plus(event.params.amount.toBigDecimal());
  strategy.loss = strategy.loss.plus(event.params.amount.toBigDecimal());

  splitter.save();
  strategy.save();
}

export function handleInvested(event: Invested): void {
  updateTvl(event.params.strategy.toHexString(), event.block.timestamp.toI32());
}

export function handleWithdrawFromStrategy(event: WithdrawFromStrategy): void {
  updateTvl(event.params.strategy.toHexString(), event.block.timestamp.toI32());
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


// ***************************************************
//                    HARD WORK
// ***************************************************

export function handleHardWork(event: HardWork): void {
  const splitter = SplitterEntity.load(event.address.toHexString()) as SplitterEntity;
  const strategy = getOrCreateStrategy(event.params.strategy.toHexString());

  const earned = event.params.earned.toBigDecimal();
  const lost = event.params.lost.toBigDecimal();
  const tvl = event.params.tvl.toBigDecimal();
  const apr = event.params.apr.toBigDecimal();
  const avgApr = event.params.avgApr.toBigDecimal();

  splitter.profit = splitter.profit.plus(earned);
  splitter.loss = splitter.loss.plus(lost);

  strategy.profit = strategy.profit.plus(earned);
  strategy.loss = strategy.loss.plus(lost);
  strategy.tvl = tvl;
  strategy.apr = apr;
  strategy.averageApr = avgApr;

  strategy.lastHardWork = event.block.timestamp.toI32();

  saveStrategyHistory(strategy, event.block.timestamp.toI32());
  splitter.save();
  strategy.save();
}

// ***************************************************
//                    REBALANCE
// ***************************************************

export function handleRebalance(event: Rebalance): void {
  updateTvl(event.params.lowStrategy.toHexString(), event.block.timestamp.toI32());
  updateTvl(event.params.topStrategy.toHexString(), event.block.timestamp.toI32());
}

// ***************************************************
//                    HELPERS
// ***************************************************

function getOrCreateStrategy(address: string): StrategyEntity {
  let strategy = StrategyEntity.load(address);

  if (!strategy) {
    strategy = new StrategyEntity(address);
    const strategyCtr = Strategy.bind(Address.fromString(address));
    const splitterAdr = strategyCtr.splitter();
    const splitterCtr = StrategySplitter.bind(splitterAdr);
    const proxy = Proxy.bind(Address.fromString(address))
    const compoundDenominator = strategyCtr.COMPOUND_DENOMINATOR();
    const aprDenominator = splitterCtr.APR_DENOMINATOR();

    strategy.version = strategyCtr.STRATEGY_VERSION();
    strategy.revision = strategyCtr.revision().toI32();
    strategy.createdTs = strategyCtr.created().toI32();
    strategy.createdBlock = strategyCtr.createdBlock().toI32();
    strategy.implementations = [proxy.implementation().toHexString()];
    strategy.splitter = splitterAdr.toHexString();
    strategy.asset = strategyCtr.asset().toHexString();
    strategy.compoundRatio = strategyCtr.compoundRatio().toBigDecimal().div(compoundDenominator.toBigDecimal());
    strategy.paused = splitterCtr.pausedStrategies(Address.fromString(address));
    strategy.apr = splitterCtr.strategiesAPR(Address.fromString(address)).toBigDecimal().div(aprDenominator.toBigDecimal());
    strategy.averageApr = splitterCtr.averageApr(Address.fromString(address)).toBigDecimal().div(aprDenominator.toBigDecimal());
    strategy.lastHardWork = 0;
    strategy.tvl = strategyCtr.totalAssets().toBigDecimal();
    strategy.profit = BigDecimal.fromString('0');
    strategy.loss = BigDecimal.fromString('0');

    StrategyTemplate.create(Address.fromString(address));
    strategy.save();
  }

  return strategy;
}

function saveStrategyHistory(
  strategy: StrategyEntity,
  // @ts-ignore
  time: i32
): void {
  const h = new StrategyHistory(strategy.id + '_' + BigInt.fromI32(time).toString());
  h.strategy = strategy.id;
  h.time = time;

  h.tvl = strategy.tvl;
  h.profit = strategy.profit;
  h.loss = strategy.loss;
  h.apr = strategy.apr;
  h.averageApr = strategy.averageApr;

  h.save();
}

export function updateTvl(
  strategyAdr: string,
  // @ts-ignore
  time: i32
): void {
  const strategy = getOrCreateStrategy(strategyAdr);
  const strategyCtr = Strategy.bind(Address.fromString(strategyAdr));
  strategy.tvl = strategyCtr.totalAssets().toBigDecimal();
  saveStrategyHistory(strategy, time);
  strategy.save();
}











