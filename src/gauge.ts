// noinspection JSUnusedGlobalSymbols

import {
  AddStakingToken,
  ClaimRewards,
  Deposit,
  MultiGaugeAbi,
  NotifyReward,
  RevisionIncreased,
  Upgraded,
  VeTokenLocked,
  VeTokenUnlocked,
  Withdraw
} from "./types/templates/MultiGaugeTemplate/MultiGaugeAbi";
import {
  GaugeEntity,
  GaugeVaultEntity,
  GaugeVaultReward,
  GaugeVaultRewardHistory,
  UserGauge,
  UserGaugeReward,
  UserGaugeRewardHistory
} from "./types/schema";
import {Address, BigDecimal, BigInt, ByteArray, crypto, log} from "@graphprotocol/graph-ts";
import {ProxyAbi} from "./types/templates/MultiGaugeTemplate/ProxyAbi";
import {
  calculateApr,
  formatUnits,
  generateGaugeVaultId,
  generateVeUserId,
  parseUnits
} from "./helpers";
import {VaultAbi} from "./types/templates/MultiGaugeTemplate/VaultAbi";
import {ControllerAbi} from "./types/templates/MultiGaugeTemplate/ControllerAbi";
import {LiquidatorAbi} from "./types/templates/MultiGaugeTemplate/LiquidatorAbi";
import {ADDRESS_ZERO, getUSDC} from "./constants";

// ***************************************************
//                     DEPOSIT/WITHDRAW
// ***************************************************

export function handleDeposit(event: Deposit): void {
  updateAll(
    event.address.toHexString(),
    event.params.stakingToken.toHexString(),
    event.params.account.toHexString(),
    event.block.timestamp,
    ADDRESS_ZERO,
    BigInt.fromI32(0)
  );
}

export function handleWithdraw(event: Withdraw): void {
  updateAll(
    event.address.toHexString(),
    event.params.stakingToken.toHexString(),
    event.params.account.toHexString(),
    event.block.timestamp,
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
    event.params.account.toHexString(),
    event.block.timestamp,
    event.params.reward.toHexString(),
    event.params.amount
  );
}

export function handleNotifyReward(event: NotifyReward): void {
  updateAll(
    event.address.toHexString(),
    event.params.token.toHexString(),
    ADDRESS_ZERO,
    event.block.timestamp,
    event.params.reward.toHexString(),
    event.params.amount
  );
}

// ***************************************************
//                     BOOST
// ***************************************************

export function handleVeTokenLocked(event: VeTokenLocked): void {
  const gaugeCtr = MultiGaugeAbi.bind(event.address);
  const ve = gaugeCtr.ve();
  const userId = generateVeUserId(event.params.tokenId.toString(), ve.toHexString());
  const gaugeVaultId = generateGaugeVaultId(event.params.stakingToken.toHexString(), event.address.toHexString())
  const user = getOrCreateGaugeUser(gaugeVaultId, event.params.account.toHexString());
  user.veUser = userId;
  user.save();
}

export function handleVeTokenUnlocked(event: VeTokenUnlocked): void {
  const gaugeVaultId = generateGaugeVaultId(event.params.stakingToken.toHexString(), event.address.toHexString())
  const user = getOrCreateGaugeUser(gaugeVaultId, event.params.account.toHexString());
  user.veUser = null;
  user.save();
}

// ***************************************************
//                 ATTRIBUTES CHANGED
// ***************************************************


export function handleAddStakingToken(event: AddStakingToken): void {
  const vault = getOrCreateGaugeVault(event.params.token.toHexString(), event.address.toHexString());
  vault.save();
}

export function handleRevisionIncreased(event: RevisionIncreased): void {
  const gauge = getOrCreateGauge(event.address.toHexString());
  gauge.revision = event.params.value.toI32();
  gauge.save();
}


export function handleUpgraded(event: Upgraded): void {
  const gauge = getOrCreateGauge(event.address.toHexString());
  const implementations = gauge.implementations;
  implementations.push(event.params.implementation.toHexString())
  gauge.implementations = implementations;
  gauge.save()
}


// ***************************************************
//                     HELPERS
// ***************************************************

