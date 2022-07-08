import {BigDecimal, BigInt, ByteArray, crypto} from '@graphprotocol/graph-ts'
import {DAY, ONE_BI, ZERO_BI} from "./constants";


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
  return profitUSD.div(supplyUSD).div(period.div(DAY)).times(BigDecimal.fromString('36500'));
}

// ********************************************************
//                 ID GENERATION
// ********************************************************

export function generateVeUserId(veId: string, userAdr: string, veAdr: string): string {
  return crypto.keccak256(ByteArray.fromUTF8(veId + userAdr + veAdr)).toHexString();
}

export function generateGaugeVaultId(vaultAdr: string, gaugeAdr: string): string {
  return crypto.keccak256(ByteArray.fromUTF8(vaultAdr + gaugeAdr)).toHexString();
}

export function generateTetuVoterUserId(veId: string, voterAdr: string): string {
  return crypto.keccak256(ByteArray.fromUTF8(veId + voterAdr)).toHexString();
}

export function generateTetuVoterUserVoteId(voterUserId: string, vaultVoteId: string): string {
  return crypto.keccak256(ByteArray.fromUTF8(voterUserId + vaultVoteId)).toHexString();
}

export function generateVaultVoteEntityId(tetuVoterId: string, vaultAdr: string): string {
  return crypto.keccak256(ByteArray.fromUTF8(tetuVoterId + vaultAdr)).toHexString();
}

export function generateBribeVaultId(vaultAdr: string, bribeAdr: string): string {
  return crypto.keccak256(ByteArray.fromUTF8(vaultAdr + bribeAdr)).toHexString();
}

export function generateBribeVaultRewardId(bribeVaultId: string, rewardTokenAdr: string): string {
  return crypto.keccak256(ByteArray.fromUTF8(bribeVaultId + rewardTokenAdr)).toHexString();
}

export function generateVeBribeId(bribeVaultId: string, veId: BigInt): string {
  return crypto.keccak256(ByteArray.fromUTF8(bribeVaultId + veId.toString())).toHexString();
}

export function generateVeBribeRewardId(veBribeId: string, rewardTokenAdr: string): string {
  return crypto.keccak256(ByteArray.fromUTF8(veBribeId + rewardTokenAdr)).toHexString();
}
