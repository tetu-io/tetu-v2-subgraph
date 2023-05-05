import {assert, createMockedFunction, newMockEvent} from "matchstick-as";
import {Address, BigInt, ethereum} from "@graphprotocol/graph-ts";
import {TETU_VOTER_ENTITY_NAME} from "./tetu-voter/tetu-voter-utils";
import {CONTROLLER_ADDRESS} from "./controller/controller-utils";

export const ADDRESS_USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
export const ADDRESS_LIQUIDATOR = '0x4404040000000000000000000000000000000001'
export const ADDRESS_MOCK1 = '0x0000000000000000000000000000000000000001'
export const ADDRESS_MOCK2 = '0x0000000000000000000000000000000000000002'
export const ADDRESS_MOCK3 = '0x0000000000000000000000000000000000000003'
export const ADDRESS_MOCK4 = '0x0000000000000000000000000000000000000004'
export const ADDRESS_MOCK5 = '0x0000000000000000000000000000000000000005'
export const ADDRESS_MOCK6 = '0x0000000000000000000000000000000000000006'
export const ADDRESS_MOCK7 = '0x0000000000000000000000000000000000000007'
export const ADDRESS_MOCK8 = '0x0000000000000000000000000000000000000008'
export const ADDRESS_MOCK9 = '0x0000000000000000000000000000000000000009'

export const WEEK = 60 * 60 * 24 * 7;
export const WEEK_BI = BigInt.fromI32(WEEK);
export const DEFAULT_VERSION = '1.0.1';
export const DEFAULT_REVISION = 100;
export const DEFAULT_CREATED = 68149212;
export const DEFAULT_BLOCK = 42323431;

export function checkRevision(
  entity: string,
  id: string,
  expectedValue: string
): void {
  assert.fieldEquals(entity, id, 'revision', expectedValue)
}

export function mockRevisionIncreasedEvent(address: string, value: string): ethereum.Event {
  const event = newMockEvent();
  event.parameters = [];
  event.address = Address.fromString(address);
  event.parameters.push(new ethereum.EventParam("value", ethereum.Value.fromSignedBigInt(BigInt.fromString(value))))
  return event;
}

export function mockUpgradedEvent(address: string, value: string): ethereum.Event {
  const event = newMockEvent();
  event.parameters = [];
  event.address = Address.fromString(address);
  event.parameters.push(new ethereum.EventParam("implementation", ethereum.Value.fromAddress(Address.fromString(value))))
  return event;
}

export function mockControllableAttributes(
  target: string,
  versionName: string,
  version: string,
  revision: string,
  created: string,
  createdBlock: string,
  impl: string,
  controller: string,
): void {
  createMockedFunction(Address.fromString(target), versionName, `${versionName}():(string)`)
    .returns([ethereum.Value.fromString(version)])
  createMockedFunction(Address.fromString(target), "revision", "revision():(uint256)")
    .returns([ethereum.Value.fromSignedBigInt(BigInt.fromString(revision))])
  createMockedFunction(Address.fromString(target), "created", "created():(uint256)")
    .returns([ethereum.Value.fromSignedBigInt(BigInt.fromString(created))])
  createMockedFunction(Address.fromString(target), "createdBlock", "createdBlock():(uint256)")
    .returns([ethereum.Value.fromSignedBigInt(BigInt.fromString(createdBlock))])
  createMockedFunction(Address.fromString(target), "implementation", "implementation():(address)")
    .returns([ethereum.Value.fromAddress(Address.fromString(impl))])
  createMockedFunction(Address.fromString(target), "controller", "controller():(address)")
    .returns([ethereum.Value.fromAddress(Address.fromString(controller))])
}

export function checkControllableAttributes(
  entityName: string,
  entityId: string,
  version: string,
  revision: string,
  created: string,
  createdBlock: string,
  impl: string,
  controller: string,
): void {
  assert.fieldEquals(entityName, entityId, 'version', version)
  assert.fieldEquals(entityName, entityId, 'revision', revision)
  assert.fieldEquals(entityName, entityId, 'createdTs', created)
  assert.fieldEquals(entityName, entityId, 'createdBlock', createdBlock)
  assert.fieldEquals(entityName, entityId, 'implementations', `[${impl}]`)
  assert.fieldEquals(entityName, entityId, 'controller', controller)
}
