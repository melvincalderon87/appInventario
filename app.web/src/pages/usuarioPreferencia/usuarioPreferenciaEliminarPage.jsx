import { useEffect, useState } from "react";
import { useFormStateAdapter } from "../../hooks/useFormStateAdapter";
import {
  Combobox,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  Field,
  Input,
  Option,
  MessageBar,
  Spinner,
  Title2,
} from "@/components/ui/app-shadcn";
import { useTranslation } from "react-i18next";
import { formSchemas } from "../../validations/formSchemas";
import { setZodValidationError } from "../../validations/zodValidation";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ListActionButton } from "../../components/common/ListActionButton";
import { getAppThemes } from "../../config/appThemes";
import { UsuarioService } from "../../services/usuarioService";
import { UsuarioPreferenciaService } from "../../services/usuarioPreferenciaService";
import {
  getUsuarioPreferenciaActionPageThemeStyles,
  useUsuarioPreferenciaActionPageStyles,
} from "../../styles/pages/usuarioPreferencia/usuarioPreferenciaActionPageStyles";

const EMPTY_PREFERENCIA = {
  idUsuario: "",
  codUsuario: "",
  idioma: "",
  theme: "bluedark",
};

function UsuarioPreferenciaEliminarPage() {
  const styles = useUsuarioPreferenciaActionPageStyles();
  const themeStyles = getUsuarioPreferenciaActionPageThemeStyles();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { idUsuario = "" } = useParams();
  const [searchParams] = useSearchParams();
  const { values: preferencia, setValues: setPreferencia } = useFormStateAdapter(EMPTY_PREFERENCIA);
  const [usuario, setUsuario] = useState(null);
  const [opcionesIdioma, setOpcionesIdioma] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const themeOptions = getAppThemes();
  const normalizeTheme = (themeId) =>
    String(themeId ?? "")
      .replace(/-(light|dark)$/i, "")
      .toLowerCase();

  const isAdd = false;
  const isEdit = false;
  const isDelete = true;
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
    navigate(`/usuariopreferencia/listar/${encodeURIComponent(idUsuario)}?returnTo=${returnQuery}`);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        setLoading(true);
        setError("");

        const [usuarioData, idiomas] = await Promise.all([
          UsuarioService.obtener(idUsuario),
          UsuarioPreferenciaService.listarIdioma(),
        ]);

        if (!isMounted) return;

        setUsuario(usuarioData);
        setOpcionesIdioma(Array.isArray(idiomas) ? idiomas : []);
        setPreferencia((current) => ({
          ...current,
          idUsuario,
          codUsuario: usuarioData?.codUsuario ?? current.codUsuario,
        }));

        if (!isAdd) {
          const preferenciaData = await UsuarioPreferenciaService.obtener(idUsuario);
          if (!isMounted) return;
          setPreferencia(preferenciaData);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError.message || t("userPreferenceLoadError"));
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [idUsuario, isAdd, setPreferencia, t]);

  const setSelectField = (key) => (_, data) => {
    const value = data.optionValue ?? data.selectedOptions?.[0] ?? "";
    setPreferencia((current) => ({
      ...current,
      [key]: value ?? "",
    }));
  };

  const selectedThemeOption = themeOptions.find(
    (option) => normalizeTheme(option.id) === normalizeTheme(preferencia.theme)
  );

  const back = () => navegarVolver();

  const save = async () => {
    try {
      setSaving(true);
      setError("");
      setMessage("");

      const payload = {
        ...preferencia,
        idUsuario,
        codUsuario: usuario?.codUsuario ?? preferencia.codUsuario,
      };

      if (!setZodValidationError(formSchemas.usuarioPreferencia, payload, t, setError).ok) return;

      if (isAdd) {
        await UsuarioPreferenciaService.agregar(payload);
        setMessage(t("userPreferenceAdded"));
        navegarVolver();
      }

      if (isEdit) {
        await UsuarioPreferenciaService.editar(payload);
        setMessage(t("userPreferenceSaved"));
      }

      if (isDelete) {
        await UsuarioPreferenciaService.eliminar(payload);
        navegarVolver();
      }
    } catch (saveError) {
      setError(saveError.message || t("userPreferenceSaveError"));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    setOpenDeleteConfirm(false);
    await save();
  };

  const titleKey = "userPreferenceDeleteTitle";

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
            <Spinner label={t("loadingUserPreference")} />
          </div>
        ) : (
          <>
            {isDelete ? (
              <MessageBar intent="warning">
                {t("deleteUserPreferenceConfirmation", {
                  user: usuario?.codUsuario ?? preferencia.codUsuario ?? "",
                })}
              </MessageBar>
            ) : null}

            <div className={styles.formGrid}>
              <Field label={t("userCode")}>
                <Input value={usuario?.codUsuario ?? preferencia.codUsuario ?? ""} disabled />
              </Field>
              <Field label={t("language")} required={canEditFields}>
                <Combobox
                  style={{ width: "100%" }}
                  selectedOptions={preferencia.idioma ? [String(preferencia.idioma)] : []}
                  value={
                    opcionesIdioma.find((item) => String(item.value) === String(preferencia.idioma))
                      ?.text ?? ""
                  }
                  onOptionSelect={setSelectField("idioma")}
                  disabled={!canEditFields}
                >
                  {opcionesIdioma.map((option) => (
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
              <Field label={t("theme")} required={canEditFields}>
                <Combobox
                  style={{ width: "100%" }}
                  selectedOptions={selectedThemeOption ? [selectedThemeOption.id] : []}
                  value={selectedThemeOption?.label ?? ""}
                  disabled={!canEditFields}
                  onOptionSelect={setSelectField("theme")}
                >
                  {themeOptions.map((option) => (
                    <Option key={option.id} value={option.id} text={option.label}>
                      {option.label}
                    </Option>
                  ))}
                </Combobox>
              </Field>
              {preferencia.version != null ? (
                <Field label={t("version")}>
                  <Input value={String(preferencia.version)} disabled />
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
              {t("deleteUserPreferenceConfirmation", {
                user: usuario?.codUsuario ?? preferencia.codUsuario ?? "",
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

export default UsuarioPreferenciaEliminarPage;
