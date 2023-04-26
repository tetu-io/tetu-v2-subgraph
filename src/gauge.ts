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
  UserGaugeRewardHistory,
  VaultEntity,
  VeNFTEntity
} from "./types/schema";
import {Address, BigDecimal, BigInt, ByteArray, crypto} from "@graphprotocol/graph-ts";
import {ProxyAbi} from "./types/templates/MultiGaugeTemplate/ProxyAbi";
import {calculateApr, formatUnits, tryGetUsdPrice} from "./helpers/common-helper";
import {VaultAbi} from "./types/templates/MultiGaugeTemplate/VaultAbi";
import {ControllerAbi} from "./types/templates/MultiGaugeTemplate/ControllerAbi";
import {LiquidatorAbi,} from "./types/templates/MultiGaugeTemplate/LiquidatorAbi";
import {LiquidatorAbi as LiquidatorAbiCommon} from "./common/LiquidatorAbi";
import {VaultAbi as VaultAbiCommon} from "./common/VaultAbi";
import {ADDRESS_ZERO, getPriceCalculator, ZERO_BD, ZERO_BI} from "./constants";
import {generateGaugeVaultId, generateVeNFTId} from "./helpers/id-helper";
import {getOrCreateGauge} from "./helpers/gauge-helper";
import {MultiGaugeAbi as MultiGaugeAbiCommon} from "./common/MultiGaugeAbi";
import {ProxyAbi as ProxyAbiCommon} from "./common/ProxyAbi";
import {PriceCalculatorAbi as PriceCalculatorAbiCommon} from "./common/PriceCalculatorAbi";
import {PriceCalculatorAbi} from "./types/templates/MultiGaugeTemplate/PriceCalculatorAbi";

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
    ADDRESS_ZERO,
    ZERO_BI
  );
}

// ***************************************************
//                     BOOST
// ***************************************************

export function handleVeTokenLocked(event: VeTokenLocked): void {
  const gaugeCtr = MultiGaugeAbi.bind(event.address);
  const ve = gaugeCtr.ve();
  const nftId = generateVeNFTId(event.params.tokenId.toString(), ve.toHexString());

  let veNFT = VeNFTEntity.load(nftId) as VeNFTEntity;
  veNFT.attachments = veNFT.attachments + 1;
  veNFT.save();

  const gaugeVaultId = generateGaugeVaultId(event.params.stakingToken.toHexString(), event.address.toHexString())
  const user = getOrCreateGaugeUser(gaugeVaultId, event.params.account.toHexString());
  user.veNFT = nftId;
  user.save();

  updateAll(
    event.address.toHexString(),
    event.params.stakingToken.toHexString(),
    event.params.account.toHexString(),
    event.block.timestamp,
    ADDRESS_ZERO,
    BigInt.fromI32(0)
  );
}

export function handleVeTokenUnlocked(event: VeTokenUnlocked): void {
  const gaugeCtr = MultiGaugeAbi.bind(event.address);
  const ve = gaugeCtr.ve();
  const nftId = generateVeNFTId(event.params.tokenId.toString(), ve.toHexString());
  let veNFT = VeNFTEntity.load(nftId) as VeNFTEntity;
  veNFT.attachments = veNFT.attachments - 1;
  veNFT.save();

  const gaugeVaultId = generateGaugeVaultId(event.params.stakingToken.toHexString(), event.address.toHexString())
  const user = getOrCreateGaugeUser(gaugeVaultId, event.params.account.toHexString());
  user.veNFT = null;
  user.save();

  updateAll(
    event.address.toHexString(),
    event.params.stakingToken.toHexString(),
    event.params.account.toHexString(),
    event.block.timestamp,
    ADDRESS_ZERO,
    BigInt.fromI32(0)
  );
}

// function updateDerivedSupply(gauge: Address, vault: Address): void {
//   const gaugeVault = getOrCreateGaugeVault(vault.toHexString(), gauge.toHexString());
//   const gaugeCtr = MultiGaugeAbi.bind(gauge);
//   const vaultCtr = VaultAbi.bind(Address.fromString(gaugeVault.vault));
//   gaugeVault.totalDerivedSupply = formatUnits(gaugeCtr.derivedSupply(vault), BigInt.fromI32(vaultCtr.decimals()));
//   gaugeVault.save();
// }

