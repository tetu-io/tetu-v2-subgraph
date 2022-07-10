import {
  afterEach,
  assert,
  beforeEach,
  clearStore,
  createMockedFunction,
  describe,
  test
} from "matchstick-as/assembly/index"
import {Address, BigInt, ethereum} from "@graphprotocol/graph-ts"

import {
  handleAddressAnnounceRemove,
  handleContractInitialized, handleOperatorAdded, handleOperatorRemoved,
  handleProxyAnnounceRemoved,
  handleProxyUpgradeAnnounced,
  handleProxyUpgraded, handleRegisterVault,
  handleRevisionIncreased,
  handleUpgraded, handleVaultRemoved,
  mapAnnounceType
} from "../../src/controller"
import {ADDRESS_ZERO} from "../../src/constants";
import {
  ADDRESS_MOCK1,
  ADDRESS_MOCK2,
  ADDRESS_MOCK3,
  ADDRESS_MOCK4,
  ADDRESS_MOCK5,
  ADDRESS_MOCK6, checkControllableAttributes, mockControllableAttributes,
  mockRevisionIncreasedEvent,
  mockUpgradedEvent, WEEK, WEEK_BI
} from "../utils";
import {ControllerEntity} from "../../src/types/schema";
import {
  ADR_CHANGE_ENTITY_NAME,
  changeAnnouncedAddress,
  CONTROLLER_ADDRESS,
  CONTROLLER_ENTITY_NAME, createAndCheckAddressChangeAnnounced,
  createMockController,
  eventContractInitialized, PROXY_UPGRADE_ENTITY_NAME, TIME_LOCK
} from "./controller-utils";
import {
  AddressAnnounceRemove,
  AddressChangeAnnounced,
  OperatorAdded, OperatorRemoved,
  ProxyAnnounceRemoved,
  ProxyUpgradeAnnounced,
  ProxyUpgraded,
  RegisterVault,
  RevisionIncreased,
  Upgraded,
  VaultRemoved
} from "../../src/types/ControllerData/ControllerAbi";
import {TETU_VOTER_ENTITY_NAME} from "../tetu-voter/tetu-voter-utils";
import {formatUnits} from "../../src/helpers";
import {PLATFORM_VOTER_ENTITY_NAME} from "../platform-voter/platform-voter-utils";
import {FORWARDER_ENTITY_NAME} from "../forwarder/forwarder-utils";
import {INVEST_FUND_ENTITY_NAME} from "../invest-fund/invest-fund-utils";
import {VE_DIST_ENTITY_NAME} from "../ve-dist/ve-dist-utils";
import {newMockEvent} from "matchstick-as";


// COVERAGE https://thegraph.com/docs/en/developer/matchstick/#export-your-handlers
export {handleContractInitialized}
export {handleRevisionIncreased}
export {handleUpgraded}
export {changeAnnouncedAddress}


beforeEach(() => {
  createMockController();
})

afterEach(() => {
  clearStore();
})

