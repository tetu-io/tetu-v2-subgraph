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
import {ForwarderTokenInfo, StrategyEntity} from "./types/schema";
import {Address, BigDecimal, BigInt} from "@graphprotocol/graph-ts";
import {formatUnits} from "./helpers/common-helper";
import {VaultAbi} from "./types/templates/StrategyTemplate/VaultAbi";
import {ForwarderAbi} from "./types/templates/StrategyTemplate/ForwarderAbi";
import {StrategySplitterAbi} from "./types/templates/StrategySplitterTemplate/StrategySplitterAbi";
import {updateStrategyData} from "./helpers/strategy-helper";
import {StrategySplitterAbi as StrategySplitterAbiCommon} from "./common/StrategySplitterAbi";
import {StrategyAbi as StrategyAbiCommon} from "./common/StrategyAbi";

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
  _updateStrategyData(event.address.toHexString(), event.block.timestamp.toI32());
}

export function handleWithdrawAllToSplitter(
  event: WithdrawAllToSplitter
): void {
  _updateStrategyData(event.address.toHexString(), event.block.timestamp.toI32());
}

export function handleWithdrawToSplitter(event: WithdrawToSplitter): void {
  _updateStrategyData(event.address.toHexString(), event.block.timestamp.toI32());
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

function _updateStrategyData(strategyAdr: string, time: i32): void {
  const strategy = StrategyEntity.load(strategyAdr) as StrategyEntity;
  updateStrategyData(
    strategy,
    time,
    changetype<StrategySplitterAbiCommon>(StrategySplitterAbi.bind(Address.fromString(strategy.splitter))),
    changetype<StrategyAbiCommon>(StrategyAbi.bind(Address.fromString(strategyAdr))),
  )
}
