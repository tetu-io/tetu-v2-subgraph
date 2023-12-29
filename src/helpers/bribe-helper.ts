import {BribeEntity} from "../types/schema";
import {MultiBribeAbi} from "../common/MultiBribeAbi";
import {ProxyAbi} from "../common/ProxyAbi";
import {MultiBribeTemplate} from "../types/templates";
import {Address} from "@graphprotocol/graph-ts";
import {ADDRESS_ZERO} from "../constants";

export function getOrCreateBribe(bribeCtr: MultiBribeAbi, proxy: ProxyAbi): BribeEntity {
  let bribe = BribeEntity.load(bribeCtr._address.toHexString());

  if (!bribe) {
    bribe = new BribeEntity(bribeCtr._address.toHexString());

    if(bribeCtr._address.equals(Address.fromString(ADDRESS_ZERO))) {
      bribe.version = 'EMPTY';
      bribe.revision = 0;
      bribe.createdTs = 0
      bribe.createdBlock = 0
      bribe.implementations = [ADDRESS_ZERO]

      bribe.ve = ADDRESS_ZERO;
      bribe.controller = ADDRESS_ZERO;

      bribe.defaultRewardToken = ADDRESS_ZERO;

    } else {
      bribe.version = bribeCtr.MULTI_BRIBE_VERSION();
      bribe.revision = bribeCtr.revision().toI32();
      bribe.createdTs = bribeCtr.created().toI32()
      bribe.createdBlock = bribeCtr.createdBlock().toI32()
      bribe.implementations = [proxy.implementation().toHexString()]

      bribe.ve = bribeCtr.ve().toHexString();
      bribe.controller = bribeCtr.controller().toHexString();

      bribe.defaultRewardToken = bribeCtr.defaultRewardToken().toHexString()

      MultiBribeTemplate.create(bribeCtr._address);
    }


    bribe.save();
  }

  return bribe;
}
