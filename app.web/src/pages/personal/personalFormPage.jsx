import { useEffect, useMemo, useState } from "react";
import { useFormStateAdapter } from "../../hooks/useFormStateAdapter";
import {
  Checkbox,
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
  Text,
  Title2,
} from "@/components/ui/app-shadcn";
import { useTranslation } from "react-i18next";
import { formSchemas } from "../../validations/formSchemas";
import { setZodValidationError } from "../../validations/zodValidation";
import { useNavigate, useParams } from "react-router-dom";
import { ListActionButton } from "../../components/common/ListActionButton";
import { PERMISOS } from "../../config/permisos";
import { validarPermiso } from "../../services/authService";
import { PersonalService } from "../../services/personalService";
import {
  getPersonalActionPageThemeStyles,
  usePersonalActionPageStyles,
} from "../../styles/pages/personal/personalActionPageStyles";

const EMPTY_PERSONAL = {
  idPersonal: "",
  codPersonal: 0,
  codTecnico: "",
  nombre: "",
  puesto: "",
  esTecnico: false,
  fotoNombreArchivo: "",
  fotoTipoContenido: "",
  fotoTamanoBytes: 0,
  fotoRutaArchivo: "",
  fotoContenidoBase64: "",
  fotoEliminar: false,
  estatus: true,
};

const ALLOWED_PHOTO_TYPES = new Set(["image/jpeg", "image/png"]);

function toNumber(value) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
}

function normalizePersonal(data) {
  return {
    ...EMPTY_PERSONAL,
    ...data,
    fotoContenidoBase64: "",
    fotoEliminar: false,
  };
}

function inferContentType(file) {
  const name = String(file.name || "").toLowerCase();
  if (name.endsWith(".jpg") || name.endsWith(".jpeg")) return "image/jpeg";
  if (name.endsWith(".png")) return "image/png";

  const type = String(file.type || "").toLowerCase();
  return type || "application/octet-stream";
}

function isAllowedPhoto(file) {
  const name = String(file.name || "").toLowerCase();
  const hasAllowedExtension =
    name.endsWith(".jpg") || name.endsWith(".jpeg") || name.endsWith(".png");

  return hasAllowedExtension && ALLOWED_PHOTO_TYPES.has(inferContentType(file));
}

