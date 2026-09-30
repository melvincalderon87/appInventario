import { useEffect, useState } from "react";
import { useFormStateAdapter } from "../../hooks/useFormStateAdapter";
import {
  Badge,
  Checkbox,
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
  Text,
  Title2,
} from "@/components/ui/app-shadcn";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { ListActionButton } from "../../components/common/ListActionButton";
import { PERMISOS } from "../../config/permisos";
import { validarPermiso } from "../../services/authService";
import { UsuarioService } from "../../services/usuarioService";
import {
  getUsuarioActionPageThemeStyles,
  useUsuarioActionPageStyles,
} from "../../styles/pages/usuario/usuarioActionPageStyles";

const EMPTY_USUARIO = {
  idUsuario: "",
  codUsuario: "",
  nombre: "",
  correo: "",
  estatus: true,
};

function UsuarioEditarPage() {
  const styles = useUsuarioActionPageStyles();
  const themeStyles = getUsuarioActionPageThemeStyles();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { idUsuario = "" } = useParams();
  const { values: usuario, setValues: setUsuario } = useFormStateAdapter(EMPTY_USUARIO);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const isView = false;
  const isEdit = true;
  const isDelete = false;

  useEffect(() => {
    let isMounted = true;

    async function loadUsuario() {
      try {
        setLoading(true);
        setError("");
        const data = await UsuarioService.obtener(idUsuario);
        if (isMounted) setUsuario(data);
      } catch (loadError) {
        if (isMounted) setError(loadError.message || t("userLoadError"));
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadUsuario();

    return () => {
      isMounted = false;
    };
  }, [idUsuario, setUsuario, t]);

  const updateField = (key) => (_, data) => {
    setUsuario((current) => ({
      ...current,
      [key]: data.value,
    }));
  };

  const updateStatus = (_, data) => {
    setUsuario((current) => ({
      ...current,
      estatus: data.checked === true,
    }));
  };

  const back = () => navigate("/usuario/listar");

  const goEdit = async () => {
    const response = await validarPermiso({
      ruta: "/usuario/editar",
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

    navigate(`/usuario/editar/${encodeURIComponent(idUsuario)}`);
  };

  const save = async () => {
    try {
      setSaving(true);
      setError("");
      setMessage("");

      if (isEdit) {
        await UsuarioService.editar(usuario);
        setMessage(t("userSaved"));
      }

      if (isDelete) {
        await UsuarioService.eliminar(usuario);
        navigate("/usuario/listar");
      }
    } catch (saveError) {
      setError(saveError.message || t("userSaveError"));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    setOpenDeleteConfirm(false);
    await save();
  };

  const titleKey = "userEditTitle";

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
            <Spinner label={t("loadingUser")} />
          </div>
        ) : (
          <>
            {isDelete ? (
              <MessageBar intent="warning">
                {t("deleteUserConfirmation", { user: usuario.codUsuario })}
              </MessageBar>
            ) : null}

            <div className={styles.formGrid}>
              <Field label={t("userCode")}>
                <Input value={usuario.codUsuario} disabled />
              </Field>
              <Field label={t("userName")} required={isEdit}>
                <Input
                  value={usuario.nombre ?? ""}
                  disabled={!isEdit}
                  onChange={updateField("nombre")}
                />
              </Field>
              <Field label={t("email")} required={isEdit}>
                <Input
                  value={usuario.correo ?? ""}
                  disabled={!isEdit}
                  onChange={updateField("correo")}
                />
              </Field>
              <Field label={t("status")}>
                {isView || isDelete ? (
                  <Badge appearance="tint" color={usuario.estatus ? "success" : "danger"}>
                    {usuario.estatus ? t("active") : t("inactive")}
                  </Badge>
                ) : (
                  <Checkbox
                    checked={usuario.estatus === true}
                    onChange={updateStatus}
                    label={usuario.estatus ? t("active") : t("inactive")}
                  />
                )}
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
              {t("deleteUserConfirmation", { user: usuario.codUsuario })}
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

export default UsuarioEditarPage;
