import { Config } from '../types/config';
import { requiredEnv } from './helper';
import BigNumber from 'bignumber.js';

BigNumber.config({
  DECIMAL_PLACES: 100,
  ROUNDING_MODE: BigNumber.ROUND_DOWN,
});

const config: Config = {
  mode: {
    chainName: 'mode-mainnet',
    chainId: 34443,
    rpcUrl: 'https://mainnet.mode.network',
  },
  molend: {
    uiPoolDataProviderAddress: '0x07B3de0F6A72796640Fdc9BdC2058F377aB61b74',
    LendingPoolAddressesProviderAddress: '0x660c6c5a39252F605a8C97D02d0113cE7517e3FE',
    walletBalanceProviderAddress: '0x12eeF344350D0164447Bf78E72bE1e73851b2954',
    aaveOracleAddress: '0xDb8f22d946E401F800C42dFe55c7b1e812b6D710',
  },
  subgraph: {
    apiUrl:
      'https://api.goldsky.com/api/public/project_clsqwp249pal8012pavf34uxn/subgraphs/molend-protocol-mode/0.0.1/gn',
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
    snapshotStartBlockTimestamp: 1709704801, // in second
    snapshotStartBlock: 4768609,
    snapshotBlockInterval: 10800, // around 6 hours
    depositedPointsMultiplier: 0.03, // per interval
    borrowedPointsMultiplier: 0.3, // per interval
  },
  server: {
    port: Number(requiredEnv('SERVER_PORT')),
  },
  slackWebhook: requiredEnv('SLACK_WEBHOOK'),
};

export default config;
