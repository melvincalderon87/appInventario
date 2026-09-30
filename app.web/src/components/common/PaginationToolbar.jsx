import { Button, Select, Text } from "@/components/ui/app-shadcn";
import { useTranslation } from "react-i18next";
import { PAGE_SIZE_OPTIONS } from "../../utils/pagination";

export function PaginationToolbar({
  page,
  pageSize,
  totalCount,
  totalPages,
  loading = false,
  showPageSize = true,
  onPageChange,
  onPageSizeChange,
}) {
  const { t } = useTranslation();
  const currentPage = Math.max(1, Number(page) || 1);
  const safePageSize = Math.max(1, Number(pageSize) || 50);
  const safeTotal = Math.max(0, Number(totalCount) || 0);
  const safeTotalPages = Math.max(1, Number(totalPages) || 1);
  const rangeStart = safeTotal === 0 ? 0 : (currentPage - 1) * safePageSize + 1;
  const rangeEnd = Math.min(currentPage * safePageSize, safeTotal);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        flexWrap: "nowrap",
        marginBottom: "8px",
        overflowX: "auto",
        whiteSpace: "nowrap",
      }}
    >
      <Text size={200} style={{ flex: "0 0 auto" }}>
        {safeTotal === 0
          ? t("listRange", { start: 0, end: 0, total: 0 })
          : t("listRange", {
              start: rangeStart,
              end: rangeEnd,
              total: safeTotal,
            })}
      </Text>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          flex: "0 0 auto",
          flexWrap: "nowrap",
          marginLeft: "auto",
        }}
      >
        {showPageSize ? (
          <Select
            size="small"
            value={String(safePageSize)}
            onChange={(event, data) => onPageSizeChange(data.value || event.target.value)}
            style={{ flex: "0 0 190px", width: "190px" }}
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={String(size)}>
                {t("pageSizeOption", { count: size })}
              </option>
            ))}
          </Select>
        ) : null}
        <Button
          size="small"
          appearance="outline"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1 || loading}
        >
          {t("previousPage")}
        </Button>
        <Text size={200}>
          {t("pageIndicator", { current: currentPage, total: safeTotalPages })}
        </Text>
        <Button
          size="small"
          appearance="outline"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= safeTotalPages || loading}
        >
          {t("nextPage")}
        </Button>
      </div>
    </div>
  );
}
