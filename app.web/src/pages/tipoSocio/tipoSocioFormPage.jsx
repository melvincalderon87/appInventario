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
  Spinner,
  Switch,
  Title2,
} from "@/components/ui/app-shadcn";
import { useTranslation } from "react-i18next";
import { formSchemas } from "../../validations/formSchemas";
import { setZodValidationError } from "../../validations/zodValidation";
import { useNavigate, useParams } from "react-router-dom";
import { ListActionButton } from "../../components/common/ListActionButton";
import { PERMISOS } from "../../config/permisos";
import { validarPermiso } from "../../services/authService";
import { SocioService } from "../../services/socioService";
import {
  getSocioActionPageThemeStyles,
  useSocioActionPageStyles,
} from "../../styles/pages/socio/socioActionPageStyles";

const EMPTY_TIPO_SOCIO = {
  idSocio: "",
  codSocio: "",
  socio: "",
  nombreCortoSocio: "",
  estatus: true,
};

function SocioFormPage({ mode }) {
  const styles = useSocioActionPageStyles();
  const themeStyles = getSocioActionPageThemeStyles();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { idSocio = "" } = useParams();
  const { values: socio, setValues: setsocio } = useFormStateAdapter(EMPTY_TIPO_SOCIO);
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

  useEffect(() => {
    if (isAdd) {
      setLoading(false);
      return undefined;
    }

    let isMounted = true;

    async function loadsocio() {
      try {
        setLoading(true);
        setError("");
        const data = await SocioService.obtener(idSocio);
        if (isMounted) setsocio({ ...EMPTY_TIPO_SOCIO, ...data });
      } catch (loadError) {
        if (isMounted) setError(loadError.message || t("partnerTypeLoadError"));
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadsocio();

    return () => {
      isMounted = false;
    };
  }, [idSocio, isAdd, setsocio, t]);

  const updateField = (key) => (_, data) => {
    setsocio((current) => ({
      ...current,
      [key]: data.value,
    }));
  };

  const updateBoolField = (key) => (_, data) => {
    setsocio((current) => ({
      ...current,
      [key]: Boolean(data.checked),
    }));
  };

  const back = () => navigate("/socio/listar");

  const goEdit = async () => {
    const response = await validarPermiso({
      ruta: "/socio/editar",
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

    navigate(`/socio/editar/${encodeURIComponent(idSocio)}`);
  };

  const save = async () => {
    try {
      setSaving(true);
      setError("");
      setMessage("");

      if (!setZodValidationError(formSchemas.socio, socio, t, setError).ok) return;

      const payload = {
        ...socio,
        codSocio: String(socio.codSocio ?? "").trim(),
        estatus: socio.estatus !== false,
      };

      if (isAdd) {
        await SocioService.agregar(payload);
        setMessage(t("partnerTypeAdded"));
        setsocio(EMPTY_TIPO_SOCIO);
      }

      if (isEdit) {
        await SocioService.editar(payload);
        setMessage(t("partnerTypeSaved"));
      }

      if (isDelete) {
        await SocioService.eliminar(payload);
        navigate("/socio/listar");
      }
    } catch (saveError) {
      setError(saveError.message || t("partnerTypeSaveError"));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    setOpenDeleteConfirm(false);
    await save();
  };

  const titleKeyByMode = {
    add: "partnerTypeAddTitle",
    view: "partnerTypeViewTitle",
    edit: "partnerTypeEditTitle",
    delete: "partnerTypeDeleteTitle",
  };

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
            <Spinner label={t("loadingPartnerType")} />
          </div>
        ) : (
          <>
            {isDelete ? (
              <MessageBar intent="warning">
                {t("deletePartnerTypeConfirmation", { partnerType: socio.socio })}
              </MessageBar>
            ) : null}

            <div className={styles.formGrid}>
              <Field label={t("partnerTypeCode")} required={canEditFields}>
                <Input
                  maxLength={20}
                  value={String(socio.codSocio ?? "")}
                  disabled={!isAdd}
                  onChange={updateField("codSocio")}
                />
              </Field>
              <Field label={t("partnerTypeName")} required={canEditFields}>
                <Input
                  value={socio.socio ?? ""}
                  disabled={!canEditFields}
                  onChange={updateField("socio")}
                />
              </Field>
              <Field label={t("partnerTypeShortDescription")} required={canEditFields}>
                <Input
                  maxLength={10}
                  value={socio.nombreCortoSocio ?? ""}
                  disabled={!canEditFields}
                  onChange={updateField("nombreCortoSocio")}
                />
              </Field>
              <Field label={t("partnerTypeStatus")}>
                <Switch
                  checked={socio.estatus !== false}
                  disabled={!canEditFields}
                  label={socio.estatus !== false ? t("active") : t("inactive")}
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
              {t("deletePartnerTypeConfirmation", { partnerType: socio.socio })}
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

export default SocioFormPage;
