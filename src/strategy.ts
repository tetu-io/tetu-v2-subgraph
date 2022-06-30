// noinspection JSUnusedGlobalSymbols

import {
  CompoundRatioChanged,
  DepositToPool,
  EmergencyExit,
  InvestAll,
  RevisionIncreased,
  StrategyAbi,
  Upgraded,
  WithdrawAllFromPool,
  WithdrawAllToSplitter,
  WithdrawFromPool,
  WithdrawToSplitter
} from "./types/templates/StrategyTemplate/StrategyAbi";
import {StrategyEntity, StrategyHistory} from "./types/schema";
import {Address, BigDecimal, BigInt} from "@graphprotocol/graph-ts";

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

function updateBalances(
  address: string,
  // @ts-ignore
  time: i32
): void {
  const strategy = StrategyEntity.load(address) as StrategyEntity;
  const strategyCtr = StrategyAbi.bind(Address.fromString(address));
  strategy.tvl = strategyCtr.totalAssets().toBigDecimal();
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

  h.save();
}
