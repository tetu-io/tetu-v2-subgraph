// THIS IS AN AUTOGENERATED FILE. DO NOT EDIT THIS FILE DIRECTLY.

import {
  ethereum,
  JSONValue,
  TypedMap,
  Entity,
  Bytes,
  Address,
  BigInt
} from "@graphprotocol/graph-ts";

export class ContinueInvesting extends ethereum.Event {
  get params(): ContinueInvesting__Params {
    return new ContinueInvesting__Params(this);
  }
}

export class ContinueInvesting__Params {
  _event: ContinueInvesting;

  constructor(event: ContinueInvesting) {
    this._event = event;
  }

  get strategy(): Address {
    return this._event.parameters[0].value.toAddress();
  }

  get apr(): BigInt {
    return this._event.parameters[1].value.toBigInt();
  }

  get sender(): Address {
    return this._event.parameters[2].value.toAddress();
  }
}

export class ContractInitialized extends ethereum.Event {
  get params(): ContractInitialized__Params {
    return new ContractInitialized__Params(this);
  }
}

export class ContractInitialized__Params {
  _event: ContractInitialized;

  constructor(event: ContractInitialized) {
    this._event = event;
  }

  get controller(): Address {
    return this._event.parameters[0].value.toAddress();
  }

  get ts(): BigInt {
    return this._event.parameters[1].value.toBigInt();
  }

  get block(): BigInt {
    return this._event.parameters[2].value.toBigInt();
  }
}

export class HardWork extends ethereum.Event {
  get params(): HardWork__Params {
    return new HardWork__Params(this);
  }
}

export class HardWork__Params {
  _event: HardWork;

  constructor(event: HardWork) {
    this._event = event;
  }

  get sender(): Address {
    return this._event.parameters[0].value.toAddress();
  }

  get strategy(): Address {
    return this._event.parameters[1].value.toAddress();
  }

  get tvl(): BigInt {
    return this._event.parameters[2].value.toBigInt();
  }

  get earned(): BigInt {
    return this._event.parameters[3].value.toBigInt();
  }

  get lost(): BigInt {
    return this._event.parameters[4].value.toBigInt();
  }

  get apr(): BigInt {
    return this._event.parameters[5].value.toBigInt();
  }

  get avgApr(): BigInt {
    return this._event.parameters[6].value.toBigInt();
  }
}

export class Initialized extends ethereum.Event {
  get params(): Initialized__Params {
    return new Initialized__Params(this);
  }
}

export class Initialized__Params {
  _event: Initialized;

  constructor(event: Initialized) {
    this._event = event;
  }

  get version(): i32 {
    return this._event.parameters[0].value.toI32();
  }
}

export class ManualAprChanged extends ethereum.Event {
  get params(): ManualAprChanged__Params {
    return new ManualAprChanged__Params(this);
  }
}

export class ManualAprChanged__Params {
  _event: ManualAprChanged;

  constructor(event: ManualAprChanged) {
    this._event = event;
  }

  get sender(): Address {
    return this._event.parameters[0].value.toAddress();
  }

  get strategy(): Address {
    return this._event.parameters[1].value.toAddress();
  }

  get newApr(): BigInt {
    return this._event.parameters[2].value.toBigInt();
  }

  get oldApr(): BigInt {
    return this._event.parameters[3].value.toBigInt();
  }
}

export class Paused extends ethereum.Event {
  get params(): Paused__Params {
    return new Paused__Params(this);
  }
}

export class Paused__Params {
  _event: Paused;

  constructor(event: Paused) {
    this._event = event;
  }

  get strategy(): Address {
    return this._event.parameters[0].value.toAddress();
  }

  get sender(): Address {
    return this._event.parameters[1].value.toAddress();
  }
}

export class Rebalance extends ethereum.Event {
  get params(): Rebalance__Params {
    return new Rebalance__Params(this);
  }
}

export class Rebalance__Params {
  _event: Rebalance;

  constructor(event: Rebalance) {
    this._event = event;
  }

  get topStrategy(): Address {
    return this._event.parameters[0].value.toAddress();
  }

  get lowStrategy(): Address {
    return this._event.parameters[1].value.toAddress();
  }

  get percent(): BigInt {
    return this._event.parameters[2].value.toBigInt();
  }

  get slippageTolerance(): BigInt {
    return this._event.parameters[3].value.toBigInt();
  }

