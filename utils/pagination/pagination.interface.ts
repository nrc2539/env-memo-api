export interface PaginationMeta {
  page: number;
  limitPerPage: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}
