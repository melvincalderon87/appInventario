import { useMemo } from "react";
import { Button, Input, MessageBar, Spinner, Text, Title2 } from "@/components/ui/app-shadcn";
import { Search } from "lucide-react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { PaginationToolbar } from "../../components/common/PaginationToolbar";
import { useServerPagination } from "../../hooks/useServerPagination";
import { EntradasProductoService } from "../../services/entradasProductoService";
import {
  getMovimientoListThemeStyles,
  useMovimientoListStyles,
} from "../../styles/pages/movimiento/movimientoListPageStyles";
import { formatDateFilterByLanguage } from "../../utils/formatDateByLanguage";
import { emptyPagedResult } from "../../utils/pagination";

const COLUMNS = [
  "Código",
  "Fecha",
  "Suplidor",
  "Producto",
  "Unidad",
  "Cantidad estándar",
  "Cantidad ambiente",
];

function decimal(value, language) {
  return new Intl.NumberFormat(language || "es-GT", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(Number(value ?? 0));
}

function EntradasProductoListPage() {
  const styles = useMovimientoListStyles();
  const themeStyles = getMovimientoListThemeStyles();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const pagination = useServerPagination("fecha:desc", 50);
  const { page, pageSize, search, sort, params, setPage, setPageSize, setSearch } = pagination;
  const query = useQuery({
    queryKey: ["entradas-producto-listado", page, pageSize, search, sort],
    queryFn: () => EntradasProductoService.listado(params),
    placeholderData: keepPreviousData,
    staleTime: 0,
  });
  const result = query.data ?? emptyPagedResult;
  const entradas = useMemo(() => (Array.isArray(result.items) ? result.items : []), [result.items]);

  return (
    <section className={styles.root}>
      <div className={styles.header}>
        <div>
          <Title2 className={styles.title}>{t("productEntryListTitle")}</Title2>
          <Text className={styles.subtitle}>
            {t("productEntryListCount", { count: result.totalCount })}
          </Text>
        </div>
        <Button appearance="primary" onClick={() => navigate("/entradasproducto/agregar")}>
          {t("addProductEntry")}
        </Button>
      </div>
      {query.isError ? (
        <MessageBar intent="error">
          {query.error?.message || t("productEntryListLoadError")}
        </MessageBar>
      ) : null}
      <div className={styles.searchBar} style={themeStyles.surface}>
        <Input
          className={styles.searchInput}
          value={search}
          onChange={(_, data) => setSearch(data.value)}
          contentBefore={<Search />}
          placeholder={t("searchProductEntries")}
        />
      </div>
      <div className={styles.listSurface}>
        <PaginationToolbar
          page={result.page}
          pageSize={result.pageSize}
          totalCount={result.totalCount}
          totalPages={result.totalPages}
          loading={query.isFetching}
          showPageSize={false}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
        {query.isLoading ? (
          <div className={styles.loading}>
            <Spinner label={t("loadingProductEntries")} />
          </div>
        ) : entradas.length ? (
          <div className={styles.menuTableSurface} style={themeStyles.surface}>
            <div className={styles.menuTableScroll}>
              <table
                className={styles.menuTable}
                style={{ minWidth: "1100px" }}
                aria-label={t("productEntryListTitle")}
              >
                <thead>
                  <tr>
                    {COLUMNS.map((column) => (
                      <th key={column} className={styles.menuHeaderCell}>
                        <span className={styles.menuHeaderContent}>{column}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {entradas.map((entrada) => (
                    <tr
                      key={entrada.idEntradaProducto || entrada.codEntradaProducto}
                      className={styles.menuRow}
                    >
                      <td className={`${styles.menuCell} ${styles.menuCodeCell}`}>
                        {entrada.codEntradaProducto}
                      </td>
                      <td className={styles.menuCell}>
                        {formatDateFilterByLanguage(entrada.fecha, i18n.language)}
                      </td>
                      <td className={styles.menuCell}>
                        <span className={styles.tableCellExpanded}>{entrada.suplidor || "-"}</span>
                      </td>
                      <td className={styles.menuCell}>
                        <span className={styles.tableCellExpanded}>{entrada.producto || "-"}</span>
                      </td>
                      <td className={styles.menuCell}>{entrada.siglasUnidad || "-"}</td>
                      <td className={styles.menuCell}>
                        <span className={styles.tableCellNoWrap}>
                          {decimal(entrada.cantidadEstandar, i18n.language)}
                        </span>
                      </td>
                      <td className={styles.menuCell}>
                        <span className={styles.tableCellNoWrap}>
                          {decimal(entrada.cantidadAmbiente, i18n.language)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <Text className={styles.empty}>{t("noProductEntriesFound")}</Text>
        )}
      </div>
    </section>
  );
}

export default EntradasProductoListPage;
