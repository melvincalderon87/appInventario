import { useEffect, useMemo, useState } from "react";
import { useFormStateAdapter } from "../../hooks/useFormStateAdapter";
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
  Text,
  Title2,
} from "@/components/ui/app-shadcn";
import { Check, Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import { formSchemas } from "../../validations/formSchemas";
import { setZodValidationError } from "../../validations/zodValidation";
import { useNavigate, useParams } from "react-router-dom";
import { ListActionButton } from "../../components/common/ListActionButton";
import { LocalizedDateInput } from "../../components/common/LocalizedDateInput";
import { BarcoService } from "../../services/barcoService";
import { IngresoBarcoService } from "../../services/ingresoBarcoService";
import { SuplidorService } from "../../services/suplidorService";
import {
  getBarcoActionPageThemeStyles,
  useBarcoActionPageStyles,
} from "../../styles/pages/barco/barcoActionPageStyles";

const createEmptyDetalle = () => ({
  clientId: crypto.randomUUID(),
  linea: 0,
  codSuplidor: 0,
  codProducto: 0,
  cantidadEstandar: 0,
  cantidadAmbiente: 0,
});

const EMPTY_INGRESO_BARCO = {
  codIngresoBarco: 0,
  codBarco: 0,
  fechaIngreso: "",
  codigoInterno: "",
  correlativoOTSA: "",
  detalles: [createEmptyDetalle()],
};

function toNumber(value) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
}

function optionValue(option) {
  return String(option?.value ?? option?.Value ?? "");
}

function optionText(option) {
  return String(option?.text ?? option?.Text ?? option?.label ?? optionValue(option));
}

function getSelectedOptionText(options, value) {
  const selected = options.find((option) => optionValue(option) === String(value ?? ""));
  return selected ? optionText(selected) : "";
}

function filterLookupOptions(options, search) {
  const searchText = String(search ?? "")
    .trim()
    .toLowerCase();
  if (!searchText) return options;

  return options.filter((option) =>
    `${optionValue(option)} ${optionText(option)}`.toLowerCase().includes(searchText)
  );
}

function buildPayload(ingreso) {
  return {
    codIngresoBarco: toNumber(ingreso.codIngresoBarco),
    codBarco: toNumber(ingreso.codBarco),
    fechaIngreso: ingreso.fechaIngreso,
    codigoInterno: String(ingreso.codigoInterno ?? "").trim(),
    correlativoOTSA: String(ingreso.correlativoOTSA ?? "").trim(),
    detalles: ingreso.detalles.map((detalle, index) => ({
      linea: index + 1,
      codSuplidor: toNumber(detalle.codSuplidor),
      codProducto: toNumber(detalle.codProducto),
      cantidadEstandar: toNumber(detalle.cantidadEstandar),
      // Un valor vacio se normaliza a cero; no se debe perder un valor Ambiente existente.
      cantidadAmbiente: toNumber(detalle.cantidadAmbiente),
    })),
  };
}

