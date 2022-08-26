// noinspection JSUnusedGlobalSymbols

import {
  ContractInitialized,
  Distributed,
  GaugeRatioChanged,
  Initialized,
  InvestFundRatioChanged,
  RevisionIncreased,
  SlippageChanged,
  TetuThresholdChanged
} from "./types/templates/ForwarderTemplate/ForwarderAbi";
import {
  ForwarderDistribution,
  ForwarderEntity,
  ForwarderTokenInfo,
  InvestFundBalance,
  InvestFundBalanceHistory,
  InvestFundEntity,
  TetuVoterEntity,
  TetuVoterRewardHistory,
  TokenEntity,
  VeDistBalance,
  VeDistEntity
} from "./types/schema";
import {Address, BigDecimal, BigInt, log} from "@graphprotocol/graph-ts";
import {ForwarderAbi} from "./types/ControllerData/ForwarderAbi";
import {ProxyAbi} from "./types/ControllerData/ProxyAbi";
import {formatUnits, parseUnits} from "./helpers";
import {VaultAbi} from "./types/templates/ForwarderTemplate/VaultAbi";
import {ControllerAbi} from "./types/templates/ForwarderTemplate/ControllerAbi";
import {getUSDC, ZERO_BD} from "./constants";
import {LiquidatorAbi} from "./types/templates/MultiGaugeTemplate/LiquidatorAbi";

// ***************************************************
//                 STATE CHANGES
// ***************************************************

export function handleGaugeRatioChanged(event: GaugeRatioChanged): void {
  const forwarder = ForwarderEntity.load(event.address.toHexString()) as ForwarderEntity;
  const forwarderCtr = ForwarderAbi.bind(event.address);
  const denominator = forwarderCtr.RATIO_DENOMINATOR().toBigDecimal();
  forwarder.toGaugesRatio = event.params.newValue.toBigDecimal().times(BigDecimal.fromString('100')).div(denominator);
  forwarder.save();
}

export function handleInvestFundRatioChanged(event: InvestFundRatioChanged): void {
  const forwarder = ForwarderEntity.load(event.address.toHexString()) as ForwarderEntity;
  const forwarderCtr = ForwarderAbi.bind(event.address);
  const denominator = forwarderCtr.RATIO_DENOMINATOR().toBigDecimal();
  forwarder.toInvestFundRatio = event.params.newValue.toBigDecimal().times(BigDecimal.fromString('100')).div(denominator);
  forwarder.save();
}

export function handleRevisionIncreased(event: RevisionIncreased): void {
  const forwarder = ForwarderEntity.load(event.address.toHexString()) as ForwarderEntity;
  forwarder.revision = event.params.value.toI32();
  forwarder.save();
}

export function handleSlippageChanged(event: SlippageChanged): void {
  let tokenInfo = getOrCreateForwarderTokenInfo(event.params.token.toHexString(), event.address.toHexString());
  tokenInfo.slippage = event.params.value.toBigDecimal();
  tokenInfo.lastUpdate = event.block.timestamp.toI32();
  tokenInfo.save();
}

export function handleTetuThresholdChanged(event: TetuThresholdChanged): void {
  const forwarder = ForwarderEntity.load(event.address.toHexString()) as ForwarderEntity;
  forwarder.toInvestFundRatio = formatUnits(event.params.newValue, BigInt.fromI32(18));
  forwarder.save();
}

// ***************************************************
//                   ACTIONS
// ***************************************************

