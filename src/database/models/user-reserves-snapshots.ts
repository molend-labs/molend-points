import { DataTypes, Model, QueryTypes } from 'sequelize';
import { getDB } from '../postgres';
import { ms2sec, sec2ms } from '../../utils/common';
import { UserPoints, UserReservesSnapshot } from '../../types/models';

export class UserReservesSnapshotsModel extends Model {
  declare block_height?: string;
  declare block_timestamp?: number; // in seconds
  declare user?: string;
  declare token_symbol?: string;
  declare token_address?: string;
  declare token_price_usd?: string;
  declare deposited_amount?: string;
  declare borrowed_amount?: string;
  declare deposited_points_multiplier?: string;
  declare borrowed_points_multiplier?: string;
}

export async function initUserReservesSnapshotsModel() {
  const db = await getDB();

  UserReservesSnapshotsModel.init(
    {
      block_height: {
        type: DataTypes.DECIMAL,
        primaryKey: true,
      },
      block_timestamp: {
        type: DataTypes.DATE,
        get(): number {
          return ms2sec(this.getDataValue('block_timestamp'));
        },
        set(sec: number) {
          this.setDataValue('block_timestamp', sec2ms(sec));
        },
      },
      user: {
        type: DataTypes.TEXT,
        primaryKey: true,
      },
      token_symbol: {
        type: DataTypes.TEXT,
      },
      token_address: {
        type: DataTypes.TEXT,
        primaryKey: true,
      },
      token_price_usd: {
        type: DataTypes.DECIMAL,
      },
      deposited_amount: {
        type: DataTypes.DECIMAL,
      },
      borrowed_amount: {
        type: DataTypes.DECIMAL,
      },
      deposited_points_multiplier: {
        type: DataTypes.DECIMAL,
      },
      borrowed_points_multiplier: {
        type: DataTypes.DECIMAL,
      },
    },
    {
      timestamps: false,
      tableName: 'user_reserves_snapshots',
      sequelize: db,
    }
  );

  await UserReservesSnapshotsModel.sync();
}

export async function getLastSnapshotsBlockHeight(): Promise<number | undefined> {
  const db = await getDB();

  const sql = `
    select max(block_height) as block_height from user_reserves_snapshots;
  `;

  const data = await db.query<{ block_height?: string }>(sql, {
    type: QueryTypes.SELECT,
  });

  return data[0].block_height ? Number(data[0].block_height) : undefined;
}

export async function saveSnapshots(snapshots: UserReservesSnapshot[]) {
  await UserReservesSnapshotsModel.bulkCreate(snapshots as any[], {
    ignoreDuplicates: true,
  });
}

export async function calcPointsForUser(user: string): Promise<string> {
  const db = await getDB();

  const sql = `
    select sum(
      token_price_usd * (
        deposited_amount * deposited_points_multiplier + borrowed_amount * borrowed_points_multiplier
      )
    ) as points
    from user_reserves_snapshots
    where "user" = $user;
  `;

  const data = await db.query<{ points?: string }>(sql, {
    type: QueryTypes.SELECT,
    bind: {
      user,
    },
  });

  return data[0].points ?? '0';
}

export async function calcPointsForUsers(options: {
  offset: string | null;
  limit: string | null;
}): Promise<UserPoints[]> {
  const db = await getDB();

  const sql = `
    select "user", sum(
      token_price_usd * (
        deposited_amount * deposited_points_multiplier + borrowed_amount * borrowed_points_multiplier
      )
    ) as points
    from user_reserves_snapshots
    group by "user"
    order by "points" desc
    offset $offset
    limit $limit;
  `;

  return db.query<UserPoints>(sql, {
    type: QueryTypes.SELECT,
    bind: {
      offset: options.offset,
      limit: options.limit,
    },
  });
}
