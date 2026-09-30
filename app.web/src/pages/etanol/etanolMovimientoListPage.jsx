import { useMemo } from "react";
import { Button, Input, MessageBar, Spinner, Text, Title2 } from "@/components/ui/app-shadcn";
import { Search } from "lucide-react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router-dom";
import { PaginationToolbar } from "../../components/common/PaginationToolbar";
import { useServerPagination } from "../../hooks/useServerPagination";
import { EtanolMovimientoService } from "../../services/etanolMovimientoService";
import {
  getMovimientoListThemeStyles,
  useMovimientoListStyles,
} from "../../styles/pages/movimiento/movimientoListPageStyles";
import { emptyPagedResult } from "../../utils/pagination";

const MODULOS = {
  entradas: ["entrada", "Entrada de Etanol"],
  salidas: ["salida", "Salida de Etanol"],
  compraventasuplidores: ["compraventa", "Compra Venta Suplidores de Etanol"],
  ingresotuberias: ["tuberias", "Ingreso por Tuberías de Etanol"],
  "unidad-entrada": ["unidad-entrada", "Entrada por Unidad de Etanol"],
  "unidad-salida": ["unidad-salida", "Salida por Unidad de Etanol"],
  "ajuste-entrada": ["ajuste-entrada", "Ajuste de Entrada de Etanol"],
  "ajuste-salida": ["ajuste-salida", "Ajuste de Salida de Etanol"],
};
const etanolModuloDesdeRuta = (pathname) => {
  const segmento = pathname.split("/")[2] || "entradas";
  const [tipo, titulo] = MODULOS[segmento] || MODULOS.entradas;
  return { segmento, tipo, titulo };
};
const decimal = (v) =>
  new Intl.NumberFormat("es-GT", { minimumFractionDigits: 2, maximumFractionDigits: 4 }).format(
    Number(v || 0)
  );

export default function EtanolMovimientoListPage() {
  const styles = useMovimientoListStyles();
  const themeStyles = getMovimientoListThemeStyles();
  const location = useLocation();
  const navigate = useNavigate();
  const modulo = etanolModuloDesdeRuta(location.pathname);
  const pagination = useServerPagination("fecha:desc", 50);
  const { page, pageSize, search, sort, params, setPage, setPageSize, setSearch } = pagination;
  const query = useQuery({
    queryKey: ["etanol", modulo.tipo, page, pageSize, search, sort],
    queryFn: () => EtanolMovimientoService.listado(modulo.tipo, params),
    placeholderData: keepPreviousData,
  });
  const result = query.data ?? emptyPagedResult;
  const items = useMemo(() => (Array.isArray(result.items) ? result.items : []), [result.items]);
  return (
    <section className={styles.root}>
      <div className={styles.header}>
        <div>
          <Title2 className={styles.title}>{modulo.titulo}</Title2>
          <Text className={styles.subtitle}>{result.totalCount} registros</Text>
        </div>
        <Button appearance="primary" onClick={() => navigate(`/etanol/${modulo.segmento}/agregar`)}>
          Agregar
        </Button>
      </div>
      {query.isError ? <MessageBar intent="error">{query.error?.message}</MessageBar> : null}
      <div className={styles.searchBar} style={themeStyles.surface}>
        <Input
          className={styles.searchInput}
          value={search}
          onChange={(_, d) => setSearch(d.value)}
          contentBefore={<Search />}
          placeholder="Buscar"
        />
      </div>
      <div className={styles.listSurface}>
        <PaginationToolbar
          page={result.page}
          pageSize={result.pageSize}
          totalCount={result.totalCount}
          totalPages={result.totalPages}
          loading={query.isFetching}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
        {query.isLoading ? (
          <div className={styles.loading}>
            <Spinner />
          </div>
        ) : (
          <div className={styles.menuTableSurface} style={themeStyles.surface}>
            <div className={styles.menuTableScroll}>
              <table className={styles.menuTable}>
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Fecha</th>
                    <th>Suplidor</th>
                    <th>Producto</th>
                    <th>Unidad</th>
                    <th>Estándar</th>
                    <th>Ambiente</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length ? (
                    items.map((x) => (
                      <tr key={x.codigo}>
                        <td>{x.codigo}</td>
                        <td>{x.fecha?.slice(0, 10)}</td>
                        <td>
                          {x.codSuplidor || `${x.codSuplidorOrigen} → ${x.codSuplidorDestino}`}
                        </td>
                        <td>{x.codProducto}</td>
                        <td>{x.siglasUnidad || "-"}</td>
                        <td>{decimal(x.cantidadEstandar)}</td>
                        <td>{decimal(x.cantidadAmbiente)}</td>
                        <td>
                          <Button
                            size="small"
                            onClick={() =>
                              navigate(`/etanol/${modulo.segmento}/editar/${x.codigo}`)
                            }
                          >
                            Editar
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8">No hay registros.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
