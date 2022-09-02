import {BigInt, ByteArray, crypto} from '@graphprotocol/graph-ts'
import {VeTetuTokenEntity} from "../types/schema";

export function generateVeNFTId(veId: string, veAdr: string): string {
  return crypto.keccak256(ByteArray.fromUTF8(veId + veAdr)).toHexString();
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

export function generatePlatformVoteEntityId(voterAdr: string, veId: BigInt, voteType: string, target: string): string {
  return crypto.keccak256(ByteArray.fromUTF8(voterAdr + veId.toString() + voteType + target)).toHexString();
}

export function generateVeTetuTokenEntityId(veAdr: string, tokenAdr: string): string {
  return crypto.keccak256(ByteArray.fromUTF8(veAdr + tokenAdr)).toHexString();
}
