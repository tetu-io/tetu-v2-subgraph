// noinspection JSUnusedGlobalSymbols

import {
  CompoundRatioChanged,
  EmergencyExit,
  RevisionIncreased,
  SentToForwarder,
  StrategyAbi,
  Upgraded,
  WithdrawAllToSplitter,
  WithdrawToSplitter
} from "./types/templates/StrategyTemplate/StrategyAbi";
import {
  ForwarderTokenInfo,
  SplitterEntity,
  StrategyEntity,
  StrategyHistory,
  VaultEntity
} from "./types/schema";
import {Address, BigDecimal, BigInt, log} from "@graphprotocol/graph-ts";
import {formatUnits} from "./helpers";
import {VaultAbi} from "./types/templates/StrategyTemplate/VaultAbi";
import {ForwarderAbi} from "./types/templates/StrategyTemplate/ForwarderAbi";
import {StrategySplitterAbi} from "./types/templates/StrategySplitterTemplate/StrategySplitterAbi";

// ***************************************************
//                 STATE CHANGES
// ***************************************************

export function handleUpgraded(event: Upgraded): void {
  const strategy = StrategyEntity.load(event.address.toHexString()) as StrategyEntity;
  const implementations = strategy.implementations;
  implementations.push(event.params.implementation.toHexString())
  strategy.implementations = implementations;
  strategy.save()
}

export function handleCompoundRatioChanged(event: CompoundRatioChanged): void {
  const strategy = StrategyEntity.load(event.address.toHexString()) as StrategyEntity;
  const strategyCtr = StrategyAbi.bind(event.address);
  const compoundDenominator = strategyCtr.COMPOUND_DENOMINATOR();
  strategy.compoundRatio = event.params.newValue.toBigDecimal().times(BigDecimal.fromString('100')).div(compoundDenominator.toBigDecimal());
  strategy.save()
}

export function handleRevisionIncreased(event: RevisionIncreased): void {
  const strategy = StrategyEntity.load(event.address.toHexString()) as StrategyEntity;
  strategy.revision = event.params.value.toI32();
  strategy.save()
}

// ***************************************************
//                    ACTIONS
// ***************************************************

export function handleEmergencyExit(event: EmergencyExit): void {
  updateBalances(event.address.toHexString(), event.block.timestamp.toI32());
}

export function handleWithdrawAllToSplitter(
  event: WithdrawAllToSplitter
): void {
  updateBalances(event.address.toHexString(), event.block.timestamp.toI32());
}

export function handleWithdrawToSplitter(event: WithdrawToSplitter): void {
  updateBalances(event.address.toHexString(), event.block.timestamp.toI32());
}

export function handleSentToForwarder(event: SentToForwarder): void {
  let info = ForwarderTokenInfo.load(event.params.token.toHexString());
  if (!info) {
    info = new ForwarderTokenInfo(event.params.token.toHexString());
    const forwarderCtr = ForwarderAbi.bind(event.params.forwarder);

    info.forwarder = event.params.forwarder.toHexString();
    info.slippage = forwarderCtr.DEFAULT_SLIPPAGE().toBigDecimal().div(BigDecimal.fromString('1000'));
    info.balance = BigDecimal.fromString('0');
  }
  const tokenCtr = VaultAbi.bind(event.params.token);
  info.balance = info.balance.plus(formatUnits(event.params.amount, BigInt.fromI32(tokenCtr.decimals())));
  info.lastUpdate = event.block.timestamp.toI32();
  info.save();
}

// ***************************************************
//                    HELPERS
// ***************************************************

function updateBalances(
  address: string,
  // @ts-ignore
  time: i32
): void {
  const strategy = StrategyEntity.load(address) as StrategyEntity;
  const strategyCtr = StrategyAbi.bind(Address.fromString(address));
  const splitterCtr = StrategySplitterAbi.bind(Address.fromString(strategy.splitter));
  strategy.tvl = formatUnits(strategyCtr.totalAssets(), BigInt.fromI32(strategy.assetDecimals));
  strategy.tvlAllocationPercent = strategy.tvl.times(BigDecimal.fromString('100'))
    .div(formatUnits(splitterCtr.totalAssets(), BigInt.fromI32(strategy.assetDecimals)));
  saveStrategyHistory(strategy, time);
  strategy.save();
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
  h.tvlAllocationPercent = strategy.tvlAllocationPercent;

  h.save();
}
