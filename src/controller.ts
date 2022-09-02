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
  BribeEntity,
  ControllerEntity,
  ForwarderEntity,
  InvestFundEntity,
  PlatformVoterEntity,
  ProxyUpgradeAnnounceEntity,
  TetuVoterEntity,
  VaultEntity,
  VeDistEntity
} from "./types/schema";
import {ADDRESS_ZERO, CONTROLLER_TIME_LOCK, RATIO_DENOMINATOR, WEEK} from "./constants";
import {Address, BigDecimal, BigInt, store} from "@graphprotocol/graph-ts";
import {ProxyAbi} from "./types/ControllerData/ProxyAbi";
import {
  ForwarderTemplate,
  InvestFundTemplate,
  PlatformVoterTemplate,
  VeDistributorTemplate
} from "./types/templates";
import {formatUnits} from "./helpers/common-helper";
import {InvestFundAbi} from "./types/ControllerData/InvestFundAbi";
import {ForwarderAbi} from "./types/ControllerData/ForwarderAbi";
import {VaultAbi} from "./types/ControllerData/VaultAbi";
import {TetuVoterAbi} from "./types/ControllerData/TetuVoterAbi";
import {VeDistributorAbi} from "./types/ControllerData/VeDistributorAbi";
import {PlatformVoterAbi} from "./types/ControllerData/PlatformVoterAbi";
import {getOrCreateTetuVoter} from "./helpers/tetu-voter-helper";
import {TetuVoterAbi as TetuVoterAbiCommon} from "./common/TetuVoterAbi";
import {ProxyAbi as ProxyAbiCommon} from "./common/ProxyAbi";
import {getOrCreateBribe} from "./helpers/bribe-helper";
import {MultiBribeAbi as MultiBribeAbiCommon} from "./common/MultiBribeAbi";
import {MultiBribeAbi} from "./types/templates/TetuVoterTemplate/MultiBribeAbi";

export function handleContractInitialized(event: ContractInitialized): void {
  const controller = new ControllerEntity(event.params.controller.toHexString());
  const controllerCtr = ControllerAbi.bind(event.params.controller);
  const proxy = ProxyAbi.bind(event.params.controller)

  controller.version = controllerCtr.CONTROLLER_VERSION();
  controller.revision = 0;
  controller.createdTs = event.params.ts.toI32();
  controller.createdBlock = event.params.block.toI32();
  controller.implementations = [proxy.implementation().toHexString()];

  controller.tetuVoter = ADDRESS_ZERO;
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
  const id = mapAnnounceType(event.params._type)
  let announce = AddressChangeAnnounceEntity.load(id)
  if (!announce) {
    announce = new AddressChangeAnnounceEntity(id)
  }

  announce.controller = event.address.toHexString();
  announce.aType = mapAnnounceType(event.params._type);
  announce.idType = event.params._type.toI32()
  announce.newAddress = event.params.value.toHexString();
  announce.timeLockAt = event.block.timestamp.plus(CONTROLLER_TIME_LOCK).toI32()
  announce.save()

}

export function handleAddressChanged(event: AddressChanged): void {
  let controller = ControllerEntity.load(event.address.toHexString())
  if (!controller) {
    return;
  }
  const id = mapAnnounceType(event.params._type)

  store.remove('AddressChangeAnnounceEntity', id);

  // *** GOVERNANCE
  if (BigInt.fromI32(1).equals(event.params._type)) controller.governance = event.params.newAddress.toHexString()

  // *** TETU_VOTER
  if (BigInt.fromI32(2).equals(event.params._type)) {
    controller.tetuVoter = event.params.newAddress.toHexString();
    _getOrCreateTetuVoter(event.params.newAddress.toHexString());
  }

  // *** PLATFORM_VOTER
  if (BigInt.fromI32(3).equals(event.params._type)) {
    controller.platformVoter = event.params.newAddress.toHexString();
    createPlatformVoter(event.params.newAddress.toHexString());
  }

  // *** LIQUIDATOR
  if (BigInt.fromI32(4).equals(event.params._type)) {
    controller.liquidator = event.params.newAddress.toHexString();
  }

  // *** FORWARDER
  if (BigInt.fromI32(5).equals(event.params._type)) {
    controller.forwarder = event.params.newAddress.toHexString();
    createForwarder(event.params.newAddress.toHexString())
  }

  // *** INVEST_FUND
  if (BigInt.fromI32(6).equals(event.params._type)) {
    controller.investFund = event.params.newAddress.toHexString();
    createInvestFund(event.params.newAddress.toHexString());
  }

  // *** VE_DIST
  if (BigInt.fromI32(7).equals(event.params._type)) {
    controller.veDistributor = event.params.newAddress.toHexString();
    createVeDist(event.params.newAddress.toHexString());
  }

  controller.save();
}

