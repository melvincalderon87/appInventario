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
  Select,
  Spinner,
  Text,
  Title2,
} from "@/components/ui/app-shadcn";
import { Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import { formSchemas } from "../../validations/formSchemas";
import { setZodValidationError } from "../../validations/zodValidation";
import { useNavigate, useParams } from "react-router-dom";
import { ListActionButton } from "../../components/common/ListActionButton";
import { LocalizedDateInput } from "../../components/common/LocalizedDateInput";
import { PERMISOS } from "../../config/permisos";
import { validarPermiso } from "../../services/authService";
import { BarcoService } from "../../services/barcoService";
import { CompaniaInspeccionService } from "../../services/companiaInspeccionService";
import { MedicionTanqueTierraService } from "../../services/medicionTanqueTierraService";
import { ProductoService } from "../../services/productoService";
import { SuplidorService } from "../../services/suplidorService";
import { TanqueService } from "../../services/tanqueService";
import {
  getMedicionTanqueTierraActionPageThemeStyles,
  useMedicionTanqueTierraActionPageStyles,
} from "../../styles/pages/medicionTanqueTierra/medicionTanqueTierraActionPageStyles";

function createEmptyDetalle() {
  return {
    clientId: crypto.randomUUID(),
    idMedicionTanqueTierraDetalle: "",
    codMedicionTanqueTierraDetalle: 0,
    codMedicionTanqueTierra: 0,
    linea: 0,
    codTanque: "",
    tanque: "",
    tipo: "",
    fecha: "",
    hora: "",
    pies: 0,
    pulgadas: 0,
    dieciseisavos: 0,
    volumen: 0,
    correccionTecho: 0,
    medidaAguaPies: 0,
    medidaAguaPulgadas: 0,
    volumenAguaLibre: 0,
    volumenBrutoObservado: 0,
    temperatura: 0,
    api: 0,
    factor: 0,
    volumenEstandarBruto: 0,
  };
}

function createEmptyMedicion() {
  return {
    idMedicionTanqueTierra: "",
    codMedicionTanqueTierra: 0,
    fecha: new Date().toISOString().slice(0, 10),
    codBarco: 0,
    codSuplidor: 0,
    codProducto: 0,
    codCompaniaInspeccion: 0,
    detalles: [createEmptyDetalle()],
  };
}

function toNumber(value) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
}

function toText(value) {
  return String(value ?? "").trim();
}

function toDateInputValue(value) {
  if (!value) return "";
  return String(value).slice(0, 10);
}

function toTimeInputValue(value) {
  if (!value) return "";
  const text = String(value);
  if (text.includes("T")) return text.slice(11, 16);
  return text.slice(0, 5);
}

function normalizeDetalle(detalle) {
  return {
    ...createEmptyDetalle(),
    ...detalle,
    clientId: crypto.randomUUID(),
    tipo: detalle?.tipo ?? detalle?.Tipo ?? detalle?.siOC ?? detalle?.siOc ?? detalle?.SiOC ?? "",
    fecha: toDateInputValue(detalle?.fecha ?? detalle?.Fecha ?? detalle?.fechaHora),
    hora: toTimeInputValue(detalle?.hora ?? detalle?.Hora ?? detalle?.fechaHora),
    codTanque: toText(detalle?.codTanque),
    pies: toNumber(detalle?.pies),
    pulgadas: toNumber(detalle?.pulgadas),
    dieciseisavos: toNumber(detalle?.dieciseisavos),
    volumen: toNumber(detalle?.volumen),
    correccionTecho: toNumber(detalle?.correccionTecho),
    medidaAguaPies: toNumber(detalle?.medidaAguaPies),
    medidaAguaPulgadas: toNumber(detalle?.medidaAguaPulgadas),
    volumenAguaLibre: toNumber(detalle?.volumenAguaLibre),
    volumenBrutoObservado: toNumber(detalle?.volumenBrutoObservado),
    temperatura: toNumber(detalle?.temperatura),
    api: toNumber(detalle?.api),
    factor: toNumber(detalle?.factor),
    volumenEstandarBruto: toNumber(detalle?.volumenEstandarBruto),
  };
}

function normalizeMedicion(data) {
  return {
    ...createEmptyMedicion(),
    ...data,
    fecha: toDateInputValue(data?.fecha),
    detalles:
      Array.isArray(data?.detalles) && data.detalles.length > 0
        ? data.detalles.map(normalizeDetalle)
        : [createEmptyDetalle()],
  };
}

