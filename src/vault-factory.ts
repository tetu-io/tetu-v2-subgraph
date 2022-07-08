// noinspection JSUnusedGlobalSymbols

import {
  SplitterImplChanged,
  VaultDeployed,
  VaultFactoryAbi,
  VaultImplChanged,
  VaultInsuranceImplChanged
} from "./types/VaultFactoryData/VaultFactoryAbi";
import {
  GaugeEntity,
  InsuranceEntity,
  SplitterEntity,
  VaultEntity,
  VaultFactoryEntity,
  VaultVoteEntity
} from "./types/schema";
import {Address, BigDecimal, BigInt, log} from "@graphprotocol/graph-ts";
import {formatUnits, parseUnits} from "./helpers";
import {VaultAbi} from "./types/VaultFactoryData/VaultAbi";
import {ControllerAbi} from "./types/VaultFactoryData/ControllerAbi";
import {LiquidatorAbi} from "./types/VaultFactoryData/LiquidatorAbi";
import {ProxyAbi} from "./types/VaultFactoryData/ProxyAbi";
import {MultiGaugeTemplate, StrategySplitterTemplate, VaultTemplate} from './types/templates'
import {getUSDC} from "./constants";
import {StrategySplitterAbi} from "./types/VaultFactoryData/StrategySplitterAbi";
import {MultiGaugeAbi} from "./types/VaultFactoryData/MultiGaugeAbi";

export function handleVaultDeployed(event: VaultDeployed): void {
  const factory = createOrGetFactory(event.address.toHexString())

  const vault = new VaultEntity(event.params.vaultProxy.toHexString());
  const vaultCtr = VaultAbi.bind(event.params.vaultProxy)
  const controllerAdr = vaultCtr.controller();
  const controllerCtr = ControllerAbi.bind(controllerAdr)
  const assetCtr = VaultAbi.bind(event.params.asset);

  const decimals = BigInt.fromI32(vaultCtr.decimals());

  const feeDenominator = vaultCtr.FEE_DENOMINATOR()
  const totalAssets = formatUnits(vaultCtr.totalAssets(), decimals);

  createSplitter(event.params.splitterProxy.toHexString());
  vault.splitter = event.params.splitterProxy.toHexString();
  createInsurance(
    event.params.insurance.toHexString(),
    event.params.asset.toHexString(),
    event.params.vaultProxy.toHexString()
  );
  vault.insurance = event.params.insurance.toHexString();


  vault.version = vaultCtr.VAULT_VERSION();
  vault.revision = vaultCtr.revision().toI32();
  vault.createdTs = vaultCtr.created().toI32();
  vault.createdBlock = vaultCtr.createdBlock().toI32();
  vault.implementations = [event.params.vaultLogic.toHexString()];
  vault.controller = controllerAdr.toHexString();
  vault.gauge = event.params.gauge.toHexString();
  vault.factory = event.address.toHexString();
  vault.asset = event.params.asset.toHexString();
  vault.decimals = decimals.toI32();
  vault.name = event.params.name;
  vault.symbol = event.params.symbol;
  vault.buffer = event.params.buffer.toBigDecimal().times(BigDecimal.fromString('100')).div(vaultCtr.BUFFER_DENOMINATOR().toBigDecimal());
  vault.maxWithdrawAssets = formatUnits(vaultCtr.maxWithdrawAssets(), decimals);
  vault.maxRedeemShares = formatUnits(vaultCtr.maxRedeemShares(), decimals);
  vault.maxDepositAssets = formatUnits(vaultCtr.maxDepositAssets(), decimals);
  vault.maxMintShares = formatUnits(vaultCtr.maxMintShares(), decimals);
  vault.depositFee = vaultCtr.depositFee().toBigDecimal().times(BigDecimal.fromString('100')).div(feeDenominator.toBigDecimal());
  vault.withdrawFee = vaultCtr.withdrawFee().toBigDecimal().times(BigDecimal.fromString('100')).div(feeDenominator.toBigDecimal());
  vault.doHardWorkOnInvest = vaultCtr.doHardWorkOnInvest();
  vault.totalAssets = totalAssets;
  vault.vaultAssets = formatUnits(assetCtr.balanceOf(event.params.vaultProxy), decimals);
  vault.splitterAssets = formatUnits(vaultCtr.splitterAssets(), decimals);
  vault.sharePrice = formatUnits(vaultCtr.sharePrice(), decimals);
  vault.totalSupply = formatUnits(vaultCtr.totalSupply(), decimals);
  vault.usersCount = 0;

  let vote = VaultVoteEntity.load(event.params.vaultProxy.toHexString());
  if (!vote) {
    vote = new VaultVoteEntity(event.params.vaultProxy.toHexString());
    vote.tetuVoter = controllerCtr.voter().toHexString()
    vote.vault = event.params.vaultProxy.toHexString();
    vote.votePercent = BigDecimal.fromString('0');
    vote.voteAmount = BigDecimal.fromString('0');
    vote.expectReward = BigDecimal.fromString('0');
    vote.rewardTokenPrice = BigDecimal.fromString('0');
    vote.expectApr = BigDecimal.fromString('0');
    vote.save();
  }
  vault.vote = event.params.vaultProxy.toHexString();

  const assetPrice = tryGetUsdPrice(
    controllerCtr.liquidator().toHexString(),
    event.params.asset.toHexString(),
    decimals
  );

  vault.assetPrice = assetPrice
  vault.totalAssetsUSD = totalAssets.times(assetPrice)

  vault.isControllerWhitelisted = false;
  vault.isGaugeWhitelisted = false;

  factory.vaultsCount = factory.vaultsCount + 1;

  VaultTemplate.create(event.params.vaultProxy);
  createGauge(vault.gauge);

  factory.save();
  vault.save();
}

