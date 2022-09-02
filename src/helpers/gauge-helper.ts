import {GaugeEntity} from "../types/schema";
import {Address} from "@graphprotocol/graph-ts";
import {MultiGaugeTemplate} from "../types/templates";
import {ProxyAbi} from "../common/ProxyAbi";
import {MultiGaugeAbi} from "../common/MultiGaugeAbi";

export function getOrCreateGauge(gaugeCtr: MultiGaugeAbi, proxy: ProxyAbi): GaugeEntity {
  let gauge = GaugeEntity.load(gaugeCtr._address.toHexString());
  if (!gauge) {
    gauge = new GaugeEntity(gaugeCtr._address.toHexString());

    gauge.version = gaugeCtr.MULTI_GAUGE_VERSION();
    gauge.revision = gaugeCtr.revision().toI32();
    gauge.createdTs = gaugeCtr.created().toI32()
    gauge.createdBlock = gaugeCtr.createdBlock().toI32()
    gauge.implementations = [proxy.implementation().toHexString()]
    gauge.ve = gaugeCtr.ve().toHexString();
    gauge.controller = gaugeCtr.controller().toHexString();
    gauge.operator = gaugeCtr.operator().toHexString();
    gauge.defaultRewardToken = gaugeCtr.defaultRewardToken().toHexString()

    MultiGaugeTemplate.create(gaugeCtr._address);
    gauge.save();
  }
  return gauge;
}
