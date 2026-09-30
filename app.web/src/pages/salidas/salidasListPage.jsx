import { useMemo } from "react";
import { Input, MessageBar, Spinner, Text, Title2 } from "@/components/ui/app-shadcn";
import { Search } from "lucide-react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { ListActionButton } from "../../components/common/ListActionButton";
import { PaginationToolbar } from "../../components/common/PaginationToolbar";
import { usePermisosPantalla } from "../../context/permisosPantallaContext";
import { useServerPagination } from "../../hooks/useServerPagination";
import { SalidasService } from "../../services/salidasService";
import {
  getSalidasThemeStyles,
  useSalidasStyles,
} from "../../styles/pages/salidas/salidasPageStyles";
import { formatDateFilterByLanguage } from "../../utils/formatDateByLanguage";
import { emptyPagedResult } from "../../utils/pagination";

const COLUMNS = [
  { key: "codigo", width: 92 },
  { key: "fecha", width: 120 },
  { key: "suplidor", width: 230 },
  { key: "producto", width: 220 },
  { key: "unidad", width: 100 },
  { key: "estandar", width: 150 },
  { key: "ambiente", width: 150 },
  { key: "estatus", width: 110 },
  { key: "acciones", width: 150 },
];

function formatDecimal(value, language) {
  const numericValue = Number(value ?? 0);
  return new Intl.NumberFormat(language || "es-GT", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(Number.isFinite(numericValue) ? numericValue : 0);
}

function SalidasListPage() {
  const styles = useSalidasStyles();
  const themeStyles = getSalidasThemeStyles();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { tienePermiso } = usePermisosPantalla();
  const pagination = useServerPagination("fecha:desc", 50);
  const { page, pageSize, search, sort, params, setPage, setPageSize, setSearch } = pagination;

  const salidasQuery = useQuery({
    queryKey: ["salidas-listado", page, pageSize, search, sort],
    queryFn: () => SalidasService.listado(params),
    placeholderData: keepPreviousData,
    staleTime: 0,
  });
  const salidasPage = salidasQuery.data ?? emptyPagedResult;
  const salidas = useMemo(
    () => (Array.isArray(salidasPage.items) ? salidasPage.items : []),
    [salidasPage.items]
  );
  const loading = salidasQuery.isLoading;
  const busy = salidasQuery.isFetching;
  const error = salidasQuery.isError ? salidasQuery.error?.message || t("exitListLoadError") : "";

  const goTo = (route, salida) => {
    navigate(`${route}/${encodeURIComponent(salida.idSalida)}`);
  };

  return (
    <section className={styles.root}>
      <div className={styles.header}>
        <div>
          <Title2 className={styles.title}>{t("exitListTitle")}</Title2>
          <Text className={styles.subtitle}>
            {t("exitListCount", { count: salidasPage.totalCount })}
          </Text>
        </div>
        {tienePermiso("agregar") ? (
          <div style={{ display: "flex", gap: "8px" }}>
            <ListActionButton
              action="agregar"
              label={t("add")}
              text={t("add")}
              onClick={() => navigate("/salidas/agregar")}
            />
          </div>
        ) : null}
      </div>

      {error ? <MessageBar intent="error">{error}</MessageBar> : null}

      <div className={styles.searchBar} style={themeStyles.surface}>
        <Input
          className={styles.searchInput}
          value={search}
          onChange={(_, data) => setSearch(data.value)}
          contentBefore={<Search />}
          placeholder={t("searchExits")}
          aria-label={t("searchExits")}
        />
      </div>

      <div className={styles.listSurface}>
        <PaginationToolbar
          page={salidasPage.page}
          pageSize={salidasPage.pageSize}
          totalCount={salidasPage.totalCount}
          totalPages={salidasPage.totalPages}
          loading={busy}
          showPageSize={false}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
        {loading ? (
          <div className={styles.loading}>
            <Spinner label={t("loadingExits")} />
          </div>
        ) : salidas.length > 0 ? (
          <div className={styles.menuTableSurface} style={themeStyles.surface}>
            <div className={styles.menuTableScroll}>
              <table
                className={styles.menuTable}
                style={{ minWidth: "1322px" }}
                aria-label={t("exitListTitle")}
              >
                <colgroup>
                  {COLUMNS.map((column) => (
                    <col key={column.key} style={{ width: `${column.width}px` }} />
                  ))}
                </colgroup>
                <thead>
                  <tr>
                    <th className={`${styles.menuHeaderCell} ${styles.menuCodeCell}`}>
                      <span className={styles.menuHeaderContent}>{t("exitCode")}</span>
                    </th>
                    <th className={styles.menuHeaderCell}>
                      <span className={styles.menuHeaderContent}>{t("exitDate")}</span>
                    </th>
                    <th className={styles.menuHeaderCell}>
                      <span className={styles.menuHeaderContent}>{t("exitPartner")}</span>
                    </th>
                    <th className={styles.menuHeaderCell}>
                      <span className={styles.menuHeaderContent}>{t("exitProduct")}</span>
                    </th>
                    <th className={styles.menuHeaderCell}>
                      <span className={styles.menuHeaderContent}>Unidad</span>
                    </th>
                    <th className={styles.menuHeaderCell}>
                      <span className={styles.menuHeaderContent}>{t("exitStandardQuantity")}</span>
                    </th>
                    <th className={styles.menuHeaderCell}>
                      <span className={styles.menuHeaderContent}>{t("exitAmbientQuantity")}</span>
                    </th>
                    <th className={styles.menuHeaderCell}>
                      <span className={styles.menuHeaderContent}>{t("exitStatus")}</span>
                    </th>
                    <th className={`${styles.menuHeaderCell} ${styles.menuActionsCell}`}>
                      <span className={styles.menuHeaderContent}>{t("actions")}</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {salidas.map((salida) => (
                    <tr key={salida.idSalida || salida.codSalida} className={styles.menuRow}>
                      <td className={`${styles.menuCell} ${styles.menuCodeCell}`}>
                        {salida.codSalida}
                      </td>
                      <td className={styles.menuCell}>
                        {formatDateFilterByLanguage(salida.fecha, i18n.language)}
                      </td>
                      <td className={styles.menuCell}>
                        <span className={styles.tableCellExpanded}>{salida.suplidor || "-"}</span>
                      </td>
                      <td className={styles.menuCell}>
                        <span className={styles.tableCellExpanded}>{salida.producto || "-"}</span>
                      </td>
                      <td className={styles.menuCell}>{salida.siglasUnidad || "-"}</td>
                      <td className={styles.menuCell}>
                        <span className={styles.tableCellNoWrap}>
                          {formatDecimal(salida.cantidadEstandar, i18n.language)}
                        </span>
                      </td>
                      <td className={styles.menuCell}>
                        <span className={styles.tableCellNoWrap}>
                          {formatDecimal(salida.cantidadAmbiente, i18n.language)}
                        </span>
                      </td>
                      <td className={styles.menuCell}>
                        {t(salida.estatus !== false ? "active" : "inactive")}
                      </td>
                      <td className={`${styles.menuCell} ${styles.menuActionsCell}`}>
                        <div className={styles.actionCell}>
                          <div className={styles.tableActions}>
                            {tienePermiso("editar") ? (
                              <ListActionButton
                                action="editar"
                                label={t("edit")}
                                onClick={() => goTo("/salidas/editar", salida)}
                              />
                            ) : null}
                            {tienePermiso("eliminar") ? (
                              <ListActionButton
                                action="eliminar"
                                label={t("delete")}
                                onClick={() => goTo("/salidas/eliminar", salida)}
                              />
                            ) : null}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <Text className={styles.empty}>{t("noExitsFound")}</Text>
        )}
      </div>
    </section>
  );
}

export default SalidasListPage;
