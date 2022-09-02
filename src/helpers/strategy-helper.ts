import {StrategyEntity, StrategyHistory} from "../types/schema";
import {Address, BigInt} from "@graphprotocol/graph-ts";
import {formatUnits} from "./common-helper";
import {HUNDRED_BD, ZERO_BD} from "../constants";
import {StrategySplitterAbi} from "../common/StrategySplitterAbi";
import {StrategyAbi} from "../common/StrategyAbi";

export function saveStrategyHistory(strategy: StrategyEntity, time: i32): void {
  const h = new StrategyHistory(strategy.id + '_' + BigInt.fromI32(time).toString());
  h.strategy = strategy.id;
  h.time = time;

  h.tvl = strategy.tvl;
  h.profit = strategy.profit;
  h.loss = strategy.loss;
  h.apr = strategy.apr;
  h.averageApr = strategy.averageApr;
  h.tvlAllocationPercent = strategy.tvlAllocationPercent;

  h.save();
}

export function updateStrategyData(
  strategy: StrategyEntity,
  time: i32,
  splitterCtr: StrategySplitterAbi,
  strategyCtr: StrategyAbi
): void {
  strategy.tvl = formatUnits(strategyCtr.totalAssets(), BigInt.fromI32(strategy.assetDecimals));
  const totalAssets = formatUnits(splitterCtr.totalAssets(), BigInt.fromI32(strategy.assetDecimals));
  if (totalAssets.equals(ZERO_BD)) {
    strategy.tvlAllocationPercent = ZERO_BD;
  } else {
    strategy.tvlAllocationPercent = strategy.tvl.times(HUNDRED_BD).div(totalAssets);
  }
  saveStrategyHistory(strategy, time);
  strategy.save();
}
