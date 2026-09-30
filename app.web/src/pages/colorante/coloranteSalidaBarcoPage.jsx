import { useEffect, useState } from "react";
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
  Select,
  Spinner,
  Text,
  Title2,
} from "@/components/ui/app-shadcn";
import { Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { ListActionButton } from "../../components/common/ListActionButton";
import { LocalizedDateInput } from "../../components/common/LocalizedDateInput";
import { BarcoService } from "../../services/barcoService";
import { ColoranteService } from "../../services/coloranteService";
import { SuplidorService } from "../../services/suplidorService";
import { formSchemas } from "../../validations/formSchemas";
import { setZodValidationError } from "../../validations/zodValidation";
import {
  getColoranteActionPageThemeStyles,
  useColoranteActionPageStyles,
} from "../../styles/pages/colorante/coloranteActionPageStyles";

function createEmptySalidaBarco() {
  return {
    idColorante: "",
    codDocumento: 0,
    codProducto: "",
    fecha: new Date().toISOString().slice(0, 10),
    tipoMovimiento: "SALIDA",
    codBarco: 0,
    barco: "",
    codSuplidor: 0,
    comentarios: "",
    cantidad: 0,
    consumoTeorico: "",
    pg: "",
    porcentajePg: "",
  };
}

function toNumber(value) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
}

function toDateInputValue(value) {
  if (!value) return "";
  return String(value).slice(0, 10);
}