function _getOrCreateTetuVoter(voterAdr: string): TetuVoterEntity {
  const voter = getOrCreateTetuVoter(
    changetype<TetuVoterAbiCommon>(TetuVoterAbi.bind(Address.fromString(voterAdr))),
    changetype<ProxyAbiCommon>(ProxyAbi.bind(Address.fromString(voterAdr)))
  );
  _getOrCreateBribe(voter.bribe);
  return voter;
}

function _getOrCreateBribe(bribeAdr: string): BribeEntity {
  return getOrCreateBribe(
    changetype<MultiBribeAbiCommon>(MultiBribeAbi.bind(Address.fromString(bribeAdr))),
    changetype<ProxyAbiCommon>(ProxyAbi.bind(Address.fromString(bribeAdr)))
  )
}

function createPlatformVoter(address: string): void {
  let voter = PlatformVoterEntity.load(address);
  if (!voter) {
    voter = new PlatformVoterEntity(address);
    const voterCtr = PlatformVoterAbi.bind(Address.fromString(address));
    const proxy = ProxyAbi.bind(Address.fromString(address));

    voter.version = voterCtr.PLATFORM_VOTER_VERSION();
    voter.revision = voterCtr.revision().toI32();
    voter.createdTs = voterCtr.created().toI32();
    voter.createdBlock = voterCtr.createdBlock().toI32();
    voter.implementations = [proxy.implementation().toHexString()];
    voter.controller = voterCtr.controller().toHexString();
    voter.ve = voterCtr.ve().toHexString();

    PlatformVoterTemplate.create(Address.fromString(address));
    voter.save();
  }
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

function createVeDist(address: string): void {
  let veDist = VeDistEntity.load(address);
  if (!veDist) {
    veDist = new VeDistEntity(address);
    const veDistCtr = VeDistributorAbi.bind(Address.fromString(address));
    const proxy = ProxyAbi.bind(Address.fromString(address));
    const tokenAdr = veDistCtr.rewardToken();
    const tokenCtr = VaultAbi.bind(tokenAdr);
    const tokenDecimals = BigInt.fromI32(tokenCtr.decimals());

    veDist.version = veDistCtr.VE_DIST_VERSION();
    veDist.revision = veDistCtr.revision().toI32();
    veDist.createdTs = veDistCtr.created().toI32();
    veDist.createdBlock = veDistCtr.createdBlock().toI32();
    veDist.implementations = [proxy.implementation().toHexString()];
    veDist.controller = veDistCtr.controller().toHexString();

    veDist.ve = veDistCtr.ve().toHexString();
    veDist.rewardToken = tokenAdr.toHexString();
    veDist.activePeriod = veDistCtr.activePeriod().toI32();
    veDist.timeCursor = veDistCtr.timeCursor().toI32();
    veDist.tokenLastBalance = formatUnits(veDistCtr.tokenLastBalance(), tokenDecimals);
    veDist.tokenBalance = formatUnits(tokenCtr.balanceOf(Address.fromString(address)), tokenDecimals);
    veDist.lastTokenTime = veDistCtr.lastTokenTime().toI32();
    const thisWeek = BigInt.fromI32(veDist.lastTokenTime).div(BigInt.fromString(WEEK.toString())).times(BigInt.fromString(WEEK.toString()));
    veDist.tokensPerWeek = formatUnits(veDistCtr.tokensPerWeek(thisWeek), tokenDecimals);
    veDist.apr = BigDecimal.fromString('0');
    veDist.left = BigDecimal.fromString('0');

    veDist.decimals = tokenDecimals.toI32();

    VeDistributorTemplate.create(Address.fromString(address));
    veDist.save();
  }
}

function createForwarder(address: string): void {
  let forwarder = ForwarderEntity.load(address);
  if (!forwarder) {
    forwarder = new ForwarderEntity(address);
    const forwarderCtr = ForwarderAbi.bind(Address.fromString(address));
    const proxy = ProxyAbi.bind(Address.fromString(address));

    const denominator = RATIO_DENOMINATOR.toBigDecimal();

    forwarder.version = forwarderCtr.FORWARDER_VERSION();
    forwarder.revision = forwarderCtr.revision().toI32();
    forwarder.createdTs = forwarderCtr.created().toI32();
    forwarder.createdBlock = forwarderCtr.createdBlock().toI32();
    forwarder.implementations = [proxy.implementation().toHexString()];
    forwarder.tetu = forwarderCtr.tetu().toHexString();
    forwarder.tetuThreshold = formatUnits(forwarderCtr.tetuThreshold(), BigInt.fromI32(18));
    forwarder.toInvestFundRatio = forwarderCtr.toInvestFundRatio().toBigDecimal().times(BigDecimal.fromString('100')).div(denominator);
    forwarder.toGaugesRatio = forwarderCtr.toGaugesRatio().toBigDecimal().times(BigDecimal.fromString('100')).div(denominator);
    forwarder.controller = forwarderCtr.controller().toHexString();

    forwarder.toInvestFundTotal = BigDecimal.fromString('0');
    forwarder.toGaugesTotal = BigDecimal.fromString('0');
    forwarder.toVeTetuTotal = BigDecimal.fromString('0');

    ForwarderTemplate.create(Address.fromString(address));
    forwarder.save();
  }
}

export function handleAddressAnnounceRemove(event: AddressAnnounceRemove): void {
  const id = mapAnnounceType(event.params._type)
  store.remove('AddressChangeAnnounceEntity', id);
}

export function handleProxyUpgradeAnnounced(event: ProxyUpgradeAnnounced): void {
  const id = event.params.proxy.toHexString()
  let announce = ProxyUpgradeAnnounceEntity.load(id)
  if (!announce) {
    announce = new ProxyUpgradeAnnounceEntity(id)
  }

  announce.controller = event.address.toHexString();
  announce.proxy = event.params.proxy.toHexString()
  announce.implementation = event.params.implementation.toHexString()
  announce.timeLockAt = event.block.timestamp.plus(CONTROLLER_TIME_LOCK).toI32()
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
  const controller = ControllerEntity.load(event.address.toHexString()) as ControllerEntity

  const vault = VaultEntity.load(event.params.vault.toHexString());
  if (!!vault) {
    vault.isControllerWhitelisted = true
    vault.save()
  }

  controller.whitelistedVaults = controller.whitelistedVaults + 1
  controller.save()
}

export function handleVaultRemoved(event: VaultRemoved): void {
  const controller = ControllerEntity.load(event.address.toHexString()) as ControllerEntity

  const vault = VaultEntity.load(event.params.vault.toHexString());
  if (!!vault) {
    vault.isControllerWhitelisted = false
    vault.save()
  }

  controller.whitelistedVaults = controller.whitelistedVaults - 1
  controller.save()
}

export function handleOperatorAdded(event: OperatorAdded): void {
  let controller = ControllerEntity.load(event.address.toHexString())
  if (!controller) {
    return;
  }
  const operators = controller.operators;
  operators.push(event.params.operator.toHexString());
  controller.operators = operators;
  controller.save()
}

export function handleOperatorRemoved(event: OperatorRemoved): void {
  const controller = ControllerEntity.load(event.address.toHexString()) as ControllerEntity;
  const operators = controller.operators;
  let id = -1;
  for (let i = 0; i < operators.length; i++) {
    if (Address.fromString(operators[i]).equals(event.params.operator)) {
      id = i;
    }
  }
  operators[id] = controller.operators[controller.operators.length - 1];
  operators.pop();
  controller.operators = operators;
  controller.save()
}


export function mapAnnounceType(idx: BigInt): string {
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
