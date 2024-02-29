import { cacheExchange, Client, ClientOptions, fetchExchange, gql } from '@urql/core';
import { getConfig } from '../service/mode';
import fetch from 'cross-fetch';
import { QueryUsersData, User } from '../types/subgraph-data';
import { QueryUsersVariables } from '../types/subgraph-variables';

let client: MolendSubGraphClient | undefined;

export async function getSubGraphClient(): Promise<MolendSubGraphClient> {
  if (!client) {
    const config = await getConfig();
    client = new MolendSubGraphClient({
      exchanges: [fetchExchange, cacheExchange],
      url: config.subgraph.apiUrl,
      fetch,
    });
  }

  return client;
}

export class MolendSubGraphClient {
  client: Client;

  constructor(options: ClientOptions) {
    this.client = new Client(options);
  }

  async queryUsers(where: { createdBlockHeightLte: number }): Promise<User[]> {
    const sql = gql`
      query ($createdBlockHeightLte: BigInt!, $idGt: String!) {
        users(
          where: { createdBlockHeight_lte: $createdBlockHeightLte, id_gt: $idGt }
          orderBy: id
          orderDirection: asc
          first: 1000
        ) {
          id
          createdTimestamp
          createdBlockHeight
        }
      }
    `;

    let id = '';

    const allUsers: User[] = [];

    while (true) {
      const result = await this.client.query<QueryUsersData, QueryUsersVariables>(sql, {
        createdBlockHeightLte: where.createdBlockHeightLte.toString(),
        idGt: id,
      });

      if (result.error) {
        throw result.error;
      }

      const users = result.data!.users;

      allUsers.push(...users);

      if (users.length < 1000) {
        break;
      }

      id = users[users.length - 1].id;
    }

    return allUsers;
  }
}
