import { DataTypes, Model, QueryTypes } from 'sequelize';
import { getDB } from '../postgres';
import { ms2sec, sec2ms } from '../../utils/common';
import { UserReservesSnapshotsFailure, UserReservesSnapshot } from '../../types/models';

export class UserReservesSnapshotsFailureModel extends Model {
  declare block_height?: string;
  declare block_timestamp?: number; // in seconds
  declare user?: string;
  declare message?: string;
  declare resolved?: boolean;
}

export async function initUserReservesSnapshotsFailureModel() {
  const db = await getDB();

  UserReservesSnapshotsFailureModel.init(
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
      message: {
        type: DataTypes.TEXT,
      },
      resolved: {
        type: DataTypes.BOOLEAN,
      },
    },
    {
      timestamps: false,
      tableName: 'user_reserves_snapshots_failure',
      sequelize: db,
    }
  );

  await UserReservesSnapshotsFailureModel.sync();
}

export async function getUnresolvedUserReservesSnapshotsFailures(): Promise<UserReservesSnapshotsFailure[]> {
  const sql = `select * from user_reserves_snapshots_failure where resolved = false`;

  const db = await getDB();

  return db.query<UserReservesSnapshotsFailure>(sql, {
    type: QueryTypes.SELECT,
  });
}

export async function saveUserReservesSnapshotsFailures(failures: UserReservesSnapshotsFailure[]) {
  await UserReservesSnapshotsFailureModel.bulkCreate(failures as any[], {
    ignoreDuplicates: true,
  });
}
