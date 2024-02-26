import {
  getLatestSnapshotBlockHeight,
  initUserReservesSnapshotsModel,
  saveUserReservesSnapshots,
} from './database/models/user-reserves-snapshots';
import { initMode } from './service/mode';
import { getSubGraphClient } from './subgraph/client';
import { User } from './types/subgraph-data';
import { sendSlackError } from './service/notification';
import { takeSnapshotForUsers } from './utils/snapshot';
import { Block } from 'ethers';
import { AggregatedReserveData } from './types/contract';
import { getReservesData } from './utils/contract';
import { MODE_AVERAGE_BLOCK_TIME, ms2sec, sleep } from './utils/common';
import { logger } from './service/logger';
import BigNumber from 'bignumber.js';
import {
  initUserReservesSnapshotsFailuresModel,
  saveUserReservesSnapshotsFailures,
} from './database/models/user-reserves-snapshots-failures';

BigNumber.config({
  DECIMAL_PLACES: 100,
  ROUNDING_MODE: BigNumber.ROUND_DOWN,
});

async function prepare() {
  await initUserReservesSnapshotsModel();
  await initUserReservesSnapshotsFailuresModel();
}

async function takeSnapshots() {
  const client = await getSubGraphClient();
  const { provider, config } = await initMode();

  while (true) {
    const startTime = Date.now();

    let nextSnapshotBlockHeight: number;
    try {
      const latestSnapshotBlockHeight = await getLatestSnapshotBlockHeight();
      nextSnapshotBlockHeight = latestSnapshotBlockHeight
        ? latestSnapshotBlockHeight + config.settings.snapshotBlockInterval
        : config.settings.snapshotStartBlock;

      const block = await provider.getBlock('latest');
      if (!block) {
        throw Error(`Latest block not found`);
      }

      if (block.number < nextSnapshotBlockHeight) {
        await sleep(10 * MODE_AVERAGE_BLOCK_TIME);
        logger.info(
          `Current block: ${block.number}. Next snapshot block: ${nextSnapshotBlockHeight}. Waiting for next snapshot...`
        );
        continue;
      }
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

    // non-throwable function
    const { snapshots, failures } = await takeSnapshotForUsers({
      blockHeight: block.number,
      blockTimestamp: block.timestamp,
      users: users.map((user) => user.id),
      reserves,
    });

    try {
      await saveUserReservesSnapshots(snapshots);
      logger.info(
        `Success save snapshots(${snapshots.length}) at block ${block.number}. Cost ${(
          ms2sec(Date.now() - startTime) / 60
        ).toFixed(2)} minutes`
      );
    } catch (e: any) {
      await sendSlackError(`Failed to save snapshots at block ${block.number}: ${e}`);
    }

    try {
      if (failures.length !== 0) {
        await saveUserReservesSnapshotsFailures(failures);
        logger.info(`Success save snapshots failures at block ${block.number}`);
      }
    } catch (e: any) {
      await sendSlackError(`Failed to save snapshots failure at block ${block.number}: ${e}`);
    }
  }
}

async function main() {
  await prepare();
  await takeSnapshots();
}

void main(); // invoke main
