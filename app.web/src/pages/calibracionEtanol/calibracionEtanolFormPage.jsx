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
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
  Text,
  Textarea,
  Title2,
} from "@/components/ui/app-shadcn";
import { Check, Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { ListActionButton } from "../../components/common/ListActionButton";
import { LocalizedDateInput } from "../../components/common/LocalizedDateInput";
import { PERMISOS } from "../../config/permisos";
import { BahiaService } from "../../services/bahiaService";
import { CalibracionEtanolService } from "../../services/calibracionEtanolService";
import { CompaniaInspeccionService } from "../../services/companiaInspeccionService";
import { PersonalService } from "../../services/personalService";
import { validarPermiso } from "../../services/authService";
import { formSchemas } from "../../validations/formSchemas";
import { setZodValidationError } from "../../validations/zodValidation";
import {
  getCalibracionEtanolActionPageThemeStyles,
  useCalibracionEtanolActionPageStyles,
} from "../../styles/pages/calibracionEtanol/calibracionEtanolActionPageStyles";

const EMPTY_CALIBRACION = {
  fecha: "",
  codBahia: "",
  codBrazo: "",
  codProducto: 0,
  codPersonal: 0,
  codCompaniaInspeccion: 0,
  cantidadCalibracion: 0,
  horaInicio: "",
  horaFinal: "",
  factorCalibracion: "",
  porcentajeDesviacion: "",
  volumenBrutoFinalDespuesCalibrar: "",
  volumenFinalCalibracionAnterior: "",
  volumenEncontradoInicialCalibracion: "",
  proximoVolumenACalibrar: "",
  volumenDespachado: "",
  comentarios: "",
  temperaturaRack: "",
  temperaturaSerafin: "",
  estatus: true,
};

function toNumber(value) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
}

function toOptionalNumber(value) {
  const text = String(value ?? "").trim();
  if (!text) return null;

  const numericValue = Number(text);
  return Number.isFinite(numericValue) ? numericValue : null;
}

function pad(value) {
  return String(value).padStart(2, "0");
}

function toDateInputValue(value) {
  if (!value) return "";
  const text = String(value).trim();
  return text.includes("T") ? text.split("T")[0] : text.slice(0, 10);
}

function toTimeInputValue(value) {
  if (!value) return "";
  return String(value).slice(0, 5);
}

