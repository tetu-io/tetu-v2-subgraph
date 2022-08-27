// noinspection JSUnusedGlobalSymbols

import {
  CheckpointToken,
  Claimed,
  RevisionIncreased,
  VeDistributorAbi
} from "./types/templates/VeDistributorTemplate/VeDistributorAbi";
import {Upgraded} from "./types/ControllerData/VeDistributorAbi";
import {
  ControllerEntity,
  TokenEntity,
  VeDistEntity,
  VeTetuEntity,
  VeNFTEntity,
  VeNFTVeDistRewardHistory
} from "./types/schema";
import {calculateApr, formatUnits, generateVeNFTId, parseUnits} from "./helpers";
import {Address, BigDecimal, BigInt, log} from "@graphprotocol/graph-ts";
import {VaultAbi} from "./types/ControllerData/VaultAbi";
import {ADDRESS_ZERO, getUSDC, WEEK, ZERO_BD} from "./constants";
import {LiquidatorAbi} from "./types/templates/VeDistributorTemplate/LiquidatorAbi";

// ***************************************************
//                    MAIN LOGIC
// ***************************************************

export function handleCheckpointToken(event: CheckpointToken): void {
  const veDist = getVeDist(event.address.toHexString());
  const controller = ControllerEntity.load(veDist.controller) as ControllerEntity;
  const decimals = BigInt.fromI32(veDist.decimals);
  const rewardPrice = tryGetUsdPrice(controller.liquidator, veDist.rewardToken, decimals);
  updateVeDist(veDist, rewardPrice);
}

export function handleClaimed(event: Claimed): void {
  const veDist = getVeDist(event.address.toHexString());

  const decimals = BigInt.fromI32(veDist.decimals);
  const controller = ControllerEntity.load(veDist.controller) as ControllerEntity;
  const veNFT = VeNFTEntity.load(generateVeNFTId(event.params.tokenId.toString(), veDist.ve)) as VeNFTEntity;
  const claimed = formatUnits(event.params.amount, decimals);
  const rewardPrice = tryGetUsdPrice(controller.liquidator, veDist.rewardToken, decimals);
  const claimedUSD = claimed.times(rewardPrice);
  veNFT.veDistRewardsTotal = veNFT.veDistRewardsTotal.plus(claimed);
  veNFT.veDistLastApr = calculateApr(BigInt.fromI32(veNFT.veDistLastClaim), event.block.timestamp, claimedUSD, veNFT.lockedAmountUSD);
  veNFT.veDistLastClaim = event.block.timestamp.toI32();
  saveRewardHistory(veNFT, event.block.timestamp, claimed, claimedUSD);
  veNFT.save();


  updateVeDist(veDist, rewardPrice);
}

// ***************************************************
//                 ATTRIBUTES CHANGED
// ***************************************************

export function handleRevisionIncreased(event: RevisionIncreased): void {
  const veDist = getVeDist(event.address.toHexString());
  veDist.revision = event.params.value.toI32();
  veDist.save();
}

export function handleUpgraded(event: Upgraded): void {
  const veDist = getVeDist(event.address.toHexString());
  const implementations = veDist.implementations;
  implementations.push(event.params.implementation.toHexString())
  veDist.implementations = implementations;
  veDist.save()
}

// ***************************************************
//                     HELPERS
// ***************************************************

function getVeDist(veDistAdr: string): VeDistEntity {
  return VeDistEntity.load(veDistAdr) as VeDistEntity;
}

function updateVeDist(veDist: VeDistEntity, rewardPrice: BigDecimal): void {
  const veDistCtr = VeDistributorAbi.bind(Address.fromString(veDist.id));
  const tokenCtr = VaultAbi.bind(Address.fromString(veDist.rewardToken));

  const tokenDecimals = BigInt.fromI32(veDist.decimals);

  veDist.activePeriod = veDistCtr.activePeriod().toI32();
  veDist.timeCursor = veDistCtr.timeCursor().toI32();
  veDist.tokenLastBalance = formatUnits(veDistCtr.tokenLastBalance(), tokenDecimals);
  veDist.tokenBalance = formatUnits(tokenCtr.balanceOf(Address.fromString(veDist.id)), tokenDecimals);
  veDist.lastTokenTime = veDistCtr.lastTokenTime().toI32();

  const thisWeek = BigInt.fromI32(veDist.lastTokenTime).div(BigInt.fromString(WEEK.toString())).times(BigInt.fromString(WEEK.toString()));
  veDist.tokensPerWeek = formatUnits(veDistCtr.tokensPerWeek(thisWeek), tokenDecimals);
  veDist.left = veDist.tokensPerWeek.times(rewardPrice);

  const ve = VeTetuEntity.load(veDist.ve) as VeTetuEntity;
  veDist.apr = calculateApr(BigInt.fromI32(0), BigInt.fromString(WEEK.toString()), veDist.left, ve.lockedAmountUSD);

  veDist.save();
}

function saveRewardHistory(veNFT: VeNFTEntity, time: BigInt, claimed: BigDecimal, claimedUSD: BigDecimal): void {
  let history = VeNFTVeDistRewardHistory.load(veNFT.id + "_" + time.toString());
  if (!history) {
    history = new VeNFTVeDistRewardHistory(veNFT.id + "_" + time.toString());

    history.veNFT = veNFT.id;
    history.owner = (veNFT.user || ADDRESS_ZERO) as string;
    history.time = time.toI32();
    history.claimed = claimed;
    history.claimedUSD = claimedUSD;
    history.lockedAmountUSD = veNFT.lockedAmountUSD;
    history.apr = veNFT.veDistLastApr;

    history.save();
  }
}

function getOrCreateToken(tokenAdr: string): TokenEntity {
  let token = TokenEntity.load(tokenAdr);
  if (!token) {
    token = new TokenEntity(tokenAdr);
    const tokenCtr = VaultAbi.bind(Address.fromString(tokenAdr));

    token.symbol = tokenCtr.symbol();
    token.name = tokenCtr.name();
    token.decimals = tokenCtr.decimals();
    token.usdPrice = ZERO_BD;
  }
  return token;
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
    let token = getOrCreateToken(asset);
    token.usdPrice = formatUnits(p.value, decimals);
    token.save();
    return formatUnits(p.value, decimals);
  }
  log.error("=== FAILED GET PRICE === liquidator: {} asset: {}", [liquidatorAdr, asset]);
  return BigDecimal.fromString('0')
}
