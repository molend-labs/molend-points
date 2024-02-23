import { Config } from '../types/config';
import { requiredEnv } from './helper';

const config: Config = {
  mode: {
    rpcUrl: '',
    chainId: 34443,
  },
  molend: {
    uiPoolDataProviderAddress: '',
  },
  subgraph: {
    apiUrl: '',
  },
  database: {
    host: requiredEnv('DB_HOST'),
    port: parseInt(requiredEnv('DB_PORT')),
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
};

export default config;
