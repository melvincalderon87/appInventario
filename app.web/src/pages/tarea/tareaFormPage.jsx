import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
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
import { useNavigate, useParams } from "react-router-dom";
import { ListActionButton } from "../../components/common/ListActionButton";
import { PERMISOS } from "../../config/permisos";
import { validarPermiso } from "../../services/authService";
import { TareaService } from "../../services/tareaService";
import {
  getTareaActionPageThemeStyles,
  useTareaActionPageStyles,
} from "../../styles/pages/tarea/tareaActionPageStyles";
import { formSchemas } from "../../validations/formSchemas";

const EMPTY_TAREA = {
  idTarea: "",
  codTarea: 0,
  descripcion: "",
  tiempo: "",
  estatus: true,
};

function normalizeTarea(data) {
  return {
    ...EMPTY_TAREA,
    ...data,
  };
}

function toNumber(value) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
}

function buildPayload(tarea) {
  return {
    idTarea: tarea.idTarea,
    codTarea: toNumber(tarea.codTarea),
    descripcion: tarea.descripcion,
    tiempo: tarea.tiempo,
    estatus: tarea.estatus !== false,
  };
}

function TareaFormPage({ mode }) {
  const styles = useTareaActionPageStyles();
  const themeStyles = getTareaActionPageThemeStyles();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { idTarea = "" } = useParams();
  const [loading, setLoading] = useState(mode !== "agregar");
  const [saving, setSaving] = useState(false);
  const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const isAdd = mode === "agregar";
  const isView = mode === "visualizar";
  const isEdit = mode === "editar";
  const isDelete = mode === "eliminar";
  const canEditFields = isAdd || isEdit;

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(formSchemas.tarea),
    defaultValues: EMPTY_TAREA,
  });
  const tarea = watch();

  const titleKey = {
    agregar: "taskAddTitle",
    visualizar: "taskViewTitle",
    editar: "taskEditTitle",
    eliminar: "taskDeleteTitle",
  }[mode];

  useEffect(() => {
    if (isAdd) {
      setLoading(false);
      return undefined;
    }

    let isMounted = true;

    async function loadTarea() {
      try {
        setLoading(true);
        setError("");
        const data = await TareaService.obtener(idTarea);
        if (isMounted) reset(normalizeTarea(data));
      } catch (loadError) {
        if (isMounted) setError(loadError.message || t("taskLoadError"));
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadTarea();

    return () => {
      isMounted = false;
    };
  }, [idTarea, isAdd, reset, t]);

  const back = () => navigate("/tarea/listar");

  const goEdit = async () => {
    const response = await validarPermiso({
      ruta: "/tarea/editar",
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

    navigate(`/tarea/editar/${encodeURIComponent(idTarea)}`);
  };

  const save = async (values) => {
    try {
      setSaving(true);
      setError("");
      setMessage("");

      const payload = buildPayload(values);

      if (isAdd) {
        await TareaService.agregar(payload);
        setMessage(t("taskAdded"));
        reset(EMPTY_TAREA);
      }

      if (isEdit) {
        await TareaService.editar(payload);
        setMessage(t("taskSaved"));
      }
    } catch (saveError) {
      setError(saveError.message || t("taskSaveError"));
    } finally {
      setSaving(false);
    }
  };

  const submit = handleSubmit(save);

  const confirmDelete = async () => {
    setOpenDeleteConfirm(false);

    try {
      setSaving(true);
      setError("");
      await TareaService.eliminar(buildPayload(tarea));
      navigate("/tarea/listar");
    } catch (deleteError) {
      setError(deleteError.message || t("taskSaveError"));
    } finally {
      setSaving(false);
    }
  };

  const errorText = (fieldError) => (fieldError?.message ? t(fieldError.message) : undefined);

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
            <Spinner label={t("loadingTask")} />
          </div>
        ) : (
          <form noValidate onSubmit={submit}>
            {isDelete ? (
              <MessageBar intent="warning">
                {t("deleteTaskConfirmation", {
                  task: tarea.descripcion,
                })}
              </MessageBar>
            ) : null}

            <div className={styles.formGrid}>
              {!isAdd ? (
                <Field label={t("taskCode")}>
                  <Input value={String(tarea.codTarea ?? "")} disabled />
                </Field>
              ) : null}
              <Controller
                control={control}
                name="descripcion"
                render={({ field }) => (
                  <Field
                    label={t("taskDescription")}
                    required={canEditFields}
                    validationMessage={errorText(errors.descripcion)}
                  >
                    <Input
                      maxLength={250}
                      value={field.value ?? ""}
                      disabled={!canEditFields}
                      onChange={(_, data) => field.onChange(data.value)}
                    />
                  </Field>
                )}
              />
              <Controller
                control={control}
                name="tiempo"
                render={({ field }) => (
                  <Field label={t("taskTime")} validationMessage={errorText(errors.tiempo)}>
                    <Input
                      maxLength={100}
                      value={field.value ?? ""}
                      disabled={!canEditFields}
                      onChange={(_, data) => field.onChange(data.value)}
                    />
                  </Field>
                )}
              />
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
                  type="submit"
                />
              ) : null}
              {isEdit ? (
                <ListActionButton
                  action="editar"
                  label={t("save")}
                  text={saving ? t("saving") : t("save")}
                  disabled={saving}
                  type="submit"
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
          </form>
        )}
      </div>

      <Dialog open={openDeleteConfirm} onOpenChange={(_, data) => setOpenDeleteConfirm(data.open)}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>{t("confirmDelete")}</DialogTitle>
            <DialogContent>
              {t("deleteTaskConfirmation", {
                task: tarea.descripcion,
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

export default TareaFormPage;
