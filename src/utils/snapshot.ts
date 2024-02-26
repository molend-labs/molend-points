import { UserReservesSnapshot } from '../types/models';
import { getConfig } from '../service/mode';
import { getUserReservesAmount } from './contract';
import BigNumber from 'bignumber.js';

export async function takeSnapshotForUser({
  blockHeight,
  blockTimestamp,
  user,
  reserves,
}: {
  blockHeight: number;
  blockTimestamp: number;
  user: string;
  reserves: {
    token: string;
    tokenDecimals: number;
    tokenSymbol: string;
    tokenPriceUsd: string;
    aToken: string;
    vToken: string;
  }[];
}): Promise<UserReservesSnapshot[]> {
  const config = await getConfig();
  const snapshots: UserReservesSnapshot[] = [];
  for (const { token, tokenDecimals, tokenSymbol, tokenPriceUsd, aToken, vToken } of reserves) {
    const { deposited, borrowed } = await getUserReservesAmount(user, aToken, vToken, {
      blockTag: blockHeight,
    });

    const snapshot: UserReservesSnapshot = {
      block_height: String(blockHeight),
      block_timestamp: blockTimestamp,
      user,
      token_symbol: tokenSymbol,
      token_address: token,
      token_price_usd: String(tokenPriceUsd),
      deposited_amount: BigNumber(String(deposited)).shiftedBy(-tokenDecimals).toFixed(8),
      borrowed_amount: BigNumber(String(borrowed)).shiftedBy(-tokenDecimals).toFixed(8),
      deposited_points_multiplier: String(config.settings.depositedPointsMultiplier),
      borrowed_points_multiplier: String(config.settings.borrowedPointsMultiplier),
    };
    snapshots.push(snapshot);
  }
  return snapshots;
}
