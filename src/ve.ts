// noinspection JSUnusedGlobalSymbols

import {
  Deposit,
  Merged,
  PawnshopWhitelisted,
  RevisionIncreased,
  Transfer,
  Upgraded,
  VeTetuAbi,
  Withdraw
} from "./types/templates/VeTetuTemplate/VeTetuAbi";
import {
  ControllerEntity,
  UserEntity,
  VeNFTEntity,
  VeNFTTokenEntity,
  VeNFTTokenHistory,
  VeTetuEntity,
  VeTetuTokenEntity
} from "./types/schema";
import {Address, BigDecimal, BigInt, ByteArray, crypto} from "@graphprotocol/graph-ts";
import {ProxyAbi} from "./types/templates/VeTetuTemplate/ProxyAbi";
import {formatUnits, generateVeNFTId, parseUnits, tryGetUsdPrice} from "./helpers";
import {ADDRESS_ZERO} from "./constants";
import {VaultAbi} from "./types/templates/VeTetuTemplate/VaultAbi";
import {LiquidatorAbi} from "./types/templates/VeTetuTemplate/LiquidatorAbi";
import {LiquidatorAbi as LiquidatorAbiCommon} from "./common/LiquidatorAbi";
import {VaultAbi as VaultAbiCommon} from "./common/VaultAbi";

// ***************************************************
//                   DEPOSIT/WITHDRAW
// ***************************************************

export function handleDeposit(event: Deposit): void {
  updateUser(
    event.params.tokenId,
    event.address.toHexString(),
    event.block.timestamp,
    event.params.stakingToken.toHexString()
  );
  updateVeTokensInfo(event.address.toHexString());
}

export function handleWithdraw(event: Withdraw): void {
  updateUser(
    event.params.tokenId,
    event.address.toHexString(),
    event.block.timestamp,
    event.params.stakingToken.toHexString()
  );
  updateVeTokensInfo(event.address.toHexString());
}

export function handleMerged(event: Merged): void {
  updateUser(
    event.params.from,
    event.address.toHexString(),
    event.block.timestamp,
    event.params.stakingToken.toHexString()
  );
  updateVeTokensInfo(event.address.toHexString());
}

export function handleTransfer(event: Transfer): void {
  const veNFT = getOrCreateVeNFT(
    event.params.tokenId,
    event.address.toHexString()
  );
  // change user for ve token
  updateVeNftUser(veNFT, event.params.to.toHexString());
  veNFT.save();
}


// ***************************************************
//                   STATE CHANGES
// ***************************************************

export function handlePawnshopWhitelisted(event: PawnshopWhitelisted): void {
  const ve = getOrCreateVe(event.address.toHexString());
  const arr = ve.allowedPawnshops;
  const pawnshop = event.params.value;

  let found = false;
  for (let i = 0; i < arr.length; i++) {
    if (Address.fromString(arr[i]).equals(pawnshop)) {
      found = true;
    }
  }

  // add only unique values
  if (!found) {
    arr.push(pawnshop.toHexString());
    ve.allowedPawnshops = arr;
    ve.save();
  }
}

export function handleRevisionIncreased(event: RevisionIncreased): void {
  const ve = getOrCreateVe(event.address.toHexString());
  ve.revision = event.params.value.toI32();
  ve.save();
}


export function handleUpgraded(event: Upgraded): void {
  const ve = getOrCreateVe(event.address.toHexString());
  const implementations = ve.implementations;
  implementations.push(event.params.implementation.toHexString())
  ve.implementations = implementations;
  ve.save()
}

// ***************************************************
//                     HELPERS
// ***************************************************

function updateUser(
  veId: BigInt,
  veAdr: string,
  time: BigInt,
  token: string
): void {
  const ve = getOrCreateVe(veAdr);
  const veCtr = VeTetuAbi.bind(Address.fromString(veAdr));
  const veNFT = getOrCreateVeNFT(veId, veAdr);

  if (token != ADDRESS_ZERO) {
    const controller = ControllerEntity.load(ve.controller) as ControllerEntity;
    const tokenEntity = getOrCreateVeToken(veNFT.id, veAdr, token);
    const decimals = BigInt.fromI32(tokenEntity.decimals)
    veNFT.derivedAmount = formatUnits(veCtr.lockedDerivedAmount(veId), decimals);
    const tokenPrice = _tryGetUsdPrice(controller.liquidator, token, decimals);
    tokenEntity.amount = formatUnits(veCtr.lockedAmounts(veId, Address.fromString(token)), decimals);
    tokenEntity.amountUSD = tokenEntity.amount.times(tokenPrice);
    saveTokenHistory(tokenEntity, time);
    tokenEntity.save();

    ve.lockedAmountUSD = ve.lockedAmountUSD.minus(veNFT.lockedAmountUSD);
    veNFT.lockedAmountUSD = veNFT.lockedAmountUSD.minus(tokenEntity.amountUSD);
    veNFT.lockedAmountUSD = veNFT.lockedAmountUSD.plus(tokenEntity.amountUSD);
    ve.lockedAmountUSD = ve.lockedAmountUSD.plus(veNFT.lockedAmountUSD);
  }

  veNFT.lockedEnd = veCtr.lockedEnd(veId).toI32();
  veNFT.save();

  ve.count = veCtr.tokenId().toI32();
  ve.save();
}

