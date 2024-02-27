export interface ResponseResult<T> {
  success: boolean;
  message: string;
  data?: T;
}

export interface PointsParams {
  user?: string;
}

export interface PointsData {
  points: string;
}
