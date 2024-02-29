import { UserReservesSnapshotsFailure, UserReservesSnapshot } from '../types/models';
import { getConfig } from '../service/mode';
import { getAssetPrice, getAssetPriceDecimals, getUserReservesAmounts } from './contract';
import BigNumber from 'bignumber.js';
import { sendSlackError } from '../service/notification';
import { SnapshotReserveData } from '../types/common';
import { AggregatedReserveData } from '../types/contract';
import { batchFetches } from './common';

export async function takeSnapshotForUser({
  blockHeight,
  blockTimestamp,
  user,
  reserves,
}: {
  blockHeight: number;
  blockTimestamp: number;
  user: string;
  reserves: SnapshotReserveData[];
}): Promise<UserReservesSnapshot[]> {
  const config = await getConfig();

  const snapshots: UserReservesSnapshot[] = [];

  for (const { token, tokenDecimals, tokenSymbol, tokenPriceUsd, aToken, vToken } of reserves) {
    const { deposited, borrowed } = await getUserReservesAmounts(user, aToken, vToken, {
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

export async function takeSnapshotForUsers({
  blockHeight,
  blockTimestamp,
  users,
  reserves,
}: {
  blockHeight: number;
  blockTimestamp: number;
  users: string[];
  reserves: AggregatedReserveData[];
}): Promise<{
  snapshots: UserReservesSnapshot[];
  failures: UserReservesSnapshotsFailure[];
}> {
  const snapshots: UserReservesSnapshot[] = [];
  const failures: UserReservesSnapshotsFailure[] = [];

  const fetches = users.map((user) => {
    return async () => {
      try {
        const userSnapshots = await takeSnapshotForUser({
          blockHeight,
          blockTimestamp,
          user,
          reserves: await transformReserves(reserves, blockHeight),
        });

        snapshots.push(...userSnapshots);
      } catch (e: any) {
        await sendSlackError(`Failed to take snapshot for user(${user}) at block ${blockHeight}: ${e}`);
        const failure: UserReservesSnapshotsFailure = {
          block_height: String(blockHeight),
          block_timestamp: blockTimestamp,
          user,
          message: e.message,
          resolved: false,
        };

        failures.push(failure);
      }
    };
  });

  await batchFetches(fetches);

  return {
    snapshots,
    failures,
  };
}

async function transformReserves(
  reserves: AggregatedReserveData[],
  blockHeight: number
): Promise<SnapshotReserveData[]> {
  const snapshotReserves: SnapshotReserveData[] = [];

  for (const reserve of reserves) {
    const tokenPriceUsd = await getAssetPrice(reserve.underlyingAsset, { blockTag: blockHeight });
    const tokenPriceDecimals = await getAssetPriceDecimals(reserve.underlyingAsset, { blockTag: blockHeight });

    const _reserve: SnapshotReserveData = {
      token: reserve.underlyingAsset,
      tokenDecimals: Number(reserve.decimals),
      tokenSymbol: reserve.symbol,
      tokenPriceUsd: BigNumber(String(tokenPriceUsd)).shiftedBy(Number(-tokenPriceDecimals)).toFixed(8),
      aToken: reserve.aTokenAddress,
      vToken: reserve.variableDebtTokenAddress,
    };

    snapshotReserves.push(_reserve);
  }

  return snapshotReserves;
}
