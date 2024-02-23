export interface UserReservesSnapshots {
  block_height?: string;
  block_timestamp?: number; // in seconds
  user?: string;
  token_symbol?: string;
  token_address?: string;
  deposited_amount?: string;
  borrowed_amount?: string;
  points_multiplier?: string;
}
