// noinspection JSUnusedGlobalSymbols

import {
  InsuranceEntity,
  UserCompoundProfit,
  UserEntity,
  UserVault,
  VaultApproveEntity,
  VaultEntity,
  VaultHistory
} from "./types/schema";
import {
  Approval,
  BufferChanged,
  DoHardWorkOnInvestChanged,
  FeeChanged,
  FeeTransfer,
  LossCovered,
  MaxDepositChanged,
  MaxWithdrawChanged,
  RevisionIncreased,
  SplitterChanged,
  Transfer,
  Upgraded,
  VaultAbi,
} from "./types/templates/VaultTemplate/VaultAbi";
import {Address, BigDecimal, BigInt, ByteArray, crypto, log} from "@graphprotocol/graph-ts";
import {formatUnits, parseUnits} from "./helpers";
import {createSplitter} from "./vault-factory";
import {ADDRESS_ZERO, DAY, getUSDC} from "./constants";
import {ControllerAbi} from "./types/templates/VaultTemplate/ControllerAbi";
import {LiquidatorAbi} from "./types/templates/VaultTemplate/LiquidatorAbi";

export function handleTransfer(event: Transfer): void {
  const vault = updateVaultAttributes(
    event.address.toHexString(),
    event.block.timestamp.toI32()
  );
  if (!vault) {
    return;
  }
  const vaultCtr = VaultAbi.bind(event.address);
  const decimals = BigInt.fromI32(vault.decimals);

  if (event.params.from.notEqual(Address.fromString(ADDRESS_ZERO))) {
    updateUser(
      event.address.toHexString(),
      event.params.from.toHexString(),
      decimals,
      event.block.timestamp,
      vault,
      vaultCtr,
      -1,
      formatUnits(event.params.value, decimals)
    );
  }

  if (event.params.to.notEqual(Address.fromString(ADDRESS_ZERO))) {
    updateUser(
      event.address.toHexString(),
      event.params.to.toHexString(),
      decimals,
      event.block.timestamp,
      vault,
      vaultCtr,
      1,
      formatUnits(event.params.value, decimals)
    );
  }

  vault.save();
}

function updateUser(
  vaultAdr: string,
  userAdr: string,
  decimals: BigInt,
  timestamp: BigInt,
  vault: VaultEntity,
  vaultCtr: VaultAbi,
  // @ts-ignore
  increase: i32,
  sharesTransferred: BigDecimal
): void {
  const user = getOrCreateVaultUser(vaultAdr, userAdr);
  if (user.balanceShares.le(BigDecimal.fromString('0'))) {
    vault.usersCount = vault.usersCount + increase;
  }
  const balanceShares = formatUnits(vaultCtr.balanceOf(Address.fromString(userAdr)), decimals);
  const balanceAssets = balanceShares.times(vault.sharePrice);

  //calculate profit
  const lastUpdateOld = user.lastUpdate;
  if (lastUpdateOld != 0) {
    const balanceAssetsOld = user.balanceAssets;
    const assetTransferred = sharesTransferred.times(vault.sharePrice);
    const balanceBeforeTransfer = increase > 0 ?
      balanceAssets.minus(assetTransferred)
      : balanceAssets.plus(assetTransferred);
    const profit = balanceBeforeTransfer.minus(balanceAssetsOld);

    user.compoundProfitTotal = user.compoundProfitTotal.plus(profit);


    const profitEntity = new UserCompoundProfit(crypto.keccak256(ByteArray.fromUTF8(user.id + timestamp.toHexString())).toHexString());

    // apr
    const time = timestamp.toBigDecimal().minus(BigInt.fromI32(lastUpdateOld).toBigDecimal());
    const apr = profit.div(balanceBeforeTransfer).div(time.div(DAY)).times(BigDecimal.fromString('36500'));

    profitEntity.userVault = user.id;

    profitEntity.profit = profit;
    profitEntity.time = timestamp.toI32();
    profitEntity.balanceShares = balanceShares;
    profitEntity.balanceAssets = balanceAssets;
    profitEntity.balanceAssetsUsd = balanceAssets.times(vault.assetPrice)
    profitEntity.profit = profit;
    profitEntity.apr = apr;

    user.compoundProfitTotal = user.compoundProfitTotal.plus(profit);
    user.acProfitCount = user.acProfitCount + 1;
    user.acAprSum = user.acAprSum.plus(apr);

    profitEntity.averageApr = user.acAprSum.div(BigInt.fromI32(user.acProfitCount).toBigDecimal())

    profitEntity.save();
  }


  user.balanceShares = balanceShares;
  user.balanceAssets = balanceAssets;
  user.balanceAssetsUsd = user.balanceAssets.times(vault.assetPrice);
  user.lastUpdate = timestamp.toI32()
  user.save();
}

