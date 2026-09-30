import { useEffect, useMemo, useState } from "react";
import { DEFAULT_PAGE_SIZE, normalizePage, normalizePageSize } from "../utils/pagination";

function useDebouncedValue(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedValue(value), delay);
    return () => window.clearTimeout(timer);
  }, [delay, value]);

  return debouncedValue;
}

export function useServerPagination(defaultSort = "", defaultPageSize = DEFAULT_PAGE_SIZE) {
  const [search, setSearchValue] = useState("");
  const [page, setPageValue] = useState(1);
  const [pageSize, setPageSizeValue] = useState(defaultPageSize);
  const [sort, setSortValue] = useState(defaultSort);
  const debouncedSearch = useDebouncedValue(search);

  const params = useMemo(
    () => ({
      page,
      pageSize,
      search: debouncedSearch,
      sort,
    }),
    [page, pageSize, debouncedSearch, sort]
  );

  const setSearch = (value) => {
    setSearchValue(value);
    setPageValue(1);
  };

  const setPage = (value) => {
    setPageValue(normalizePage(value));
  };

  const setPageSize = (value) => {
    setPageSizeValue(normalizePageSize(value));
    setPageValue(1);
  };

  const setSort = (value) => {
    setSortValue(value);
    setPageValue(1);
  };

  return {
    page,
    pageSize,
    search,
    sort,
    params,
    setPage,
    setPageSize,
    setSearch,
    setSort,
  };
}
