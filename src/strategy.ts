// noinspection JSUnusedGlobalSymbols

import {
  CompoundRatioChanged,
  EmergencyExit,
  RevisionIncreased,
  StrategyAbi,
  StrategySpecificNameChanged,
  Upgraded,
  WithdrawAllToSplitter,
  WithdrawToSplitter
} from "./types/templates/StrategyTemplate/StrategyAbi";
import {Address, BigDecimal, BigInt} from "@graphprotocol/graph-ts";
import {StrategySplitterAbi} from "./types/templates/StrategySplitterTemplate/StrategySplitterAbi";
import {getFeesClaimed, getOrCreateStrategy, getRewardsClaimed, updateStrategyData} from "./helpers/strategy-helper";
import {StrategySplitterAbi as StrategySplitterAbiCommon} from "./common/StrategySplitterAbi";
import {StrategyAbi as StrategyAbiCommon} from "./common/StrategyAbi";
import {ADDRESS_ZERO, getdQUICK, getKNC, getWNative, RATIO_DENOMINATOR} from "./constants";
import {
  AlgebraFeesClaimed, AlgebraRewardsClaimed, FixPriceChanges,
  KyberFeesClaimed, KyberRewardsClaimed, Rebalanced, RebalancedDebt, UncoveredLoss,
  UniV3FeesClaimed
} from "./types/templates/StrategyTemplate/StrategyLibsAbi";
import {formatUnits} from "./helpers/common-helper";

// ***************************************************
//                 STATE CHANGES
// ***************************************************

export function handleUpgraded(event: Upgraded): void {
  const strategy = getOrCreateStrategy(event.address.toHexString());
  if(!strategy) {
    return;
  }
  const implementations = strategy.implementations;
  implementations.push(event.params.implementation.toHexString())
  strategy.implementations = implementations;
  strategy.save()
}

export function handleCompoundRatioChanged(event: CompoundRatioChanged): void {
  const strategy = getOrCreateStrategy(event.address.toHexString());
  if(!strategy) {
    return;
  }
  const compoundDenominator = RATIO_DENOMINATOR.toBigDecimal();
  strategy.compoundRatio = event.params.newValue.toBigDecimal().times(BigDecimal.fromString('100')).div(compoundDenominator);
  strategy.save()
}

export function handleRevisionIncreased(event: RevisionIncreased): void {
  const strategy = getOrCreateStrategy(event.address.toHexString());
  if(!strategy) {
    return;
  }
  strategy.revision = event.params.value.toI32();

  const strategyCtr = StrategyAbi.bind(event.address);
  const v = strategyCtr.try_STRATEGY_VERSION();
  if (!v.reverted) {
    strategy.version = v.value;
  }

  strategy.save()
}

export function handleStrategySpecificNameChanged(event: StrategySpecificNameChanged): void {
  const strategy = getOrCreateStrategy(event.address.toHexString());
  if(!strategy) {
    return;
  }
  strategy.specificName = event.params.name;
  strategy.save()
}

// ***************************************************
//                 EARNS AND LOSSES
// ***************************************************

export function handleAlgebraFeesClaimed(event: AlgebraFeesClaimed): void {
  const strategy = getOrCreateStrategy(event.address.toHexString());
  strategy.feesClaimed = strategy.feesClaimed.plus(getFeesClaimed(
      event.address,
      event.params.fee0,
      event.params.fee1,
      BigInt.fromI32(strategy.assetTokenDecimals)
  ))
  strategy.save()
}

export function handleKyberFeesClaimed(event: KyberFeesClaimed): void {
  const strategy = getOrCreateStrategy(event.address.toHexString());
  strategy.feesClaimed = strategy.feesClaimed.plus(getFeesClaimed(
      event.address,
      event.params.fee0,
      event.params.fee1,
      BigInt.fromI32(strategy.assetTokenDecimals)
  ))
  strategy.save()
}

export function handleUniV3FeesClaimed(event: UniV3FeesClaimed): void {
  const strategy = getOrCreateStrategy(event.address.toHexString());
  strategy.feesClaimed = strategy.feesClaimed.plus(getFeesClaimed(
      event.address,
      event.params.fee0,
      event.params.fee1,
      BigInt.fromI32(strategy.assetTokenDecimals)
  ))
  strategy.save()
}

export function handleAlgebraRewardsClaimed(event: AlgebraRewardsClaimed): void {
  const strategy = getOrCreateStrategy(event.address.toHexString());
  strategy.rewardsClaimed = strategy.rewardsClaimed.plus(getRewardsClaimed(
      event.address,
      event.params.reward,
      event.params.bonusReward,
      BigInt.fromI32(strategy.assetTokenDecimals),
      getdQUICK(),
      getWNative()
  ))
  strategy.save()
}

