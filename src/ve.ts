// noinspection JSUnusedGlobalSymbols

import {
  Deposit,
  Merged,
  RevisionIncreased,
  Split,
  Transfer,
  TransferWhitelisted,
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
import {formatUnits, getOrCreateToken, parseUnits, tryGetUsdPrice} from "./helpers/common-helper";
import {ADDRESS_ZERO, getPriceCalculator} from "./constants";
import {LiquidatorAbi} from "./types/templates/VeTetuTemplate/LiquidatorAbi";
import {LiquidatorAbi as LiquidatorAbiCommon} from "./common/LiquidatorAbi";
import {VaultAbi as VaultAbiCommon} from "./common/VaultAbi";
import {generateVeNFTId} from "./helpers/id-helper";
import {getOrCreateVe, getOrCreateVeTetuTokenEntity} from "./helpers/ve-helper";
import {VeTetuAbi as VeTetuAbiCommon} from "./common/VeTetuAbi";
import {ProxyAbi as ProxyAbiCommon} from "./common/ProxyAbi";
import {PriceCalculatorAbi as PriceCalculatorAbiCommon} from "./common/PriceCalculatorAbi";
import {PriceCalculatorAbi} from "./types/templates/VeTetuTemplate/PriceCalculatorAbi";
import {VaultAbi} from "./types/templates/VeTetuTemplate/VaultAbi";

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
  updateUser(
    event.params.to,
    event.address.toHexString(),
    event.block.timestamp,
    event.params.stakingToken.toHexString()
  );
  updateVeTokensInfo(event.address.toHexString());
}

