import {
  getLatestSnapshotBlockHeight,
  initUserReservesSnapshotsModel,
  saveUserReservesSnapshots,
} from './database/models/user-reserves-snapshots';
import { getConfig, initMode } from './service/mode';
import { getSubGraphClient } from './subgraph/client';
import { User } from './types/subgraph-data';
import { sendSlackError } from './service/notification';
import { UserReservesSnapshot } from './types/models';
import { takeSnapshotForUser } from './utils/snapshot';
import { Block } from 'ethers';
import { AggregatedReserveData } from './types/contract';
import { getAssetPrice, getReservesData } from './utils/contract';
import { sleep } from './utils/common';
import { logger } from './service/logger';

async function main() {
  // await prepare();
  await takeSnapshots();
}

async function prepare() {
  await initUserReservesSnapshotsModel();
}

async function takeSnapshots() {
  const config = await getConfig();
  const client = await getSubGraphClient();
  const { provider } = await initMode();

  while (true) {
    let nextSnapshotBlockHeight: number;
    try {
      const latestSnapshotBlockHeight = await getLatestSnapshotBlockHeight();
      nextSnapshotBlockHeight = latestSnapshotBlockHeight
        ? latestSnapshotBlockHeight + config.settings.snapshotBlockInterval
        : config.settings.snapshotStartBlock;
    } catch (e: any) {
      await sendSlackError(`Failed to get next snapshot block height: ${e}`);
      await sleep(1000);
      continue;
    }

    let block: Block;
    try {
      const _block = await provider.getBlock(nextSnapshotBlockHeight);
      if (!_block) {
        throw Error(`Block not found`);
      }
      block = _block;
    } catch (e: any) {
      await sendSlackError(`Failed to get block(${nextSnapshotBlockHeight}): ${e}`);
      await sleep(1000);
      continue;
    }

    let users: User[];
    try {
      users = await client.queryUsers({
        createdBlockHeightLte: block.number,
      });
    } catch (e: any) {
      await sendSlackError(`Failed to get users: ${e}`);
      await sleep(1000);
      continue;
    }

    let reserves: AggregatedReserveData[];
    try {
      reserves = await getReservesData({ blockTag: block.number });
    } catch (e: any) {
      await sendSlackError(`Failed to get reserves data: ${e}`);
      await sleep(1000);
      continue;
    }

    const snapshots: UserReservesSnapshot[] = [];
    const tokenPrices: Record<string, bigint> = {};

    for (const user of users) {
      try {
        const _reserves = [];
        for (const reserve of reserves) {
          const tokenPriceUsd =
            tokenPrices[reserve.underlyingAsset] ??
            (await getAssetPrice(reserve.underlyingAsset).then((price) => {
              tokenPrices[reserve.underlyingAsset] = price;
              return price;
            }));

          const _reserve = {
            token: reserve.underlyingAsset,
            tokenSymbol: reserve.symbol,
            tokenPriceUsd: String(tokenPriceUsd),
            aToken: reserve.aTokenAddress,
            vToken: reserve.variableDebtTokenAddress,
          };

          _reserves.push(_reserve);
        }

        const userSnapshots = await takeSnapshotForUser({
          blockHeight: block.number,
          blockTimestamp: block.timestamp,
          user: user.id,
          reserves: _reserves,
        });

        snapshots.push(...userSnapshots);
      } catch (e: any) {
        await sendSlackError(`Failed to take snapshot for user(${user.id}): ${e}`);
        // TODO record error
      }
    }

    try {
      await saveUserReservesSnapshots(snapshots);
      logger.info(`Success save snapshots at block ${block.number}`);
    } catch (e: any) {
      await sendSlackError(`Failed to save snapshots at block ${block.number}`);
    }
  }
}

void main();
