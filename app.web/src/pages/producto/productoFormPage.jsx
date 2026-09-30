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
import { ProductoService } from "../../services/productoService";
import { TipoProductoService } from "../../services/tipoProductoService";
import {
  getProductoActionPageThemeStyles,
  useProductoActionPageStyles,
} from "../../styles/pages/producto/productoActionPageStyles";

const EMPTY_PRODUCTO = {
  idProducto: "",
  codProducto: "",
  codTipoProducto: "",
  tipo: "",
  tipoProducto: "",
  producto: "",
  descripcionCorta: "",
  estatus: true,
};

const PRODUCTO_TYPES = ["Base", "Aditivo", "Etanol"];

function ProductoFormPage({ mode }) {
  const styles = useProductoActionPageStyles();
  const themeStyles = getProductoActionPageThemeStyles();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { idProducto = "" } = useParams();
  const { values: producto, setValues: setProducto } = useFormStateAdapter(EMPTY_PRODUCTO);
  const [tiposProducto, setTiposProducto] = useState([]);
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
    let isMounted = true;

    async function loadOptions() {
      try {
        const data = await TipoProductoService.ListarOpcion();
        if (isMounted) setTiposProducto(Array.isArray(data) ? data : []);
      } catch {
        if (isMounted) setTiposProducto([]);
      }
    }

    loadOptions();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (isAdd) {
      setLoading(false);
      return undefined;
    }

    let isMounted = true;

    async function loadProducto() {
      try {
        setLoading(true);
        setError("");
        const data = await ProductoService.obtener(idProducto);
        if (isMounted) setProducto({ ...EMPTY_PRODUCTO, ...data });
      } catch (loadError) {
        if (isMounted) setError(loadError.message || t("productLoadError"));
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadProducto();

    return () => {
      isMounted = false;
    };
  }, [idProducto, isAdd, setProducto, t]);

  const updateField = (key) => (_, data) => {
    setProducto((current) => ({
      ...current,
      [key]: data.value,
    }));
  };

  const updateBoolField = (key) => (_, data) => {
    setProducto((current) => ({
      ...current,
      [key]: Boolean(data.checked),
    }));
  };

  const back = () => navigate("/producto/listar");

  const goEdit = async () => {
    const response = await validarPermiso({
      ruta: "/producto/editar",
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

    navigate(`/producto/editar/${encodeURIComponent(idProducto)}`);
  };

  const save = async () => {
    try {
      setSaving(true);
      setError("");
      setMessage("");

      if (!setZodValidationError(formSchemas.producto, producto, t, setError).ok) return;

      const payload = {
        ...producto,
        codTipoProducto: String(producto.codTipoProducto ?? "").trim(),
        estatus: producto.estatus !== false,
      };

      if (isAdd) {
        await ProductoService.agregar(payload);
        setMessage(t("productAdded"));
        setProducto(EMPTY_PRODUCTO);
      }

      if (isEdit) {
        await ProductoService.editar(payload);
        setMessage(t("productSaved"));
      }

      if (isDelete) {
        await ProductoService.eliminar(payload);
        navigate("/producto/listar");
      }
    } catch (saveError) {
      setError(saveError.message || t("productSaveError"));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    setOpenDeleteConfirm(false);
    await save();
  };

  const titleKeyByMode = {
    add: "productAddTitle",
    view: "productViewTitle",
    edit: "productEditTitle",
    delete: "productDeleteTitle",
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
            <Spinner label={t("loadingProduct")} />
          </div>
        ) : (
          <>
            {isDelete ? (
              <MessageBar intent="warning">
                {t("deleteProductConfirmation", { product: producto.producto })}
              </MessageBar>
            ) : null}

            <div className={styles.formGrid}>
              {!isAdd ? (
                <Field label={t("productCode")}>
                  <Input value={String(producto.codProducto ?? "")} disabled />
                </Field>
              ) : null}
              {isAdd ? (
                <Field label={t("productCode")} required={canEditFields}>
                  <Input
                    maxLength={20}
                    value={producto.codProducto ?? ""}
                    onChange={updateField("codProducto")}
                  />
                </Field>
              ) : null}
              <Field label={t("productType")} required={canEditFields}>
                <Select
                  value={String(producto.codTipoProducto ?? "")}
                  disabled={!canEditFields}
                  onChange={updateField("codTipoProducto")}
                >
                  <option value="">{t("selectOption")}</option>
                  {tiposProducto.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.text}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label={t("productCategory")} required={canEditFields}>
                <Select
                  value={String(producto.tipo ?? "")}
                  disabled={!canEditFields}
                  onChange={updateField("tipo")}
                >
                  <option value="">{t("selectOption")}</option>
                  {PRODUCTO_TYPES.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label={t("productName")} required={canEditFields}>
                <Input
                  value={producto.producto ?? ""}
                  disabled={!canEditFields}
                  onChange={updateField("producto")}
                />
              </Field>
              <Field label={t("productShortDescription")} required={canEditFields}>
                <Input
                  maxLength={10}
                  value={producto.descripcionCorta ?? ""}
                  disabled={!canEditFields}
                  onChange={updateField("descripcionCorta")}
                />
              </Field>
              <Field label={t("productStatus")}>
                <Switch
                  checked={producto.estatus !== false}
                  disabled={!canEditFields}
                  label={producto.estatus !== false ? t("active") : t("inactive")}
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
              {t("deleteProductConfirmation", { product: producto.producto })}
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

export default ProductoFormPage;