export function handleSplit(event: Split): void {
  updateUser(
    event.params.parentTokenId,
    event.address.toHexString(),
    event.block.timestamp,
    ADDRESS_ZERO
  );
  updateUser(
    event.params.newTokenId,
    event.address.toHexString(),
    event.block.timestamp,
    ADDRESS_ZERO
  );
  const veAdr = event.address.toHexString()
  const time = event.block.timestamp
  const ve = _getOrCreateVe(veAdr);
  const veCtr = VeTetuAbi.bind(Address.fromString(veAdr));

  updateStakingTokenInfoForAll(
    veAdr,
    event.params.parentTokenId,
    time,
    ve,
    getOrCreateVeNFT(event.params.parentTokenId, veAdr),
    veCtr
  );

  updateStakingTokenInfoForAll(
    veAdr,
    event.params.newTokenId,
    time,
    ve,
    getOrCreateVeNFT(event.params.newTokenId, veAdr),
    veCtr
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

export function handleTransferWhitelisted(event: TransferWhitelisted): void {
  const ve = _getOrCreateVe(event.address.toHexString());
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
  const ve = _getOrCreateVe(event.address.toHexString());
  ve.revision = event.params.value.toI32();

  const ctr = VeTetuAbi.bind(event.address);
  const v = ctr.try_VE_VERSION();
  if (!v.reverted) {
    ve.version = v.value;
  }

  ve.save();
}


export function handleUpgraded(event: Upgraded): void {
  const ve = _getOrCreateVe(event.address.toHexString());
  const implementations = ve.implementations;
  implementations.push(event.params.implementation.toHexString())
  ve.implementations = implementations;
  ve.save()
}

// ***************************************************
//                     HELPERS
// ***************************************************


function updateStakingTokenInfoForAll(
  veAdr: string,
  veId: BigInt,
  time: BigInt,
  ve: VeTetuEntity,
  veNFT: VeNFTEntity,
  veCtr: VeTetuAbi
): void {
  const length = veCtr.tokensLength().toI32()
  for (let i = 0; i < length; i++) {
    const token = veCtr.tokens(BigInt.fromI32(i));
    updateStakingTokenInfo(
      veAdr,
      veId,
      time,
      token.toHexString(),
      ve,
      veNFT,
      veCtr
    )
  }
  ve.save();
  veNFT.save();
}

function updateStakingTokenInfo(
  veAdr: string,
  veId: BigInt,
  time: BigInt,
  token: string,
  ve: VeTetuEntity,
  veNFT: VeNFTEntity,
  veCtr: VeTetuAbi
): void {
  getOrCreateVeTetuTokenEntity(ve.id, Address.fromString(token));
  const controller = ControllerEntity.load(ve.controller) as ControllerEntity;
  const tokenEntity = getOrCreateVeToken(veNFT.id, veAdr, token);

  // minus old value
  ve.lockedAmountUSD = ve.lockedAmountUSD.minus(veNFT.lockedAmountUSD);
  veNFT.lockedAmountUSD = veNFT.lockedAmountUSD.minus(tokenEntity.amountUSD);

  const decimals = BigInt.fromI32(tokenEntity.decimals)
  veNFT.derivedAmount = formatUnits(veCtr.lockedDerivedAmount(veId), decimals);
  const tokenPrice = _tryGetUsdPrice(controller.liquidator, token, decimals);
  tokenEntity.amount = formatUnits(veCtr.lockedAmounts(veId, Address.fromString(token)), decimals);
  tokenEntity.amountUSD = tokenEntity.amount.times(tokenPrice);
  saveTokenHistory(tokenEntity, time);
  tokenEntity.save();

  // plus new amount
  veNFT.lockedAmountUSD = veNFT.lockedAmountUSD.plus(tokenEntity.amountUSD);
  ve.lockedAmountUSD = ve.lockedAmountUSD.plus(veNFT.lockedAmountUSD);
}

function updateUser(
  veId: BigInt,
  veAdr: string,
  time: BigInt,
  token: string
): void {
  const ve = _getOrCreateVe(veAdr);
  const veCtr = VeTetuAbi.bind(Address.fromString(veAdr));
  const veNFT = getOrCreateVeNFT(veId, veAdr);

  if (token != ADDRESS_ZERO) {
    updateStakingTokenInfo(
      veAdr,
      veId,
      time,
      token,
      ve,
      veNFT,
      veCtr
    );
  }

  veNFT.lockedEnd = veCtr.lockedEnd(veId).toI32();
  veNFT.save();

  ve.totalSupply = formatUnits(veCtr.totalSupply(), BigInt.fromI32(18));
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
    tokenEntity.save();
  }

  return tokenEntity;
}

function _getOrCreateVe(veAdr: string): VeTetuEntity {
  return getOrCreateVe(
    changetype<VeTetuAbiCommon>(VeTetuAbi.bind(Address.fromString(veAdr))),
    changetype<ProxyAbiCommon>(ProxyAbi.bind(Address.fromString(veAdr))),
  );
}

function updateVeTokensInfo(ve: string): void {
  const veCtr = VeTetuAbi.bind(Address.fromString(ve));
  const length = veCtr.tokensLength().toI32()
  const weightDenominator = parseUnits(BigDecimal.fromString('1'), BigInt.fromI32(18)).toBigDecimal();

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

    const tokenEntity = getOrCreateToken(VaultAbiCommon.bind(token));
    tokenInfo.token = tokenEntity.id;

    tokenInfo.save();
  }

}

function getOrCreateVeNFT(veId: BigInt, veAdr: string): VeNFTEntity {
  const veNftId = generateVeNFTId(veId.toString(), veAdr);
  let veNFT = VeNFTEntity.load(veNftId);
  if (!veNFT) {
    veNFT = new VeNFTEntity(veNftId);
    const veCtr = VeTetuAbi.bind(Address.fromString(veAdr))

    veNFT.veNFTId = veId.toI32();
    veNFT.ve = veAdr;
    veNFT.derivedAmount = formatUnits(veCtr.lockedDerivedAmount(veId), BigInt.fromI32(18));
    veNFT.lockedEnd = veCtr.lockedEnd(veId).toI32();
    veNFT.attachments = veCtr.attachments(veId).toI32();
    veNFT.voted = veCtr.voted(veId).toI32();


    veNFT.veDistRewardsTotal = BigDecimal.fromString('0');
    veNFT.veDistLastClaim = 0;
    veNFT.lockedAmountUSD = BigDecimal.fromString('0');
    veNFT.veDistLastApr = BigDecimal.fromString('0');
    veNFT.save();
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
    changetype<PriceCalculatorAbiCommon>(PriceCalculatorAbi.bind(getPriceCalculator())),
    changetype<VaultAbiCommon>(VaultAbi.bind(Address.fromString(asset))),
    decimals
  );
}

