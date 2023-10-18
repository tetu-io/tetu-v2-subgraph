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

export class Abstained extends ethereum.Event {
  get params(): Abstained__Params {
    return new Abstained__Params(this);
  }
}

export class Abstained__Params {
  _event: Abstained;

  constructor(event: Abstained) {
    this._event = event;
  }

  get tokenId(): BigInt {
    return this._event.parameters[0].value.toBigInt();
  }

  get weight(): BigInt {
    return this._event.parameters[1].value.toBigInt();
  }

  get vault(): Address {
    return this._event.parameters[2].value.toAddress();
  }
}

export class Attach extends ethereum.Event {
  get params(): Attach__Params {
    return new Attach__Params(this);
  }
}

export class Attach__Params {
  _event: Attach;

  constructor(event: Attach) {
    this._event = event;
  }

  get owner(): Address {
    return this._event.parameters[0].value.toAddress();
  }

  get sender(): Address {
    return this._event.parameters[1].value.toAddress();
  }

  get stakingToken(): Address {
    return this._event.parameters[2].value.toAddress();
  }

  get tokenId(): BigInt {
    return this._event.parameters[3].value.toBigInt();
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

export class Detach extends ethereum.Event {
  get params(): Detach__Params {
    return new Detach__Params(this);
  }
}

export class Detach__Params {
  _event: Detach;

  constructor(event: Detach) {
    this._event = event;
  }

  get owner(): Address {
    return this._event.parameters[0].value.toAddress();
  }

  get sender(): Address {
    return this._event.parameters[1].value.toAddress();
  }

  get stakingToken(): Address {
    return this._event.parameters[2].value.toAddress();
  }

  get tokenId(): BigInt {
    return this._event.parameters[3].value.toBigInt();
  }
}

export class DistributeReward extends ethereum.Event {
  get params(): DistributeReward__Params {
    return new DistributeReward__Params(this);
  }
}

export class DistributeReward__Params {
  _event: DistributeReward;

  constructor(event: DistributeReward) {
    this._event = event;
  }

  get sender(): Address {
    return this._event.parameters[0].value.toAddress();
  }

  get vault(): Address {
    return this._event.parameters[1].value.toAddress();
  }

  get amount(): BigInt {
    return this._event.parameters[2].value.toBigInt();
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

export class NotifyReward extends ethereum.Event {
  get params(): NotifyReward__Params {
    return new NotifyReward__Params(this);
  }
}

export class NotifyReward__Params {
  _event: NotifyReward;

  constructor(event: NotifyReward) {
    this._event = event;
  }

  get sender(): Address {
    return this._event.parameters[0].value.toAddress();
  }

  get amount(): BigInt {
    return this._event.parameters[1].value.toBigInt();
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

export class Voted extends ethereum.Event {
  get params(): Voted__Params {
    return new Voted__Params(this);
  }
}

export class Voted__Params {
  _event: Voted;

  constructor(event: Voted) {
    this._event = event;
  }

  get voter(): Address {
    return this._event.parameters[0].value.toAddress();
  }

  get tokenId(): BigInt {
    return this._event.parameters[1].value.toBigInt();
  }

  get weight(): BigInt {
    return this._event.parameters[2].value.toBigInt();
  }

  get vault(): Address {
    return this._event.parameters[3].value.toAddress();
  }

  get userWeight(): BigInt {
    return this._event.parameters[4].value.toBigInt();
  }

  get vePower(): BigInt {
    return this._event.parameters[5].value.toBigInt();
  }
}

export class TetuVoterAbi extends ethereum.SmartContract {
  static bind(address: Address): TetuVoterAbi {
    return new TetuVoterAbi("TetuVoterAbi", address);
  }

  PROXY_CONTROLLED_VERSION(): string {
    let result = super.call(
      "PROXY_CONTROLLED_VERSION",
      "PROXY_CONTROLLED_VERSION():(string)",
      []
    );

    return result[0].toString();
  }

  try_PROXY_CONTROLLED_VERSION(): ethereum.CallResult<string> {
    let result = super.tryCall(
      "PROXY_CONTROLLED_VERSION",
      "PROXY_CONTROLLED_VERSION():(string)",
      []
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toString());
  }

  implementation(): Address {
    let result = super.call("implementation", "implementation():(address)", []);

    return result[0].toAddress();
  }

  try_implementation(): ethereum.CallResult<Address> {
    let result = super.tryCall(
      "implementation",
      "implementation():(address)",
      []
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toAddress());
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

  MAX_VOTES(): BigInt {
    let result = super.call("MAX_VOTES", "MAX_VOTES():(uint256)", []);

    return result[0].toBigInt();
  }

  try_MAX_VOTES(): ethereum.CallResult<BigInt> {
    let result = super.tryCall("MAX_VOTES", "MAX_VOTES():(uint256)", []);
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBigInt());
  }

  VOTER_VERSION(): string {
    let result = super.call("VOTER_VERSION", "VOTER_VERSION():(string)", []);

    return result[0].toString();
  }

  try_VOTER_VERSION(): ethereum.CallResult<string> {
    let result = super.tryCall("VOTER_VERSION", "VOTER_VERSION():(string)", []);
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toString());
  }

  VOTE_DELAY(): BigInt {
    let result = super.call("VOTE_DELAY", "VOTE_DELAY():(uint256)", []);

    return result[0].toBigInt();
  }

  try_VOTE_DELAY(): ethereum.CallResult<BigInt> {
    let result = super.tryCall("VOTE_DELAY", "VOTE_DELAY():(uint256)", []);
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBigInt());
  }

  attachedStakingTokens(veId: BigInt): Array<Address> {
    let result = super.call(
      "attachedStakingTokens",
      "attachedStakingTokens(uint256):(address[])",
      [ethereum.Value.fromUnsignedBigInt(veId)]
    );

    return result[0].toAddressArray();
  }

  try_attachedStakingTokens(veId: BigInt): ethereum.CallResult<Array<Address>> {
    let result = super.tryCall(
      "attachedStakingTokens",
      "attachedStakingTokens(uint256):(address[])",
      [ethereum.Value.fromUnsignedBigInt(veId)]
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toAddressArray());
  }

  bribe(): Address {
    let result = super.call("bribe", "bribe():(address)", []);

    return result[0].toAddress();
  }

  try_bribe(): ethereum.CallResult<Address> {
    let result = super.tryCall("bribe", "bribe():(address)", []);
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toAddress());
  }

  claimable(param0: Address): BigInt {
    let result = super.call("claimable", "claimable(address):(uint256)", [
      ethereum.Value.fromAddress(param0)
    ]);

    return result[0].toBigInt();
  }

  try_claimable(param0: Address): ethereum.CallResult<BigInt> {
    let result = super.tryCall("claimable", "claimable(address):(uint256)", [
      ethereum.Value.fromAddress(param0)
    ]);
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

  gauge(): Address {
    let result = super.call("gauge", "gauge():(address)", []);

    return result[0].toAddress();
  }

  try_gauge(): ethereum.CallResult<Address> {
    let result = super.tryCall("gauge", "gauge():(address)", []);
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toAddress());
  }

  getSlot(slot: BigInt): Bytes {
    let result = super.call("getSlot", "getSlot(uint256):(bytes32)", [
      ethereum.Value.fromUnsignedBigInt(slot)
    ]);

    return result[0].toBytes();
  }

  try_getSlot(slot: BigInt): ethereum.CallResult<Bytes> {
    let result = super.tryCall("getSlot", "getSlot(uint256):(bytes32)", [
      ethereum.Value.fromUnsignedBigInt(slot)
    ]);
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBytes());
  }

  index(): BigInt {
    let result = super.call("index", "index():(uint256)", []);

    return result[0].toBigInt();
  }

  try_index(): ethereum.CallResult<BigInt> {
    let result = super.tryCall("index", "index():(uint256)", []);
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

  isVault(_vault: Address): boolean {
    let result = super.call("isVault", "isVault(address):(bool)", [
      ethereum.Value.fromAddress(_vault)
    ]);

    return result[0].toBoolean();
  }

  try_isVault(_vault: Address): ethereum.CallResult<boolean> {
    let result = super.tryCall("isVault", "isVault(address):(bool)", [
      ethereum.Value.fromAddress(_vault)
    ]);
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBoolean());
  }

  isVotesExist(veId: BigInt): boolean {
    let result = super.call("isVotesExist", "isVotesExist(uint256):(bool)", [
      ethereum.Value.fromUnsignedBigInt(veId)
    ]);

    return result[0].toBoolean();
  }

  try_isVotesExist(veId: BigInt): ethereum.CallResult<boolean> {
    let result = super.tryCall("isVotesExist", "isVotesExist(uint256):(bool)", [
      ethereum.Value.fromUnsignedBigInt(veId)
    ]);
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBoolean());
  }

  lastVote(param0: BigInt): BigInt {
    let result = super.call("lastVote", "lastVote(uint256):(uint256)", [
      ethereum.Value.fromUnsignedBigInt(param0)
    ]);

    return result[0].toBigInt();
  }

  try_lastVote(param0: BigInt): ethereum.CallResult<BigInt> {
    let result = super.tryCall("lastVote", "lastVote(uint256):(uint256)", [
      ethereum.Value.fromUnsignedBigInt(param0)
    ]);
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBigInt());
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

  supplyIndex(param0: Address): BigInt {
    let result = super.call("supplyIndex", "supplyIndex(address):(uint256)", [
      ethereum.Value.fromAddress(param0)
    ]);

    return result[0].toBigInt();
  }

  try_supplyIndex(param0: Address): ethereum.CallResult<BigInt> {
    let result = super.tryCall(
      "supplyIndex",
      "supplyIndex(address):(uint256)",
      [ethereum.Value.fromAddress(param0)]
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBigInt());
  }

  supportsInterface(interfaceId: Bytes): boolean {
    let result = super.call(
      "supportsInterface",
      "supportsInterface(bytes4):(bool)",
      [ethereum.Value.fromFixedBytes(interfaceId)]
    );

    return result[0].toBoolean();
  }

  try_supportsInterface(interfaceId: Bytes): ethereum.CallResult<boolean> {
    let result = super.tryCall(
      "supportsInterface",
      "supportsInterface(bytes4):(bool)",
      [ethereum.Value.fromFixedBytes(interfaceId)]
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBoolean());
  }

  token(): Address {
    let result = super.call("token", "token():(address)", []);

    return result[0].toAddress();
  }

  try_token(): ethereum.CallResult<Address> {
    let result = super.tryCall("token", "token():(address)", []);
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toAddress());
  }

