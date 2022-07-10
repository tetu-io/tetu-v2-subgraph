import {VaultDeployed} from "../../src/types/VaultFactoryData/VaultFactoryAbi";
import {assert, createMockedFunction, newMockEvent} from "matchstick-as";
import {Address, BigDecimal, BigInt, ethereum} from "@graphprotocol/graph-ts";
import {handleVaultDeployed} from "../../src/vault-factory";
import {CONTROLLER_ADDRESS, CONTROLLER_ENTITY_NAME} from "../controller/controller-utils";
import {
  ADDRESS_LIQUIDATOR,
  ADDRESS_MOCK1, ADDRESS_MOCK3,
  ADDRESS_USDC, checkControllableAttributes,
  mockControllableAttributes
} from "../utils";
import {VOTER_ADDRESS} from "../tetu-voter/tetu-voter-utils";
import {VaultFactoryEntity} from "../../src/types/schema";
import {INSURANCE_ENTITY, VAULT_ENTITY} from "../vault/vault-utils";
import {RATIO_DENOMINATOR} from "../../src/constants";
import {formatUnits, parseUnits} from "../../src/helpers";
import {SPLITTER_ENTITY} from "../splitter/splitter-utils";
import {INVEST_FUND_ENTITY_NAME} from "../invest-fund/invest-fund-utils";
import {GAUGE_ENTITY} from "../gauge/gauge-utils";
import {VE_ENTITY} from "../ve/ve-utils";

export const VAULT_FACTORY_ENTITY = 'VaultFactoryEntity'
export const VAULT_FACTORY_ADR = '0x2200000000000000000000000000000000000001'
// default addresses
export const SENDER_ADR = '0x2200000000000000000000000000000000000003'
export const ASSET_ADR = '0x2200000000000000000000000000000000000004'
export const GAUGE_ADR = '0x2200000000000000000000000000000000000005'
export const VAULT_PROXY_ADR = '0x2200000000000000000000000000000000000006'
export const VAULT_LOGIC_ADR = '0x2200000000000000000000000000000000000007'
export const INSURANCE_ADR = '0x2200000000000000000000000000000000000008'
export const SPLITTER_PROXY_ADR = '0x2200000000000000000000000000000000000009'
export const SPLITTER_LOGIC_ADR = '0x2200000000000000000000000000000000000010'
export const GAUGE_IMPL_ADR = '0x2200000000000000000000000000000000000011'
export const VE_ADR = '0x2200000000000000000000000000000000000012'
export const GOVERNANCE_ADDRESS = '0x2200000000000000000000000000000000000013'
export const TETU_ADDRESS = '0x2200000000000000000000000000000000000014'
export const VE_IMPL_ADR = '0x2200000000000000000000000000000000000015'

export const DEFAULT_NAME = 'vault_name'
export const DEFAULT_SYMBOL = 'vault_symbol'
export const DEFAULT_BUFFER = BigInt.fromI32(606);

export const DEFAULT_VAULT_VERSION = '1.0.0';
export const DEFAULT_VAULT_REVISION = '5';
export const DEFAULT_VAULT_CREATED = '34'
export const DEFAULT_VAULT_CREATED_BLOCK = '66';

export const DEFAULT_SPLITTER_VERSION = '2.0.0';
export const DEFAULT_SPLITTER_REVISION = '55';
export const DEFAULT_SPLITTER_CREATED = '344'
export const DEFAULT_SPLITTER_CREATED_BLOCK = '666';

export const DEFAULT_GAUGE_VERSION = '3.0.0';
export const DEFAULT_GAUGE_REVISION = '555';
export const DEFAULT_GAUGE_CREATED = '3444'
export const DEFAULT_GAUGE_CREATED_BLOCK = '6666';

export const DEFAULT_VE_VERSION = '4.0.0';
export const DEFAULT_VE_REVISION = '5555';
export const DEFAULT_VE_CREATED = '34444'
export const DEFAULT_VE_CREATED_BLOCK = '66666';

