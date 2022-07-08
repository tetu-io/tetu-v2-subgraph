// noinspection JSUnusedGlobalSymbols

import {
  RevisionIncreased,
  Upgraded,
  Voted,
  VoteRemoved
} from "./types/templates/PlatformVoterTemplate/PlatformVoterAbi";
import {
  ForwarderEntity,
  PlatformVoteEntity,
  PlatformVoteHistory,
  PlatformVoterEntity,
  StrategyEntity,
  VeUserEntity
} from "./types/schema";
import {BigDecimal, BigInt, store} from "@graphprotocol/graph-ts";
import {formatUnits, generatePlatformVoteEntityId, generateVeUserId} from "./helpers";

// ***************************************************
//                ATTACH/DETACH/VOTE
// ***************************************************


export function handleVoted(event: Voted): void {
  const voter = getPlatformVoterEntity(event.address.toHexString())

  const voteId = generatePlatformVoteEntityId(
    voter.id,
    event.params.tokenId,
    event.params._type.toString(),
    event.params.target.toHexString()
  );
  let vote = PlatformVoteEntity.load(voteId);
  if (vote != null) {
    // remove vote if exist
    store.remove('PlatformVoteEntity', voteId)
  }
  vote = new PlatformVoteEntity(voteId);

  const veUserId = generateVeUserId(event.params.tokenId.toString(), voter.ve);
  const veUser = VeUserEntity.load(veUserId) as VeUserEntity;
  const decimals = BigInt.fromI32(18);

  vote.platformVoter = voter.id;
  vote.veUser = veUserId;
  vote.user = veUser.user;
  vote.voteType = event.params._type.toI32();

  vote.desiredValue = formatUnits(event.params.value, BigInt.fromI32(5))
  vote.target = event.params.target.toHexString();
  vote.vePower = formatUnits(event.params.veWeight, decimals);
  vote.veWeightedValue = formatUnits(event.params.veWeightedValue, BigInt.fromI32(5))
  vote.totalAttributeWeight = event.params.totalAttributeWeight.toBigDecimal()
  vote.totalAttributeValue = event.params.totalAttributeValue.toBigDecimal()
  vote.newValue = formatUnits(event.params.newValue, BigInt.fromI32(5))
  vote.percent = vote.totalAttributeWeight.times(BigDecimal.fromString('100')).div(event.params.veWeightedValue.toBigDecimal())

  updateTargetAttribute(event.params._type, event.params.target.toHexString(), formatUnits(event.params.newValue, BigInt.fromI32(5)));
  saveVoteHistory(vote, event.block.timestamp);
  vote.save();
}

export function handleVoteRemoved(event: VoteRemoved): void {
  const voteId = generatePlatformVoteEntityId(
    event.address.toHexString(),
    event.params.tokenId,
    event.params._type.toString(),
    event.params.target.toHexString()
  );
  updateTargetAttribute(event.params._type, event.params.target.toHexString(), formatUnits(event.params.newValue, BigInt.fromI32(5)));
  store.remove('PlatformVoteEntity', voteId);
}

// ***************************************************
//                  STATE CHANGES
// ***************************************************

export function handleRevisionIncreased(event: RevisionIncreased): void {
  const voter = getPlatformVoterEntity(event.address.toHexString())
  voter.revision = event.params.value.toI32();
  voter.save();
}

export function handleUpgraded(event: Upgraded): void {
  const voter = getPlatformVoterEntity(event.address.toHexString())
  const implementations = voter.implementations;
  implementations.push(event.params.implementation.toHexString())
  voter.implementations = implementations;
  voter.save()
}

// ***************************************************
//                     HELPERS
// ***************************************************

function getPlatformVoterEntity(adr: string): PlatformVoterEntity {
  return PlatformVoterEntity.load(adr) as PlatformVoterEntity;
}

function saveVoteHistory(vote: PlatformVoteEntity, time: BigInt): void {
  const history = new PlatformVoteHistory(vote.id + time.toString());

  history.vote = vote.id;
  history.time = time.toI32();
  history.desiredValue = vote.desiredValue;
  history.target = vote.target;
  history.vePower = vote.vePower;
  history.veWeightedValue = vote.veWeightedValue;
  history.totalAttributeWeight = vote.totalAttributeWeight;
  history.totalAttributeValue = vote.totalAttributeValue;
  history.newValue = vote.newValue;
  history.percent = vote.percent;

  history.save();
}

function updateTargetAttribute(type: BigInt, target: string, newValue: BigDecimal): void {
  if (type.equals(BigInt.fromI32(1))) {
    const forwarder = ForwarderEntity.load(target) as ForwarderEntity;
    forwarder.toInvestFundRatio = newValue;
    forwarder.save();
  }
  if (type.equals(BigInt.fromI32(2))) {
    const forwarder = ForwarderEntity.load(target) as ForwarderEntity;
    forwarder.toGaugesRatio = newValue;
    forwarder.save();
  }
  if (type.equals(BigInt.fromI32(3))) {
    const strategy = StrategyEntity.load(target) as StrategyEntity;
    strategy.compoundRatio = newValue;
    strategy.save();
  }
}