  totalWeight(): BigInt {
    let result = super.call("totalWeight", "totalWeight():(uint256)", []);

    return result[0].toBigInt();
  }

  try_totalWeight(): ethereum.CallResult<BigInt> {
    let result = super.tryCall("totalWeight", "totalWeight():(uint256)", []);
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBigInt());
  }

  usedWeights(param0: BigInt): BigInt {
    let result = super.call("usedWeights", "usedWeights(uint256):(uint256)", [
      ethereum.Value.fromUnsignedBigInt(param0)
    ]);

    return result[0].toBigInt();
  }

  try_usedWeights(param0: BigInt): ethereum.CallResult<BigInt> {
    let result = super.tryCall(
      "usedWeights",
      "usedWeights(uint256):(uint256)",
      [ethereum.Value.fromUnsignedBigInt(param0)]
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBigInt());
  }

  validVaults(id: BigInt): Address {
    let result = super.call("validVaults", "validVaults(uint256):(address)", [
      ethereum.Value.fromUnsignedBigInt(id)
    ]);

    return result[0].toAddress();
  }

  try_validVaults(id: BigInt): ethereum.CallResult<Address> {
    let result = super.tryCall(
      "validVaults",
      "validVaults(uint256):(address)",
      [ethereum.Value.fromUnsignedBigInt(id)]
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toAddress());
  }

  validVaultsLength(): BigInt {
    let result = super.call(
      "validVaultsLength",
      "validVaultsLength():(uint256)",
      []
    );

    return result[0].toBigInt();
  }

  try_validVaultsLength(): ethereum.CallResult<BigInt> {
    let result = super.tryCall(
      "validVaultsLength",
      "validVaultsLength():(uint256)",
      []
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBigInt());
  }

  vaultsVotes(param0: BigInt, param1: BigInt): Address {
    let result = super.call(
      "vaultsVotes",
      "vaultsVotes(uint256,uint256):(address)",
      [
        ethereum.Value.fromUnsignedBigInt(param0),
        ethereum.Value.fromUnsignedBigInt(param1)
      ]
    );

    return result[0].toAddress();
  }

  try_vaultsVotes(
    param0: BigInt,
    param1: BigInt
  ): ethereum.CallResult<Address> {
    let result = super.tryCall(
      "vaultsVotes",
      "vaultsVotes(uint256,uint256):(address)",
      [
        ethereum.Value.fromUnsignedBigInt(param0),
        ethereum.Value.fromUnsignedBigInt(param1)
      ]
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toAddress());
  }

  ve(): Address {
    let result = super.call("ve", "ve():(address)", []);

    return result[0].toAddress();
  }

  try_ve(): ethereum.CallResult<Address> {
    let result = super.tryCall("ve", "ve():(address)", []);
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toAddress());
  }

  votedVaultsLength(veId: BigInt): BigInt {
    let result = super.call(
      "votedVaultsLength",
      "votedVaultsLength(uint256):(uint256)",
      [ethereum.Value.fromUnsignedBigInt(veId)]
    );

    return result[0].toBigInt();
  }

  try_votedVaultsLength(veId: BigInt): ethereum.CallResult<BigInt> {
    let result = super.tryCall(
      "votedVaultsLength",
      "votedVaultsLength(uint256):(uint256)",
      [ethereum.Value.fromUnsignedBigInt(veId)]
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBigInt());
  }

  votes(param0: BigInt, param1: Address): BigInt {
    let result = super.call("votes", "votes(uint256,address):(int256)", [
      ethereum.Value.fromUnsignedBigInt(param0),
      ethereum.Value.fromAddress(param1)
    ]);

    return result[0].toBigInt();
  }

  try_votes(param0: BigInt, param1: Address): ethereum.CallResult<BigInt> {
    let result = super.tryCall("votes", "votes(uint256,address):(int256)", [
      ethereum.Value.fromUnsignedBigInt(param0),
      ethereum.Value.fromAddress(param1)
    ]);
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBigInt());
  }

  weights(param0: Address): BigInt {
    let result = super.call("weights", "weights(address):(int256)", [
      ethereum.Value.fromAddress(param0)
    ]);

    return result[0].toBigInt();
  }

  try_weights(param0: Address): ethereum.CallResult<BigInt> {
    let result = super.tryCall("weights", "weights(address):(int256)", [
      ethereum.Value.fromAddress(param0)
    ]);
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBigInt());
  }
}

