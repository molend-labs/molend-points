import { requiredEnv } from '../config/helper';
import { Config, InitMode } from '../types/config';
import { ethers } from 'ethers';

export async function initMode(): Promise<InitMode> {
  const config = await getConfig();
  const provider = new ethers.JsonRpcProvider(config.mode.rpcUrl, config.mode.chainId);
  return {
    config,
    provider,
  };
}

let config: Config | undefined;

export async function getConfig(): Promise<Config> {
  if (!config) {
    const env = requiredEnv('ENV');
    let module;
    try {
      module = await import(`../config/${env}.ts`);
    } catch (e: any) {
      if (e.message.includes('Cannot find module')) {
        module = await import(`../config/${env}.js`);
      } else {
        throw e;
      }
    }
    config = module.default as Config;
  }

  return config;
}
