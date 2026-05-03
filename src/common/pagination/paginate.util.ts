import { PaginatedResponse } from './paginated-response.type';

export function paginate<T>(
  items: T[],
  page: number,
  limit: number,
): PaginatedResponse<T> {
  return {
    total: items.length,
    page,
    limit,
    data: items.slice((page - 1) * limit, page * limit),
  };
}
