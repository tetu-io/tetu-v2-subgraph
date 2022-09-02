// noinspection JSUnusedGlobalSymbols

import {
  Abstained,
  DistributeReward,
  NotifyReward,
  RevisionIncreased,
  Upgraded,
  Voted
} from "./types/templates/TetuVoterTemplate/TetuVoterAbi";
import {
  BribeEntity,
  ControllerEntity,
  GaugeVaultEntity,
  TetuVoterEntity,
  TetuVoterRewardHistory,
  TetuVoterUser,
  TetuVoterUserVote,
  TetuVoterUserVoteHistory,
  VaultVoteEntity
} from "./types/schema";
import {TetuVoterAbi} from "./types/ControllerData/TetuVoterAbi";
import {Address, BigDecimal, BigInt, store} from "@graphprotocol/graph-ts";
import {ProxyAbi} from "./types/ControllerData/ProxyAbi";
import {VaultAbi} from "./types/ControllerData/VaultAbi";
import {
  calculateApr,
  formatUnits,
  tryGetUsdPrice
} from "./helpers/common-helper";
import {REWARD_TOKEN_DECIMALS} from "./constants";
import {VeTetuAbi} from "./types/templates/VeTetuTemplate/VeTetuAbi";
import {MultiBribeTemplate} from "./types/templates";
import {MultiBribeAbi} from "./types/templates/TetuVoterTemplate/MultiBribeAbi";
import {LiquidatorAbi} from "./types/templates/TetuVoterTemplate/LiquidatorAbi";
import {LiquidatorAbi as LiquidatorAbiCommon} from "./common/LiquidatorAbi";
import {TetuVoterAbi as TetuVoterAbiCommon} from "./common/TetuVoterAbi";
import {VaultAbi as VaultAbiCommon} from "./common/VaultAbi";
import {
  generateGaugeVaultId,
  generateTetuVoterUserId,
  generateTetuVoterUserVoteId, generateVaultVoteEntityId,
  generateVeNFTId
} from "./helpers/id-helper";
import {getOrCreateBribe} from "./helpers/bribe-helper";
import {MultiBribeAbi as MultiBribeAbiCommon} from "./common/MultiBribeAbi";
import {ProxyAbi as ProxyAbiCommon} from "./common/ProxyAbi";
import {getOrCreateTetuVoter} from "./helpers/tetu-voter-helper";

// ***************************************************
//                ATTACH/DETACH/VOTE
// ***************************************************

export function handleVoted(event: Voted): void {
  const voter = _getOrCreateTetuVoter(event.address.toHexString());
  const voterUser = getOrCreateTetuVoterUser(event.params.tokenId, voter.id, voter.ve);
  const vaultVote = getOrCreateVaultVoteEntity(voter, event.params.vault.toHexString());
  const userVote = getOrCreateTetuVoterUserVote(voterUser, vaultVote);

  updateTetuVoter(voter, BigInt.fromI32(1));

  // update user info
  // assume constant 7 day time-lock
  voterUser.voteTimeLockEnd = event.block.timestamp.toI32() + 60 * 60 * 24 * 7;
  voterUser.power = formatUnits(event.params.vePower, REWARD_TOKEN_DECIMALS);

  // update vote info
  userVote.weight = formatUnits(event.params.weight, REWARD_TOKEN_DECIMALS);
  userVote.percent = userVote.weight.times(BigDecimal.fromString('100')).div(voterUser.power);


  updateVaultVoteEntity(
    vaultVote,
    event.address.toHexString(),
    userVote.weight,
    voter.rewardsBalance,
    voter.gauge,
    voter.controller,
    voter.token
  );

  saveTetuVoterRewards(voter, event.block.timestamp);
  saveTetuVoterUserVoteHistory(userVote, event.block.timestamp);
  voter.save();
  voterUser.save();
  vaultVote.save();
  userVote.save();
}

