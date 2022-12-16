import {VeTetuEntity, VeTetuTokenEntity} from "../types/schema";
import {Address, BigDecimal, BigInt} from "@graphprotocol/graph-ts";
import {VeTetuTemplate} from "../types/templates";
import {ZERO_BD} from "../constants";
import {ProxyAbi} from "../common/ProxyAbi";
import {VeTetuAbi} from "../common/VeTetuAbi";
import {generateVeTetuTokenEntityId} from "./id-helper";
import {getOrCreateToken} from "./common-helper";
import {VaultAbi} from "../common/VaultAbi";

export function getOrCreateVe(veCtr: VeTetuAbi, proxy: ProxyAbi): VeTetuEntity {
  let ve = VeTetuEntity.load(veCtr._address.toHexString());
  if (!ve) {
    ve = new VeTetuEntity(veCtr._address.toHexString());

    ve.version = veCtr.VE_VERSION();
    ve.revision = veCtr.revision().toI32()
    ve.createdTs = veCtr.created().toI32()
    ve.createdBlock = veCtr.createdBlock().toI32()
    ve.implementations = [proxy.implementation().toHexString()]
    ve.controller = veCtr.controller().toHexString()
    ve.count = veCtr.tokenId().toI32();
    ve.epoch = veCtr.epoch().toI32();
    ve.allowedPawnshops = []
    ve.lockedAmountUSD = BigDecimal.fromString('0');
    ve.totalSupply = BigDecimal.fromString('0');

    VeTetuTemplate.create(Address.fromString(veCtr._address.toHexString()));
    ve.save();

    const tokenAdr = veCtr.tokens(BigInt.fromI32(0));
    getOrCreateVeTetuTokenEntity(ve.id, tokenAdr);
  }
  return ve;
}

export function getOrCreateVeTetuTokenEntity(veId: string, tokenAdr: Address): VeTetuTokenEntity {
  getOrCreateToken(VaultAbi.bind(tokenAdr))
  const tokenInfoId = generateVeTetuTokenEntityId(veId, tokenAdr.toHexString());
  let tokenInfo = VeTetuTokenEntity.load(tokenInfoId);
  if (!tokenInfo) {
    tokenInfo = new VeTetuTokenEntity(tokenInfoId);
    tokenInfo.ve = veId;
    tokenInfo.address = tokenAdr.toHexString();
    tokenInfo.weight = ZERO_BD;
    tokenInfo.supply = ZERO_BD;
    tokenInfo.save();
  }

  return tokenInfo;
}