function buildPayload(medicion) {
  return {
    idMedicionTanqueTierra: medicion.idMedicionTanqueTierra,
    codMedicionTanqueTierra: toNumber(medicion.codMedicionTanqueTierra),
    fecha: toDateInputValue(medicion.fecha),
    codBarco: toNumber(medicion.codBarco),
    codSuplidor: toNumber(medicion.codSuplidor),
    codProducto: toNumber(medicion.codProducto),
    codCompaniaInspeccion: toNumber(medicion.codCompaniaInspeccion),
    detalles: (medicion.detalles || []).map((detalle, index) => ({
      idMedicionTanqueTierraDetalle: detalle.idMedicionTanqueTierraDetalle,
      codMedicionTanqueTierraDetalle: toNumber(detalle.codMedicionTanqueTierraDetalle),
      codMedicionTanqueTierra: toNumber(medicion.codMedicionTanqueTierra),
      linea: index + 1,
      codTanque: toText(detalle.codTanque),
      tipo: String(detalle.tipo ?? "")
        .trim()
        .toUpperCase(),
      fecha: toDateInputValue(detalle.fecha),
      hora: toTimeInputValue(detalle.hora),
      pies: toNumber(detalle.pies),
      pulgadas: toNumber(detalle.pulgadas),
      dieciseisavos: toNumber(detalle.dieciseisavos),
      volumen: toNumber(detalle.volumen),
      correccionTecho: toNumber(detalle.correccionTecho),
      medidaAguaPies: toNumber(detalle.medidaAguaPies),
      medidaAguaPulgadas: toNumber(detalle.medidaAguaPulgadas),
      volumenAguaLibre: toNumber(detalle.volumenAguaLibre),
      volumenBrutoObservado: toNumber(detalle.volumenBrutoObservado),
      temperatura: toNumber(detalle.temperatura),
      api: toNumber(detalle.api),
      factor: toNumber(detalle.factor),
      volumenEstandarBruto: toNumber(detalle.volumenEstandarBruto),
    })),
  };
}

