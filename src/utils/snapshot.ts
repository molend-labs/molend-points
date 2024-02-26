import { UserReservesSnapshot } from '../types/models';
import { getConfig } from '../service/mode';
import { getUserReservesAmount } from './contract';

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
    tokenSymbol: string;
    tokenPriceUsd: string;
    aToken: string;
    vToken: string;
  }[];
}): Promise<UserReservesSnapshot[]> {
  const config = await getConfig();
  const snapshots: UserReservesSnapshot[] = [];
  for (const { token, tokenSymbol, tokenPriceUsd, aToken, vToken } of reserves) {
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
      deposited_amount: String(deposited),
      borrowed_amount: String(borrowed),
      deposited_points_multiplier: String(config.settings.depositedPointsMultiplier),
      borrowed_points_multiplier: String(config.settings.borrowedPointsMultiplier),
    };
    snapshots.push(snapshot);
  }
  return snapshots;
}
