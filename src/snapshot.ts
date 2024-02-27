import {
  getLastSnapshotBlockHeight,
  initUserReservesSnapshotsModel,
  saveUserReservesSnapshots,
} from './database/models/user-reserves-snapshots';
import { getConfig, initMode } from './service/mode';
import { getSubGraphClient } from './subgraph/client';
import { sendSlackError } from './service/notification';
import { takeSnapshotForUsers } from './utils/snapshot';
import { Block } from 'ethers';
import { getReservesData } from './utils/contract';
import { MODE_AVERAGE_BLOCK_TIME, ms2sec, sleep } from './utils/common';
import { logger } from './service/logger';
import BigNumber from 'bignumber.js';
import {
  getUnresolvedUserReservesSnapshotsFailures,
  initUserReservesSnapshotsFailuresModel,
  resolveUserReservesSnapshotsFailure,
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

async function takeAndSaveSnapshots() {
  const client = await getSubGraphClient();
  const { provider } = await initMode();

  while (true) {
    const startTime = Date.now();

    let nextSnapshotBlockHeight: number;
    try {
      nextSnapshotBlockHeight = await getNextSnapshotBlockHeight();
      const { valid, latestBlock } = await checkValidSnapshotBlockHeight(nextSnapshotBlockHeight);
      if (!valid) {
        logger.info(
          `Next snapshot block: ${nextSnapshotBlockHeight}, current block: ${latestBlock.number}. Waiting for snapshot...`
        );
        await sleep(30 * MODE_AVERAGE_BLOCK_TIME);
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
        throw Error(`Block ${nextSnapshotBlockHeight} not found`);
      }
      block = _block;
    } catch (e: any) {
      await sendSlackError(`Failed to get block(${nextSnapshotBlockHeight}): ${e}`);
      await sleep(1000);
      continue;
    }

    let users: string[];
    try {
      const _users = await client.queryUsers({
        createdBlockHeightLte: block.number,
      });
      users = _users.map((user) => user.id);
    } catch (e: any) {
      await sendSlackError(`Failed to get users: ${e}`);
      await sleep(1000);
      continue;
    }

    try {
      const num = await takeAndSaveSnapshotsAt(block, users);
      logger.info(
        `Succeeded to take snapshot${num} at block ${block.number}. Cost ${(
          ms2sec(Date.now() - startTime) / 60
        ).toFixed(2)} minutes`
      );
    } catch (e: any) {
      await sendSlackError(`Failed to take snapshot at block ${block.number}`);
    }
  }
}

async function takeAndSaveSnapshotsAt(block: Block, users: string[]): Promise<number> {
  const reserves = await getReservesData({ blockTag: block.number });

  const { snapshots, failures } = await takeSnapshotForUsers({
    blockHeight: block.number,
    blockTimestamp: block.timestamp,
    users,
    reserves,
  });

  if (snapshots.length !== 0) {
    await saveUserReservesSnapshots(snapshots);
  }

  if (failures.length !== 0) {
    await saveUserReservesSnapshotsFailures(failures);
  }

  return snapshots.length;
}

async function getNextSnapshotBlockHeight(): Promise<number> {
  const config = await getConfig();
  const lastSnapshotBlockHeight = await getLastSnapshotBlockHeight();
  return lastSnapshotBlockHeight
    ? lastSnapshotBlockHeight + config.settings.snapshotBlockInterval
    : config.settings.snapshotStartBlock;
}

async function checkValidSnapshotBlockHeight(blockHeight: number): Promise<{
  valid: boolean;
  latestBlock: Block;
}> {
  const { provider } = await initMode();
  const latestBlock = await provider.getBlock('latest');
  if (!latestBlock) {
    throw Error(`Latest block not found`);
  }

  return {
    valid: latestBlock.number >= blockHeight,
    latestBlock,
  };
}

async function resolveSnapshotsFailures() {
  const { provider } = await initMode();
  while (true) {
    try {
      const failures = await getUnresolvedUserReservesSnapshotsFailures();
      if (failures.length === 0) {
        await sleep(1000 * 60);
        continue;
      }

      for (const failure of failures) {
        const block = await provider.getBlock(Number(failure.block_height));
        if (!block) {
          throw Error(`Block ${failure.block_height} not found`);
        }

        const num = await takeAndSaveSnapshotsAt(block, [failure.user]);

        if (num !== 0) {
          await resolveUserReservesSnapshotsFailure(failure.block_height, failure.user);
          logger.info(`Succeeded to resolve snapshot failure for ${failure.user} at block ${failure.block_height}`);
        }
      }
    } catch (e: any) {
      await sendSlackError(`Failed to resolve snapshot failure: ${e}`);
    }
  }
}

async function main() {
  await prepare();
  void takeAndSaveSnapshots();
  void resolveSnapshotsFailures();
}

void main(); // invoke main
