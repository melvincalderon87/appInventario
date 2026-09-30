import { useEffect, useState } from "react";
import { useFormStateAdapter } from "../../hooks/useFormStateAdapter";
import { useMemo } from "react";
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
import { useTranslation } from "react-i18next";
import { formSchemas } from "../../validations/formSchemas";
import { setZodValidationError } from "../../validations/zodValidation";
import { useNavigate } from "react-router-dom";
import { ListActionButton } from "../../components/common/ListActionButton";
import { LocalizedDateInput } from "../../components/common/LocalizedDateInput";
import { BarcoService } from "../../services/barcoService";
import { IngresoTuberiasService } from "../../services/ingresoTuberiasService";
import { SuplidorService } from "../../services/suplidorService";
import {
  getBarcoActionPageThemeStyles,
  useBarcoActionPageStyles,
} from "../../styles/pages/barco/barcoActionPageStyles";

const EMPTY_INGRESO_TUBERIAS = {
  fecha: "",
  codBarco: 0,
  codSuplidor: 0,
  codProducto: 0,
  cantidadEstandar: 0,
  cantidadAmbiente: 0,
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
    fecha: ingreso.fecha,
    codBarco: toNumber(ingreso.codBarco),
    codSuplidor: toNumber(ingreso.codSuplidor),
    codProducto: toNumber(ingreso.codProducto),
    cantidadEstandar: toNumber(ingreso.cantidadEstandar),
    cantidadAmbiente: toNumber(ingreso.cantidadAmbiente),
  };
}

function BarcoIngresoTuberiasPage() {
  const styles = useBarcoActionPageStyles();
  const themeStyles = getBarcoActionPageThemeStyles();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { values: ingreso, setValues: setIngreso } = useFormStateAdapter(EMPTY_INGRESO_TUBERIAS);
  const [barcos, setBarcos] = useState([]);
  const [socios, setSocios] = useState([]);
  const [productos, setProductos] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lookupType, setLookupType] = useState("");
  const [lookupSearch, setLookupSearch] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const lookupOptions = useMemo(() => {
    if (lookupType === "barco") return barcos;
    if (lookupType === "suplidor") return socios;
    if (lookupType === "producto") return productos;
    return [];
  }, [barcos, lookupType, productos, socios]);
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
        const [barcosData, sociosData, productosData] = await Promise.all([
          BarcoService.ListarIngresadosRecientementeOpcion(),
          SuplidorService.ListarOpcion(),
          IngresoTuberiasService.listarProductoCombustibleOpcion(),
        ]);

        if (isMounted) {
          setBarcos(Array.isArray(barcosData) ? barcosData : []);
          setSocios(Array.isArray(sociosData) ? sociosData : []);
          setProductos(Array.isArray(productosData) ? productosData : []);
        }
      } catch (loadError) {
        if (isMounted) setError(loadError.message || t("pipelineEntryOptionsLoadError"));
      } finally {
        if (isMounted) setLoadingOptions(false);
      }
    }

    loadOptions();

    return () => {
      isMounted = false;
    };
  }, [t]);

  const updateTextField = (key) => (_, data) => {
    setIngreso((current) => ({
      ...current,
      [key]: data.value,
    }));
  };

  const updateNumberField = (key) => (_, data) => {
    setIngreso((current) => ({
      ...current,
      [key]: toNumber(data.value),
    }));
  };

  const openLookupDialog = (type) => {
    setLookupSearch("");
    setLookupType(type);
  };

  const closeLookupDialog = () => {
    setLookupType("");
    setLookupSearch("");
  };

  const selectLookupOption = (option) => {
    const key = {
      barco: "codBarco",
      suplidor: "codSuplidor",
      producto: "codProducto",
    }[lookupType];
    if (!key) return;

    setIngreso((current) => ({ ...current, [key]: toNumber(optionValue(option)) }));
    closeLookupDialog();
  };

  const validate = () =>
    setZodValidationError(formSchemas.barcoIngresoTuberias, ingreso, t, setError).ok;

  const save = async () => {
    try {
      setSaving(true);
      setError("");
      setMessage("");

      if (!validate()) return;

      await IngresoTuberiasService.agregar(buildPayload(ingreso));
      setMessage(t("pipelineEntryAdded"));
      setIngreso(EMPTY_INGRESO_TUBERIAS);
    } catch (saveError) {
      setError(saveError.message || t("pipelineEntrySaveError"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className={styles.root}>
      <div className={styles.toolbar}>
        <div>
          <Title2 className={styles.title}>{t("pipelineEntryTitle")}</Title2>
        </div>
        <ListActionButton
          action="regresar"
          label={t("back")}
          text={t("back")}
          onClick={() => navigate("/combustible/ingresotuberias/listar")}
        />
      </div>

      {error ? <MessageBar intent="error">{error}</MessageBar> : null}
      {message ? <MessageBar intent="success">{message}</MessageBar> : null}

      <div className={styles.formSurface} style={themeStyles.surface}>
        {loadingOptions ? (
          <div className={styles.loading}>
            <Spinner label={t("loadingPipelineEntry")} />
          </div>
        ) : (
          <>
            <div className={styles.formGrid}>
              <Field label={t("pipelineEntryDate")} required>
                <LocalizedDateInput value={ingreso.fecha} onChange={updateTextField("fecha")} />
              </Field>
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
              <Field label={t("shipDetailPartner")} required>
                <div className={styles.lookupControl}>
                  <Input
                    value={getSelectedOptionText(socios, ingreso.codSuplidor)}
                    readOnly
                    placeholder={t("selectOption")}
                  />
                  <Button
                    size="small"
                    appearance="secondary"
                    icon={<Search />}
                    onClick={() => openLookupDialog("suplidor")}
                  >
                    {t("shipLookupSearch")}
                  </Button>
                </div>
              </Field>
              <Field label={t("shipDetailProduct")} required>
                <div className={styles.lookupControl}>
                  <Input
                    value={getSelectedOptionText(productos, ingreso.codProducto)}
                    readOnly
                    placeholder={t("selectOption")}
                  />
                  <Button
                    size="small"
                    appearance="secondary"
                    icon={<Search />}
                    onClick={() => openLookupDialog("producto")}
                  >
                    {t("shipLookupSearch")}
                  </Button>
                </div>
              </Field>
              <Field label={t("shipEntryStandardQuantity")} required>
                <Input
                  type="number"
                  value={String(ingreso.cantidadEstandar ?? 0)}
                  onChange={updateNumberField("cantidadEstandar")}
                />
              </Field>
              <Field label={t("shipEntryAmbientQuantity")} required>
                <Input
                  type="number"
                  value={String(ingreso.cantidadAmbiente ?? 0)}
                  onChange={updateNumberField("cantidadAmbiente")}
                />
              </Field>
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

      <Dialog
        open={Boolean(lookupType)}
        onOpenChange={(_, data) => !data.open && closeLookupDialog()}
      >
        <DialogSurface className={styles.lookupDialogSurface} data-lookup-dialog>
          <DialogBody>
            <DialogTitle>
              {lookupType === "barco"
                ? t("shipSearchTitle")
                : lookupType === "suplidor"
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
                          <span>{t("shipLookupEmpty")}</span>
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

export default BarcoIngresoTuberiasPage;
