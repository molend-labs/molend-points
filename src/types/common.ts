export interface SnapshotReserveData {
  token: string;
  tokenDecimals: number;
  tokenSymbol: string;
  tokenPriceUsd: string;
  aToken: string;
  vToken: string;
}

export interface ViewOptions {
  blockTag?: number;
}
