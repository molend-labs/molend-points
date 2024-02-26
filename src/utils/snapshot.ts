import { UserReservesSnapshotsFailure, UserReservesSnapshot } from '../types/models';
import { getConfig } from '../service/mode';
import { getAssetPrice, getAssetPriceDecimals, getUserReservesAmount } from './contract';
import BigNumber from 'bignumber.js';
import { sendSlackError } from '../service/notification';
import { SnapshotReserveData } from '../types/common';
import { AggregatedReserveData } from '../types/contract';

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
  const tokenPricesCache: Record<string, bigint> = {};
  const tokenPricesDecimalsCache: Record<string, bigint> = {};

  const snapshots: UserReservesSnapshot[] = [];
  const failures: UserReservesSnapshotsFailure[] = [];

  for (const user of users) {
    try {
      const userSnapshots = await takeSnapshotForUser({
        blockHeight,
        blockTimestamp,
        user,
        reserves: await convertReserves(reserves, tokenPricesCache, tokenPricesDecimalsCache),
      });

      snapshots.push(...userSnapshots);
    } catch (e: any) {
      await sendSlackError(`Failed to take snapshot for user(${user}) at block ${blockHeight}: ${e}`);
      const failure: UserReservesSnapshotsFailure = {
        block_height: blockHeight,
        block_timestamp: blockTimestamp,
        user,
        message: e.message,
        resolved: false,
      };
      failures.push(failure);
    }
  }

  return {
    snapshots,
    failures,
  };
}

async function convertReserves(
  reserves: AggregatedReserveData[],
  tokenPricesCache: Record<string, bigint>,
  tokenPricesDecimalsCache: Record<string, bigint>
): Promise<SnapshotReserveData[]> {
  const snapshotReserves: SnapshotReserveData[] = [];

  for (const reserve of reserves) {
    const tokenPriceUsd =
      tokenPricesCache[reserve.underlyingAsset] ??
      (await getAssetPrice(reserve.underlyingAsset).then((price) => {
        tokenPricesCache[reserve.underlyingAsset] = price;
        return price;
      }));

    const tokenPriceDecimals =
      tokenPricesDecimalsCache[reserve.underlyingAsset] ??
      (await getAssetPriceDecimals(reserve.underlyingAsset).then((decimals) => {
        tokenPricesDecimalsCache[reserve.underlyingAsset] = decimals;
        return decimals;
      }));

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
