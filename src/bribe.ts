// noinspection JSUnusedGlobalSymbols

import {
  BribeDeposit,
  BribeWithdraw,
  ClaimRewards,
  MultiBribeAbi,
  NotifyReward,
  RevisionIncreased,
  Upgraded
} from "./types/templates/MultiBribeTemplate/MultiBribeAbi";
import {
  BribeEntity, BribeRewardNotification,
  BribeVaultEntity,
  BribeVaultReward,
  BribeVaultRewardHistory,
  ControllerEntity,
  VaultEntity,
  VeBribe,
  VeBribeReward,
  VeBribeRewardHistory
} from "./types/schema";
import {Address, BigDecimal, BigInt, ethereum} from "@graphprotocol/graph-ts";
import {ProxyAbi} from "./types/templates/MultiBribeTemplate/ProxyAbi";
import {
  calculateApr,
  formatUnits, getOrCreateToken,
  tryGetUsdPrice
} from "./helpers/common-helper";
import {ADDRESS_ZERO} from "./constants";
import {LiquidatorAbi as LiquidatorAbiCommon} from "./common/LiquidatorAbi";
import {MultiBribeAbi as MultiBribeAbiCommon} from "./common/MultiBribeAbi";
import {ProxyAbi as ProxyAbiCommon} from "./common/ProxyAbi";
import {LiquidatorAbi} from "./types/VaultFactoryData/LiquidatorAbi";
import {VaultAbi, VaultAbi as VaultAbiCommon} from "./common/VaultAbi";
import {
  generateBribeVaultId,
  generateBribeVaultRewardId,
  generateVeBribeId, generateVeBribeRewardId, generateVeNFTId
} from "./helpers/id-helper";
import {getOrCreateBribe} from "./helpers/bribe-helper";

// ***************************************************
//                     DEPOSIT/WITHDRAW
// ***************************************************

export function handleBribeDeposit(event: BribeDeposit): void {
  updateAll(
    event.address.toHexString(),
    event.params.vault.toHexString(),
    event.params.veId,
    event.block.timestamp,
    event.params.amount,
    ADDRESS_ZERO,
    BigInt.fromI32(0)
  );
}

export function handleBribeWithdraw(event: BribeWithdraw): void {
  updateAll(
    event.address.toHexString(),
    event.params.vault.toHexString(),
    event.params.veId,
    event.block.timestamp,
    event.params.amount.neg(),
    ADDRESS_ZERO,
    BigInt.fromI32(0)
  );
}

// ***************************************************
//                     REWARDS
// ***************************************************


export function handleClaimRewards(event: ClaimRewards): void {
  updateAll(
    event.address.toHexString(),
    event.params.token.toHexString(),
    BigInt.fromI32(event.params.account.toI32()),
    event.block.timestamp,
    BigInt.fromI32(0),
    event.params.reward.toHexString(),
    event.params.amount
  );
}

export function handleNotifyReward(event: NotifyReward): void {
  updateAll(
    event.address.toHexString(),
    event.params.token.toHexString(),
    BigInt.fromI32(0),
    event.block.timestamp,
    BigInt.fromI32(0),
    event.params.reward.toHexString(),
    BigInt.fromI32(0)
  );

  const bribe = _getOrCreateBribe(event.address.toHexString());
  const bribeVault = getOrCreateBribeVault(event.params.token.toHexString(), bribe.id);
  const rewardTokenEntity = getOrCreateToken(VaultAbi.bind(event.params.reward));
  const n = new BribeRewardNotification(event.transaction.hash.toHexString() + event.logIndex.toHexString());
  n.bribeVault = bribeVault.id;
  n.rewardToken = rewardTokenEntity.id;
  n.amount = formatUnits(event.params.amount, BigInt.fromI32(rewardTokenEntity.decimals));
  n.time = event.block.timestamp.toI32();
  n.tx = event.transaction.hash.toHexString();
  n.save();
}

// ***************************************************
//                 ATTRIBUTES CHANGED
// ***************************************************

export function handleRevisionIncreased(event: RevisionIncreased): void {
  const bribe = _getOrCreateBribe(event.address.toHexString());
  bribe.revision = event.params.value.toI32();
  bribe.save();
}

export function handleUpgraded(event: Upgraded): void {
  const bribe = _getOrCreateBribe(event.address.toHexString());
  const implementations = bribe.implementations;
  implementations.push(event.params.implementation.toHexString())
  bribe.implementations = implementations;
  bribe.save()
}

// ***************************************************
//                     HELPERS
// ***************************************************


