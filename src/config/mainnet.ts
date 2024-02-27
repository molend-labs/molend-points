import { Config } from '../types/config';
import { requiredEnv } from './helper';

const config: Config = {
  mode: {
    chainName: 'mode-mainnet',
    chainId: 34443,
    rpcUrl: '', // TODO
  },
  molend: {
    uiPoolDataProviderAddress: '', // TODO
    LendingPoolAddressesProviderAddress: '', // TODO
    walletBalanceProviderAddress: '', // TODO
    aaveOracleAddress: '', // TODO
  },
  subgraph: {
    apiUrl: '', // TODO
  },
  database: {
    host: requiredEnv('DB_HOST'),
    port: Number(requiredEnv('DB_PORT')),
    username: requiredEnv('DB_USERNAME'),
    password: requiredEnv('DB_PASSWORD'),
    database: 'molend-mainnet',
    pool: {
      max: 10,
      min: 0,
      idle: 10000,
    },
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
  },
  settings: {
    snapshotStartBlock: 0, // TODO
    snapshotBlockInterval: 10800, // around 6 hours
    depositedPointsMultiplier: 0.03, // per interval
    borrowedPointsMultiplier: 0.3, // per interval
  },
  server: {
    port: Number(requiredEnv('SERVER_PORT')),
  },
};

export default config;
