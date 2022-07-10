import {afterEach, beforeEach, clearStore, describe, test} from "matchstick-as/assembly/index"
import {vaultDeployedWithDefaults} from "./vault-factory-utils";


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


})