export class DefaultCall extends ethereum.Call {
  get inputs(): DefaultCall__Inputs {
    return new DefaultCall__Inputs(this);
  }

  get outputs(): DefaultCall__Outputs {
    return new DefaultCall__Outputs(this);
  }
}

export class DefaultCall__Inputs {
  _call: DefaultCall;

  constructor(call: DefaultCall) {
    this._call = call;
  }
}

export class DefaultCall__Outputs {
  _call: DefaultCall;

  constructor(call: DefaultCall) {
    this._call = call;
  }
}

export class InitProxyCall extends ethereum.Call {
  get inputs(): InitProxyCall__Inputs {
    return new InitProxyCall__Inputs(this);
  }

  get outputs(): InitProxyCall__Outputs {
    return new InitProxyCall__Outputs(this);
  }
}

export class InitProxyCall__Inputs {
  _call: InitProxyCall;

  constructor(call: InitProxyCall) {
    this._call = call;
  }

  get _logic(): Address {
    return this._call.inputValues[0].value.toAddress();
  }
}

export class InitProxyCall__Outputs {
  _call: InitProxyCall;

  constructor(call: InitProxyCall) {
    this._call = call;
  }
}

export class UpgradeCall extends ethereum.Call {
  get inputs(): UpgradeCall__Inputs {
    return new UpgradeCall__Inputs(this);
  }

