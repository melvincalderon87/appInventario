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
import { MenuService } from "../../services/menuService";
import {
  getMenuActionPageThemeStyles,
  useMenuActionPageStyles,
} from "../../styles/pages/menu/menuActionPageStyles";

const EMPTY_MENU = {
  idMenu: "",
  codMenu: 0,
  descripcion: "",
  link: "",
  accion: "",
  icono: "",
  padre: 0,
  orden: 0,
  estatus: true,
  children: [],
};

function toNumber(value) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
}

function MenuEliminarPage() {
  const styles = useMenuActionPageStyles();
  const themeStyles = getMenuActionPageThemeStyles();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { idMenu = "" } = useParams();
  const { values: menu, setValues: setMenu } = useFormStateAdapter(EMPTY_MENU);
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

    async function loadMenu() {
      try {
        setLoading(true);
        setError("");
        const data = await MenuService.obtener(idMenu);
        if (isMounted) setMenu({ ...EMPTY_MENU, ...data });
      } catch (loadError) {
        if (isMounted) setError(loadError.message || t("menuItemLoadError"));
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadMenu();

    return () => {
      isMounted = false;
    };
  }, [idMenu, isAdd, setMenu, t]);

  const updateField = (key) => (_, data) => {
    setMenu((current) => ({
      ...current,
      [key]: data.value,
    }));
  };

  const updateNumberField = (key) => (_, data) => {
    setMenu((current) => ({
      ...current,
      [key]: toNumber(data.value),
    }));
  };

  const back = () => navigate("/menu/listar");

  const goEdit = async () => {
    const response = await validarPermiso({
      ruta: "/menu/editar",
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

    navigate(`/menu/editar/${encodeURIComponent(idMenu)}`);
  };

  const save = async () => {
    try {
      setSaving(true);
      setError("");
      setMessage("");

      if (!setZodValidationError(formSchemas.menu, menu, t, setError).ok) return;

      const payload = {
        ...menu,
        padre: toNumber(menu.padre),
        orden: toNumber(menu.orden),
      };

      if (isAdd) {
        await MenuService.agregar(payload);
        setMessage(t("menuItemAdded"));
        setMenu(EMPTY_MENU);
      }

      if (isEdit) {
        await MenuService.editar(payload);
        setMessage(t("menuItemSaved"));
      }

      if (isDelete) {
        await MenuService.eliminar(payload);
        navigate("/menu/listar");
      }
    } catch (saveError) {
      setError(saveError.message || t("menuItemSaveError"));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    setOpenDeleteConfirm(false);
    await save();
  };

  const titleKey = "menuDeleteTitle";

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
            <Spinner label={t("loadingMenuItem")} />
          </div>
        ) : (
          <>
            {isDelete ? (
              <MessageBar intent="warning">
                {t("deleteMenuConfirmation", { menu: menu.descripcion })}
              </MessageBar>
            ) : null}

            <div className={styles.formGrid}>
              {!isAdd ? (
                <Field label={t("menuCode")}>
                  <Input value={String(menu.codMenu ?? "")} disabled />
                </Field>
              ) : null}
              <Field label={t("menuDescription")} required={canEditFields}>
                <Input
                  value={menu.descripcion ?? ""}
                  disabled={!canEditFields}
                  onChange={updateField("descripcion")}
                />
              </Field>
              <Field label={t("menuLink")}>
                <Input
                  value={menu.link ?? ""}
                  disabled={!canEditFields}
                  onChange={updateField("link")}
                />
              </Field>
              <Field label={t("menuAction")}>
                <Input
                  value={menu.accion ?? ""}
                  disabled={!canEditFields}
                  onChange={updateField("accion")}
                />
              </Field>
              <Field label={t("menuIcon")}>
                <Input
                  value={menu.icono ?? ""}
                  disabled={!canEditFields}
                  onChange={updateField("icono")}
                />
              </Field>
              <Field label={t("menuParent")}>
                <Input
                  type="number"
                  value={String(menu.padre ?? 0)}
                  disabled={!canEditFields}
                  onChange={updateNumberField("padre")}
                />
              </Field>
              <Field label={t("menuOrder")}>
                <Input
                  type="number"
                  value={String(menu.orden ?? 0)}
                  disabled={!canEditFields}
                  onChange={updateNumberField("orden")}
                />
              </Field>
              <Field label={t("menuStatus")}>
                <Switch
                  checked={Boolean(menu.estatus)}
                  disabled={!canEditFields}
                  label={menu.estatus ? t("active") : t("inactive")}
                  onChange={(_, data) =>
                    setMenu((current) => ({
                      ...current,
                      estatus: data.checked,
                    }))
                  }
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
            <DialogContent>{t("deleteMenuConfirmation", { menu: menu.descripcion })}</DialogContent>
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

export default MenuEliminarPage;