export const DEFAULT_MAX_WITHDRAW_ASSETS = BigInt.fromI32(1401);
export const DEFAULT_MAX_REDEEM_SHARES = BigInt.fromI32(1402);
export const DEFAULT_MAX_DEPOSIT_ASSETS = BigInt.fromI32(1403);
export const DEFAULT_MAX_MINT_SHARES = BigInt.fromI32(1404);
export const DEFAULT_DEPOSIT_FEE = BigInt.fromI32(1405);
export const DEFAULT_WITHDRAW_FEE = BigInt.fromI32(1406);
export const DEFAULT_DO_HARD_WORK_ON_INVEST = true;
export const DEFAULT_SPLITTER_ASSETS = BigInt.fromI32(1408);
export const DEFAULT_SHARE_PRICE = parseUnits(BigDecimal.fromString('11'), BigInt.fromI32(9));
export const DEFAULT_TOTAL_SUPPLY = BigInt.fromI32(14010);

export const DEFAULT_BALANCE = BigInt.fromI32(60100);

// **********************************************************
//                   HANDLERS
// **********************************************************

export function vaultDeployedWithDefaults(): void {
  mockVaultFactoryFunctions();
  mockVaultFunctions();
  mockControllerFunctions();
  mockAssetFunctions();
  mockSplitterFunctions();
  mockGaugeFunctions();
  mockVeFunctions();
  mockLiquidatorFunctions();

  handleVaultDeployed(eventVaultDeployedWithDefaults());

  checkVaultFactory();
  checkVault();
  checkSplitter();
  checkInsurance();
  checkGauge();
  checkVe();
}

export function createVaultFactory(): void {

}

// **********************************************************
//                   EVENTS
// **********************************************************

export function eventVaultDeployed(
  sender: string,
  asset: string,
  name: string,
  symbol: string,
  gauge: string,
  buffer: BigInt,
  vaultProxy: string,
  vaultLogic: string,
  insurance: string,
  splitterProxy: string,
  splitterLogic: string,
): VaultDeployed {
  // @ts-ignore
  const event = changetype<VaultDeployed>(newMockEvent());
  event.parameters = [];
  event.address = Address.fromString(VAULT_FACTORY_ADR);
  event.parameters.push(new ethereum.EventParam("sender", ethereum.Value.fromAddress(Address.fromString(sender))))
  event.parameters.push(new ethereum.EventParam("asset", ethereum.Value.fromAddress(Address.fromString(asset))))
  event.parameters.push(new ethereum.EventParam("name", ethereum.Value.fromString(name)))
  event.parameters.push(new ethereum.EventParam("symbol", ethereum.Value.fromString(symbol)))
  event.parameters.push(new ethereum.EventParam("gauge", ethereum.Value.fromAddress(Address.fromString(gauge))))
  event.parameters.push(new ethereum.EventParam("buffer", ethereum.Value.fromUnsignedBigInt(buffer)))
  event.parameters.push(new ethereum.EventParam("vaultProxy", ethereum.Value.fromAddress(Address.fromString(vaultProxy))))
  event.parameters.push(new ethereum.EventParam("vaultLogic", ethereum.Value.fromAddress(Address.fromString(vaultLogic))))
  event.parameters.push(new ethereum.EventParam("insurance", ethereum.Value.fromAddress(Address.fromString(insurance))))
  event.parameters.push(new ethereum.EventParam("splitterProxy", ethereum.Value.fromAddress(Address.fromString(splitterProxy))))
  event.parameters.push(new ethereum.EventParam("splitterLogic", ethereum.Value.fromAddress(Address.fromString(splitterLogic))))
  return event;
}

export function eventVaultDeployedWithDefaults(): VaultDeployed {
  return eventVaultDeployed(
    SENDER_ADR,
    ASSET_ADR,
    DEFAULT_NAME,
    DEFAULT_SYMBOL,
    GAUGE_ADR,
    DEFAULT_BUFFER,
    VAULT_PROXY_ADR,
    VAULT_LOGIC_ADR,
    INSURANCE_ADR,
    SPLITTER_PROXY_ADR,
    SPLITTER_LOGIC_ADR,
  );
}

// **********************************************************
//                   MOCK FUNCTIONS
// **********************************************************