  get outputs(): UpgradeCall__Outputs {
    return new UpgradeCall__Outputs(this);
  }
}

export class UpgradeCall__Inputs {
  _call: UpgradeCall;

  constructor(call: UpgradeCall) {
    this._call = call;
  }

  get _newImplementation(): Address {
    return this._call.inputValues[0].value.toAddress();
  }
}

export class UpgradeCall__Outputs {
  _call: UpgradeCall;

  constructor(call: UpgradeCall) {
    this._call = call;
  }
}

export class AttachTokenToGaugeCall extends ethereum.Call {
  get inputs(): AttachTokenToGaugeCall__Inputs {
    return new AttachTokenToGaugeCall__Inputs(this);
  }

  get outputs(): AttachTokenToGaugeCall__Outputs {
    return new AttachTokenToGaugeCall__Outputs(this);
  }
}

export class AttachTokenToGaugeCall__Inputs {
  _call: AttachTokenToGaugeCall;

  constructor(call: AttachTokenToGaugeCall) {
    this._call = call;
  }

  get stakingToken(): Address {
    return this._call.inputValues[0].value.toAddress();
  }

  get tokenId(): BigInt {
    return this._call.inputValues[1].value.toBigInt();
  }

  get account(): Address {
    return this._call.inputValues[2].value.toAddress();
  }
}

