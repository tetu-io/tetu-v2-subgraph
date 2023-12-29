import {GaugeEntity} from "../types/schema";
import {MultiGaugeTemplate} from "../types/templates";
import {ProxyAbi} from "../common/ProxyAbi";
import {MultiGaugeAbi} from "../common/MultiGaugeAbi";
import {ADDRESS_ZERO} from "../constants";

export function getOrCreateGauge(gaugeCtr: MultiGaugeAbi, proxy: ProxyAbi): GaugeEntity {
  let gauge = GaugeEntity.load(gaugeCtr._address.toHexString());
  if (!gauge) {
    gauge = new GaugeEntity(gaugeCtr._address.toHexString());

    gauge.version = gaugeCtr.MULTI_GAUGE_VERSION();
    gauge.revision = gaugeCtr.revision().toI32();
    gauge.createdTs = gaugeCtr.created().toI32()
    gauge.createdBlock = gaugeCtr.createdBlock().toI32()
    gauge.implementations = [proxy.implementation().toHexString()]

    const veR = gaugeCtr.try_ve();
    if (veR.reverted) {
      gauge.ve = ADDRESS_ZERO;
    } else {
      gauge.ve = veR.value.toHexString();
    }

    gauge.controller = gaugeCtr.controller().toHexString();
    gauge.defaultRewardToken = gaugeCtr.defaultRewardToken().toHexString()

    MultiGaugeTemplate.create(gaugeCtr._address);
    gauge.save();
  }
  return gauge;
}
