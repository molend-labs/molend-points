import express, { Request, Response } from 'express';
import cors from 'cors';
import { calcUserPoints } from './database/models/user-reserves-snapshots';
import { PointsData, PointsParams, ResponseResult } from './types/server';
import { getConfig } from './service/mode';
import { logger } from './service/logger';
import { ethers } from 'ethers';

async function main() {
  const config = await getConfig();
  if (!config.server) {
    throw Error('Missing server config');
  }

  const app = express();

  app.use(cors({ origin: '*' }));

  app.get('/', async (_, res) => {
    res.send('Molend Points API Server');
  });

  app.get('/points/:user', async (req: Request<PointsParams>, res: Response<ResponseResult<PointsData>>) => {
    const user = req.params.user;

    logger.info(`Fetch to '/points/${user}'`);

    if (!ethers.isAddress(user)) {
      res.status(400).send({
        success: false,
        message: `Invalid user address`,
      });
      return;
    }

    try {
      const points = await calcUserPoints(user);
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
  });

  app.listen(config.server.port);

  logger.info(`Server start at port: ${config.server.port}`);
}

void main();
