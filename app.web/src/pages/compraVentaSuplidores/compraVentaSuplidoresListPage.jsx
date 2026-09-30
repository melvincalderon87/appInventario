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
import { CompraVentaSuplidoresService } from "../../services/compraVentaSuplidoresService";
import {
  getCompraVentaSuplidoresThemeStyles,
  useCompraVentaSuplidoresStyles,
} from "../../styles/pages/compraVentaSuplidores/compraVentaSuplidoresPageStyles";
import { formatDateFilterByLanguage } from "../../utils/formatDateByLanguage";
import { emptyPagedResult } from "../../utils/pagination";

const COLUMNS = [
  { key: "codigo", width: 92 },
  { key: "fecha", width: 120 },
  { key: "origen", width: 210 },
  { key: "destino", width: 210 },
  { key: "producto", width: 210 },
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

function CompraVentaSuplidoresListPage() {
  const styles = useCompraVentaSuplidoresStyles();
  const themeStyles = getCompraVentaSuplidoresThemeStyles();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { tienePermiso } = usePermisosPantalla();
  const pagination = useServerPagination("fecha:desc", 50);
  const { page, pageSize, search, sort, params, setPage, setPageSize, setSearch } = pagination;

  const trasladosQuery = useQuery({
    queryKey: ["compraventasuplidores-listado", page, pageSize, search, sort],
    queryFn: () => CompraVentaSuplidoresService.listado(params),
    placeholderData: keepPreviousData,
    staleTime: 0,
  });
  const trasladosPage = trasladosQuery.data ?? emptyPagedResult;
  const traslados = useMemo(
    () => (Array.isArray(trasladosPage.items) ? trasladosPage.items : []),
    [trasladosPage.items]
  );
  const loading = trasladosQuery.isLoading;
  const busy = trasladosQuery.isFetching;
  const error = trasladosQuery.isError
    ? trasladosQuery.error?.message || t("productTransferListLoadError")
    : "";

  const goTo = (route, traslado) => {
    navigate(`${route}/${encodeURIComponent(traslado.idCompraVentaSuplidores)}`);
  };

  return (
    <section className={styles.root}>
      <div className={styles.header}>
        <div>
          <Title2 className={styles.title}>{t("productTransferListTitle")}</Title2>
          <Text className={styles.subtitle}>
            {t("productTransferListCount", { count: trasladosPage.totalCount })}
          </Text>
        </div>
        {tienePermiso("agregar") ? (
          <ListActionButton
            action="agregar"
            label={t("add")}
            text={t("add")}
            onClick={() => navigate("/compraventasuplidores/agregar")}
          />
        ) : null}
      </div>

      {error ? <MessageBar intent="error">{error}</MessageBar> : null}

      <div className={styles.searchBar} style={themeStyles.surface}>
        <Input
          className={styles.searchInput}
          value={search}
          onChange={(_, data) => setSearch(data.value)}
          contentBefore={<Search />}
          placeholder={t("searchProductTransfers")}
          aria-label={t("searchProductTransfers")}
        />
      </div>

      <div className={styles.listSurface}>
        <PaginationToolbar
          page={trasladosPage.page}
          pageSize={trasladosPage.pageSize}
          totalCount={trasladosPage.totalCount}
          totalPages={trasladosPage.totalPages}
          loading={busy}
          showPageSize={false}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
        {loading ? (
          <div className={styles.loading}>
            <Spinner label={t("loadingProductTransfers")} />
          </div>
        ) : traslados.length > 0 ? (
          <div className={styles.menuTableSurface} style={themeStyles.surface}>
            <div className={styles.menuTableScroll}>
              <table
                className={styles.menuTable}
                style={{ minWidth: "1402px" }}
                aria-label={t("productTransferListTitle")}
              >
                <colgroup>
                  {COLUMNS.map((column) => (
                    <col key={column.key} style={{ width: `${column.width}px` }} />
                  ))}
                </colgroup>
                <thead>
                  <tr>
                    <th className={`${styles.menuHeaderCell} ${styles.menuCodeCell}`}>
                      <span className={styles.menuHeaderContent}>{t("productTransferCode")}</span>
                    </th>
                    <th className={styles.menuHeaderCell}>
                      <span className={styles.menuHeaderContent}>{t("productTransferDate")}</span>
                    </th>
                    <th className={styles.menuHeaderCell}>
                      <span className={styles.menuHeaderContent}>
                        {t("productTransferSourcePartner")}
                      </span>
                    </th>
                    <th className={styles.menuHeaderCell}>
                      <span className={styles.menuHeaderContent}>
                        {t("productTransferTargetPartner")}
                      </span>
                    </th>
                    <th className={styles.menuHeaderCell}>
                      <span className={styles.menuHeaderContent}>
                        {t("productTransferProduct")}
                      </span>
                    </th>
                    <th className={styles.menuHeaderCell}>
                      <span className={styles.menuHeaderContent}>
                        {t("productTransferStandardQuantity")}
                      </span>
                    </th>
                    <th className={styles.menuHeaderCell}>
                      <span className={styles.menuHeaderContent}>
                        {t("productTransferAmbientQuantity")}
                      </span>
                    </th>
                    <th className={styles.menuHeaderCell}>
                      <span className={styles.menuHeaderContent}>{t("productTransferStatus")}</span>
                    </th>
                    <th className={`${styles.menuHeaderCell} ${styles.menuActionsCell}`}>
                      <span className={styles.menuHeaderContent}>{t("actions")}</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {traslados.map((traslado) => (
                    <tr
                      key={traslado.idCompraVentaSuplidores || traslado.codCompraVentaSuplidores}
                      className={styles.menuRow}
                    >
                      <td className={`${styles.menuCell} ${styles.menuCodeCell}`}>
                        {traslado.codCompraVentaSuplidores}
                      </td>
                      <td className={styles.menuCell}>
                        {formatDateFilterByLanguage(traslado.fecha, i18n.language)}
                      </td>
                      <td className={styles.menuCell}>
                        <span className={styles.tableCellExpanded}>
                          {traslado.suplidorOrigen || "-"}
                        </span>
                      </td>
                      <td className={styles.menuCell}>
                        <span className={styles.tableCellExpanded}>
                          {traslado.suplidorDestino || "-"}
                        </span>
                      </td>
                      <td className={styles.menuCell}>
                        <span className={styles.tableCellExpanded}>{traslado.producto || "-"}</span>
                      </td>
                      <td className={styles.menuCell}>
                        <span className={styles.tableCellNoWrap}>
                          {formatDecimal(traslado.cantidadEstandar, i18n.language)}
                        </span>
                      </td>
                      <td className={styles.menuCell}>
                        <span className={styles.tableCellNoWrap}>
                          {formatDecimal(traslado.cantidadAmbiente, i18n.language)}
                        </span>
                      </td>
                      <td className={styles.menuCell}>
                        {t(traslado.estatus !== false ? "active" : "inactive")}
                      </td>
                      <td className={`${styles.menuCell} ${styles.menuActionsCell}`}>
                        <div className={styles.actionCell}>
                          <div className={styles.tableActions}>
                            {tienePermiso("editar") ? (
                              <ListActionButton
                                action="editar"
                                label={t("edit")}
                                onClick={() => goTo("/compraventasuplidores/editar", traslado)}
                              />
                            ) : null}
                            {tienePermiso("eliminar") ? (
                              <ListActionButton
                                action="eliminar"
                                label={t("delete")}
                                onClick={() => goTo("/compraventasuplidores/eliminar", traslado)}
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
          <Text className={styles.empty}>{t("noProductTransfersFound")}</Text>
        )}
      </div>
    </section>
  );
}

export default CompraVentaSuplidoresListPage;