export class AttachTokenToGaugeCall__Outputs {
  _call: AttachTokenToGaugeCall;

  constructor(call: AttachTokenToGaugeCall) {
    this._call = call;
  }
}

export class DetachTokenFromAllCall extends ethereum.Call {
  get inputs(): DetachTokenFromAllCall__Inputs {
    return new DetachTokenFromAllCall__Inputs(this);
  }

  get outputs(): DetachTokenFromAllCall__Outputs {
    return new DetachTokenFromAllCall__Outputs(this);
  }
}

export class DetachTokenFromAllCall__Inputs {
  _call: DetachTokenFromAllCall;

  constructor(call: DetachTokenFromAllCall) {
    this._call = call;
  }

  get tokenId(): BigInt {
    return this._call.inputValues[0].value.toBigInt();
  }

  get account(): Address {
    return this._call.inputValues[1].value.toAddress();
  }
}

export class DetachTokenFromAllCall__Outputs {
  _call: DetachTokenFromAllCall;

  constructor(call: DetachTokenFromAllCall) {
    this._call = call;
  }
}

export class DetachTokenFromGaugeCall extends ethereum.Call {
  get inputs(): DetachTokenFromGaugeCall__Inputs {
    return new DetachTokenFromGaugeCall__Inputs(this);
  }

  get outputs(): DetachTokenFromGaugeCall__Outputs {
    return new DetachTokenFromGaugeCall__Outputs(this);
  }
}

export class DetachTokenFromGaugeCall__Inputs {
  _call: DetachTokenFromGaugeCall;

  constructor(call: DetachTokenFromGaugeCall) {
    this._call = call;
  }

  get stakingToken(): Address {
    return this._call.inputValues[0].value.toAddress();
  }