export function handleAbstained(event: Abstained): void {
  const voter = _getOrCreateTetuVoter(event.address.toHexString());
  const voterUser = TetuVoterUser.load(generateTetuVoterUserId(event.params.tokenId.toString(), voter.id));
  if (!voterUser) {
    // it can happen if voter added with exist votes
    return;
  }
  const vaultVote = getOrCreateVaultVoteEntity(voter, event.params.vault.toHexString());

  updateTetuVoter(voter, BigInt.fromI32(-1));

  // update user info
  // assume constant 7 day time-lock
  const veCtr = VeTetuAbi.bind(Address.fromString(voter.ve));
  voterUser.power = formatUnits(veCtr.balanceOfNFT(event.params.tokenId), REWARD_TOKEN_DECIMALS);

  // update vote info
  store.remove('VaultVoteEntity', generateTetuVoterUserVoteId(voterUser.id, vaultVote.id))


  updateVaultVoteEntity(
    vaultVote,
    event.address.toHexString(),
    formatUnits(event.params.weight, REWARD_TOKEN_DECIMALS).neg(),
    voter.rewardsBalance,
    voter.gauge,
    voter.controller,
    voter.token
  );

  saveTetuVoterRewards(voter, event.block.timestamp);
  voter.save();
  voterUser.save();
  vaultVote.save();
}


// ***************************************************
//                     REWARDS
// ***************************************************

export function handleNotifyReward(event: NotifyReward): void {
  const voter = _getOrCreateTetuVoter(event.address.toHexString());
  updateTetuVoter(voter, BigInt.fromI32(0));
  saveTetuVoterRewards(voter, event.block.timestamp);
}

export function handleDistributeReward(event: DistributeReward): void {
  const voter = _getOrCreateTetuVoter(event.address.toHexString());
  updateTetuVoter(voter, BigInt.fromI32(0));
  saveTetuVoterRewards(voter, event.block.timestamp);
}

// ***************************************************
//                  STATE CHANGES
// ***************************************************

export function handleRevisionIncreased(event: RevisionIncreased): void {
  const voter = _getOrCreateTetuVoter(event.address.toHexString());
  voter.revision = event.params.value.toI32();
  voter.save();
}

export function handleUpgraded(event: Upgraded): void {
  const voter = _getOrCreateTetuVoter(event.address.toHexString());
  const implementations = voter.implementations;
  implementations.push(event.params.implementation.toHexString())
  voter.implementations = implementations;
  voter.save()
}

// ***************************************************
//                     HELPERS
// ***************************************************

function updateTetuVoter(voter: TetuVoterEntity, newVoter: BigInt): void {
  const rewardTokenCtr = VaultAbi.bind(Address.fromString(voter.token));
  // suppose to always have 18 decimals
  voter.rewardsBalance = formatUnits(rewardTokenCtr.balanceOf(Address.fromString(voter.id)), REWARD_TOKEN_DECIMALS)

  voter.votersCount = voter.votersCount + newVoter.toI32();
}

function saveTetuVoterRewards(voter: TetuVoterEntity, time: BigInt): void {
  const hId = voter.id + "_" + time.toString();
  let history = TetuVoterRewardHistory.load(hId);
  if (!history) {
    history = new TetuVoterRewardHistory(hId);

    history.voter = voter.id
    history.time = time.toI32()
    history.balance = voter.rewardsBalance;

    history.save();
  }
}

function getOrCreateTetuVoterUser(veId: BigInt, voterAdr: string, veAdr: string): TetuVoterUser {
  const userId = generateTetuVoterUserId(veId.toString(), voterAdr);
  let user = TetuVoterUser.load(userId);
  if (!user) {
    user = new TetuVoterUser(userId);

    user.tetuVoter = voterAdr;
    user.veNFT = generateVeNFTId(veId.toString(), veAdr);
    user.voteTimeLockEnd = 0;
    user.power = BigDecimal.fromString('0')
  }
  return user;
}

function getOrCreateTetuVoterUserVote(voterUser: TetuVoterUser, vaultVote: VaultVoteEntity): TetuVoterUserVote {
  const voteId = generateTetuVoterUserVoteId(voterUser.id, vaultVote.id);
  let vote = TetuVoterUserVote.load(voteId);
  if (!vote) {
    vote = new TetuVoterUserVote(voteId);

    vote.user = voterUser.id;
    vote.vaultVote = vaultVote.id;
    vote.weight = BigDecimal.fromString('0')
    vote.percent = BigDecimal.fromString('0')

  }
  return vote;
}

