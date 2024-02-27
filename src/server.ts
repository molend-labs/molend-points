import express, { Request, Response } from 'express';
import cors from 'cors';
import { calcPointsForUser, calcPointsForUsers } from './database/models/user-reserves-snapshots';
import { UserPointsData, UserPointsParams, ResponseResult } from './types/server';
import { getConfig } from './service/mode';
import { logger } from './service/logger';
import { ethers } from 'ethers';
import { UserPoints } from './types/models';

async function handleRoot(_: Request, res: Response) {
  res.send('Molend Points API Server');
}

async function handlePoints(_: Request, res: Response<ResponseResult<UserPoints[]>>) {
  logger.info(`Fetch to /points`);

  try {
    const points = await calcPointsForUsers();
    res.send({
      success: true,
      message: '',
      data: points,
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
    const points = await calcPointsForUser(user);
    res.send({
      success: true,
      message: '',
      data: {
        points,
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

async function main() {
  const config = await getConfig();

  if (!config.server) {
    throw Error('Missing server config');
  }

  const app = express();

  app.use(cors({ origin: '*' }));

  app.get('/', handleRoot);
  app.get('/points', handlePoints);
  app.get('/points/:user', handleUserPoints);

  app.listen(config.server.port);

  logger.info(`API server start at port: ${config.server.port}`);
}

void main();
