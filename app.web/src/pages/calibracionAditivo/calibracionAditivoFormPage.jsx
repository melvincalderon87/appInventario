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
  Title2,
} from "@/components/ui/app-shadcn";
import { Check, Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { ListActionButton } from "../../components/common/ListActionButton";
import { LocalizedDateInput } from "../../components/common/LocalizedDateInput";
import { PERMISOS } from "../../config/permisos";
import { BahiaService } from "../../services/bahiaService";
import { CalibracionAditivoService } from "../../services/calibracionAditivoService";
import { CompaniaInspeccionService } from "../../services/companiaInspeccionService";
import { PersonalService } from "../../services/personalService";
import { validarPermiso } from "../../services/authService";
import { formSchemas } from "../../validations/formSchemas";
import { setZodValidationError } from "../../validations/zodValidation";
import {
  getCalibracionAditivoActionPageThemeStyles,
  useCalibracionAditivoActionPageStyles,
} from "../../styles/pages/calibracionAditivo/calibracionAditivoActionPageStyles";

const EMPTY_CALIBRACION = {
  fecha: "",
  codBahia: "",
  codProducto: 0,
  codPersonal: 0,
  codCompaniaInspeccion: 0,
  fechaCalibracion: "",
  estatus: true,
};

function toNumber(value) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
}

function pad(value) {
  return String(value).padStart(2, "0");
}

function toDateInputValue(value) {
  if (!value) return "";
  const text = String(value).trim();
  return text.includes("T") ? text.split("T")[0] : text.slice(0, 10);
}

function addDaysToDateValue(value, days) {
  if (!value) return "";

  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return "";

  const date = new Date(Date.UTC(year, month - 1, day + days));
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
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
    fechaCalibracion: toDateInputValue(data?.fechaCalibracion),
    proximaFecha: toDateInputValue(data?.proximaFecha),
    estatus: data?.estatus !== false,
  };
}

