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
  MessageBar,
  Option,
  Spinner,
  Title2,
} from "@/components/ui/app-shadcn";
import { useTranslation } from "react-i18next";
import { formSchemas } from "../../validations/formSchemas";
import { setZodValidationError } from "../../validations/zodValidation";
import { useNavigate, useParams } from "react-router-dom";
import { ListActionButton } from "../../components/common/ListActionButton";
import { MenuIdiomaService } from "../../services/menuIdiomaService";
import { MenuService } from "../../services/menuService";
import { IdiomaService } from "../../services/idiomaService";
import {
  getMenuIdiomaActionPageThemeStyles,
  useMenuIdiomaActionPageStyles,
} from "../../styles/pages/menuIdioma/menuIdiomaActionPageStyles";

const EMPTY_MENU_IDIOMA = {
  idMenuIdioma: "",
  codMenu: 0,
  idioma: "",
  descripcion: "",
};

function MenuIdiomaEliminarPage() {
  const styles = useMenuIdiomaActionPageStyles();
  const themeStyles = getMenuIdiomaActionPageThemeStyles();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { idMenuIdioma = "" } = useParams();
  const { values: menuIdioma, setValues: setMenuIdioma } = useFormStateAdapter(EMPTY_MENU_IDIOMA);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [opcionesMenu, setOpcionesMenu] = useState([]);
  const [opcionesIdioma, setOpcionesIdioma] = useState([]);
  const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const isAdd = false;
  const isEdit = false;
  const isDelete = true;
  const canEditFields = isAdd || isEdit;

  useEffect(() => {
    let isMounted = true;

    async function loadOptions() {
      const [menus, idiomas] = await Promise.all([
        MenuService.ListarOpcion(),
        IdiomaService.ListarOpcion(),
      ]);

      if (!isMounted) return;
      setOpcionesMenu(Array.isArray(menus) ? menus : []);
      setOpcionesIdioma(Array.isArray(idiomas) ? idiomas : []);
    }

    async function loadData() {
      try {
        setLoading(true);
        setError("");
        await loadOptions();

        if (!isAdd) {
          const data = await MenuIdiomaService.obtener(idMenuIdioma);
          if (!isMounted) return;
          setMenuIdioma(data);
        } else if (isMounted) {
          setMenuIdioma(EMPTY_MENU_IDIOMA);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError.message || t("menuIdiomaLoadError"));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [idMenuIdioma, isAdd, setMenuIdioma, t]);

  const setField = (key) => (_, data) => {
    setMenuIdioma((current) => ({
      ...current,
      [key]: data.value,
    }));
  };

  const setNumeric = (key) => (_, data) => {
    const value = Number(data.value);
    setMenuIdioma((current) => ({
      ...current,
      [key]: Number.isNaN(value) ? 0 : value,
    }));
  };

  const back = () => navigate("/menuidioma/listar");

  const save = async () => {
    try {
      setSaving(true);
      setError("");
      setMessage("");

      if (!setZodValidationError(formSchemas.menuIdioma, menuIdioma, t, setError).ok) return;

      if (isAdd) {
        await MenuIdiomaService.agregar(menuIdioma);
        setMessage(t("menuIdiomaAdded"));
        setMenuIdioma(EMPTY_MENU_IDIOMA);
      }

      if (isEdit) {
        await MenuIdiomaService.editar(menuIdioma);
        setMessage(t("menuIdiomaSaved"));
      }

      if (isDelete) {
        await MenuIdiomaService.eliminar(menuIdioma);
        navigate("/menuidioma/listar");
      }
    } catch (saveError) {
      setError(saveError.message || t("menuIdiomaSaveError"));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    setOpenDeleteConfirm(false);
    await save();
  };

  const titleKey = "menuIdiomaDeleteTitle";

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
            <Spinner label={t("loadingMenuIdiomaItem")} />
          </div>
        ) : (
          <>
            {isDelete ? (
              <MessageBar intent="warning">
                {t("deleteMenuIdiomaConfirmation", {
                  menu: menuIdioma.descripcion,
                })}
              </MessageBar>
            ) : null}

            <div className={styles.formGrid}>
              <Field label={t("menuCode")} required={canEditFields}>
                <Combobox
                  style={{ width: "100%" }}
                  selectedOptions={menuIdioma.codMenu ? [String(menuIdioma.codMenu)] : []}
                  value={
                    opcionesMenu.find((item) => String(item.value) === String(menuIdioma.codMenu))
                      ?.text ?? ""
                  }
                  onOptionSelect={(_, data) =>
                    setNumeric("codMenu")(null, { value: data.optionValue })
                  }
                  disabled={!canEditFields}
                >
                  {opcionesMenu.map((option) => (
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
              <Field label={t("language")} required={canEditFields}>
                <Combobox
                  style={{ width: "100%" }}
                  selectedOptions={menuIdioma.idioma ? [String(menuIdioma.idioma)] : []}
                  value={
                    opcionesIdioma.find((item) => String(item.value) === String(menuIdioma.idioma))
                      ?.text ?? ""
                  }
                  onOptionSelect={(_, data) =>
                    setField("idioma")(null, { value: data.optionValue })
                  }
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
              <Field label={t("menuDescription")} required={canEditFields}>
                <Input
                  value={menuIdioma.descripcion ?? ""}
                  disabled={!canEditFields}
                  onChange={setField("descripcion")}
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
              {t("deleteMenuIdiomaConfirmation", {
                menu: menuIdioma.descripcion,
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

export default MenuIdiomaEliminarPage;
