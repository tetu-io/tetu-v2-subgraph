// noinspection JSUnusedGlobalSymbols

import {UserEntity, UserVault, VaultApproveEntity, VaultEntity} from "./types/schema";
import {
  Approval,
  BufferChanged,
  Deposit,
  DoHardWorkOnInvestChanged,
  FeeChanged,
  FeeTransfer,
  Invest,
  LossCovered,
  MaxDepositChanged,
  MaxWithdrawChanged,
  RevisionIncreased,
  SplitterChanged,
  Transfer,
  Upgraded,
  Vault,
  Withdraw,
} from "./types/templates/Vault/Vault";
import {Address, BigDecimal, BigInt, ethereum, log} from "@graphprotocol/graph-ts";
import {formatUnits, parseUnits} from "./helpers";
import {createSplitter} from "./vault-factory";
import {ADDRESS_ZERO, USDC} from "./constants";
import {Controller} from "./types/templates/Vault/Controller";
import {Liquidator} from "./types/templates/Vault/Liquidator";

export function handleDeposit(event: Deposit): void {
  const vault = updateVaultAttributes(event.address.toHexString());

  // const vaultCtr = Vault.bind(event.address);
  // const decimals = BigInt.fromI32(vaultCtr.decimals());
  // const amount = formatUnits(event.params.shares, decimals);
  //
  // const user = getOrCreateVaultUser(userIdFrom(event), event.address.toHexString(), event.transaction.from.toHexString());
  //
  // if (user.balance.le(BigDecimal.fromString('0'))) {
  //   vault.usersCount = vault.usersCount + 1;
  // }
  // user.balance = user.balance.plus(amount);
  //
  // user.save();
  vault.save();
}


export function handleWithdraw(event: Withdraw): void {
  const vault = updateVaultAttributes(event.address.toHexString());

  // const vaultCtr = Vault.bind(event.address);
  // const decimals = BigInt.fromI32(vaultCtr.decimals());
  // const amount = formatUnits(event.params.shares, decimals);
  //
  // const user = getOrCreateVaultUser(userIdFrom(event), event.address.toHexString(), event.transaction.from.toHexString());
  //
  // user.balance = user.balance.minus(amount);
  //
  // if (user.balance.le(BigDecimal.fromString('0'))) {
  //   vault.usersCount = vault.usersCount - 1;
  // }
  //
  // user.save();
  vault.save();
}

export function handleTransfer(event: Transfer): void {
  const vault = VaultEntity.load(event.address.toHexString());
  if (!vault) {
    return;
  }
  const vaultCtr = Vault.bind(event.address);
  const decimals = BigInt.fromI32(vaultCtr.decimals());
  const amount = formatUnits(event.params.value, decimals);

  if (event.params.from.notEqual(Address.fromString(ADDRESS_ZERO))) {
    const userFrom = getOrCreateVaultUser(event.address.toHexString(), event.params.from.toHexString());
    userFrom.balance = userFrom.balance.minus(amount);
    if (userFrom.balance.le(BigDecimal.fromString('0'))) {
      vault.usersCount = vault.usersCount - 1;
    }
    userFrom.save();
  }

  if (event.params.to.notEqual(Address.fromString(ADDRESS_ZERO))) {
    const userTo = getOrCreateVaultUser(event.address.toHexString(), event.params.to.toHexString());
    if (userTo.balance.le(BigDecimal.fromString('0'))) {
      vault.usersCount = vault.usersCount + 1;
    }
    userTo.balance = userTo.balance.plus(amount);
    userTo.save();
  }

  vault.save();
}

export function handleApproval(event: Approval): void {
  const vault = VaultEntity.load(event.address.toHexString());
  if (!vault) {
    return;
  }
  const vaultCtr = Vault.bind(event.address);
  const user = getOrCreateVaultUser(event.address.toHexString(), event.params.owner.toHexString());
  const decimals = BigInt.fromI32(vaultCtr.decimals());

  const approveId = event.params.owner.toHexString() + "_" + event.params.spender.toHexString();
  let approve = VaultApproveEntity.load(approveId)
  if (!approve) {
    approve = new VaultApproveEntity(approveId);
  }
  approve.user = user.id;
  approve.amount = formatUnits(event.params.value, decimals);
  approve.spender = event.params.spender.toHexString();
  approve.save();
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
  const implementations = vault.implementations;
  implementations.push(event.params.implementation.toHexString())
  vault.implementations = implementations;
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


export function updateVaultAttributes(address: string): VaultEntity {
  const vault = VaultEntity.load(address);
  if (!vault) {
    log.critical("Vault not found {}", [address]);
    // critical log will stop subgraph, stub return
    return new VaultEntity(address);
  }

  const vaultCtr = Vault.bind(Address.fromString(address));
  const assetCtr = Vault.bind(Address.fromString(vault.asset));
  const controllerAdr = vaultCtr.controller();
  const controllerCtr = Controller.bind(controllerAdr)

  const decimals = BigInt.fromI32(vaultCtr.decimals());
  const totalAssets = formatUnits(vaultCtr.totalAssets(), decimals);

  vault.totalAssets = totalAssets
  vault.splitterAssets = formatUnits(vaultCtr.splitterAssets(), decimals)
  vault.vaultAssets = formatUnits(assetCtr.balanceOf(Address.fromString(address)), decimals)
  vault.sharePrice = formatUnits(vaultCtr.sharePrice(), decimals)
  vault.totalSupply = formatUnits(vaultCtr.totalSupply(), decimals)

  const assetPrice = tryGetUsdPrice(
    controllerCtr.liquidator().toHexString(),
    vault.asset,
    decimals
  );
  vault.assetPrice = assetPrice
  vault.totalAssetsUSD = totalAssets.times(assetPrice)
  // need to save vault after the call
  return vault;
}

export function getOrCreateVaultUser(
  vaultAdr: string,
  userAdr: string,
): UserVault {
  const userId = userAdr + "_" + vaultAdr;
  let vaultUser = UserVault.load(userId);
  if (!vaultUser) {
    vaultUser = new UserVault(userId);

    vaultUser.vault = vaultAdr;
    vaultUser.user = userAdr;
    vaultUser.balance = BigDecimal.fromString('0');

    let user = UserEntity.load(userId);
    if (!user) {
      user = new UserEntity(userAdr);
      user.save();
    }

    vaultUser.save();
  }
  return vaultUser;
}

export function tryGetUsdPrice(
  liquidatorAdr: string,
  asset: string,
  decimals: BigInt
): BigDecimal {
  // @ts-ignore
  if (asset.toLowerCase() === USDC.toLowerCase()) {
    return BigDecimal.fromString('1');
  }
  const liquidator = Liquidator.bind(Address.fromString(liquidatorAdr))
  const p = liquidator.try_getPrice(
    Address.fromString(asset),
    Address.fromString(USDC),
    parseUnits(BigDecimal.fromString('1'), decimals)
  );
  if (!p.reverted) {
    return formatUnits(p.value, decimals);
  }
  log.error("=== FAILED GET PRICE === liquidator: {} asset: {}", [liquidatorAdr, asset]);
  return BigDecimal.fromString('0')
}

