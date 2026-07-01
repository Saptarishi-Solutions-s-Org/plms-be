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

export function parsePaginationParams(
  params: URLSearchParams | Record<string, unknown> = {},
) {
  const getParam = (key: string) =>
    params instanceof URLSearchParams ? params.get(key) : params[key];

  const pageValue = Number.parseInt(String(getParam("page") ?? ""), 10);
  const limitValue = Number.parseInt(String(getParam("limit") ?? ""), 10);

  const page =
    Number.isFinite(pageValue) && pageValue > 0 ? pageValue : DEFAULT_PAGE;
  const limit =
    Number.isFinite(limitValue) && limitValue > 0
      ? limitValue
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

export function isExportRequest(
  params: URLSearchParams | Record<string, unknown> = {},
) {
  const exportValue =
    params instanceof URLSearchParams ? params.get("export") : params.export;

  return exportValue === "true";
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

export function emptyPagination(limit = DEFAULT_PAGE_LIMIT): PaginationMeta {
  return createPaginationMeta({
    page: DEFAULT_PAGE,
    limit,
    total: 0,
  });
}

export function normalizePaginatedResponse<T>(
  result: T[] | PaginatedResponse<T>,
  fallbackLimit = DEFAULT_PAGE_LIMIT,
) {
  if (Array.isArray(result)) {
    return {
      data: result,
      pagination: createPaginationMeta({
        page: DEFAULT_PAGE,
        limit: fallbackLimit,
        total: result.length,
      }),
    };
  }

  return {
    data: Array.isArray(result?.data) ? result.data : [],
    pagination: result?.pagination ?? emptyPagination(fallbackLimit),
  };
}