function updateAll(
  bribeAdr: string,
  vaultAdr: string,
  veId: BigInt,
  time: BigInt,
  totalSupplyChange: BigInt,
  rewardToken: string,
  earned: BigInt
): void {
  const bribe = _getOrCreateBribe(bribeAdr);
  const bribeVault = getOrCreateBribeVault(vaultAdr, bribe.id);
  const vault = VaultEntity.load(bribeVault.vault) as VaultEntity;
  const controller = ControllerEntity.load(bribe.controller) as ControllerEntity;
  const assetDecimals = BigInt.fromI32(bribeVault.decimals);
  const totalSupplyChangeBD = formatUnits(totalSupplyChange, assetDecimals);

  if (totalSupplyChange.notEqual(BigInt.fromI32(0))) {
    bribeVault.totalSupply = bribeVault.totalSupply.plus(totalSupplyChangeBD);
  }

  // get asset price
  bribeVault.assetPrice = _tryGetUsdPrice(controller.liquidator, vault.asset, assetDecimals);
  bribeVault.stakingTokenPrice = bribeVault.assetPrice.times(vault.sharePrice)
  const totalSupplyUSD = bribeVault.totalSupply.times(bribeVault.stakingTokenPrice);

  // update user info if possible
  if (veId.gt(BigInt.fromI32(0))) {
    // user info
    const veBribe = getOrCreateVeBribe(bribeVault.id, veId, bribe.ve);
    veBribe.stakedBalance = veBribe.stakedBalance.plus(totalSupplyChangeBD);
    veBribe.stakedBalanceUSD = veBribe.stakedBalance.times(bribeVault.stakingTokenPrice);

    // HANDLE CLAIM

    if (Address.fromString(ADDRESS_ZERO).notEqual(Address.fromString(rewardToken))) {
      const rewardTokenEntity = getOrCreateToken(VaultAbi.bind(Address.fromString(rewardToken)));
      const veBribeReward = getOrCreateVeBribeReward(veBribe.id, rewardToken);
      const rewardDecimals = BigInt.fromI32(rewardTokenEntity.decimals)

      const _earned = formatUnits(earned, rewardDecimals)
      const rewardTokenPrice = _tryGetUsdPrice(controller.liquidator, rewardToken, rewardDecimals);
      const earnedUsd = _earned.times(rewardTokenPrice);

      veBribeReward.apr = calculateApr(BigInt.fromI32(veBribeReward.lastEarnedUpdate), time, earnedUsd, veBribe.stakedBalanceUSD)

      veBribeReward.earnedTotal = veBribeReward.earnedTotal.plus(_earned);
      veBribeReward.earnedTotalUSD = veBribeReward.earnedTotalUSD.plus(earnedUsd);
      veBribeReward.lastEarnedUpdate = time.toI32();

      // reward info
      const reward = getOrCreateBribeVaultReward(bribeVault.id, rewardToken);
      updateRewardInfoAndSave(reward, bribe.id, bribeVault.vault, bribeVault.totalSupply, totalSupplyUSD, time, rewardTokenPrice);
      saveRewardHistory(reward, time, bribeVault);

      saveVeBribeRewardHistory(veBribeReward, veBribe, _earned);
      veBribeReward.save();
    }
    veBribe.save();
  }

  // HANDLE NOTIFY
  if (veId.equals(BigInt.fromI32(0)) && Address.fromString(ADDRESS_ZERO).notEqual(Address.fromString(rewardToken))) {
    const rewardTokenEntity = getOrCreateToken(VaultAbi.bind(Address.fromString(rewardToken)));
    const rewardDecimals = BigInt.fromI32(rewardTokenEntity.decimals)
    const rewardTokenPrice = _tryGetUsdPrice(controller.liquidator, rewardToken, rewardDecimals);

    const reward = getOrCreateBribeVaultReward(bribeVault.id, rewardToken);
    updateRewardInfoAndSave(reward, bribe.id, bribeVault.vault, bribeVault.totalSupply, totalSupplyUSD, time, rewardTokenPrice);
    saveRewardHistory(reward, time, bribeVault);
  }

  bribe.save();
  bribeVault.save();
}

function getOrCreateBribeVault(vaultAdr: string, bribeAdr: string): BribeVaultEntity {
  const bribeVaultId = generateBribeVaultId(vaultAdr, bribeAdr);
  let bribeVault = BribeVaultEntity.load(bribeVaultId);
  if (!bribeVault) {
    bribeVault = new BribeVaultEntity(bribeVaultId);

    bribeVault.bribe = bribeAdr;
    bribeVault.vault = vaultAdr;
    bribeVault.totalSupply = BigDecimal.fromString('0');
    bribeVault.assetPrice = BigDecimal.fromString('0');
    bribeVault.stakingTokenPrice = BigDecimal.fromString('0');

    const vaultCtr = VaultAbi.bind(Address.fromString(bribeVault.vault));
    bribeVault.asset = vaultCtr.asset().toHexString();
    bribeVault.decimals = vaultCtr.decimals();
    bribeVault.save();
  }
  return bribeVault;
}

function getOrCreateBribeVaultReward(bribeVaultId: string, rewardTokenAdr: string): BribeVaultReward {
  const rewardId = generateBribeVaultRewardId(bribeVaultId, rewardTokenAdr);
  let reward = BribeVaultReward.load(rewardId);
  if (!reward) {
    reward = new BribeVaultReward(rewardId);
    reward.rewardToken = rewardTokenAdr;
    reward.bribeVault = bribeVaultId;

    reward.apr = BigDecimal.fromString('0')
    reward.rewardRate = BigDecimal.fromString('0')
    reward.periodFinish = 0;
    reward.left = BigDecimal.fromString('0');
    reward.rewardTokenPrice = BigDecimal.fromString('0')
    reward.save();
  }

  return reward;
}

