// noinspection JSUnusedGlobalSymbols

import {FundDeposit, FundWithdrawn} from "./types/templates/InvestFundTemplate/InvestFundAbi";
import {InvestFundBalance, InvestFundBalanceHistory, InvestFundEntity} from "./types/schema";
import {BigInt} from "@graphprotocol/graph-ts";
import {VaultAbi} from "./types/templates/InvestFundTemplate/VaultAbi";
import { formatUnits } from "./helpers";

export function handleFundDeposit(event: FundDeposit): void {
  const tokenCtr = VaultAbi.bind(event.params.token);
  const balance = loadBalance(event.address.toHexString(), event.params.token.toHexString());

  balance.amount = balance.amount.plus(formatUnits(event.params.amount, BigInt.fromI32(tokenCtr.decimals())))

  saveBalanceHistory(balance, event.block.timestamp.toI32());
  balance.save();
}

export function handleFundWithdrawn(event: FundWithdrawn): void {
  const tokenCtr = VaultAbi.bind(event.params.token);
  const balance = loadBalance(event.address.toHexString(), event.params.token.toHexString());

  balance.amount = balance.amount.minus(formatUnits(event.params.amount, BigInt.fromI32(tokenCtr.decimals())))

  saveBalanceHistory(balance, event.block.timestamp.toI32());
  balance.save();
}

function loadBalance(fundAdr: string, tokenAdr: string): InvestFundBalance {
  let balance = InvestFundBalance.load(tokenAdr);
  if (!balance) {
    balance = new InvestFundBalance(tokenAdr);
    balance.fund = fundAdr;
    balance.token = tokenAdr;
    balance.fund = fundAdr;
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