  get slippage(): BigInt {
    return this._event.parameters[4].value.toBigInt();
  }

  get lowStrategyBalance(): BigInt {
    return this._event.parameters[5].value.toBigInt();
  }
}

export class RevisionIncreased extends ethereum.Event {
  get params(): RevisionIncreased__Params {
    return new RevisionIncreased__Params(this);
  }
}

export class RevisionIncreased__Params {
  _event: RevisionIncreased;

  constructor(event: RevisionIncreased) {
    this._event = event;
  }

  get value(): BigInt {
    return this._event.parameters[0].value.toBigInt();
  }

  get oldLogic(): Address {
    return this._event.parameters[1].value.toAddress();
  }
}

export class ScheduledStrategyRemove extends ethereum.Event {
  get params(): ScheduledStrategyRemove__Params {
    return new ScheduledStrategyRemove__Params(this);
  }
}

export class ScheduledStrategyRemove__Params {
  _event: ScheduledStrategyRemove;

  constructor(event: ScheduledStrategyRemove) {
    this._event = event;
  }

  get strategy(): Address {
    return this._event.parameters[0].value.toAddress();
  }
}

export class StrategyAdded extends ethereum.Event {
  get params(): StrategyAdded__Params {
    return new StrategyAdded__Params(this);
  }
}

export class StrategyAdded__Params {
  _event: StrategyAdded;

  constructor(event: StrategyAdded) {
    this._event = event;
  }

  get strategy(): Address {
    return this._event.parameters[0].value.toAddress();
  }

  get apr(): BigInt {
    return this._event.parameters[1].value.toBigInt();
  }
}

export class StrategyRatioChanged extends ethereum.Event {
  get params(): StrategyRatioChanged__Params {
    return new StrategyRatioChanged__Params(this);
  }
}

export class StrategyRatioChanged__Params {
  _event: StrategyRatioChanged;

  constructor(event: StrategyRatioChanged) {
    this._event = event;
  }

  get strategy(): Address {
    return this._event.parameters[0].value.toAddress();
  }

  get ratio(): BigInt {
    return this._event.parameters[1].value.toBigInt();
  }
}

export class StrategyRemoved extends ethereum.Event {
  get params(): StrategyRemoved__Params {
    return new StrategyRemoved__Params(this);
  }
}

export class StrategyRemoved__Params {
  _event: StrategyRemoved;

  constructor(event: StrategyRemoved) {
    this._event = event;
  }

  get strategy(): Address {
    return this._event.parameters[0].value.toAddress();
  }
}

export class StrategyScheduled extends ethereum.Event {
  get params(): StrategyScheduled__Params {
    return new StrategyScheduled__Params(this);
  }
}

export class StrategyScheduled__Params {
  _event: StrategyScheduled;

  constructor(event: StrategyScheduled) {
    this._event = event;
  }

  get strategy(): Address {
    return this._event.parameters[0].value.toAddress();
  }

  get startTime(): BigInt {
    return this._event.parameters[1].value.toBigInt();
  }

  get timeLock(): BigInt {
    return this._event.parameters[2].value.toBigInt();
  }
}

export class Upgraded extends ethereum.Event {
  get params(): Upgraded__Params {
    return new Upgraded__Params(this);
  }
}

export class Upgraded__Params {
  _event: Upgraded;

  constructor(event: Upgraded) {
    this._event = event;
  }

  get implementation(): Address {
    return this._event.parameters[0].value.toAddress();
  }
}

export class Loss extends ethereum.Event {
  get params(): Loss__Params {
    return new Loss__Params(this);
  }
}

export class Loss__Params {
  _event: Loss;

  constructor(event: Loss) {
    this._event = event;
  }

  get strategy(): Address {
    return this._event.parameters[0].value.toAddress();
  }

  get amount(): BigInt {
    return this._event.parameters[1].value.toBigInt();
  }
}

export class Invested extends ethereum.Event {
  get params(): Invested__Params {
    return new Invested__Params(this);
  }
}

export class Invested__Params {
  _event: Invested;

  constructor(event: Invested) {
    this._event = event;
  }

  get strategy(): Address {
    return this._event.parameters[0].value.toAddress();
  }

  get amount(): BigInt {
    return this._event.parameters[1].value.toBigInt();
  }
}

export class WithdrawFromStrategy extends ethereum.Event {
  get params(): WithdrawFromStrategy__Params {
    return new WithdrawFromStrategy__Params(this);
  }
}

