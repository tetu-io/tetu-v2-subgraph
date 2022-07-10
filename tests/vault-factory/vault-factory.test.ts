import {afterEach, beforeEach, clearStore, describe, test} from "matchstick-as/assembly/index"
import {
  mockVaultFactoryFunctions,
  VAULT_FACTORY_ADR,
  VAULT_FACTORY_ENTITY,
  vaultDeployedWithDefaults
} from "./vault-factory-utils";
import {
  handleSplitterImplChanged,
  handleVaultImplChanged,
  handleVaultInsuranceImplChanged
} from "../../src/vault-factory";
import {
  SplitterImplChanged,
  VaultImplChanged,
  VaultInsuranceImplChanged
} from "../../src/types/VaultFactoryData/VaultFactoryAbi";
import {assert, newMockEvent} from "matchstick-as";
import {Address, ethereum} from "@graphprotocol/graph-ts";
import {ADDRESS_MOCK1} from "../utils";


// COVERAGE https://thegraph.com/docs/en/developer/matchstick/#export-your-handlers


beforeEach(() => {
  // createMockVaultFactory();
})

afterEach(() => {
  clearStore();
})

describe("vault_factory_tests", () => {
  test("handleVaultDeployed test", () => {
    vaultDeployedWithDefaults();
  });

  test("handleVaultImplChanged test", () => {
    mockVaultFactoryFunctions();

    // @ts-ignore
    const event = changetype<VaultImplChanged>(newMockEvent());
    event.parameters = [];
    event.address = Address.fromString(VAULT_FACTORY_ADR);
    event.parameters.push(new ethereum.EventParam("value", ethereum.Value.fromAddress(Address.fromString(ADDRESS_MOCK1))))

    handleVaultImplChanged(event);

    assert.fieldEquals(VAULT_FACTORY_ENTITY, VAULT_FACTORY_ADR, 'vaultImpl', ADDRESS_MOCK1)
  });

  test("handleVaultInsuranceImplChanged test", () => {
    mockVaultFactoryFunctions();

    // @ts-ignore
    const event = changetype<VaultInsuranceImplChanged>(newMockEvent());
    event.parameters = [];
    event.address = Address.fromString(VAULT_FACTORY_ADR);
    event.parameters.push(new ethereum.EventParam("value", ethereum.Value.fromAddress(Address.fromString(ADDRESS_MOCK1))))

    handleVaultInsuranceImplChanged(event);

    assert.fieldEquals(VAULT_FACTORY_ENTITY, VAULT_FACTORY_ADR, 'vaultInsuranceImpl', ADDRESS_MOCK1)
  });

  test("handleSplitterImplChanged test", () => {
    mockVaultFactoryFunctions();

    // @ts-ignore
    const event = changetype<SplitterImplChanged>(newMockEvent());
    event.parameters = [];
    event.address = Address.fromString(VAULT_FACTORY_ADR);
    event.parameters.push(new ethereum.EventParam("value", ethereum.Value.fromAddress(Address.fromString(ADDRESS_MOCK1))))

    handleSplitterImplChanged(event);

    assert.fieldEquals(VAULT_FACTORY_ENTITY, VAULT_FACTORY_ADR, 'splitterImpl', ADDRESS_MOCK1)
  });

})
