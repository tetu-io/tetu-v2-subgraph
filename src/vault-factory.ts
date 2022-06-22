import {
  SplitterImplChanged,
  VaultDeployed,
  VaultFactory,
  VaultImplChanged,
  VaultInsuranceImplChanged
} from "./types/VaultFactory/VaultFactory";
import {VaultEntity, VaultFactoryEntity, VaultVoteEntity} from "./types/schema";
import {Address, BigDecimal, BigInt} from "@graphprotocol/graph-ts";
import {formatUnits, parseUnits} from "./helpers";
import {USDC} from "./constants";
import {Vault} from "./types/VaultFactory/Vault";
import {Controller} from "./types/VaultFactory/Controller";
import {Liquidator} from "./types/VaultFactory/Liquidator";

export function handleVaultDeployed(event: VaultDeployed): void {
  createOrGetFactory(event.address.toHexString())

  const vault = new VaultEntity(event.params.vaultProxy.toHexString());
  const vaultCtr = Vault.bind(event.params.vaultProxy)
  const controllerAdr = vaultCtr.controller();
  const controllerCtr = Controller.bind(controllerAdr)

  const decimals = BigInt.fromI32(vaultCtr.decimals());

  const feeDenominator = vaultCtr.FEE_DENOMINATOR()
  const totalAssets = formatUnits(vaultCtr.totalAssets(), decimals);


  vault.version = vaultCtr.VAULT_VERSION();
  vault.revision = vaultCtr.revision().toI32();
  vault.createdTs = vaultCtr.created().toI32();
  vault.createdBlock = vaultCtr.createdBlock().toI32();
  vault.implementations = [event.params.vaultLogic.toHexString()];
  vault.controller = controllerAdr.toHexString();
  vault.gauge = event.params.gauge.toHexString();
  vault.splitter = event.params.splitterProxy.toHexString();
  vault.insurance = event.params.insurance.toHexString();
  vault.factory = event.address.toHexString();
  vault.asset = event.params.asset.toHexString();
  vault.decimals = decimals.toI32();
  vault.name = event.params.name;
  vault.symbol = event.params.symbol;
  vault.buffer = event.params.buffer.toBigDecimal().div(vaultCtr.BUFFER_DENOMINATOR().toBigDecimal());
  vault.maxWithdrawAssets = formatUnits(vaultCtr.maxWithdrawAssets(), decimals);
  vault.maxRedeemShares = formatUnits(vaultCtr.maxRedeemShares(), decimals);
  vault.maxDepositAssets = formatUnits(vaultCtr.maxDepositAssets(), decimals);
  vault.maxMintShares = formatUnits(vaultCtr.maxMintShares(), decimals);
  vault.depositFee = vaultCtr.depositFee().toBigDecimal().div(feeDenominator.toBigDecimal());
  vault.withdrawFee = vaultCtr.withdrawFee().toBigDecimal().div(feeDenominator.toBigDecimal());
  vault.doHardWorkOnInvest = vaultCtr.doHardWorkOnInvest();
  vault.totalAssets = totalAssets;
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
    vote.save();
  }
  vault.vote = event.params.vaultProxy.toHexString();

  let assetPrice = BigDecimal.fromString('0');
  const liquidator = Liquidator.bind(controllerCtr.liquidator())
  if (event.params.asset.equals(Address.fromString(USDC))) {
    assetPrice = BigDecimal.fromString('1');
  } else {
    if (!!liquidator) {
      assetPrice = formatUnits(
        liquidator.getPrice(
          event.params.asset,
          Address.fromString(USDC),
          parseUnits(BigDecimal.fromString('1'), decimals)
        ),
        decimals);
    }
  }
  vault.assetPrice = assetPrice
  vault.totalAssetsUSD = totalAssets.times(assetPrice)

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
    const factoryCtr = VaultFactory.bind(Address.fromString(address))
    factory.controller = factoryCtr.controller().toHexString()
    factory.vaultImpl = factoryCtr.vaultImpl().toHexString()
    factory.vaultInsuranceImpl = factoryCtr.vaultInsuranceImpl().toHexString()
    factory.splitterImpl = factoryCtr.splitterImpl().toHexString()
    factory.save();
  }
  return factory;
}
