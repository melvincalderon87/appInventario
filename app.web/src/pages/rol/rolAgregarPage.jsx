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
import { RolService } from "../../services/rolService";
import {
  getRolActionPageThemeStyles,
  useRolActionPageStyles,
} from "../../styles/pages/rol/rolActionPageStyles";

const EMPTY_ROL = {
  idRol: "",
  codRol: 0,
  descripcion: "",
};

function RolAgregarPage() {
  const styles = useRolActionPageStyles();
  const themeStyles = getRolActionPageThemeStyles();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { idRol = "" } = useParams();
  const { values: rol, setValues: setRol } = useFormStateAdapter(EMPTY_ROL);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const isAdd = true;
  const isView = false;
  const isEdit = false;
  const isDelete = false;
  const canEditFields = isAdd || isEdit;

  useEffect(() => {
    if (isAdd) {
      setLoading(false);
      return undefined;
    }

    let isMounted = true;

    async function loadRol() {
      try {
        setLoading(true);
        setError("");
        const data = await RolService.obtener(idRol);
        if (isMounted) setRol(data);
      } catch (loadError) {
        if (isMounted) setError(loadError.message || t("roleLoadError"));
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadRol();

    return () => {
      isMounted = false;
    };
  }, [idRol, isAdd, setRol, t]);

  const updateField = (key) => (_, data) => {
    setRol((current) => ({
      ...current,
      [key]: data.value,
    }));
  };

  const back = () => navigate("/rol/listar");

  const goEdit = async () => {
    const response = await validarPermiso({
      ruta: "/rol/editar",
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

    navigate(`/rol/editar/${encodeURIComponent(idRol)}`);
  };

  const save = async () => {
    try {
      setSaving(true);
      setError("");
      setMessage("");

      if (!setZodValidationError(formSchemas.rol, rol, t, setError).ok) return;

      if (isAdd) {
        await RolService.agregar(rol);
        setMessage(t("roleAdded"));
        setRol(EMPTY_ROL);
      }

      if (isEdit) {
        await RolService.editar(rol);
        setMessage(t("roleSaved"));
      }

      if (isDelete) {
        await RolService.eliminar(rol);
        navigate("/rol/listar");
      }
    } catch (saveError) {
      setError(saveError.message || t("roleSaveError"));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    setOpenDeleteConfirm(false);
    await save();
  };

  const titleKey = "roleAddTitle";

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
            <Spinner label={t("loadingRole")} />
          </div>
        ) : (
          <>
            {isDelete ? (
              <MessageBar intent="warning">
                {t("deleteRoleConfirmation", { role: rol.descripcion })}
              </MessageBar>
            ) : null}

            <div className={styles.formGrid}>
              {!isAdd ? (
                <Field label={t("roleCode")}>
                  <Input value={String(rol.codRol ?? "")} disabled />
                </Field>
              ) : null}
              <Field label={t("roleDescription")} required={canEditFields}>
                <Input
                  value={rol.descripcion ?? ""}
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
            <DialogContent>{t("deleteRoleConfirmation", { role: rol.descripcion })}</DialogContent>
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

export default RolAgregarPage;
