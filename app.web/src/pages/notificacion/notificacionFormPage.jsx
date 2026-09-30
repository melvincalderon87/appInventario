import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
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
  Text,
  Title2,
} from "@/components/ui/app-shadcn";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ListActionButton } from "../../components/common/ListActionButton";
import { LocalizedDateTimeInput } from "../../components/common/LocalizedDateInput";
import { PERMISOS } from "../../config/permisos";
import { usePermisosPantalla } from "../../context/permisosPantallaContext";
import { validarPermiso } from "../../services/authService";
import { NotificacionService } from "../../services/notificacionService";
import { TareaService } from "../../services/tareaService";
import {
  getNotificacionActionPageThemeStyles,
  useNotificacionActionPageStyles,
} from "../../styles/pages/notificacion/notificacionActionPageStyles";
import { sanitizeHtml } from "../../utils/sanitizeHtml";
import { formSchemas } from "../../validations/formSchemas";

const RichTextEditor = lazy(() =>
  import("../../components/richText/RichTextEditor").then((module) => ({ default: module.RichTextEditor }))
);

const EMPTY_NOTIFICACION = {
  idNotificacion: "",
  codNotificacion: 0,
  codTarea: "",
  tareaDescripcion: "",
  descripcion: "",
  asunto: "",
  para: "",
  copia: "",
  texto: "",
  fechaProgramada: "",
  estado: 0,
  estadoDescripcion: "",
  intentos: 0,
  error: "",
  fechaEnviado: "",
  fechaCreacion: "",
  estatus: true,
  adjuntos: [],
};

function toNumber(value) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
}

const ALLOWED_ATTACHMENT_TYPES = new Set(["application/pdf", "image/jpeg", "image/png"]);

function inferContentType(file) {
  const name = String(file.name || "").toLowerCase();
  if (name.endsWith(".pdf")) return "application/pdf";
  if (name.endsWith(".jpg") || name.endsWith(".jpeg")) return "image/jpeg";
  if (name.endsWith(".png")) return "image/png";

  const type = String(file.type || "").toLowerCase();
  return type || "application/octet-stream";
}

function isAllowedAttachment(file) {
  const name = String(file.name || "").toLowerCase();
  const hasAllowedExtension =
    name.endsWith(".pdf") ||
    name.endsWith(".jpg") ||
    name.endsWith(".jpeg") ||
    name.endsWith(".png");

  return hasAllowedExtension && ALLOWED_ATTACHMENT_TYPES.has(inferContentType(file));
}

function toDateTimeLocal(value) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 16);

  const pad = (part) => String(part).padStart(2, "0");
  return (
    [date.getFullYear(), pad(date.getMonth() + 1), pad(date.getDate())].join("-") +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  );
}

function normalizeNotificacion(data) {
  return {
    ...EMPTY_NOTIFICACION,
    ...data,
    codTarea: data?.codTarea ? String(data.codTarea) : "",
    fechaProgramada: toDateTimeLocal(data?.fechaProgramada),
    texto: sanitizeHtml(data?.texto),
    adjuntos: Array.isArray(data?.adjuntos) ? data.adjuntos : [],
  };
}

function buildPayload(notificacion) {
  const codTarea = toNumber(notificacion.codTarea);

  return {
    idNotificacion: notificacion.idNotificacion,
    codNotificacion: toNumber(notificacion.codNotificacion),
    codTarea: codTarea > 0 ? codTarea : null,
    descripcion: notificacion.descripcion,
    asunto: notificacion.asunto,
    para: notificacion.para,
    copia: notificacion.copia,
    texto: sanitizeHtml(notificacion.texto),
    fechaProgramada: notificacion.fechaProgramada || null,
    estatus: notificacion.estatus !== false,
    adjuntos: (Array.isArray(notificacion.adjuntos) ? notificacion.adjuntos : []).map(
      (adjunto) => ({
        codNotificacionAdjunto: toNumber(adjunto.codNotificacionAdjunto),
        codNotificacion: toNumber(notificacion.codNotificacion),
        nombreArchivo: adjunto.nombreArchivo || "",
        tipoContenido: adjunto.tipoContenido || "application/octet-stream",
        tamanoBytes: toNumber(adjunto.tamanoBytes),
        contenidoBase64: adjunto.contenidoBase64 || "",
      })
    ),
  };
}