export class WithdrawFromStrategy__Params {
  _event: WithdrawFromStrategy;

  constructor(event: WithdrawFromStrategy) {
    this._event = event;
  }

  get strategy(): Address {
    return this._event.parameters[0].value.toAddress();
  }
}

export class SetStrategyCapacity extends ethereum.Event {
  get params(): SetStrategyCapacity__Params {
    return new SetStrategyCapacity__Params(this);
  }
}

export class SetStrategyCapacity__Params {
  _event: SetStrategyCapacity;

  constructor(event: SetStrategyCapacity) {
    this._event = event;
  }

  get strategy(): Address {
    return this._event.parameters[0].value.toAddress();
  }

  get capacity(): BigInt {
    return this._event.parameters[1].value.toBigInt();
  }
}

export class StrategySplitterAbi__scheduledStrategiesResult {
  value0: Array<Address>;
  value1: Array<BigInt>;

  constructor(value0: Array<Address>, value1: Array<BigInt>) {
    this.value0 = value0;
    this.value1 = value1;
  }

  toMap(): TypedMap<string, ethereum.Value> {
    let map = new TypedMap<string, ethereum.Value>();
    map.set("value0", ethereum.Value.fromAddressArray(this.value0));
    map.set("value1", ethereum.Value.fromUnsignedBigIntArray(this.value1));
    return map;
  }

  get_strategies(): Array<Address> {
    return this.value0;
  }

  getLocks(): Array<BigInt> {
    return this.value1;
  }
}

export class StrategySplitterAbi extends ethereum.SmartContract {
  static bind(address: Address): StrategySplitterAbi {
    return new StrategySplitterAbi("StrategySplitterAbi", address);
  }

  APR_DENOMINATOR(): BigInt {
    let result = super.call(
      "APR_DENOMINATOR",
      "APR_DENOMINATOR():(uint256)",
      []
    );

    return result[0].toBigInt();
  }

  try_APR_DENOMINATOR(): ethereum.CallResult<BigInt> {
    let result = super.tryCall(
      "APR_DENOMINATOR",
      "APR_DENOMINATOR():(uint256)",
      []
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBigInt());
  }

  CONTROLLABLE_VERSION(): string {
    let result = super.call(
      "CONTROLLABLE_VERSION",
      "CONTROLLABLE_VERSION():(string)",
      []
    );

    return result[0].toString();
  }

  try_CONTROLLABLE_VERSION(): ethereum.CallResult<string> {
    let result = super.tryCall(
      "CONTROLLABLE_VERSION",
      "CONTROLLABLE_VERSION():(string)",
      []
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toString());
  }

  HARDWORK_DELAY(): BigInt {
    let result = super.call("HARDWORK_DELAY", "HARDWORK_DELAY():(uint256)", []);

    return result[0].toBigInt();
  }

  try_HARDWORK_DELAY(): ethereum.CallResult<BigInt> {
    let result = super.tryCall(
      "HARDWORK_DELAY",
      "HARDWORK_DELAY():(uint256)",
      []
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBigInt());
  }

  HISTORY_DEEP(): BigInt {
    let result = super.call("HISTORY_DEEP", "HISTORY_DEEP():(uint256)", []);

    return result[0].toBigInt();
  }

