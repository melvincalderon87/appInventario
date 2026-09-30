import { useMemo, useState } from "react";
import { useFormStateAdapter } from "../../hooks/useFormStateAdapter";
import {
  Button,
  Field,
  Input,
  MessageBar,
  Select,
  Spinner,
  Text,
  Title2,
} from "@/components/ui/app-shadcn";
import { RefreshCw, X, Table2, Search } from "lucide-react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { PaginationToolbar } from "../../components/common/PaginationToolbar";
import { usePermisosPantalla } from "../../context/permisosPantallaContext";
import { LogModificacionService } from "../../services/logModificacionService";
import { getMenuThemeStyles, useMenuStyles } from "../../styles/pages/menu/menuPageStyles";
import {
  formatDateByLanguage,
  formatDateFilterByLanguage,
  getDateInputPlaceholderByLanguage,
  parseDateFilterByLanguage,
} from "../../utils/formatDateByLanguage";
import { DEFAULT_PAGE_SIZE, emptyPagedResult } from "../../utils/pagination";
import { validateDateFilterResult } from "../../validations/zodValidation";

const initialFilters = {
  tabla: "",
  accion: "",
  codUsuario: "",
  fechaInicio: "",
  fechaFin: "",
  texto: "",
};

const initialDateInputs = {
  fechaInicio: "",
  fechaFin: "",
};

