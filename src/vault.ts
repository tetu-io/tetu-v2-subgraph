import {VaultEntity} from "./types/schema";
import {
  Approval,
  BufferChanged,
  ContractInitialized,
  Deposit,
  DoHardWorkOnInvestChanged,
  FeeChanged,
  FeeTransfer,
  Init,
  Initialized,
  Invest,
  LossCovered,
  MaxDepositChanged,
  MaxWithdrawChanged,
  RevisionIncreased,
  SplitterChanged,
  Transfer,
  Upgraded,
  Withdraw
} from "./types/templates/Vault/Vault";


export function handleApproval(event: Approval): void {

}

export function handleUpgraded(event: Upgraded): void {
}

export function handleBufferChanged(event: BufferChanged): void {
}

export function handleContractInitialized(event: ContractInitialized): void {
}

export function handleDeposit(event: Deposit): void {
}

export function handleDoHardWorkOnInvestChanged(
  event: DoHardWorkOnInvestChanged
): void {
}

export function handleFeeChanged(event: FeeChanged): void {
}

export function handleFeeTransfer(event: FeeTransfer): void {
}

export function handleInit(event: Init): void {
}

export function handleInitialized(event: Initialized): void {
}

export function handleInvest(event: Invest): void {
}

export function handleLossCovered(event: LossCovered): void {
}

export function handleMaxDepositChanged(event: MaxDepositChanged): void {
}

export function handleMaxWithdrawChanged(event: MaxWithdrawChanged): void {
}

export function handleRevisionIncreased(event: RevisionIncreased): void {
}

export function handleSplitterChanged(event: SplitterChanged): void {
}

export function handleTransfer(event: Transfer): void {
}

export function handleWithdraw(event: Withdraw): void {
}


export function getOrCreateVault(address: string): VaultEntity {
  let vault = VaultEntity.load(address);
  if (!vault) {
    vault = new VaultEntity(address);
    vault.save();
  }
  return vault;
}
