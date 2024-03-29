import {Address, BigDecimal, BigInt, log} from '@graphprotocol/graph-ts'
import {ADDRESS_ZERO, DAY, getUSDC, HUNDRED_BD, ONE_BI, YEAR, ZERO_BD, ZERO_BI} from '../constants';
import {TokenEntity} from "../types/schema";
import {VaultAbi} from "../common/VaultAbi";
import {LiquidatorAbi} from "../common/LiquidatorAbi";
import {PriceCalculatorAbi} from "../common/PriceCalculatorAbi";


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

export function calculateCompoundApr(
  sharePriceDiff: BigDecimal,
  prevSharePrice: BigDecimal,
  timeDiff: BigDecimal
): BigDecimal {
  if (prevSharePrice.le(BigDecimal.zero()) || timeDiff.le(BigDecimal.zero())) {
    return ZERO_BD;
  }
  return (sharePriceDiff.div(prevSharePrice).times(YEAR).times(HUNDRED_BD)).div(timeDiff)
}

export function getPrice(
  liquidator: LiquidatorAbi,
  tokenIn: string,
  tokenOut: string,
  amount: BigInt
): BigInt {
  // const tokenCtr = VaultAbi.bind(Address.fromString(tokenOut));
  // const tokenDecimals = BigInt.fromI32(tokenCtr.decimals());
  // return formatUnits(liquidator.try_getPrice(Address.fromString(tokenIn), Address.fromString(tokenOut), amount).value, tokenDecimals)
  return liquidator.try_getPrice(Address.fromString(tokenIn), Address.fromString(tokenOut), amount).value
}

export function tryGetUsdPrice(
  liquidator: LiquidatorAbi,
  priceCalculator: PriceCalculatorAbi | null,
  tokenCtr: VaultAbi,
  decimals: BigInt
): BigDecimal {
  if (getUSDC().equals(Address.fromString(tokenCtr._address.toHexString()))) {
    getOrCreateToken(tokenCtr);
    return BigDecimal.fromString('1');
  }
  const liquidatorPrice = liquidator.try_getPrice(
    Address.fromString(tokenCtr._address.toHexString()),
    getUSDC(),
    parseUnits(BigDecimal.fromString('1'), decimals)
  );

  if (!liquidatorPrice.reverted) {
    let token = getOrCreateToken(tokenCtr);
    if (!liquidatorPrice.value.isZero()) {
      token.usdPrice = formatUnits(liquidatorPrice.value, BigInt.fromI32(6));
      token.save();
      return token.usdPrice;
    }
  }

  if (priceCalculator !== null && priceCalculator._address.notEqual(Address.fromString(ADDRESS_ZERO))) {
    const calculatorPrice = priceCalculator.try_getPriceWithDefaultOutput(
      Address.fromString(tokenCtr._address.toHexString()),
    );

    if (!calculatorPrice.reverted) {
      let token = getOrCreateToken(tokenCtr);
      token.usdPrice = formatUnits(calculatorPrice.value, BigInt.fromI32(18));
      token.save();
      return token.usdPrice;
    }
  }

  log.error("=== FAILED GET PRICE === liquidator: {} priceCalculator: {} asset: {}",
    [liquidator._address.toHexString(), priceCalculator ? priceCalculator._address.toHexString() : '', tokenCtr._address.toHexString()]);
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
