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
import { MenuService } from "../../services/menuService";
import { MenuRutaService } from "../../services/menuRutaService";
import { TipoPermisoService } from "../../services/tipoPermisoService";
import {
  getMenuRutaActionPageThemeStyles,
  useMenuRutaActionPageStyles,
} from "../../styles/pages/menuRuta/menuRutaActionPageStyles";

const EMPTY_MENU_RUTA = {
  ruta: "",
  codMenu: 0,
  menuDescripcion: "",
  codTipoPermiso: 0,
  tipoPermisoDescripcion: "",
  estatus: true,
};

function toNumber(value) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
}

function MenuRutaEliminarPage() {
  const styles = useMenuRutaActionPageStyles();
  const themeStyles = getMenuRutaActionPageThemeStyles();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { ruta: rutaParam = "" } = useParams();
  const ruta = decodeURIComponent(rutaParam);

  const { values: menuRuta, setValues: setMenuRuta } = useFormStateAdapter(EMPTY_MENU_RUTA);
  const [menuOptions, setMenuOptions] = useState([]);
  const [tipoPermisoOptions, setTipoPermisoOptions] = useState([]);
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
    let isMounted = true;

    async function loadOptions() {
      try {
        const [menus, tiposPermiso] = await Promise.all([
          MenuService.ListarOpcion(),
          TipoPermisoService.ListarOpcion(),
        ]);

        if (isMounted) {
          setMenuOptions(Array.isArray(menus) ? menus : []);
          setTipoPermisoOptions(Array.isArray(tiposPermiso) ? tiposPermiso : []);
        }
      } catch {
        if (isMounted) {
          setMenuOptions([]);
          setTipoPermisoOptions([]);
        }
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

    async function loadMenuRuta() {
      try {
        setLoading(true);
        setError("");
        const data = await MenuRutaService.obtener(ruta);
        if (isMounted) setMenuRuta({ ...EMPTY_MENU_RUTA, ...data });
      } catch (loadError) {
        if (isMounted) setError(loadError.message || t("menuRouteLoadError"));
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadMenuRuta();

    return () => {
      isMounted = false;
    };
  }, [ruta, isAdd, t, setMenuRuta]);

  const updateField = (key) => (_, data) => {
    setMenuRuta((current) => ({
      ...current,
      [key]: data.value,
    }));
  };

  const updateNumberField = (key) => (_, data) => {
    setMenuRuta((current) => ({
      ...current,
      [key]: toNumber(data.value),
    }));
  };

  const back = () => navigate("/menuruta/listar");

  const goEdit = async () => {
    const response = await validarPermiso({
      ruta: "/menuruta/editar",
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

    navigate(`/menuruta/editar/${encodeURIComponent(ruta)}`);
  };

  const save = async () => {
    try {
      setSaving(true);
      setError("");
      setMessage("");

      if (!setZodValidationError(formSchemas.menuRuta, menuRuta, t, setError).ok) return;

      const payload = {
        ...menuRuta,
        codMenu: toNumber(menuRuta.codMenu),
        codTipoPermiso: toNumber(menuRuta.codTipoPermiso),
      };

      if (isAdd) {
        await MenuRutaService.agregar(payload);
        setMessage(t("menuRouteAdded"));
        setMenuRuta(EMPTY_MENU_RUTA);
      }

      if (isEdit) {
        await MenuRutaService.editar(payload);
        setMessage(t("menuRouteSaved"));
      }

      if (isDelete) {
        await MenuRutaService.eliminar(payload);
        navigate("/menuruta/listar");
      }
    } catch (saveError) {
      setError(saveError.message || t("menuRouteSaveError"));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    setOpenDeleteConfirm(false);
    await save();
  };

  const titleKey = "menuRouteDeleteTitle";

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
            <Spinner label={t("loadingMenuRoute")} />
          </div>
        ) : (
          <>
            {isDelete ? (
              <MessageBar intent="warning">
                {t("deleteMenuRouteConfirmation", { route: menuRuta.ruta })}
              </MessageBar>
            ) : null}

            <div className={styles.formGrid}>
              <Field label={t("menuRoutePath")} required={isAdd}>
                <Input
                  value={menuRuta.ruta ?? ""}
                  disabled={!isAdd}
                  onChange={updateField("ruta")}
                />
              </Field>
              <Field label={t("menuDescription")} required={canEditFields}>
                <Select
                  value={String(menuRuta.codMenu || "")}
                  disabled={!canEditFields}
                  onChange={updateNumberField("codMenu")}
                >
                  <option value="">{t("selectOption")}</option>
                  {menuOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.text}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label={t("permissionType")} required={canEditFields}>
                <Select
                  value={String(menuRuta.codTipoPermiso || "")}
                  disabled={!canEditFields}
                  onChange={updateNumberField("codTipoPermiso")}
                >
                  <option value="">{t("selectOption")}</option>
                  {tipoPermisoOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.text}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label={t("menuStatus")}>
                <Switch
                  checked={Boolean(menuRuta.estatus)}
                  disabled={!canEditFields}
                  label={menuRuta.estatus ? t("active") : t("inactive")}
                  onChange={(_, data) =>
                    setMenuRuta((current) => ({
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
            <DialogContent>
              {t("deleteMenuRouteConfirmation", { route: menuRuta.ruta })}
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

export default MenuRutaEliminarPage;
