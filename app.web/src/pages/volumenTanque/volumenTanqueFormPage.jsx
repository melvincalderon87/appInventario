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
import { useNavigate, useParams } from "react-router-dom";
import { ListActionButton } from "../../components/common/ListActionButton";
import { LocalizedDateInput } from "../../components/common/LocalizedDateInput";
import { PERMISOS } from "../../config/permisos";
import { validarPermiso } from "../../services/authService";
import { TanqueService } from "../../services/tanqueService";
import { VolumenTanqueService } from "../../services/volumenTanqueService";
import {
  getVolumenTanqueActionPageThemeStyles,
  useVolumenTanqueActionPageStyles,
} from "../../styles/pages/volumenTanque/volumenTanqueActionPageStyles";

function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

const EMPTY_VOLUMEN_TANQUE = {
  idVolumenTanque: "",
  codDocumento: 0,
  fecha: todayInputValue(),
  codTanque: "",
  idTanque: "",
  tanque: "",
  pies: 0,
  pulgadas: 0,
  dieciseisavos: 0,
  volumen: 0,
  correccionTecho: 0,
  medidaAguaPies: 0,
  medidaAguaPulgadas: 0,
  volumenAgua: 0,
  temperatura: 0,
  api: 0,
  factor: 0,
  volumenAmbiente: 0,
  volumenEstandar: 0,
  capacidadMaxima: 0,
  capacidadDisponible: 0,
};

function toNumber(value) {
  const numericValue = Number(String(value ?? "").replaceAll(",", ""));
  return Number.isFinite(numericValue) ? numericValue : 0;
}

function formatNumber(value) {
  return new Intl.NumberFormat("es-GT", { maximumFractionDigits: 4 }).format(toNumber(value));
}

function FormattedNumberInput({ value, onValueChange, ...props }) {
  const [isFocused, setIsFocused] = useState(false);
  const [editingValue, setEditingValue] = useState(String(value ?? ""));

  return (
    <Input
      {...props}
      type="text"
      inputMode="decimal"
      value={isFocused ? editingValue : formatNumber(value)}
      onFocus={() => {
        setEditingValue(String(value ?? ""));
        setIsFocused(true);
      }}
      onBlur={() => setIsFocused(false)}
      onChange={(_, data) => {
        setEditingValue(data.value);
        onValueChange?.(data.value);
      }}
    />
  );
}

function toText(value) {
  return String(value ?? "").trim();
}

function toDateInputValue(value) {
  if (!value) return "";
  return String(value).slice(0, 10);
}

function buildPayload(volumenTanque) {
  return {
    ...volumenTanque,
    codTanque: toText(volumenTanque.codTanque),
    fecha: volumenTanque.fecha,
    pies: toNumber(volumenTanque.pies),
    pulgadas: toNumber(volumenTanque.pulgadas),
    dieciseisavos: toNumber(volumenTanque.dieciseisavos),
    volumen: toNumber(volumenTanque.volumen),
    correccionTecho: toNumber(volumenTanque.correccionTecho),
    medidaAguaPies: Math.trunc(toNumber(volumenTanque.medidaAguaPies)),
    medidaAguaPulgadas: Math.trunc(toNumber(volumenTanque.medidaAguaPulgadas)),
    volumenAgua: toNumber(volumenTanque.volumenAgua),
    temperatura: toNumber(volumenTanque.temperatura),
    api: toNumber(volumenTanque.api),
    factor: toNumber(volumenTanque.factor),
  };
}

function formatMeasurement(volumenTanque) {
  const fraccion =
    toNumber(volumenTanque.dieciseisavos) > 0 ? ` ${toNumber(volumenTanque.dieciseisavos)}/16` : "";
  return `${toNumber(volumenTanque.pies)}' ${toNumber(volumenTanque.pulgadas)}${fraccion}"`;
}

