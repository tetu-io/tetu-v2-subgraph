// noinspection JSUnusedGlobalSymbols

import {FundDeposit, FundWithdrawn} from "./types/templates/InvestFundTemplate/InvestFundAbi";
import {InvestFundBalance, InvestFundBalanceHistory, InvestFundEntity} from "./types/schema";
import {BigInt} from "@graphprotocol/graph-ts";

export function handleFundDeposit(event: FundDeposit): void {

  const balance = loadBalance(event.address.toHexString(), event.params.token.toHexString());

  balance.amount = balance.amount.plus(event.params.amount.toBigDecimal())

  saveBalanceHistory(balance, event.block.timestamp.toI32());
  balance.save();
}

export function handleFundWithdrawn(event: FundWithdrawn): void {
  const balance = loadBalance(event.address.toHexString(), event.params.token.toHexString());

  balance.amount = balance.amount.minus(event.params.amount.toBigDecimal())

  saveBalanceHistory(balance, event.block.timestamp.toI32());
  balance.save();
}

function loadBalance(fundAdr: string, tokenAdr: string): InvestFundBalance {
  const fund = InvestFundEntity.load(fundAdr) as InvestFundEntity;

  let balance = InvestFundBalance.load(tokenAdr);
  if (!balance) {
    balance = new InvestFundBalance(tokenAdr);
    balance.fund = fund.id;
  }
  return balance;
}

function saveBalanceHistory(
  balance: InvestFundBalance,
  // @ts-ignore
  time: i32
): void {
  const h = new InvestFundBalanceHistory(balance.id + "_" + BigInt.fromI32(time).toString());

  h.fundBalance = balance.id;
  h.time = time;
  h.amount = balance.amount;

  h.save();
}
