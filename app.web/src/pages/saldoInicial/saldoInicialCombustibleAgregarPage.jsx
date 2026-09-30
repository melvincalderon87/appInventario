import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  Field,
  Input,
  MessageBar,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
  Title2,
} from "@/components/ui/app-shadcn";
import { Check, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ListActionButton } from "../../components/common/ListActionButton";
import { EntradasProductoService } from "../../services/entradasProductoService";
import { SaldoInicialService } from "../../services/saldoInicialService";
import { SuplidorService } from "../../services/suplidorService";
import {
  getSalidasActionPageThemeStyles,
  useSalidasActionPageStyles,
} from "../../styles/pages/salidas/salidasActionPageStyles";
import { LocalizedDateInput } from "../../components/common/LocalizedDateInput";

const INITIAL_SALDO = {
  mes: new Date().toISOString().slice(0, 10),
  codSuplidor: "",
  codProducto: "",
  cantidadEstandar: 0,
  cantidadAmbiente: 0,
};
const optionValue = (option) => String(option?.value ?? option?.Value ?? "");
const optionText = (option) =>
  String(option?.text ?? option?.Text ?? option?.label ?? optionValue(option));
const asNumber = (value) => (Number.isFinite(Number(value)) ? Number(value) : 0);
const selectedOptionText = (options, value) =>
  optionText(options.find((option) => optionValue(option) === String(value ?? "")) ?? {});

