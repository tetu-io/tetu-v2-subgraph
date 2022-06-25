// noinspection JSUnusedGlobalSymbols

import {
  Claimed,
  CompoundRatioChanged,
  ContractInitialized,
  DepositToPool,
  EmergencyExit,
  InvestAll,
  ManualClaim,
  RevisionIncreased,
  Upgraded,
  WithdrawAllFromPool,
  WithdrawAllToSplitter,
  WithdrawFromPool,
  WithdrawToSplitter
} from "./types/templates/Strategy/Strategy";


export function handleClaimed(event: Claimed): void {
}

export function handleUpgraded(event: Upgraded): void {
}

export function handleCompoundRatioChanged(event: CompoundRatioChanged): void {
}

export function handleContractInitialized(event: ContractInitialized): void {
}

export function handleDepositToPool(event: DepositToPool): void {
}

export function handleEmergencyExit(event: EmergencyExit): void {
}

export function handleInvestAll(event: InvestAll): void {
}

export function handleManualClaim(event: ManualClaim): void {
}

export function handleRevisionIncreased(event: RevisionIncreased): void {
}

export function handleWithdrawAllFromPool(event: WithdrawAllFromPool): void {
}

export function handleWithdrawAllToSplitter(
  event: WithdrawAllToSplitter
): void {
}

export function handleWithdrawFromPool(event: WithdrawFromPool): void {
}

export function handleWithdrawToSplitter(event: WithdrawToSplitter): void {
}