export function mockVaultFactoryFunctions(): void {
  createMockedFunction(Address.fromString(VAULT_FACTORY_ADR), "controller", "controller():(address)").returns([ethereum.Value.fromAddress(Address.fromString(CONTROLLER_ADDRESS))])
  createMockedFunction(Address.fromString(VAULT_FACTORY_ADR), "vaultImpl", "vaultImpl():(address)").returns([ethereum.Value.fromAddress(Address.fromString(VAULT_LOGIC_ADR))])
  createMockedFunction(Address.fromString(VAULT_FACTORY_ADR), "vaultInsuranceImpl", "vaultInsuranceImpl():(address)").returns([ethereum.Value.fromAddress(Address.fromString(INSURANCE_ADR))])
  createMockedFunction(Address.fromString(VAULT_FACTORY_ADR), "splitterImpl", "splitterImpl():(address)").returns([ethereum.Value.fromAddress(Address.fromString(SPLITTER_LOGIC_ADR))])
}

function mockVaultFunctions(): void {
  createMockedFunction(Address.fromString(VAULT_PROXY_ADR), "decimals", "decimals():(uint8)").returns([ethereum.Value.fromI32(9)])
  createMockedFunction(Address.fromString(VAULT_PROXY_ADR), "totalAssets", "totalAssets():(uint256)").returns([ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(100123))])

  createMockedFunction(Address.fromString(VAULT_PROXY_ADR), "maxWithdrawAssets", "maxWithdrawAssets():(uint256)").returns([ethereum.Value.fromUnsignedBigInt(DEFAULT_MAX_WITHDRAW_ASSETS)]);
  createMockedFunction(Address.fromString(VAULT_PROXY_ADR), "maxRedeemShares", "maxRedeemShares():(uint256)").returns([ethereum.Value.fromUnsignedBigInt(DEFAULT_MAX_REDEEM_SHARES)]);
  createMockedFunction(Address.fromString(VAULT_PROXY_ADR), "maxDepositAssets", "maxDepositAssets():(uint256)").returns([ethereum.Value.fromUnsignedBigInt(DEFAULT_MAX_DEPOSIT_ASSETS)]);
  createMockedFunction(Address.fromString(VAULT_PROXY_ADR), "maxMintShares", "maxMintShares():(uint256)").returns([ethereum.Value.fromUnsignedBigInt(DEFAULT_MAX_MINT_SHARES)]);
  createMockedFunction(Address.fromString(VAULT_PROXY_ADR), "depositFee", "depositFee():(uint256)").returns([ethereum.Value.fromUnsignedBigInt(DEFAULT_DEPOSIT_FEE)]);
  createMockedFunction(Address.fromString(VAULT_PROXY_ADR), "withdrawFee", "withdrawFee():(uint256)").returns([ethereum.Value.fromUnsignedBigInt(DEFAULT_WITHDRAW_FEE)]);
  createMockedFunction(Address.fromString(VAULT_PROXY_ADR), "doHardWorkOnInvest", "doHardWorkOnInvest():(bool)").returns([ethereum.Value.fromBoolean(DEFAULT_DO_HARD_WORK_ON_INVEST)]);
  createMockedFunction(Address.fromString(VAULT_PROXY_ADR), "splitterAssets", "splitterAssets():(uint256)").returns([ethereum.Value.fromUnsignedBigInt(DEFAULT_SPLITTER_ASSETS)]);
  createMockedFunction(Address.fromString(VAULT_PROXY_ADR), "sharePrice", "sharePrice():(uint256)").returns([ethereum.Value.fromUnsignedBigInt(DEFAULT_SHARE_PRICE)]);
  createMockedFunction(Address.fromString(VAULT_PROXY_ADR), "totalSupply", "totalSupply():(uint256)").returns([ethereum.Value.fromUnsignedBigInt(DEFAULT_TOTAL_SUPPLY)]);

  mockControllableAttributes(
    VAULT_PROXY_ADR,
    'VAULT_VERSION',
    DEFAULT_VAULT_VERSION,
    DEFAULT_VAULT_REVISION,
    DEFAULT_VAULT_CREATED,
    DEFAULT_VAULT_CREATED_BLOCK,
    VAULT_LOGIC_ADR,
    CONTROLLER_ADDRESS
  );
}

function mockControllerFunctions(): void {
  createMockedFunction(Address.fromString(CONTROLLER_ADDRESS), "voter", "voter():(address)").returns([ethereum.Value.fromAddress(Address.fromString(VOTER_ADDRESS))])
  createMockedFunction(Address.fromString(CONTROLLER_ADDRESS), "liquidator", "liquidator():(address)").returns([ethereum.Value.fromAddress(Address.fromString(ADDRESS_LIQUIDATOR))])
}

