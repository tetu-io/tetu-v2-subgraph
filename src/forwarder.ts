// noinspection JSUnusedGlobalSymbols

import {
  ContractInitialized,
  Distributed,
  GaugeRatioChanged,
  Initialized,
  InvestFundRatioChanged,
  RevisionIncreased,
  SlippageChanged,
  TetuThresholdChanged
} from "./types/templates/ForwarderTemplate/ForwarderAbi";

export function handleContractInitialized(event: ContractInitialized): void {
}

export function handleDistributed(event: Distributed): void {
}

export function handleGaugeRatioChanged(event: GaugeRatioChanged): void {
}

export function handleInitialized(event: Initialized): void {
}

export function handleInvestFundRatioChanged(
  event: InvestFundRatioChanged
): void {
}

export function handleRevisionIncreased(event: RevisionIncreased): void {
}

export function handleSlippageChanged(event: SlippageChanged): void {
}

export function handleTetuThresholdChanged(event: TetuThresholdChanged): void {
}