  get tokenId(): BigInt {
    return this._call.inputValues[1].value.toBigInt();
  }

  get account(): Address {
    return this._call.inputValues[2].value.toAddress();
  }
}

export class DetachTokenFromGaugeCall__Outputs {
  _call: DetachTokenFromGaugeCall;

  constructor(call: DetachTokenFromGaugeCall) {
    this._call = call;
  }
}

export class DistributeCall extends ethereum.Call {
  get inputs(): DistributeCall__Inputs {
    return new DistributeCall__Inputs(this);
  }

  get outputs(): DistributeCall__Outputs {
    return new DistributeCall__Outputs(this);
  }
}

export class DistributeCall__Inputs {
  _call: DistributeCall;

  constructor(call: DistributeCall) {
    this._call = call;
  }

  get _vault(): Address {
    return this._call.inputValues[0].value.toAddress();
  }
}

export class DistributeCall__Outputs {
  _call: DistributeCall;

  constructor(call: DistributeCall) {
    this._call = call;
  }
}

export class DistributeAllCall extends ethereum.Call {
  get inputs(): DistributeAllCall__Inputs {
    return new DistributeAllCall__Inputs(this);
  }

  get outputs(): DistributeAllCall__Outputs {
    return new DistributeAllCall__Outputs(this);
  }
}

export class DistributeAllCall__Inputs {
  _call: DistributeAllCall;

  constructor(call: DistributeAllCall) {
    this._call = call;
  }
}

export class DistributeAllCall__Outputs {
  _call: DistributeAllCall;

  constructor(call: DistributeAllCall) {
    this._call = call;
  }
}

export class DistributeForCall extends ethereum.Call {
  get inputs(): DistributeForCall__Inputs {
    return new DistributeForCall__Inputs(this);
  }

  get outputs(): DistributeForCall__Outputs {
    return new DistributeForCall__Outputs(this);
  }
}

export class DistributeForCall__Inputs {
  _call: DistributeForCall;

  constructor(call: DistributeForCall) {
    this._call = call;
  }

  get start(): BigInt {
    return this._call.inputValues[0].value.toBigInt();
  }

  get finish(): BigInt {
    return this._call.inputValues[1].value.toBigInt();
  }
}

export class DistributeForCall__Outputs {
  _call: DistributeForCall;

  constructor(call: DistributeForCall) {
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

  get _controller(): Address {
    return this._call.inputValues[0].value.toAddress();
  }

  get _ve(): Address {
    return this._call.inputValues[1].value.toAddress();
  }

  get _rewardToken(): Address {
    return this._call.inputValues[2].value.toAddress();
  }

  get _gauge(): Address {
    return this._call.inputValues[3].value.toAddress();
  }

  get _bribe(): Address {
    return this._call.inputValues[4].value.toAddress();
  }
}

export class InitCall__Outputs {
  _call: InitCall;

  constructor(call: InitCall) {
    this._call = call;
  }
}

export class NotifyRewardAmountCall extends ethereum.Call {
  get inputs(): NotifyRewardAmountCall__Inputs {
    return new NotifyRewardAmountCall__Inputs(this);
  }

  get outputs(): NotifyRewardAmountCall__Outputs {
    return new NotifyRewardAmountCall__Outputs(this);
  }
}

export class NotifyRewardAmountCall__Inputs {
  _call: NotifyRewardAmountCall;

  constructor(call: NotifyRewardAmountCall) {
    this._call = call;
  }

  get amount(): BigInt {
    return this._call.inputValues[0].value.toBigInt();
  }
}

export class NotifyRewardAmountCall__Outputs {
  _call: NotifyRewardAmountCall;

  constructor(call: NotifyRewardAmountCall) {
    this._call = call;
  }
}

export class PokeCall extends ethereum.Call {
  get inputs(): PokeCall__Inputs {
    return new PokeCall__Inputs(this);
  }

  get outputs(): PokeCall__Outputs {
    return new PokeCall__Outputs(this);
  }
}

export class PokeCall__Inputs {
  _call: PokeCall;

