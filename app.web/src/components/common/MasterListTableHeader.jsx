import { ArrowDown, ArrowUp } from "lucide-react";

export function MasterListTableHeader({ styles, t, columns, sort, onSortChange }) {
  const changeSort = (sortKey) => {
    const [activeKey, activeDirection] = String(sort || "").split(":");
    const nextDirection = activeKey === sortKey && activeDirection === "asc" ? "desc" : "asc";
    onSortChange(`${sortKey}:${nextDirection}`);
  };

  return (
    <div className={styles.tableColumns} role="row">
      {columns.map(({ label, sortKey }) => (
        <button
          key={sortKey}
          type="button"
          onClick={() => changeSort(sortKey)}
          aria-label={`${label}: ${t("gridSortAscending")}`}
        >
          <span>{label}</span>
          {String(sort || "").startsWith(`${sortKey}:`) ? (
            String(sort).endsWith(":asc") ? (
              <ArrowUp size={14} />
            ) : (
              <ArrowDown size={14} />
            )
          ) : (
            <>
              <ArrowUp size={11} />
              <ArrowDown size={11} />
            </>
          )}
        </button>
      ))}
      <span>{t("actions")}</span>
    </div>
  );
}