export function handleVaultImplChanged(event: VaultImplChanged): void {
  const factory = createOrGetFactory(event.address.toHexString());
  factory.vaultImpl = event.params.value.toHexString();
  factory.save();
}

export function handleVaultInsuranceImplChanged(event: VaultInsuranceImplChanged): void {
  const factory = createOrGetFactory(event.address.toHexString());
  factory.vaultInsuranceImpl = event.params.value.toHexString();
  factory.save();
}

export function handleSplitterImplChanged(event: SplitterImplChanged): void {
  const factory = createOrGetFactory(event.address.toHexString());
  factory.splitterImpl = event.params.value.toHexString();
  factory.save();
}

export function createOrGetFactory(address: string): VaultFactoryEntity {
  let factory = VaultFactoryEntity.load(address);
  if (!factory) {
    factory = new VaultFactoryEntity(address);
    const factoryCtr = VaultFactoryAbi.bind(Address.fromString(address))
    factory.controller = factoryCtr.controller().toHexString()
    factory.vaultImpl = factoryCtr.vaultImpl().toHexString()
    factory.vaultInsuranceImpl = factoryCtr.vaultInsuranceImpl().toHexString()
    factory.splitterImpl = factoryCtr.splitterImpl().toHexString()
    factory.vaultsCount = 0;
    factory.save();
  }
  return factory;
}

export function createSplitter(address: string): SplitterEntity {
  let splitter = SplitterEntity.load(address);
  if (!splitter) {
    splitter = new SplitterEntity(address);
    const splitterCtr = StrategySplitterAbi.bind(Address.fromString(address))
    const proxy = ProxyAbi.bind(Address.fromString(address))

    splitter.version = splitterCtr.SPLITTER_VERSION()
    splitter.revision = splitterCtr.revision().toI32()
    splitter.createdTs = splitterCtr.created().toI32()
    splitter.createdBlock = splitterCtr.createdBlock().toI32()
    splitter.implementations = [proxy.implementation().toHexString()]
    splitter.vault = splitterCtr.vault().toHexString()
    splitter.asset = splitterCtr.asset().toHexString()
    splitter.scheduledStrategies = []
    splitter.profit = BigDecimal.fromString('0');
    splitter.loss = BigDecimal.fromString('0');

    StrategySplitterTemplate.create(Address.fromString(address));
    splitter.save();
  }
  return splitter;
}

export function createInsurance(
  address: string,
  asset: string,
  vault: string,
): InsuranceEntity {
  let insurance = InsuranceEntity.load(address);
  if (!insurance) {
    insurance = new InsuranceEntity(address)
    insurance.vault = vault;
    insurance.asset = asset;
    insurance.balance = BigDecimal.fromString('0');
    insurance.covered = BigDecimal.fromString('0');
    insurance.save();
  }

  return insurance;
}

function createGauge(address: string): void {
  let gauge = GaugeEntity.load(address);
  if (!gauge) {
    gauge = new GaugeEntity(address);
    const gaugeCtr = MultiGaugeAbi.bind(Address.fromString(address));
    const proxy = ProxyAbi.bind(Address.fromString(address))

    gauge.version = gaugeCtr.MULTI_GAUGE_VERSION();
    gauge.revision = gaugeCtr.revision().toI32();
    gauge.createdTs = gaugeCtr.created().toI32()
    gauge.createdBlock = gaugeCtr.createdBlock().toI32()
    gauge.implementations = [proxy.implementation().toHexString()]
    gauge.ve = gaugeCtr.ve().toHexString();
    gauge.controller = gaugeCtr.controller().toHexString();
    gauge.operator = gaugeCtr.operator().toHexString();
    gauge.defaultRewardToken = gaugeCtr.defaultRewardToken().toHexString()

    MultiGaugeTemplate.create(Address.fromString(address));
    gauge.save();
  }
}

export function tryGetUsdPrice(
  liquidatorAdr: string,
  asset: string,
  decimals: BigInt
): BigDecimal {
  if (getUSDC().equals(Address.fromString(asset))) {
    return BigDecimal.fromString('1');
  }
  const liquidator = LiquidatorAbi.bind(Address.fromString(liquidatorAdr))
  const p = liquidator.try_getPrice(
    Address.fromString(asset),
    getUSDC(),
    parseUnits(BigDecimal.fromString('1'), decimals)
  );
  if (!p.reverted) {
    return formatUnits(p.value, decimals);
  }
  log.error("=== FAILED GET PRICE === liquidator: {} asset: {}", [liquidatorAdr, asset]);
  return BigDecimal.fromString('0')
}
