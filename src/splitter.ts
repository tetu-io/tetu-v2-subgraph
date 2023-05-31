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
import {SplitterEntity, TokenEntity} from "./types/schema";
import {Address, BigDecimal, BigInt} from "@graphprotocol/graph-ts";
import {StrategyAbi} from "./types/templates/StrategyTemplate/StrategyAbi";
import {ADDRESS_ZERO, HUNDRED_BD, RATIO_DENOMINATOR, ZERO_BD} from "./constants";
import {VaultAbi} from "./types/templates/StrategySplitterTemplate/VaultAbi";
import {formatUnits} from "./helpers/common-helper";
import {
  getOrCreateStrategy,
  saveStrategyHistory,
  updateStrategyData
} from "./helpers/strategy-helper";
import {StrategySplitterAbi as StrategySplitterAbiCommon} from "./common/StrategySplitterAbi";
import {StrategyAbi as StrategyAbiCommon} from "./common/StrategyAbi";
import {updateVaultAttributes} from "./vault";

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

  strategy.apr = event.params.newApr.toBigDecimal().times(BigDecimal.fromString('100')).div(RATIO_DENOMINATOR.toBigDecimal());
  strategy.averageApr = splitterCtr.averageApr(event.params.strategy).toBigDecimal().times(BigDecimal.fromString('100')).div(RATIO_DENOMINATOR.toBigDecimal());

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

  const ctr = StrategySplitterAbi.bind(event.address);
  const v = ctr.try_SPLITTER_VERSION();
  if (!v.reverted) {
    splitter.version = v.value;
  }

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
  const aprDenominator = RATIO_DENOMINATOR.toBigDecimal();

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

  // TRY TO UPDATE vault stats

  const vault = updateVaultAttributes(splitter.vault, event.block.timestamp.toI32());
  vault.save();
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










