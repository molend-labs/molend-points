import { initUserReservesSnapshotsModel } from './database/models/user-reserves-snapshots';

async function main() {
  await prepare();
}

async function prepare() {
  await initUserReservesSnapshotsModel();
}

void main();
