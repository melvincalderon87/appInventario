import { useEffect, useState } from "react";
import {
  Combobox,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  Field,
  Input,
  MessageBar,
  Option,
  Spinner,
  Text,
  Title2,
} from "@/components/ui/app-shadcn";
import { Search } from "lucide-react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { ListActionButton } from "../../components/common/ListActionButton";
import { PaginationToolbar } from "../../components/common/PaginationToolbar";
import { useServerPagination } from "../../hooks/useServerPagination";
import { VentaService } from "../../services/ventaService";
import { SuplidorService } from "../../services/suplidorService";
import { descargarPlantillaVentas } from "../../utils/ventaExcel";
import { usePermisosPantalla } from "../../context/permisosPantallaContext";
import { useAppShell } from "../../context/appShellContext";
import { getMenuThemeStyles, useMenuStyles } from "../../styles/pages/menu/menuPageStyles";
import { emptyPagedResult } from "../../utils/pagination";
const currentMonth = () => new Date().toISOString().slice(0, 7);

function VentaListPage() {
  const st = useMenuStyles();
  const theme = getMenuThemeStyles();
  const nav = useNavigate();
  const { tienePermiso } = usePermisosPantalla();
  const { locale } = useAppShell();
  const [suplidores, setSuplidores] = useState([]);
  const [error, setError] = useState("");
  const [plantillaAbierta, setPlantillaAbierta] = useState(false);
  const [codSuplidor, setCodSuplidor] = useState("");
  const [periodo, setPeriodo] = useState(currentMonth());
  const [documento, setDocumento] = useState(null);
  const [documentoAbierto, setDocumentoAbierto] = useState(false);
  const [cargandoDocumento, setCargandoDocumento] = useState(false);

  const pagination = useServerPagination("periodo:desc", 50);
  const { page, pageSize, search, sort, params, setPage, setPageSize, setSearch } = pagination;
  const ventasQuery = useQuery({
    queryKey: ["ventas-listado", page, pageSize, search, sort],
    queryFn: () => VentaService.listado(params),
    placeholderData: keepPreviousData,
  });
  const ventas = ventasQuery.data ?? emptyPagedResult;
  const rows = Array.isArray(ventas.items) ? ventas.items : [];

  useEffect(() => {
    SuplidorService.ListarOpcion()
      .then(setSuplidores)
      .catch((e) => setError(e.message));
  }, []);

  const textoSeleccionado = (items, codigo) =>
    items.find((item) => String(item.value) === String(codigo))?.text ?? "";
  const [anio, mes] = periodo.split("-");
  const meses = Array.from({ length: 12 }, (_, index) => {
    const value = String(index + 1).padStart(2, "0");
    return {
      value,
      text: new Intl.DateTimeFormat(locale, { month: "long" }).format(new Date(2026, index, 1)),
    };
  });
  const cambiarMes = (value) => setPeriodo(`${anio}-${value}`);
  const cambiarAnio = (_, data) => {
    const value = String(data.value ?? "")
      .replace(/\D/g, "")
      .slice(0, 4);
    if (value.length === 4) setPeriodo(`${value}-${mes}`);
  };
  const descargar = async () => {
    if (!codSuplidor || !periodo)
      return setError("Seleccione suplidor y mes para descargar la plantilla.");
    try {
      setError("");
      await descargarPlantillaVentas({
        codSuplidor,
        suplidor: textoSeleccionado(suplidores, codSuplidor),
        periodo,
      });
      setPlantillaAbierta(false);
    } catch (e) {
      setError(e.message || "No fue posible descargar la plantilla.");
    }
  };
  const abrirDocumento = async (venta) => {
    try {
      setCargandoDocumento(true);
      setError("");
      setDocumentoAbierto(true);
      setDocumento(await VentaService.obtener(venta.idVenta));
    } catch (e) {
      setDocumentoAbierto(false);
      setError(e.message || "No fue posible obtener el documento de venta.");
    } finally {
      setCargandoDocumento(false);
    }
  };
  const cerrarDocumento = () => {
    setDocumentoAbierto(false);
    setDocumento(null);
  };
  const cantidad = (valor) =>
    Number(valor || 0).toLocaleString(locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  const totalAmbiente =
    documento?.detalles?.reduce(
      (total, detalle) => total + Number(detalle.cantidadAmbiente || 0),
      0
    ) ?? 0;

  return (
    <section className={st.root}>
      <div className={st.header}>
        <div>
          <Title2 className={st.title}>Ventas</Title2>
          <Text className={st.subtitle}>
            Plantillas y documentos de ventas mensuales por suplidor.
          </Text>
        </div>
        <div className={st.modificationSearchActions}>
          <ListActionButton
            action="descargar"
            label="Descargar plantilla"
            text="Plantilla"
            onClick={() => setPlantillaAbierta(true)}
          />
          {tienePermiso("agregar") && (
            <>
              <ListActionButton
                action="cargar"
                label="Cargar plantilla"
                text="Cargar plantilla"
                onClick={() => nav("/ventas/cargar-plantilla")}
              />
              <ListActionButton
                action="agregar"
                label="Agregar manualmente"
                text="Agregar manual"
                onClick={() => nav("/ventas/agregar")}
              />
            </>
          )}
        </div>
      </div>
      {error && <MessageBar intent="error">{error}</MessageBar>}
      {ventasQuery.isError && <MessageBar intent="error">{ventasQuery.error?.message}</MessageBar>}
      <div className={st.searchBar} style={theme.surface}>
        <Input
          className={st.searchInput}
          value={search}
          onChange={(_, data) => setSearch(data.value)}
          contentBefore={<Search />}
          placeholder="Buscar por suplidor, producto o periodo"
        />
      </div>
      <div className={st.listSurface}>
        <PaginationToolbar
          page={ventas.page}
          pageSize={ventas.pageSize}
          totalCount={ventas.totalCount}
          totalPages={ventas.totalPages}
          loading={ventasQuery.isFetching}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
        {ventasQuery.isLoading ? (
          <div className={st.loading}>
            <Spinner label="Cargando ventas..." />
          </div>
        ) : rows.length ? (
          <div className={st.menuTableSurface} style={theme.surface}>
            <div className={st.menuTableScroll}>
              <table className={st.menuTable}>
                <thead>
                  <tr>
                    <th className={st.menuHeaderCell}>
                      <span className={st.menuHeaderContent}>Suplidor</span>
                    </th>
                    <th className={st.menuHeaderCell}>
                      <span className={st.menuHeaderContent}>Producto</span>
                    </th>
                    <th className={st.menuHeaderCell}>
                      <span className={st.menuHeaderContent}>Mes</span>
                    </th>
                    <th className={st.menuHeaderCell}>
                      <span className={st.menuHeaderContent}>Total estándar</span>
                    </th>
                    {tienePermiso("visualizar") && (
                      <th
                        className={st.menuHeaderCell}
                        style={{ width: "100px", textAlign: "center" }}
                      >
                        Acciones
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.idVenta} className={st.menuRow}>
                      <td className={st.menuCell}>{r.suplidor}</td>
                      <td className={st.menuCell}>{r.producto}</td>
                      <td className={st.menuCell}>
                        {new Date(r.periodo).toLocaleDateString(locale, {
                          month: "long",
                          year: "numeric",
                        })}
                      </td>
                      <td className={st.menuCell}>{cantidad(r.total)}</td>
                      {tienePermiso("visualizar") && (
                        <td className={`${st.menuCell} ${st.menuActionsCell}`}>
                          <ListActionButton
                            action="visualizar"
                            label="Ver documento"
                            onClick={() => abrirDocumento(r)}
                          />
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <Text className={st.empty}>No ha cargado ventas.</Text>
        )}
      </div>
      <Dialog open={plantillaAbierta} onOpenChange={(_, data) => setPlantillaAbierta(data.open)}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Plantilla de ventas</DialogTitle>
            <DialogContent>
              <div className={st.formGrid}>
                <Field label="Mes" required>
                  <Combobox
                    selectedOptions={[mes]}
                    value={meses.find((item) => item.value === mes)?.text ?? ""}
                    onOptionSelect={(_, data) => cambiarMes(data.optionValue ?? mes)}
                  >
                    {meses.map((item) => (
                      <Option key={item.value} value={item.value} text={item.text}>
                        {item.text}
                      </Option>
                    ))}
                  </Combobox>
                </Field>
                <Field label="Año" required>
                  <Input inputMode="numeric" value={anio} onChange={cambiarAnio} />
                </Field>
                <Field label="Suplidor" required>
                  <Combobox
                    selectedOptions={codSuplidor ? [codSuplidor] : []}
                    value={textoSeleccionado(suplidores, codSuplidor)}
                    placeholder="Seleccione"
                    onOptionSelect={(_, data) => setCodSuplidor(data.optionValue ?? "")}
                  >
                    {suplidores.map((item) => (
                      <Option key={item.value} value={item.value} text={item.text}>
                        {item.text}
                      </Option>
                    ))}
                  </Combobox>
                </Field>
              </div>
              <Text className={st.subtitle}>
                Incluye Super, Regular, Diesel y Etanol, con cantidades estándar y ambiente para
                cada día.
              </Text>
            </DialogContent>
            <DialogActions>
              <ListActionButton
                action="regresar"
                label="Cancelar"
                text="Cancelar"
                onClick={() => setPlantillaAbierta(false)}
              />
              <ListActionButton
                action="descargar"
                label="Descargar plantilla"
                text="Descargar"
                onClick={descargar}
              />
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
      <Dialog open={documentoAbierto} onOpenChange={(_, data) => !data.open && cerrarDocumento()}>
        <DialogSurface
          style={{ width: "min(900px, calc(100vw - 32px))", maxHeight: "calc(100vh - 32px)" }}
        >
          <DialogBody>
            <DialogTitle>Documento de venta</DialogTitle>
            <DialogContent>
              {cargandoDocumento ? (
                <div className={st.loading}>
                  <Spinner label="Cargando documento..." />
                </div>
              ) : (
                documento && (
                  <section className="venta-print-report">
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: "16px",
                        borderBottom: "1px solid var(--app-card-border)",
                        paddingBottom: "12px",
                        marginBottom: "16px",
                      }}
                    >
                      <div>
                        <Title2>Documento de venta</Title2>
                        <Text className={st.subtitle}>Detalle de cantidades registradas</Text>
                      </div>
                      <Text>#{documento.codVenta}</Text>
                    </div>
                    <div className={st.formGrid} style={{ marginBottom: "16px" }}>
                      <Field label="Suplidor">
                        <Input value={documento.suplidor} readOnly />
                      </Field>
                      <Field label="Producto">
                        <Input value={documento.producto} readOnly />
                      </Field>
                      <Field label="Periodo">
                        <Input
                          value={new Date(documento.periodo).toLocaleDateString(locale, {
                            month: "long",
                            year: "numeric",
                          })}
                          readOnly
                        />
                      </Field>
                    </div>
                    <div className={st.menuTableSurface} style={theme.surface}>
                      <div className={st.menuTableScroll}>
                        <table className={st.menuTable} style={{ minWidth: "600px" }}>
                          <thead>
                            <tr>
                              <th className={st.menuHeaderCell}>
                                <span className={st.menuHeaderContent}>Día</span>
                              </th>
                              <th className={st.menuHeaderCell}>
                                <span className={st.menuHeaderContent}>Cantidad estándar</span>
                              </th>
                              <th className={st.menuHeaderCell}>
                                <span className={st.menuHeaderContent}>Cantidad ambiente</span>
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {documento.detalles.map((detalle) => (
                              <tr key={detalle.dia} className={st.menuRow}>
                                <td className={`${st.menuCell} ${st.menuCodeCell}`}>
                                  {detalle.dia}
                                </td>
                                <td className={st.menuCell} style={{ textAlign: "right" }}>
                                  {cantidad(detalle.cantidadEstandar)}
                                </td>
                                <td className={st.menuCell} style={{ textAlign: "right" }}>
                                  {cantidad(detalle.cantidadAmbiente)}
                                </td>
                              </tr>
                            ))}
                            <tr>
                              <td className={st.menuCell} style={{ fontWeight: 700 }}>
                                Total
                              </td>
                              <td
                                className={st.menuCell}
                                style={{ textAlign: "right", fontWeight: 700 }}
                              >
                                {cantidad(documento.total)}
                              </td>
                              <td
                                className={st.menuCell}
                                style={{ textAlign: "right", fontWeight: 700 }}
                              >
                                {cantidad(totalAmbiente)}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </section>
                )
              )}
            </DialogContent>
            <DialogActions>
              <ListActionButton
                action="regresar"
                label="Cerrar"
                text="Cerrar"
                onClick={cerrarDocumento}
              />
              <ListActionButton
                action="visualizar"
                label="Imprimir documento"
                text="Imprimir"
                onClick={() => window.print()}
              />
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </section>
  );
}
export default VentaListPage;
