import {BribeEntity} from "../types/schema";
import {MultiBribeAbi} from "../common/MultiBribeAbi";
import {ProxyAbi} from "../common/ProxyAbi";

export function getOrCreateBribe(bribeCtr: MultiBribeAbi, proxy: ProxyAbi): BribeEntity {
  let bribe = BribeEntity.load(bribeCtr._address.toHexString());

  if (!bribe) {
    bribe = new BribeEntity(bribeCtr._address.toHexString());

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