function addDaysToDateValue(value, days) {
  if (!value) return "";

  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return "";

  const date = new Date(Date.UTC(year, month - 1, day + days));
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

function timeValueToMinutes(value) {
  if (!value) return null;

  const [hours, minutes] = value.split(":").map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;

  return hours * 60 + minutes;
}

function calculateTotalMinutes(startValue, endValue) {
  const start = timeValueToMinutes(startValue);
  const end = timeValueToMinutes(endValue);

  if (start === null || end === null) return null;

  return end >= start ? end - start : end + 24 * 60 - start;
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

function normalizeCalibracion(data) {
  return {
    ...EMPTY_CALIBRACION,
    ...data,
    fecha: toDateInputValue(data?.fecha),
    proximaFecha: toDateInputValue(data?.proximaFecha),
    horaInicio: toTimeInputValue(data?.horaInicio),
    horaFinal: toTimeInputValue(data?.horaFinal),
    factorCalibracion: data?.factorCalibracion ?? "",
    porcentajeDesviacion: data?.porcentajeDesviacion ?? "",
    volumenBrutoFinalDespuesCalibrar: data?.volumenBrutoFinalDespuesCalibrar ?? "",
    volumenFinalCalibracionAnterior: data?.volumenFinalCalibracionAnterior ?? "",
    volumenEncontradoInicialCalibracion: data?.volumenEncontradoInicialCalibracion ?? "",
    proximoVolumenACalibrar: data?.proximoVolumenACalibrar ?? "",
    volumenDespachado: data?.volumenDespachado ?? "",
    comentarios: data?.comentarios ?? "",
    temperaturaRack: data?.temperaturaRack ?? "",
    temperaturaSerafin: data?.temperaturaSerafin ?? "",
    estatus: data?.estatus !== false,
  };
}

function CalibracionEtanolFormPage({ mode }) {
  const styles = useCalibracionEtanolActionPageStyles();
  const themeStyles = getCalibracionEtanolActionPageThemeStyles();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { idCalibracionEtanol = "" } = useParams();
  const { values: calibracion, setValues: setCalibracion } = useFormStateAdapter(EMPTY_CALIBRACION);
  const [bahias, setBahias] = useState([]);
  const [brazos, setBrazos] = useState([]);
  const [productos, setProductos] = useState([]);
  const [tecnicos, setTecnicos] = useState([]);
  const [companiasInspeccion, setCompaniasInspeccion] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingBrazos, setLoadingBrazos] = useState(false);
  const [saving, setSaving] = useState(false);
  const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false);
  const [lookupType, setLookupType] = useState("");
  const [lookupSearch, setLookupSearch] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const isAdd = mode === "add";
  const isView = mode === "view";
  const isEdit = mode === "edit";
  const isDelete = mode === "delete";
  const canEditFields = isAdd || isEdit;
  const titleKey = {
    add: "ethanolCalibrationTitle",
    view: "ethanolCalibrationViewTitle",
    edit: "ethanolCalibrationEditTitle",
    delete: "ethanolCalibrationDeleteTitle",
  }[mode];
  const proximaFecha = useMemo(
    () => addDaysToDateValue(calibracion.fecha, 75),
    [calibracion.fecha]
  );
  const tiempoTotal = useMemo(
    () => calculateTotalMinutes(calibracion.horaInicio, calibracion.horaFinal),
    [calibracion.horaInicio, calibracion.horaFinal]
  );
  const diferenciaTemperaturas = useMemo(() => {
    const temperaturaRack = toOptionalNumber(calibracion.temperaturaRack);
    const temperaturaSerafin = toOptionalNumber(calibracion.temperaturaSerafin);

    if (temperaturaRack === null || temperaturaSerafin === null) return null;

    return temperaturaRack - temperaturaSerafin;
  }, [calibracion.temperaturaRack, calibracion.temperaturaSerafin]);
  const lookupOptions = useMemo(() => {
    if (lookupType === "bahia") return bahias;
    if (lookupType === "brazo") return brazos;
    if (lookupType === "producto") return productos;
    if (lookupType === "tecnico") return tecnicos;
    if (lookupType === "compania") return companiasInspeccion;
    return [];
  }, [bahias, brazos, companiasInspeccion, lookupType, productos, tecnicos]);
  const filteredLookupOptions = useMemo(
    () => filterLookupOptions(lookupOptions, lookupSearch),
    [lookupOptions, lookupSearch]
  );
  const lookupTitleKey = {
    bahia: "ethanolCalibrationBaySearchTitle",
    brazo: "ethanolCalibrationArmSearchTitle",
    producto: "ethanolCalibrationProductSearchTitle",
    tecnico: "ethanolCalibrationTechnicianSearchTitle",
    compania: "ethanolCalibrationInspectionCompanySearchTitle",
  }[lookupType];
  const selectedBayLabel = getSelectedOptionText(bahias, calibracion.codBahia);
  const selectedArmLabel = getSelectedOptionText(brazos, calibracion.codBrazo);
  const selectedProductLabel = getSelectedOptionText(productos, calibracion.codProducto);
  const selectedTechnicianLabel = getSelectedOptionText(tecnicos, calibracion.codPersonal);
  const selectedInspectionCompanyLabel = getSelectedOptionText(
    companiasInspeccion,
    calibracion.codCompaniaInspeccion
  );

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        setLoading(true);
        setError("");
        const [bahiasData, productosData, tecnicosData, companiasInspeccionData, calibracionData] =
          await Promise.all([
            BahiaService.ListarOpcion(),
            CalibracionEtanolService.ListarProductoOpcion(),
            PersonalService.ListarTecnicoOpcion(),
            CompaniaInspeccionService.ListarOpcion(),
            isAdd ? Promise.resolve(null) : CalibracionEtanolService.obtener(idCalibracionEtanol),
          ]);

        if (!isMounted) return;

        setBahias(Array.isArray(bahiasData) ? bahiasData : []);
        setProductos(Array.isArray(productosData) ? productosData : []);
        setTecnicos(Array.isArray(tecnicosData) ? tecnicosData : []);
        setCompaniasInspeccion(
          Array.isArray(companiasInspeccionData) ? companiasInspeccionData : []
        );

        if (calibracionData) setCalibracion(normalizeCalibracion(calibracionData));
      } catch (loadError) {
        if (isMounted) setError(loadError.message || t("ethanolCalibrationLoadError"));
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    load();

    return () => {
      isMounted = false;
    };
  }, [idCalibracionEtanol, isAdd, setCalibracion, t]);

  useEffect(() => {
    let isMounted = true;

    async function loadBrazos() {
      if (!String(calibracion.codBahia ?? "").trim()) {
        setBrazos([]);
        return;
      }

      try {
        setLoadingBrazos(true);
        const brazosData = await CalibracionEtanolService.ListarBrazoOpcion(calibracion.codBahia);
        if (isMounted) setBrazos(Array.isArray(brazosData) ? brazosData : []);
      } catch (loadError) {
        if (isMounted) setError(loadError.message || t("ethanolCalibrationArmsLoadError"));
      } finally {
        if (isMounted) setLoadingBrazos(false);
      }
    }

    loadBrazos();

    return () => {
      isMounted = false;
    };
  }, [calibracion.codBahia, t]);

  const updateTextField = (key) => (_, data) => {
    setCalibracion((current) => ({
      ...current,
      [key]: data.value,
    }));
  };

  const updateNumberField = (key) => (_, data) => {
    setCalibracion((current) => ({
      ...current,
      [key]: toNumber(data.value),
    }));
  };

  const updateOptionalNumberField = (key) => (_, data) => {
    setCalibracion((current) => ({
      ...current,
      [key]: data.value,
    }));
  };

  const updateBoolField = (key) => (_, data) => {
    setCalibracion((current) => ({
      ...current,
      [key]: Boolean(data.checked),
    }));
  };

  const openLookupDialog = (type) => {
    if (!canEditFields || (type === "brazo" && (!calibracion.codBahia || loadingBrazos))) return;

    setLookupSearch("");
    setLookupType(type);
  };

  const closeLookupDialog = () => {
    setLookupType("");
    setLookupSearch("");
  };

  const selectLookupOption = (option) => {
    const value = optionValue(option);

    setCalibracion((current) => {
      if (lookupType === "bahia") return { ...current, codBahia: value, codBrazo: "" };
      if (lookupType === "brazo") return { ...current, codBrazo: value };
      if (lookupType === "producto") return { ...current, codProducto: toNumber(value) };
      if (lookupType === "tecnico") return { ...current, codPersonal: toNumber(value) };
      return { ...current, codCompaniaInspeccion: toNumber(value) };
    });

    closeLookupDialog();
  };

  const back = () => navigate("/calibracionetanol/listar");

  const goEdit = async () => {
    const response = await validarPermiso({
      ruta: "/calibracionetanol/editar",
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

    navigate(`/calibracionetanol/editar/${encodeURIComponent(idCalibracionEtanol)}`);
  };

  const buildPayload = () => ({
    ...calibracion,
    codCalibracionEtanol: toNumber(calibracion.codCalibracionEtanol),
    fecha: calibracion.fecha,
    proximaFecha,
    codBahia: String(calibracion.codBahia ?? "").trim(),
    codBrazo: String(calibracion.codBrazo ?? "").trim(),
    codProducto: toNumber(calibracion.codProducto),
    codPersonal: toNumber(calibracion.codPersonal),
    codCompaniaInspeccion: toNumber(calibracion.codCompaniaInspeccion),
    cantidadCalibracion: toNumber(calibracion.cantidadCalibracion),
    horaInicio: calibracion.horaInicio || null,
    horaFinal: calibracion.horaFinal || null,
    tiempoTotal,
    factorCalibracion: toOptionalNumber(calibracion.factorCalibracion),
    porcentajeDesviacion: toOptionalNumber(calibracion.porcentajeDesviacion),
    volumenBrutoFinalDespuesCalibrar: toOptionalNumber(
      calibracion.volumenBrutoFinalDespuesCalibrar
    ),
    volumenFinalCalibracionAnterior: toOptionalNumber(calibracion.volumenFinalCalibracionAnterior),
    volumenEncontradoInicialCalibracion: toOptionalNumber(
      calibracion.volumenEncontradoInicialCalibracion
    ),
    proximoVolumenACalibrar: toOptionalNumber(calibracion.proximoVolumenACalibrar),
    volumenDespachado: toOptionalNumber(calibracion.volumenDespachado),
    comentarios: calibracion.comentarios?.trim() || null,
    temperaturaRack: toOptionalNumber(calibracion.temperaturaRack),
    temperaturaSerafin: toOptionalNumber(calibracion.temperaturaSerafin),
    diferenciaTemperaturas,
    estatus: calibracion.estatus !== false,
  });

  const save = async () => {
    try {
      setSaving(true);
      setError("");
      setMessage("");

      const payload = buildPayload();

      if (
        (isAdd || isEdit) &&
        !setZodValidationError(formSchemas.calibracionEtanol, payload, t, setError).ok
      )
        return;

      if (isAdd) {
        await CalibracionEtanolService.agregar(payload);
        setMessage(t("ethanolCalibrationAdded"));
        setCalibracion(EMPTY_CALIBRACION);
        setBrazos([]);
      }

      if (isEdit) {
        await CalibracionEtanolService.editar(payload);
        setMessage(t("ethanolCalibrationSaved"));
      }

      if (isDelete) {
        await CalibracionEtanolService.eliminar(payload);
        navigate("/calibracionetanol/listar");
      }
    } catch (saveError) {
      setError(saveError.message || t("ethanolCalibrationSaveError"));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    setOpenDeleteConfirm(false);
    await save();
  };

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
        {loading ? (
          <div className={styles.loading}>
            <Spinner label={t("loadingEthanolCalibration")} />
          </div>
        ) : (
          <>
            {isDelete ? (
              <MessageBar intent="warning">
                {t("deleteEthanolCalibrationConfirmation", {
                  code: calibracion.codCalibracionEtanol,
                })}
              </MessageBar>
            ) : null}

            <div className={styles.formGrid}>
              {!isAdd ? (
                <Field label={t("ethanolCalibrationCode")}>
                  <Input value={String(calibracion.codCalibracionEtanol ?? "")} disabled />
                </Field>
              ) : null}
              <Field label={t("ethanolCalibrationDate")} required={canEditFields}>
                <LocalizedDateInput
                  value={calibracion.fecha}
                  disabled={!canEditFields}
                  onChange={updateTextField("fecha")}
                />
              </Field>
              <Field label={t("ethanolCalibrationNextDate")}>
                <LocalizedDateInput value={proximaFecha} disabled />
              </Field>
              <Field label={t("ethanolCalibrationBay")} required={canEditFields}>
                <div className={styles.lookupControl}>
                  <Input value={selectedBayLabel} readOnly placeholder={t("selectOption")} />
                  <Button
                    size="small"
                    appearance="secondary"
                    icon={<Search />}
                    disabled={!canEditFields}
                    onClick={() => openLookupDialog("bahia")}
                  >
                    {t("ethanolCalibrationLookupSearch")}
                  </Button>
                </div>
              </Field>
              <Field label={t("ethanolCalibrationArm")} required={canEditFields}>
                <div className={styles.lookupControl}>
                  <Input
                    value={selectedArmLabel}
                    readOnly
                    placeholder={loadingBrazos ? t("loadingEthanolArms") : t("selectOption")}
                  />
                  <Button
                    size="small"
                    appearance="secondary"
                    icon={<Search />}
                    disabled={
                      !canEditFields || !String(calibracion.codBahia ?? "").trim() || loadingBrazos
                    }
                    onClick={() => openLookupDialog("brazo")}
                  >
                    {t("ethanolCalibrationLookupSearch")}
                  </Button>
                </div>
              </Field>
              <Field label={t("ethanolCalibrationProduct")} required={canEditFields}>
                <div className={styles.lookupControl}>
                  <Input value={selectedProductLabel} readOnly placeholder={t("selectOption")} />
                  <Button
                    size="small"
                    appearance="secondary"
                    icon={<Search />}
                    disabled={!canEditFields}
                    onClick={() => openLookupDialog("producto")}
                  >
                    {t("ethanolCalibrationLookupSearch")}
                  </Button>
                </div>
              </Field>
              <Field label={t("ethanolCalibrationTechnician")} required={canEditFields}>
                <div className={styles.lookupControl}>
                  <Input value={selectedTechnicianLabel} readOnly placeholder={t("selectOption")} />
                  <Button
                    size="small"
                    appearance="secondary"
                    icon={<Search />}
                    disabled={!canEditFields}
                    onClick={() => openLookupDialog("tecnico")}
                  >
                    {t("ethanolCalibrationLookupSearch")}
                  </Button>
                </div>
              </Field>
              <Field label={t("ethanolCalibrationInspectionCompany")} required={canEditFields}>
                <div className={styles.lookupControl}>
                  <Input
                    value={selectedInspectionCompanyLabel}
                    readOnly
                    placeholder={t("selectOption")}
                  />
                  <Button
                    size="small"
                    appearance="secondary"
                    icon={<Search />}
                    disabled={!canEditFields}
                    onClick={() => openLookupDialog("compania")}
                  >
                    {t("ethanolCalibrationLookupSearch")}
                  </Button>
                </div>
              </Field>
              <Field label={t("ethanolCalibrationQuantity")} required={canEditFields}>
                <Input
                  type="number"
                  value={String(calibracion.cantidadCalibracion ?? 0)}
                  disabled={!canEditFields}
                  onChange={updateNumberField("cantidadCalibracion")}
                />
              </Field>
              <Field label={t("ethanolCalibrationStartTime")}>
                <Input
                  type="time"
                  value={calibracion.horaInicio ?? ""}
                  disabled={!canEditFields}
                  onChange={updateTextField("horaInicio")}
                />
              </Field>
              <Field label={t("ethanolCalibrationEndTime")}>
                <Input
                  type="time"
                  value={calibracion.horaFinal ?? ""}
                  disabled={!canEditFields}
                  onChange={updateTextField("horaFinal")}
                />
              </Field>
              <Field label={t("ethanolCalibrationTotalTime")}>
                <Input type="number" value={tiempoTotal ?? ""} disabled />
              </Field>
              <Field label={t("ethanolCalibrationFactor")}>
                <Input
                  type="number"
                  step="0.000001"
                  value={calibracion.factorCalibracion ?? ""}
                  disabled={!canEditFields}
                  onChange={updateOptionalNumberField("factorCalibracion")}
                />
              </Field>
              <Field label={t("ethanolCalibrationDeviationPercent")}>
                <Input
                  type="number"
                  step="0.000001"
                  value={calibracion.porcentajeDesviacion ?? ""}
                  disabled={!canEditFields}
                  onChange={updateOptionalNumberField("porcentajeDesviacion")}
                />
              </Field>
              <Field label={t("ethanolCalibrationFinalGrossVolume")}>
                <Input
                  type="number"
                  step="0.0001"
                  value={calibracion.volumenBrutoFinalDespuesCalibrar ?? ""}
                  disabled={!canEditFields}
                  onChange={updateOptionalNumberField("volumenBrutoFinalDespuesCalibrar")}
                />
              </Field>
              <Field label={t("ethanolCalibrationPreviousFinalVolume")}>
                <Input
                  type="number"
                  step="0.0001"
                  value={calibracion.volumenFinalCalibracionAnterior ?? ""}
                  disabled={!canEditFields}
                  onChange={updateOptionalNumberField("volumenFinalCalibracionAnterior")}
                />
              </Field>
              <Field label={t("ethanolCalibrationInitialFoundVolume")}>
                <Input
                  type="number"
                  step="0.0001"
                  value={calibracion.volumenEncontradoInicialCalibracion ?? ""}
                  disabled={!canEditFields}
                  onChange={updateOptionalNumberField("volumenEncontradoInicialCalibracion")}
                />
              </Field>
              <Field label={t("ethanolCalibrationNextVolume")}>
                <Input
                  type="number"
                  step="0.0001"
                  value={calibracion.proximoVolumenACalibrar ?? ""}
                  disabled={!canEditFields}
                  onChange={updateOptionalNumberField("proximoVolumenACalibrar")}
                />
              </Field>
              <Field label={t("ethanolCalibrationDispatchedVolume")}>
                <Input
                  type="number"
                  step="0.0001"
                  value={calibracion.volumenDespachado ?? ""}
                  disabled={!canEditFields}
                  onChange={updateOptionalNumberField("volumenDespachado")}
                />
              </Field>
              <Field label={t("ethanolCalibrationRackTemperature")}>
                <Input
                  type="number"
                  step="0.0001"
                  value={calibracion.temperaturaRack ?? ""}
                  disabled={!canEditFields}
                  onChange={updateOptionalNumberField("temperaturaRack")}
                />
              </Field>
              <Field label={t("ethanolCalibrationSerafinTemperature")}>
                <Input
                  type="number"
                  step="0.0001"
                  value={calibracion.temperaturaSerafin ?? ""}
                  disabled={!canEditFields}
                  onChange={updateOptionalNumberField("temperaturaSerafin")}
                />
              </Field>
              <Field label={t("ethanolCalibrationTemperatureDifference")}>
                <Input type="number" value={diferenciaTemperaturas ?? ""} disabled />
              </Field>
              <Field label={t("ethanolCalibrationComments")}>
                <Textarea
                  value={calibracion.comentarios ?? ""}
                  disabled={!canEditFields}
                  onChange={updateTextField("comentarios")}
                  rows={3}
                />
              </Field>
              <Field label={t("status")}>
                <Switch
                  checked={calibracion.estatus !== false}
                  disabled={!canEditFields}
                  label={calibracion.estatus !== false ? t("active") : t("inactive")}
                  onChange={updateBoolField("estatus")}
                />
              </Field>
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
              {t("deleteEthanolCalibrationConfirmation", {
                code: calibracion.codCalibracionEtanol,
              })}
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

      <Dialog
        open={Boolean(lookupType)}
        onOpenChange={(_, data) => !data.open && closeLookupDialog()}
      >
        <DialogSurface className={styles.lookupDialogSurface} data-lookup-dialog>
          <DialogBody>
            <DialogTitle>{lookupTitleKey ? t(lookupTitleKey) : ""}</DialogTitle>
            <DialogContent>
              <div className={styles.lookupSearchRow}>
                <Input
                  autoFocus
                  value={lookupSearch}
                  placeholder={t("ethanolCalibrationLookupSearchPlaceholder")}
                  contentBefore={<Search />}
                  onChange={(_, data) => setLookupSearch(data.value)}
                />
              </div>
              <div className={styles.lookupTableWrap}>
                <Table className={styles.lookupTable}>
                  <TableHeader>
                    <TableRow>
                      <TableHeaderCell>{t("ethanolCalibrationLookupCode")}</TableHeaderCell>
                      <TableHeaderCell>{t("ethanolCalibrationLookupName")}</TableHeaderCell>
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
                              {t("ethanolCalibrationLookupSelect")}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={3} className={styles.lookupEmptyCell}>
                          <Text>{t("ethanolCalibrationLookupEmpty")}</Text>
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

export default CalibracionEtanolFormPage;