// ***************************************************
//                 ATTRIBUTES CHANGED
// ***************************************************


export function handleAddStakingToken(event: AddStakingToken): void {
  const gaugeVault = getOrCreateGaugeVault(event.params.token.toHexString(), event.address.toHexString());
  gaugeVault.save();

  const vault = VaultEntity.load(event.params.token.toHexString());
  if (!!vault) {
    vault.isGaugeWhitelisted = true;
    vault.save();
  }
}

export function handleRevisionIncreased(event: RevisionIncreased): void {
  const gauge = _getOrCreateGauge(event.address.toHexString());
  gauge.revision = event.params.value.toI32();
  gauge.save();
}


export function handleUpgraded(event: Upgraded): void {
  const gauge = _getOrCreateGauge(event.address.toHexString());
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
  const gauge = _getOrCreateGauge(gaugeAdr);
  const gaugeVault = getOrCreateGaugeVault(vaultAdr, gauge.id);
  const gaugeCtr = MultiGaugeAbi.bind(Address.fromString(gauge.id));
  const vaultCtr = VaultAbi.bind(Address.fromString(gaugeVault.vault));
  gaugeVault.totalSupply = formatUnits(gaugeCtr.totalSupply(Address.fromString(gaugeVault.vault)), BigInt.fromI32(vaultCtr.decimals()));
  gaugeVault.totalDerivedSupply = formatUnits(gaugeCtr.derivedSupply(Address.fromString(gaugeVault.vault)), BigInt.fromI32(vaultCtr.decimals()));


  const controllerCtr = ControllerAbi.bind(gaugeCtr.controller());
  const liquidatorAdr = controllerCtr.liquidator().toHexString();
  const asset = vaultCtr.asset();
  const assetDecimals = BigInt.fromI32(vaultCtr.decimals());
  const sharePrice = formatUnits(vaultCtr.sharePrice(), assetDecimals);

  // get asset price
  gaugeVault.assetPrice = _tryGetUsdPrice(liquidatorAdr, asset, assetDecimals);
  gaugeVault.stakingTokenPrice = gaugeVault.assetPrice.times(sharePrice)
  const totalSupplyUSD = gaugeVault.totalSupply.times(gaugeVault.stakingTokenPrice);

  // update user info if possible
  if (Address.fromString(ADDRESS_ZERO).notEqual(Address.fromString(account))) {
    // user info
    const user = getOrCreateGaugeUser(gaugeVault.id, account);
    user.stakedBalance = formatUnits(gaugeCtr.balanceOf(Address.fromString(vaultAdr), Address.fromString(account)), assetDecimals);
    user.stakedBalanceUSD = user.stakedBalance.times(gaugeVault.stakingTokenPrice);
    user.stakedDerivedBalance = formatUnits(gaugeCtr.derivedBalance(Address.fromString(vaultAdr), Address.fromString(account)), assetDecimals);

    // HANDLE CLAIM

    if (Address.fromString(ADDRESS_ZERO).notEqual(Address.fromString(rewardToken))) {
      const userReward = getOrCreateUserReward(user.id, rewardToken);

      const rewardTokenCtr = VaultAbi.bind(Address.fromString(rewardToken));
      const rewardTokenDecimals = BigInt.fromI32(rewardTokenCtr.decimals())
      const _earned = formatUnits(earned, rewardTokenDecimals)
      const periodDays = (time.toI32() - userReward.lastEarnedUpdate) / 60 / 60 / 24;
      const rewardTokenPrice = _tryGetUsdPrice(liquidatorAdr, asset, rewardTokenDecimals);
      const earnedUsd = _earned.times(rewardTokenPrice);

      if (user.stakedBalanceUSD.gt(ZERO_BD) && periodDays > 0) {
        userReward.apr = earnedUsd.div(user.stakedBalanceUSD).div(BigInt.fromI32(periodDays).toBigDecimal()).times(BigDecimal.fromString('36500'))
      } else {
        userReward.apr = ZERO_BD;
      }

      userReward.earnedTotal = userReward.earnedTotal.plus(_earned);
      userReward.earnedTotalUSD = userReward.earnedTotalUSD.plus(earnedUsd);
      userReward.lastEarnedUpdate = time.toI32();

      saveUserRewardHistory(userReward, user, _earned);

      userReward.save();
    }

    user.save();
  }

  const rewardTokensLength = gaugeCtr.rewardTokensLength(Address.fromString(vaultAdr)).toI32();
  let isDefaultTokenUpdated = false;
  for (let i = 0; i < rewardTokensLength; i++) {
    const rewardAdr = gaugeCtr.rewardTokens(Address.fromString(vaultAdr), BigInt.fromI32(i));
    if (rewardAdr.equals(Address.fromString(gauge.defaultRewardToken))) {
      isDefaultTokenUpdated = true;
    }
    updateRewardInfo(
      gaugeAdr,
      vaultAdr,
      rewardAdr,
      liquidatorAdr,
      asset,
      gaugeVault,
      totalSupplyUSD,
      time
    );
  }

  if(!isDefaultTokenUpdated) {
    updateRewardInfo(
      gaugeAdr,
      vaultAdr,
      Address.fromString(gauge.defaultRewardToken),
      liquidatorAdr,
      asset,
      gaugeVault,
      totalSupplyUSD,
      time
    );
  }

  gauge.save();
  gaugeVault.save();
}

