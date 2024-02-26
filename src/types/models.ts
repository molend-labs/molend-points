export interface UserReservesSnapshot {
  block_height: string;
  block_timestamp: number; // in seconds
  user: string;
  token_symbol: string;
  token_address: string;
  token_price_usd: string;
  deposited_amount: string;
  borrowed_amount: string;
  deposited_points_multiplier: string;
  borrowed_points_multiplier: string;
}
