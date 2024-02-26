import { AggregatedReserveData } from '../types/contract';
import { getConfig, initMode } from '../service/mode';
import { Contract } from 'ethers';
import UiPoolDataProviderAbi from '../../abi/UiPoolDataProvider.json';
import WalletBalanceProviderAbi from '../../abi/WalletBalanceProvider.json';
import AaveOracleAbi from '../../abi/AaveOracle.json';

async function getUiPoolDataProviderContract(): Promise<Contract> {
  const config = await getConfig();
  const { provider } = await initMode();
  return new Contract(config.molend.uiPoolDataProviderAddress, UiPoolDataProviderAbi.abi, provider);
}

async function getWalletBalanceProviderContract(): Promise<Contract> {
  const config = await getConfig();
  const { provider } = await initMode();
  return new Contract(config.molend.walletBalanceProviderAddress, WalletBalanceProviderAbi.abi, provider);
}

async function getAaveOracleContract(): Promise<Contract> {
  const config = await getConfig();
  const { provider } = await initMode();
  return new Contract(config.molend.aaveOracleAddress, AaveOracleAbi.abi, provider);
}

export async function getReservesData(options: { blockTag?: number } = {}): Promise<AggregatedReserveData[]> {
  const config = await getConfig();
  const contract = await getUiPoolDataProviderContract();
  const data = await contract.getReservesData(config.molend.LendingPoolAddressesProviderAddress, options);
  return data[0];
}

export async function batchBalanceOf(
  users: string[],
  tokens: string[],
  options: { blockTag?: number } = {}
): Promise<bigint[]> {
  const contract = await getWalletBalanceProviderContract();
  return contract.batchBalanceOf(users, tokens, options);
}

export async function getUserReservesAmount(
  user: string,
  aToken: string,
  vToken: string,
  options: { blockTag?: number } = {}
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

export async function getAssetPrice(token: string): Promise<bigint> {
  const contract = await getAaveOracleContract();
  return contract.getAssetPrice(token);
}
