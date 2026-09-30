import { Download, ArrowDown, ArrowUp } from "lucide-react";
import { Button, Text } from "@/components/ui/app-shadcn";
import { useTranslation } from "react-i18next";
import { exportExcel } from "../../utils/reportesExport";

/**
 * Tabla uniforme para todos los listados operativos.
 * Cada pantalla define columnas y acciones, sin cambiar la estructura visual.
 */
export function StandardListTable({
  ariaLabel,
  columns,
  rows,
  getRowKey,
  renderActions,
  emptyMessage,
  sort = "",
  onSortChange,
  styles,
  surfaceStyle,
  exportFileName,
  exportTitle,
  canExport = false,
}) {
  const { t } = useTranslation();
  const [activeKey, activeDirection] = String(sort).split(":");
  const toggleSort = (sortKey) => {
    if (!sortKey || !onSortChange) return;
    onSortChange(`${sortKey}:${activeKey === sortKey && activeDirection === "asc" ? "desc" : "asc"}`);
  };
  const downloadExcel = async () => {
    await exportExcel(
      exportTitle || ariaLabel,
      columns.map((column) => column.label),
      rows.map((row) => columns.map((column) => column.exportValue?.(row) ?? column.render(row))),
      exportFileName || "listado"
    );
  };

  if (!rows.length) return <Text className={styles.empty}>{emptyMessage}</Text>;

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "100%",
        boxSizing: "border-box",
        overflowX: "auto",
        overflowY: "hidden",
        WebkitOverflowScrolling: "touch",
        border: "1px solid var(--app-card-border, #d9e2ec)",
        borderRadius: 8,
        ...surfaceStyle,
      }}
    >
      {canExport ? (
        <div style={{ display: "flex", justifyContent: "flex-end", padding: "8px" }}>
          <Button size="small" appearance="outline" icon={<Download />} onClick={downloadExcel}>
            {t("exportExcel")}
          </Button>
        </div>
      ) : null}
      <div style={{ minWidth: "max-content", width: "100%" }}>
        <table style={{ width: "100%", minWidth: 680, borderCollapse: "collapse" }} aria-label={ariaLabel}>
          <thead>
            <tr>
              {columns.map((column) => {
                const active = activeKey === column.sortKey;
                return (
                  <th
                    key={column.key}
                    style={{
                      padding: "12px 14px",
                      textAlign: "left",
                      borderBottom: "1px solid var(--app-card-border, #d9e2ec)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {column.sortKey && onSortChange ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(column.sortKey)}
                        aria-label={`${column.label}: ${t("gridSortAscending")}`}
                        style={{
                          border: 0,
                          background: "transparent",
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        {column.label}
                        {active && activeDirection === "asc" ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                      </button>
                    ) : (
                      <span>{column.label}</span>
                    )}
                  </th>
                );
              })}
              {renderActions ? (
                <th
                  style={{
                    padding: "12px 14px",
                    textAlign: "left",
                    borderBottom: "1px solid var(--app-card-border, #d9e2ec)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {t("actions")}
                </th>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={getRowKey(row)}>
                {columns.map((column) => (
                  <td
                    key={column.key}
                    style={{
                      padding: "12px 14px",
                      borderBottom: "1px solid var(--app-card-border, #d9e2ec)",
                      verticalAlign: "middle",
                      overflowWrap: "anywhere",
                      wordBreak: "break-word",
                    }}
                  >
                    {column.render(row)}
                  </td>
                ))}
                {renderActions ? (
                  <td
                    style={{
                      padding: "8px 14px",
                      borderBottom: "1px solid var(--app-card-border, #d9e2ec)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {renderActions(row)}
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