  try_HISTORY_DEEP(): ethereum.CallResult<BigInt> {
    let result = super.tryCall("HISTORY_DEEP", "HISTORY_DEEP():(uint256)", []);
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBigInt());
  }

  SPLITTER_VERSION(): string {
    let result = super.call(
      "SPLITTER_VERSION",
      "SPLITTER_VERSION():(string)",
      []
    );

    return result[0].toString();
  }

  try_SPLITTER_VERSION(): ethereum.CallResult<string> {
    let result = super.tryCall(
      "SPLITTER_VERSION",
      "SPLITTER_VERSION():(string)",
      []
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toString());
  }

  TIME_LOCK(): BigInt {
    let result = super.call("TIME_LOCK", "TIME_LOCK():(uint256)", []);

    return result[0].toBigInt();
  }

  try_TIME_LOCK(): ethereum.CallResult<BigInt> {
    let result = super.tryCall("TIME_LOCK", "TIME_LOCK():(uint256)", []);
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBigInt());
  }

  allStrategies(): Array<Address> {
    let result = super.call("allStrategies", "allStrategies():(address[])", []);

    return result[0].toAddressArray();
  }

  try_allStrategies(): ethereum.CallResult<Array<Address>> {
    let result = super.tryCall(
      "allStrategies",
      "allStrategies():(address[])",
      []
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toAddressArray());
  }

  asset(): Address {
    let result = super.call("asset", "asset():(address)", []);

    return result[0].toAddress();
  }

  try_asset(): ethereum.CallResult<Address> {
    let result = super.tryCall("asset", "asset():(address)", []);
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toAddress());
  }

  averageApr(strategy: Address): BigInt {
    let result = super.call("averageApr", "averageApr(address):(uint256)", [
      ethereum.Value.fromAddress(strategy)
    ]);

    return result[0].toBigInt();
  }

  try_averageApr(strategy: Address): ethereum.CallResult<BigInt> {
    let result = super.tryCall("averageApr", "averageApr(address):(uint256)", [
      ethereum.Value.fromAddress(strategy)
    ]);
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBigInt());
  }

  computeApr(tvl: BigInt, earned: BigInt, duration: BigInt): BigInt {
    let result = super.call(
      "computeApr",
      "computeApr(uint256,uint256,uint256):(uint256)",
      [
        ethereum.Value.fromUnsignedBigInt(tvl),
        ethereum.Value.fromUnsignedBigInt(earned),
        ethereum.Value.fromUnsignedBigInt(duration)
      ]
    );

    return result[0].toBigInt();
  }

  try_computeApr(
    tvl: BigInt,
    earned: BigInt,
    duration: BigInt
  ): ethereum.CallResult<BigInt> {
    let result = super.tryCall(
      "computeApr",
      "computeApr(uint256,uint256,uint256):(uint256)",
      [
        ethereum.Value.fromUnsignedBigInt(tvl),
        ethereum.Value.fromUnsignedBigInt(earned),
        ethereum.Value.fromUnsignedBigInt(duration)
      ]
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBigInt());
  }

  controller(): Address {
    let result = super.call("controller", "controller():(address)", []);

    return result[0].toAddress();
  }

  try_controller(): ethereum.CallResult<Address> {
    let result = super.tryCall("controller", "controller():(address)", []);
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toAddress());
  }

  created(): BigInt {
    let result = super.call("created", "created():(uint256)", []);

    return result[0].toBigInt();
  }

  try_created(): ethereum.CallResult<BigInt> {
    let result = super.tryCall("created", "created():(uint256)", []);
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBigInt());
  }

  createdBlock(): BigInt {
    let result = super.call("createdBlock", "createdBlock():(uint256)", []);

    return result[0].toBigInt();
  }

  try_createdBlock(): ethereum.CallResult<BigInt> {
    let result = super.tryCall("createdBlock", "createdBlock():(uint256)", []);
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBigInt());
  }

  isController(_value: Address): boolean {
    let result = super.call("isController", "isController(address):(bool)", [
      ethereum.Value.fromAddress(_value)
    ]);

    return result[0].toBoolean();
  }

  try_isController(_value: Address): ethereum.CallResult<boolean> {
    let result = super.tryCall("isController", "isController(address):(bool)", [
      ethereum.Value.fromAddress(_value)
    ]);
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBoolean());
  }

  isGovernance(_value: Address): boolean {
    let result = super.call("isGovernance", "isGovernance(address):(bool)", [
      ethereum.Value.fromAddress(_value)
    ]);

    return result[0].toBoolean();
  }

  try_isGovernance(_value: Address): ethereum.CallResult<boolean> {
    let result = super.tryCall("isGovernance", "isGovernance(address):(bool)", [
      ethereum.Value.fromAddress(_value)
    ]);
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBoolean());
  }

  isHardWorking(): boolean {
    let result = super.call("isHardWorking", "isHardWorking():(bool)", []);

    return result[0].toBoolean();
  }

  try_isHardWorking(): ethereum.CallResult<boolean> {
    let result = super.tryCall("isHardWorking", "isHardWorking():(bool)", []);
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBoolean());
  }

  lastHardWorks(param0: Address): BigInt {
    let result = super.call(
      "lastHardWorks",
      "lastHardWorks(address):(uint256)",
      [ethereum.Value.fromAddress(param0)]
    );

    return result[0].toBigInt();
  }

  try_lastHardWorks(param0: Address): ethereum.CallResult<BigInt> {
    let result = super.tryCall(
      "lastHardWorks",
      "lastHardWorks(address):(uint256)",
      [ethereum.Value.fromAddress(param0)]
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBigInt());
  }

  maxCheapWithdraw(): BigInt {
    let result = super.call(
      "maxCheapWithdraw",
      "maxCheapWithdraw():(uint256)",
      []
    );

    return result[0].toBigInt();
  }

  try_maxCheapWithdraw(): ethereum.CallResult<BigInt> {
    let result = super.tryCall(
      "maxCheapWithdraw",
      "maxCheapWithdraw():(uint256)",
      []
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBigInt());
  }

  pausedStrategies(param0: Address): boolean {
    let result = super.call(
      "pausedStrategies",
      "pausedStrategies(address):(bool)",
      [ethereum.Value.fromAddress(param0)]
    );

    return result[0].toBoolean();
  }

  try_pausedStrategies(param0: Address): ethereum.CallResult<boolean> {
    let result = super.tryCall(
      "pausedStrategies",
      "pausedStrategies(address):(bool)",
      [ethereum.Value.fromAddress(param0)]
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBoolean());
  }

  previousImplementation(): Address {
    let result = super.call(
      "previousImplementation",
      "previousImplementation():(address)",
      []
    );

    return result[0].toAddress();
  }

  try_previousImplementation(): ethereum.CallResult<Address> {
    let result = super.tryCall(
      "previousImplementation",
      "previousImplementation():(address)",
      []
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toAddress());
  }

  revision(): BigInt {
    let result = super.call("revision", "revision():(uint256)", []);

    return result[0].toBigInt();
  }

  try_revision(): ethereum.CallResult<BigInt> {
    let result = super.tryCall("revision", "revision():(uint256)", []);
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBigInt());
  }

  scheduledStrategies(): StrategySplitterAbi__scheduledStrategiesResult {
    let result = super.call(
      "scheduledStrategies",
      "scheduledStrategies():(address[],uint256[])",
      []
    );

    return new StrategySplitterAbi__scheduledStrategiesResult(
      result[0].toAddressArray(),
      result[1].toBigIntArray()
    );
  }

  try_scheduledStrategies(): ethereum.CallResult<
    StrategySplitterAbi__scheduledStrategiesResult
  > {
    let result = super.tryCall(
      "scheduledStrategies",
      "scheduledStrategies():(address[],uint256[])",
      []
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(
      new StrategySplitterAbi__scheduledStrategiesResult(
        value[0].toAddressArray(),
        value[1].toBigIntArray()
      )
    );
  }

  strategies(param0: BigInt): Address {
    let result = super.call("strategies", "strategies(uint256):(address)", [
      ethereum.Value.fromUnsignedBigInt(param0)
    ]);

    return result[0].toAddress();
  }

  try_strategies(param0: BigInt): ethereum.CallResult<Address> {
    let result = super.tryCall("strategies", "strategies(uint256):(address)", [
      ethereum.Value.fromUnsignedBigInt(param0)
    ]);
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toAddress());
  }

  strategiesAPR(param0: Address): BigInt {
    let result = super.call(
      "strategiesAPR",
      "strategiesAPR(address):(uint256)",
      [ethereum.Value.fromAddress(param0)]
    );

    return result[0].toBigInt();
  }

  try_strategiesAPR(param0: Address): ethereum.CallResult<BigInt> {
    let result = super.tryCall(
      "strategiesAPR",
      "strategiesAPR(address):(uint256)",
      [ethereum.Value.fromAddress(param0)]
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBigInt());
  }

  strategiesAPRHistory(param0: Address, param1: BigInt): BigInt {
    let result = super.call(
      "strategiesAPRHistory",
      "strategiesAPRHistory(address,uint256):(uint256)",
      [
        ethereum.Value.fromAddress(param0),
        ethereum.Value.fromUnsignedBigInt(param1)
      ]
    );

    return result[0].toBigInt();
  }

  try_strategiesAPRHistory(
    param0: Address,
    param1: BigInt
  ): ethereum.CallResult<BigInt> {
    let result = super.tryCall(
      "strategiesAPRHistory",
      "strategiesAPRHistory(address,uint256):(uint256)",
      [
        ethereum.Value.fromAddress(param0),
        ethereum.Value.fromUnsignedBigInt(param1)
      ]
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBigInt());
  }

  strategiesLength(): BigInt {
    let result = super.call(
      "strategiesLength",
      "strategiesLength():(uint256)",
      []
    );

    return result[0].toBigInt();
  }

  try_strategiesLength(): ethereum.CallResult<BigInt> {
    let result = super.tryCall(
      "strategiesLength",
      "strategiesLength():(uint256)",
      []
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBigInt());
  }

  strategyAPRHistoryLength(strategy: Address): BigInt {
    let result = super.call(
      "strategyAPRHistoryLength",
      "strategyAPRHistoryLength(address):(uint256)",
      [ethereum.Value.fromAddress(strategy)]
    );

    return result[0].toBigInt();
  }

  try_strategyAPRHistoryLength(strategy: Address): ethereum.CallResult<BigInt> {
    let result = super.tryCall(
      "strategyAPRHistoryLength",
      "strategyAPRHistoryLength(address):(uint256)",
      [ethereum.Value.fromAddress(strategy)]
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBigInt());
  }

  totalAssets(): BigInt {
    let result = super.call("totalAssets", "totalAssets():(uint256)", []);

    return result[0].toBigInt();
  }

  try_totalAssets(): ethereum.CallResult<BigInt> {
    let result = super.tryCall("totalAssets", "totalAssets():(uint256)", []);
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBigInt());
  }

  vault(): Address {
    let result = super.call("vault", "vault():(address)", []);

    return result[0].toAddress();
  }

  try_vault(): ethereum.CallResult<Address> {
    let result = super.tryCall("vault", "vault():(address)", []);
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toAddress());
  }
}

