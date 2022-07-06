import {BigDecimal, BigInt, ByteArray, crypto} from '@graphprotocol/graph-ts'
import {ONE_BI, ZERO_BI} from "./constants";


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

export function generateVeUserId(veId: string, userAdr: string, veAdr: string): string {
  return crypto.keccak256(ByteArray.fromUTF8(veId + userAdr + veAdr)).toHexString();
}

export function generateGaugeVaultId(vaultAdr: string, gaugeAdr: string): string {
  return crypto.keccak256(ByteArray.fromUTF8(vaultAdr + gaugeAdr)).toHexString();
}