function updateRewardInfoAndSave(
  reward: BribeVaultReward,
  bribeAdr: string,
  vaultAdr: string,
  totalSupply: BigDecimal,
  totalSupplyUSD: BigDecimal,
  now: BigInt,
  rewardTokenPrice: BigDecimal
): void {
  const bribeCtr = MultiBribeAbi.bind(Address.fromString(bribeAdr));

  reward.rewardRate = bribeCtr.rewardRate(Address.fromString(vaultAdr), Address.fromString(reward.rewardToken)).toBigDecimal()
  reward.periodFinish = bribeCtr.periodFinish(Address.fromString(vaultAdr), Address.fromString(reward.rewardToken)).toI32()
  reward.left = reward.rewardRate.times(totalSupply).times(rewardTokenPrice);

  reward.apr = calculateApr(BigInt.fromI32(reward.periodFinish), now, reward.left, totalSupplyUSD);
  reward.rewardTokenPrice = rewardTokenPrice;

  reward.save();
}

function saveRewardHistory(
  reward: BribeVaultReward,
  time: BigInt,
  vault: BribeVaultEntity
): void {
  let history = BribeVaultRewardHistory.load(reward.id + "_" + time.toString());
  if (!history) {
    history = new BribeVaultRewardHistory(reward.id + "_" + time.toString());

    history.time = time.toI32();
    history.bribeVaultReward = reward.id;
    history.totalSupply = vault.totalSupply;
    history.apr = reward.apr;
    history.rewardRate = reward.rewardRate;
    history.periodFinish = reward.periodFinish;
    history.assetPrice = vault.assetPrice;
    history.stakingTokenPrice = vault.stakingTokenPrice;
    history.rewardTokenPrice = reward.rewardTokenPrice;

    history.save();
  } else {
    // no actions if already exist
    return;
  }
}

function getOrCreateVeBribe(bribeVaultId: string, veId: BigInt, veAdr: string): VeBribe {
  const userId = generateVeBribeId(bribeVaultId, veId);
  let user = VeBribe.load(userId);
  if (!user) {
    user = new VeBribe(userId);

    user.bribeVault = bribeVaultId
    user.veNFT = generateVeNFTId(veId.toString(), veAdr);
    user.stakedBalance = BigDecimal.fromString('0')
    user.stakedBalanceUSD = BigDecimal.fromString('0')
    user.save();
  }

  return user;
}

function getOrCreateVeBribeReward(veBribeId: string, rewardTokenAdr: string): VeBribeReward {
  const veBribeRewardId = generateVeBribeRewardId(veBribeId, rewardTokenAdr);
  let veBribeReward = VeBribeReward.load(veBribeRewardId);
  if (!veBribeReward) {
    veBribeReward = new VeBribeReward(veBribeRewardId);

    veBribeReward.veBribe = veBribeId;
    veBribeReward.token = rewardTokenAdr;
    veBribeReward.earnedTotal = BigDecimal.fromString('0');
    veBribeReward.earnedTotalUSD = BigDecimal.fromString('0');
    veBribeReward.apr = BigDecimal.fromString('0');
    veBribeReward.lastEarnedUpdate = 0;
    veBribeReward.save();
  }
  return veBribeReward;
}

function saveVeBribeRewardHistory(veBribeReward: VeBribeReward, user: VeBribe, claimed: BigDecimal): void {
  const hId = veBribeReward.id + "_" + BigInt.fromI32(veBribeReward.lastEarnedUpdate).toString();
  let history = VeBribeRewardHistory.load(hId)
  if (!history) {
    history = new VeBribeRewardHistory(hId);

    history.veBribeReward = veBribeReward.id;
    history.time = veBribeReward.lastEarnedUpdate
    history.stakedBalance = user.stakedBalance
    history.stakedBalanceUSD = user.stakedBalanceUSD
    history.claimed = claimed
    history.earnedTotal = veBribeReward.earnedTotal
    history.earnedTotalUSD = veBribeReward.earnedTotalUSD
    history.apr = veBribeReward.apr

    history.save();
  } else {
    // already saved in this block
    return;
  }
}

function _getOrCreateBribe(bribeAdr: string): BribeEntity {
  return getOrCreateBribe(
    changetype<MultiBribeAbiCommon>(MultiBribeAbi.bind(Address.fromString(bribeAdr))),
    changetype<ProxyAbiCommon>(ProxyAbi.bind(Address.fromString(bribeAdr)))
  )
}

function _tryGetUsdPrice(
  liquidatorAdr: string,
  asset: string,
  decimals: BigInt
): BigDecimal {
  return tryGetUsdPrice(
    changetype<LiquidatorAbiCommon>(LiquidatorAbi.bind(Address.fromString(liquidatorAdr))),
    changetype<VaultAbiCommon>(VaultAbi.bind(Address.fromString(asset))),
    decimals
  );
}