export function handleKyberRewardsClaimed(event: KyberRewardsClaimed): void {
  const strategy = getOrCreateStrategy(event.address.toHexString());
  strategy.rewardsClaimed = strategy.rewardsClaimed.plus(getRewardsClaimed(
      event.address,
      event.params.reward,
      BigInt.fromI32(0),
      BigInt.fromI32(strategy.assetTokenDecimals),
      getKNC(),
      Address.fromString(ADDRESS_ZERO)
  ))
  strategy.save()
}


export function handleRebalanced(event: Rebalanced): void {
  const strategy = getOrCreateStrategy(event.address.toHexString());
  strategy.profitCovered = strategy.profitCovered.plus(formatUnits(event.params.profitToCover, BigInt.fromI32(strategy.assetTokenDecimals)))
  strategy.lossCoveredFromRewards = strategy.lossCoveredFromRewards.plus(formatUnits(event.params.coveredByRewards, BigInt.fromI32(strategy.assetTokenDecimals)))
  strategy.save()
}

export function handleRebalancedDebt(event: RebalancedDebt): void {
  const strategy = getOrCreateStrategy(event.address.toHexString());
  strategy.profitCovered = strategy.profitCovered.plus(formatUnits(event.params.profitToCover, BigInt.fromI32(strategy.assetTokenDecimals)))
  strategy.lossCoveredFromRewards = strategy.lossCoveredFromRewards.plus(formatUnits(event.params.coveredByRewards, BigInt.fromI32(strategy.assetTokenDecimals)))
  strategy.save()
}

export function handleFixPriceChanges(event: FixPriceChanges): void {
  const strategy = getOrCreateStrategy(event.address.toHexString());
  if (event.params.investedAssetsOut.lt(event.params.investedAssetsBefore)) {
    const loss = event.params.investedAssetsBefore.minus(event.params.investedAssetsOut)
    strategy.lossCoveredFromInsurance = strategy.lossCoveredFromInsurance.plus(formatUnits(loss, BigInt.fromI32(strategy.assetTokenDecimals)));
    strategy.save()
  }
}

export function handleLUncoveredLoss(event: UncoveredLoss): void {
  const strategy = getOrCreateStrategy(event.address.toHexString());
  strategy.lossCoveredFromInsurance = strategy.lossCoveredFromInsurance.minus(formatUnits(event.params.lossUncovered, BigInt.fromI32(strategy.assetTokenDecimals)));
  strategy.save()
}

// ***************************************************
//                    ACTIONS
// ***************************************************

export function handleEmergencyExit(event: EmergencyExit): void {
  _updateStrategyData(event.address.toHexString(), event.block.timestamp.toI32());
}

export function handleWithdrawAllToSplitter(
  event: WithdrawAllToSplitter
): void {
  _updateStrategyData(event.address.toHexString(), event.block.timestamp.toI32());
}

export function handleWithdrawToSplitter(event: WithdrawToSplitter): void {
  _updateStrategyData(event.address.toHexString(), event.block.timestamp.toI32());
}

//
// export function handleSentToForwarder(event: SentToForwarder): void {
//   let info = ForwarderTokenInfo.load(event.params.token.toHexString());
//   if (!info) {
//     info = new ForwarderTokenInfo(event.params.token.toHexString());
//     const forwarderCtr = ForwarderAbi.bind(event.params.forwarder);
//
//     info.forwarder = event.params.forwarder.toHexString();
//     info.slippage = forwarderCtr.DEFAULT_SLIPPAGE().toBigDecimal().div(BigDecimal.fromString('1000'));
//     info.balance = BigDecimal.fromString('0');
//   }
//   const tokenCtr = VaultAbi.bind(event.params.token);
//   info.balance = info.balance.plus(formatUnits(event.params.amount, BigInt.fromI32(tokenCtr.decimals())));
//   info.lastUpdate = event.block.timestamp.toI32();
//   info.save();
// }

// ***************************************************
//                    HELPERS
// ***************************************************

function _updateStrategyData(strategyAdr: string, time: i32): void {
  const strategy = getOrCreateStrategy(strategyAdr);
  if(!strategy) {
    return;
  }
  updateStrategyData(
    strategy,
    time,
    changetype<StrategySplitterAbiCommon>(StrategySplitterAbi.bind(Address.fromString(strategy.splitter))),
    changetype<StrategyAbiCommon>(StrategyAbi.bind(Address.fromString(strategyAdr))),
  )
}
