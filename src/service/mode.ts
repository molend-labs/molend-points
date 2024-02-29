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
    const module = await require(`../config/${env}.ts`);
    return module.default;
  }
  return config;
}