function BarcoIngresoBarcoPage({ mode = "agregar" }) {
  const styles = useBarcoActionPageStyles();
  const themeStyles = getBarcoActionPageThemeStyles();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { codigo } = useParams();
  const isEdit = mode === "editar";
  const { values: ingreso, setValues: setIngreso } = useFormStateAdapter(EMPTY_INGRESO_BARCO);
  const [barcos, setBarcos] = useState([]);
  const [socios, setSocios] = useState([]);
  const [productos, setProductos] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lookup, setLookup] = useState(null);
  const [lookupSearch, setLookupSearch] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const lookupOptions = useMemo(() => {
    if (lookup?.type === "barco") return barcos;
    if (lookup?.type === "suplidor") return socios;
    if (lookup?.type === "producto") return productos;
    return [];
  }, [barcos, lookup?.type, productos, socios]);
  const filteredLookupOptions = useMemo(
    () => filterLookupOptions(lookupOptions, lookupSearch),
    [lookupOptions, lookupSearch]
  );

  useEffect(() => {
    let isMounted = true;

    async function loadOptions() {
      try {
        setLoadingOptions(true);
        setError("");
        const [barcosData, sociosData, productosData, ingresoData] = await Promise.all([
          isEdit
            ? BarcoService.ListarOpcion()
            : BarcoService.ListarFechaPrevistaUltimosDosMesesOpcion(),
          SuplidorService.ListarOpcion(),
          IngresoBarcoService.listarProductoCombustibleOpcion(),
          isEdit ? IngresoBarcoService.obtener(codigo) : Promise.resolve(null),
        ]);

        if (isMounted) {
          setBarcos(Array.isArray(barcosData) ? barcosData : []);
          setSocios(Array.isArray(sociosData) ? sociosData : []);
          setProductos(Array.isArray(productosData) ? productosData : []);
          if (ingresoData) {
            setIngreso({
              codIngresoBarco: toNumber(ingresoData.codIngresoBarco),
              codBarco: toNumber(ingresoData.codBarco),
              fechaIngreso: ingresoData.fechaIngreso?.slice(0, 10) ?? "",
              codigoInterno: ingresoData.codigoInterno ?? "",
              correlativoOTSA: ingresoData.correlativoOTSA ?? "",
              detalles: (ingresoData.detalles ?? []).map((detalle) => ({
                clientId: crypto.randomUUID(),
                linea: toNumber(detalle.linea),
                codSuplidor: toNumber(detalle.codSuplidor),
                codProducto: toNumber(detalle.codProducto),
                cantidadEstandar: toNumber(detalle.cantidadEstandar),
                cantidadAmbiente: toNumber(detalle.cantidadAmbiente),
              })),
            });
          }
        }
      } catch (loadError) {
        if (isMounted) setError(loadError.message || t("shipEntryOptionsLoadError"));
      } finally {
        if (isMounted) setLoadingOptions(false);
      }
    }

    loadOptions();

    return () => {
      isMounted = false;
    };
  }, [codigo, isEdit, setIngreso, t]);

  const updateTextField = (key) => (_, data) => {
    setIngreso((current) => ({
      ...current,
      [key]: data.value,
    }));
  };

  const updateDetalle = (clientId, key) => (_, data) => {
    setIngreso((current) => ({
      ...current,
      detalles: current.detalles.map((detalle) =>
        detalle.clientId === clientId ? { ...detalle, [key]: toNumber(data.value) } : detalle
      ),
    }));
  };

  const openLookupDialog = (type, clientId = "") => {
    setLookupSearch("");
    setLookup({ type, clientId });
  };

  const closeLookupDialog = () => {
    setLookup(null);
    setLookupSearch("");
  };

  const selectLookupOption = (option) => {
    if (!lookup) return;

    const value = toNumber(optionValue(option));
    setIngreso((current) => {
      if (lookup.type === "barco") return { ...current, codBarco: value };

      const key = lookup.type === "suplidor" ? "codSuplidor" : "codProducto";
      return {
        ...current,
        detalles: current.detalles.map((detalle) =>
          detalle.clientId === lookup.clientId ? { ...detalle, [key]: value } : detalle
        ),
      };
    });
    closeLookupDialog();
  };

  const addDetalle = () => {
    setIngreso((current) => ({
      ...current,
      detalles: [...current.detalles, createEmptyDetalle()],
    }));
  };

  const removeDetalle = (clientId) => {
    setIngreso((current) => {
      const detalles = current.detalles.filter((detalle) => detalle.clientId !== clientId);
      return {
        ...current,
        detalles: detalles.length > 0 ? detalles : [createEmptyDetalle()],
      };
    });
  };

  const validate = () => setZodValidationError(formSchemas.barcoIngreso, ingreso, t, setError).ok;

  const save = async () => {
    try {
      setSaving(true);
      setError("");
      setMessage("");

      if (!validate()) return;

      if (isEdit) {
        await IngresoBarcoService.editar(buildPayload(ingreso));
        navigate("/barco/ingresobarco");
      } else {
        await IngresoBarcoService.agregar(buildPayload(ingreso));
        setMessage(t("shipEntryAdded"));
        setIngreso({
          ...EMPTY_INGRESO_BARCO,
          detalles: [createEmptyDetalle()],
        });
      }
    } catch (saveError) {
      setError(saveError.message || t("shipEntrySaveError"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className={styles.root}>
      <div className={styles.toolbar}>
        <div>
          <Title2 className={styles.title}>
            {isEdit ? "Editar ingreso de barco" : t("shipEntryTitle")}
          </Title2>
        </div>
        <ListActionButton
          action="regresar"
          label={t("back")}
          text={t("back")}
          onClick={() => navigate("/barco/ingresobarco")}
        />
      </div>

      {error ? <MessageBar intent="error">{error}</MessageBar> : null}
      {message ? <MessageBar intent="success">{message}</MessageBar> : null}

      <div className={styles.formSurface} style={themeStyles.surface}>
        {loadingOptions ? (
          <div className={styles.loading}>
            <Spinner label={t("loadingShipEntry")} />
          </div>
        ) : (
          <>
            <div className={styles.formGrid}>
              <Field label={t("shipName")} required>
                <div className={styles.lookupControl}>
                  <Input
                    value={getSelectedOptionText(barcos, ingreso.codBarco)}
                    readOnly
                    placeholder={t("selectOption")}
                  />
                  <Button
                    size="small"
                    appearance="secondary"
                    icon={<Search />}
                    onClick={() => openLookupDialog("barco")}
                  >
                    {t("shipLookupSearch")}
                  </Button>
                </div>
              </Field>
              <Field label={t("shipEntryDate")} required>
                <LocalizedDateInput
                  value={ingreso.fechaIngreso}
                  onChange={updateTextField("fechaIngreso")}
                />
              </Field>
              <Field label={t("shipEntryInternalCode")} required>
                <Input value={ingreso.codigoInterno} onChange={updateTextField("codigoInterno")} />
              </Field>
              <Field label="Correlativo OTSA">
                <Input
                  value={ingreso.correlativoOTSA}
                  maxLength={100}
                  onChange={updateTextField("correlativoOTSA")}
                />
              </Field>
            </div>

            <div className={styles.detailSection}>
              <div className={styles.detailHeader}>
                <Text weight="semibold" className={styles.detailTitle}>
                  {t("shipEntryDetailTitle")}
                </Text>
                <ListActionButton
                  action="agregar"
                  label={t("shipAddRow")}
                  text={t("shipAddRow")}
                  onClick={addDetalle}
                />
              </div>

              <div className={styles.detailRows}>
                {ingreso.detalles.map((detalle, index) => (
                  <div
                    key={detalle.clientId}
                    className={styles.detailRowWide}
                    style={themeStyles.detailRow}
                  >
                    <Field label={t("shipDetailPartner")} required>
                      <div className={styles.lookupControl}>
                        <Input
                          value={getSelectedOptionText(socios, detalle.codSuplidor)}
                          readOnly
                          placeholder={t("selectOption")}
                        />
                        <Button
                          size="small"
                          appearance="secondary"
                          icon={<Search />}
                          onClick={() => openLookupDialog("suplidor", detalle.clientId)}
                        >
                          {t("shipLookupSearch")}
                        </Button>
                      </div>
                    </Field>
                    <Field label={t("shipDetailProduct")} required>
                      <div className={styles.lookupControl}>
                        <Input
                          value={getSelectedOptionText(productos, detalle.codProducto)}
                          readOnly
                          placeholder={t("selectOption")}
                        />
                        <Button
                          size="small"
                          appearance="secondary"
                          icon={<Search />}
                          onClick={() => openLookupDialog("producto", detalle.clientId)}
                        >
                          {t("shipLookupSearch")}
                        </Button>
                      </div>
                    </Field>
                    <Field label={t("shipEntryStandardQuantity")} required>
                      <Input
                        type="number"
                        value={String(detalle.cantidadEstandar ?? 0)}
                        onChange={updateDetalle(detalle.clientId, "cantidadEstandar")}
                      />
                    </Field>
                    <Field label={t("shipEntryAmbientQuantity")}>
                      <Input
                        type="number"
                        min="0"
                        value={String(detalle.cantidadAmbiente ?? 0)}
                        onChange={updateDetalle(detalle.clientId, "cantidadAmbiente")}
                      />
                    </Field>
                    <div className={styles.detailActions}>
                      <ListActionButton
                        action="eliminar"
                        label={t("delete")}
                        disabled={ingreso.detalles.length === 1 && index === 0}
                        onClick={() => removeDetalle(detalle.clientId)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.buttonRow}>
              <ListActionButton
                action="agregar"
                label={t("save")}
                text={saving ? t("saving") : t("save")}
                disabled={saving}
                onClick={save}
              />
            </div>
          </>
        )}
      </div>

      <Dialog open={Boolean(lookup)} onOpenChange={(_, data) => !data.open && closeLookupDialog()}>
        <DialogSurface className={styles.lookupDialogSurface} data-lookup-dialog>
          <DialogBody>
            <DialogTitle>
              {lookup?.type === "barco"
                ? t("shipSearchTitle")
                : lookup?.type === "suplidor"
                  ? t("shipPartnerSearchTitle")
                  : t("shipProductSearchTitle")}
            </DialogTitle>
            <DialogContent>
              <div className={styles.lookupSearchRow}>
                <Input
                  autoFocus
                  value={lookupSearch}
                  placeholder={t("shipLookupSearchPlaceholder")}
                  contentBefore={<Search />}
                  onChange={(_, data) => setLookupSearch(data.value)}
                />
              </div>
              <div className={styles.lookupTableWrap}>
                <Table className={styles.lookupTable}>
                  <TableHeader>
                    <TableRow>
                      <TableHeaderCell>{t("shipLookupCode")}</TableHeaderCell>
                      <TableHeaderCell>{t("shipLookupName")}</TableHeaderCell>
                      <TableHeaderCell className={styles.lookupActionCell}>
                        {t("actions")}
                      </TableHeaderCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLookupOptions.length > 0 ? (
                      filteredLookupOptions.map((option) => (
                        <TableRow
                          key={optionValue(option)}
                          className={styles.lookupTableRow}
                          onDoubleClick={() => selectLookupOption(option)}
                        >
                          <TableCell>{optionValue(option)}</TableCell>
                          <TableCell>{optionText(option)}</TableCell>
                          <TableCell className={styles.lookupActionCell}>
                            <Button
                              size="small"
                              appearance="primary"
                              icon={<Check />}
                              onClick={() => selectLookupOption(option)}
                            >
                              {t("shipLookupSelect")}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={3} className={styles.lookupEmptyCell}>
                          <Text>{t("shipLookupEmpty")}</Text>
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
                onClick={closeLookupDialog}
              />
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </section>
  );
}

export default BarcoIngresoBarcoPage;
