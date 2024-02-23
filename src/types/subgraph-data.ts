export interface QueryUsersData {
  users: User[];
}

export interface User {
  id: string;
  createdTimestamp: number;
  createdBlockHeight: string;
}