function readFileAsAttachment(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? "");
      const base64 = result.includes(",") ? result.split(",").pop() : result;
      resolve({
        codNotificacionAdjunto: 0,
        codNotificacion: 0,
        nombreArchivo: file.name,
        tipoContenido: inferContentType(file),
        tamanoBytes: file.size,
        contenidoBase64: base64,
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function formatFileSize(size) {
  const value = Number(size);
  if (!Number.isFinite(value) || value <= 0) return "0 KB";
  if (value < 1024 * 1024) return `${Math.ceil(value / 1024)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function NotificacionFormPage({ mode }) {
  const styles = useNotificacionActionPageStyles();
  const themeStyles = getNotificacionActionPageThemeStyles();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { idNotificacion = "" } = useParams();
  const [searchParams] = useSearchParams();
  const initialCodTarea = searchParams.get("codTarea") || "";
  const { tienePermiso } = usePermisosPantalla();
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
  const canRunActions = !isAdd && !isDelete && tienePermiso("otro");

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(formSchemas.notificacion),
    defaultValues: EMPTY_NOTIFICACION,
  });
  const notificacion = watch();
  const adjuntos = Array.isArray(notificacion.adjuntos) ? notificacion.adjuntos : [];

  const tareasQuery = useQuery({
    queryKey: ["tareas-opciones"],
    queryFn: () => TareaService.ListarOpcion(),
    staleTime: 300000,
  });
  const tareas = Array.isArray(tareasQuery.data) ? tareasQuery.data : [];

  const editorLabels = useMemo(
    () => ({
      bold: t("taskEditorBold"),
      italic: t("taskEditorItalic"),
      underline: t("taskEditorUnderline"),
      heading1: t("taskEditorHeading1"),
      heading2: t("taskEditorHeading2"),
      link: t("taskEditorLink"),
      unlink: t("taskEditorUnlink"),
      linkPrompt: t("taskEditorLinkPrompt"),
      bulletList: t("taskEditorBulletList"),
      orderedList: t("taskEditorOrderedList"),
      alignLeft: t("taskEditorAlignLeft"),
      alignCenter: t("taskEditorAlignCenter"),
      alignRight: t("taskEditorAlignRight"),
      undo: t("taskEditorUndo"),
      redo: t("taskEditorRedo"),
    }),
    [t]
  );

  const titleKey = {
    agregar: "notificationAddTitle",
    visualizar: "notificationViewTitle",
    editar: "notificationEditTitle",
    eliminar: "notificationDeleteTitle",
  }[mode];

  useEffect(() => {
    if (isAdd) {
      reset({ ...EMPTY_NOTIFICACION, codTarea: initialCodTarea });
      setLoading(false);
      return undefined;
    }

    let isMounted = true;

    async function loadNotificacion() {
      try {
        setLoading(true);
        setError("");
        const data = await NotificacionService.obtener(idNotificacion);
        if (isMounted) reset(normalizeNotificacion(data));
      } catch (loadError) {
        if (isMounted) setError(loadError.message || t("notificationLoadError"));
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadNotificacion();

    return () => {
      isMounted = false;
    };
  }, [idNotificacion, initialCodTarea, isAdd, reset, t]);

  const back = () => navigate("/notificacion/listar");

  const goEdit = async () => {
    const response = await validarPermiso({
      ruta: "/notificacion/editar",
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

    navigate(`/notificacion/editar/${encodeURIComponent(idNotificacion)}`);
  };

  const persist = async (values) => {
    const payload = buildPayload(values);

    if (isAdd) {
      const result = await NotificacionService.agregar(payload);
      return result?.key || result?.Key || payload.codNotificacion;
    }

    if (isEdit) {
      await NotificacionService.editar(payload);
    }

    return payload.codNotificacion;
  };

  const save = async (values) => {
    try {
      setSaving(true);
      setError("");
      setMessage("");

      await persist(values);

      if (isAdd) {
        setMessage(t("notificationAdded"));
        reset(EMPTY_NOTIFICACION);
      }

      if (isEdit) {
        setMessage(t("notificationSaved"));
      }
    } catch (saveError) {
      setError(saveError.message || t("notificationSaveError"));
    } finally {
      setSaving(false);
    }
  };

  const executeAction = (action) =>
    handleSubmit(async (values) => {
      try {
        setSaving(true);
        setError("");
        setMessage("");

        const payload = buildPayload(values);
        const codNotificacion = await persist(values);

        if (action === "programar") {
          await NotificacionService.programar(codNotificacion, payload.fechaProgramada);
        }

        if (action === "enviar") {
          await NotificacionService.enviarAhora(codNotificacion);
        }

        if (action === "reintentar") {
          await NotificacionService.reintentar(codNotificacion);
        }

        if (action === "cancelar") {
          await NotificacionService.cancelar(codNotificacion);
        }

        setMessage(t(`notificationAction${action}`));
      } catch (actionError) {
        setError(actionError.message || t("notificationActionError"));
      } finally {
        setSaving(false);
      }
    })();

  const submit = handleSubmit(save);

  const confirmDelete = async () => {
    setOpenDeleteConfirm(false);

    try {
      setSaving(true);
      setError("");
      await NotificacionService.eliminar(buildPayload(notificacion));
      navigate("/notificacion/listar");
    } catch (deleteError) {
      setError(deleteError.message || t("notificationSaveError"));
    } finally {
      setSaving(false);
    }
  };

  const errorText = (fieldError) => (fieldError?.message ? t(fieldError.message) : undefined);

  const handleAttachmentFiles = async (event) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";

    if (files.length === 0) return;

    if (files.some((file) => !isAllowedAttachment(file))) {
      setError(t("notificationAttachmentTypeError"));
      return;
    }

    try {
      setError("");
      const nuevosAdjuntos = await Promise.all(files.map(readFileAsAttachment));
      setValue("adjuntos", [...adjuntos, ...nuevosAdjuntos], {
        shouldDirty: true,
        shouldValidate: true,
      });
    } catch {
      setError(t("notificationAttachmentReadError"));
    }
  };

  const removeAttachment = (index) => {
    setValue(
      "adjuntos",
      adjuntos.filter((_, adjuntoIndex) => adjuntoIndex !== index),
      {
        shouldDirty: true,
        shouldValidate: true,
      }
    );
  };

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
            <Spinner label={t("loadingNotification")} />
          </div>
        ) : (
          <form noValidate onSubmit={submit}>
            {isDelete ? (
              <MessageBar intent="warning">
                {t("deleteNotificationConfirmation", {
                  notification: notificacion.descripcion,
                })}
              </MessageBar>
            ) : null}

            <div className={styles.formGrid}>
              {!isAdd ? (
                <Field label={t("notificationCode")}>
                  <Input value={String(notificacion.codNotificacion ?? "")} disabled />
                </Field>
              ) : null}

              <Controller
                control={control}
                name="codTarea"
                render={({ field }) => (
                  <Field
                    label={t("notificationTask")}
                    validationMessage={errorText(errors.codTarea)}
                  >
                    <Select
                      value={String(field.value ?? "")}
                      disabled={!canEditFields || tareasQuery.isLoading}
                      onChange={(_, data) => field.onChange(data.value)}
                    >
                      <option value="">{t("selectOption")}</option>
                      {tareas.map((tarea) => (
                        <option key={tarea.Value ?? tarea.value} value={tarea.Value ?? tarea.value}>
                          {tarea.Text ?? tarea.text}
                        </option>
                      ))}
                    </Select>
                  </Field>
                )}
              />

              <Controller
                control={control}
                name="descripcion"
                render={({ field }) => (
                  <Field
                    label={t("notificationDescription")}
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

              <div className={styles.fullWidthField}>
                <Text as="h3" className={styles.detailTitle}>
                  {t("notificationSendSection")}
                </Text>
              </div>

              <Controller
                control={control}
                name="asunto"
                render={({ field }) => (
                  <Field
                    label={t("notificationSubject")}
                    validationMessage={errorText(errors.asunto)}
                  >
                    <Input
                      maxLength={500}
                      value={field.value ?? ""}
                      disabled={!canEditFields}
                      onChange={(_, data) => field.onChange(data.value)}
                    />
                  </Field>
                )}
              />

              <Controller
                control={control}
                name="para"
                render={({ field }) => (
                  <Field label={t("notificationTo")} validationMessage={errorText(errors.para)}>
                    <Input
                      value={field.value ?? ""}
                      disabled={!canEditFields}
                      onChange={(_, data) => field.onChange(data.value)}
                    />
                  </Field>
                )}
              />

              <Controller
                control={control}
                name="copia"
                render={({ field }) => (
                  <Field label={t("notificationCopy")} validationMessage={errorText(errors.copia)}>
                    <Input
                      value={field.value ?? ""}
                      disabled={!canEditFields}
                      onChange={(_, data) => field.onChange(data.value)}
                    />
                  </Field>
                )}
              />

              <Controller
                control={control}
                name="fechaProgramada"
                render={({ field }) => (
                  <Field label={t("notificationScheduledDate")}>
                    <LocalizedDateTimeInput
                      value={field.value ?? ""}
                      disabled={!canEditFields}
                      onChange={(_, data) => field.onChange(data.value)}
                    />
                  </Field>
                )}
              />

              {!isAdd ? (
                <>
                  <Field label={t("notificationState")}>
                    <Input
                      value={notificacion.estadoDescripcion || t("notificationPending")}
                      disabled
                    />
                  </Field>
                  <Field label={t("notificationAttempts")}>
                    <Input value={String(notificacion.intentos ?? 0)} disabled />
                  </Field>
                </>
              ) : null}

              <Controller
                control={control}
                name="texto"
                render={({ field }) => (
                  <Field
                    label={t("notificationText")}
                    required={canEditFields}
                    className={styles.editorField}
                    validationMessage={errorText(errors.texto)}
                  >
                    <Suspense fallback={<Spinner label={t("loading")} />}>
                      <RichTextEditor
                        value={field.value ?? ""}
                        disabled={!canEditFields}
                        labels={editorLabels}
                        onChange={field.onChange}
                      />
                    </Suspense>
                  </Field>
                )}
              />

              <div className={`${styles.fullWidthField} ${styles.detailSection}`}>
                <div className={styles.detailHeader}>
                  <Text as="h3" className={styles.detailTitle}>
                    {t("notificationAttachments")}
                  </Text>
                </div>

                {canEditFields ? (
                  <Field
                    label={t("notificationAttachmentAdd")}
                    validationMessage={errorText(errors.adjuntos)}
                  >
                    <Input
                      type="file"
                      multiple
                      accept=".pdf,.jpg,.jpeg,.png"
                      disabled={!canEditFields}
                      onChange={handleAttachmentFiles}
                    />
                  </Field>
                ) : null}

                {adjuntos.length > 0 ? (
                  <div className={styles.detailRows}>
                    {adjuntos.map((adjunto, index) => (
                      <div
                        key={`${adjunto.nombreArchivo}-${index}`}
                        className={styles.detailRow}
                        style={themeStyles.detailRow}
                      >
                        <Field label={t("notificationAttachmentName")}>
                          <Input value={adjunto.nombreArchivo ?? ""} disabled />
                        </Field>
                        <Field label={t("notificationAttachmentSize")}>
                          <Input value={formatFileSize(adjunto.tamanoBytes)} disabled />
                        </Field>
                        <div className={styles.detailActions}>
                          {canEditFields ? (
                            <ListActionButton
                              action="eliminar"
                              label={t("notificationAttachmentRemove")}
                              text={t("notificationAttachmentRemove")}
                              disabled={saving}
                              onClick={() => removeAttachment(index)}
                            />
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Text>{t("notificationNoAttachments")}</Text>
                )}
              </div>

              {!isAdd && notificacion.error ? (
                <Field label={t("notificationError")} className={styles.fullWidthField}>
                  <Input value={notificacion.error} disabled />
                </Field>
              ) : null}
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
              {canRunActions ? (
                <>
                  <ListActionButton
                    action="programar"
                    label={t("notificationSchedule")}
                    text={t("notificationSchedule")}
                    disabled={saving}
                    onClick={() => executeAction("programar")}
                  />
                  <ListActionButton
                    action="enviar"
                    label={t("notificationSendNow")}
                    text={t("notificationSendNow")}
                    disabled={saving}
                    onClick={() => executeAction("enviar")}
                  />
                  <ListActionButton
                    action="reintentar"
                    label={t("notificationRetry")}
                    text={t("notificationRetry")}
                    disabled={saving}
                    onClick={() => executeAction("reintentar")}
                  />
                  <ListActionButton
                    action="cancelar"
                    label={t("notificationCancel")}
                    text={t("notificationCancel")}
                    disabled={saving}
                    onClick={() => executeAction("cancelar")}
                  />
                </>
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
              {t("deleteNotificationConfirmation", {
                notification: notificacion.descripcion,
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

export default NotificacionFormPage;
