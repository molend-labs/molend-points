import { runSnapshot } from './snapshot';
import { runServer } from './server';

async function main() {
  void runSnapshot();
  void runServer();
}

void main();