function readFileAsPhoto(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? "");
      const base64 = result.includes(",") ? result.split(",").pop() : result;
      resolve({
        fotoNombreArchivo: file.name,
        fotoTipoContenido: inferContentType(file),
        fotoTamanoBytes: file.size,
        fotoRutaArchivo: "",
        fotoContenidoBase64: base64,
        fotoEliminar: false,
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

function PersonalFormPage({ mode }) {
  const styles = usePersonalActionPageStyles();
  const themeStyles = getPersonalActionPageThemeStyles();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { idPersonal = "" } = useParams();
  const { values: personal, setValues: setPersonal } = useFormStateAdapter(EMPTY_PERSONAL);
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
  const hasPhoto = Boolean(personal.fotoContenidoBase64 || personal.fotoRutaArchivo);
  const photoPreviewSrc = useMemo(() => {
    if (!personal.fotoContenidoBase64 || !personal.fotoTipoContenido?.startsWith("image/"))
      return "";
    return `data:${personal.fotoTipoContenido};base64,${personal.fotoContenidoBase64}`;
  }, [personal.fotoContenidoBase64, personal.fotoTipoContenido]);

  useEffect(() => {
    if (isAdd) {
      setLoading(false);
      return undefined;
    }

    let isMounted = true;

    async function loadPersonal() {
      try {
        setLoading(true);
        setError("");
        const data = await PersonalService.obtener(idPersonal);
        if (isMounted) setPersonal(normalizePersonal(data));
      } catch (loadError) {
        if (isMounted) setError(loadError.message || t("staffLoadError"));
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadPersonal();

    return () => {
      isMounted = false;
    };
  }, [idPersonal, isAdd, setPersonal, t]);

  const updateField = (key) => (_, data) => {
    setPersonal((current) => ({
      ...current,
      [key]: data.value,
    }));
  };

  const updateBoolField = (key) => (_, data) => {
    setPersonal((current) => ({
      ...current,
      [key]: Boolean(data.checked),
    }));
  };

  const back = () => navigate("/personal/listar");

  const goEdit = async () => {
    const response = await validarPermiso({
      ruta: "/personal/editar",
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

    navigate(`/personal/editar/${encodeURIComponent(idPersonal)}`);
  };

  const save = async () => {
    try {
      setSaving(true);
      setError("");
      setMessage("");

      if (!setZodValidationError(formSchemas.personal, personal, t, setError).ok) return;

      const payload = {
        ...personal,
        codPersonal: toNumber(personal.codPersonal),
        esTecnico: Boolean(personal.esTecnico),
        estatus: Boolean(personal.estatus),
        fotoTamanoBytes: toNumber(personal.fotoTamanoBytes),
        fotoEliminar: Boolean(personal.fotoEliminar),
      };

      if (isAdd) {
        await PersonalService.agregar(payload);
        setMessage(t("staffAdded"));
        setPersonal(EMPTY_PERSONAL);
      }

      if (isEdit) {
        await PersonalService.editar(payload);
        const data = await PersonalService.obtener(idPersonal);
        setPersonal(normalizePersonal(data));
        setMessage(t("staffSaved"));
      }

      if (isDelete) {
        await PersonalService.eliminar(payload);
        navigate("/personal/listar");
      }
    } catch (saveError) {
      setError(saveError.message || t("staffSaveError"));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    setOpenDeleteConfirm(false);
    await save();
  };

  const handlePhotoFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    if (!isAllowedPhoto(file)) {
      setError(t("staffPhotoTypeError"));
      return;
    }

    try {
      setError("");
      const foto = await readFileAsPhoto(file);
      setPersonal((current) => ({
        ...current,
        ...foto,
      }));
    } catch {
      setError(t("staffPhotoReadError"));
    }
  };

  const removePhoto = () => {
    setPersonal((current) => ({
      ...current,
      fotoNombreArchivo: "",
      fotoTipoContenido: "",
      fotoTamanoBytes: 0,
      fotoRutaArchivo: "",
      fotoContenidoBase64: "",
      fotoEliminar: true,
    }));
  };

  const openPhoto = async () => {
    try {
      setError("");

      if (photoPreviewSrc) {
        window.open(photoPreviewSrc, "_blank", "noopener,noreferrer");
        return;
      }

      const blob = await PersonalService.foto(idPersonal || personal.idPersonal);
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (downloadError) {
      setError(downloadError.message || t("staffPhotoDownloadError"));
    }
  };

  const titleKeyByMode = {
    add: "staffAddTitle",
    view: "staffViewTitle",
    edit: "staffEditTitle",
    delete: "staffDeleteTitle",
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
            <Spinner label={t("loadingStaffMember")} />
          </div>
        ) : (
          <>
            {isDelete ? (
              <MessageBar intent="warning">
                {t("deleteStaffConfirmation", { staff: personal.nombre })}
              </MessageBar>
            ) : null}

            <div className={styles.formLayout}>
              <div className={styles.fieldColumn}>
                {!isAdd ? (
                  <Field label={t("staffCode")}>
                    <Input value={String(personal.codPersonal ?? "")} disabled />
                  </Field>
                ) : null}
                <Field label={t("staffTechnicianCode")}>
                  <Input
                    maxLength={50}
                    value={personal.codTecnico ?? ""}
                    disabled={!canEditFields}
                    onChange={updateField("codTecnico")}
                  />
                </Field>
                <Field label={t("staffName")} required={canEditFields}>
                  <Input
                    value={personal.nombre ?? ""}
                    disabled={!canEditFields}
                    onChange={updateField("nombre")}
                  />
                </Field>
                <Field label={t("staffPosition")} required={canEditFields}>
                  <Input
                    value={personal.puesto ?? ""}
                    disabled={!canEditFields}
                    onChange={updateField("puesto")}
                  />
                </Field>
                <Field label={t("staffIsTechnician")}>
                  <Checkbox
                    checked={Boolean(personal.esTecnico)}
                    disabled={!canEditFields}
                    onChange={updateBoolField("esTecnico")}
                  />
                </Field>
                <Field label={t("staffActive")}>
                  <Checkbox
                    checked={Boolean(personal.estatus)}
                    disabled={!canEditFields}
                    onChange={updateBoolField("estatus")}
                  />
                </Field>
              </div>

              <Field className={styles.photoField} label={t("staffPhoto")}>
                <div className={styles.photoPanel}>
                  <div className={styles.photoFrame}>
                    {photoPreviewSrc ? (
                      <img className={styles.photoPreview} src={photoPreviewSrc} alt="" />
                    ) : (
                      <Text>{hasPhoto ? t("staffPhoto") : t("staffNoPhoto")}</Text>
                    )}
                  </div>

                  {canEditFields ? (
                    <label className={styles.fileSelector}>
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png"
                        disabled={!canEditFields}
                        className={styles.hiddenFileInput}
                        aria-label={t("staffPhotoSelect")}
                        onChange={handlePhotoFile}
                      />
                      <span className={styles.fileSelectorButton}>{t("staffPhotoSelect")}</span>
                    </label>
                  ) : null}

                  <div className={styles.photoInfo}>
                    {personal.fotoNombreArchivo ? (
                      <>
                        <Text className={styles.photoMeta}>{personal.fotoNombreArchivo}</Text>
                        <Text className={styles.photoMeta}>
                          {t("staffPhotoSize")}: {formatFileSize(personal.fotoTamanoBytes)}
                        </Text>
                      </>
                    ) : (
                      <Text className={styles.photoMeta}>{t("staffNoPhoto")}</Text>
                    )}

                    <div className={styles.photoActions}>
                      {hasPhoto ? (
                        <ListActionButton
                          action="visualizar"
                          label={t("staffPhotoOpen")}
                          text={t("staffPhotoOpen")}
                          disabled={saving}
                          onClick={openPhoto}
                        />
                      ) : null}
                      {canEditFields && hasPhoto ? (
                        <ListActionButton
                          action="eliminar"
                          label={t("staffPhotoRemove")}
                          text={t("staffPhotoRemove")}
                          disabled={saving}
                          onClick={removePhoto}
                        />
                      ) : null}
                    </div>
                  </div>
                </div>
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
              {t("deleteStaffConfirmation", { staff: personal.nombre })}
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

export default PersonalFormPage;
