import {
  AddressAnnounceRemove,
  AddressChangeAnnounced,
  AddressChanged,
  ContractInitialized,
  Controller,
  Initialized, OperatorAdded, OperatorRemoved, ProxyAnnounceRemoved,
  ProxyUpgradeAnnounced,
  ProxyUpgraded,
  RegisterVault,
  RevisionIncreased, Upgraded,
  VaultRemoved
} from "./types/Controller/Controller";
import {
  AddressChangeAnnounceEntity,
  ControllerEntity,
  ProxyUpgradeAnnounceEntity
} from "./types/schema";
import {ADDRESS_ZERO} from "./constants";
import {BigInt, store} from "@graphprotocol/graph-ts";
import {Proxy} from "./types/Controller/Proxy";

export function handleContractInitialized(event: ContractInitialized): void {
  let controller = ControllerEntity.load(event.params.controller.toHexString())

  if (!controller) {
    const controllerCtr = Controller.bind(event.params.controller);
    const proxy = Proxy.bind(event.params.controller)
    controller = new ControllerEntity(event.params.controller.toHexString());
    controller.version = controllerCtr.CONTROLLER_VERSION();
    controller.revision = 0;
    controller.createdTs = event.params.ts.toI32();
    controller.createdBlock = event.params.block.toI32();
    controller.implementations = [proxy.implementation().toHexString()];

    controller.tetuVoter = ADDRESS_ZERO;
    controller.vaultController = ADDRESS_ZERO;
    controller.liquidator = ADDRESS_ZERO;
    controller.forwarder = ADDRESS_ZERO;
    controller.investFund = ADDRESS_ZERO;
    controller.veDistributor = ADDRESS_ZERO;
    controller.platformVoter = ADDRESS_ZERO;

    const gov = controllerCtr.governance().toHexString();
    controller.governance = gov;
    controller.vaultsCount = 0;
    controller.vaults = [];
    controller.operators = [gov];
    controller.save()
  }
}

export function handleRevisionIncreased(event: RevisionIncreased): void {
  let controller = ControllerEntity.load(event.address.toHexString())
  if (!controller) {
    return;
  }
  controller.revision = event.params.value.toI32();
  controller.save()
}

export function handleUpgraded(event: Upgraded): void {
  let controller = ControllerEntity.load(event.address.toHexString())
  if (!controller) {
    return;
  }
  controller.implementations.push(event.params.implementation.toHexString())
  controller.save()
}

export function handleAddressChangeAnnounced(event: AddressChangeAnnounced): void {
  const controllerCtr = Controller.bind(event.address);
  const id = mapAnnounceType(event.params._type)
  let announce = AddressChangeAnnounceEntity.load(id)
  if (!announce) {
    announce = new AddressChangeAnnounceEntity(id)
  }

  announce.controller = event.address.toHexString();
  announce.aType = mapAnnounceType(event.params._type);
  announce.idType = event.params._type.toI32()
  announce.newAddress = event.params.value.toHexString();
  announce.timeLockAt = event.block.timestamp.plus(controllerCtr.TIME_LOCK()).toI32()
  announce.save()

}

export function handleAddressChanged(event: AddressChanged): void {
  let controller = ControllerEntity.load(event.address.toHexString())
  if (!controller) {
    return;
  }
  const id = mapAnnounceType(event.params._type)

  store.remove('AddressChangeAnnounceEntity', id);

  if (BigInt.fromI32(1).equals(event.params._type)) controller.governance = event.params.newAddress.toHexString() // GOVERNANCE
  if (BigInt.fromI32(2).equals(event.params._type)) controller.tetuVoter = event.params.newAddress.toHexString() // TETU_VOTER
  if (BigInt.fromI32(3).equals(event.params._type)) controller.vaultController = event.params.newAddress.toHexString() // VAULT_CONTROLLER
  if (BigInt.fromI32(4).equals(event.params._type)) controller.liquidator = event.params.newAddress.toHexString() // LIQUIDATOR
  if (BigInt.fromI32(5).equals(event.params._type)) controller.forwarder = event.params.newAddress.toHexString() // FORWARDER
  if (BigInt.fromI32(6).equals(event.params._type)) controller.investFund = event.params.newAddress.toHexString() // INVEST_FUND
  if (BigInt.fromI32(7).equals(event.params._type)) controller.veDistributor = event.params.newAddress.toHexString() // VE_DIST
  if (BigInt.fromI32(8).equals(event.params._type)) controller.platformVoter = event.params.newAddress.toHexString() // PLATFORM_VOTER
  controller.save();
}

