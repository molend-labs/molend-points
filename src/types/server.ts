export interface ResponseResult<T> {
  success: boolean;
  message: string;
  data?: T;
}

export interface UserPointsParams {
  user: string;
}

export interface UserPointsData {
  points: string;
}