function MedicionTanqueTierraFormPage({ mode }) {
  const styles = useMedicionTanqueTierraActionPageStyles();
  const themeStyles = getMedicionTanqueTierraActionPageThemeStyles();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { idMedicionTanqueTierra = "" } = useParams();
  const { values: medicion, setValues: setMedicion } = useFormStateAdapter(createEmptyMedicion());
  const [barcos, setBarcos] = useState([]);
  const [barcosRecientes, setBarcosRecientes] = useState([]);
  const [socios, setSocios] = useState([]);
  const [productos, setProductos] = useState([]);
  const [companiasInspeccion, setCompaniasInspeccion] = useState([]);
  const [tanques, setTanques] = useState([]);
  const [loading, setLoading] = useState(mode !== "agregar");
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [saving, setSaving] = useState(false);
  const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false);
  const [lookup, setLookup] = useState(null);
  const [lookupSearch, setLookupSearch] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const isAdd = mode === "agregar";
  const isView = mode === "visualizar";
  const isEdit = mode === "editar";
  const isDelete = mode === "eliminar";
  const canEditFields = isAdd || isEdit;
  const isBusy = loading || loadingOptions;
  const filteredLookupOptions = useMemo(() => {
    const lookupOptions = lookup?.options ?? [];
    const search = lookupSearch.trim().toLocaleLowerCase();
    if (!search) return lookupOptions;
    return lookupOptions.filter((option) =>
      `${option.value ?? ""} ${option.text ?? ""}`.toLocaleLowerCase().includes(search)
    );
  }, [lookup, lookupSearch]);

  useEffect(() => {
    let isMounted = true;

    async function loadOptions() {
      try {
        setLoadingOptions(true);
        setError("");
        const [
          barcoOptions,
          barcoRecienteOptions,
          socioOptions,
          productoOptions,
          companiaOptions,
          tanqueOptions,
        ] = await Promise.all([
          BarcoService.ListarOpcion(),
          BarcoService.ListarIngresadosRecientementeOpcion(),
          SuplidorService.ListarOpcion(),
          ProductoService.ListarOpcion(),
          CompaniaInspeccionService.ListarOpcion(),
          TanqueService.ListarOpcion(),
        ]);

        if (isMounted) {
          setBarcos(Array.isArray(barcoOptions) ? barcoOptions : []);
          setBarcosRecientes(Array.isArray(barcoRecienteOptions) ? barcoRecienteOptions : []);
          setSocios(Array.isArray(socioOptions) ? socioOptions : []);
          setProductos(Array.isArray(productoOptions) ? productoOptions : []);
          setCompaniasInspeccion(Array.isArray(companiaOptions) ? companiaOptions : []);
          setTanques(Array.isArray(tanqueOptions) ? tanqueOptions : []);
        }
      } catch (loadError) {
        if (isMounted) setError(loadError.message || t("groundTankMeasurementOptionsLoadError"));
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
    if (isAdd) {
      setLoading(false);
      return undefined;
    }

    let isMounted = true;

    async function loadMedicion() {
      try {
        setLoading(true);
        setError("");
        const data = await MedicionTanqueTierraService.obtener(idMedicionTanqueTierra);
        if (isMounted) setMedicion(normalizeMedicion(data));
      } catch (loadError) {
        if (isMounted) setError(loadError.message || t("groundTankMeasurementLoadError"));
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadMedicion();

    return () => {
      isMounted = false;
    };
  }, [idMedicionTanqueTierra, isAdd, setMedicion, t]);

  const updateTextField = (key) => (_, data) => {
    setMedicion((current) => ({
      ...current,
      [key]: data.value,
    }));
  };

  const updateDetailTextField = (clientId, key) => (_, data) => {
    setMedicion((current) => ({
      ...current,
      detalles: current.detalles.map((detalle) =>
        detalle.clientId === clientId ? { ...detalle, [key]: data.value } : detalle
      ),
    }));
  };

  const updateDetailNumberField = (clientId, key) => (_, data) => {
    setMedicion((current) => ({
      ...current,
      detalles: current.detalles.map((detalle) =>
        detalle.clientId === clientId ? { ...detalle, [key]: toNumber(data.value) } : detalle
      ),
    }));
  };

  useEffect(() => {
    if (!canEditFields || !medicion.codProducto) return;
    (medicion.detalles || []).forEach(async (detalle) => {
      if (
        !detalle.codTanque ||
        detalle.pies < 0 ||
        detalle.pulgadas < 0 ||
        detalle.dieciseisavos < 0
      )
        return;
      try {
        const data = await MedicionTanqueTierraService.volumenCalibracion({
          codTanque: detalle.codTanque,
          codProducto: medicion.codProducto,
          pies: detalle.pies,
          pulgadas: detalle.pulgadas,
          dieciseisavos: detalle.dieciseisavos,
        });
        setMedicion((current) => ({
          ...current,
          detalles: current.detalles.map((item) => {
            if (
              item.clientId !== detalle.clientId ||
              toNumber(item.volumen) === toNumber(data.volumen)
            )
              return item;
            return { ...item, volumen: toNumber(data.volumen) };
          }),
        }));
      } catch {
        /* La validacion del guardado mostrara el error si no existe calibracion. */
      }
    });
  }, [canEditFields, medicion.codProducto, medicion.detalles, setMedicion]);

  const openLookup = (key, labelKey, options, clientId = "") => {
    if (!canEditFields) return;
    setLookupSearch("");
    setLookup({ key, labelKey, options, clientId });
  };

  const selectLookupOption = (option) => {
    if (!lookup) return;
    if (lookup.clientId) {
      setMedicion((current) => ({
        ...current,
        detalles: current.detalles.map((detalle) =>
          detalle.clientId === lookup.clientId
            ? { ...detalle, [lookup.key]: String(option.value ?? "") }
            : detalle
        ),
      }));
    } else {
      setMedicion((current) => ({ ...current, [lookup.key]: toNumber(option.value) }));
    }
    setLookup(null);
  };

  const lookupText = (options, value) =>
    options.find((option) => String(option.value) === String(value))?.text ?? "";

  const addDetalle = () => {
    setMedicion((current) => ({
      ...current,
      detalles: [...current.detalles, createEmptyDetalle()],
    }));
  };

  const removeDetalle = (clientId) => {
    setMedicion((current) => {
      const detalles = current.detalles.filter((detalle) => detalle.clientId !== clientId);
      return {
        ...current,
        detalles: detalles.length > 0 ? detalles : [createEmptyDetalle()],
      };
    });
  };

  const back = () => navigate("/mediciontanquetierra/listar");

  const goEdit = async () => {
    const response = await validarPermiso({
      ruta: "/mediciontanquetierra/editar",
      codpermiso: PERMISOS.editar,
    });

    if (response.authenticated === false) {
      navigate("/");
      return;
    }

    if (!response.authorized) {
      navigate("/inicio");
      return;
    }

    navigate(`/mediciontanquetierra/editar/${encodeURIComponent(idMedicionTanqueTierra)}`);
  };

  const validate = (payload) =>
    setZodValidationError(formSchemas.medicionTanqueTierra, payload, t, setError).ok;

  const save = async () => {
    try {
      setSaving(true);
      setError("");
      setMessage("");

      const payload = buildPayload(medicion);

      if (isDelete) {
        await MedicionTanqueTierraService.eliminar(payload);
        navigate("/mediciontanquetierra/listar");
        return;
      }

      if (!validate(payload)) return;

      if (isAdd) {
        await MedicionTanqueTierraService.agregar(payload);
        setMessage(t("groundTankMeasurementAdded"));
        setMedicion(createEmptyMedicion());
      }

      if (isEdit) {
        await MedicionTanqueTierraService.editar(payload);
        setMessage(t("groundTankMeasurementSaved"));
      }
    } catch (saveError) {
      setError(saveError.message || t("groundTankMeasurementSaveError"));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    setOpenDeleteConfirm(false);
    await save();
  };

  const titleKey = {
    agregar: "groundTankMeasurementAddTitle",
    visualizar: "groundTankMeasurementViewTitle",
    editar: "groundTankMeasurementEditTitle",
    eliminar: "groundTankMeasurementDeleteTitle",
  }[mode];

  const medicionLabel = `${medicion.codMedicionTanqueTierra || ""} ${toDateInputValue(medicion.fecha)}`;

  return (
    <section className={styles.root}>
      <div className={styles.toolbar}>
        <div>
          <Title2 className={styles.title}>{t(titleKey)}</Title2>
        </div>
        <ListActionButton action="regresar" label={t("back")} text={t("back")} onClick={back} />
      </div>

      {error ? <MessageBar intent="error">{error}</MessageBar> : null}
      {message ? <MessageBar intent="success">{message}</MessageBar> : null}

      <div className={styles.formSurface} style={themeStyles.surface}>
        {isBusy ? (
          <div className={styles.loading}>
            <Spinner label={t("loadingGroundTankMeasurement")} />
          </div>
        ) : (
          <>
            {isDelete ? (
              <MessageBar intent="warning">
                {t("deleteGroundTankMeasurementConfirmation", { measurement: medicionLabel })}
              </MessageBar>
            ) : null}

            <div className={styles.formGrid}>
              {!isAdd ? (
                <Field label={t("groundTankMeasurementCode")}>
                  <Input value={String(medicion.codMedicionTanqueTierra ?? "")} disabled />
                </Field>
              ) : null}
              <Field label={t("groundTankMeasurementDate")} required={canEditFields}>
                <LocalizedDateInput
                  value={toDateInputValue(medicion.fecha)}
                  disabled={!canEditFields}
                  onChange={updateTextField("fecha")}
                />
              </Field>
              <Field label={t("groundTankMeasurementShip")} required={canEditFields}>
                <div className={styles.lookupField}>
                  <Input
                    value={lookupText(barcos, medicion.codBarco)}
                    readOnly
                    disabled={!canEditFields}
                    placeholder={t("selectOption")}
                    onClick={() =>
                      openLookup("codBarco", "groundTankMeasurementShip", barcosRecientes)
                    }
                  />
                  <Button
                    appearance="secondary"
                    icon={<Search />}
                    disabled={!canEditFields}
                    onClick={() =>
                      openLookup("codBarco", "groundTankMeasurementShip", barcosRecientes)
                    }
                  >
                    {t("search")}
                  </Button>
                </div>
              </Field>
              <Field label={t("groundTankMeasurementPartner")} required={canEditFields}>
                <div className={styles.lookupField}>
                  <Input
                    value={lookupText(socios, medicion.codSuplidor)}
                    readOnly
                    disabled={!canEditFields}
                    placeholder={t("selectOption")}
                    onClick={() =>
                      openLookup("codSuplidor", "groundTankMeasurementPartner", socios)
                    }
                  />
                  <Button
                    appearance="secondary"
                    icon={<Search />}
                    disabled={!canEditFields}
                    onClick={() =>
                      openLookup("codSuplidor", "groundTankMeasurementPartner", socios)
                    }
                  >
                    {t("search")}
                  </Button>
                </div>
              </Field>
              <Field label={t("groundTankMeasurementProduct")} required={canEditFields}>
                <div className={styles.lookupField}>
                  <Input
                    value={lookupText(productos, medicion.codProducto)}
                    readOnly
                    disabled={!canEditFields}
                    placeholder={t("selectOption")}
                    onClick={() =>
                      openLookup("codProducto", "groundTankMeasurementProduct", productos)
                    }
                  />
                  <Button
                    appearance="secondary"
                    icon={<Search />}
                    disabled={!canEditFields}
                    onClick={() =>
                      openLookup("codProducto", "groundTankMeasurementProduct", productos)
                    }
                  >
                    {t("search")}
                  </Button>
                </div>
              </Field>
              <Field label={t("groundTankMeasurementInspectionCompany")} required={canEditFields}>
                <div className={styles.lookupField}>
                  <Input
                    value={lookupText(companiasInspeccion, medicion.codCompaniaInspeccion)}
                    readOnly
                    disabled={!canEditFields}
                    placeholder={t("selectOption")}
                    onClick={() =>
                      openLookup(
                        "codCompaniaInspeccion",
                        "groundTankMeasurementInspectionCompany",
                        companiasInspeccion
                      )
                    }
                  />
                  <Button
                    appearance="secondary"
                    icon={<Search />}
                    disabled={!canEditFields}
                    onClick={() =>
                      openLookup(
                        "codCompaniaInspeccion",
                        "groundTankMeasurementInspectionCompany",
                        companiasInspeccion
                      )
                    }
                  >
                    {t("search")}
                  </Button>
                </div>
              </Field>
            </div>

            <div className={styles.detailSection}>
              <div className={styles.detailHeader}>
                <Text weight="semibold" className={styles.detailTitle}>
                  {t("groundTankMeasurementDetails")}
                </Text>
                {canEditFields ? (
                  <ListActionButton
                    action="agregar"
                    label={t("groundTankMeasurementAddDetail")}
                    text={t("groundTankMeasurementAddDetail")}
                    onClick={addDetalle}
                  />
                ) : null}
              </div>

              <div className={styles.detailRows}>
                {(medicion.detalles || []).map((detalle, index) => (
                  <div
                    key={detalle.clientId}
                    className={styles.detailRow}
                    style={themeStyles.detailRow}
                  >
                    <div className={styles.detailRowHeader}>
                      <Field label={t("groundTankMeasurementDetailTank")} required={canEditFields}>
                        <div className={styles.lookupField}>
                          <Input
                            value={lookupText(tanques, detalle.codTanque)}
                            readOnly
                            disabled={!canEditFields}
                            placeholder={t("selectOption")}
                            onClick={() =>
                              openLookup(
                                "codTanque",
                                "groundTankMeasurementDetailTank",
                                tanques,
                                detalle.clientId
                              )
                            }
                          />
                          <Button
                            appearance="secondary"
                            icon={<Search />}
                            disabled={!canEditFields}
                            onClick={() =>
                              openLookup(
                                "codTanque",
                                "groundTankMeasurementDetailTank",
                                tanques,
                                detalle.clientId
                              )
                            }
                          >
                            {t("search")}
                          </Button>
                        </div>
                      </Field>
                      <Field label={t("groundTankMeasurementType")} required={canEditFields}>
                        <Select
                          value={detalle.tipo ?? ""}
                          disabled={!canEditFields}
                          onChange={updateDetailTextField(detalle.clientId, "tipo")}
                        >
                          <option value="">{t("selectOption")}</option>
                          <option value="O">O</option>
                          <option value="C">C</option>
                        </Select>
                      </Field>
                      <Field label={t("groundTankMeasurementDetailDate")} required={canEditFields}>
                        <LocalizedDateInput
                          value={toDateInputValue(detalle.fecha)}
                          disabled={!canEditFields}
                          onChange={updateDetailTextField(detalle.clientId, "fecha")}
                        />
                      </Field>
                      <Field label={t("groundTankMeasurementDetailTime")} required={canEditFields}>
                        <Input
                          type="time"
                          value={toTimeInputValue(detalle.hora)}
                          disabled={!canEditFields}
                          onChange={updateDetailTextField(detalle.clientId, "hora")}
                        />
                      </Field>
                      <div className={styles.detailActions}>
                        {canEditFields ? (
                          <ListActionButton
                            action="eliminar"
                            label={t("delete")}
                            disabled={(medicion.detalles || []).length === 1 && index === 0}
                            onClick={() => removeDetalle(detalle.clientId)}
                          />
                        ) : null}
                      </div>
                    </div>

                    <div className={styles.measurementFrames}>
                      <fieldset className={styles.measurementFrame}>
                        <legend className={styles.measurementFrameTitle}>
                          {t("groundTankMeasurementTankMeasureFrame")}
                        </legend>
                        <div className={styles.tankMeasurementGrid}>
                          <Field label={t("groundTankMeasurementFeetShort")}>
                            <Input
                              type="number"
                              value={String(detalle.pies ?? 0)}
                              disabled={!canEditFields}
                              onChange={updateDetailNumberField(detalle.clientId, "pies")}
                            />
                          </Field>
                          <Field label={t("groundTankMeasurementInchesShort")}>
                            <Input
                              type="number"
                              value={String(detalle.pulgadas ?? 0)}
                              disabled={!canEditFields}
                              onChange={updateDetailNumberField(detalle.clientId, "pulgadas")}
                            />
                          </Field>
                          <Field label={t("groundTankMeasurementFractionNumeratorShort")}>
                            <Input
                              type="number"
                              value={String(detalle.dieciseisavos ?? 0)}
                              disabled={!canEditFields}
                              onChange={updateDetailNumberField(detalle.clientId, "dieciseisavos")}
                            />
                          </Field>
                          <Field label={t("groundTankMeasurementTotalVolume")}>
                            <Input
                              type="number"
                              step="0.0001"
                              value={String(detalle.volumen ?? 0)}
                              disabled
                            />
                          </Field>
                        </div>
                      </fieldset>

                      <fieldset className={styles.measurementFrame}>
                        <legend className={styles.measurementFrameTitle}>
                          {t("groundTankMeasurementWaterMeasureFrame")}
                        </legend>
                        <div className={styles.waterMeasurementGrid}>
                          <Field label={t("groundTankMeasurementFeetShort")}>
                            <Input
                              type="number"
                              value={String(detalle.medidaAguaPies ?? 0)}
                              disabled={!canEditFields}
                              onChange={updateDetailNumberField(detalle.clientId, "medidaAguaPies")}
                            />
                          </Field>
                          <Field label={t("groundTankMeasurementInchesShort")}>
                            <Input
                              type="number"
                              value={String(detalle.medidaAguaPulgadas ?? 0)}
                              disabled={!canEditFields}
                              onChange={updateDetailNumberField(
                                detalle.clientId,
                                "medidaAguaPulgadas"
                              )}
                            />
                          </Field>
                          <Field label={t("groundTankMeasurementFreeWaterVolume")}>
                            <Input
                              type="number"
                              step="0.0001"
                              value={String(detalle.volumenAguaLibre ?? 0)}
                              disabled={!canEditFields}
                              onChange={updateDetailNumberField(
                                detalle.clientId,
                                "volumenAguaLibre"
                              )}
                            />
                          </Field>
                        </div>
                      </fieldset>
                    </div>

                    <div className={styles.detailGrid}>
                      <Field label={t("groundTankMeasurementRoofCorrection")}>
                        <Input
                          type="number"
                          step="0.0001"
                          value={String(detalle.correccionTecho ?? 0)}
                          disabled={!canEditFields}
                          onChange={updateDetailNumberField(detalle.clientId, "correccionTecho")}
                        />
                      </Field>
                      <Field
                        label={t("groundTankMeasurementObservedGrossVolume")}
                        required={canEditFields}
                      >
                        <Input
                          type="number"
                          step="0.0001"
                          value={String(detalle.volumenBrutoObservado ?? 0)}
                          disabled={!canEditFields}
                          onChange={updateDetailNumberField(
                            detalle.clientId,
                            "volumenBrutoObservado"
                          )}
                        />
                      </Field>
                      <Field label={t("groundTankMeasurementTemperature")} required={canEditFields}>
                        <Input
                          type="number"
                          step="0.0001"
                          value={String(detalle.temperatura ?? 0)}
                          disabled={!canEditFields}
                          onChange={updateDetailNumberField(detalle.clientId, "temperatura")}
                        />
                      </Field>
                      <Field label={t("groundTankMeasurementApi")} required={canEditFields}>
                        <Input
                          type="number"
                          step="0.0001"
                          value={String(detalle.api ?? 0)}
                          disabled={!canEditFields}
                          onChange={updateDetailNumberField(detalle.clientId, "api")}
                        />
                      </Field>
                      <Field label={t("groundTankMeasurementFactor")} required={canEditFields}>
                        <Input
                          type="number"
                          step="0.00000001"
                          value={String(detalle.factor ?? 0)}
                          disabled={!canEditFields}
                          onChange={updateDetailNumberField(detalle.clientId, "factor")}
                        />
                      </Field>
                      <Field
                        label={t("groundTankMeasurementStandardGrossVolume")}
                        required={canEditFields}
                      >
                        <Input
                          type="number"
                          step="0.0001"
                          value={String(detalle.volumenEstandarBruto ?? 0)}
                          disabled={!canEditFields}
                          onChange={updateDetailNumberField(
                            detalle.clientId,
                            "volumenEstandarBruto"
                          )}
                        />
                      </Field>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.buttonRow}>
              {isView ? (
                <ListActionButton
                  action="editar"
                  label={t("edit")}
                  text={t("edit")}
                  onClick={goEdit}
                />
              ) : null}
              {isAdd ? (
                <ListActionButton
                  action="agregar"
                  label={t("add")}
                  text={saving ? t("saving") : t("add")}
                  disabled={saving}
                  onClick={save}
                />
              ) : null}
              {isEdit ? (
                <ListActionButton
                  action="editar"
                  label={t("save")}
                  text={saving ? t("saving") : t("save")}
                  disabled={saving}
                  onClick={save}
                />
              ) : null}
              {isDelete ? (
                <ListActionButton
                  action="eliminar"
                  label={t("confirmDelete")}
                  text={saving ? t("deleting") : t("confirmDelete")}
                  disabled={saving}
                  onClick={() => setOpenDeleteConfirm(true)}
                />
              ) : null}
            </div>
          </>
        )}
      </div>

      <Dialog open={openDeleteConfirm} onOpenChange={(_, data) => setOpenDeleteConfirm(data.open)}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>{t("confirmDelete")}</DialogTitle>
            <DialogContent>
              {t("deleteGroundTankMeasurementConfirmation", { measurement: medicionLabel })}
            </DialogContent>
            <DialogActions>
              <ListActionButton
                action="regresar"
                label={t("back")}
                text={t("back")}
                onClick={() => setOpenDeleteConfirm(false)}
              />
              <ListActionButton
                action="eliminar"
                label={t("confirmDelete")}
                text={saving ? t("deleting") : t("confirmDelete")}
                disabled={saving}
                onClick={confirmDelete}
              />
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      <Dialog open={Boolean(lookup)} onOpenChange={(_, data) => !data.open && setLookup(null)}>
        <DialogSurface className={styles.lookupDialogSurface} data-lookup-dialog>
          <DialogBody>
            <DialogTitle>
              {lookup ? t("groundTankMeasurementLookupTitle", { field: t(lookup.labelKey) }) : ""}
            </DialogTitle>
            <DialogContent className={styles.lookupDialogContent}>
              <Input
                value={lookupSearch}
                onChange={(_, data) => setLookupSearch(data.value)}
                contentBefore={<Search />}
                placeholder={t("groundTankMeasurementLookupPlaceholder")}
              />
              {filteredLookupOptions.length > 0 ? (
                <div className={styles.lookupResults}>
                  {filteredLookupOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={styles.lookupResultButton}
                      onClick={() => selectLookupOption(option)}
                    >
                      <span>{option.text}</span>
                      <span className={styles.lookupResultMeta}>{option.value}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <Text className={styles.lookupEmpty}>{t("groundTankMeasurementLookupEmpty")}</Text>
              )}
            </DialogContent>
            <DialogActions>
              <ListActionButton
                action="regresar"
                label={t("back")}
                text={t("back")}
                onClick={() => setLookup(null)}
              />
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </section>
  );
}

export default MedicionTanqueTierraFormPage;
