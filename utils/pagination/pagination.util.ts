import { PaginationDto } from './dto/pagiantion.dto.js';
import type { PaginatedResult } from './pagination.interface.js';

export function getPagination(page: number = 1, limit: number = 10) {
  const take = limit > 0 ? limit : 10;
  const skip = (page - 1) * take;

  return {
    skip,
    take,
  };
}

export function formatPaginatedResponse<T>(
  data: T[],
  total: number,
  query: PaginationDto,
): PaginatedResult<T> {
  const { page = 1, limitPerPage = 10, all = false } = query;

  return {
    data,
    meta: {
      page: all ? 1 : page,
      limitPerPage: all ? total : limitPerPage,
      total,
      totalPages: all ? 1 : Math.ceil(total / limitPerPage) || 1,
    },
  };
}
