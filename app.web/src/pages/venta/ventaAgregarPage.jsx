import { useEffect, useMemo, useState } from "react";
import {
  Button,
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
import { useNavigate } from "react-router-dom";
import { Check, Search } from "lucide-react";
import { ListActionButton } from "../../components/common/ListActionButton";
import { SuplidorService } from "../../services/suplidorService";
import { ProductoService } from "../../services/productoService";
import { VentaService } from "../../services/ventaService";
import { getMenuThemeStyles, useMenuStyles } from "../../styles/pages/menu/menuPageStyles";

const currentMonth = () => new Date().toISOString().slice(0, 7);
const daysInPeriod = (periodo) =>
  new Date(Number(periodo.slice(0, 4)), Number(periodo.slice(5, 7)), 0).getDate();
const createDetails = (periodo) =>
  Array.from({ length: daysInPeriod(periodo) }, (_, index) => ({
    dia: index + 1,
    cantidadEstandar: "0.00",
    cantidadAmbiente: "0.00",
  }));

export default function VentaAgregarPage() {
  const styles = useMenuStyles();
  const theme = getMenuThemeStyles();
  const navigate = useNavigate();
  const [suplidores, setSuplidores] = useState([]);
  const [productos, setProductos] = useState([]);
  const [codSuplidor, setCodSuplidor] = useState("");
  const [codProducto, setCodProducto] = useState("");
  const [periodo, setPeriodo] = useState(currentMonth());
  const [detalles, setDetalles] = useState(() => createDetails(currentMonth()));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [productSearch, setProductSearch] = useState("");

  useEffect(() => {
    Promise.all([SuplidorService.ListarOpcion(), ProductoService.ListarOpcion()])
      .then(([listaSuplidores, listaProductos]) => {
        setSuplidores(listaSuplidores);
        setProductos(listaProductos);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => setDetalles(createDetails(periodo)), [periodo]);

  const filteredProducts = useMemo(() => {
    const search = productSearch.trim().toLowerCase();
    return search
      ? productos.filter((item) => `${item.value} ${item.text}`.toLowerCase().includes(search))
      : productos;
  }, [productos, productSearch]);

  const selectedProduct = productos.find((item) => String(item.value) === String(codProducto));
  const closeProductDialog = () => {
    setProductDialogOpen(false);
    setProductSearch("");
  };
  const selectProduct = (producto) => {
    setCodProducto(producto.value);
    closeProductDialog();
  };

  const change = (rowIndex, field, value) => {
    setDetalles((rows) =>
      rows.map((row, index) => (index === rowIndex ? { ...row, [field]: value } : row))
    );
  };

  const normalize = (rowIndex, field) => {
    setDetalles((rows) =>
      rows.map((row, index) => {
        if (index !== rowIndex) return row;
        const cantidad = Number(row[field]);
        return {
          ...row,
          [field]: (Number.isFinite(cantidad) && cantidad >= 0 ? cantidad : 0).toFixed(2),
        };
      })
    );
  };

  const save = async () => {
    if (!codSuplidor || !codProducto) {
      setError("Seleccione suplidor y producto.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      await VentaService.agregar({
        periodo: `${periodo}-01`,
        codSuplidor,
        codProducto,
        detalles: detalles.map((row) => ({
          dia: row.dia,
          cantidadEstandar: Number(row.cantidadEstandar) || 0,
          cantidadAmbiente: Number(row.cantidadAmbiente) || 0,
        })),
      });
      navigate("/ventas/listar");
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className={styles.root}>
      <div className={styles.header}>
        <div>
          <Title2 className={styles.title}>Agregar venta manual</Title2>
          <Text className={styles.subtitle}>
            Seleccione un producto e ingrese sus cantidades estándar y ambiente por día.
          </Text>
        </div>
        <ListActionButton
          action="regresar"
          label="Regresar"
          text="Regresar"
          onClick={() => navigate("/ventas/listar")}
        />
      </div>

      {error && <MessageBar intent="error">{error}</MessageBar>}

      <div className={styles.formSurface} style={theme.surface}>
        {loading ? (
          <div className={styles.loading}>
            <Spinner label="Cargando opciones..." />
          </div>
        ) : (
          <>
            <div className={styles.formGrid}>
              <Field label="Mes" required>
                <Input
                  type="month"
                  value={periodo}
                  onChange={(_, data) => setPeriodo(data.value)}
                />
              </Field>
              <Field label="Suplidor" required>
                <Combobox
                  selectedOptions={codSuplidor ? [codSuplidor] : []}
                  value={
                    suplidores.find((item) => String(item.value) === String(codSuplidor))?.text ??
                    ""
                  }
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
              <Field label="Producto" required>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "minmax(0, 1fr) auto",
                    gap: "8px",
                  }}
                >
                  <Input
                    value={selectedProduct?.text ?? ""}
                    readOnly
                    placeholder="Seleccione"
                    onClick={() => setProductDialogOpen(true)}
                  />
                  <Button
                    size="small"
                    appearance="secondary"
                    icon={<Search />}
                    onClick={() => setProductDialogOpen(true)}
                  >
                    Buscar
                  </Button>
                </div>
              </Field>
            </div>

            <div
              className={styles.menuTableSurface}
              style={{ ...theme.surface, marginTop: "20px" }}
            >
              <div className={styles.menuTableScroll}>
                <table className={styles.menuTable} style={{ minWidth: "620px" }}>
                  <thead>
                    <tr>
                      <th
                        className={styles.menuHeaderCell}
                        style={{ width: "80px", height: "28px", textAlign: "center" }}
                      >
                        Día
                      </th>
                      <th
                        className={styles.menuHeaderCell}
                        style={{ height: "28px", textAlign: "center" }}
                      >
                        Cantidad estándar
                      </th>
                      <th
                        className={styles.menuHeaderCell}
                        style={{ height: "28px", textAlign: "center" }}
                      >
                        Cantidad ambiente
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {detalles.map((row, rowIndex) => (
                      <tr key={row.dia} className={styles.menuRow}>
                        <td
                          className={`${styles.menuCell} ${styles.menuCodeCell}`}
                          style={{ height: "30px", padding: "2px 4px" }}
                        >
                          {row.dia}
                        </td>
                        {["cantidadEstandar", "cantidadAmbiente"].map((field) => (
                          <td
                            key={field}
                            className={styles.menuCell}
                            style={{ height: "30px", padding: "1px 4px" }}
                          >
                            <Input
                              type="text"
                              inputMode="decimal"
                              value={row[field]}
                              onChange={(_, data) => change(rowIndex, field, data.value)}
                              onBlur={() => normalize(rowIndex, field)}
                              style={{ height: "26px", padding: "2px 5px", textAlign: "right" }}
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className={styles.buttonRow}>
              <ListActionButton
                action="agregar"
                label="Guardar venta"
                text={saving ? "Guardando..." : "Guardar venta"}
                disabled={saving}
                onClick={save}
              />
            </div>
          </>
        )}
      </div>

      <Dialog
        open={productDialogOpen}
        onOpenChange={(_, data) => !data.open && closeProductDialog()}
      >
        <DialogSurface
          style={{ width: "min(720px, calc(100vw - 32px))", maxHeight: "calc(100vh - 48px)" }}
        >
          <DialogBody>
            <DialogTitle>Buscar producto</DialogTitle>
            <DialogContent>
              <Input
                autoFocus
                value={productSearch}
                contentBefore={<Search />}
                placeholder="Buscar por código o nombre"
                onChange={(_, data) => setProductSearch(data.value)}
              />
              <div
                className={styles.menuTableSurface}
                style={{
                  ...theme.surface,
                  marginTop: "12px",
                  maxHeight: "420px",
                  overflow: "auto",
                }}
              >
                <table className={styles.menuTable} style={{ minWidth: "500px" }}>
                  <colgroup>
                    <col style={{ width: "90px" }} />
                    <col />
                    <col style={{ width: "140px" }} />
                  </colgroup>
                  <thead>
                    <tr>
                      <th className={styles.menuHeaderCell}>
                        <span className={styles.menuHeaderContent}>Código</span>
                      </th>
                      <th className={styles.menuHeaderCell}>
                        <span className={styles.menuHeaderContent}>Producto</span>
                      </th>
                      <th className={styles.menuHeaderCell} style={{ textAlign: "center" }}>
                        Acción
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.length ? (
                      filteredProducts.map((producto) => (
                        <tr
                          key={producto.value}
                          className={styles.menuRow}
                          onDoubleClick={() => selectProduct(producto)}
                          style={{ cursor: "pointer" }}
                        >
                          <td className={styles.menuCell}>{producto.value}</td>
                          <td className={styles.menuCell}>{producto.text}</td>
                          <td className={`${styles.menuCell} ${styles.menuActionsCell}`}>
                            <Button
                              size="small"
                              appearance="primary"
                              icon={<Check />}
                              onClick={() => selectProduct(producto)}
                            >
                              Seleccionar
                            </Button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          className={styles.menuCell}
                          colSpan="3"
                          style={{ padding: "18px", textAlign: "center" }}
                        >
                          No se encontraron productos.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </DialogContent>
            <DialogActions>
              <ListActionButton
                action="regresar"
                label="Cerrar"
                text="Cerrar"
                onClick={closeProductDialog}
              />
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </section>
  );
}