function mockAssetFunctions(): void {
  createMockedFunction(Address.fromString(ASSET_ADR), "balanceOf", "balanceOf(address):(uint256)")
    .withArgs([ethereum.Value.fromAddress(Address.fromString(VAULT_PROXY_ADR))])
    .returns([ethereum.Value.fromUnsignedBigInt(DEFAULT_BALANCE)])
}

function mockSplitterFunctions(): void {
  createMockedFunction(Address.fromString(SPLITTER_PROXY_ADR), "vault", "vault():(address)").returns([ethereum.Value.fromAddress(Address.fromString(VAULT_PROXY_ADR))])
  createMockedFunction(Address.fromString(SPLITTER_PROXY_ADR), "asset", "asset():(address)").returns([ethereum.Value.fromAddress(Address.fromString(ASSET_ADR))])

  mockControllableAttributes(
    SPLITTER_PROXY_ADR,
    'SPLITTER_VERSION',
    DEFAULT_SPLITTER_VERSION,
    DEFAULT_SPLITTER_REVISION,
    DEFAULT_SPLITTER_CREATED,
    DEFAULT_SPLITTER_CREATED_BLOCK,
    SPLITTER_LOGIC_ADR,
    CONTROLLER_ADDRESS
  );
}

function mockGaugeFunctions(): void {
  createMockedFunction(Address.fromString(GAUGE_ADR), "ve", "ve():(address)").returns([ethereum.Value.fromAddress(Address.fromString(VE_ADR))])
  createMockedFunction(Address.fromString(GAUGE_ADR), "controller", "controller():(address)").returns([ethereum.Value.fromAddress(Address.fromString(CONTROLLER_ADDRESS))])
  createMockedFunction(Address.fromString(GAUGE_ADR), "operator", "operator():(address)").returns([ethereum.Value.fromAddress(Address.fromString(GOVERNANCE_ADDRESS))])
  createMockedFunction(Address.fromString(GAUGE_ADR), "defaultRewardToken", "defaultRewardToken():(address)").returns([ethereum.Value.fromAddress(Address.fromString(TETU_ADDRESS))])

  mockControllableAttributes(
    GAUGE_ADR,
    'MULTI_GAUGE_VERSION',
    DEFAULT_GAUGE_VERSION,
    DEFAULT_GAUGE_REVISION,
    DEFAULT_GAUGE_CREATED,
    DEFAULT_GAUGE_CREATED_BLOCK,
    GAUGE_IMPL_ADR,
    CONTROLLER_ADDRESS
  );
}

function mockVeFunctions(): void {
  createMockedFunction(Address.fromString(VE_ADR), "tokenId", "tokenId():(uint256)").returns([ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(1))])
  createMockedFunction(Address.fromString(VE_ADR), "epoch", "epoch():(uint256)").returns([ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(2))])

  mockControllableAttributes(
    VE_ADR,
    'VE_VERSION',
    DEFAULT_VE_VERSION,
    DEFAULT_VE_REVISION,
    DEFAULT_VE_CREATED,
    DEFAULT_VE_CREATED_BLOCK,
    VE_IMPL_ADR,
    CONTROLLER_ADDRESS
  );
}

function mockLiquidatorFunctions(): void {
  createMockedFunction(Address.fromString(ADDRESS_LIQUIDATOR), "getPrice", "getPrice(address,address,uint256):(uint256)")
    .withArgs([
      ethereum.Value.fromAddress(Address.fromString(ASSET_ADR)),
      ethereum.Value.fromAddress(Address.fromString(ADDRESS_USDC)),
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(1000000000))
    ])
    .returns([ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(300912))])
}

// **********************************************************
//                   CHECKS
// **********************************************************