function VolumenTanqueFormPage({ mode }) {
  const styles = useVolumenTanqueActionPageStyles();
  const themeStyles = getVolumenTanqueActionPageThemeStyles();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { idVolumenTanque = "" } = useParams();
  const { values: volumenTanque, setValues: setVolumenTanque } =
    useFormStateAdapter(EMPTY_VOLUMEN_TANQUE);
  const [tanques, setTanques] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false);
  const [openTankLookup, setOpenTankLookup] = useState(false);
  const [tankSearch, setTankSearch] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const isAdd = mode === "add";
  const isView = mode === "view";
  const isEdit = mode === "edit";
  const isDelete = mode === "delete";
  const canEditFields = isAdd || isEdit;
  const filteredTanques = useMemo(() => {
    const search = tankSearch.trim().toLocaleLowerCase();
    if (!search) return tanques;
    return tanques.filter((option) =>
      `${option.value ?? ""} ${option.text ?? ""}`.toLocaleLowerCase().includes(search)
    );
  }, [tanques, tankSearch]);

  useEffect(() => {
    let isMounted = true;

    async function loadOptions() {
      try {
        const data = await TanqueService.ListarOpcion();
        if (isMounted) setTanques(Array.isArray(data) ? data : []);
      } catch {
        if (isMounted) setTanques([]);
      }
    }

    loadOptions();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (isAdd) {
      setVolumenTanque({ ...EMPTY_VOLUMEN_TANQUE, fecha: todayInputValue() });
      return undefined;
    }

    let isMounted = true;

    async function loadVolumenTanque() {
      try {
        setLoading(true);
        setError("");
        const data = await VolumenTanqueService.obtener(idVolumenTanque);
        if (isMounted) {
          setVolumenTanque({
            ...EMPTY_VOLUMEN_TANQUE,
            ...data,
            fecha: toDateInputValue(data.fecha),
          });
        }
      } catch (loadError) {
        if (isMounted) setError(loadError.message || t("tankVolumeLoadError"));
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadVolumenTanque();

    return () => {
      isMounted = false;
    };
  }, [idVolumenTanque, isAdd, setVolumenTanque, t]);

  const updateNumberValue = (key, value) => {
    setVolumenTanque((current) => ({
      ...current,
      // Se conserva el texto mientras se escribe para permitir valores negativos
      // parciales, por ejemplo "-" y "-0.25", en la corrección de techo.
      [key]: key === "correccionTecho" ? value : toNumber(value),
      volumen: ["pies", "pulgadas", "dieciseisavos", "volumen"].includes(key)
        ? key === "volumen"
          ? toNumber(value)
          : 0
        : current.volumen,
    }));
  };

  const updateNumberField = (key) => (_, data) => updateNumberValue(key, data.value);

  const updateTextField = (key) => (_, data) => {
    setVolumenTanque((current) => ({
      ...current,
      [key]: data.value,
      volumen: key === "codTanque" || key === "fecha" ? 0 : current.volumen,
    }));
  };

  const openTankSearch = () => {
    if (!canEditFields) return;
    setTankSearch("");
    setOpenTankLookup(true);
  };

  const selectTank = async (selected) => {
    setVolumenTanque((current) => ({
      ...current,
      codTanque: String(selected.value ?? ""),
      tanque: selected?.text || "",
      volumen: 0,
      correccionTecho: 0,
      medidaAguaPies: 0,
      medidaAguaPulgadas: 0,
      volumenAgua: 0,
      temperatura: 0,
      api: 0,
      factor: 0,
      volumenAmbiente: 0,
      volumenEstandar: 0,
      capacidadMaxima: 0,
      capacidadDisponible: 0,
    }));
    setOpenTankLookup(false);
  };

  const back = () => navigate("/volumentanque/listar");

  const goEdit = async () => {
    const response = await validarPermiso({
      ruta: "/volumentanque/editar",
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

    navigate(`/volumentanque/editar/${encodeURIComponent(idVolumenTanque)}`);
  };

  const extractVolume = async () => {
    try {
      setExtracting(true);
      setError("");
      setMessage("");

      if (!setZodValidationError(formSchemas.volumenTanque, volumenTanque, t, setError).ok) return;

      const data = await VolumenTanqueService.calcularVolumen(buildPayload(volumenTanque));
      setVolumenTanque((current) => ({
        ...current,
        volumen: toNumber(data?.volumen),
        volumenAmbiente: toNumber(data?.volumenAmbiente),
        volumenEstandar: toNumber(data?.volumenEstandar),
        capacidadMaxima: toNumber(data?.capacidadMaxima),
        capacidadDisponible: toNumber(data?.capacidadDisponible),
      }));
      setMessage(t("tankVolumeCalculated"));
    } catch (extractError) {
      setError(extractError.message || t("tankVolumeExtractError"));
    } finally {
      setExtracting(false);
    }
  };

  const save = async () => {
    try {
      setSaving(true);
      setError("");
      setMessage("");

      if (!setZodValidationError(formSchemas.volumenTanque, volumenTanque, t, setError).ok) return;

      const payload = buildPayload(volumenTanque);

      if (isAdd) {
        await VolumenTanqueService.agregar(payload);
        setMessage(t("tankVolumeAdded"));
        setVolumenTanque({ ...EMPTY_VOLUMEN_TANQUE, fecha: todayInputValue() });
      }

      if (isEdit) {
        await VolumenTanqueService.editar(payload);
        setMessage(t("tankVolumeSaved"));
      }

      if (isDelete) {
        await VolumenTanqueService.eliminar(payload);
        navigate("/volumentanque/listar");
      }
    } catch (saveError) {
      setError(saveError.message || t("tankVolumeSaveError"));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    setOpenDeleteConfirm(false);
    await save();
  };

  const titleKeyByMode = {
    add: "tankVolumeAddTitle",
    view: "tankVolumeViewTitle",
    edit: "tankVolumeEditTitle",
    delete: "tankVolumeDeleteTitle",
  };

  const volumenLabel = `${volumenTanque.codDocumento || ""} ${volumenTanque.tanque || volumenTanque.codTanque || ""} ${formatMeasurement(volumenTanque)}`;

  return (
    <section className={styles.root}>
      <div className={styles.toolbar}>
        <div>
          <Title2 className={styles.title}>{t(titleKeyByMode[mode])}</Title2>
        </div>
        <ListActionButton action="regresar" label={t("back")} text={t("back")} onClick={back} />
      </div>

      {error ? <MessageBar intent="error">{error}</MessageBar> : null}
      {message ? <MessageBar intent="success">{message}</MessageBar> : null}

      <div className={styles.formSurface} style={themeStyles.surface}>
        {loading ? (
          <div className={styles.loading}>
            <Spinner label={t("loadingTankVolume")} />
          </div>
        ) : (
          <>
            {isDelete ? (
              <MessageBar intent="warning">
                {t("deleteTankVolumeConfirmation", { volume: volumenLabel })}
              </MessageBar>
            ) : null}

            <div className={styles.formGrid}>
              <Field label={t("tankVolumeDocument")}>
                <Input value={String(volumenTanque.codDocumento || "")} disabled />
              </Field>
              <Field label={t("tankVolumeDate")} required={canEditFields}>
                <LocalizedDateInput
                  value={toDateInputValue(volumenTanque.fecha)}
                  disabled={!canEditFields}
                  onChange={updateTextField("fecha")}
                />
              </Field>
              <Field label={t("tankVolumeTank")} required={canEditFields}>
                {canEditFields ? (
                  <div className={styles.lookupControl}>
                    <Input
                      className={styles.lookupInput}
                      value={volumenTanque.tanque || volumenTanque.codTanque || ""}
                      readOnly
                      placeholder={t("selectOption")}
                      onClick={openTankSearch}
                    />
                    <Button appearance="secondary" icon={<Search />} onClick={openTankSearch}>
                      {t("search")}
                    </Button>
                  </div>
                ) : (
                  <Input value={volumenTanque.tanque || volumenTanque.codTanque || ""} disabled />
                )}
              </Field>
              <Field label={t("tankVolumeFeet")}>
                <Input
                  type="number"
                  value={String(volumenTanque.pies ?? 0)}
                  disabled={!canEditFields}
                  onChange={updateNumberField("pies")}
                />
              </Field>
              <Field label={t("tankVolumeInches")}>
                <Input
                  type="number"
                  value={String(volumenTanque.pulgadas ?? 0)}
                  disabled={!canEditFields}
                  onChange={updateNumberField("pulgadas")}
                />
              </Field>
              <Field label={t("tankVolumeSixteenths")}>
                <Input
                  type="number"
                  value={String(volumenTanque.dieciseisavos ?? 0)}
                  disabled={!canEditFields}
                  onChange={updateNumberField("dieciseisavos")}
                />
              </Field>
              <Field label={t("tankVolumeVolume")}>
                <FormattedNumberInput value={volumenTanque.volumen} disabled />
              </Field>
              <Field label={t("tankVolumeWaterFeet")}>
                <Input
                  type="number"
                  min="0"
                  value={String(volumenTanque.medidaAguaPies ?? 0)}
                  disabled={!canEditFields}
                  onChange={updateNumberField("medidaAguaPies")}
                />
              </Field>
              <Field label={t("tankVolumeWaterInches")}>
                <Input
                  type="number"
                  min="0"
                  max="11"
                  value={String(volumenTanque.medidaAguaPulgadas ?? 0)}
                  disabled={!canEditFields}
                  onChange={updateNumberField("medidaAguaPulgadas")}
                />
              </Field>
              <Field label={t("tankVolumeWaterVolume")}>
                <FormattedNumberInput
                  value={volumenTanque.volumenAgua}
                  disabled={!canEditFields}
                  onValueChange={(value) => updateNumberValue("volumenAgua", value)}
                />
              </Field>
              <Field label={t("tankVolumeRoofCorrection")}>
                <FormattedNumberInput
                  value={volumenTanque.correccionTecho}
                  disabled={!canEditFields}
                  onValueChange={(value) => updateNumberValue("correccionTecho", value)}
                />
              </Field>
              <Field label={t("tankVolumeTemperature")}>
                <FormattedNumberInput
                  value={volumenTanque.temperatura}
                  disabled={!canEditFields}
                  onValueChange={(value) => updateNumberValue("temperatura", value)}
                />
              </Field>
              <Field label={t("tankVolumeApi")}>
                <FormattedNumberInput
                  value={volumenTanque.api}
                  disabled={!canEditFields}
                  onValueChange={(value) => updateNumberValue("api", value)}
                />
              </Field>
              <Field label={t("tankVolumeFactor")}>
                <FormattedNumberInput
                  value={volumenTanque.factor}
                  disabled={!canEditFields}
                  onValueChange={(value) => updateNumberValue("factor", value)}
                />
              </Field>
              <Field label={t("tankVolumeAmbientVolume")}>
                <FormattedNumberInput value={volumenTanque.volumenAmbiente} disabled />
              </Field>
              <Field label={t("tankVolumeStandardVolume")}>
                <FormattedNumberInput value={volumenTanque.volumenEstandar} disabled />
              </Field>
              <Field label={t("tankVolumeMaximumCapacity")}>
                <FormattedNumberInput value={volumenTanque.capacidadMaxima} disabled />
              </Field>
              <Field label={t("tankVolumeAvailableCapacity")}>
                <FormattedNumberInput value={volumenTanque.capacidadDisponible} disabled />
              </Field>
            </div>

            <div className={styles.buttonRow}>
              {canEditFields ? (
                <ListActionButton
                  action="calcular"
                  label={t("tankVolumeExtract")}
                  text={extracting ? t("tankVolumeExtracting") : t("tankVolumeExtract")}
                  disabled={saving || extracting}
                  onClick={extractVolume}
                />
              ) : null}
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
                  disabled={saving || extracting}
                  onClick={save}
                />
              ) : null}
              {isEdit ? (
                <ListActionButton
                  action="editar"
                  label={t("save")}
                  text={saving ? t("saving") : t("save")}
                  disabled={saving || extracting}
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
              {t("deleteTankVolumeConfirmation", { volume: volumenLabel })}
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

      <Dialog open={openTankLookup} onOpenChange={(_, data) => setOpenTankLookup(data.open)}>
        <DialogSurface className={styles.lookupDialogSurface} data-lookup-dialog>
          <DialogBody>
            <DialogTitle>{t("tankVolumeLookupTitle")}</DialogTitle>
            <DialogContent className={styles.lookupDialogContent}>
              <Input
                value={tankSearch}
                onChange={(_, data) => setTankSearch(data.value)}
                contentBefore={<Search />}
                placeholder={t("tankVolumeLookupPlaceholder")}
              />
              <div className={styles.lookupTableWrap}>
                <Table className={styles.lookupTable}>
                  <TableHeader>
                    <TableRow>
                      <TableHeaderCell>{t("code")}</TableHeaderCell>
                      <TableHeaderCell>{t("tankVolumeTank")}</TableHeaderCell>
                      <TableHeaderCell className={styles.lookupActionCell}>
                        {t("actions")}
                      </TableHeaderCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTanques.length ? (
                      filteredTanques.map((option) => (
                        <TableRow
                          key={option.value}
                          className={styles.lookupTableRow}
                          onDoubleClick={() => selectTank(option)}
                        >
                          <TableCell>{option.value}</TableCell>
                          <TableCell>{option.text}</TableCell>
                          <TableCell className={styles.lookupActionCell}>
                            <Button
                              size="small"
                              appearance="primary"
                              icon={<Check />}
                              onClick={() => selectTank(option)}
                            >
                              {t("tankVolumeLookupSelect")}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={3} className={styles.lookupEmptyCell}>
                          {t("tankVolumeLookupEmpty")}
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
                onClick={() => setOpenTankLookup(false)}
              />
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </section>
  );
}

export default VolumenTanqueFormPage;
