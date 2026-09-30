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
  Title2,
} from "@/components/ui/app-shadcn";
import { useTranslation } from "react-i18next";
import { formSchemas } from "../../validations/formSchemas";
import { setZodValidationError } from "../../validations/zodValidation";
import { useNavigate, useParams } from "react-router-dom";
import { ListActionButton } from "../../components/common/ListActionButton";
import { IdiomaService } from "../../services/idiomaService";
import {
  getIdiomaActionPageThemeStyles,
  useIdiomaActionPageStyles,
} from "../../styles/pages/idioma/idiomaActionPageStyles";

const EMPTY_IDIOMA = {
  idIdioma: "",
  idioma: "",
  descripcion: "",
};

function IdiomaEditarPage() {
  const styles = useIdiomaActionPageStyles();
  const themeStyles = getIdiomaActionPageThemeStyles();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { idIdioma = "" } = useParams();
  const { values: idioma, setValues: setIdioma } = useFormStateAdapter(EMPTY_IDIOMA);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const isAdd = false;
  const isEdit = true;
  const isDelete = false;
  const canEditFields = isAdd || isEdit;

  useEffect(() => {
    if (isAdd) {
      setLoading(false);
      return undefined;
    }

    let isMounted = true;

    async function loadIdioma() {
      try {
        setLoading(true);
        setError("");
        const data = await IdiomaService.obtener(idIdioma);
        if (isMounted) {
          setIdioma(data);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError.message || t("idiomaLoadError"));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadIdioma();

    return () => {
      isMounted = false;
    };
  }, [idIdioma, isAdd, setIdioma, t]);

  const updateField = (key) => (_, data) => {
    setIdioma((current) => ({
      ...current,
      [key]: data.value,
    }));
  };

  const back = () => navigate("/idioma/listar");

  const save = async () => {
    try {
      setSaving(true);
      setError("");
      setMessage("");

      if (!setZodValidationError(formSchemas.idioma, idioma, t, setError).ok) return;

      if (isAdd) {
        await IdiomaService.agregar(idioma);
        setMessage(t("idiomaAdded"));
        setIdioma(EMPTY_IDIOMA);
      }

      if (isEdit) {
        await IdiomaService.editar(idioma);
        setMessage(t("idiomaSaved"));
      }

      if (isDelete) {
        await IdiomaService.eliminar(idioma);
        navigate("/idioma/listar");
      }
    } catch (saveError) {
      setError(saveError.message || t("idiomaSaveError"));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    setOpenDeleteConfirm(false);
    await save();
  };

  const titleKey = "idiomaEditTitle";

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
            <Spinner label={t("loadingIdioma")} />
          </div>
        ) : (
          <>
            {isDelete ? (
              <MessageBar intent="warning">
                {t("deleteIdiomaConfirmation", { language: idioma.idioma })}
              </MessageBar>
            ) : null}

            <div className={styles.formGrid}>
              <Field label={t("idiomaCodeValue")} required={canEditFields}>
                <Input
                  value={idioma.idioma ?? ""}
                  disabled={!canEditFields}
                  onChange={updateField("idioma")}
                />
              </Field>
              <Field label={t("idiomaDescription")} required={canEditFields}>
                <Input
                  value={idioma.descripcion ?? ""}
                  disabled={!canEditFields}
                  onChange={updateField("descripcion")}
                />
              </Field>
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
              {t("deleteIdiomaConfirmation", { language: idioma.idioma })}
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

export default IdiomaEditarPage;