export function handleApproval(event: Approval): void {
  const vault = VaultEntity.load(event.address.toHexString());
  if (!vault) {
    return;
  }
  const vaultCtr = VaultAbi.bind(event.address);
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
  const vault = VaultEntity.load(event.address.toHexString());
  if (!vault) {
    return;
  }

  let insurance = InsuranceEntity.load(vault.insurance);
  if (!insurance) {
    return;
  }

  insurance.balance = insurance.balance.plus(formatUnits(event.params.amount, BigInt.fromI32(vault.decimals)));
  insurance.balanceHistory = insurance.balanceHistory.plus(formatUnits(event.params.amount, BigInt.fromI32(vault.decimals)));
  insurance.save();
}

export function handleLossCovered(event: LossCovered): void {
  const vault = VaultEntity.load(event.address.toHexString());
  if (!vault) {
    return;
  }

  let insurance = InsuranceEntity.load(vault.insurance);
  if (!insurance) {
    return;
  }

  insurance.balance = insurance.balance.minus(formatUnits(event.params.amount, BigInt.fromI32(vault.decimals)));
  insurance.covered = insurance.covered.plus(formatUnits(event.params.amount, BigInt.fromI32(vault.decimals)));
  insurance.save();
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
  const vaultCtr = VaultAbi.bind(event.address)
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
  const vaultCtr = VaultAbi.bind(event.address);
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
  const vaultCtr = VaultAbi.bind(event.address);
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
  const vaultCtr = VaultAbi.bind(event.address);
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


function updateVaultAttributes(
  address: string,
  // @ts-ignore
  time: i32
): VaultEntity {
  const vault = VaultEntity.load(address);
  if (!vault) {
    log.critical("Vault not found {}", [address]);
    // critical log will stop subgraph, stub return
    return new VaultEntity(address);
  }

  const vaultCtr = VaultAbi.bind(Address.fromString(address));
  const assetCtr = VaultAbi.bind(Address.fromString(vault.asset));
  const controllerAdr = vaultCtr.controller();
  const controllerCtr = ControllerAbi.bind(controllerAdr)

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

  const history = new VaultHistory(vault.id + "_" + BigInt.fromI32(time).toString());
  history.vault = address;
  history.time = time;
  history.totalAssets = vault.totalAssets;
  history.totalAssetsUSD = vault.totalAssetsUSD;
  history.vaultAssets = vault.vaultAssets;
  history.splitterAssets = vault.splitterAssets;
  history.sharePrice = vault.sharePrice;
  history.totalSupply = vault.totalSupply;
  history.assetPrice = vault.assetPrice;
  history.usersCount = vault.usersCount;
  history.save();


  // need to save vault after the call
  return vault;
}

function getOrCreateVaultUser(
  vaultAdr: string,
  userAdr: string,
): UserVault {
  const userId = crypto.keccak256(ByteArray.fromUTF8(userAdr + "_" + vaultAdr)).toHexString();
  let vaultUser = UserVault.load(userId);
  if (!vaultUser) {
    vaultUser = new UserVault(userId);

    vaultUser.vault = vaultAdr;
    vaultUser.user = userAdr;
    vaultUser.balanceShares = BigDecimal.fromString('0');
    vaultUser.balanceAssets = BigDecimal.fromString('0');
    vaultUser.balanceAssetsUsd = BigDecimal.fromString('0');
    vaultUser.lastUpdate = 0;

    vaultUser.compoundProfitTotal = BigDecimal.fromString('0');
    vaultUser.acProfitCount = 0;
    vaultUser.acAprSum = BigDecimal.fromString('0');

    let user = UserEntity.load(userId);
    if (!user) {
      user = new UserEntity(userAdr);
      user.save();
    }

    vaultUser.save();
  }
  return vaultUser;
}

function tryGetUsdPrice(
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

