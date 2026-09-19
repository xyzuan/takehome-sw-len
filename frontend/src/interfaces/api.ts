export type TSort = "ASC" | "DESC";

export interface IQueryRequest {
  search?: string;
  limit?: number;
  page?: number;
  per_page?: number;
  sort?: TSort;
  orderBy?: string;
  type?: string;
  status?: string;
  bbox?: string;
  zoom?: number;
}

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
