import { DataTypes, Model } from 'sequelize';
import { getDB } from '../postgres';
import { ms2sec, sec2ms } from '../../utils/common';

export class UserReservesSnapshotsModel extends Model {
  declare block_height?: string;
  declare block_timestamp?: number; // in seconds
  declare user?: string;
  declare token_symbol?: string;
  declare token_address?: string;
  declare deposited_amount?: string;
  declare borrowed_amount?: string;
  declare points_multiplier?: string;
}

export async function initUserReservesSnapshotsModel() {
  const db = await getDB();

  UserReservesSnapshotsModel.init(
    {
      block_height: {
        type: DataTypes.DECIMAL,
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
      },
      token_symbol: {
        type: DataTypes.TEXT,
      },
      token_address: {
        type: DataTypes.TEXT,
      },
      deposited_amount: {
        type: DataTypes.DECIMAL,
      },
      borrowed_amount: {
        type: DataTypes.DECIMAL,
      },
      points_multiplier: {
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
