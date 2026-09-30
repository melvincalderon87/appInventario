import { useMemo } from "react";
import { Button, Input, MessageBar, Spinner, Text, Title2 } from "@/components/ui/app-shadcn";
import { Search } from "lucide-react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import { PaginationToolbar } from "../../components/common/PaginationToolbar";
import { useServerPagination } from "../../hooks/useServerPagination";
import { EntradasProductoService } from "../../services/entradasProductoService";
import { SalidasService } from "../../services/salidasService";
import {
  getMovimientoListThemeStyles,
  useMovimientoListStyles,
} from "../../styles/pages/movimiento/movimientoListPageStyles";
import { formatDateFilterByLanguage } from "../../utils/formatDateByLanguage";
import { emptyPagedResult } from "../../utils/pagination";

const configuraciones = {
  "/ajustes/entrada/listar": {
    titulo: "Ajustes de Entrada",
    agregar: "/ajustes/entrada",
    unidad: false,
    listar: (params) => EntradasProductoService.listadoAjustes(params),
  },
  "/ajustes/salida/listar": {
    titulo: "Ajustes de Salida",
    agregar: "/ajustes/salida",
    unidad: false,
    listar: (params) => SalidasService.listadoAjustes(params),
  },
  "/unidad/entrada/listar": {
    titulo: "Entradas por Unidad",
    agregar: "/unidad/entrada",
    unidad: true,
    listar: (params) => EntradasProductoService.listadoUnidad(params),
  },
  "/unidad/salida/listar": {
    titulo: "Salidas por Unidad",
    agregar: "/unidad/salida",
    unidad: true,
    listar: (params) => SalidasService.listadoUnidad(params),
  },
};

function decimal(value, language) {
  return new Intl.NumberFormat(language || "es-GT", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(Number(value ?? 0));
}

export default function MovimientoCombustibleListPage() {
  const styles = useMovimientoListStyles();
  const themeStyles = getMovimientoListThemeStyles();
  const { i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const configuracion =
    configuraciones[location.pathname] ?? configuraciones["/ajustes/entrada/listar"];
  const pagination = useServerPagination("fecha:desc", 50);
  const { page, pageSize, search, sort, params, setPage, setPageSize, setSearch } = pagination;
  const query = useQuery({
    queryKey: ["movimiento-combustible", location.pathname, page, pageSize, search, sort],
    queryFn: () => configuracion.listar(params),
    placeholderData: keepPreviousData,
    staleTime: 0,
  });
  const result = query.data ?? emptyPagedResult;
  const items = useMemo(() => (Array.isArray(result.items) ? result.items : []), [result.items]);
  const columnas = [
    "Código",
    "Fecha",
    "Suplidor",
    "Producto",
    ...(configuracion.unidad ? ["Unidad"] : []),
    "Cantidad estándar",
    "Cantidad ambiente",
  ];

  return (
    <section className={styles.root}>
      <div className={styles.header}>
        <div>
          <Title2 className={styles.title}>{configuracion.titulo}</Title2>
          <Text className={styles.subtitle}>{result.totalCount} registros</Text>
        </div>
        <Button appearance="primary" onClick={() => navigate(configuracion.agregar)}>
          Agregar
        </Button>
      </div>
      {query.isError ? (
        <MessageBar intent="error">
          {query.error?.message || "No fue posible obtener el listado."}
        </MessageBar>
      ) : null}
      <div className={styles.searchBar} style={themeStyles.surface}>
        <Input
          className={styles.searchInput}
          value={search}
          onChange={(_, data) => setSearch(data.value)}
          contentBefore={<Search />}
          placeholder={`Buscar en ${configuracion.titulo.toLowerCase()}`}
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
            <Spinner label="Cargando registros..." />
          </div>
        ) : items.length ? (
          <div className={styles.menuTableSurface} style={themeStyles.surface}>
            <div className={styles.menuTableScroll}>
              <table
                className={styles.menuTable}
                style={{ minWidth: configuracion.unidad ? "1100px" : "1000px" }}
              >
                <thead>
                  <tr>
                    {columnas.map((columna) => (
                      <th key={columna} className={styles.menuHeaderCell}>
                        <span className={styles.menuHeaderContent}>{columna}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.codigo} className={styles.menuRow}>
                      <td className={`${styles.menuCell} ${styles.menuCodeCell}`}>{item.codigo}</td>
                      <td className={styles.menuCell}>
                        {formatDateFilterByLanguage(item.fecha, i18n.language)}
                      </td>
                      <td className={styles.menuCell}>
                        <span className={styles.tableCellExpanded}>{item.suplidor || "-"}</span>
                      </td>
                      <td className={styles.menuCell}>
                        <span className={styles.tableCellExpanded}>{item.producto || "-"}</span>
                      </td>
                      {configuracion.unidad ? (
                        <td className={styles.menuCell}>{item.siglasUnidad || "-"}</td>
                      ) : null}
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <Text className={styles.empty}>No hay registros.</Text>
        )}
      </div>
    </section>
  );
}