export class AddStrategiesCall extends ethereum.Call {
  get inputs(): AddStrategiesCall__Inputs {
    return new AddStrategiesCall__Inputs(this);
  }

  get outputs(): AddStrategiesCall__Outputs {
    return new AddStrategiesCall__Outputs(this);
  }
}

export class AddStrategiesCall__Inputs {
  _call: AddStrategiesCall;

  constructor(call: AddStrategiesCall) {
    this._call = call;
  }

  get _strategies(): Array<Address> {
    return this._call.inputValues[0].value.toAddressArray();
  }

  get expectedAPR(): Array<BigInt> {
    return this._call.inputValues[1].value.toBigIntArray();
  }
}

export class AddStrategiesCall__Outputs {
  _call: AddStrategiesCall;

  constructor(call: AddStrategiesCall) {
    this._call = call;
  }
}

export class ContinueInvestingCall extends ethereum.Call {
  get inputs(): ContinueInvestingCall__Inputs {
    return new ContinueInvestingCall__Inputs(this);
  }

  get outputs(): ContinueInvestingCall__Outputs {
    return new ContinueInvestingCall__Outputs(this);
  }
}

export class ContinueInvestingCall__Inputs {
  _call: ContinueInvestingCall;

  constructor(call: ContinueInvestingCall) {
    this._call = call;
  }