describe("Controller_tests", () => {
  test("handleContractInitialized test", () => {
    const event = eventContractInitialized(ADDRESS_MOCK1, BigInt.fromI32(1), BigInt.fromI32(2));

    createMockedFunction(Address.fromString(ADDRESS_MOCK1), "CONTROLLER_VERSION", "CONTROLLER_VERSION():(string)")
      .returns([ethereum.Value.fromString('11')])
    createMockedFunction(Address.fromString(ADDRESS_MOCK1), "implementation", "implementation():(address)")
      .returns([ethereum.Value.fromAddress(Address.fromString(ADDRESS_MOCK2))])
    createMockedFunction(Address.fromString(ADDRESS_MOCK1), "governance", "governance():(address)")
      .returns([ethereum.Value.fromAddress(Address.fromString(ADDRESS_MOCK3))])

    handleContractInitialized(event)

    const controller = ControllerEntity.load(ADDRESS_MOCK1) as ControllerEntity;

    assert.equals(ethereum.Value.fromString(controller.version), ethereum.Value.fromString("11"))
    assert.equals(ethereum.Value.fromI32(controller.revision), ethereum.Value.fromI32(0))
    assert.equals(ethereum.Value.fromI32(controller.createdTs), ethereum.Value.fromI32(1))
    assert.equals(ethereum.Value.fromI32(controller.createdBlock), ethereum.Value.fromI32(2))
    assert.equals(ethereum.Value.fromAddressArray([Address.fromString(controller.implementations[0])]), ethereum.Value.fromAddressArray([Address.fromString(ADDRESS_MOCK2)]))

    assert.equals(ethereum.Value.fromAddress(Address.fromString(controller.tetuVoter)), ethereum.Value.fromAddress(Address.fromString(ADDRESS_ZERO)))
    assert.equals(ethereum.Value.fromAddress(Address.fromString(controller.liquidator)), ethereum.Value.fromAddress(Address.fromString(ADDRESS_ZERO)))
    assert.equals(ethereum.Value.fromAddress(Address.fromString(controller.forwarder)), ethereum.Value.fromAddress(Address.fromString(ADDRESS_ZERO)))
    assert.equals(ethereum.Value.fromAddress(Address.fromString(controller.investFund)), ethereum.Value.fromAddress(Address.fromString(ADDRESS_ZERO)))
    assert.equals(ethereum.Value.fromAddress(Address.fromString(controller.veDistributor)), ethereum.Value.fromAddress(Address.fromString(ADDRESS_ZERO)))
    assert.equals(ethereum.Value.fromAddress(Address.fromString(controller.platformVoter)), ethereum.Value.fromAddress(Address.fromString(ADDRESS_ZERO)))

    assert.fieldEquals(CONTROLLER_ENTITY_NAME, ADDRESS_MOCK1, 'governance', ADDRESS_MOCK3)
    assert.fieldEquals(CONTROLLER_ENTITY_NAME, ADDRESS_MOCK1, 'whitelistedVaults', '0')
    assert.fieldEquals(CONTROLLER_ENTITY_NAME, ADDRESS_MOCK1, 'operators', `[${ADDRESS_MOCK3}]`)
  });

  test('handleRevisionIncreased test', () => {
    const value = '9';
    // @ts-ignore
    handleRevisionIncreased(changetype<RevisionIncreased>(mockRevisionIncreasedEvent(CONTROLLER_ADDRESS, value)));
    assert.fieldEquals(CONTROLLER_ENTITY_NAME, CONTROLLER_ADDRESS, 'revision', value)
  })

  test('handleUpgraded test', () => {
    const value = ADDRESS_MOCK1;
    // @ts-ignore
    handleUpgraded(changetype<Upgraded>(mockUpgradedEvent(CONTROLLER_ADDRESS, value)));
    assert.fieldEquals(CONTROLLER_ENTITY_NAME, CONTROLLER_ADDRESS, 'implementations', `[${ADDRESS_ZERO}, ${value}]`)
  })

  test('remove announce test', () => {
    createAndCheckAddressChangeAnnounced(BigInt.fromI32(1), ADDRESS_MOCK1);

    // @ts-ignore
    const event = changetype<AddressAnnounceRemove>(newMockEvent());
    event.parameters = [];
    event.block.timestamp = BigInt.fromI32(0);
    event.address = Address.fromString(CONTROLLER_ADDRESS);
    event.parameters.push(new ethereum.EventParam("_type", ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(1))))

    handleAddressAnnounceRemove(event);

    const typeName = mapAnnounceType(BigInt.fromI32(1));
    assert.notInStore(ADR_CHANGE_ENTITY_NAME, typeName)
  })

  test('proxy update test', () => {
    // @ts-ignore
    const event = changetype<ProxyUpgradeAnnounced>(newMockEvent());
    event.parameters = [];
    event.block.timestamp = BigInt.fromI32(0);
    event.address = Address.fromString(CONTROLLER_ADDRESS);
    event.parameters.push(new ethereum.EventParam("proxy", ethereum.Value.fromAddress(Address.fromString(ADDRESS_MOCK1))))
    event.parameters.push(new ethereum.EventParam("implementation", ethereum.Value.fromAddress(Address.fromString(ADDRESS_MOCK2))))

    handleProxyUpgradeAnnounced(event);

    assert.fieldEquals(PROXY_UPGRADE_ENTITY_NAME, ADDRESS_MOCK1, 'controller', CONTROLLER_ADDRESS)
    assert.fieldEquals(PROXY_UPGRADE_ENTITY_NAME, ADDRESS_MOCK1, 'proxy', ADDRESS_MOCK1)
    assert.fieldEquals(PROXY_UPGRADE_ENTITY_NAME, ADDRESS_MOCK1, 'implementation', ADDRESS_MOCK2)
    assert.fieldEquals(PROXY_UPGRADE_ENTITY_NAME, ADDRESS_MOCK1, 'timeLockAt', TIME_LOCK)

    // @ts-ignore
    const event2 = changetype<ProxyUpgraded>(newMockEvent());
    event2.parameters = [];
    event2.block.timestamp = BigInt.fromI32(0);
    event2.address = Address.fromString(CONTROLLER_ADDRESS);
    event2.parameters.push(new ethereum.EventParam("proxy", ethereum.Value.fromAddress(Address.fromString(ADDRESS_MOCK1))))

    handleProxyUpgraded(event2);

    assert.notInStore(PROXY_UPGRADE_ENTITY_NAME, ADDRESS_MOCK1)
  })

  test('proxy update remove test', () => {
    // @ts-ignore
    const event = changetype<ProxyUpgradeAnnounced>(newMockEvent());
    event.parameters = [];
    event.block.timestamp = BigInt.fromI32(0);
    event.address = Address.fromString(CONTROLLER_ADDRESS);
    event.parameters.push(new ethereum.EventParam("proxy", ethereum.Value.fromAddress(Address.fromString(ADDRESS_MOCK1))))
    event.parameters.push(new ethereum.EventParam("implementation", ethereum.Value.fromAddress(Address.fromString(ADDRESS_MOCK2))))

    handleProxyUpgradeAnnounced(event);

    assert.fieldEquals(PROXY_UPGRADE_ENTITY_NAME, ADDRESS_MOCK1, 'controller', CONTROLLER_ADDRESS)
    assert.fieldEquals(PROXY_UPGRADE_ENTITY_NAME, ADDRESS_MOCK1, 'proxy', ADDRESS_MOCK1)
    assert.fieldEquals(PROXY_UPGRADE_ENTITY_NAME, ADDRESS_MOCK1, 'implementation', ADDRESS_MOCK2)
    assert.fieldEquals(PROXY_UPGRADE_ENTITY_NAME, ADDRESS_MOCK1, 'timeLockAt', TIME_LOCK)

    // @ts-ignore
    const event2 = changetype<ProxyAnnounceRemoved>(newMockEvent());
    event2.parameters = [];
    event2.block.timestamp = BigInt.fromI32(0);
    event2.address = Address.fromString(CONTROLLER_ADDRESS);
    event2.parameters.push(new ethereum.EventParam("proxy", ethereum.Value.fromAddress(Address.fromString(ADDRESS_MOCK1))))

    handleProxyAnnounceRemoved(event2);

    assert.notInStore(PROXY_UPGRADE_ENTITY_NAME, ADDRESS_MOCK1)
  })

  test('vault register test', () => {
// @ts-ignore
    const event = changetype<RegisterVault>(newMockEvent());
    event.parameters = [];
    event.block.timestamp = BigInt.fromI32(0);
    event.address = Address.fromString(CONTROLLER_ADDRESS);
    event.parameters.push(new ethereum.EventParam("vault", ethereum.Value.fromAddress(Address.fromString(ADDRESS_MOCK1))))

    handleRegisterVault(event);

    assert.fieldEquals(CONTROLLER_ENTITY_NAME, CONTROLLER_ADDRESS, 'whitelistedVaults', '1');
  })

  test('vault remove test', () => {
// @ts-ignore
    const event = changetype<VaultRemoved>(newMockEvent());
    event.parameters = [];
    event.block.timestamp = BigInt.fromI32(0);
    event.address = Address.fromString(CONTROLLER_ADDRESS);
    event.parameters.push(new ethereum.EventParam("vault", ethereum.Value.fromAddress(Address.fromString(ADDRESS_MOCK1))))

    handleVaultRemoved(event);

    assert.fieldEquals(CONTROLLER_ENTITY_NAME, CONTROLLER_ADDRESS, 'whitelistedVaults', '-1');
  })

  test('operator added test', () => {
// @ts-ignore
    const event = changetype<OperatorAdded>(newMockEvent());
    event.parameters = [];
    event.block.timestamp = BigInt.fromI32(0);
    event.address = Address.fromString(CONTROLLER_ADDRESS);
    event.parameters.push(new ethereum.EventParam("operator", ethereum.Value.fromAddress(Address.fromString(ADDRESS_MOCK1))))

    handleOperatorAdded(event);

    assert.fieldEquals(CONTROLLER_ENTITY_NAME, CONTROLLER_ADDRESS, 'operators', `[${ADDRESS_ZERO}, ${ADDRESS_MOCK1}]`);
  })

  test('operator removed test', () => {
// @ts-ignore
    const event = changetype<OperatorRemoved>(newMockEvent());
    event.parameters = [];
    event.block.timestamp = BigInt.fromI32(0);
    event.address = Address.fromString(CONTROLLER_ADDRESS);
    event.parameters.push(new ethereum.EventParam("operator", ethereum.Value.fromAddress(Address.fromString(ADDRESS_ZERO))))

    handleOperatorRemoved(event);

    assert.fieldEquals(CONTROLLER_ENTITY_NAME, CONTROLLER_ADDRESS, 'operators', `[]`);
  })

  // ***************************************************
  //              ADDRESS CHANGES
  // ***************************************************

  describe("Change addresses", () => {

    test('governance address test', () => {
      changeAnnouncedAddress(BigInt.fromI32(1), ADDRESS_MOCK1, 'governance')
    })

    test('tetu voter address test', () => {
      mockControllableAttributes(
        ADDRESS_MOCK1,
        "VOTER_VERSION",
        '11',
        '222',
        '333',
        '444',
        ADDRESS_MOCK2,
        CONTROLLER_ADDRESS,
      );
      createMockedFunction(Address.fromString(ADDRESS_MOCK1), "ve", "ve():(address)")
        .returns([ethereum.Value.fromAddress(Address.fromString(ADDRESS_MOCK3))])
      createMockedFunction(Address.fromString(ADDRESS_MOCK1), "gauge", "gauge():(address)")
        .returns([ethereum.Value.fromAddress(Address.fromString(ADDRESS_MOCK4))])
      createMockedFunction(Address.fromString(ADDRESS_MOCK1), "bribe", "bribe():(address)")
        .returns([ethereum.Value.fromAddress(Address.fromString(ADDRESS_MOCK5))])
      createMockedFunction(Address.fromString(ADDRESS_MOCK1), "token", "token():(address)")
        .returns([ethereum.Value.fromAddress(Address.fromString(ADDRESS_MOCK6))])
      createMockedFunction(Address.fromString(ADDRESS_MOCK6), "balanceOf", "balanceOf(address):(uint256)")
        .withArgs([ethereum.Value.fromAddress(Address.fromString(ADDRESS_MOCK1))])
        .returns([ethereum.Value.fromSignedBigInt(BigInt.fromI32(123321))])

      changeAnnouncedAddress(BigInt.fromI32(2), ADDRESS_MOCK1, 'tetuVoter')

      checkControllableAttributes(
        TETU_VOTER_ENTITY_NAME,
        ADDRESS_MOCK1,
        '11',
        '222',
        '333',
        '444',
        ADDRESS_MOCK2,
        CONTROLLER_ADDRESS,
      );
      assert.fieldEquals(TETU_VOTER_ENTITY_NAME, ADDRESS_MOCK1, 've', ADDRESS_MOCK3)
      assert.fieldEquals(TETU_VOTER_ENTITY_NAME, ADDRESS_MOCK1, 'gauge', ADDRESS_MOCK4)
      assert.fieldEquals(TETU_VOTER_ENTITY_NAME, ADDRESS_MOCK1, 'bribe', ADDRESS_MOCK5)
      assert.fieldEquals(TETU_VOTER_ENTITY_NAME, ADDRESS_MOCK1, 'token', ADDRESS_MOCK6)
      assert.fieldEquals(TETU_VOTER_ENTITY_NAME, ADDRESS_MOCK1, 'rewardsBalance', formatUnits(BigInt.fromI32(123321), BigInt.fromI32(18)).toString())
      assert.fieldEquals(TETU_VOTER_ENTITY_NAME, ADDRESS_MOCK1, 'votersCount', '0')
    })

    test('platform voter address test', () => {

      mockControllableAttributes(
        ADDRESS_MOCK1,
        "PLATFORM_VOTER_VERSION",
        '11',
        '222',
        '333',
        '444',
        ADDRESS_MOCK2,
        CONTROLLER_ADDRESS,
      );
      createMockedFunction(Address.fromString(ADDRESS_MOCK1), "ve", "ve():(address)")
        .returns([ethereum.Value.fromAddress(Address.fromString(ADDRESS_MOCK3))])

      changeAnnouncedAddress(BigInt.fromI32(3), ADDRESS_MOCK1, 'platformVoter')

      checkControllableAttributes(
        PLATFORM_VOTER_ENTITY_NAME,
        ADDRESS_MOCK1,
        '11',
        '222',
        '333',
        '444',
        ADDRESS_MOCK2,
        CONTROLLER_ADDRESS,
      );
      assert.fieldEquals(PLATFORM_VOTER_ENTITY_NAME, ADDRESS_MOCK1, 've', ADDRESS_MOCK3)
    })

    test('liquidator address test', () => {
      changeAnnouncedAddress(BigInt.fromI32(4), ADDRESS_MOCK1, 'liquidator')
    })

    test('forwarder address test', () => {
      mockControllableAttributes(
        ADDRESS_MOCK1,
        "FORWARDER_VERSION",
        '11',
        '222',
        '333',
        '444',
        ADDRESS_MOCK2,
        CONTROLLER_ADDRESS,
      );
      createMockedFunction(Address.fromString(ADDRESS_MOCK1), "tetu", "tetu():(address)")
        .returns([ethereum.Value.fromAddress(Address.fromString(ADDRESS_MOCK3))])
      createMockedFunction(Address.fromString(ADDRESS_MOCK1), "tetuThreshold", "tetuThreshold():(uint256)")
        .returns([ethereum.Value.fromSignedBigInt(BigInt.fromI32(555))])
      createMockedFunction(Address.fromString(ADDRESS_MOCK1), "toInvestFundRatio", "toInvestFundRatio():(uint256)")
        .returns([ethereum.Value.fromSignedBigInt(BigInt.fromI32(50_000))])
      createMockedFunction(Address.fromString(ADDRESS_MOCK1), "toGaugesRatio", "toGaugesRatio():(uint256)")
        .returns([ethereum.Value.fromSignedBigInt(BigInt.fromI32(30_000))])

      changeAnnouncedAddress(BigInt.fromI32(5), ADDRESS_MOCK1, 'forwarder')

      checkControllableAttributes(
        FORWARDER_ENTITY_NAME,
        ADDRESS_MOCK1,
        '11',
        '222',
        '333',
        '444',
        ADDRESS_MOCK2,
        CONTROLLER_ADDRESS,
      );
      assert.fieldEquals(FORWARDER_ENTITY_NAME, ADDRESS_MOCK1, 'tetu', ADDRESS_MOCK3)
      assert.fieldEquals(FORWARDER_ENTITY_NAME, ADDRESS_MOCK1, 'tetuThreshold', '0.000000000000000555')
      assert.fieldEquals(FORWARDER_ENTITY_NAME, ADDRESS_MOCK1, 'toInvestFundRatio', '50')
      assert.fieldEquals(FORWARDER_ENTITY_NAME, ADDRESS_MOCK1, 'toGaugesRatio', '30')
    })

    test('invest fund address test', () => {
      mockControllableAttributes(
        ADDRESS_MOCK1,
        "INVEST_FUND_VERSION",
        '11',
        '222',
        '333',
        '444',
        ADDRESS_MOCK2,
        CONTROLLER_ADDRESS,
      );

      changeAnnouncedAddress(BigInt.fromI32(6), ADDRESS_MOCK1, 'investFund')

      checkControllableAttributes(
        INVEST_FUND_ENTITY_NAME,
        ADDRESS_MOCK1,
        '11',
        '222',
        '333',
        '444',
        ADDRESS_MOCK2,
        CONTROLLER_ADDRESS,
      );
    })

    test('ve dist address test', () => {
      mockControllableAttributes(
        ADDRESS_MOCK1,
        "VE_DIST_VERSION",
        '11',
        '222',
        '333',
        '444',
        ADDRESS_MOCK2,
        CONTROLLER_ADDRESS,
      );
      createMockedFunction(Address.fromString(ADDRESS_MOCK1), "ve", "ve():(address)")
        .returns([ethereum.Value.fromAddress(Address.fromString(ADDRESS_MOCK3))])
      createMockedFunction(Address.fromString(ADDRESS_MOCK1), "rewardToken", "rewardToken():(address)")
        .returns([ethereum.Value.fromAddress(Address.fromString(ADDRESS_MOCK4))])
      createMockedFunction(Address.fromString(ADDRESS_MOCK1), "activePeriod", "activePeriod():(uint256)")
        .returns([ethereum.Value.fromSignedBigInt(BigInt.fromI32(111))])
      createMockedFunction(Address.fromString(ADDRESS_MOCK1), "timeCursor", "timeCursor():(uint256)")
        .returns([ethereum.Value.fromSignedBigInt(BigInt.fromI32(222))])
      createMockedFunction(Address.fromString(ADDRESS_MOCK1), "tokenLastBalance", "tokenLastBalance():(uint256)")
        .returns([ethereum.Value.fromSignedBigInt(BigInt.fromI32(333))])
      createMockedFunction(Address.fromString(ADDRESS_MOCK1), "lastTokenTime", "lastTokenTime():(uint256)")
        .returns([ethereum.Value.fromSignedBigInt(BigInt.fromI32(60 * 60 * 24 * 30))])
      createMockedFunction(Address.fromString(ADDRESS_MOCK1), "tokensPerWeek", "tokensPerWeek(uint256):(uint256)")
        .withArgs([ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(60 * 60 * 24 * 30).div(WEEK_BI).times(WEEK_BI))])
        .returns([ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(666))])

      createMockedFunction(Address.fromString(ADDRESS_MOCK4), "decimals", "decimals():(uint8)")
        .returns([ethereum.Value.fromI32(8)])
      createMockedFunction(Address.fromString(ADDRESS_MOCK4), "balanceOf", "balanceOf(address):(uint256)")
        .withArgs([ethereum.Value.fromAddress(Address.fromString(ADDRESS_MOCK1))])
        .returns([ethereum.Value.fromSignedBigInt(BigInt.fromI32(9999))])

      changeAnnouncedAddress(BigInt.fromI32(7), ADDRESS_MOCK1, 'veDistributor')

      checkControllableAttributes(
        VE_DIST_ENTITY_NAME,
        ADDRESS_MOCK1,
        '11',
        '222',
        '333',
        '444',
        ADDRESS_MOCK2,
        CONTROLLER_ADDRESS,
      );
      assert.fieldEquals(VE_DIST_ENTITY_NAME, ADDRESS_MOCK1, 've', ADDRESS_MOCK3)
      assert.fieldEquals(VE_DIST_ENTITY_NAME, ADDRESS_MOCK1, 'rewardToken', ADDRESS_MOCK4)
      assert.fieldEquals(VE_DIST_ENTITY_NAME, ADDRESS_MOCK1, 'activePeriod', '111')
      assert.fieldEquals(VE_DIST_ENTITY_NAME, ADDRESS_MOCK1, 'timeCursor', '222')
      assert.fieldEquals(VE_DIST_ENTITY_NAME, ADDRESS_MOCK1, 'tokenLastBalance', '0.00000333')
      assert.fieldEquals(VE_DIST_ENTITY_NAME, ADDRESS_MOCK1, 'tokenBalance', '0.00009999')
      assert.fieldEquals(VE_DIST_ENTITY_NAME, ADDRESS_MOCK1, 'lastTokenTime', BigInt.fromI32(60 * 60 * 24 * 30).toString())
      assert.fieldEquals(VE_DIST_ENTITY_NAME, ADDRESS_MOCK1, 'tokensPerWeek', '0.00000666')
      assert.fieldEquals(VE_DIST_ENTITY_NAME, ADDRESS_MOCK1, 'apr', '0')
      assert.fieldEquals(VE_DIST_ENTITY_NAME, ADDRESS_MOCK1, 'decimals', '8')
    })

  })

})
