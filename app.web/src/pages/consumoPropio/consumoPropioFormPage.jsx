import { useEffect, useState } from "react";
import { useFormStateAdapter } from "../../hooks/useFormStateAdapter";
import {
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
  Title2,
} from "@/components/ui/app-shadcn";
import { useTranslation } from "react-i18next";
import { formSchemas } from "../../validations/formSchemas";
import { setZodValidationError } from "../../validations/zodValidation";
import { useNavigate, useParams } from "react-router-dom";
import { ListActionButton } from "../../components/common/ListActionButton";
import { LocalizedDateInput } from "../../components/common/LocalizedDateInput";
import { PERMISOS } from "../../config/permisos";
import { validarPermiso } from "../../services/authService";
import { ConsumoPropioService } from "../../services/consumoPropioService";
import { TanqueService } from "../../services/tanqueService";
import {
  getConsumoPropioActionPageThemeStyles,
  useConsumoPropioActionPageStyles,
} from "../../styles/pages/consumoPropio/consumoPropioActionPageStyles";
import { formatHeightMeasurement } from "../../utils/heightMeasurement";

const EMPTY_CONSUMO = {
  idConsumoPropio: "",
  codConsumoPropio: 0,
  codTanque: "",
  tanque: "",
  fecha: "",
  pies: 0,
  pulgadas: 0,
  dieciseisavos: 0,
  cantidadAnterior: 0,
  cantidad: 0,
  cantidadActual: 0,
};

const OWN_CONSUMPTION_TANK_FILTER = {
  consumoPropio: true,
  tipoProducto: "Combustible",
};

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

