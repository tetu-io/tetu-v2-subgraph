import {Address, BigDecimal, BigInt, ByteArray, crypto, log} from '@graphprotocol/graph-ts'
import {DAY, getUSDC, ONE_BI, ZERO_BD, ZERO_BI} from "../constants";
import {TokenEntity} from "../types/schema";
import {VaultAbi} from "../common/VaultAbi";
import {LiquidatorAbi} from "../common/LiquidatorAbi";


export function exponentToBigDecimal(decimals: BigInt): BigDecimal {
  let bd = BigDecimal.fromString('1')
  for (let i = ZERO_BI; i.lt(decimals as BigInt); i = i.plus(ONE_BI)) {
    bd = bd.times(BigDecimal.fromString('10'))
  }
  return bd
}

export function formatUnits(amount: BigInt, decimals: BigInt): BigDecimal {
  return amount.toBigDecimal().div(exponentToBigDecimal(decimals))
}

export function parseUnits(amount: BigDecimal, decimals: BigInt): BigInt {
  if (decimals == ZERO_BI) {
    return BigInt.fromString(amount.toString());
  }
  return BigInt.fromString(amount.times(exponentToBigDecimal(decimals)).toString())
}

export function calculateApr(
  timeStart: BigInt,
  timeEnd: BigInt,
  profitUSD: BigDecimal,
  supplyUSD: BigDecimal,
): BigDecimal {
  const period = timeEnd.minus(timeStart).toBigDecimal();
  if (period.le(ZERO_BD) || supplyUSD.le(ZERO_BD)) {
    return ZERO_BD;
  }
  return profitUSD.div(supplyUSD).div(period.div(DAY)).times(BigDecimal.fromString('36500'));
}

export function tryGetUsdPrice(
  liquidator: LiquidatorAbi,
  tokenCtr: VaultAbi,
  decimals: BigInt
): BigDecimal {
  if (getUSDC().equals(Address.fromString(tokenCtr._address.toHexString()))) {
    getOrCreateToken(tokenCtr);
    return BigDecimal.fromString('1');
  }
  const p = liquidator.try_getPrice(
    Address.fromString(tokenCtr._address.toHexString()),
    getUSDC(),
    parseUnits(BigDecimal.fromString('1'), decimals)
  );
  if (!p.reverted) {
    let token = getOrCreateToken(tokenCtr);
    token.usdPrice = formatUnits(p.value, decimals);
    token.save();
    return formatUnits(p.value, decimals);
  }
  log.error("=== FAILED GET PRICE === liquidator: {} asset: {}",
    [liquidator._address.toHexString(), tokenCtr._address.toHexString()]);
  return BigDecimal.fromString('0')
}

export function getOrCreateToken(tokenCtr: VaultAbi): TokenEntity {
  let token = TokenEntity.load(tokenCtr._address.toHexString());
  if (!token) {
    const isUSDC = getUSDC().equals(Address.fromString(tokenCtr._address.toHexString()));
    token = new TokenEntity(tokenCtr._address.toHexString());
    token.symbol = tokenCtr.symbol();
    token.name = tokenCtr.name();
    token.decimals = tokenCtr.decimals();
    token.usdPrice = isUSDC ? BigDecimal.fromString('1') : ZERO_BD;
    token.save();
  }
  return token;
}
