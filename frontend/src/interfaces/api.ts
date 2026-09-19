export type TSort = "ASC" | "DESC";

export interface IQueryRequest {
  search?: string;
  limit?: number;
  page?: number;
  per_page?: number;
  sort?: TSort;
  orderBy?: string;
}

export type TOptionalParams<T extends object = object> = <
  K extends keyof (IQueryRequest & T)
>(
  key: K,
  value: (IQueryRequest & T)[K]
) => void;

export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface ApiResponse<T> {
  status_code: number;
  message: string;
  data: T | null;
  meta?: PaginationMeta;
  errors?: Record<string, string>;
}
