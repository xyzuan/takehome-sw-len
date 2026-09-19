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
