import {TetuVoterEntity} from "../types/schema";
import {formatUnits} from "./common-helper";
import {REWARD_TOKEN_DECIMALS, ZERO_BD} from "../constants";
import {TetuVoterAbi} from "../common/TetuVoterAbi";
import {ProxyAbi} from "../common/ProxyAbi";
import {VaultAbi} from "../common/VaultAbi";

export function getOrCreateTetuVoter(
  voterCtr: TetuVoterAbi,
  proxyVoter: ProxyAbi
): TetuVoterEntity {
  let voter = TetuVoterEntity.load(voterCtr._address.toHexString());
  if (!voter) {
    voter = new TetuVoterEntity(voterCtr._address.toHexString());

    voter.version = voterCtr.VOTER_VERSION();
    voter.revision = voterCtr.revision().toI32();
    voter.createdTs = voterCtr.created().toI32();
    voter.createdBlock = voterCtr.createdBlock().toI32();
    voter.implementations = [proxyVoter.implementation().toHexString()];

    voter.controller = voterCtr.controller().toHexString();
    voter.ve = voterCtr.ve().toHexString();
    voter.gauge = voterCtr.gauge().toHexString();
    voter.bribe = voterCtr.bribe().toHexString();
    voter.token = voterCtr.token().toHexString();

    voter.rewardsBalance = ZERO_BD;
    voter.votersCount = 0;
  }
  return voter;
}
