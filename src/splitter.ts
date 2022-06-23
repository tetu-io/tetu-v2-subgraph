import {
  ContinueInvesting,
  ContractInitialized,
  HardWork,
  ManualAprChanged,
  Paused,
  Rebalance,
  RevisionIncreased,
  StrategyAdded, StrategyRatioChanged, StrategyRemoved, StrategyScheduled, StrategySplitter,
  Upgraded
} from "./types/templates/StrategySplitter/StrategySplitter";
import {SplitterEntity} from "./types/schema";
import {Address} from "@graphprotocol/graph-ts";
import {USDC} from "./constants";


export function handleContinueInvesting(event: ContinueInvesting): void {
}

export function handleUpgraded(event: Upgraded): void {
}

export function handleContractInitialized(event: ContractInitialized): void {
}

export function handleHardWork(event: HardWork): void {
}

export function handleManualAprChanged(event: ManualAprChanged): void {
}

export function handlePaused(event: Paused): void {
}

export function handleRebalance(event: Rebalance): void {
}

export function handleRevisionIncreased(event: RevisionIncreased): void {
}

export function handleStrategyAdded(event: StrategyAdded): void {
}

export function handleStrategyRatioChanged(event: StrategyRatioChanged): void {
}

export function handleStrategyRemoved(event: StrategyRemoved): void {
}

export function handleStrategyScheduled(event: StrategyScheduled): void {
}