function ColoranteSalidaBarcoPage() {
  const styles = useColoranteActionPageStyles();
  const themeStyles = getColoranteActionPageThemeStyles();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { values: salidaBarco, setValues: setSalidaBarco } =
    useFormStateAdapter(createEmptySalidaBarco());
  const [productos, setProductos] = useState([]);
  const [socios, setSocios] = useState([]);
  const [barcos, setBarcos] = useState([]);
  const [barcoSearch, setBarcoSearch] = useState("");
  const [barcoDialogOpen, setBarcoDialogOpen] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [loadingBarcos, setLoadingBarcos] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [barcoError, setBarcoError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadOptions() {
      try {
        setLoadingOptions(true);
        setError("");
        const [productoOptions, socioOptions] = await Promise.all([
          ColoranteService.ListarProductoOpcion(),
          SuplidorService.ListarOpcion(),
        ]);

        if (isMounted) {
          setProductos(Array.isArray(productoOptions) ? productoOptions : []);
          setSocios(Array.isArray(socioOptions) ? socioOptions : []);
        }
      } catch (loadError) {
        if (isMounted) setError(loadError.message || t("colorantShipExitOptionsLoadError"));
      } finally {
        if (isMounted) setLoadingOptions(false);
      }
    }

    loadOptions();

    return () => {
      isMounted = false;
    };
  }, [t]);

  useEffect(() => {
    if (!barcoDialogOpen) return undefined;

    let isMounted = true;
    const timeoutId = window.setTimeout(async () => {
      try {
        setLoadingBarcos(true);
        setBarcoError("");
        const data = await BarcoService.BuscarOpcion({ search: barcoSearch, limite: 20 });
        if (isMounted) setBarcos(Array.isArray(data) ? data : []);
      } catch (loadError) {
        if (isMounted) {
          setBarcoError(loadError.message || t("colorantShipSearchLoadError"));
          setBarcos([]);
        }
      } finally {
        if (isMounted) setLoadingBarcos(false);
      }
    }, 250);

    return () => {
      isMounted = false;
      window.clearTimeout(timeoutId);
    };
  }, [barcoDialogOpen, barcoSearch, t]);

  const updateTextField = (key) => (_, data) => {
    setSalidaBarco((current) => ({
      ...current,
      [key]: data.value,
    }));
  };

  const updateNumberField = (key) => (_, data) => {
    setSalidaBarco((current) => ({
      ...current,
      [key]: toNumber(data.value),
    }));
  };

  const openBarcoDialog = () => {
    setBarcoSearch("");
    setBarcoDialogOpen(true);
  };

  const selectBarco = (option) => {
    setSalidaBarco((current) => ({
      ...current,
      codBarco: toNumber(option.value),
      barco: option.text ?? "",
    }));
    setBarcoDialogOpen(false);
  };

  const buildPayload = () => ({
    idColorante: "",
    codDocumento: 0,
    codProducto: String(salidaBarco.codProducto ?? "").trim(),
    fecha: toDateInputValue(salidaBarco.fecha),
    tipoMovimiento: "SALIDA",
    codBarco: toNumber(salidaBarco.codBarco),
    codSuplidor: toNumber(salidaBarco.codSuplidor),
    cantidad: toNumber(salidaBarco.cantidad),
    comentarios: salidaBarco.barco ? `${t("colorantShip")}: ${salidaBarco.barco}` : "",
  });

  const save = async () => {
    try {
      setSaving(true);
      setError("");
      setMessage("");

      const payload = buildPayload();
      if (!setZodValidationError(formSchemas.coloranteSalidaBarco, payload, t, setError).ok) return;

      await ColoranteService.agregar(payload);
      setMessage(t("colorantShipExitAdded"));
      setSalidaBarco(createEmptySalidaBarco());
    } catch (saveError) {
      setError(saveError.message || t("colorantSaveError"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className={styles.root}>
      <div className={styles.toolbar}>
        <div>
          <Title2 className={styles.title}>{t("colorantShipExitTitle")}</Title2>
        </div>
        <ListActionButton
          action="regresar"
          label={t("back")}
          text={t("back")}
          onClick={() => navigate("/colorante/listar")}
        />
      </div>

      {error ? <MessageBar intent="error">{error}</MessageBar> : null}
      {message ? <MessageBar intent="success">{message}</MessageBar> : null}

      <div className={styles.formSurface} style={themeStyles.surface}>
        {loadingOptions ? (
          <div className={styles.loading}>
            <Spinner label={t("loadingColorant")} />
          </div>
        ) : (
          <>
            <div className={styles.formGrid}>
              <Field label={t("colorantProduct")} required>
                <Select
                  value={String(salidaBarco.codProducto || "")}
                  onChange={updateTextField("codProducto")}
                >
                  <option value="">{t("selectOption")}</option>
                  {productos.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.text}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label={t("colorantDate")} required>
                <LocalizedDateInput
                  value={toDateInputValue(salidaBarco.fecha)}
                  onChange={updateTextField("fecha")}
                />
              </Field>
              <Field label={t("colorantShipCode")}>
                <Input value={String(salidaBarco.codBarco || "")} disabled />
              </Field>
              <Field label={t("colorantShip")} required>
                <div className={styles.lookupField}>
                  <Input
                    className={styles.lookupInput}
                    value={salidaBarco.barco}
                    readOnly
                    placeholder={t("selectOption")}
                    aria-label={t("colorantShip")}
                    onClick={openBarcoDialog}
                  />
                  <Button appearance="secondary" icon={<Search />} onClick={openBarcoDialog}>
                    {t("colorantSelectShip")}
                  </Button>
                </div>
              </Field>
              <Field label={t("colorantPartnerCode")}>
                <Input value={String(salidaBarco.codSuplidor || "")} disabled />
              </Field>
              <Field label={t("colorantPartner")} required>
                <Select
                  value={String(salidaBarco.codSuplidor || "")}
                  onChange={updateNumberField("codSuplidor")}
                >
                  <option value="">{t("selectOption")}</option>
                  {socios.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.text}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label={t("colorantQuantity")} required>
                <Input
                  type="number"
                  value={String(salidaBarco.cantidad ?? 0)}
                  onChange={updateNumberField("cantidad")}
                />
              </Field>
              <Field label={t("colorantTheoreticalConsumption")}>
                <Input value={String(salidaBarco.consumoTeorico ?? "")} disabled />
              </Field>
              <Field label={t("colorantPg")}>
                <Input value={String(salidaBarco.pg ?? "")} disabled />
              </Field>
              <Field label={t("colorantPgPercentage")}>
                <Input value={String(salidaBarco.porcentajePg ?? "")} disabled />
              </Field>
            </div>

            <div className={styles.buttonRow}>
              <ListActionButton
                action="salida"
                label={t("save")}
                text={saving ? t("saving") : t("save")}
                disabled={saving}
                onClick={save}
              />
            </div>
          </>
        )}
      </div>

      <Dialog open={barcoDialogOpen} onOpenChange={(_, data) => setBarcoDialogOpen(data.open)}>
        <DialogSurface className={styles.lookupDialogSurface} data-lookup-dialog>
          <DialogBody>
            <DialogTitle>{t("colorantShipSearchTitle")}</DialogTitle>
            <DialogContent className={styles.lookupDialogContent}>
              <Input
                value={barcoSearch}
                onChange={(_, data) => setBarcoSearch(data.value)}
                contentBefore={<Search />}
                placeholder={t("searchShips")}
                aria-label={t("searchShips")}
              />
              <Text className={styles.lookupDialogHint}>
                {barcoSearch.trim()
                  ? t("shipListCount", { count: barcos.length })
                  : t("colorantRecentShipsHint")}
              </Text>

              {barcoError ? <MessageBar intent="error">{barcoError}</MessageBar> : null}

              {loadingBarcos ? (
                <div className={styles.lookupLoading}>
                  <Spinner label={t("loadingShips")} />
                </div>
              ) : barcos.length > 0 ? (
                <div className={styles.lookupResults}>
                  {barcos.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={styles.lookupResultButton}
                      onClick={() => selectBarco(option)}
                    >
                      <span className={styles.lookupResultName}>{option.text}</span>
                      <span className={styles.lookupResultMeta}>
                        {t("shipCode")}: {option.value}
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <Text className={styles.lookupEmpty}>{t("noShipsFound")}</Text>
              )}
            </DialogContent>
            <DialogActions>
              <ListActionButton
                action="regresar"
                label={t("back")}
                text={t("back")}
                onClick={() => setBarcoDialogOpen(false)}
              />
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </section>
  );
}

export default ColoranteSalidaBarcoPage;
