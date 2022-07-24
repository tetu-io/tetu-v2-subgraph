// noinspection JSUnusedGlobalSymbols

import {
  Approval,
  ApprovalForAll,
  ContractInitialized,
  Deposit,
  Initialized, Merged,
  PawnshopWhitelisted,
  RevisionIncreased,
  Supply,
  Transfer, Upgraded, VeTetuAbi,
  Withdraw
} from "./types/templates/VeTetuTemplate/VeTetuAbi";
import {
  ControllerEntity,
  UserEntity,
  VeTetuEntity, VeTetuTokenEntity,
  VeUserEntity,
  VeUserTokenEntity,
  VeUserTokenHistory
} from "./types/schema";
import {Address, BigDecimal, BigInt, ByteArray, crypto, log} from "@graphprotocol/graph-ts";
import {ProxyAbi} from "./types/templates/VeTetuTemplate/ProxyAbi";
import {formatUnits, generateVeUserId, parseUnits} from "./helpers";
import {ADDRESS_ZERO, getUSDC} from "./constants";
import {VaultAbi} from "./types/templates/VeTetuTemplate/VaultAbi";
import {LiquidatorAbi} from "./types/templates/MultiGaugeTemplate/LiquidatorAbi";

// ***************************************************
//                   DEPOSIT/WITHDRAW
// ***************************************************

export function handleDeposit(event: Deposit): void {
  updateUser(
    event.params.tokenId,
    event.address.toHexString(),
    event.params.provider.toHexString(),
    event.block.timestamp,
    event.params.stakingToken.toHexString()
  );
  updateVeTokensInfo(event.address.toHexString());
}

export function handleWithdraw(event: Withdraw): void {
  updateUser(
    event.params.tokenId,
    event.address.toHexString(),
    event.params.provider.toHexString(),
    event.block.timestamp,
    event.params.stakingToken.toHexString()
  );
  updateVeTokensInfo(event.address.toHexString());
}

export function handleMerged(event: Merged): void {
  updateUser(
    event.params.from,
    event.address.toHexString(),
    event.params.provider.toHexString(),
    event.block.timestamp,
    event.params.stakingToken.toHexString()
  );
  updateVeTokensInfo(event.address.toHexString());
}

export function handleTransfer(event: Transfer): void {
  if (event.params.from.equals(Address.fromString(ADDRESS_ZERO))
    || event.params.to.equals(Address.fromString(ADDRESS_ZERO))) {
    // skip deposit/withdraw
    return
  }

  const veUser = getOrCreateVeUser(
    event.params.tokenId,
    event.params.from.toHexString(),
    event.address.toHexString()
  );
  // change user for ve token
  veUser.user = event.params.to.toHexString();
  veUser.save();

  // create user if not exist
  let user = UserEntity.load(event.params.to.toHexString());
  if (!user) {
    user = new UserEntity(event.params.to.toHexString());
    user.save();
  }
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
  userAdr: string,
  time: BigInt,
  token: string
): void {
  const ve = getOrCreateVe(veAdr);
  const controller = ControllerEntity.load(ve.controller) as ControllerEntity;
  const veCtr = VeTetuAbi.bind(Address.fromString(veAdr));
  const user = getOrCreateVeUser(veId, userAdr, veAdr);
  const tokenEntity = getOrCreateVeToken(user.id, veAdr, token);
  const decimals = BigInt.fromI32(tokenEntity.decimals)

  user.derivedAmount = formatUnits(veCtr.lockedDerivedAmount(veId), decimals);
  user.lockedEnd = veCtr.lockedEnd(veId).toI32();


  tokenEntity.amount = formatUnits(veCtr.lockedAmounts(veId, Address.fromString(token)), decimals);
  const tokenPrice = tryGetUsdPrice(controller.liquidator, token, decimals);
  ve.lockedAmountUSD = ve.lockedAmountUSD.minus(user.lockedAmountUSD);
  user.lockedAmountUSD = user.lockedAmountUSD.minus(tokenEntity.amountUSD);
  tokenEntity.amountUSD = tokenEntity.amount.times(tokenPrice);
  user.lockedAmountUSD = user.lockedAmountUSD.plus(tokenEntity.amountUSD);
  ve.lockedAmountUSD = ve.lockedAmountUSD.plus(user.lockedAmountUSD);

  saveTokenHistory(tokenEntity, time);

  tokenEntity.save();
  user.save();


  ve.count = veCtr.tokenId().toI32();
  ve.save();
}

function saveTokenHistory(token: VeUserTokenEntity, time: BigInt): void {
  let history = VeUserTokenHistory.load(token.id + time.toString());
  if (!history) {
    history = new VeUserTokenHistory(token.id + time.toString());
  } else {
    // already recorded in this block
    return;
  }

  history.veUserToken = token.id;
  history.time = time.toI32();
  history.token = token.token;
  history.amount = token.amount;
  history.amountUSD = token.amountUSD;

  history.save();
}

function getOrCreateVeToken(
  veUserId: string,
  veAdr: string,
  token: string
): VeUserTokenEntity {
  const tokenId = crypto.keccak256(ByteArray.fromUTF8(veUserId + token)).toHexString();
  let tokenEntity = VeUserTokenEntity.load(tokenId);
  if (!tokenEntity) {
    tokenEntity = new VeUserTokenEntity(tokenId);
    const tokenCtr = VaultAbi.bind(Address.fromString(token));
    tokenEntity.veUser = veUserId;
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
    tokenInfo.supply = formatUnits(veCtr.supply(token), tokenDecimals);

    tokenInfo.save();
  }

}

function getOrCreateVeUser(veId: BigInt, userAdr: string, veAdr: string): VeUserEntity {
  const veUserId = generateVeUserId(veId.toString(), veAdr);
  let veUser = VeUserEntity.load(veUserId);
  if (!veUser) {
    veUser = new VeUserEntity(veUserId);
    const veCtr = VeTetuAbi.bind(Address.fromString(veAdr))

    veUser.veId = veId.toI32();
    veUser.ve = veAdr;
    veUser.user = userAdr;
    veUser.derivedAmount = formatUnits(veCtr.lockedDerivedAmount(veId), BigInt.fromI32(18));
    veUser.lockedEnd = veCtr.lockedEnd(veId).toI32();
    veUser.attachments = veCtr.attachments(veId).toI32();
    veUser.voted = veCtr.voted(veId).toI32();


    veUser.veDistRewardsTotal = BigDecimal.fromString('0');
    veUser.veDistLastClaim = 0;
    veUser.lockedAmountUSD = BigDecimal.fromString('0');
    veUser.veDistLastApr = BigDecimal.fromString('0');

    let user = UserEntity.load(userAdr);
    if (!user) {
      user = new UserEntity(userAdr);
      user.save();
    }
  }
  return veUser;
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
    return formatUnits(p.value, decimals);
  }
  log.error("=== FAILED GET PRICE === liquidator: {} asset: {}", [liquidatorAdr, asset]);
  return BigDecimal.fromString('0')
}