function updateRewardInfo(
  gaugeAdr: string,
  vaultAdr: string,
  rewardAdr: Address,
  liquidatorAdr: string,
  asset: Address,
  gaugeVault: GaugeVaultEntity,
  totalSupplyUSD: BigDecimal,
  time: BigInt
): void {
  const reward = getOrCreateReward(gaugeVault.id, rewardAdr.toHexString());
  const rewardTokenCtr = VaultAbi.bind(rewardAdr);
  const rewardTokenDecimals = BigInt.fromI32(rewardTokenCtr.decimals())
  const rewardTokenPrice = _tryGetUsdPrice(liquidatorAdr, asset, rewardTokenDecimals);
  updateRewardInfoAndSave(reward, gaugeAdr, gaugeVault.vault, gaugeVault.totalSupply, totalSupplyUSD, time, rewardTokenPrice, rewardTokenDecimals);
  saveRewardHistory(reward, time, gaugeVault);
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
    vault.save();

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
    reward.left = BigDecimal.fromString('0')
    reward.leftUSD = BigDecimal.fromString('0')
    reward.periodFinish = 0;
    reward.rewardTokenPrice = BigDecimal.fromString('0');
    reward.save();
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
  rewardTokenPrice: BigDecimal,
  rewardTokenDecimals: BigInt
): void {
  const gaugeCtr = MultiGaugeAbi.bind(Address.fromString(gaugeAdr));

  reward.rewardRate = gaugeCtr.rewardRate(Address.fromString(vaultAdr), Address.fromString(reward.rewardToken)).toBigDecimal()
  reward.periodFinish = gaugeCtr.periodFinish(Address.fromString(vaultAdr), Address.fromString(reward.rewardToken)).toI32()
  reward.left = formatUnits(gaugeCtr.left(Address.fromString(vaultAdr), Address.fromString(reward.rewardToken)), rewardTokenDecimals);
  reward.leftUSD = reward.left.times(rewardTokenPrice);

  reward.apr = calculateApr(BigInt.fromI32(reward.periodFinish), now, reward.leftUSD, totalSupplyUSD);
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
    history.totalDerivedSupply = vault.totalDerivedSupply
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
    user.stakedBalanceUSD = BigDecimal.fromString('0')
    user.stakedDerivedBalance = BigDecimal.fromString('0')
    user.save();
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
    userReward.save();
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

function _getOrCreateGauge(gaugeAdr: string): GaugeEntity {
  return getOrCreateGauge(
    changetype<MultiGaugeAbiCommon>(MultiGaugeAbi.bind(Address.fromString(gaugeAdr))),
    changetype<ProxyAbiCommon>(ProxyAbi.bind(Address.fromString(gaugeAdr))),
  );
}

function _tryGetUsdPrice(
  liquidatorAdr: string,
  asset: Address,
  decimals: BigInt
): BigDecimal {
  return tryGetUsdPrice(
    changetype<LiquidatorAbiCommon>(LiquidatorAbi.bind(Address.fromString(liquidatorAdr))),
    changetype<PriceCalculatorAbiCommon>(PriceCalculatorAbi.bind(getPriceCalculator())),
    changetype<VaultAbiCommon>(VaultAbi.bind(asset)),
    decimals
  );
}