  get strategy(): Address {
    return this._call.inputValues[0].value.toAddress();
  }

  get apr(): BigInt {
    return this._call.inputValues[1].value.toBigInt();
  }
}

export class ContinueInvestingCall__Outputs {
  _call: ContinueInvestingCall;

  constructor(call: ContinueInvestingCall) {
    this._call = call;
  }
}

export class DoHardWorkCall extends ethereum.Call {
  get inputs(): DoHardWorkCall__Inputs {
    return new DoHardWorkCall__Inputs(this);
  }

  get outputs(): DoHardWorkCall__Outputs {
    return new DoHardWorkCall__Outputs(this);
  }
}

export class DoHardWorkCall__Inputs {
  _call: DoHardWorkCall;

  constructor(call: DoHardWorkCall) {
    this._call = call;
  }
}

export class DoHardWorkCall__Outputs {
  _call: DoHardWorkCall;

  constructor(call: DoHardWorkCall) {
    this._call = call;
  }
}

export class DoHardWorkForStrategyCall extends ethereum.Call {
  get inputs(): DoHardWorkForStrategyCall__Inputs {
    return new DoHardWorkForStrategyCall__Inputs(this);
  }

  get outputs(): DoHardWorkForStrategyCall__Outputs {
    return new DoHardWorkForStrategyCall__Outputs(this);
  }
}

export class DoHardWorkForStrategyCall__Inputs {
  _call: DoHardWorkForStrategyCall;

  constructor(call: DoHardWorkForStrategyCall) {
    this._call = call;
  }

