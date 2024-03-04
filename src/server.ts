import express, { Request, Response } from 'express';
import cors from 'cors';
import { calcPointsForUser, calcPointsForUsers, calcTotalPoints } from './database/models/user-reserves-snapshots';
import { UserPointsData, UserPointsParams, ResponseResult, PointsData } from './types/server';
import { getConfig } from './service/mode';
import { logger } from './service/logger';
import { ethers } from 'ethers';
import { isUint } from './utils/common';

async function handleRoot(_: Request, res: Response) {
  res.send('Molend Points API Server');
}

async function handleConfig(
  _: Request,
  res: Response<ResponseResult<{ snapshot_start_block: number; snapshot_block_interval: number }>>
) {
  logger.info(`Fetch to /config`);

  const config = await getConfig();

  res.send({
    success: true,
    message: '',
    data: {
      snapshot_start_block: config.settings.snapshotStartBlock,
      snapshot_block_interval: config.settings.snapshotBlockInterval,
    },
  });
}

async function handlePoints(req: Request, res: Response<ResponseResult<UserPointsData[]>>) {
  logger.info(`Fetch to /points`);

  const offset = req.query.offset ? req.query.offset.toString() : null;
  if (offset && !isUint(offset)) {
    res.status(400).send({
      success: false,
      message: `Invalid param 'offset'`,
    });
    return;
  }

  const limit = req.query.limit ? req.query.limit.toString() : null;
  if (limit && !isUint(limit)) {
    res.status(400).send({
      success: false,
      message: `Invalid param 'limit'`,
    });
    return;
  }

  try {
    const data = await calcPointsForUsers({ offset, limit });
    res.send({
      success: true,
      message: '',
      data,
    });
  } catch (e: any) {
    const message = `Failed to calculate points: ${e.message}`;
    logger.error(message);
    res.status(500).send({
      success: false,
      message,
    });
  }
}

async function handleUserPoints(req: Request<UserPointsParams>, res: Response<ResponseResult<UserPointsData>>) {
  const user = req.params.user;

  logger.info(`Fetch to /points/${user}`);

  if (!ethers.isAddress(user)) {
    res.status(400).send({
      success: false,
      message: `Invalid user address`,
    });
    return;
  }

  try {
    const data = await calcPointsForUser(user);
    res.send({
      success: true,
      message: '',
      data: {
        user,
        ...data,
      },
    });
  } catch (e: any) {
    const message = `Failed to calculate user points: ${e.message}`;
    logger.error(message);
    res.status(500).send({
      success: false,
      message,
    });
  }
}

async function handleTotalPoints(_: Request, res: Response<ResponseResult<PointsData>>) {
  try {
    const data = await calcTotalPoints();
    res.send({
      success: true,
      message: '',
      data,
    });
  } catch (e: any) {
    res.status(500).send({
      success: false,
      message: `Failed to get total points: ${e.message}`,
    });
  }
}

async function main() {
  const config = await getConfig();

  if (!config.server) {
    throw Error('Missing server config');
  }

  const app = express();

  app.use(cors({ origin: '*' }));

  app.get('/', handleRoot);
  app.get('/config', handleConfig);
  app.get('/points', handlePoints);
  app.get('/points/:user', handleUserPoints);
  app.get('/total_points', handleTotalPoints);

  app.listen(config.server.port);

  logger.info(`API server start at port: ${config.server.port}`);
}

void main();
