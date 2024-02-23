import { Config } from '../types/config';
import { requiredEnv } from './helper';

const config: Config = {
  mode: {
    rpcUrl: 'https://sepolia.mode.network',
    chainId: 919,
  },
  molend: {
    uiPoolDataProviderAddress: '0x00e82aCEdb27867f9B494FBb6e9CbDc73b4E134d',
  },
  subgraph: {
    apiUrl:
      'https://api.goldsky.com/api/public/project_clsqwp249pal8012pavf34uxn/subgraphs/molend-protocol-testnet/0.0.4/gn',
  },
  database: {
    host: requiredEnv('DB_HOST'),
    port: parseInt(requiredEnv('DB_PORT')),
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
};

export default config;
