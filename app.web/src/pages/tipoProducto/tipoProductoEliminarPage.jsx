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
import { TipoProductoService } from "../../services/tipoProductoService";
import {
  getTipoProductoActionPageThemeStyles,
  useTipoProductoActionPageStyles,
} from "../../styles/pages/tipoProducto/tipoProductoActionPageStyles";

const EMPTY_TIPO_USUARIO = {
  idTipoProducto: "",
  codTipoProducto: "",
  descripcion: "",
  descripcionCorta: "",
};

function TipoProductoEliminarPage() {
  const styles = useTipoProductoActionPageStyles();
  const themeStyles = getTipoProductoActionPageThemeStyles();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { idTipoProducto = "" } = useParams();
  const { values: tipoProducto, setValues: setTipoProducto } =
    useFormStateAdapter(EMPTY_TIPO_USUARIO);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const isAdd = false;
  const isView = false;
  const isEdit = false;
  const isDelete = true;
  const canEditFields = isAdd || isEdit;

  useEffect(() => {
    if (isAdd) {
      setLoading(false);
      return undefined;
    }

    let isMounted = true;

    async function loadTipoProducto() {
      try {
        setLoading(true);
        setError("");
        const data = await TipoProductoService.obtener(idTipoProducto);
        if (isMounted) setTipoProducto(data);
      } catch (loadError) {
        if (isMounted) setError(loadError.message || t("productTypeLoadError"));
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadTipoProducto();

    return () => {
      isMounted = false;
    };
  }, [idTipoProducto, isAdd, setTipoProducto, t]);

  const updateField = (key) => (_, data) => {
    setTipoProducto((current) => ({
      ...current,
      [key]: data.value,
    }));
  };

  const back = () => navigate("/tipoproducto/listar");

  const goEdit = async () => {
    const response = await validarPermiso({
      ruta: "/tipoproducto/editar",
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

    navigate(`/tipoproducto/editar/${encodeURIComponent(idTipoProducto)}`);
  };

  const save = async () => {
    try {
      setSaving(true);
      setError("");
      setMessage("");

      if (!setZodValidationError(formSchemas.tipoProducto, tipoProducto, t, setError).ok) return;

      const payload = {
        ...tipoProducto,
        codTipoProducto: String(tipoProducto.codTipoProducto ?? "").trim(),
      };

      if (isAdd) {
        await TipoProductoService.agregar(payload);
        setMessage(t("productTypeAdded"));
        setTipoProducto(EMPTY_TIPO_USUARIO);
      }

      if (isEdit) {
        await TipoProductoService.editar(payload);
        setMessage(t("productTypeSaved"));
      }

      if (isDelete) {
        await TipoProductoService.eliminar(payload);
        navigate("/tipoproducto/listar");
      }
    } catch (saveError) {
      setError(saveError.message || t("productTypeSaveError"));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    setOpenDeleteConfirm(false);
    await save();
  };

  const titleKey = "productTypeDeleteTitle";

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
            <Spinner label={t("loadingProductType")} />
          </div>
        ) : (
          <>
            {isDelete ? (
              <MessageBar intent="warning">
                {t("deleteProductTypeConfirmation", {
                  productType: tipoProducto.descripcion,
                })}
              </MessageBar>
            ) : null}

            <div className={styles.formGrid}>
              <Field label={t("productTypeCode")} required={isAdd}>
                <Input
                  maxLength={20}
                  value={String(tipoProducto.codTipoProducto ?? "")}
                  disabled={!isAdd}
                  onChange={updateField("codTipoProducto")}
                />
              </Field>
              <Field label={t("productTypeDescription")} required={canEditFields}>
                <Input
                  value={tipoProducto.descripcion ?? ""}
                  disabled={!canEditFields}
                  onChange={updateField("descripcion")}
                />
              </Field>
              <Field label={t("productTypeShortDescription")} required={canEditFields}>
                <Input
                  maxLength={10}
                  value={tipoProducto.descripcionCorta ?? ""}
                  disabled={!canEditFields}
                  onChange={updateField("descripcionCorta")}
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
              {t("deleteProductTypeConfirmation", {
                productType: tipoProducto.descripcion,
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

export default TipoProductoEliminarPage;
