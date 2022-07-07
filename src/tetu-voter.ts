// noinspection JSUnusedGlobalSymbols

import {
  Abstained,
  Attach,
  Detach,
  DistributeReward,
  NotifyReward,
  RevisionIncreased,
  Upgraded,
  Voted
} from "./types/templates/TetuVoterTemplate/TetuVoterAbi";
import {
  ControllerEntity,
  GaugeVaultEntity,
  TetuVoterEntity,
  TetuVoterRewardHistory,
  TetuVoterUser,
  TetuVoterUserVote,
  TetuVoterUserVoteHistory, UserEntity, VaultEntity,
  VaultVoteEntity
} from "./types/schema";
import {TetuVoterAbi} from "./types/ControllerData/TetuVoterAbi";
import {Address, BigDecimal, BigInt, dataSource, log, store} from "@graphprotocol/graph-ts";
import {ProxyAbi} from "./types/ControllerData/ProxyAbi";
import {VaultAbi} from "./types/ControllerData/VaultAbi";
import {
  calculateApr,
  formatUnits,
  generateGaugeVaultId,
  generateTetuVoterUserId,
  generateTetuVoterUserVoteId,
  generateVaultVoteEntityId,
  parseUnits
} from "./helpers";
import {ADDRESS_ZERO, getUSDC, REWARD_TOKEN_DECIMALS} from "./constants";
import {LiquidatorAbi} from "./types/templates/MultiGaugeTemplate/LiquidatorAbi";
import {VeTetuAbi} from "./types/templates/VeTetuTemplate/VeTetuAbi";

// ***************************************************
//                ATTACH/DETACH/VOTE
// ***************************************************

export function handleVoted(event: Voted): void {
  const voter = getOrCreateTetuVoter(event.address.toHexString());
  const voterUser = getOrCreateTetuVoterUser(event.params.tokenId, voter.id, event.params.voter.toHexString());
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
  const voter = getOrCreateTetuVoter(event.address.toHexString());
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
  const voter = getOrCreateTetuVoter(event.address.toHexString());
  updateTetuVoter(voter, BigInt.fromI32(0));
  saveTetuVoterRewards(voter, event.block.timestamp);
}

export function handleDistributeReward(event: DistributeReward): void {
  const voter = getOrCreateTetuVoter(event.address.toHexString());
  updateTetuVoter(voter, BigInt.fromI32(0));
  saveTetuVoterRewards(voter, event.block.timestamp);
}

// ***************************************************
//                  STATE CHANGES
// ***************************************************

export function handleRevisionIncreased(event: RevisionIncreased): void {
  const voter = getOrCreateTetuVoter(event.address.toHexString());
  voter.revision = event.params.value.toI32();
  voter.save();
}

export function handleUpgraded(event: Upgraded): void {
  const voter = getOrCreateTetuVoter(event.address.toHexString());
  const implementations = voter.implementations;
  implementations.push(event.params.implementation.toHexString())
  voter.implementations = implementations;
  voter.save()
}

// ***************************************************
//                     HELPERS
// ***************************************************

function getOrCreateTetuVoter(voterAdr: string): TetuVoterEntity {
  let voter = TetuVoterEntity.load(voterAdr);
  if (!voter) {
    voter = new TetuVoterEntity(voterAdr);
    const voterCtr = TetuVoterAbi.bind(Address.fromString(voterAdr));
    const proxy = ProxyAbi.bind(Address.fromString(voterAdr));
    const tokenCtr = VaultAbi.bind(voterCtr.token());

    voter.version = voterCtr.VOTER_VERSION();
    voter.revision = voterCtr.revision().toI32();
    voter.createdTs = voterCtr.created().toI32();
    voter.createdBlock = voterCtr.createdBlock().toI32();
    voter.implementations = [proxy.implementation().toHexString()];

    voter.controller = voterCtr.controller().toHexString();
    voter.ve = voterCtr.ve().toHexString();
    voter.gauge = voterCtr.gauge().toHexString();
    voter.bribe = voterCtr.bribe().toHexString();
    voter.token = voterCtr.token().toHexString();

    voter.rewardsBalance = formatUnits(tokenCtr.balanceOf(Address.fromString(voterAdr)), REWARD_TOKEN_DECIMALS);
    voter.votersCount = 0;
  }
  return voter;
}

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

function getOrCreateTetuVoterUser(veId: BigInt, voterAdr: string, userAdr: string): TetuVoterUser {
  const userId = generateTetuVoterUserId(veId.toString(), voterAdr);
  let user = TetuVoterUser.load(userId);
  if (!user) {
    user = new TetuVoterUser(userId);

    user.tetuVoter = voterAdr;
    user.user = ADDRESS_ZERO;
    user.veId = veId.toI32();
    user.voteTimeLockEnd = 0;
    user.power = BigDecimal.fromString('0')

    user.user = userAdr;
    if (!UserEntity.load(userAdr)) {
      const user = new UserEntity(userAdr);
      user.save();
    }
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
  vaultVote.rewardTokenPrice = tryGetUsdPrice(controller.liquidator, rewardToken, REWARD_TOKEN_DECIMALS);
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
