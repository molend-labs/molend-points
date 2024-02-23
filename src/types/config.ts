import { JsonRpcProvider } from 'ethers';

export interface Config {
  mode: {
    chainId: number;
    rpcUrl: string;
  };
  molend: {
    uiPoolDataProviderAddress: string;
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
}

export interface InitMode {
  config: Config;
  provider: JsonRpcProvider;
}
