import { JsonRpcProvider } from 'ethers';

export interface Config {
  mode: {
    chainName: 'mode-sepolia' | 'mode-mainnet';
    chainId: number;
    rpcUrl: string;
  };
  molend: {
    uiPoolDataProviderAddress: string;
    LendingPoolAddressesProviderAddress: string;
    walletBalanceProviderAddress: string;
    aaveOracleAddress: string;
  };
  subgraph: {
    apiUrl: string;
  };
  database: {
    host: string;
    port: number;
    username: string;
    password: string;
    database: string;
    pool: {
      max: number;
      min: number;
      idle: number;
    };
    dialectOptions?: {
      ssl: {
        require: boolean;
        rejectUnauthorized: boolean;
      };
    };
  };
  settings: {
    snapshotStartBlock: number;
    snapshotBlockInterval: number;
    depositedPointsMultiplier: number;
    borrowedPointsMultiplier: number;
  };
  server?: {
    port: number;
  };
  slackWebhook?: string;
}

export interface InitMode {
  config: Config;
  provider: JsonRpcProvider;
}
