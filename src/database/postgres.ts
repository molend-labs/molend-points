import { Sequelize } from 'sequelize';
import { getConfig } from '../service/mode';

let db: Sequelize | undefined;

export async function getDB() {
  if (!db) {
    const config = await getConfig();
    db = new Sequelize({
      ...config.database,
      dialect: 'postgres',
      logging: false,
    });
  }

  return db;
}
