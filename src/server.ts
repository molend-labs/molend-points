import express, { Request, Response } from 'express';
import cors from 'cors';
import { calcUserPoints } from './database/models/user-reserves-snapshots';
import { PointsData, PointsParams, ResponseResult } from './types/server';
import { getConfig } from './service/mode';

async function main() {
  const config = await getConfig();
  if (!config.server) {
    throw Error('Missing server config');
  }

  const app = express();

  app.use(cors({ origin: '*' }));

  app.get('points', async (req: Request<PointsParams>, res: Response<ResponseResult<PointsData>>) => {
    const user = req.params.user;
    if (!user) {
      res.status(400).send({
        success: false,
        message: `Missing param 'user'`,
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
      res.status(500).send({
        success: false,
        message: 'Failed to calculate user points',
      });
    }
  });

  app.listen(config.server.port);
}

void main();
