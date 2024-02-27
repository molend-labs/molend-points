import { Config } from '../types/config';
import { requiredEnv } from './helper';

const config: Config = {
  mode: {
    chainName: 'mode-sepolia',
    chainId: 919,
    rpcUrl: 'https://sepolia.mode.network',
  },
  molend: {
    uiPoolDataProviderAddress: '0x00e82aCEdb27867f9B494FBb6e9CbDc73b4E134d',
    LendingPoolAddressesProviderAddress: '0xd301527b1000154C46EEf3E20768D18580A1E8a4',
    walletBalanceProviderAddress: '0x80C0aE2eF0aeE65Ec1216717Af4A8dc85dDc0940',
    aaveOracleAddress: '0x8dEB61bA1d552FBCE6854408e66A2656a29a31E0',
  },
  subgraph: {
    apiUrl:
      'https://api.goldsky.com/api/public/project_clsqwp249pal8012pavf34uxn/subgraphs/molend-protocol-testnet/0.0.4/gn',
  },
  database: {
    host: requiredEnv('DB_HOST'),
    port: Number(requiredEnv('DB_PORT')),
    username: requiredEnv('DB_USERNAME'),
    password: requiredEnv('DB_PASSWORD'),
    database: 'molend-testnet',
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
    snapshotStartBlock: 10100000,
    snapshotBlockInterval: 10800, // around 6 hours
    depositedPointsMultiplier: 0.03, // per interval
    borrowedPointsMultiplier: 0.3, // per interval
  },
  server: {
    port: Number(requiredEnv('SERVER_PORT')),
  },
};

export default config;
