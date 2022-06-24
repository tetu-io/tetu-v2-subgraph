import {UserVault, VaultEntity} from "./types/schema";
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
import {Vault} from "./types/VaultFactory/Vault";
import {BigInt, ethereum} from "@graphprotocol/graph-ts";
import {formatUnits} from "./helpers";
import {createSplitter} from "./vault-factory";

export function handleDeposit(event: Deposit): void {
  const vault = VaultEntity.load(event.address.toHexString());
  if (!vault) {
    return;
  }

  let user = getOrCreateVaultUser(event);

}

export function getOrCreateVaultUser(event: ethereum.Event): UserVault {
  let user = UserVault.load(userId(event));
  if (!user) {
    user = new UserVault(userId(event));
  }
  return user;
}

export function userId(event: ethereum.Event): string {
  return event.transaction.from.toHexString() + "_" + event.address.toHexString();
}

export function handleWithdraw(event: Withdraw): void {
}

export function handleTransfer(event: Transfer): void {
}

export function handleApproval(event: Approval): void {

}

export function handleFeeTransfer(event: FeeTransfer): void {
}

export function handleInvest(event: Invest): void {
}

export function handleLossCovered(event: LossCovered): void {
}

// *****************************************
//            ATTRIBUTES CHANGES
// *****************************************

export function handleUpgraded(event: Upgraded): void {
  const vault = VaultEntity.load(event.address.toHexString());
  if (!vault) {
    return;
  }
  vault.implementations.push(event.params.implementation.toHexString())
  vault.save()
}

export function handleRevisionIncreased(event: RevisionIncreased): void {
  const vault = VaultEntity.load(event.address.toHexString());
  if (!vault) {
    return;
  }
  vault.revision = event.params.value.toI32();
  vault.save();
}

export function handleBufferChanged(event: BufferChanged): void {
  const vault = VaultEntity.load(event.address.toHexString());
  if (!vault) {
    return;
  }
  const vaultCtr = Vault.bind(event.address)
  vault.buffer = event.params.newValue.toBigDecimal().div(vaultCtr.BUFFER_DENOMINATOR().toBigDecimal());
  vault.save();
}

export function handleDoHardWorkOnInvestChanged(event: DoHardWorkOnInvestChanged): void {
  const vault = VaultEntity.load(event.address.toHexString());
  if (!vault) {
    return;
  }
  vault.doHardWorkOnInvest = event.params.newValue;
  vault.save();
}

export function handleFeeChanged(event: FeeChanged): void {
  const vault = VaultEntity.load(event.address.toHexString());
  if (!vault) {
    return;
  }
  const vaultCtr = Vault.bind(event.address);
  const denominator = vaultCtr.FEE_DENOMINATOR();
  vault.depositFee = event.params.depositFee.toBigDecimal().div(denominator.toBigDecimal());
  vault.withdrawFee = event.params.withdrawFee.toBigDecimal().div(denominator.toBigDecimal());
  vault.save();
}

export function handleMaxDepositChanged(event: MaxDepositChanged): void {
  const vault = VaultEntity.load(event.address.toHexString());
  if (!vault) {
    return;
  }
  const vaultCtr = Vault.bind(event.address);
  const decimals = BigInt.fromI32(vaultCtr.decimals());
  vault.maxDepositAssets = formatUnits(event.params.maxAssets, decimals);
  vault.maxMintShares = formatUnits(event.params.maxShares, decimals);
  vault.save();
}

export function handleMaxWithdrawChanged(event: MaxWithdrawChanged): void {
  const vault = VaultEntity.load(event.address.toHexString());
  if (!vault) {
    return;
  }
  const vaultCtr = Vault.bind(event.address);
  const decimals = BigInt.fromI32(vaultCtr.decimals());
  vault.maxWithdrawAssets = formatUnits(event.params.maxAssets, decimals);
  vault.maxRedeemShares = formatUnits(event.params.maxShares, decimals);
  vault.save();
}


export function handleSplitterChanged(event: SplitterChanged): void {
  createSplitter(event.params.newValue.toHexString())
  const vault = VaultEntity.load(event.address.toHexString());
  if (!vault) {
    return;
  }
  vault.splitter = event.params.newValue.toHexString();
  vault.save();
}