function ConsumoPropioFormPage({ mode }) {
  const styles = useConsumoPropioActionPageStyles();
  const themeStyles = getConsumoPropioActionPageThemeStyles();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { idConsumoPropio = "", idTanque = "" } = useParams();
  const { values: consumo, setValues: setConsumo } = useFormStateAdapter(EMPTY_CONSUMO);
  const [tanques, setTanques] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const isAdd = mode === "add";
  const isView = mode === "view";
  const isEdit = mode === "edit";
  const isDelete = mode === "delete";
  const canEditFields = isAdd || isEdit;
  const hasTankContext = Boolean(idTanque);

  useEffect(() => {
    let isMounted = true;

    async function loadOptions() {
      try {
        const data = await TanqueService.ListarOpcion(OWN_CONSUMPTION_TANK_FILTER);
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
    if (!isAdd) {
      return undefined;
    }

    if (!idTanque) {
      setConsumo(EMPTY_CONSUMO);
      return undefined;
    }

    let isMounted = true;

    async function loadTanqueSeleccionado() {
      try {
        setLoading(true);
        setError("");
        const tanque = await TanqueService.obtener(idTanque);

        if (isMounted) {
          setConsumo({
            ...EMPTY_CONSUMO,
            codTanque: tanque.codTanque,
            idTanque: tanque.idTanque,
            tanque: tanque.tanque,
          });
        }
      } catch (loadError) {
        if (isMounted) setError(loadError.message || t("tankLoadError"));
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadTanqueSeleccionado();

    return () => {
      isMounted = false;
    };
  }, [idTanque, isAdd, setConsumo, t]);

  useEffect(() => {
    if (isAdd) {
      return undefined;
    }

    let isMounted = true;

    async function loadConsumo() {
      try {
        setLoading(true);
        setError("");
        const data = await ConsumoPropioService.obtener(idConsumoPropio);
        if (isMounted) {
          setConsumo({
            ...EMPTY_CONSUMO,
            ...data,
            fecha: toDateInputValue(data.fecha),
          });
        }
      } catch (loadError) {
        if (isMounted) setError(loadError.message || t("ownConsumptionLoadError"));
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadConsumo();

    return () => {
      isMounted = false;
    };
  }, [idConsumoPropio, isAdd, setConsumo, t]);

  const updateNumberField = (key) => (_, data) => {
    setConsumo((current) => ({
      ...current,
      [key]: toNumber(data.value),
    }));
  };

  const updateTextField = (key) => (_, data) => {
    setConsumo((current) => ({
      ...current,
      [key]: data.value,
    }));
  };

  const getBackRoute = () => {
    const targetIdTanque = consumo.idTanque || idTanque;
    return targetIdTanque
      ? `/consumopropio/listar/${encodeURIComponent(targetIdTanque)}`
      : "/consumopropio/listar";
  };

  const back = () => navigate(getBackRoute());

  const goEdit = async () => {
    const response = await validarPermiso({
      ruta: "/consumopropio/editar",
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

    navigate(`/consumopropio/editar/${encodeURIComponent(idConsumoPropio)}`);
  };

  const save = async () => {
    try {
      setSaving(true);
      setError("");
      setMessage("");

      if (!setZodValidationError(formSchemas.consumoPropio, consumo, t, setError).ok) return;

      const payload = {
        ...consumo,
        codTanque: toText(consumo.codTanque),
        fecha: consumo.fecha,
        pies: toNumber(consumo.pies),
        pulgadas: toNumber(consumo.pulgadas),
        dieciseisavos: toNumber(consumo.dieciseisavos),
        cantidadAnterior: toNumber(consumo.cantidadAnterior),
        cantidad: toNumber(consumo.cantidad),
        cantidadActual: toNumber(consumo.cantidadActual),
      };

      if (isAdd) {
        await ConsumoPropioService.agregar(payload);
        setMessage(t("ownConsumptionAdded"));
        setConsumo(
          hasTankContext
            ? {
                ...EMPTY_CONSUMO,
                codTanque: payload.codTanque,
                idTanque,
                tanque: consumo.tanque,
              }
            : EMPTY_CONSUMO
        );
      }

      if (isEdit) {
        await ConsumoPropioService.editar(payload);
        setMessage(t("ownConsumptionSaved"));
      }

      if (isDelete) {
        await ConsumoPropioService.eliminar(payload);
        navigate(getBackRoute());
      }
    } catch (saveError) {
      setError(saveError.message || t("ownConsumptionSaveError"));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    setOpenDeleteConfirm(false);
    await save();
  };

  const titleKeyByMode = {
    add: "ownConsumptionAddTitle",
    view: "ownConsumptionViewTitle",
    edit: "ownConsumptionEditTitle",
    delete: "ownConsumptionDeleteTitle",
  };

  const consumoLabel = `${consumo.tanque || ""} ${toDateInputValue(consumo.fecha)} ${formatHeightMeasurement(consumo)}`;

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
            <Spinner label={t("loadingOwnConsumption")} />
          </div>
        ) : (
          <>
            {isDelete ? (
              <MessageBar intent="warning">
                {t("deleteOwnConsumptionConfirmation", { consumption: consumoLabel })}
              </MessageBar>
            ) : null}

            <div className={styles.formGrid}>
              {!isAdd ? (
                <Field label={t("ownConsumptionCode")}>
                  <Input value={String(consumo.codConsumoPropio ?? "")} disabled />
                </Field>
              ) : null}
              <Field label={t("ownConsumptionTank")} required={canEditFields}>
                {hasTankContext ? (
                  <Input value={consumo.tanque || ""} disabled />
                ) : (
                  <Select
                    value={String(consumo.codTanque || "")}
                    disabled={!canEditFields}
                    onChange={updateTextField("codTanque")}
                  >
                    <option value="">{t("selectOption")}</option>
                    {tanques.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.text}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>
              <Field label={t("ownConsumptionDate")} required={canEditFields}>
                <LocalizedDateInput
                  value={toDateInputValue(consumo.fecha)}
                  disabled={!canEditFields}
                  onChange={updateTextField("fecha")}
                />
              </Field>
              <Field label={t("ownConsumptionHeightFeet")}>
                <Input
                  type="number"
                  value={String(consumo.pies ?? 0)}
                  disabled={!canEditFields}
                  onChange={updateNumberField("pies")}
                />
              </Field>
              <Field label={t("ownConsumptionHeightInches")}>
                <Input
                  type="number"
                  value={String(consumo.pulgadas ?? 0)}
                  disabled={!canEditFields}
                  onChange={updateNumberField("pulgadas")}
                />
              </Field>
              <Field label={t("ownConsumptionSixteenths")}>
                <Input
                  type="number"
                  value={String(consumo.dieciseisavos ?? 0)}
                  disabled={!canEditFields}
                  onChange={updateNumberField("dieciseisavos")}
                />
              </Field>
              <Field label={t("ownConsumptionPreviousQuantity")}>
                <Input type="number" value={String(consumo.cantidadAnterior ?? 0)} disabled />
              </Field>
              <Field label={t("ownConsumptionQuantity")}>
                <Input type="number" value={String(consumo.cantidad ?? 0)} disabled />
              </Field>
              <Field label={t("ownConsumptionCurrentQuantity")}>
                <Input type="number" value={String(consumo.cantidadActual ?? 0)} disabled />
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
              {t("deleteOwnConsumptionConfirmation", { consumption: consumoLabel })}
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
    </section>
  );
}

export default ConsumoPropioFormPage;