function handleAddressAnnounceRemove(event: AddressAnnounceRemove): void {
  const id = mapAnnounceType(event.params._type)
  store.remove('AddressChangeAnnounceEntity', id);
}

export function handleProxyUpgradeAnnounced(event: ProxyUpgradeAnnounced): void {
  const controllerCtr = Controller.bind(event.address);
  const id = event.params.proxy.toHexString()
  let announce = ProxyUpgradeAnnounceEntity.load(id)
  if (!announce) {
    announce = new ProxyUpgradeAnnounceEntity(id)
  }

  announce.controller = event.address.toHexString();
  announce.proxy = event.params.proxy.toHexString()
  announce.implementation = event.params.implementation.toHexString()
  announce.timeLockAt = event.block.timestamp.plus(controllerCtr.TIME_LOCK()).toI32()
  announce.save()
}

export function handleProxyUpgraded(event: ProxyUpgraded): void {
  const id = event.params.proxy.toHexString()
  store.remove('ProxyUpgradeAnnounceEntity', id);
}

function handleProxyAnnounceRemoved(event: ProxyAnnounceRemoved): void {
  const id = event.params.proxy.toHexString()
  store.remove('ProxyUpgradeAnnounceEntity', id);
}

export function handleRegisterVault(event: RegisterVault): void {
  let controller = ControllerEntity.load(event.address.toHexString())
  if (!controller) {
    return;
  }
  controller.vaultsCount = controller.vaultsCount + 1
  controller.vaults.push(event.params.vault.toHexString())
  controller.save()
}

export function handleVaultRemoved(event: VaultRemoved): void {
  let controller = ControllerEntity.load(event.address.toHexString())
  if (!controller) {
    return;
  }
  const id = controller.vaults.indexOf(event.params.vault.toHexString());
  controller.vaults[id] = controller.vaults[controller.vaults.length - 1];
  controller.vaults.pop();
  controller.vaultsCount = controller.vaultsCount - 1
  controller.save()
}

export function handleOperatorAdded(event: OperatorRemoved): void {
  let controller = ControllerEntity.load(event.address.toHexString())
  if (!controller) {
    return;
  }
  controller.operators.push(event.params.operator.toHexString());
  controller.save()
}

export function handleOperatorRemoved(event: OperatorAdded): void {
  let controller = ControllerEntity.load(event.address.toHexString())
  if (!controller) {
    return;
  }
  const id = controller.operators.indexOf(event.params.operator.toHexString());
  controller.operators[id] = controller.operators[controller.operators.length - 1];
  controller.operators.pop();
  controller.save()
}


function mapAnnounceType(idx: BigInt): string {
  if (BigInt.fromI32(0).equals(idx)) return 'UNKNOWN'
  if (BigInt.fromI32(1).equals(idx)) return 'GOVERNANCE'
  if (BigInt.fromI32(2).equals(idx)) return 'TETU_VOTER'
  if (BigInt.fromI32(3).equals(idx)) return 'VAULT_CONTROLLER'
  if (BigInt.fromI32(4).equals(idx)) return 'LIQUIDATOR'
  if (BigInt.fromI32(5).equals(idx)) return 'FORWARDER'
  if (BigInt.fromI32(6).equals(idx)) return 'INVEST_FUND'
  if (BigInt.fromI32(7).equals(idx)) return 'VE_DIST'
  if (BigInt.fromI32(8).equals(idx)) return 'PLATFORM_VOTER'
  return "ERROR"
}
