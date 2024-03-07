import { AggregatedReserveData } from '../types/contract';
import { getConfig, initMode } from '../service/mode';
import { Contract } from 'ethers';
import UiPoolDataProviderAbi from '../abi/UiPoolDataProvider.json';
import WalletBalanceProviderAbi from '../abi/WalletBalanceProvider.json';
import AaveOracleAbi from '../abi/AaveOracle.json';
import ChainlinkAggregatorAbi from '../abi/ChainlinkAggregator.json';
import { ViewOptions } from '../types/common';

async function getUiPoolDataProviderContract(): Promise<Contract> {
  const { provider, config } = await initMode();
  return new Contract(config.molend.uiPoolDataProviderAddress, UiPoolDataProviderAbi.abi, provider);
}

async function getWalletBalanceProviderContract(): Promise<Contract> {
  const { provider, config } = await initMode();
  return new Contract(config.molend.walletBalanceProviderAddress, WalletBalanceProviderAbi.abi, provider);
}

async function getAaveOracleContract(): Promise<Contract> {
  const { provider, config } = await initMode();
  return new Contract(config.molend.aaveOracleAddress, AaveOracleAbi.abi, provider);
}

async function getChainlinkAggregatorContract(address: string): Promise<Contract> {
  const { provider } = await initMode();
  return new Contract(address, ChainlinkAggregatorAbi.abi, provider);
}

export async function getReservesData(options: ViewOptions = {}): Promise<AggregatedReserveData[]> {
  const config = await getConfig();
  const contract = await getUiPoolDataProviderContract();
  const data = await contract.getReservesData(config.molend.lendingPoolAddressesProviderAddress, options);
  return data[0];
}

export async function batchBalanceOf(users: string[], tokens: string[], options: ViewOptions = {}): Promise<bigint[]> {
  const contract = await getWalletBalanceProviderContract();
  return contract.batchBalanceOf(users, tokens, options);
}

export async function getUserReservesAmounts(
  user: string,
  aToken: string,
  vToken: string,
  options: ViewOptions = {}
): Promise<{
  deposited: bigint;
  borrowed: bigint;
}> {
  const amounts = await batchBalanceOf([user], [aToken, vToken], options);
  return {
    deposited: amounts[0],
    borrowed: amounts[1],
  };
}

export async function getAssetPrice(token: string, options: ViewOptions = {}): Promise<bigint> {
  const contract = await getAaveOracleContract();
  return contract.getAssetPrice(token, options);
}

export async function getAssetPriceDecimals(token: string, options: ViewOptions = {}): Promise<bigint> {
  let contract = await getAaveOracleContract();
  const source = await contract.getSourceOfAsset(token, options);
  contract = await getChainlinkAggregatorContract(source);
  return contract.decimals(options);
}
