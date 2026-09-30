import { useEffect, useState } from "react";
import { useFormStateAdapter } from "../../hooks/useFormStateAdapter";
import {
  Combobox,
  Field,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  Input,
  MessageBar,
  Option,
  Spinner,
  Title2,
} from "@/components/ui/app-shadcn";
import { useTranslation } from "react-i18next";
import { formSchemas } from "../../validations/formSchemas";
import { setZodValidationError } from "../../validations/zodValidation";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ListActionButton } from "../../components/common/ListActionButton";
import { UsuarioService } from "../../services/usuarioService";
import { TipoUsuarioService } from "../../services/tipoUsuarioService";
import { RolService } from "../../services/rolService";
import { UsuarioConfiguracionService } from "../../services/usuarioConfiguracionService";
import {
  getUsuarioConfiguracionActionPageThemeStyles,
  useUsuarioConfiguracionActionPageStyles,
} from "../../styles/pages/usuarioConfiguracion/usuarioConfiguracionActionPageStyles";

const EMPTY_CONFIG = {
  idUsuario: "",
  codUsuario: "",
  codTipoUsuario: 0,
  codRol: 0,
};

function UsuarioConfiguracionEditarPage() {
  const styles = useUsuarioConfiguracionActionPageStyles();
  const themeStyles = getUsuarioConfiguracionActionPageThemeStyles();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { idUsuario = "" } = useParams();
  const [searchParams] = useSearchParams();
  const { values: configuracion, setValues: setConfiguracion } = useFormStateAdapter(EMPTY_CONFIG);
  const [usuario, setUsuario] = useState(null);
  const [opcionesTipoUsuario, setOpcionesTipoUsuario] = useState([]);
  const [opcionesRol, setOpcionesRol] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const isAdd = false;
  const isEdit = true;
  const isDelete = false;
  const canEditFields = isAdd || isEdit;
  const returnToDefault = "/usuario/listar";
  const returnTo = (() => {
    const fromQuery = searchParams.get("returnTo");
    if (!fromQuery) {
      return returnToDefault;
    }

    try {
      return decodeURIComponent(fromQuery) || returnToDefault;
    } catch {
      return fromQuery;
    }
  })();
  const returnQuery = encodeURIComponent(returnTo);
  const navegarVolver = () =>
    navigate(
      `/usuarioconfiguracion/listar/${encodeURIComponent(idUsuario)}?returnTo=${returnQuery}`
    );

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        setLoading(true);
        setError("");

        const [usuarioData, opcionesTipoUsuarioData, opcionesRolData] = await Promise.all([
          UsuarioService.obtener(idUsuario),
          TipoUsuarioService.ListarOpcion(),
          RolService.ListarOpcion(),
        ]);

        if (!isMounted) return;

        setUsuario(usuarioData);
        setOpcionesTipoUsuario(
          Array.isArray(opcionesTipoUsuarioData) ? opcionesTipoUsuarioData : []
        );
        setOpcionesRol(Array.isArray(opcionesRolData) ? opcionesRolData : []);
      } catch (loadError) {
        if (isMounted) {
          setError(loadError.message || t("userConfigurationLoadError"));
        }
      }
    }

    async function loadConfiguracion() {
      if (!isAdd) {
        try {
          setLoading(true);
          const configData = await UsuarioConfiguracionService.obtener(idUsuario);
          if (isMounted) {
            setConfiguracion(configData);
          }
        } catch (loadConfigError) {
          if (isMounted) {
            setError(loadConfigError.message || t("userConfigurationLoadError"));
          }
        }
      } else if (isMounted) {
        setConfiguracion({
          ...EMPTY_CONFIG,
          idUsuario,
          codUsuario: idUsuario,
        });
      }
      if (isMounted && isAdd) {
        setLoading(false);
      }
    }

    (async () => {
      try {
        await loadData();
        await loadConfiguracion();
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [idUsuario, isAdd, setConfiguracion, t]);

  const selectValue = (field, value) => {
    const parsed = parseInt(value, 10);
    setConfiguracion((current) => ({
      ...current,
      [field]: Number.isNaN(parsed) ? 0 : parsed,
    }));
  };

  const back = () => navegarVolver();

  const save = async () => {
    try {
      setSaving(true);
      setError("");
      setMessage("");

      const payload = {
        ...configuracion,
        idUsuario,
        codUsuario: usuario?.codUsuario ?? configuracion.codUsuario,
      };

      if (!setZodValidationError(formSchemas.usuarioConfiguracion, payload, t, setError).ok) return;

      if (isAdd) {
        await UsuarioConfiguracionService.agregar(payload);
        setMessage(t("userConfigurationAdded"));
      }

      if (isEdit) {
        await UsuarioConfiguracionService.editar(payload);
        setMessage(t("userConfigurationSaved"));
      }

      if (isDelete) {
        await UsuarioConfiguracionService.eliminar(payload);
        navegarVolver();
      }
    } catch (saveError) {
      setError(saveError.message || t("userConfigurationSaveError"));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    setOpenDeleteConfirm(false);
    await save();
  };

  const titleKey = "userConfigurationEditTitle";

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
            <Spinner label={t("loadingUserConfiguration")} />
          </div>
        ) : (
          <>
            {isDelete ? (
              <MessageBar intent="warning">
                {t("deleteUserConfigurationConfirmation", {
                  user: usuario?.codUsuario ?? configuracion.codUsuario ?? "",
                })}
              </MessageBar>
            ) : null}

            <div className={styles.formGrid}>
              <Field label={t("userCode")}>
                <Input value={usuario?.codUsuario ?? configuracion.codUsuario ?? ""} disabled />
              </Field>
              <Field label={t("userConfigurationTypeUser")} required={canEditFields}>
                <Combobox
                  style={{ width: "100%" }}
                  selectedOptions={
                    configuracion.codTipoUsuario ? [String(configuracion.codTipoUsuario)] : []
                  }
                  value={
                    opcionesTipoUsuario.find(
                      (item) => String(item.value) === String(configuracion.codTipoUsuario)
                    )?.text ?? ""
                  }
                  onOptionSelect={(_, data) => selectValue("codTipoUsuario", data.optionValue)}
                  disabled={!canEditFields}
                >
                  {opcionesTipoUsuario.map((option) => (
                    <Option
                      key={String(option.value)}
                      value={String(option.value)}
                      text={option.text}
                    >
                      {option.text}
                    </Option>
                  ))}
                </Combobox>
              </Field>
              <Field label={t("userConfigurationRole")} required={canEditFields}>
                <Combobox
                  style={{ width: "100%" }}
                  selectedOptions={configuracion.codRol ? [String(configuracion.codRol)] : []}
                  value={
                    opcionesRol.find((item) => String(item.value) === String(configuracion.codRol))
                      ?.text ?? ""
                  }
                  onOptionSelect={(_, data) => selectValue("codRol", data.optionValue)}
                  disabled={!canEditFields}
                >
                  {opcionesRol.map((option) => (
                    <Option
                      key={String(option.value)}
                      value={String(option.value)}
                      text={option.text}
                    >
                      {option.text}
                    </Option>
                  ))}
                </Combobox>
              </Field>
              {configuracion.version != null ? (
                <Field label={t("version")}>
                  <Input value={String(configuracion.version)} disabled />
                </Field>
              ) : null}
            </div>

            <div className={styles.buttonRow}>
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
              {t("deleteUserConfigurationConfirmation", {
                user: usuario?.codUsuario ?? configuracion.codUsuario ?? "",
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

export default UsuarioConfiguracionEditarPage;