export default function SaldoInicialCombustibleAgregarPage() {
  const styles = useSalidasActionPageStyles();
  const themeStyles = getSalidasActionPageThemeStyles();
  const navigate = useNavigate();
  const [saldo, setSaldo] = useState(INITIAL_SALDO);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [lookupType, setLookupType] = useState("");
  const [lookupSearch, setLookupSearch] = useState("");
  const lookupOptions = lookupType === "suplidor" ? suppliers : products;
  const filteredLookupOptions = useMemo(() => {
    const search = lookupSearch.trim().toLowerCase();
    return search
      ? lookupOptions.filter((option) =>
          `${optionValue(option)} ${optionText(option)}`.toLowerCase().includes(search)
        )
      : lookupOptions;
  }, [lookupOptions, lookupSearch]);

  useEffect(() => {
    let active = true;
    Promise.all([
      SuplidorService.ListarOpcion(),
      EntradasProductoService.listarProductoCombustibleOpcion(),
    ])
      .then(([supplierOptions, productOptions]) => {
        if (!active) return;
        setSuppliers(Array.isArray(supplierOptions) ? supplierOptions : []);
        setProducts(Array.isArray(productOptions) ? productOptions : []);
      })
      .catch(
        (loadError) =>
          active && setError(loadError.message || "No fue posible cargar las opciones.")
      )
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const update = (key) => (_, data) => setSaldo((current) => ({ ...current, [key]: data.value }));
  const updateNumber = (key) => (_, data) =>
    setSaldo((current) => ({ ...current, [key]: asNumber(data.value) }));
  const closeLookup = () => {
    setLookupType("");
    setLookupSearch("");
  };
  const selectLookup = (option) => {
    const key = lookupType === "suplidor" ? "codSuplidor" : "codProducto";
    setSaldo((current) => ({ ...current, [key]: optionValue(option) }));
    closeLookup();
  };
  const save = async () => {
    if (!saldo.mes || asNumber(saldo.codSuplidor) <= 0 || asNumber(saldo.codProducto) <= 0) {
      setError("Complete los campos requeridos.");
      return;
    }
    try {
      setSaving(true);
      setError("");
      setMessage("");
      await SaldoInicialService.agregar({
        ...saldo,
        tipo: "COMBUSTIBLE",
        fecha: saldo.mes,
        codSuplidor: asNumber(saldo.codSuplidor),
        codProducto: asNumber(saldo.codProducto),
        cantidadEstandar: asNumber(saldo.cantidadEstandar),
        cantidadAmbiente: asNumber(saldo.cantidadAmbiente),
      });
      setMessage("Saldo inicial mensual agregado correctamente.");
      setSaldo(INITIAL_SALDO);
    } catch (saveError) {
      setError(saveError.message || "No fue posible agregar el saldo inicial.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className={styles.root}>
      <div className={styles.toolbar}>
        <Title2 className={styles.title}>Saldo inicial combustible - Agregar</Title2>
        <ListActionButton
          action="regresar"
          label="Regresar"
          text="Regresar"
          onClick={() => navigate("/saldo-inicial/combustible/listar")}
        />
      </div>
      {error ? <MessageBar intent="error">{error}</MessageBar> : null}
      {message ? <MessageBar intent="success">{message}</MessageBar> : null}
      <div className={styles.formSurface} style={themeStyles.surface}>
        {loading ? (
          <div className={styles.loading}>
            <Spinner />
          </div>
        ) : (
          <>
            <div className={styles.formGrid}>
              <Field label="Correlativo">
                <Input value="Automático" disabled />
              </Field>
              <Field label="Fecha" required>
                <LocalizedDateInput value={saldo.mes} onChange={update("mes")} />
              </Field>
              <Field label="Suplidor" required>
                <div className={styles.lookupControl}>
                  <Input
                    value={selectedOptionText(suppliers, saldo.codSuplidor)}
                    readOnly
                    placeholder="Seleccione"
                  />
                  <Button
                    size="small"
                    appearance="secondary"
                    icon={<Search />}
                    onClick={() => {
                      setLookupSearch("");
                      setLookupType("suplidor");
                    }}
                  >
                    Buscar
                  </Button>
                </div>
              </Field>
              <Field label="Producto" required>
                <div className={styles.lookupControl}>
                  <Input
                    value={selectedOptionText(products, saldo.codProducto)}
                    readOnly
                    placeholder="Seleccione"
                  />
                  <Button
                    size="small"
                    appearance="secondary"
                    icon={<Search />}
                    onClick={() => {
                      setLookupSearch("");
                      setLookupType("producto");
                    }}
                  >
                    Buscar
                  </Button>
                </div>
              </Field>
              <Field label="Cantidad estándar" required>
                <Input
                  type="number"
                  min="0"
                  value={String(saldo.cantidadEstandar)}
                  onChange={updateNumber("cantidadEstandar")}
                />
              </Field>
              <Field label="Cantidad ambiente" required>
                <Input
                  type="number"
                  min="0"
                  value={String(saldo.cantidadAmbiente)}
                  onChange={updateNumber("cantidadAmbiente")}
                />
              </Field>
            </div>
            <div className={styles.buttonRow}>
              <Button appearance="primary" disabled={saving} onClick={save}>
                {saving ? "Guardando..." : "Agregar"}
              </Button>
            </div>
          </>
        )}
      </div>
      <Dialog open={Boolean(lookupType)} onOpenChange={(_, data) => !data.open && closeLookup()}>
        <DialogSurface className={styles.lookupDialogSurface} data-lookup-dialog>
          <DialogBody>
            <DialogTitle>
              {lookupType === "suplidor" ? "Buscar suplidor" : "Buscar producto"}
            </DialogTitle>
            <DialogContent>
              <div className={styles.lookupSearchRow}>
                <Input
                  autoFocus
                  value={lookupSearch}
                  contentBefore={<Search />}
                  placeholder="Buscar por código o descripción"
                  onChange={(_, data) => setLookupSearch(data.value)}
                />
              </div>
              <div className={styles.lookupTableWrap}>
                <Table className={styles.lookupTable}>
                  <TableHeader>
                    <TableRow>
                      <TableHeaderCell>Código</TableHeaderCell>
                      <TableHeaderCell>Descripción</TableHeaderCell>
                      <TableHeaderCell className={styles.lookupActionCell}>Acción</TableHeaderCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLookupOptions.length ? (
                      filteredLookupOptions.map((option) => (
                        <TableRow
                          key={optionValue(option)}
                          className={styles.lookupTableRow}
                          onDoubleClick={() => selectLookup(option)}
                        >
                          <TableCell>{optionValue(option)}</TableCell>
                          <TableCell>{optionText(option)}</TableCell>
                          <TableCell className={styles.lookupActionCell}>
                            <Button
                              size="small"
                              appearance="primary"
                              icon={<Check />}
                              onClick={() => selectLookup(option)}
                            >
                              Seleccionar
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={3} className={styles.lookupEmptyCell}>
                          No hay opciones disponibles.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </DialogContent>
            <DialogActions>
              <ListActionButton
                action="regresar"
                label="Cerrar"
                text="Cerrar"
                onClick={closeLookup}
              />
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </section>
  );
}