function CalibracionAditivoFormPage({ mode }) {
  const styles = useCalibracionAditivoActionPageStyles();
  const themeStyles = getCalibracionAditivoActionPageThemeStyles();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { idCalibracionAditivo = "" } = useParams();
  const { values: calibracion, setValues: setCalibracion } = useFormStateAdapter(EMPTY_CALIBRACION);
  const [bahias, setBahias] = useState([]);
  const [productos, setProductos] = useState([]);
  const [tecnicos, setTecnicos] = useState([]);
  const [companiasInspeccion, setCompaniasInspeccion] = useState([]);
  const [loading, setLoading] = useState(false);
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
    add: "additiveCalibrationTitle",
    view: "additiveCalibrationViewTitle",
    edit: "additiveCalibrationEditTitle",
    delete: "additiveCalibrationDeleteTitle",
  }[mode];
  const proximaFecha = useMemo(
    () => addDaysToDateValue(calibracion.fechaCalibracion, 120),
    [calibracion.fechaCalibracion]
  );
  const lookupOptions = useMemo(() => {
    if (lookupType === "bahia") return bahias;
    if (lookupType === "producto") return productos;
    if (lookupType === "tecnico") return tecnicos;
    if (lookupType === "compania") return companiasInspeccion;
    return [];
  }, [bahias, companiasInspeccion, lookupType, productos, tecnicos]);
  const filteredLookupOptions = useMemo(
    () => filterLookupOptions(lookupOptions, lookupSearch),
    [lookupOptions, lookupSearch]
  );
  const lookupTitleKey = {
    bahia: "additiveCalibrationBaySearchTitle",
    producto: "additiveCalibrationProductSearchTitle",
    tecnico: "additiveCalibrationTechnicianSearchTitle",
    compania: "additiveCalibrationInspectionCompanySearchTitle",
  }[lookupType];
  const selectedBayLabel = getSelectedOptionText(bahias, calibracion.codBahia);
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
            CalibracionAditivoService.ListarProductoOpcion(),
            PersonalService.ListarTecnicoOpcion(),
            CompaniaInspeccionService.ListarOpcion(),
            isAdd ? Promise.resolve(null) : CalibracionAditivoService.obtener(idCalibracionAditivo),
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
        if (isMounted) setError(loadError.message || t("additiveCalibrationLoadError"));
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    load();

    return () => {
      isMounted = false;
    };
  }, [idCalibracionAditivo, isAdd, setCalibracion, t]);

  const updateTextField = (key) => (_, data) => {
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
    if (!canEditFields) return;

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
      if (lookupType === "bahia") return { ...current, codBahia: value };
      if (lookupType === "producto") return { ...current, codProducto: toNumber(value) };
      if (lookupType === "tecnico") return { ...current, codPersonal: toNumber(value) };
      return { ...current, codCompaniaInspeccion: toNumber(value) };
    });

    closeLookupDialog();
  };

  const back = () => navigate("/calibracionaditivo/listar");

  const goEdit = async () => {
    const response = await validarPermiso({
      ruta: "/calibracionaditivo/editar",
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

    navigate(`/calibracionaditivo/editar/${encodeURIComponent(idCalibracionAditivo)}`);
  };

  const buildPayload = () => ({
    ...calibracion,
    codCalibracionAditivo: toNumber(calibracion.codCalibracionAditivo),
    fecha: calibracion.fecha,
    codBahia: String(calibracion.codBahia ?? "").trim(),
    codProducto: toNumber(calibracion.codProducto),
    codPersonal: toNumber(calibracion.codPersonal),
    codCompaniaInspeccion: toNumber(calibracion.codCompaniaInspeccion),
    fechaCalibracion: calibracion.fechaCalibracion,
    proximaFecha,
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
        !setZodValidationError(formSchemas.calibracionAditivo, payload, t, setError).ok
      )
        return;

      if (isAdd) {
        await CalibracionAditivoService.agregar(payload);
        setMessage(t("additiveCalibrationAdded"));
        setCalibracion(EMPTY_CALIBRACION);
      }

      if (isEdit) {
        await CalibracionAditivoService.editar(payload);
        setMessage(t("additiveCalibrationSaved"));
      }

      if (isDelete) {
        await CalibracionAditivoService.eliminar(payload);
        navigate("/calibracionaditivo/listar");
      }
    } catch (saveError) {
      setError(saveError.message || t("additiveCalibrationSaveError"));
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
            <Spinner label={t("loadingAdditiveCalibration")} />
          </div>
        ) : (
          <>
            {isDelete ? (
              <MessageBar intent="warning">
                {t("deleteAdditiveCalibrationConfirmation", {
                  code: calibracion.codCalibracionAditivo,
                })}
              </MessageBar>
            ) : null}

            <div className={styles.formGrid}>
              {!isAdd ? (
                <Field label={t("additiveCalibrationCode")}>
                  <Input value={String(calibracion.codCalibracionAditivo ?? "")} disabled />
                </Field>
              ) : null}
              <Field label={t("additiveCalibrationDate")} required={canEditFields}>
                <LocalizedDateInput
                  value={calibracion.fecha}
                  disabled={!canEditFields}
                  onChange={updateTextField("fecha")}
                />
              </Field>
              <Field label={t("additiveCalibrationBay")} required={canEditFields}>
                <div className={styles.lookupControl}>
                  <Input value={selectedBayLabel} readOnly placeholder={t("selectOption")} />
                  <Button
                    size="small"
                    appearance="secondary"
                    icon={<Search />}
                    disabled={!canEditFields}
                    onClick={() => openLookupDialog("bahia")}
                  >
                    {t("additiveCalibrationLookupSearch")}
                  </Button>
                </div>
              </Field>
              <Field label={t("additiveCalibrationProduct")} required={canEditFields}>
                <div className={styles.lookupControl}>
                  <Input value={selectedProductLabel} readOnly placeholder={t("selectOption")} />
                  <Button
                    size="small"
                    appearance="secondary"
                    icon={<Search />}
                    disabled={!canEditFields}
                    onClick={() => openLookupDialog("producto")}
                  >
                    {t("additiveCalibrationLookupSearch")}
                  </Button>
                </div>
              </Field>
              <Field label={t("additiveCalibrationTechnician")} required={canEditFields}>
                <div className={styles.lookupControl}>
                  <Input value={selectedTechnicianLabel} readOnly placeholder={t("selectOption")} />
                  <Button
                    size="small"
                    appearance="secondary"
                    icon={<Search />}
                    disabled={!canEditFields}
                    onClick={() => openLookupDialog("tecnico")}
                  >
                    {t("additiveCalibrationLookupSearch")}
                  </Button>
                </div>
              </Field>
              <Field label={t("additiveCalibrationInspectionCompany")} required={canEditFields}>
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
                    {t("additiveCalibrationLookupSearch")}
                  </Button>
                </div>
              </Field>
              <Field label={t("additiveCalibrationCalibrationDate")} required={canEditFields}>
                <LocalizedDateInput
                  value={calibracion.fechaCalibracion}
                  disabled={!canEditFields}
                  onChange={updateTextField("fechaCalibracion")}
                />
              </Field>
              <Field label={t("additiveCalibrationNextDate")}>
                <LocalizedDateInput value={proximaFecha} disabled />
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
              {t("deleteAdditiveCalibrationConfirmation", {
                code: calibracion.codCalibracionAditivo,
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
                  placeholder={t("additiveCalibrationLookupSearchPlaceholder")}
                  contentBefore={<Search />}
                  onChange={(_, data) => setLookupSearch(data.value)}
                />
              </div>
              <div className={styles.lookupTableWrap}>
                <Table className={styles.lookupTable}>
                  <TableHeader>
                    <TableRow>
                      <TableHeaderCell>{t("additiveCalibrationLookupCode")}</TableHeaderCell>
                      <TableHeaderCell>{t("additiveCalibrationLookupName")}</TableHeaderCell>
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
                              {t("additiveCalibrationLookupSelect")}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={3} className={styles.lookupEmptyCell}>
                          <Text>{t("additiveCalibrationLookupEmpty")}</Text>
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

export default CalibracionAditivoFormPage;