function normalizeText(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function compareText(a, b) {
  return normalizeText(a).localeCompare(normalizeText(b), undefined, {
    numeric: true,
  });
}

function compareDate(a, b) {
  const timeA = new Date(a ?? "").getTime();
  const timeB = new Date(b ?? "").getTime();
  const safeTimeA = Number.isNaN(timeA) ? 0 : timeA;
  const safeTimeB = Number.isNaN(timeB) ? 0 : timeB;
  return safeTimeA - safeTimeB;
}

function escapeExcelValue(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildExportFileName() {
  const now = new Date();
  const pad = (value) => String(value).padStart(2, "0");

  return [
    "log_modificaciones",
    now.getFullYear(),
    pad(now.getMonth() + 1),
    pad(now.getDate()),
    `${pad(now.getHours())}${pad(now.getMinutes())}`,
  ].join("_");
}

function LogModificacionListPage() {
  const styles = useMenuStyles();
  const themeStyles = getMenuThemeStyles();
  const { t, i18n } = useTranslation();
  const { tienePermiso } = usePermisosPantalla();

  const { values: filters, setValues: setFilters } = useFormStateAdapter(initialFilters);
  const { values: dateInputs, setValues: setDateInputs } = useFormStateAdapter(initialDateInputs);
  const [appliedFilters, setAppliedFilters] = useState(initialFilters);
  const [filterError, setFilterError] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [sorting, setSorting] = useState({ key: "fecha", direction: "desc" });
  const sort = `${sorting.key}:${sorting.direction}`;

  const modulosQuery = useQuery({
    queryKey: ["log-modificacion-modulos"],
    queryFn: async () => {
      try {
        const data = await LogModificacionService.listarModulos();
        return Array.isArray(data) ? data : [];
      } catch {
        return [];
      }
    },
    staleTime: 5 * 60 * 1000,
  });

  const logsQuery = useQuery({
    queryKey: ["log-modificacion-listado", appliedFilters, page, pageSize, sort],
    queryFn: () =>
      LogModificacionService.listado({
        ...appliedFilters,
        search: appliedFilters.texto,
        page,
        pageSize,
        sort,
      }),
    placeholderData: keepPreviousData,
  });
  const logsPage = logsQuery.data ?? emptyPagedResult;
  const logs = useMemo(
    () => (Array.isArray(logsPage.items) ? logsPage.items : []),
    [logsPage.items]
  );
  const modulos = useMemo(
    () => (Array.isArray(modulosQuery.data) ? modulosQuery.data : []),
    [modulosQuery.data]
  );
  const loading = logsQuery.isLoading;
  const busy = logsQuery.isFetching;
  const error =
    filterError ||
    (logsQuery.isError ? logsQuery.error?.message || t("modificationLogLoadError") : "");

  const countText = useMemo(
    () => t("modificationLogCount", { count: logsPage.totalCount }),
    [logsPage.totalCount, t]
  );
  const dateInputPlaceholder = getDateInputPlaceholderByLanguage(i18n.language);
  const formattedDateInputs = useMemo(
    () => ({
      fechaInicio: formatDateFilterByLanguage(dateInputs.fechaInicio, i18n.language),
      fechaFin: formatDateFilterByLanguage(dateInputs.fechaFin, i18n.language),
    }),
    [dateInputs.fechaFin, dateInputs.fechaInicio, i18n.language]
  );

  const columns = useMemo(
    () => [
      {
        key: "fecha",
        label: t("date"),
        width: "145px",
        compare: (a, b) => compareDate(a.fecha, b.fecha),
        render: (log) => formatDateByLanguage(log.fecha, i18n.language),
      },
      {
        key: "codUsuario",
        label: t("user"),
        width: "120px",
        compare: (a, b) => compareText(a.codUsuario, b.codUsuario),
        render: (log) => log.codUsuario,
      },
      {
        key: "tabla",
        label: t("module"),
        width: "145px",
        compare: (a, b) => compareText(a.tabla, b.tabla),
        render: (log) => log.tabla,
      },
      {
        key: "accion",
        label: t("action"),
        width: "100px",
        compare: (a, b) => compareText(a.accion, b.accion),
        render: (log) => log.accion,
      },
      {
        key: "llave",
        label: t("key"),
        width: "200px",
        compare: (a, b) => compareText(a.llave, b.llave),
        render: (log) => log.llave,
      },
      {
        key: "descripcion",
        label: t("description"),
        compare: (a, b) => compareText(a.descripcion, b.descripcion),
        render: (log) => log.descripcion,
        expanded: true,
      },
    ],
    [i18n.language, t]
  );

  const updateFilter = (key, value) => {
    setFilters((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const updateDateInput = (key, value) => {
    setDateInputs((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const search = (event) => {
    event.preventDefault();

    const fechaInicio = parseDateFilterByLanguage(formattedDateInputs.fechaInicio, i18n.language);
    const fechaInicioValidation = validateDateFilterResult(
      fechaInicio,
      t("invalidStartDateFilter", { format: dateInputPlaceholder })
    );

    if (!fechaInicioValidation.ok) {
      setFilterError(fechaInicioValidation.error);
      return;
    }

    const fechaFin = parseDateFilterByLanguage(formattedDateInputs.fechaFin, i18n.language);
    const fechaFinValidation = validateDateFilterResult(
      fechaFin,
      t("invalidEndDateFilter", { format: dateInputPlaceholder })
    );

    if (!fechaFinValidation.ok) {
      setFilterError(fechaFinValidation.error);
      return;
    }

    const nextFilters = {
      ...filters,
      fechaInicio: fechaInicio.value,
      fechaFin: fechaFin.value,
    };

    setFilterError("");
    setDateInputs({
      fechaInicio: fechaInicio.value,
      fechaFin: fechaFin.value,
    });
    setFilters(nextFilters);
    setAppliedFilters(nextFilters);
    setPage(1);
  };

  const clearFilters = () => {
    setFilters(initialFilters);
    setDateInputs(initialDateInputs);
    setFilterError("");
    setAppliedFilters(initialFilters);
    setPage(1);
  };

  const refresh = () => {
    logsQuery.refetch();
  };

  const toggleSort = (key) => {
    setSorting((current) => {
      if (current.key !== key) {
        return { key, direction: "asc" };
      }

      return {
        key,
        direction: current.direction === "asc" ? "desc" : "asc",
      };
    });
    setPage(1);
  };

  const getSortIndicator = (key) => {
    if (sorting.key !== key) return "";
    return sorting.direction === "asc" ? "^" : "v";
  };

  const getSortLabel = (column) => {
    const nextDirection =
      sorting.key === column.key && sorting.direction === "asc"
        ? t("gridSortDescending")
        : t("gridSortAscending");

    return `${column.label} ${nextDirection}`;
  };

  const getCellStyle = (column) => {
    const baseStyle = {
      height: "auto",
      minHeight: "30px",
      padding: "4px 8px",
      lineHeight: "1.15",
    };

    if (!column.expanded) {
      return baseStyle;
    }

    return {
      ...baseStyle,
      whiteSpace: "normal",
      overflow: "visible",
      overflowWrap: "anywhere",
      wordBreak: "break-word",
      textOverflow: "clip",
      verticalAlign: "top",
    };
  };

  const exportToExcel = () => {
    const headers = columns.map((column) => column.label);
    const bodyRows = logs.map((log) => columns.map((column) => column.render(log)));
    const tableRows = [headers, ...bodyRows]
      .map((row) => `<tr>${row.map((cell) => `<td>${escapeExcelValue(cell)}</td>`).join("")}</tr>`)
      .join("");
    const html = `<!doctype html><html><head><meta charset="utf-8" /></head><body><table>${tableRows}</table></body></html>`;
    const blob = new Blob([html], {
      type: "application/vnd.ms-excel;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `${buildExportFileName()}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <section className={styles.root}>
      <div className={styles.header}>
        <div>
          <Title2 className={styles.title}>{t("modificationLogTitle")}</Title2>
          <Text className={styles.subtitle}>{countText}</Text>
        </div>
        <div className={styles.modificationSearchActions}>
          {tienePermiso("exportar") ? (
            <Button
              appearance="primary"
              icon={<Table2 />}
              onClick={exportToExcel}
              disabled={busy || logs.length === 0}
            >
              {t("exportExcel")}
            </Button>
          ) : null}
          <Button appearance="outline" icon={<RefreshCw />} onClick={refresh} disabled={busy}>
            {t("refresh")}
          </Button>
        </div>
      </div>

      {error ? <MessageBar intent="error">{error}</MessageBar> : null}

      <form className={styles.searchBar} style={themeStyles.surface} onSubmit={search}>
        <div className={styles.modificationFilterGrid}>
          <Field label={t("module")}>
            <Input
              value={filters.tabla}
              list="modification-log-modules"
              onChange={(_, data) => updateFilter("tabla", data.value)}
              placeholder={t("module")}
            />
          </Field>
          <datalist id="modification-log-modules">
            {modulos.map((modulo) => (
              <option key={modulo} value={modulo} />
            ))}
          </datalist>

          <Field label={t("action")}>
            <Select
              value={filters.accion}
              onChange={(event, data) => updateFilter("accion", data.value || event.target.value)}
            >
              <option value="">{t("all")}</option>
              <option value="Agregar">{t("add")}</option>
              <option value="Editar">{t("edit")}</option>
              <option value="Eliminar">{t("delete")}</option>
              <option value="Login">{t("loginAction")}</option>
              <option value="Salir">{t("logoutAction")}</option>
            </Select>
          </Field>

          <Field label={t("user")}>
            <Input
              value={filters.codUsuario}
              onChange={(_, data) => updateFilter("codUsuario", data.value)}
              placeholder={t("user")}
            />
          </Field>

          <Field label={t("startDate")}>
            <Input
              value={formattedDateInputs.fechaInicio}
              inputMode="numeric"
              placeholder={dateInputPlaceholder}
              title={dateInputPlaceholder}
              onChange={(_, data) => updateDateInput("fechaInicio", data.value)}
            />
          </Field>

          <Field label={t("endDate")}>
            <Input
              value={formattedDateInputs.fechaFin}
              inputMode="numeric"
              placeholder={dateInputPlaceholder}
              title={dateInputPlaceholder}
              onChange={(_, data) => updateDateInput("fechaFin", data.value)}
            />
          </Field>
        </div>

        <div className={styles.modificationSearchRow}>
          <Field label={t("search")}>
            <Input
              value={filters.texto}
              onChange={(_, data) => updateFilter("texto", data.value)}
              contentBefore={<Search />}
              placeholder={t("search")}
            />
          </Field>

          <div className={styles.modificationSearchActions}>
            <Button type="submit" appearance="primary" icon={<Search />} disabled={busy}>
              {t("search")}
            </Button>
            <Button
              type="button"
              appearance="outline"
              icon={<X />}
              onClick={clearFilters}
              disabled={busy}
            >
              {t("clear")}
            </Button>
          </div>
        </div>
      </form>

      <div className={styles.listSurface}>
        <PaginationToolbar
          page={logsPage.page}
          pageSize={logsPage.pageSize}
          totalCount={logsPage.totalCount}
          totalPages={logsPage.totalPages}
          loading={busy}
          onPageChange={setPage}
          onPageSizeChange={(value) => {
            setPageSize(Number(value));
            setPage(1);
          }}
        />
        {loading ? (
          <div className={styles.loading}>
            <Spinner label={t("loadingModificationLog")} />
          </div>
        ) : (
          <div className={styles.menuTableSurface} style={themeStyles.surface}>
            {logs.length > 0 ? (
              <div className={styles.menuTableScroll}>
                <table
                  className={styles.menuTable}
                  aria-label={t("modificationLogTitle")}
                  style={{ minWidth: "980px", width: "100%" }}
                >
                  <colgroup>
                    {columns.map((column) => (
                      <col
                        key={column.key}
                        style={column.width ? { width: column.width } : undefined}
                      />
                    ))}
                  </colgroup>
                  <thead>
                    <tr>
                      {columns.map((column) => (
                        <th key={column.key} className={styles.menuHeaderCell}>
                          <button
                            type="button"
                            className={styles.menuSortButton}
                            onClick={() => toggleSort(column.key)}
                            aria-label={getSortLabel(column)}
                          >
                            <span className={styles.tableHeaderLabel}>{column.label}</span>
                            <span className={styles.sortIndicator}>
                              {getSortIndicator(column.key)}
                            </span>
                          </button>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr
                        key={log.idLogModificacion || log.codLogModificacion}
                        className={styles.menuRow}
                      >
                        {columns.map((column) => (
                          <td
                            key={column.key}
                            className={styles.menuCell}
                            style={getCellStyle(column)}
                          >
                            {column.render(log)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <Text className={styles.empty}>{t("noModificationLogFound")}</Text>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

export default LogModificacionListPage;
