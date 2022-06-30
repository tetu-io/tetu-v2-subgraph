// noinspection JSUnusedGlobalSymbols

import {
  Abstained,
  Attach,
  ContractInitialized,
  Deposit,
  Detach,
  DistributeReward,
  GaugeCreated,
  Initialized,
  NotifyReward,
  RevisionIncreased,
  Voted,
  Whitelisted,
  Withdraw
} from "./types/templates/TetuVoterTemplate/TetuVoterAbi";

export function handleAbstained(event: Abstained): void {
}

export function handleAttach(event: Attach): void {
}

export function handleContractInitialized(event: ContractInitialized): void {
}

export function handleDeposit(event: Deposit): void {
}

export function handleDetach(event: Detach): void {
}

export function handleDistributeReward(event: DistributeReward): void {
}

export function handleGaugeCreated(event: GaugeCreated): void {
}

export function handleInitialized(event: Initialized): void {
}

export function handleNotifyReward(event: NotifyReward): void {
}

export function handleRevisionIncreased(event: RevisionIncreased): void {
}

export function handleVoted(event: Voted): void {
}

export function handleWhitelisted(event: Whitelisted): void {
}

export function handleWithdraw(event: Withdraw): void {
}

// export function loadTetuVoter(address: string): TetuVoterEntity {
//
//   const voter = TetuVoterEntity.load(address);
//
//   return voter;
// }

