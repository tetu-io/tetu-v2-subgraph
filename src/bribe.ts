// noinspection JSUnusedGlobalSymbols

import {
  BribeDeposit,
  BribeWithdraw,
  ClaimRewards, MultiBribeAbi,
  NotifyReward,
  RevisionIncreased,
  Upgraded
} from "./types/templates/MultiBribeTemplate/MultiBribeAbi";
import {
  BribeEntity,
  BribeVaultEntity,
  BribeVaultReward,
  BribeVaultRewardHistory,
  ControllerEntity,
  VaultEntity,
  VeBribe,
  VeBribeReward,
  VeBribeRewardHistory
} from "./types/schema";
import {Address, BigDecimal, BigInt} from "@graphprotocol/graph-ts";
import {ProxyAbi} from "./types/templates/MultiBribeTemplate/ProxyAbi";
import {
  calculateApr,
  generateVeBribeId,
  generateBribeVaultId,
  generateBribeVaultRewardId, generateVeBribeRewardId, formatUnits, generateVeUserId
} from "./helpers";
import {tryGetUsdPrice} from "./vault-factory";
import {ADDRESS_ZERO} from "./constants";
import {VaultAbi} from "./types/templates/MultiBribeTemplate/VaultAbi";

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
}

// ***************************************************
//                 ATTRIBUTES CHANGED
// ***************************************************

export function handleRevisionIncreased(event: RevisionIncreased): void {
  const bribe = getOrCreateBribe(event.address.toHexString());
  bribe.revision = event.params.value.toI32();
  bribe.save();
}

export function handleUpgraded(event: Upgraded): void {
  const bribe = getOrCreateBribe(event.address.toHexString());
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
  const bribe = getOrCreateBribe(bribeAdr);
  const bribeVault = getOrCreateBribeVault(vaultAdr, bribe.id);
  const vault = VaultEntity.load(bribeVault.vault) as VaultEntity;
  const controller = ControllerEntity.load(bribe.controller) as ControllerEntity;
  const assetDecimals = BigInt.fromI32(bribeVault.decimals);
  const totalSupplyChangeBD = formatUnits(totalSupplyChange, assetDecimals);

  if (totalSupplyChange.notEqual(BigInt.fromI32(0))) {
    bribeVault.totalSupply = bribeVault.totalSupply.plus(totalSupplyChangeBD);
  }

  // get asset price
  bribeVault.assetPrice = tryGetUsdPrice(controller.liquidator, vault.asset, assetDecimals);
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
      const veBribeReward = getOrCreateVeBribeReward(veBribe.id, rewardToken);
      const bribeVaultReward = getOrCreateBribeVaultReward(bribeVault.id, veBribeReward.token);
      const rewardDecimals = BigInt.fromI32(bribeVaultReward.decimals)

      const _earned = formatUnits(earned, rewardDecimals)
      const rewardTokenPrice = tryGetUsdPrice(controller.liquidator, rewardToken, rewardDecimals);
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
    const bribeVaultReward = getOrCreateBribeVaultReward(bribeVault.id, rewardToken);
    const rewardDecimals = BigInt.fromI32(bribeVaultReward.decimals)
    const rewardTokenPrice = tryGetUsdPrice(controller.liquidator, rewardToken, rewardDecimals);

    const reward = getOrCreateBribeVaultReward(bribeVault.id, rewardToken);
    updateRewardInfoAndSave(reward, bribe.id, bribeVault.vault, bribeVault.totalSupply, totalSupplyUSD, time, rewardTokenPrice);
    saveRewardHistory(reward, time, bribeVault);
  }

  bribe.save();
  bribeVault.save();
}

function getOrCreateBribe(address: string): BribeEntity {
  let bribe = BribeEntity.load(address);

  if (!bribe) {
    bribe = new BribeEntity(address);
    const bribeCtr = MultiBribeAbi.bind(Address.fromString(address));
    const proxy = ProxyAbi.bind(Address.fromString(address))

    bribe.version = bribeCtr.MULTI_BRIBE_VERSION();
    bribe.revision = bribeCtr.revision().toI32();
    bribe.createdTs = bribeCtr.created().toI32()
    bribe.createdBlock = bribeCtr.createdBlock().toI32()
    bribe.implementations = [proxy.implementation().toHexString()]

    bribe.ve = bribeCtr.ve().toHexString();
    bribe.controller = bribeCtr.controller().toHexString();

    bribe.operator = bribeCtr.operator().toHexString();
    bribe.defaultRewardToken = bribeCtr.defaultRewardToken().toHexString()

  }

  return bribe;
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
    reward.rewardTokenPrice = BigDecimal.fromString('0')
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

  reward.apr = calculateApr(BigInt.fromI32(reward.periodFinish), now, reward.rewardRate.times(totalSupply).times(rewardTokenPrice), totalSupplyUSD);
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
    user.ve = generateVeUserId(veId.toString(), veAdr);
    user.stakedBalance = BigDecimal.fromString('0')
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