  constructor(call: PokeCall) {
    this._call = call;
  }

  get _tokenId(): BigInt {
    return this._call.inputValues[0].value.toBigInt();
  }
}

export class PokeCall__Outputs {
  _call: PokeCall;

  constructor(call: PokeCall) {
    this._call = call;
  }
}

export class ResetCall extends ethereum.Call {
  get inputs(): ResetCall__Inputs {
    return new ResetCall__Inputs(this);
  }

  get outputs(): ResetCall__Outputs {
    return new ResetCall__Outputs(this);
  }
}

export class ResetCall__Inputs {
  _call: ResetCall;

  constructor(call: ResetCall) {
    this._call = call;
  }

  get tokenId(): BigInt {
    return this._call.inputValues[0].value.toBigInt();
  }
}

export class ResetCall__Outputs {
  _call: ResetCall;

  constructor(call: ResetCall) {
    this._call = call;
  }
}

export class UpdateAllCall extends ethereum.Call {
  get inputs(): UpdateAllCall__Inputs {
    return new UpdateAllCall__Inputs(this);
  }

  get outputs(): UpdateAllCall__Outputs {
    return new UpdateAllCall__Outputs(this);
  }
}

export class UpdateAllCall__Inputs {
  _call: UpdateAllCall;

  constructor(call: UpdateAllCall) {
    this._call = call;
  }
}

export class UpdateAllCall__Outputs {
  _call: UpdateAllCall;

  constructor(call: UpdateAllCall) {
    this._call = call;
  }
}

export class UpdateForCall extends ethereum.Call {
  get inputs(): UpdateForCall__Inputs {
    return new UpdateForCall__Inputs(this);
  }

  get outputs(): UpdateForCall__Outputs {
    return new UpdateForCall__Outputs(this);
  }
}

export class UpdateForCall__Inputs {
  _call: UpdateForCall;

  constructor(call: UpdateForCall) {
    this._call = call;
  }

  get _vaults(): Array<Address> {
    return this._call.inputValues[0].value.toAddressArray();
  }
}

export class UpdateForCall__Outputs {
  _call: UpdateForCall;

  constructor(call: UpdateForCall) {
    this._call = call;
  }
}

export class UpdateForRangeCall extends ethereum.Call {
  get inputs(): UpdateForRangeCall__Inputs {
    return new UpdateForRangeCall__Inputs(this);
  }

  get outputs(): UpdateForRangeCall__Outputs {
    return new UpdateForRangeCall__Outputs(this);
  }
}

export class UpdateForRangeCall__Inputs {
  _call: UpdateForRangeCall;

  constructor(call: UpdateForRangeCall) {
    this._call = call;
  }

  get start(): BigInt {
    return this._call.inputValues[0].value.toBigInt();
  }

  get end(): BigInt {
    return this._call.inputValues[1].value.toBigInt();
  }
}

export class UpdateForRangeCall__Outputs {
  _call: UpdateForRangeCall;

  constructor(call: UpdateForRangeCall) {
    this._call = call;
  }
}

export class VoteCall extends ethereum.Call {
  get inputs(): VoteCall__Inputs {
    return new VoteCall__Inputs(this);
  }

  get outputs(): VoteCall__Outputs {
    return new VoteCall__Outputs(this);
  }
}

export class VoteCall__Inputs {
  _call: VoteCall;

  constructor(call: VoteCall) {
    this._call = call;
  }

  get tokenId(): BigInt {
    return this._call.inputValues[0].value.toBigInt();
  }

  get _vaultVotes(): Array<Address> {
    return this._call.inputValues[1].value.toAddressArray();
  }

  get _weights(): Array<BigInt> {
    return this._call.inputValues[2].value.toBigIntArray();
  }
}

export class VoteCall__Outputs {
  _call: VoteCall;

  constructor(call: VoteCall) {
    this._call = call;
  }
}