function updateAll(
  gaugeAdr: string,
  vaultAdr: string,
  account: string,
  time: BigInt,
  rewardToken: string,
  earned: BigInt
): void {
  const gauge = getOrCreateGauge(gaugeAdr);
  const vault = getOrCreateGaugeVault(vaultAdr, gauge.id);
  const gaugeCtr = MultiGaugeAbi.bind(Address.fromString(gauge.id));
  const vaultCtr = VaultAbi.bind(Address.fromString(vault.vault));
  vault.totalSupply = formatUnits(gaugeCtr.totalSupply(Address.fromString(vault.vault)), BigInt.fromI32(vaultCtr.decimals()));
  vault.totalDerivedSupply = formatUnits(gaugeCtr.derivedSupply(Address.fromString(vault.vault)), BigInt.fromI32(vaultCtr.decimals()));


  const controllerCtr = ControllerAbi.bind(gaugeCtr.controller());
  const liquidatorAdr = controllerCtr.liquidator().toHexString();
  const asset = vaultCtr.asset();
  const assetDecimals = BigInt.fromI32(vaultCtr.decimals());
  const sharePrice = formatUnits(vaultCtr.sharePrice(), assetDecimals);

  // get asset price
  vault.assetPrice = tryGetUsdPrice(liquidatorAdr, asset.toHexString(), assetDecimals);
  vault.stakingTokenPrice = vault.assetPrice.times(sharePrice)
  const totalSupplyUSD = vault.totalSupply.times(vault.stakingTokenPrice);

  // update user info if possible
  if (Address.fromString(ADDRESS_ZERO).notEqual(Address.fromString(account))) {
    // user info
    const user = getOrCreateGaugeUser(vault.id, account);
    user.stakedBalance = formatUnits(gaugeCtr.balanceOf(Address.fromString(vaultAdr), Address.fromString(account)), assetDecimals);
    user.stakedBalanceUSD = user.stakedBalance.times(vault.stakingTokenPrice);
    user.stakedDerivedBalance = formatUnits(gaugeCtr.derivedBalance(Address.fromString(vaultAdr), Address.fromString(account)), assetDecimals);

    // HANDLE CLAIM

    if (Address.fromString(ADDRESS_ZERO).notEqual(Address.fromString(rewardToken))) {
      const userReward = getOrCreateUserReward(user.id, rewardToken);

      const rewardTokenCtr = VaultAbi.bind(Address.fromString(rewardToken));
      const rewardTokenDecimals = BigInt.fromI32(rewardTokenCtr.decimals())
      const _earned = formatUnits(earned, rewardTokenDecimals)
      const periodDays = (time.toI32() - userReward.lastEarnedUpdate) / 60 / 60 / 24;
      const rewardTokenPrice = tryGetUsdPrice(liquidatorAdr, rewardToken, rewardTokenDecimals);
      const earnedUsd = _earned.times(rewardTokenPrice);

      userReward.apr = earnedUsd.div(user.stakedBalanceUSD).div(BigInt.fromI32(periodDays).toBigDecimal()).times(BigDecimal.fromString('36500'))

      userReward.earnedTotal = userReward.earnedTotal.plus(_earned);
      userReward.earnedTotalUSD = userReward.earnedTotalUSD.plus(earnedUsd);
      userReward.lastEarnedUpdate = time.toI32();

      saveUserRewardHistory(userReward, user, _earned);

      userReward.save();
    }

    user.save();
  }

  const rewardTokensLength = gaugeCtr.rewardTokensLength(Address.fromString(vaultAdr)).toI32()
  for (let i = 0; i < rewardTokensLength; i++) {
    const rewardAdr = gaugeCtr.rewardTokens(Address.fromString(vaultAdr), BigInt.fromI32(i));
    const reward = getOrCreateReward(vault.id, rewardAdr.toHexString());
    const rewardTokenCtr = VaultAbi.bind(rewardAdr);
    const rewardTokenDecimals = BigInt.fromI32(rewardTokenCtr.decimals())
    const rewardTokenPrice = tryGetUsdPrice(liquidatorAdr, rewardAdr.toHexString(), rewardTokenDecimals);
    updateRewardInfoAndSave(reward, gauge.id, vault.vault, vault.totalSupply, totalSupplyUSD, time, rewardTokenPrice);
    saveRewardHistory(reward, time, vault);
  }


  gauge.save();
  vault.save();
}

function getOrCreateGauge(address: string): GaugeEntity {
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
    gauge.operator = gaugeCtr.operator().toHexString();
    gauge.defaultRewardToken = gaugeCtr.defaultRewardToken().toHexString()

  }

  return gauge;
}

function getOrCreateGaugeVault(vaultAdr: string, gaugeAdr: string): GaugeVaultEntity {
  const gaugeVaultId = generateGaugeVaultId(vaultAdr, gaugeAdr);
  let vault = GaugeVaultEntity.load(gaugeVaultId);
  if (!vault) {
    vault = new GaugeVaultEntity(gaugeVaultId);
    const vaultCtr = VaultAbi.bind(Address.fromString(vaultAdr))

    vault.gauge = gaugeAdr;
    vault.vault = vaultAdr;

    vault.asset = vaultCtr.asset().toHexString()
    vault.decimals = vaultCtr.decimals()

    vault.totalSupply = BigDecimal.fromString('0');
    vault.totalDerivedSupply = BigDecimal.fromString('0');
    vault.assetPrice = BigDecimal.fromString('0');
    vault.stakingTokenPrice = BigDecimal.fromString('0');

  }
  return vault;
}