function checkVaultFactory(): void {
  assert.fieldEquals(VAULT_FACTORY_ENTITY, VAULT_FACTORY_ADR, 'controller', CONTROLLER_ADDRESS)
  assert.fieldEquals(VAULT_FACTORY_ENTITY, VAULT_FACTORY_ADR, 'vaultImpl', VAULT_LOGIC_ADR)
  assert.fieldEquals(VAULT_FACTORY_ENTITY, VAULT_FACTORY_ADR, 'vaultInsuranceImpl', INSURANCE_ADR)
  assert.fieldEquals(VAULT_FACTORY_ENTITY, VAULT_FACTORY_ADR, 'splitterImpl', SPLITTER_LOGIC_ADR)
  assert.fieldEquals(VAULT_FACTORY_ENTITY, VAULT_FACTORY_ADR, 'vaultsCount', '1')

  const factory = VaultFactoryEntity.load(VAULT_FACTORY_ADR) as VaultFactoryEntity;
  assert.i32Equals(factory.deployedVaults.length, 1)
  assert.stringEquals(factory.deployedVaults[0], VAULT_PROXY_ADR)
}

function checkVault(): void {
  assert.fieldEquals(VAULT_ENTITY, VAULT_PROXY_ADR, 'gauge', GAUGE_ADR)
  assert.fieldEquals(VAULT_ENTITY, VAULT_PROXY_ADR, 'splitter', SPLITTER_PROXY_ADR)
  assert.fieldEquals(VAULT_ENTITY, VAULT_PROXY_ADR, 'insurance', INSURANCE_ADR)
  assert.fieldEquals(VAULT_ENTITY, VAULT_PROXY_ADR, 'factory', VAULT_FACTORY_ADR)

  assert.fieldEquals(VAULT_ENTITY, VAULT_PROXY_ADR, 'asset', ASSET_ADR)
  assert.fieldEquals(VAULT_ENTITY, VAULT_PROXY_ADR, 'decimals', '9')
  assert.fieldEquals(VAULT_ENTITY, VAULT_PROXY_ADR, 'name', DEFAULT_NAME)
  assert.fieldEquals(VAULT_ENTITY, VAULT_PROXY_ADR, 'symbol', DEFAULT_SYMBOL)
  assert.fieldEquals(VAULT_ENTITY, VAULT_PROXY_ADR, 'buffer', DEFAULT_BUFFER.toBigDecimal().times(BigDecimal.fromString('100')).div(RATIO_DENOMINATOR.toBigDecimal()).toString())
  assert.fieldEquals(VAULT_ENTITY, VAULT_PROXY_ADR, 'maxWithdrawAssets', formatUnits(DEFAULT_MAX_WITHDRAW_ASSETS, BigInt.fromI32(9)).toString())
  assert.fieldEquals(VAULT_ENTITY, VAULT_PROXY_ADR, 'maxRedeemShares', formatUnits(DEFAULT_MAX_REDEEM_SHARES, BigInt.fromI32(9)).toString())
  assert.fieldEquals(VAULT_ENTITY, VAULT_PROXY_ADR, 'maxDepositAssets', formatUnits(DEFAULT_MAX_DEPOSIT_ASSETS, BigInt.fromI32(9)).toString())
  assert.fieldEquals(VAULT_ENTITY, VAULT_PROXY_ADR, 'maxMintShares', formatUnits(DEFAULT_MAX_MINT_SHARES, BigInt.fromI32(9)).toString())
  assert.fieldEquals(VAULT_ENTITY, VAULT_PROXY_ADR, 'depositFee', formatUnits(DEFAULT_DEPOSIT_FEE, BigInt.fromI32(3)).toString())
  assert.fieldEquals(VAULT_ENTITY, VAULT_PROXY_ADR, 'withdrawFee', formatUnits(DEFAULT_WITHDRAW_FEE, BigInt.fromI32(3)).toString())
  assert.fieldEquals(VAULT_ENTITY, VAULT_PROXY_ADR, 'doHardWorkOnInvest', `${DEFAULT_DO_HARD_WORK_ON_INVEST}`)

  assert.fieldEquals(VAULT_ENTITY, VAULT_PROXY_ADR, 'totalAssets', '0')
  assert.fieldEquals(VAULT_ENTITY, VAULT_PROXY_ADR, 'totalAssetsUSD', '0')
  assert.fieldEquals(VAULT_ENTITY, VAULT_PROXY_ADR, 'vaultAssets', '0')
  assert.fieldEquals(VAULT_ENTITY, VAULT_PROXY_ADR, 'splitterAssets', '0')
  assert.fieldEquals(VAULT_ENTITY, VAULT_PROXY_ADR, 'sharePrice', '1')
  assert.fieldEquals(VAULT_ENTITY, VAULT_PROXY_ADR, 'totalSupply', '0')
  assert.fieldEquals(VAULT_ENTITY, VAULT_PROXY_ADR, 'assetPrice', '0.000300912')
  assert.fieldEquals(VAULT_ENTITY, VAULT_PROXY_ADR, 'usersCount', '0')
  assert.fieldEquals(VAULT_ENTITY, VAULT_PROXY_ADR, 'isControllerWhitelisted', 'false')
  assert.fieldEquals(VAULT_ENTITY, VAULT_PROXY_ADR, 'isGaugeWhitelisted', 'false')

  checkControllableAttributes(
    VAULT_ENTITY,
    VAULT_PROXY_ADR,
    DEFAULT_VAULT_VERSION,
    DEFAULT_VAULT_REVISION,
    DEFAULT_VAULT_CREATED,
    DEFAULT_VAULT_CREATED_BLOCK,
    VAULT_LOGIC_ADR,
    CONTROLLER_ADDRESS
  );
}

