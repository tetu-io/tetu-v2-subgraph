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
  ForwarderSlippage, InvestFundBalance, InvestFundBalanceHistory,
  InvestFundEntity
} from "./types/schema";
import {Address, BigDecimal, BigInt} from "@graphprotocol/graph-ts";
import {ForwarderAbi} from "./types/ControllerData/ForwarderAbi";
import {ProxyAbi} from "./types/ControllerData/ProxyAbi";
import {formatUnits} from "./helpers";
import {VaultAbi} from "./types/templates/ForwarderTemplate/VaultAbi";
import {ControllerAbi} from "./types/templates/ForwarderTemplate/ControllerAbi";

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
  let slippage = ForwarderSlippage.load(event.params.token.toHexString());
  if (!slippage) {
    slippage = new ForwarderSlippage(event.params.token.toHexString());
  }
  slippage.value = event.params.value.toBigDecimal();
  slippage.forwarder = event.address.toHexString();
  slippage.save();
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

  distribution.forwarder = event.address.toHexString();
  distribution.time = event.block.timestamp.toI32();
  distribution.sender = event.params.sender.toHexString()
  distribution.token = event.params.token.toHexString()
  distribution.balance = formatUnits(event.params.balance, BigInt.fromI32(tokenCtr.decimals()));
  distribution.tetuValue = formatUnits(event.params.tetuValue, BigInt.fromI32(18));
  distribution.tetuBalance = formatUnits(event.params.tetuBalance, BigInt.fromI32(18));
  distribution.toInvestFund = formatUnits(event.params.toInvestFund, BigInt.fromI32(18));
  distribution.toGauges = formatUnits(event.params.toGauges, BigInt.fromI32(18));
  distribution.toVeTetu = formatUnits(event.params.toVeTetu, BigInt.fromI32(18));

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
  // todo

  // *** TETU VOTER BALANCE CHANGE
  const tetuVoterAdr = controllerCtr.voter();
  // todo

  distribution.save();
}

function loadInvestFundBalance(fundAdr: string, tokenAdr: string): InvestFundBalance {
  const fund = InvestFundEntity.load(fundAdr) as InvestFundEntity;

  let balance = InvestFundBalance.load(tokenAdr);
  if (!balance) {
    balance = new InvestFundBalance(tokenAdr);
    balance.fund = fund.id;
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

