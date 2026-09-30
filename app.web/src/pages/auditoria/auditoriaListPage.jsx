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
import { RefreshCw, X, Search } from "lucide-react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { PaginationToolbar } from "../../components/common/PaginationToolbar";
import { AuditoriaService } from "../../services/auditoriaService";
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
  controlador: "",
  accion: "",
  codUsuario: "",
  metodo: "",
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

function AuditoriaListPage() {
  const styles = useMenuStyles();
  const themeStyles = getMenuThemeStyles();
  const { t, i18n } = useTranslation();

  const { values: filters, setValues: setFilters } = useFormStateAdapter(initialFilters);
  const { values: dateInputs, setValues: setDateInputs } = useFormStateAdapter(initialDateInputs);
  const [appliedFilters, setAppliedFilters] = useState(initialFilters);
  const [filterError, setFilterError] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [sorting, setSorting] = useState({
    key: "conectado",
    direction: "desc",
  });
  const sort = `${sorting.key}:${sorting.direction}`;

  const controladoresQuery = useQuery({
    queryKey: ["auditoria-controladores"],
    queryFn: async () => {
      try {
        const data = await AuditoriaService.listarControladores();
        return Array.isArray(data) ? data : [];
      } catch {
        return [];
      }
    },
    staleTime: 5 * 60 * 1000,
  });

  const auditoriasQuery = useQuery({
    queryKey: ["auditoria-listado", appliedFilters, page, pageSize, sort],
    queryFn: () =>
      AuditoriaService.listado({
        ...appliedFilters,
        search: appliedFilters.texto,
        page,
        pageSize,
        sort,
      }),
    placeholderData: keepPreviousData,
  });
  const auditoriasPage = auditoriasQuery.data ?? emptyPagedResult;
  const auditorias = useMemo(
    () => (Array.isArray(auditoriasPage.items) ? auditoriasPage.items : []),
    [auditoriasPage.items]
  );
  const controladores = useMemo(
    () => (Array.isArray(controladoresQuery.data) ? controladoresQuery.data : []),
    [controladoresQuery.data]
  );
  const loading = auditoriasQuery.isLoading;
  const busy = auditoriasQuery.isFetching;
  const error =
    filterError ||
    (auditoriasQuery.isError ? auditoriasQuery.error?.message || t("auditLoadError") : "");

  const countText = useMemo(
    () => t("auditCount", { count: auditoriasPage.totalCount }),
    [auditoriasPage.totalCount, t]
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
        key: "conectado",
        label: t("connectedAt"),
        width: "145px",
        compare: (a, b) => compareDate(a.conectado, b.conectado),
        render: (auditoria) => formatDateByLanguage(auditoria.conectado, i18n.language),
      },
      {
        key: "codUsuario",
        label: t("user"),
        width: "120px",
        compare: (a, b) => compareText(a.codUsuario, b.codUsuario),
        render: (auditoria) => auditoria.codUsuario,
      },
      {
        key: "controlador",
        label: t("controller"),
        width: "140px",
        compare: (a, b) => compareText(a.controlador, b.controlador),
        render: (auditoria) => auditoria.controlador,
      },
      {
        key: "accion",
        label: t("action"),
        width: "120px",
        compare: (a, b) => compareText(a.accion, b.accion),
        render: (auditoria) => auditoria.accion,
      },
      {
        key: "metodo",
        label: t("method"),
        width: "90px",
        compare: (a, b) => compareText(a.metodo, b.metodo),
        render: (auditoria) => auditoria.metodo,
      },
      {
        key: "ipAddress",
        label: t("ipAddress"),
        width: "125px",
        compare: (a, b) => compareText(a.ipAddress, b.ipAddress),
        render: (auditoria) => auditoria.ipAddress,
      },
      {
        key: "estadoSesion",
        label: t("sessionStatus"),
        width: "115px",
        compare: (a, b) => compareText(a.estadoSesion, b.estadoSesion),
        render: (auditoria) => auditoria.estadoSesion,
      },
      {
        key: "paginaAccedida",
        label: t("accessedPage"),
        compare: (a, b) => compareText(a.paginaAccedida, b.paginaAccedida),
        render: (auditoria) => auditoria.paginaAccedida || auditoria.url,
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
    auditoriasQuery.refetch();
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

  return (
    <section className={styles.root}>
      <div className={styles.header}>
        <div>
          <Title2 className={styles.title}>{t("auditTitle")}</Title2>
          <Text className={styles.subtitle}>{countText}</Text>
        </div>
        <Button appearance="outline" icon={<RefreshCw />} onClick={refresh} disabled={busy}>
          {t("refresh")}
        </Button>
      </div>

      {error ? <MessageBar intent="error">{error}</MessageBar> : null}

      <form className={styles.searchBar} style={themeStyles.surface} onSubmit={search}>
        <div className={styles.modificationFilterGrid}>
          <Field label={t("controller")}>
            <Input
              value={filters.controlador}
              list="audit-controllers"
              onChange={(_, data) => updateFilter("controlador", data.value)}
              placeholder={t("controller")}
            />
          </Field>
          <datalist id="audit-controllers">
            {controladores.map((controlador) => (
              <option key={controlador} value={controlador} />
            ))}
          </datalist>

          <Field label={t("action")}>
            <Input
              value={filters.accion}
              onChange={(_, data) => updateFilter("accion", data.value)}
              placeholder={t("action")}
            />
          </Field>

          <Field label={t("user")}>
            <Input
              value={filters.codUsuario}
              onChange={(_, data) => updateFilter("codUsuario", data.value)}
              placeholder={t("user")}
            />
          </Field>

          <Field label={t("method")}>
            <Select
              value={filters.metodo}
              onChange={(event, data) => updateFilter("metodo", data.value || event.target.value)}
            >
              <option value="">{t("all")}</option>
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
            </Select>
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
              placeholder={t("searchAudit")}
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
          page={auditoriasPage.page}
          pageSize={auditoriasPage.pageSize}
          totalCount={auditoriasPage.totalCount}
          totalPages={auditoriasPage.totalPages}
          loading={busy}
          onPageChange={setPage}
          onPageSizeChange={(value) => {
            setPageSize(Number(value));
            setPage(1);
          }}
        />
        {loading ? (
          <div className={styles.loading}>
            <Spinner label={t("loadingAudit")} />
          </div>
        ) : (
          <div className={styles.menuTableSurface} style={themeStyles.surface}>
            {auditorias.length > 0 ? (
              <div className={styles.menuTableScroll}>
                <table
                  className={styles.menuTable}
                  aria-label={t("auditTitle")}
                  style={{ minWidth: "1080px", width: "100%" }}
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
                    {auditorias.map((auditoria) => (
                      <tr
                        key={auditoria.idAuditoria || auditoria.codAuditoria}
                        className={styles.menuRow}
                      >
                        {columns.map((column) => (
                          <td
                            key={column.key}
                            className={styles.menuCell}
                            style={getCellStyle(column)}
                          >
                            {column.render(auditoria)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <Text className={styles.empty}>{t("noAuditFound")}</Text>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

export default AuditoriaListPage;