function saveTetuVoterUserVoteHistory(tetuVoterUserVote: TetuVoterUserVote, time: BigInt): void {
  const hId = tetuVoterUserVote.id + "_" + time.toString();
  let history = TetuVoterUserVoteHistory.load(hId);
  if (!history) {
    history = new TetuVoterUserVoteHistory(hId);

    history.user = tetuVoterUserVote.user;
    history.vaultVote = tetuVoterUserVote.vaultVote;
    history.time = time.toI32();
    history.weight = tetuVoterUserVote.weight
    history.percent = tetuVoterUserVote.percent

    history.save();
  }
}

function getOrCreateVaultVoteEntity(tetuVoter: TetuVoterEntity, vaultAdr: string): VaultVoteEntity {
  const id = generateVaultVoteEntityId(tetuVoter.id, vaultAdr)
  let vaultVote = VaultVoteEntity.load(id);
  if (!vaultVote) {
    vaultVote = new VaultVoteEntity(id);

    vaultVote.tetuVoter = tetuVoter.id;
    vaultVote.vault = vaultAdr;
    vaultVote.votePercent = BigDecimal.fromString('0');
    vaultVote.voteAmount = BigDecimal.fromString('0');
    vaultVote.expectReward = BigDecimal.fromString('0');
    vaultVote.rewardTokenPrice = BigDecimal.fromString('0');
    vaultVote.expectApr = BigDecimal.fromString('0');

  }
  return vaultVote;
}


export function updateVaultVoteEntity(
  vaultVote: VaultVoteEntity,
  tetuVoterAdr: string,
  userVoteWeight: BigDecimal,
  voterRewardsBalance: BigDecimal,
  gaugeAdr: string,
  controllerAdr: string,
  rewardToken: string
): void {
  const voterCtr = TetuVoterAbi.bind(Address.fromString(tetuVoterAdr));
  // update vault vote info
  const totalWeight = formatUnits(voterCtr.totalWeight(), REWARD_TOKEN_DECIMALS);
  vaultVote.voteAmount = vaultVote.voteAmount.plus(userVoteWeight);
  vaultVote.votePercent = vaultVote.voteAmount.times(BigDecimal.fromString('100')).div(totalWeight);
  vaultVote.expectReward = voterRewardsBalance.times(vaultVote.votePercent).div(BigDecimal.fromString('100'));

  //calc apr
  const gauge = getOrCreateGaugeVault(vaultVote.vault, gaugeAdr);
  const totalSupplyUSD = gauge.totalSupply.times(gauge.stakingTokenPrice);
  const controller = ControllerEntity.load(controllerAdr) as ControllerEntity;
  vaultVote.rewardTokenPrice = _tryGetUsdPrice(controller.liquidator, rewardToken, REWARD_TOKEN_DECIMALS);
  const expectedRewardsUSD = vaultVote.expectReward.times(vaultVote.rewardTokenPrice);
  vaultVote.expectApr = calculateApr(BigInt.fromI32(0), BigInt.fromI32(60 * 60 * 24 * 7), expectedRewardsUSD, totalSupplyUSD)
}

function getOrCreateGaugeVault(vaultAdr: string, gaugeAdr: string): GaugeVaultEntity {
  const gaugeVaultId = generateGaugeVaultId(vaultAdr, gaugeAdr);
  let vault = GaugeVaultEntity.load(gaugeVaultId);
  if (!vault) {
    vault = new GaugeVaultEntity(gaugeVaultId);

    vault.gauge = gaugeAdr;
    vault.vault = vaultAdr;
    vault.totalSupply = BigDecimal.fromString('0');
    vault.totalDerivedSupply = BigDecimal.fromString('0');
    vault.assetPrice = BigDecimal.fromString('0');
    vault.stakingTokenPrice = BigDecimal.fromString('0');

  }
  return vault;
}

function _getOrCreateBribe(bribeAdr: string): BribeEntity {
  return getOrCreateBribe(
    changetype<MultiBribeAbiCommon>(MultiBribeAbi.bind(Address.fromString(bribeAdr))),
    changetype<ProxyAbiCommon>(ProxyAbi.bind(Address.fromString(bribeAdr)))
  )
}

function _getOrCreateTetuVoter(voterAdr: string): TetuVoterEntity {
  const voter = getOrCreateTetuVoter(
    changetype<TetuVoterAbiCommon>(TetuVoterAbi.bind(Address.fromString(voterAdr))),
    changetype<ProxyAbiCommon>(ProxyAbi.bind(Address.fromString(voterAdr)))
  );
  _getOrCreateBribe(voter.bribe);
  return voter;
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
