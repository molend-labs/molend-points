export interface ResponseResult<T> {
  success: boolean;
  message: string;
  data?: T;
}

export interface UserPointsParams {
  user: string;
}

export interface PointsData {
  total_points: string;
  points_from_deposit: string;
  points_from_borrow: string;
}

export interface UserPointsData extends PointsData {
  user: string;
}