  get strategy(): Address {
    return this._call.inputValues[0].value.toAddress();
  }

  get push(): boolean {
    return this._call.inputValues[1].value.toBoolean();
  }
}

export class DoHardWorkForStrategyCall__Outputs {
  _call: DoHardWorkForStrategyCall;

  constructor(call: DoHardWorkForStrategyCall) {
    this._call = call;
  }
}

export class IncreaseRevisionCall extends ethereum.Call {
  get inputs(): IncreaseRevisionCall__Inputs {
    return new IncreaseRevisionCall__Inputs(this);
  }

  get outputs(): IncreaseRevisionCall__Outputs {
    return new IncreaseRevisionCall__Outputs(this);
  }
}

export class IncreaseRevisionCall__Inputs {
  _call: IncreaseRevisionCall;

  constructor(call: IncreaseRevisionCall) {
    this._call = call;
  }

  get oldLogic(): Address {
    return this._call.inputValues[0].value.toAddress();
  }
}

export class IncreaseRevisionCall__Outputs {
  _call: IncreaseRevisionCall;

  constructor(call: IncreaseRevisionCall) {
    this._call = call;
  }
}

export class InitCall extends ethereum.Call {
  get inputs(): InitCall__Inputs {
    return new InitCall__Inputs(this);
  }

  get outputs(): InitCall__Outputs {
    return new InitCall__Outputs(this);
  }
}

export class InitCall__Inputs {
  _call: InitCall;

  constructor(call: InitCall) {
    this._call = call;
  }

  get controller_(): Address {
    return this._call.inputValues[0].value.toAddress();
  }

  get _asset(): Address {
    return this._call.inputValues[1].value.toAddress();
  }

  get _vault(): Address {
    return this._call.inputValues[2].value.toAddress();
  }
}

export class InitCall__Outputs {
  _call: InitCall;

  constructor(call: InitCall) {
    this._call = call;
  }
}

export class InvestAllCall extends ethereum.Call {
  get inputs(): InvestAllCall__Inputs {
    return new InvestAllCall__Inputs(this);
  }

  get outputs(): InvestAllCall__Outputs {
    return new InvestAllCall__Outputs(this);
  }
}

export class InvestAllCall__Inputs {
  _call: InvestAllCall;

  constructor(call: InvestAllCall) {
    this._call = call;
  }
}

export class InvestAllCall__Outputs {
  _call: InvestAllCall;

  constructor(call: InvestAllCall) {
    this._call = call;
  }
}

export class PauseInvestingCall extends ethereum.Call {
  get inputs(): PauseInvestingCall__Inputs {
    return new PauseInvestingCall__Inputs(this);
  }

  get outputs(): PauseInvestingCall__Outputs {
    return new PauseInvestingCall__Outputs(this);
  }
}

export class PauseInvestingCall__Inputs {
  _call: PauseInvestingCall;

  constructor(call: PauseInvestingCall) {
    this._call = call;
  }

  get strategy(): Address {
    return this._call.inputValues[0].value.toAddress();
  }
}

export class PauseInvestingCall__Outputs {
  _call: PauseInvestingCall;

  constructor(call: PauseInvestingCall) {
    this._call = call;
  }
}

export class RebalanceCall extends ethereum.Call {
  get inputs(): RebalanceCall__Inputs {
    return new RebalanceCall__Inputs(this);
  }

  get outputs(): RebalanceCall__Outputs {
    return new RebalanceCall__Outputs(this);
  }
}

export class RebalanceCall__Inputs {
  _call: RebalanceCall;

  constructor(call: RebalanceCall) {
    this._call = call;
  }

  get percent(): BigInt {
    return this._call.inputValues[0].value.toBigInt();
  }

  get slippageTolerance(): BigInt {
    return this._call.inputValues[1].value.toBigInt();
  }
}

export class RebalanceCall__Outputs {
  _call: RebalanceCall;

  constructor(call: RebalanceCall) {
    this._call = call;
  }
}

export class RemoveScheduledStrategiesCall extends ethereum.Call {
  get inputs(): RemoveScheduledStrategiesCall__Inputs {
    return new RemoveScheduledStrategiesCall__Inputs(this);
  }

  get outputs(): RemoveScheduledStrategiesCall__Outputs {
    return new RemoveScheduledStrategiesCall__Outputs(this);
  }
}

export class RemoveScheduledStrategiesCall__Inputs {
  _call: RemoveScheduledStrategiesCall;

