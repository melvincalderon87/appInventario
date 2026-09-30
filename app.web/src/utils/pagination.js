export const DEFAULT_PAGE_SIZE = 50;
export const MAX_PAGE_SIZE = 100;
export const PAGE_SIZE_OPTIONS = [20, 25, 50, 75, 100];

export const emptyPagedResult = {
  items: [],
  totalCount: 0,
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
  totalPages: 1,
};

export function normalizePage(value) {
  const page = Number(value);
  return Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
}

export function normalizePageSize(value) {
  const pageSize = Number(value);

  if (!Number.isFinite(pageSize) || pageSize <= 0) {
    return DEFAULT_PAGE_SIZE;
  }

  return Math.min(Math.floor(pageSize), MAX_PAGE_SIZE);
}

export function normalizePagedResult(payload) {
  if (Array.isArray(payload)) {
    return {
      items: payload,
      totalCount: payload.length,
      page: 1,
      pageSize: Math.min(payload.length || DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE),
      totalPages: 1,
    };
  }

  const items = Array.isArray(payload?.items) ? payload.items : [];
  const pageSize = normalizePageSize(payload?.pageSize);
  const totalCount = Number.isFinite(Number(payload?.totalCount))
    ? Number(payload.totalCount)
    : items.length;

  return {
    items,
    totalCount,
    page: normalizePage(payload?.page),
    pageSize,
    totalPages: Math.max(1, Number(payload?.totalPages) || Math.ceil(totalCount / pageSize) || 1),
  };
}

export function appendParam(searchParams, key, value) {
  const normalized = String(value ?? "").trim();

  if (normalized) {
    searchParams.append(key, normalized);
  }
}

export function buildListQuery(params = {}) {
  const searchParams = new URLSearchParams();

  searchParams.set("page", String(normalizePage(params.page)));
  searchParams.set("pageSize", String(normalizePageSize(params.pageSize)));
  appendParam(searchParams, "search", params.search);
  appendParam(searchParams, "sort", params.sort);

  return searchParams.toString();
}

export function getTanStackSortParam(sorting, fallback = "") {
  const firstSort = Array.isArray(sorting) ? sorting[0] : null;

  if (!firstSort?.id) {
    return fallback;
  }

  return `${firstSort.id}:${firstSort.desc ? "desc" : "asc"}`;
}