function saveTokenHistory(token: VeNFTTokenEntity, time: BigInt): void {
  let history = VeNFTTokenHistory.load(token.id + time.toString());
  if (!history) {
    history = new VeNFTTokenHistory(token.id + time.toString());
  } else {
    // already recorded in this block
    return;
  }

  history.veNFTToken = token.id;
  history.time = time.toI32();
  history.token = token.token;
  history.amount = token.amount;
  history.amountUSD = token.amountUSD;

  history.save();
}

function getOrCreateVeToken(
  veNFTId: string,
  veAdr: string,
  token: string
): VeNFTTokenEntity {
  const tokenId = crypto.keccak256(ByteArray.fromUTF8(veNFTId + token)).toHexString();
  let tokenEntity = VeNFTTokenEntity.load(tokenId);
  if (!tokenEntity) {
    tokenEntity = new VeNFTTokenEntity(tokenId);
    const tokenCtr = VaultAbi.bind(Address.fromString(token));
    tokenEntity.veNFT = veNFTId;
    tokenEntity.token = token;
    tokenEntity.decimals = tokenCtr.decimals();
    tokenEntity.amount = BigDecimal.fromString('0');
    tokenEntity.amountUSD = BigDecimal.fromString('0');
  }

  return tokenEntity;
}

function getOrCreateVe(address: string): VeTetuEntity {
  let ve = VeTetuEntity.load(address);
  if (!ve) {
    ve = new VeTetuEntity(address);
    const veCtr = VeTetuAbi.bind(Address.fromString(address))
    const proxy = ProxyAbi.bind(Address.fromString(address))

    ve.version = veCtr.VE_VERSION();
    ve.revision = veCtr.revision().toI32()
    ve.createdTs = veCtr.created().toI32()
    ve.createdBlock = veCtr.createdBlock().toI32()
    ve.implementations = [proxy.implementation().toHexString()]
    ve.count = veCtr.tokenId().toI32();
    ve.epoch = veCtr.epoch().toI32();
    ve.allowedPawnshops = [];
  }
  return ve;
}

function updateVeTokensInfo(ve: string): void {
  const veCtr = VeTetuAbi.bind(Address.fromString(ve));
  const length = veCtr.tokensLength().toI32()
  const weightDenominator = parseUnits(BigDecimal.fromString('100'), BigInt.fromI32(18)).toBigDecimal();

  for (let i = 0; i < length; i++) {
    const token = veCtr.tokens(BigInt.fromI32(i));

    const tokenInfoId = crypto.keccak256(ByteArray.fromUTF8(ve + token.toHexString())).toHexString();
    let tokenInfo = VeTetuTokenEntity.load(tokenInfoId);
    if (!tokenInfo) {
      tokenInfo = new VeTetuTokenEntity(tokenInfoId);
      tokenInfo.ve = ve;
      tokenInfo.address = token.toHexString();
    }

    const tokenCtr = VaultAbi.bind(token);
    const tokenDecimals = BigInt.fromI32(tokenCtr.decimals());

    tokenInfo.weight = veCtr.tokenWeights(token).toBigDecimal().div(weightDenominator);
    tokenInfo.supply = formatUnits(tokenCtr.balanceOf(Address.fromString(ve)), tokenDecimals);

    tokenInfo.save();
  }

}

function getOrCreateVeNFT(veId: BigInt, veAdr: string): VeNFTEntity {
  const veNftId = generateVeNFTId(veId.toString(), veAdr);
  let veNFT = VeNFTEntity.load(veNftId);
  if (!veNFT) {
    veNFT = new VeNFTEntity(veNftId);
    const veCtr = VeTetuAbi.bind(Address.fromString(veAdr))

    veNFT.veId = veId.toI32();
    veNFT.ve = veAdr;
    veNFT.derivedAmount = formatUnits(veCtr.lockedDerivedAmount(veId), BigInt.fromI32(18));
    veNFT.lockedEnd = veCtr.lockedEnd(veId).toI32();
    veNFT.attachments = veCtr.attachments(veId).toI32();
    veNFT.voted = veCtr.voted(veId).toI32();


    veNFT.veDistRewardsTotal = BigDecimal.fromString('0');
    veNFT.veDistLastClaim = 0;
    veNFT.lockedAmountUSD = BigDecimal.fromString('0');
    veNFT.veDistLastApr = BigDecimal.fromString('0');
  }
  return veNFT;
}

function updateVeNftUser(veNFT: VeNFTEntity, userAdr: string): void {
  veNFT.user = userAdr;

  let user = UserEntity.load(userAdr);
  if (!user) {
    user = new UserEntity(userAdr);
    user.save();
  }
}

function _tryGetUsdPrice(
  liquidatorAdr: string,
  asset: string,
  decimals: BigInt
): BigDecimal {
  return tryGetUsdPrice(
    changetype<LiquidatorAbiCommon>(LiquidatorAbi.bind(Address.fromString(liquidatorAdr))),
    changetype<VaultAbiCommon>(VaultAbi.bind(Address.fromString(asset))),
    decimals
  );
}

