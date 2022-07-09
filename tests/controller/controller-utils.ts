import {newMockEvent} from "matchstick-as/assembly/index"
import {
  AddressChangeAnnounced,
  AddressChanged,
  ContractInitialized
} from "../../src/types/ControllerData/ControllerAbi";
import {Address, BigInt, ethereum} from "@graphprotocol/graph-ts";
import {assert, createMockedFunction} from "matchstick-as";
import {ADDRESS_ZERO} from "../../src/constants";
import {
  handleAddressChangeAnnounced,
  handleAddressChanged,
  handleContractInitialized,
  mapAnnounceType
} from "../../src/controller";

export const CONTROLLER_ADDRESS = '0x1100000000000000000000000000000000000001';
export const CONTROLLER_ENTITY_NAME = 'ControllerEntity';
export const ADR_CHANGE_ENTITY_NAME = 'AddressChangeAnnounceEntity';
export const PROXY_UPGRADE_ENTITY_NAME = 'ProxyUpgradeAnnounceEntity';
export const TIME_LOCK = BigInt.fromI32(60 * 60 * 18).toString();

export function createMockController(): void {
  createMockedFunction(Address.fromString(CONTROLLER_ADDRESS), "CONTROLLER_VERSION", "CONTROLLER_VERSION():(string)")
    .returns([ethereum.Value.fromString('0')])
  createMockedFunction(Address.fromString(CONTROLLER_ADDRESS), "implementation", "implementation():(address)")
    .returns([ethereum.Value.fromAddress(Address.fromString(ADDRESS_ZERO))])
  createMockedFunction(Address.fromString(CONTROLLER_ADDRESS), "governance", "governance():(address)")
    .returns([ethereum.Value.fromAddress(Address.fromString(ADDRESS_ZERO))])
  handleContractInitialized(eventContractInitialized(CONTROLLER_ADDRESS, BigInt.fromI32(111), BigInt.fromI32(222)))
}

export function eventContractInitialized(
  controllerAdr: string,
  ts: BigInt,
  block: BigInt,
): ContractInitialized {
  // @ts-ignore
  const event = changetype<ContractInitialized>(newMockEvent());
  event.parameters = [];
  event.parameters.push(new ethereum.EventParam("controller", ethereum.Value.fromAddress(Address.fromString(controllerAdr))))
  event.parameters.push(new ethereum.EventParam("ts", ethereum.Value.fromSignedBigInt(ts)))
  event.parameters.push(new ethereum.EventParam("block", ethereum.Value.fromSignedBigInt(block)))
  return event;
}

export function createAndCheckAddressChangeAnnounced(_type: BigInt, newAddress: string): void {
  const typeName = mapAnnounceType(_type);
  // @ts-ignore
  const event = changetype<AddressChangeAnnounced>(newMockEvent());
  event.parameters = [];
  event.block.timestamp = BigInt.fromI32(0);
  event.address = Address.fromString(CONTROLLER_ADDRESS);
  event.parameters.push(new ethereum.EventParam("_type", ethereum.Value.fromSignedBigInt(_type)))
  event.parameters.push(new ethereum.EventParam("value", ethereum.Value.fromAddress(Address.fromString(newAddress))))

  handleAddressChangeAnnounced(event)

  assert.fieldEquals(ADR_CHANGE_ENTITY_NAME, typeName, 'controller', CONTROLLER_ADDRESS)
  assert.fieldEquals(ADR_CHANGE_ENTITY_NAME, typeName, 'aType', typeName)
  assert.fieldEquals(ADR_CHANGE_ENTITY_NAME, typeName, 'idType', _type.toString())
  assert.fieldEquals(ADR_CHANGE_ENTITY_NAME, typeName, 'newAddress', newAddress)
  assert.fieldEquals(ADR_CHANGE_ENTITY_NAME, typeName, 'timeLockAt', TIME_LOCK)
}

export function changeAnnouncedAddress(_type: BigInt, newAddress: string, fieldName: string): void {
  createAndCheckAddressChangeAnnounced(_type, newAddress)

  // @ts-ignore
  const event = changetype<AddressChanged>(newMockEvent());
  event.block.timestamp = BigInt.fromI32(0);
  event.address = Address.fromString(CONTROLLER_ADDRESS);
  event.parameters = [];
  event.parameters.push(new ethereum.EventParam("_type", ethereum.Value.fromSignedBigInt(_type)))
  event.parameters.push(new ethereum.EventParam("oldAddress", ethereum.Value.fromAddress(Address.fromString(ADDRESS_ZERO))))
  event.parameters.push(new ethereum.EventParam("newAddress", ethereum.Value.fromAddress(Address.fromString(newAddress))))

  handleAddressChanged(event);

  assert.fieldEquals(CONTROLLER_ENTITY_NAME, CONTROLLER_ADDRESS, fieldName, newAddress)
}
