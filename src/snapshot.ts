import {
  getLastSnapshotsBlockHeight,
  initUserReservesSnapshotsModel,
  saveSnapshots,
} from './database/models/user-reserves-snapshots';
import { getConfig, initMode } from './service/mode';
import { getSubGraphClient } from './subgraph/client';
import { sendSlackError } from './service/notification';
import { takeSnapshotForUsers } from './utils/snapshot';
import { Block } from 'ethers';
import { getReservesData } from './utils/contract';
import { MODE_AVERAGE_BLOCK_TIME, ms2sec, sleep } from './utils/common';
import { logger } from './service/logger';
import {
  getUnresolvedSnapshotsFailures,
  initUserReservesSnapshotsFailuresModel,
  resolveSnapshotsFailure,
  saveSnapshotsFailures,
} from './database/models/user-reserves-snapshots-failures';

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
      const { valid, latestBlock } = await isValidSnapshotBlockHeight(nextSnapshotBlockHeight);
      if (!valid) {
        logger.info(
          `Next snapshot block: ${nextSnapshotBlockHeight}, current block: ${latestBlock.number}. Waiting ${
            nextSnapshotBlockHeight - latestBlock.number
          } blocks for snapshot...`
        );
        await sleep(30 * MODE_AVERAGE_BLOCK_TIME);
        continue;
      }
    } catch (e: any) {
      await sendSlackError(`Failed to get next snapshot block height: ${e}`);
      await sleep(1000);
      continue;
    }

    let block: Block | null;
    try {
      block = await provider.getBlock(nextSnapshotBlockHeight);
      if (!block) {
        throw Error(`Block ${nextSnapshotBlockHeight} not found`);
      }
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
        `Succeeded to take snapshots(${users.length} users with total ${num} snapshots) at block ${
          block.number
        }. Cost ${(ms2sec(Date.now() - startTime) / 60).toFixed(2)} minutes`
      );
    } catch (e: any) {
      await sendSlackError(`Failed to take snapshot at block ${block.number}: ${e}`);
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
    await saveSnapshots(snapshots);
  }

  if (failures.length !== 0) {
    await saveSnapshotsFailures(failures);
  }

  return snapshots.length;
}

async function getNextSnapshotBlockHeight(): Promise<number> {
  const config = await getConfig();
  const lastSnapshotBlockHeight = await getLastSnapshotsBlockHeight();
  return lastSnapshotBlockHeight
    ? lastSnapshotBlockHeight + config.settings.snapshotBlockInterval
    : config.settings.snapshotStartBlock;
}

async function isValidSnapshotBlockHeight(blockHeight: number): Promise<{
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

async function resolveFailuresAndRetakeAndSaveSnapshots() {
  const { provider } = await initMode();
  while (true) {
    try {
      const failures = await getUnresolvedSnapshotsFailures();
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
          await resolveSnapshotsFailure(failure.block_height, failure.user);
          logger.info(`Succeeded to resolve snapshots failure for ${failure.user} at block ${failure.block_height}`);
        }
      }
    } catch (e: any) {
      await sendSlackError(`Failed to resolve snapshots failure: ${e}`);
    }
  }
}

export async function runSnapshot() {
  await prepare();

  // invoke parallel
  void takeAndSaveSnapshots();
  void resolveFailuresAndRetakeAndSaveSnapshots();
}
