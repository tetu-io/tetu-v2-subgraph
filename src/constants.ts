import {Address, BigDecimal, BigInt, dataSource, log} from "@graphprotocol/graph-ts";

export const ADDRESS_ZERO = '0x0000000000000000000000000000000000000000'
export let ZERO_BD = BigDecimal.fromString('0')
export let ZERO_BI = BigInt.fromI32(0)
export let ONE_BI = BigInt.fromI32(1)
export let DAY = BigDecimal.fromString('86400')
export let WEEK = DAY.times(BigDecimal.fromString('7'));
export let REWARD_TOKEN_DECIMALS = BigInt.fromI32(18)
export let CONTROLLER_TIME_LOCK = BigInt.fromI32(60 * 60 * 18)
export let RATIO_DENOMINATOR = BigInt.fromI32(100_000)

export function getUSDC(): Address {
  if (dataSource.network() == 'fuji') {
    return Address.fromString("0x0C27719A3EdC8F3F1E530213c33548456f379892");
  }
  log.critical("WRONG_NETWORK {}", [dataSource.network()]);
  return Address.fromString(ADDRESS_ZERO)
}
