import { useMemo } from "react";
import { Button, Input, MessageBar, Spinner, Text, Title2 } from "@/components/ui/app-shadcn";
import { Search } from "lucide-react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { PaginationToolbar } from "../../components/common/PaginationToolbar";
import { usePermisosPantalla } from "../../context/permisosPantallaContext";
import { useServerPagination } from "../../hooks/useServerPagination";
import { IngresoBarcoService } from "../../services/ingresoBarcoService";
import {
  getMovimientoListThemeStyles,
  useMovimientoListStyles,
} from "../../styles/pages/movimiento/movimientoListPageStyles";
import { formatDateFilterByLanguage } from "../../utils/formatDateByLanguage";
import { emptyPagedResult } from "../../utils/pagination";

const COLUMNAS = [
  "Código",
  "Fecha",
  "Código interno",
  "Barco",
  "Suplidor",
  "Producto",
  "Cantidad estándar",
  "Cantidad ambiente",
  "Acciones",
];

function decimal(value, language) {
  return new Intl.NumberFormat(language || "es-GT", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(Number(value ?? 0));
}

export default function BarcoIngresoBarcoListPage() {
  const styles = useMovimientoListStyles();
  const themeStyles = getMovimientoListThemeStyles();
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const { tienePermiso } = usePermisosPantalla();
  const pagination = useServerPagination("fecha:desc", 50);
  const { page, pageSize, search, sort, params, setPage, setPageSize, setSearch } = pagination;
  const query = useQuery({
    queryKey: ["ingresos-barco-listado", page, pageSize, search, sort],
    queryFn: () => IngresoBarcoService.listado(params),
    placeholderData: keepPreviousData,
    staleTime: 0,
  });
  const result = query.data ?? emptyPagedResult;
  const items = useMemo(() => (Array.isArray(result.items) ? result.items : []), [result.items]);

  return (
    <section className={styles.root}>
      <div className={styles.header}>
        <div>
          <Title2 className={styles.title}>Ingresos de Barco</Title2>
          <Text className={styles.subtitle}>{result.totalCount} registros</Text>
        </div>
        {tienePermiso("agregar") ? (
          <Button appearance="primary" onClick={() => navigate("/barco/ingresobarco/agregar")}>
            Agregar
          </Button>
        ) : null}
      </div>

      {query.isError ? (
        <MessageBar intent="error">
          {query.error?.message || "No fue posible obtener el listado de ingresos de barco."}
        </MessageBar>
      ) : null}

      <div className={styles.searchBar} style={themeStyles.surface}>
        <Input
          className={styles.searchInput}
          value={search}
          onChange={(_, data) => setSearch(data.value)}
          contentBefore={<Search />}
          placeholder="Buscar ingresos de barco"
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
            <Spinner label="Cargando ingresos de barco..." />
          </div>
        ) : items.length ? (
          <div className={styles.menuTableSurface} style={themeStyles.surface}>
            <div className={styles.menuTableScroll}>
              <table
                className={styles.menuTable}
                style={{ minWidth: "1350px" }}
                aria-label="Ingresos de Barco"
              >
                <thead>
                  <tr>
                    {COLUMNAS.map((columna) => (
                      <th key={columna} className={styles.menuHeaderCell}>
                        <span className={styles.menuHeaderContent}>{columna}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={`${item.codIngresoBarco}-${item.linea}`} className={styles.menuRow}>
                      <td className={`${styles.menuCell} ${styles.menuCodeCell}`}>
                        {item.codIngresoBarco}
                      </td>
                      <td className={styles.menuCell}>
                        {formatDateFilterByLanguage(item.fechaIngreso, i18n.language)}
                      </td>
                      <td className={styles.menuCell}>{item.codigoInterno || "-"}</td>
                      <td className={styles.menuCell}>
                        <span className={styles.tableCellExpanded}>{item.barco || "-"}</span>
                      </td>
                      <td className={styles.menuCell}>
                        <span className={styles.tableCellExpanded}>{item.suplidor || "-"}</span>
                      </td>
                      <td className={styles.menuCell}>
                        <span className={styles.tableCellExpanded}>{item.producto || "-"}</span>
                      </td>
                      <td className={styles.menuCell}>
                        <span className={styles.tableCellNoWrap}>
                          {decimal(item.cantidadEstandar, i18n.language)}
                        </span>
                      </td>
                      <td className={styles.menuCell}>
                        <span className={styles.tableCellNoWrap}>
                          {decimal(item.cantidadAmbiente, i18n.language)}
                        </span>
                      </td>
                      <td className={styles.menuCell}>
                        {tienePermiso("editar") ? (
                          <Button
                            size="small"
                            appearance="secondary"
                            onClick={() =>
                              navigate(`/barco/ingresobarco/editar/${item.codIngresoBarco}`)
                            }
                          >
                            Editar
                          </Button>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <Text className={styles.empty}>No hay ingresos de barco.</Text>
        )}
      </div>
    </section>
  );
}
