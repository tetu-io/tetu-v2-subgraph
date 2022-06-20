import { BigInt } from "@graphprotocol/graph-ts"
import {
  Controller,
  AddressChangeAnnounced,
  AddressChanged,
  ContractInitialized,
  Initialized,
  ProxyUpgradeAnnounced,
  ProxyUpgraded,
  RegisterVault,
  RevisionIncreased,
  VaultRemoved
} from "../generated/Controller/Controller"
import { ExampleEntity } from "../generated/schema"

export function handleAddressChangeAnnounced(event: AddressChangeAnnounced): void {

}

export function handleAddressChanged(event: AddressChanged): void {}

export function handleContractInitialized(event: ContractInitialized): void {}

export function handleInitialized(event: Initialized): void {}

export function handleProxyUpgradeAnnounced(
  event: ProxyUpgradeAnnounced
): void {}

export function handleProxyUpgraded(event: ProxyUpgraded): void {}

export function handleRegisterVault(event: RegisterVault): void {}

export function handleRevisionIncreased(event: RevisionIncreased): void {}

export function handleVaultRemoved(event: VaultRemoved): void {}
