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
  VaultVoteEntity,
  VeTetuEntity
} from "./types/schema";
import {Address, BigDecimal, BigInt} from "@graphprotocol/graph-ts";
import {formatUnits, getOrCreateToken, tryGetUsdPrice} from "./helpers/common-helper";
import {VaultAbi} from "./types/VaultFactoryData/VaultAbi";
import {ControllerAbi} from "./types/VaultFactoryData/ControllerAbi";
import {LiquidatorAbi} from "./types/VaultFactoryData/LiquidatorAbi";
import {ProxyAbi} from "./types/VaultFactoryData/ProxyAbi";
import {StrategySplitterTemplate, VaultTemplate} from './types/templates'
import {getPriceCalculator, RATIO_DENOMINATOR, ZERO_BD} from "./constants";
import {StrategySplitterAbi} from "./types/VaultFactoryData/StrategySplitterAbi";
import {MultiGaugeAbi} from "./types/VaultFactoryData/MultiGaugeAbi";
import {VeTetuAbi} from "./types/VaultFactoryData/VeTetuAbi";
import {LiquidatorAbi as LiquidatorAbiCommon} from "./common/LiquidatorAbi";
import {VaultAbi as VaultAbiCommon} from "./common/VaultAbi";
import {ProxyAbi as ProxyAbiCommon} from "./common/ProxyAbi";
import {MultiGaugeAbi as MultiGaugeAbiCommon} from "./common/MultiGaugeAbi";
import {VeTetuAbi as VeTetuAbiCommon} from "./common/VeTetuAbi";
import {getOrCreateGauge} from "./helpers/gauge-helper";
import {getOrCreateVe} from "./helpers/ve-helper";
import {PriceCalculatorAbi as PriceCalculatorAbiCommon} from "./common/PriceCalculatorAbi";
import {PriceCalculatorAbi} from "./types/VaultFactoryData/PriceCalculatorAbi";

export function handleVaultDeployed(event: VaultDeployed): void {
  const factory = createOrGetFactory(event.address.toHexString())

  const vault = new VaultEntity(event.params.vaultProxy.toHexString());
  const vaultCtr = VaultAbi.bind(event.params.vaultProxy)
  const controllerAdr = vaultCtr.controller();
  const controllerCtr = ControllerAbi.bind(controllerAdr)

  const decimals = BigInt.fromI32(vaultCtr.decimals());

  const ratioDenominator = RATIO_DENOMINATOR

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
  vault.buffer = event.params.buffer.toBigDecimal().times(BigDecimal.fromString('100')).div(ratioDenominator.toBigDecimal());
  vault.maxWithdrawAssets = formatUnits(vaultCtr.maxWithdrawAssets(), decimals);
  vault.maxRedeemShares = formatUnits(vaultCtr.maxRedeemShares(), decimals);
  vault.maxDepositAssets = formatUnits(vaultCtr.maxDepositAssets(), decimals);
  vault.maxMintShares = formatUnits(vaultCtr.maxMintShares(), decimals);
  vault.depositFee = vaultCtr.depositFee().toBigDecimal().times(BigDecimal.fromString('100')).div(ratioDenominator.toBigDecimal());
  vault.withdrawFee = vaultCtr.withdrawFee().toBigDecimal().times(BigDecimal.fromString('100')).div(ratioDenominator.toBigDecimal());
  vault.doHardWorkOnInvest = vaultCtr.doHardWorkOnInvest();
  vault.totalAssets = ZERO_BD;
  vault.vaultAssets = ZERO_BD;
  vault.splitterAssets = ZERO_BD;
  vault.sharePrice = BigDecimal.fromString('1');
  vault.totalSupply = ZERO_BD;
  vault.usersCount = 0;

  const withdrawRequestBlocksResult = vaultCtr.try_withdrawRequestBlocks();
  if (!withdrawRequestBlocksResult.reverted) {
    vault.withdrawRequestBlocks = withdrawRequestBlocksResult.value.toI32();
  } else {
    vault.withdrawRequestBlocks = 0;
  }


  // create token entity
  const token = getOrCreateToken(changetype<VaultAbiCommon>(VaultAbi.bind(event.params.asset)));
  token.save();

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

  vault.assetPrice = _tryGetUsdPrice(
    controllerCtr.liquidator().toHexString(),
    event.params.asset.toHexString(),
    decimals
  );

  vault.totalAssetsUSD = ZERO_BD

  vault.isControllerWhitelisted = false;
  vault.isGaugeWhitelisted = false;

  factory.vaultsCount = factory.vaultsCount + 1;

  VaultTemplate.create(event.params.vaultProxy);
  const gauge = _getOrCreateGauge(vault.gauge);
  _getOrCreateVe(gauge.ve)

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
    splitter.controller = splitterCtr.controller().toHexString();

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
    insurance.balanceUsd = BigDecimal.fromString('0');
    insurance.covered = BigDecimal.fromString('0');
    insurance.save();
  }

  return insurance;
}

function _getOrCreateVe(veAdr: string): VeTetuEntity {
  return getOrCreateVe(
    changetype<VeTetuAbiCommon>(VeTetuAbi.bind(Address.fromString(veAdr))),
    changetype<ProxyAbiCommon>(ProxyAbi.bind(Address.fromString(veAdr))),
  );
}

function _getOrCreateGauge(gaugeAdr: string): GaugeEntity {
  return getOrCreateGauge(
    changetype<MultiGaugeAbiCommon>(MultiGaugeAbi.bind(Address.fromString(gaugeAdr))),
    changetype<ProxyAbiCommon>(ProxyAbi.bind(Address.fromString(gaugeAdr))),
  );
}

function _tryGetUsdPrice(
  liquidatorAdr: string,
  asset: string,
  decimals: BigInt
): BigDecimal {
  return tryGetUsdPrice(
    changetype<LiquidatorAbiCommon>(LiquidatorAbi.bind(Address.fromString(liquidatorAdr))),
    changetype<PriceCalculatorAbiCommon>(PriceCalculatorAbi.bind(getPriceCalculator())),
    changetype<VaultAbiCommon>(VaultAbi.bind(Address.fromString(asset))),
    decimals
  );
}
