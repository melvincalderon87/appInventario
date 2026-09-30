import { useEffect, useState } from "react";
import { useFormStateAdapter } from "../../hooks/useFormStateAdapter";
import {
  Field,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  Input,
  MessageBar,
  Spinner,
  Title2,
} from "@/components/ui/app-shadcn";
import { useTranslation } from "react-i18next";
import { formSchemas } from "../../validations/formSchemas";
import { setZodValidationError } from "../../validations/zodValidation";
import { useNavigate, useParams } from "react-router-dom";
import { ListActionButton } from "../../components/common/ListActionButton";
import { PERMISOS } from "../../config/permisos";
import { validarPermiso } from "../../services/authService";
import { TipoUsuarioService } from "../../services/tipoUsuarioService";
import {
  getTipoUsuarioActionPageThemeStyles,
  useTipoUsuarioActionPageStyles,
} from "../../styles/pages/tipoUsuario/tipoUsuarioActionPageStyles";

const EMPTY_TIPO_USUARIO = {
  idTipoUsuario: "",
  codTipoUsuario: 0,
  descripcion: "",
};

function TipoUsuarioEditarPage() {
  const styles = useTipoUsuarioActionPageStyles();
  const themeStyles = getTipoUsuarioActionPageThemeStyles();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { idTipoUsuario = "" } = useParams();
  const { values: tipoUsuario, setValues: setTipoUsuario } =
    useFormStateAdapter(EMPTY_TIPO_USUARIO);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const isAdd = false;
  const isView = false;
  const isEdit = true;
  const isDelete = false;
  const canEditFields = isAdd || isEdit;

  useEffect(() => {
    if (isAdd) {
      setLoading(false);
      return undefined;
    }

    let isMounted = true;

    async function loadTipoUsuario() {
      try {
        setLoading(true);
        setError("");
        const data = await TipoUsuarioService.obtener(idTipoUsuario);
        if (isMounted) setTipoUsuario(data);
      } catch (loadError) {
        if (isMounted) setError(loadError.message || t("userTypeLoadError"));
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadTipoUsuario();

    return () => {
      isMounted = false;
    };
  }, [idTipoUsuario, isAdd, setTipoUsuario, t]);

  const updateField = (key) => (_, data) => {
    setTipoUsuario((current) => ({
      ...current,
      [key]: data.value,
    }));
  };

  const back = () => navigate("/tipousuario/listar");

  const goEdit = async () => {
    const response = await validarPermiso({
      ruta: "/tipousuario/editar",
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

    navigate(`/tipousuario/editar/${encodeURIComponent(idTipoUsuario)}`);
  };

  const save = async () => {
    try {
      setSaving(true);
      setError("");
      setMessage("");

      if (!setZodValidationError(formSchemas.tipoUsuario, tipoUsuario, t, setError).ok) return;

      if (isAdd) {
        await TipoUsuarioService.agregar(tipoUsuario);
        setMessage(t("userTypeAdded"));
        setTipoUsuario(EMPTY_TIPO_USUARIO);
      }

      if (isEdit) {
        await TipoUsuarioService.editar(tipoUsuario);
        setMessage(t("userTypeSaved"));
      }

      if (isDelete) {
        await TipoUsuarioService.eliminar(tipoUsuario);
        navigate("/tipousuario/listar");
      }
    } catch (saveError) {
      setError(saveError.message || t("userTypeSaveError"));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    setOpenDeleteConfirm(false);
    await save();
  };

  const titleKey = "userTypeEditTitle";

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
            <Spinner label={t("loadingUserType")} />
          </div>
        ) : (
          <>
            {isDelete ? (
              <MessageBar intent="warning">
                {t("deleteUserTypeConfirmation", {
                  userType: tipoUsuario.descripcion,
                })}
              </MessageBar>
            ) : null}

            <div className={styles.formGrid}>
              {!isAdd ? (
                <Field label={t("userTypeCode")}>
                  <Input value={String(tipoUsuario.codTipoUsuario ?? "")} disabled />
                </Field>
              ) : null}
              <Field label={t("userTypeDescription")} required={canEditFields}>
                <Input
                  value={tipoUsuario.descripcion ?? ""}
                  disabled={!canEditFields}
                  onChange={updateField("descripcion")}
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
              {t("deleteUserTypeConfirmation", {
                userType: tipoUsuario.descripcion,
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
    </section>
  );
}

export default TipoUsuarioEditarPage;