function checkSplitter(): void {
  assert.fieldEquals(SPLITTER_ENTITY, SPLITTER_PROXY_ADR, 'vault', VAULT_PROXY_ADR)
  assert.fieldEquals(SPLITTER_ENTITY, SPLITTER_PROXY_ADR, 'asset', ASSET_ADR)
  assert.fieldEquals(SPLITTER_ENTITY, SPLITTER_PROXY_ADR, 'profit', '0')
  assert.fieldEquals(SPLITTER_ENTITY, SPLITTER_PROXY_ADR, 'loss', '0')

  checkControllableAttributes(
    SPLITTER_ENTITY,
    SPLITTER_PROXY_ADR,
    DEFAULT_SPLITTER_VERSION,
    DEFAULT_SPLITTER_REVISION,
    DEFAULT_SPLITTER_CREATED,
    DEFAULT_SPLITTER_CREATED_BLOCK,
    SPLITTER_LOGIC_ADR,
    CONTROLLER_ADDRESS
  );
}

function checkInsurance(): void {
  assert.fieldEquals(INSURANCE_ENTITY, INSURANCE_ADR, 'vault', VAULT_PROXY_ADR)
  assert.fieldEquals(INSURANCE_ENTITY, INSURANCE_ADR, 'asset', ASSET_ADR)
  assert.fieldEquals(INSURANCE_ENTITY, INSURANCE_ADR, 'balance', '0')
  assert.fieldEquals(INSURANCE_ENTITY, INSURANCE_ADR, 'covered', '0')
}

function checkGauge(): void {
  assert.fieldEquals(GAUGE_ENTITY, GAUGE_ADR, 've', VE_ADR)
  assert.fieldEquals(GAUGE_ENTITY, GAUGE_ADR, 'operator', GOVERNANCE_ADDRESS)
  assert.fieldEquals(GAUGE_ENTITY, GAUGE_ADR, 'defaultRewardToken', TETU_ADDRESS)

  checkControllableAttributes(
    GAUGE_ENTITY,
    GAUGE_ADR,
    DEFAULT_GAUGE_VERSION,
    DEFAULT_GAUGE_REVISION,
    DEFAULT_GAUGE_CREATED,
    DEFAULT_GAUGE_CREATED_BLOCK,
    GAUGE_IMPL_ADR,
    CONTROLLER_ADDRESS
  );
}

function checkVe(): void {
  assert.fieldEquals(VE_ENTITY, VE_ADR, 'count', '1')
  assert.fieldEquals(VE_ENTITY, VE_ADR, 'epoch', '2')
  assert.fieldEquals(VE_ENTITY, VE_ADR, 'allowedPawnshops', '[]')
  assert.fieldEquals(VE_ENTITY, VE_ADR, 'lockedAmountUSD', '0')

  checkControllableAttributes(
    VE_ENTITY,
    VE_ADR,
    DEFAULT_VE_VERSION,
    DEFAULT_VE_REVISION,
    DEFAULT_VE_CREATED,
    DEFAULT_VE_CREATED_BLOCK,
    VE_IMPL_ADR,
    CONTROLLER_ADDRESS
  );
}
