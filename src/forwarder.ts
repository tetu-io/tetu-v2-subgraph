// noinspection JSUnusedGlobalSymbols

import {
  Distributed,
  GaugeRatioChanged,
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
  TetuVoterRewardHistory
} from "./types/schema";
import {Address, BigDecimal, BigInt} from "@graphprotocol/graph-ts";
import {ForwarderAbi} from "./types/ControllerData/ForwarderAbi";
import {formatUnits, getOrCreateToken, tryGetUsdPrice} from "./helpers/common-helper";
import {VaultAbi} from "./types/templates/ForwarderTemplate/VaultAbi";
import {ControllerAbi} from "./types/templates/ForwarderTemplate/ControllerAbi";
import {LiquidatorAbi as LiquidatorAbiCommon} from "./common/LiquidatorAbi";
import {VaultAbi as VaultAbiCommon} from "./common/VaultAbi";
import {Upgraded} from "./types/templates/MultiBribeTemplate/MultiBribeAbi";
import {PriceCalculatorAbi as PriceCalculatorAbiCommon} from "./common/PriceCalculatorAbi";
import {getPriceCalculator} from "./constants";
import {LiquidatorAbi} from "./types/templates/ForwarderTemplate/LiquidatorAbi";
import {PriceCalculatorAbi} from "./types/templates/ForwarderTemplate/PriceCalculatorAbi";

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

  const ctr = ForwarderAbi.bind(event.address);
  const v = ctr.try_FORWARDER_VERSION();
  if (!v.reverted) {
    forwarder.version = v.value;
  }

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

export function handleUpgraded(event: Upgraded): void {
  const forwarder = ForwarderEntity.load(event.address.toHexString()) as ForwarderEntity;
  const implementations = forwarder.implementations;
  implementations.push(event.params.implementation.toHexString())
  forwarder.implementations = implementations;
  forwarder.save()
}


// ***************************************************
//                   ACTIONS
// ***************************************************

export function handleDistributed(event: Distributed): void {
  const distribution = new ForwarderDistribution(event.transaction.hash.toHexString() + "_" + event.logIndex.toString());

  const forwarderCtr = ForwarderAbi.bind(event.address);
  const controllerCtr = ControllerAbi.bind(forwarderCtr.controller());
  const tokenCtr = VaultAbi.bind(event.params.incomeToken);
  const tetuAdr = forwarderCtr.tetu();
  const tokenDecimals = BigInt.fromI32(tokenCtr.decimals());
  const liquidatorAdr = controllerCtr.liquidator().toHexString();
  const tetuPrice = _tryGetUsdPrice(liquidatorAdr, tetuAdr.toHexString(), BigInt.fromI32(18))

  // create income token entity
  getOrCreateToken(VaultAbiCommon.bind(event.params.incomeToken));

  distribution.forwarder = event.address.toHexString();
  distribution.time = event.block.timestamp.toI32();
  distribution.sender = event.params.sender.toHexString()
  distribution.token = event.params.incomeToken.toHexString()
  distribution.balance = formatUnits(event.params.queuedBalance, tokenDecimals);
  distribution.tetuValue = formatUnits(event.params.tetuValue, BigInt.fromI32(18));
  distribution.usdValue = distribution.tetuValue.times(tetuPrice);
  distribution.tetuBalance = formatUnits(event.params.tetuBalance, BigInt.fromI32(18));
  distribution.toInvestFund = formatUnits(event.params.toInvestFund, BigInt.fromI32(18));
  distribution.toGauges = formatUnits(event.params.toGauges, BigInt.fromI32(18));
  distribution.toBribes = formatUnits(event.params.toBribes, BigInt.fromI32(18));
  distribution.save();

  // *** TOKEN BALANCE
  let tokenInfo = getOrCreateForwarderTokenInfo(event.params.incomeToken.toHexString(), event.address.toHexString());
  tokenInfo.balance = formatUnits(tokenCtr.balanceOf(event.address), tokenDecimals);
  tokenInfo.lastUpdate = event.block.timestamp.toI32();
  tokenInfo.save();

  // *** FORWARDER TOTALS
  const forwarder = ForwarderEntity.load(event.address.toHexString()) as ForwarderEntity;
  forwarder.toInvestFundTotal = forwarder.toInvestFundTotal.plus(distribution.toInvestFund);
  forwarder.toGaugesTotal = forwarder.toGaugesTotal.plus(distribution.toGauges);
  forwarder.toBribesTotal = forwarder.toBribesTotal.plus(distribution.toBribes);
  forwarder.save();

  // *** INVEST FUND BALANCE CHANGE
  const investFundAdr = controllerCtr.investFund();
  const investFundBalance = loadInvestFundBalance(investFundAdr.toHexString(), tetuAdr.toHexString());
  investFundBalance.amount = investFundBalance.amount.plus(formatUnits(event.params.toInvestFund, BigInt.fromI32(18)))
  saveInvestFundBalanceHistory(investFundBalance, event.block.timestamp);
  investFundBalance.save();

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
    tokenInfo.save();
  }
  return tokenInfo;
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
