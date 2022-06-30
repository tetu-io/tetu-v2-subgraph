// noinspection JSUnusedGlobalSymbols

import {
  AddressAnnounceRemove,
  AddressChangeAnnounced,
  AddressChanged,
  ContractInitialized,
  ControllerAbi,
  OperatorAdded,
  OperatorRemoved,
  ProxyAnnounceRemoved,
  ProxyUpgradeAnnounced,
  ProxyUpgraded,
  RegisterVault,
  RevisionIncreased,
  Upgraded,
  VaultRemoved
} from "./types/ControllerData/ControllerAbi";
import {
  AddressChangeAnnounceEntity,
  ControllerEntity,
  ForwarderEntity,
  InvestFundEntity,
  ProxyUpgradeAnnounceEntity,
  VaultEntity
} from "./types/schema";
import {ADDRESS_ZERO} from "./constants";
import {Address, BigInt, store} from "@graphprotocol/graph-ts";
import {ProxyAbi} from "./types/ControllerData/ProxyAbi";
import {ForwarderTemplate, InvestFundTemplate} from "./types/templates";
import {formatUnits} from "./helpers";
import {InvestFundAbi} from "./types/ControllerData/InvestFundAbi";
import {ForwarderAbi} from "./types/ControllerData/ForwarderAbi";

export function handleContractInitialized(event: ContractInitialized): void {
  let controller = ControllerEntity.load(event.params.controller.toHexString())

  if (!controller) {
    const controllerCtr = ControllerAbi.bind(event.params.controller);
    const proxy = ProxyAbi.bind(event.params.controller)
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
    controller.whitelistedVaults = 0;
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
  const implementations = controller.implementations;
  implementations.push(event.params.implementation.toHexString())
  controller.implementations = implementations;
  controller.save()
}

export function handleAddressChangeAnnounced(event: AddressChangeAnnounced): void {
  const controllerCtr = ControllerAbi.bind(event.address);
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
  // FORWARDER
  if (BigInt.fromI32(5).equals(event.params._type)) {
    controller.forwarder = event.params.newAddress.toHexString();
    createForwarder(event.params.newAddress.toHexString())

  }
  // INVEST_FUND
  if (BigInt.fromI32(6).equals(event.params._type)) {
    controller.investFund = event.params.newAddress.toHexString();
    createInvestFund(event.params.newAddress.toHexString());
  }
  if (BigInt.fromI32(7).equals(event.params._type)) controller.veDistributor = event.params.newAddress.toHexString() // VE_DIST
  if (BigInt.fromI32(8).equals(event.params._type)) controller.platformVoter = event.params.newAddress.toHexString() // PLATFORM_VOTER
  controller.save();
}

function createInvestFund(address: string): void {
  let fund = InvestFundEntity.load(address);
  if (!fund) {
    fund = new InvestFundEntity(address);
    const fundCtr = InvestFundAbi.bind(Address.fromString(address));
    const proxy = ProxyAbi.bind(Address.fromString(address));

    fund.version = fundCtr.INVEST_FUND_VERSION();
    fund.revision = fundCtr.revision().toI32();
    fund.createdTs = fundCtr.created().toI32();
    fund.createdBlock = fundCtr.createdBlock().toI32();
    fund.implementations = [proxy.implementation().toHexString()];
    fund.controller = fundCtr.controller().toHexString();

    InvestFundTemplate.create(Address.fromString(address));
    fund.save();
  }
}

function createForwarder(address: string): void {
  let forwarder = ForwarderEntity.load(address);
  if (!forwarder) {
    forwarder = new ForwarderEntity(address);
    const forwarderCtr = ForwarderAbi.bind(Address.fromString(address));
    const proxy = ProxyAbi.bind(Address.fromString(address));

    const denominator = forwarderCtr.RATIO_DENOMINATOR().toBigDecimal();

    forwarder.version = forwarderCtr.FORWARDER_VERSION();
    forwarder.revision = forwarderCtr.revision().toI32();
    forwarder.createdTs = forwarderCtr.created().toI32();
    forwarder.createdBlock = forwarderCtr.createdBlock().toI32();
    forwarder.implementations = [proxy.implementation().toHexString()];
    forwarder.tetu = forwarderCtr.tetu().toHexString();
    forwarder.tetuThreshold = formatUnits(forwarderCtr.tetuThreshold(), BigInt.fromI32(18));
    forwarder.toInvestFundRatio = forwarderCtr.toInvestFundRatio().toBigDecimal().div(denominator);
    forwarder.toGaugesRatio = forwarderCtr.toGaugesRatio().toBigDecimal().div(denominator);
    forwarder.controller = forwarderCtr.controller().toHexString();

    ForwarderTemplate.create(Address.fromString(address));
    forwarder.save();
  }
}

export function handleAddressAnnounceRemove(event: AddressAnnounceRemove): void {
  const id = mapAnnounceType(event.params._type)
  store.remove('AddressChangeAnnounceEntity', id);
}

export function handleProxyUpgradeAnnounced(event: ProxyUpgradeAnnounced): void {
  const controllerCtr = ControllerAbi.bind(event.address);
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

export function handleProxyAnnounceRemoved(event: ProxyAnnounceRemoved): void {
  const id = event.params.proxy.toHexString()
  store.remove('ProxyUpgradeAnnounceEntity', id);
}

export function handleRegisterVault(event: RegisterVault): void {
  let controller = ControllerEntity.load(event.address.toHexString())
  if (!controller) {
    return;
  }

  const vault = VaultEntity.load(event.params.vault.toHexString());
  if (!!vault) {
    vault.isControllerWhitelisted = true
    vault.save()
  }

  controller.whitelistedVaults = controller.whitelistedVaults + 1
  controller.save()
}

export function handleVaultRemoved(event: VaultRemoved): void {
  const controller = ControllerEntity.load(event.address.toHexString())
  if (!controller) {
    return;
  }

  const vault = VaultEntity.load(event.params.vault.toHexString());
  if (!!vault) {
    vault.isControllerWhitelisted = false
    vault.save()
  }

  controller.whitelistedVaults = controller.whitelistedVaults - 1
  controller.save()
}

export function handleOperatorAdded(event: OperatorRemoved): void {
  let controller = ControllerEntity.load(event.address.toHexString())
  if (!controller) {
    return;
  }
  const operators = controller.operators;
  operators.push(event.params.operator.toHexString());
  controller.operators = operators;
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