  constructor(call: RemoveScheduledStrategiesCall) {
    this._call = call;
  }

  get _strategies(): Array<Address> {
    return this._call.inputValues[0].value.toAddressArray();
  }
}

export class RemoveScheduledStrategiesCall__Outputs {
  _call: RemoveScheduledStrategiesCall;

  constructor(call: RemoveScheduledStrategiesCall) {
    this._call = call;
  }
}

export class RemoveStrategiesCall extends ethereum.Call {
  get inputs(): RemoveStrategiesCall__Inputs {
    return new RemoveStrategiesCall__Inputs(this);
  }

  get outputs(): RemoveStrategiesCall__Outputs {
    return new RemoveStrategiesCall__Outputs(this);
  }
}

export class RemoveStrategiesCall__Inputs {
  _call: RemoveStrategiesCall;

  constructor(call: RemoveStrategiesCall) {
    this._call = call;
  }

  get strategies_(): Array<Address> {
    return this._call.inputValues[0].value.toAddressArray();
  }
}

export class RemoveStrategiesCall__Outputs {
  _call: RemoveStrategiesCall;

  constructor(call: RemoveStrategiesCall) {
    this._call = call;
  }
}

export class ScheduleStrategiesCall extends ethereum.Call {
  get inputs(): ScheduleStrategiesCall__Inputs {
    return new ScheduleStrategiesCall__Inputs(this);
  }

  get outputs(): ScheduleStrategiesCall__Outputs {
    return new ScheduleStrategiesCall__Outputs(this);
  }
}

export class ScheduleStrategiesCall__Inputs {
  _call: ScheduleStrategiesCall;

  constructor(call: ScheduleStrategiesCall) {
    this._call = call;
  }

  get _strategies(): Array<Address> {
    return this._call.inputValues[0].value.toAddressArray();
  }
}

export class ScheduleStrategiesCall__Outputs {
  _call: ScheduleStrategiesCall;

  constructor(call: ScheduleStrategiesCall) {
    this._call = call;
  }
}

export class SetAPRsCall extends ethereum.Call {
  get inputs(): SetAPRsCall__Inputs {
    return new SetAPRsCall__Inputs(this);
  }

  get outputs(): SetAPRsCall__Outputs {
    return new SetAPRsCall__Outputs(this);
  }
}

export class SetAPRsCall__Inputs {
  _call: SetAPRsCall;

  constructor(call: SetAPRsCall) {
    this._call = call;
  }

  get _strategies(): Array<Address> {
    return this._call.inputValues[0].value.toAddressArray();
  }

  get aprs(): Array<BigInt> {
    return this._call.inputValues[1].value.toBigIntArray();
  }
}

export class SetAPRsCall__Outputs {
  _call: SetAPRsCall;

  constructor(call: SetAPRsCall) {
    this._call = call;
  }
}

export class WithdrawAllToVaultCall extends ethereum.Call {
  get inputs(): WithdrawAllToVaultCall__Inputs {
    return new WithdrawAllToVaultCall__Inputs(this);
  }

  get outputs(): WithdrawAllToVaultCall__Outputs {
    return new WithdrawAllToVaultCall__Outputs(this);
  }
}

export class WithdrawAllToVaultCall__Inputs {
  _call: WithdrawAllToVaultCall;

  constructor(call: WithdrawAllToVaultCall) {
    this._call = call;
  }
}

export class WithdrawAllToVaultCall__Outputs {
  _call: WithdrawAllToVaultCall;

  constructor(call: WithdrawAllToVaultCall) {
    this._call = call;
  }
}

export class WithdrawToVaultCall extends ethereum.Call {
  get inputs(): WithdrawToVaultCall__Inputs {
    return new WithdrawToVaultCall__Inputs(this);
  }

  get outputs(): WithdrawToVaultCall__Outputs {
    return new WithdrawToVaultCall__Outputs(this);
  }
}

export class WithdrawToVaultCall__Inputs {
  _call: WithdrawToVaultCall;

  constructor(call: WithdrawToVaultCall) {
    this._call = call;
  }

  get amount(): BigInt {
    return this._call.inputValues[0].value.toBigInt();
  }
}

export class WithdrawToVaultCall__Outputs {
  _call: WithdrawToVaultCall;

  constructor(call: WithdrawToVaultCall) {
    this._call = call;
  }
}