function getOrCreateReward(gaugeVaultId: string, rewardTokenAdr: string): GaugeVaultReward {
  const rewardId = crypto.keccak256(ByteArray.fromUTF8(gaugeVaultId + rewardTokenAdr)).toHexString()
  let reward = GaugeVaultReward.load(rewardId);
  if (!reward) {
    reward = new GaugeVaultReward(rewardId);
    reward.rewardToken = rewardTokenAdr;
    reward.gaugeVault = gaugeVaultId;
    reward.apr = BigDecimal.fromString('0')
    reward.rewardRate = BigDecimal.fromString('0')
    reward.periodFinish = 0;
    reward.rewardTokenPrice = BigDecimal.fromString('0');
  }

  return reward;
}

function updateRewardInfoAndSave(
  reward: GaugeVaultReward,
  gaugeAdr: string,
  vaultAdr: string,
  totalSupply: BigDecimal,
  totalSupplyUSD: BigDecimal,
  now: BigInt,
  rewardTokenPrice: BigDecimal
): void {
  const gaugeCtr = MultiGaugeAbi.bind(Address.fromString(gaugeAdr));

  reward.rewardRate = gaugeCtr.rewardRate(Address.fromString(vaultAdr), Address.fromString(reward.rewardToken)).toBigDecimal()
  reward.periodFinish = gaugeCtr.periodFinish(Address.fromString(vaultAdr), Address.fromString(reward.rewardToken)).toI32()

  reward.apr = calculateApr(BigInt.fromI32(reward.periodFinish), now, reward.rewardRate.times(totalSupply).times(rewardTokenPrice), totalSupplyUSD);
  reward.rewardTokenPrice = rewardTokenPrice;

  reward.save();
}

function saveRewardHistory(
  reward: GaugeVaultReward,
  time: BigInt,
  vault: GaugeVaultEntity
): void {
  let history = GaugeVaultRewardHistory.load(reward.id + "_" + time.toString());
  if (!history) {
    history = new GaugeVaultRewardHistory(reward.id + "_" + time.toString());

    history.time = time.toI32();
    history.gaugeVaultReward = reward.id;
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

function getOrCreateGaugeUser(gaugeVaultId: string, userAdr: string): UserGauge {
  const userId = crypto.keccak256(ByteArray.fromUTF8(gaugeVaultId + userAdr)).toHexString()
  let user = UserGauge.load(userId);
  if (!user) {
    user = new UserGauge(userId);

    user.gaugeVault = gaugeVaultId
    user.user = userAdr
    user.stakedBalance = BigDecimal.fromString('0')
    user.stakedDerivedBalance = BigDecimal.fromString('0')
  }

  return user;
}

function getOrCreateUserReward(userId: string, rewardTokenAdr: string): UserGaugeReward {
  const userRewardId = crypto.keccak256(ByteArray.fromUTF8(userId + rewardTokenAdr)).toHexString()
  let userReward = UserGaugeReward.load(userRewardId);
  if (!userReward) {
    userReward = new UserGaugeReward(userRewardId);

    userReward.userGauge = userId;
    userReward.token = rewardTokenAdr;
    userReward.earnedTotal = BigDecimal.fromString('0');
    userReward.earnedTotalUSD = BigDecimal.fromString('0');
    userReward.apr = BigDecimal.fromString('0');
    userReward.lastEarnedUpdate = 0;
  }
  return userReward;
}

function saveUserRewardHistory(userReward: UserGaugeReward, user: UserGauge, claimed: BigDecimal): void {
  const hId = userReward.id + "_" + BigInt.fromI32(userReward.lastEarnedUpdate).toString();
  let history = UserGaugeRewardHistory.load(hId)
  if (!history) {
    history = new UserGaugeRewardHistory(hId);

    history.userGaugeReward = userReward.id;
    history.time = userReward.lastEarnedUpdate
    history.stakedBalance = user.stakedBalance
    history.stakedBalanceUSD = user.stakedBalanceUSD
    history.claimed = claimed
    history.earnedTotal = userReward.earnedTotal
    history.earnedTotalUSD = userReward.earnedTotalUSD
    history.apr = userReward.apr

    history.save();
  } else {
    // already saved in this block
    return;
  }
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
