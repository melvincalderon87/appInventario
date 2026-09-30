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
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Check, Search } from "lucide-react";
import { LocalizedDateInput } from "../../components/common/LocalizedDateInput";
import { ListActionButton } from "../../components/common/ListActionButton";
import { SuplidorService } from "../../services/suplidorService";
import { EntradasProductoService } from "../../services/entradasProductoService";
import {
  getSalidasActionPageThemeStyles,
  useSalidasActionPageStyles,
} from "../../styles/pages/salidas/salidasActionPageStyles";

const INITIAL_ENTRY = {
  codEntradaProducto: 0,
  fecha: "",
  codSuplidor: "",
  codProducto: "",
  siglasUnidad: "",
  cantidadEstandar: 0,
  cantidadAmbiente: 0,
};

const optionValue = (option) => String(option?.value ?? option?.Value ?? "");
const optionText = (option) =>
  String(option?.text ?? option?.Text ?? option?.label ?? optionValue(option));
const asNumber = (value) => (Number.isFinite(Number(value)) ? Number(value) : 0);
const selectedOptionText = (options, value) =>
  optionText(options.find((option) => optionValue(option) === String(value ?? "")) ?? {});

function EntradasProductoAgregarPage() {
  const styles = useSalidasActionPageStyles();
  const themeStyles = getSalidasActionPageThemeStyles();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const esAjuste = location.pathname === "/ajustes/entrada";
  const esUnidad = location.pathname === "/unidad/entrada";
  const requiereUnidad = esUnidad;
  const rutaListado = esAjuste
    ? "/ajustes/entrada/listar"
    : esUnidad
      ? "/unidad/entrada/listar"
      : "/entradasproducto/listar";
  const [entry, setEntry] = useState(INITIAL_ENTRY);
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
      EntradasProductoService.obtenerKey(),
      SuplidorService.ListarOpcion(),
      EntradasProductoService.listarProductoCombustibleOpcion(),
    ])
      .then(([key, supplierOptions, productOptions]) => {
        if (!active) return;
        setEntry((current) => ({
          ...current,
          codEntradaProducto: asNumber(key?.codEntradaProducto ?? key?.CodEntradaProducto),
        }));
        setSuppliers(Array.isArray(supplierOptions) ? supplierOptions : []);
        setProducts(Array.isArray(productOptions) ? productOptions : []);
      })
      .catch((loadError) => active && setError(loadError.message || t("productEntrySaveError")))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [t]);

  const update = (key) => (_, data) => setEntry((current) => ({ ...current, [key]: data.value }));
  const updateNumber = (key) => (_, data) =>
    setEntry((current) => ({ ...current, [key]: asNumber(data.value) }));
  const closeLookup = () => {
    setLookupType("");
    setLookupSearch("");
  };
  const selectLookup = (option) => {
    const key = lookupType === "suplidor" ? "codSuplidor" : "codProducto";
    setEntry((current) => ({ ...current, [key]: optionValue(option) }));
    closeLookup();
  };

  const save = async () => {
    if (!entry.fecha || asNumber(entry.codSuplidor) <= 0 || asNumber(entry.codProducto) <= 0) {
      setError(t("productEntryRequiredFields"));
      return;
    }
    try {
      setSaving(true);
      setError("");
      setMessage("");
      await (
        esAjuste
          ? EntradasProductoService.agregarAjuste
          : esUnidad
            ? EntradasProductoService.agregarUnidad
            : EntradasProductoService.agregar
      )({
        ...entry,
        codSuplidor: asNumber(entry.codSuplidor),
        codProducto: asNumber(entry.codProducto),
        cantidadEstandar: asNumber(entry.cantidadEstandar),
        cantidadAmbiente: asNumber(entry.cantidadAmbiente),
      });
      setMessage(t("productEntrySaveSuccess"));
      const key = await EntradasProductoService.obtenerKey();
      setEntry({
        ...INITIAL_ENTRY,
        codEntradaProducto: asNumber(key?.codEntradaProducto ?? key?.CodEntradaProducto),
      });
    } catch (saveError) {
      setError(saveError.message || t("productEntrySaveError"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className={styles.root}>
      <div className={styles.toolbar}>
        <Title2 className={styles.title}>
          {esAjuste
            ? "Ajuste de Entrada de Producto"
            : esUnidad
              ? "Entrada por Unidad"
              : "Entrada de Producto"}
        </Title2>
        <ListActionButton
          action="regresar"
          label={t("back")}
          text={t("back")}
          onClick={() => navigate(rutaListado)}
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
              <Field label={t("productEntryCode")}>
                <Input value={String(entry.codEntradaProducto || "")} disabled />
              </Field>
              <Field label={t("productEntryDate")} required>
                <LocalizedDateInput value={entry.fecha} onChange={update("fecha")} />
              </Field>
              <Field label={t("productEntryPartner")} required>
                <div className={styles.lookupControl}>
                  <Input
                    value={selectedOptionText(suppliers, entry.codSuplidor)}
                    readOnly
                    placeholder={t("selectOption")}
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
                    {t("search")}
                  </Button>
                </div>
              </Field>
              <Field label={t("productEntryProduct")} required>
                <div className={styles.lookupControl}>
                  <Input
                    value={selectedOptionText(products, entry.codProducto)}
                    readOnly
                    placeholder={t("selectOption")}
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
                    {t("search")}
                  </Button>
                </div>
              </Field>
              {requiereUnidad ? (
                <Field label="Siglas de unidad" required>
                  <Input
                    value={entry.siglasUnidad}
                    maxLength={30}
                    placeholder="Ej. U-01"
                    onChange={update("siglasUnidad")}
                  />
                </Field>
              ) : null}
              <Field label={t("productEntryStandardQuantity")}>
                <Input
                  type="number"
                  min="0"
                  value={String(entry.cantidadEstandar)}
                  onChange={updateNumber("cantidadEstandar")}
                />
              </Field>
              <Field label={t("productEntryAmbientQuantity")}>
                <Input
                  type="number"
                  min="0"
                  value={String(entry.cantidadAmbiente)}
                  onChange={updateNumber("cantidadAmbiente")}
                />
              </Field>
            </div>
            <div className={styles.buttonRow}>
              <Button appearance="primary" disabled={saving} onClick={save}>
                {saving ? t("saving") : t("add")}
              </Button>
            </div>
          </>
        )}
      </div>
      <Dialog open={Boolean(lookupType)} onOpenChange={(_, data) => !data.open && closeLookup()}>
        <DialogSurface className={styles.lookupDialogSurface} data-lookup-dialog>
          <DialogBody>
            <DialogTitle>
              {t(
                lookupType === "suplidor"
                  ? "productEntrySupplierSearchTitle"
                  : "productEntryProductSearchTitle"
              )}
            </DialogTitle>
            <DialogContent>
              <div className={styles.lookupSearchRow}>
                <Input
                  autoFocus
                  value={lookupSearch}
                  contentBefore={<Search />}
                  placeholder={t("productEntryLookupPlaceholder")}
                  onChange={(_, data) => setLookupSearch(data.value)}
                />
              </div>
              <div className={styles.lookupTableWrap}>
                <Table className={styles.lookupTable}>
                  <TableHeader>
                    <TableRow>
                      <TableHeaderCell>{t("productEntryLookupCode")}</TableHeaderCell>
                      <TableHeaderCell>{t("productEntryLookupName")}</TableHeaderCell>
                      <TableHeaderCell className={styles.lookupActionCell}>
                        {t("actions")}
                      </TableHeaderCell>
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
                              {t("selectOption")}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={3} className={styles.lookupEmptyCell}>
                          {t("noProductEntriesFound")}
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
                label={t("back")}
                text={t("back")}
                onClick={closeLookup}
              />
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </section>
  );
}

export default EntradasProductoAgregarPage;