export function handleDistributed(event: Distributed): void {
  const distribution = new ForwarderDistribution(event.transaction.hash.toHexString() + "_" + event.logIndex.toString());

  const forwarderCtr = ForwarderAbi.bind(event.address);
  const controllerCtr = ControllerAbi.bind(forwarderCtr.controller());
  const tokenCtr = VaultAbi.bind(event.params.token);
  const tetuAdr = forwarderCtr.tetu();
  const tokenDecimals = BigInt.fromI32(tokenCtr.decimals());
  const liquidatorAdr = controllerCtr.liquidator().toHexString();
  const tetuPrice = tryGetUsdPrice(liquidatorAdr, tetuAdr.toHexString(), BigInt.fromI32(18))

  distribution.forwarder = event.address.toHexString();
  distribution.time = event.block.timestamp.toI32();
  distribution.sender = event.params.sender.toHexString()
  distribution.token = event.params.token.toHexString()
  distribution.balance = formatUnits(event.params.balance, tokenDecimals);
  distribution.tetuValue = formatUnits(event.params.tetuValue, BigInt.fromI32(18));
  distribution.usdValue = distribution.tetuValue.times(tetuPrice);
  distribution.tetuBalance = formatUnits(event.params.tetuBalance, BigInt.fromI32(18));
  distribution.toInvestFund = formatUnits(event.params.toInvestFund, BigInt.fromI32(18));
  distribution.toGauges = formatUnits(event.params.toGauges, BigInt.fromI32(18));
  distribution.toVeTetu = formatUnits(event.params.toVeTetu, BigInt.fromI32(18));
  distribution.save();

  // *** TOKEN BALANCE
  let tokenInfo = getOrCreateForwarderTokenInfo(event.params.token.toHexString(), event.address.toHexString());
  tokenInfo.balance = formatUnits(tokenCtr.balanceOf(event.address), tokenDecimals);
  tokenInfo.lastUpdate = event.block.timestamp.toI32();
  tokenInfo.save();

  // *** FORWARDER TOTALS
  const forwarder = ForwarderEntity.load(event.address.toHexString()) as ForwarderEntity;
  forwarder.toInvestFundTotal = forwarder.toInvestFundTotal.plus(distribution.toInvestFund);
  forwarder.toGaugesTotal = forwarder.toGaugesTotal.plus(distribution.toGauges);
  forwarder.toVeTetuTotal = forwarder.toVeTetuTotal.plus(distribution.toVeTetu);
  forwarder.save();

  // *** INVEST FUND BALANCE CHANGE
  const investFundAdr = controllerCtr.investFund();
  const investFundBalance = loadInvestFundBalance(investFundAdr.toHexString(), tetuAdr.toHexString());
  investFundBalance.amount = investFundBalance.amount.plus(formatUnits(event.params.toInvestFund, BigInt.fromI32(18)))
  saveInvestFundBalanceHistory(investFundBalance, event.block.timestamp);
  investFundBalance.save();

  // *** VE DIST BALANCE CHANGE
  const veDistAdr = controllerCtr.veDistributor();
  const veDist = VeDistEntity.load(veDistAdr.toHexString()) as VeDistEntity;
  veDist.tokenBalance = veDist.tokenBalance.plus(distribution.toVeTetu);
  const veDistBalance = new VeDistBalance(event.transaction.hash.toHexString() + "_" + event.logIndex.toString());
  veDistBalance.veDist = veDist.id;
  veDistBalance.time = event.block.timestamp.toI32();
  veDistBalance.balance = veDist.tokenBalance;
  veDistBalance.save();
  veDist.save();

  // *** TETU VOTER BALANCE CHANGE
  const tetuVoterAdr = controllerCtr.voter();
  const tetuVoter = TetuVoterEntity.load(tetuVoterAdr.toHexString()) as TetuVoterEntity;
  tetuVoter.rewardsBalance = tetuVoter.rewardsBalance.plus(distribution.toGauges);
  const voterHistory = new TetuVoterRewardHistory(event.transaction.hash.toHexString() + "_" + event.logIndex.toString());
  voterHistory.voter = tetuVoter.id;
  voterHistory.time = event.block.timestamp.toI32();
  voterHistory.balance = tetuVoter.rewardsBalance;
  voterHistory.save();
  tetuVoter.save();
}

function loadInvestFundBalance(fundAdr: string, tokenAdr: string): InvestFundBalance {
  const fund = InvestFundEntity.load(fundAdr) as InvestFundEntity;

  let balance = InvestFundBalance.load(tokenAdr);
  if (!balance) {
    balance = new InvestFundBalance(tokenAdr);
    balance.fund = fund.id;
    balance.token = tokenAdr;
    balance.amount = BigDecimal.fromString('0');
  }
  return balance;
}

function saveInvestFundBalanceHistory(balance: InvestFundBalance, time: BigInt): void {
  const h = new InvestFundBalanceHistory(balance.id + "_" + time.toString());

  h.fundBalance = balance.id;
  h.time = time.toI32();
  h.amount = balance.amount;

  h.save();
}

function getOrCreateForwarderTokenInfo(address: string, forwarder: string): ForwarderTokenInfo {
  let tokenInfo = ForwarderTokenInfo.load(address);
  if (!tokenInfo) {
    tokenInfo = new ForwarderTokenInfo(address);
    tokenInfo.forwarder = forwarder;
    tokenInfo.slippage = BigDecimal.fromString('0');
    tokenInfo.lastUpdate = 0;
    tokenInfo.balance = BigDecimal.fromString('0');
  }
  return tokenInfo;
}

function getOrCreateToken(tokenAdr: string): TokenEntity {
  let token = TokenEntity.load(tokenAdr);
  if(!token) {
    token = new TokenEntity(tokenAdr);
    const tokenCtr = VaultAbi.bind(Address.fromString(tokenAdr));

    token.symbol = tokenCtr.symbol();
    token.name = tokenCtr.name();
    token.decimals = tokenCtr.decimals();
    token.usdPrice = ZERO_BD;
  }
  return token;
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
    let token = getOrCreateToken(asset);
    token.usdPrice = formatUnits(p.value, decimals);
    token.save();
    return formatUnits(p.value, decimals);
  }
  log.error("=== FAILED GET PRICE === liquidator: {} asset: {}", [liquidatorAdr, asset]);
  return BigDecimal.fromString('0')
}
