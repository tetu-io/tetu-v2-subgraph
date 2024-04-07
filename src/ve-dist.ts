// // noinspection JSUnusedGlobalSymbols
//
// import {
//   CheckpointToken,
//   Claimed,
//   RevisionIncreased,
//   VeDistributorAbi
// } from "./types/templates/VeDistributorTemplate/VeDistributorAbi";
// import {Upgraded} from "./types/ControllerData/VeDistributorAbi";
// import {
//   ControllerEntity,
//   VeDistEntity,
//   VeNFTEntity,
//   VeNFTVeDistRewardHistory,
//   VeTetuEntity
// } from "./types/schema";
// import {calculateApr, formatUnits, tryGetUsdPrice} from "./helpers/common-helper";
// import {Address, BigDecimal, BigInt} from "@graphprotocol/graph-ts";
// import {VaultAbi} from "./types/ControllerData/VaultAbi";
// import {ADDRESS_ZERO, getPriceCalculator, WEEK} from "./constants";
// import {LiquidatorAbi} from "./types/templates/VeDistributorTemplate/LiquidatorAbi";
// import {LiquidatorAbi as LiquidatorAbiCommon} from "./common/LiquidatorAbi";
// import {VaultAbi as VaultAbiCommon} from "./common/VaultAbi";
// import {generateVeNFTId} from "./helpers/id-helper";
// import {PriceCalculatorAbi as PriceCalculatorAbiCommon} from "./common/PriceCalculatorAbi";
// import {PriceCalculatorAbi} from "./types/templates/VeDistributorTemplate/PriceCalculatorAbi";
// import {
//   Checkpoint,
//   RewardsClaimed,
//   VeDistributorV2Abi
// } from "./types/templates/VeDistributorV2Template/VeDistributorV2Abi";
//
// // ***************************************************
// //                    MAIN LOGIC
// // ***************************************************
//
// export function handleCheckpointToken(event: CheckpointToken): void {
//   const veDist = getVeDist(event.address.toHexString());
//   const controller = ControllerEntity.load(veDist.controller) as ControllerEntity;
//   const decimals = BigInt.fromI32(veDist.decimals);
//   const rewardPrice = _tryGetUsdPrice(controller.liquidator, veDist.rewardToken, decimals);
//   updateVeDist(veDist, rewardPrice);
// }
//
// export function handleClaimed(event: Claimed): void {
//   const veDist = getVeDist(event.address.toHexString());
//
//   const decimals = BigInt.fromI32(veDist.decimals);
//   const controller = ControllerEntity.load(veDist.controller) as ControllerEntity;
//   const veNFT = VeNFTEntity.load(generateVeNFTId(event.params.tokenId.toString(), veDist.ve)) as VeNFTEntity;
//   const claimed = formatUnits(event.params.amount, decimals);
//   const rewardPrice = _tryGetUsdPrice(controller.liquidator, veDist.rewardToken, decimals);
//   const claimedUSD = claimed.times(rewardPrice);
//   veNFT.veDistRewardsTotal = veNFT.veDistRewardsTotal.plus(claimed);
//   veNFT.veDistLastApr = calculateApr(BigInt.fromI32(veNFT.veDistLastClaim), event.block.timestamp, claimedUSD, veNFT.lockedAmountUSD);
//   veNFT.veDistLastClaim = event.block.timestamp.toI32();
//   saveRewardHistory(veNFT, event.block.timestamp, claimed, claimedUSD);
//   veNFT.save();
//
//
//   updateVeDist(veDist, rewardPrice);
// }
//
// export function handleCheckpointV2(event: Checkpoint): void {
//   const veDist = getVeDist(event.address.toHexString());
//   const controller = ControllerEntity.load(veDist.controller) as ControllerEntity;
//   const decimals = BigInt.fromI32(veDist.decimals);
//   const rewardPrice = _tryGetUsdPrice(controller.liquidator, veDist.rewardToken, decimals);
//
//
//   const veDistCtr = VeDistributorV2Abi.bind(Address.fromString(veDist.id));
//
//   const tokenDecimals = BigInt.fromI32(veDist.decimals);
//
//   const tokenCtr = VaultAbi.bind(Address.fromString(veDist.rewardToken));
//   veDist.tokenBalance = formatUnits(tokenCtr.balanceOf(Address.fromString(veDist.id)), tokenDecimals);
//
//   veDist.activePeriod = event.params.epoch.toI32();
//
//   const prevEpoch = veDistCtr.epochInfos(event.params.epoch.minus(BigInt.fromI32(1)));
//   const period = event.params.newEpochTs.minus(prevEpoch.getTs());
//
//
//   const rewards = formatUnits(event.params.tokenDiff, tokenDecimals);
//   const rewardsUSD = rewards.times(rewardPrice);
//
//   const ve = VeTetuEntity.load(veDist.ve) as VeTetuEntity;
//   veDist.apr = calculateApr(BigInt.fromI32(0), period, rewardsUSD, ve.lockedAmountUSD);
//
//   veDist.save();
// }
//
// export function handleClaimedV2(event: RewardsClaimed): void {
//   const veDist = getVeDist(event.address.toHexString());
//
//   const decimals = BigInt.fromI32(veDist.decimals);
//   const controller = ControllerEntity.load(veDist.controller) as ControllerEntity;
//   const veNFT = VeNFTEntity.load(generateVeNFTId(event.params.tokenId.toString(), veDist.ve)) as VeNFTEntity;
//   const claimed = formatUnits(event.params.amount, decimals);
//   const rewardPrice = _tryGetUsdPrice(controller.liquidator, veDist.rewardToken, decimals);
//   const claimedUSD = claimed.times(rewardPrice);
//   veNFT.veDistRewardsTotal = veNFT.veDistRewardsTotal.plus(claimed);
//   veNFT.veDistLastApr = veDist.apr;
//   veNFT.veDistLastClaim = event.block.timestamp.toI32();
//   saveRewardHistory(veNFT, event.block.timestamp, claimed, claimedUSD);
//   veNFT.save();
//
//   // update ve dist
//   const tokenDecimals = BigInt.fromI32(veDist.decimals);
//   const tokenCtr = VaultAbi.bind(Address.fromString(veDist.rewardToken));
//   veDist.tokenBalance = formatUnits(tokenCtr.balanceOf(Address.fromString(veDist.id)), tokenDecimals);
//   veDist.save();
// }
//
// // ***************************************************
// //                 ATTRIBUTES CHANGED
// // ***************************************************
//
// export function handleRevisionIncreased(event: RevisionIncreased): void {
//   const veDist = getVeDist(event.address.toHexString());
//   veDist.revision = event.params.value.toI32();
//
//   const ctr = VeDistributorAbi.bind(event.address);
//   const v = ctr.try_VE_DIST_VERSION();
//   if (!v.reverted) {
//     veDist.version = v.value;
//   }
//
//   veDist.save();
// }
//
// export function handleUpgraded(event: Upgraded): void {
//   const veDist = getVeDist(event.address.toHexString());
//   const implementations = veDist.implementations;
//   implementations.push(event.params.implementation.toHexString())
//   veDist.implementations = implementations;
//   veDist.save()
// }
//
// // ***************************************************
// //                     HELPERS
// // ***************************************************
//
// function getVeDist(veDistAdr: string): VeDistEntity {
//   return VeDistEntity.load(veDistAdr) as VeDistEntity;
// }
//
// function updateVeDist(veDist: VeDistEntity, rewardPrice: BigDecimal): void {
//   const veDistCtr = VeDistributorAbi.bind(Address.fromString(veDist.id));
//   const tokenCtr = VaultAbi.bind(Address.fromString(veDist.rewardToken));
//
//   const tokenDecimals = BigInt.fromI32(veDist.decimals);
//
//   veDist.activePeriod = veDistCtr.activePeriod().toI32();
//   veDist.timeCursor = veDistCtr.timeCursor().toI32();
//   veDist.tokenLastBalance = formatUnits(veDistCtr.tokenLastBalance(), tokenDecimals);
//   veDist.tokenBalance = formatUnits(tokenCtr.balanceOf(Address.fromString(veDist.id)), tokenDecimals);
//   veDist.lastTokenTime = veDistCtr.lastTokenTime().toI32();
//
//   const thisWeek = BigInt.fromI32(veDist.lastTokenTime).div(BigInt.fromString(WEEK.toString())).times(BigInt.fromString(WEEK.toString()));
//   veDist.tokensPerWeek = formatUnits(veDistCtr.tokensPerWeek(thisWeek), tokenDecimals);
//   veDist.left = veDist.tokensPerWeek.times(rewardPrice);
//
//   const ve = VeTetuEntity.load(veDist.ve) as VeTetuEntity;
//   veDist.apr = calculateApr(BigInt.fromI32(0), BigInt.fromString(WEEK.toString()), veDist.left, ve.lockedAmountUSD);
//
//   veDist.save();
// }
//
// function saveRewardHistory(veNFT: VeNFTEntity, time: BigInt, claimed: BigDecimal, claimedUSD: BigDecimal): void {
//   let history = VeNFTVeDistRewardHistory.load(veNFT.id + "_" + time.toString());
//   if (!history) {
//     history = new VeNFTVeDistRewardHistory(veNFT.id + "_" + time.toString());
//
//     history.veNFT = veNFT.id;
//     history.owner = (veNFT.user || ADDRESS_ZERO) as string;
//     history.time = time.toI32();
//     history.claimed = claimed;
//     history.claimedUSD = claimedUSD;
//     history.lockedAmountUSD = veNFT.lockedAmountUSD;
//     history.apr = veNFT.veDistLastApr;
//
//     history.save();
//   }
// }
//
// function _tryGetUsdPrice(
//   liquidatorAdr: string,
//   asset: string,
//   decimals: BigInt
// ): BigDecimal {
//   return tryGetUsdPrice(
//     changetype<LiquidatorAbiCommon>(LiquidatorAbi.bind(Address.fromString(liquidatorAdr))),
//     changetype<PriceCalculatorAbiCommon>(PriceCalculatorAbi.bind(getPriceCalculator())),
//     changetype<VaultAbiCommon>(VaultAbi.bind(Address.fromString(asset))),
//     decimals
//   );
// }
