export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_LIMIT = 25;
export const PAGE_LIMIT_OPTIONS = [25, 50, 75, 100] as const;

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type PaginatedResponse<T> = {
  data: T[];
  pagination: PaginationMeta;
};

export function parsePaginationParams(params: any = {}) {
  const pageValue = Number.parseInt(String(params.page ?? ""), 10);
  const limitValue = Number.parseInt(String(params.limit ?? ""), 10);

  const page =
    Number.isFinite(pageValue) && pageValue > 0 ? pageValue : DEFAULT_PAGE;
  const requestedLimit =
    Number.isFinite(limitValue) && limitValue > 0
      ? limitValue
      : DEFAULT_PAGE_LIMIT;
  const limit = PAGE_LIMIT_OPTIONS.includes(requestedLimit as any)
    ? requestedLimit
    : DEFAULT_PAGE_LIMIT;

  return {
    page,
    limit,
    offset: (page - 1) * limit,
  };
}

export function createPaginationMeta({
  page,
  limit,
  total,
}: {
  page: number;
  limit: number;
  total: number;
}): PaginationMeta {
  return {
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

export function paginatedResponse<T>({
  data,
  page,
  limit,
  total,
}: {
  data: T[];
  page: number;
  limit: number;
  total: number;
}): PaginatedResponse<T> {
  return {
    data,
    pagination: createPaginationMeta({ page, limit, total }),
  };
}
