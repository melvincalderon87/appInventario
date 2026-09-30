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
  Select,
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
import { CompaniaInspeccionService } from "../../services/companiaInspeccionService";
import { PersonalExternoService } from "../../services/personalExternoService";
import {
  getPersonalExternoActionPageThemeStyles,
  usePersonalExternoActionPageStyles,
} from "../../styles/pages/personalExterno/personalExternoActionPageStyles";

const EMPTY_PERSONAL_EXTERNO = {
  idPersonalExterno: "",
  codPersonalExterno: 0,
  idCompaniaInspeccion: "",
  codCompaniaInspeccion: 0,
  companiaInspeccion: "",
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
  adjuntos: [],
};

const ALLOWED_PHOTO_TYPES = new Set(["image/jpeg", "image/png"]);
const ALLOWED_ATTACHMENT_TYPES = new Set(["application/pdf", "image/jpeg", "image/png"]);

function toNumber(value) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
}

function normalizePersonalExterno(data) {
  return {
    ...EMPTY_PERSONAL_EXTERNO,
    ...data,
    fotoContenidoBase64: "",
    fotoEliminar: false,
    adjuntos: Array.isArray(data?.adjuntos) ? data.adjuntos : [],
  };
}

function inferContentType(file) {
  const name = String(file.name || "").toLowerCase();
  if (name.endsWith(".pdf")) return "application/pdf";
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

function isAllowedAttachment(file) {
  const name = String(file.name || "").toLowerCase();
  const hasAllowedExtension =
    name.endsWith(".pdf") ||
    name.endsWith(".jpg") ||
    name.endsWith(".jpeg") ||
    name.endsWith(".png");

  return hasAllowedExtension && ALLOWED_ATTACHMENT_TYPES.has(inferContentType(file));
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

function readFileAsAttachment(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? "");
      const base64 = result.includes(",") ? result.split(",").pop() : result;
      resolve({
        codPersonalExternoAdjunto: 0,
        codPersonalExterno: 0,
        nombreArchivo: file.name,
        tipoContenido: inferContentType(file),
        tamanoBytes: file.size,
        rutaArchivo: "",
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

function PersonalExternoFormPage({ mode }) {
  const styles = usePersonalExternoActionPageStyles();
  const themeStyles = getPersonalExternoActionPageThemeStyles();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { idPersonalExterno = "", idCompaniaInspeccion = "" } = useParams();
  const { values: personalExterno, setValues: setPersonalExterno } =
    useFormStateAdapter(EMPTY_PERSONAL_EXTERNO);
  const [companias, setCompanias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const isAdd = mode === "add";
  const isView = mode === "view";
  const isEdit = mode === "edit";
  const isDelete = mode === "delete";
  const canEditFields = isAdd || isEdit;
  const hasPhoto = Boolean(personalExterno.fotoContenidoBase64 || personalExterno.fotoRutaArchivo);
  const companyLocked = Boolean(idCompaniaInspeccion);
  const adjuntos = Array.isArray(personalExterno.adjuntos) ? personalExterno.adjuntos : [];
  const photoPreviewSrc = useMemo(() => {
    if (
      !personalExterno.fotoContenidoBase64 ||
      !personalExterno.fotoTipoContenido?.startsWith("image/")
    )
      return "";
    return `data:${personalExterno.fotoTipoContenido};base64,${personalExterno.fotoContenidoBase64}`;
  }, [personalExterno.fotoContenidoBase64, personalExterno.fotoTipoContenido]);

  useEffect(() => {
    let isMounted = true;

    async function loadCompanies() {
      try {
        const data = await CompaniaInspeccionService.ListarOpcion();
        if (isMounted) setCompanias(Array.isArray(data) ? data : []);
      } catch {
        if (isMounted) setCompanias([]);
      }
    }

    loadCompanies();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isAdd || !idCompaniaInspeccion) {
      return undefined;
    }

    let isMounted = true;

    async function loadSelectedCompany() {
      try {
        setLoading(true);
        setError("");
        const compania = await CompaniaInspeccionService.obtener(idCompaniaInspeccion);
        if (!isMounted) return;
        setPersonalExterno((current) => ({
          ...current,
          idCompaniaInspeccion: compania.idCompaniaInspeccion,
          codCompaniaInspeccion: toNumber(compania.codCompaniaInspeccion),
          companiaInspeccion: compania.nombreComercial ?? "",
        }));
      } catch (loadError) {
        if (isMounted) setError(loadError.message || t("inspectionCompanyLoadError"));
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadSelectedCompany();

    return () => {
      isMounted = false;
    };
  }, [idCompaniaInspeccion, isAdd, setPersonalExterno, t]);

  useEffect(() => {
    if (isAdd) {
      setLoading(false);
      return undefined;
    }

    let isMounted = true;

    async function loadPersonalExterno() {
      try {
        setLoading(true);
        setError("");
        const data = await PersonalExternoService.obtener(idPersonalExterno);
        if (isMounted) setPersonalExterno(normalizePersonalExterno(data));
      } catch (loadError) {
        if (isMounted) setError(loadError.message || t("externalStaffLoadError"));
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadPersonalExterno();

    return () => {
      isMounted = false;
    };
  }, [idPersonalExterno, isAdd, setPersonalExterno, t]);

  const updateField = (key) => (_, data) => {
    setPersonalExterno((current) => ({
      ...current,
      [key]: data.value,
    }));
  };

  const updateNumberField = (key) => (_, data) => {
    const value = toNumber(data.value);
    const selectedCompany = companias.find((option) => toNumber(option.value) === value);
    setPersonalExterno((current) => ({
      ...current,
      [key]: value,
      idCompaniaInspeccion: key === "codCompaniaInspeccion" ? "" : current.idCompaniaInspeccion,
      companiaInspeccion:
        key === "codCompaniaInspeccion"
          ? (selectedCompany?.text ?? current.companiaInspeccion)
          : current.companiaInspeccion,
    }));
  };

  const updateBoolField = (key) => (_, data) => {
    setPersonalExterno((current) => ({
      ...current,
      [key]: Boolean(data.checked),
    }));
  };

  const listRoute = () => {
    const companyId = idCompaniaInspeccion || personalExterno.idCompaniaInspeccion;
    return companyId
      ? `/personalexterno/listar/${encodeURIComponent(companyId)}`
      : "/personalexterno/listar";
  };

  const back = () => navigate(listRoute());

  const goEdit = async () => {
    const response = await validarPermiso({
      ruta: "/personalexterno/editar",
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

    navigate(`/personalexterno/editar/${encodeURIComponent(idPersonalExterno)}`);
  };

  const save = async () => {
    try {
      setSaving(true);
      setError("");
      setMessage("");

      if (!setZodValidationError(formSchemas.personalExterno, personalExterno, t, setError).ok)
        return;

      const payload = {
        ...personalExterno,
        codPersonalExterno: toNumber(personalExterno.codPersonalExterno),
        codCompaniaInspeccion: toNumber(personalExterno.codCompaniaInspeccion),
        esTecnico: Boolean(personalExterno.esTecnico),
        estatus: Boolean(personalExterno.estatus),
        fotoTamanoBytes: toNumber(personalExterno.fotoTamanoBytes),
        fotoEliminar: Boolean(personalExterno.fotoEliminar),
        adjuntos: adjuntos.map((adjunto) => ({
          codPersonalExternoAdjunto: toNumber(adjunto.codPersonalExternoAdjunto),
          codPersonalExterno: toNumber(personalExterno.codPersonalExterno),
          nombreArchivo: adjunto.nombreArchivo || "",
          tipoContenido: adjunto.tipoContenido || "application/octet-stream",
          tamanoBytes: toNumber(adjunto.tamanoBytes),
          rutaArchivo: adjunto.rutaArchivo || "",
          contenidoBase64: adjunto.contenidoBase64 || "",
        })),
      };

      if (isAdd) {
        await PersonalExternoService.agregar(payload);
        setMessage(t("externalStaffAdded"));
        setPersonalExterno({
          ...EMPTY_PERSONAL_EXTERNO,
          idCompaniaInspeccion: personalExterno.idCompaniaInspeccion,
          codCompaniaInspeccion: toNumber(personalExterno.codCompaniaInspeccion),
          companiaInspeccion: personalExterno.companiaInspeccion,
        });
        setActiveTab("general");
      }

      if (isEdit) {
        await PersonalExternoService.editar(payload);
        const data = await PersonalExternoService.obtener(idPersonalExterno);
        setPersonalExterno(normalizePersonalExterno(data));
        setMessage(t("externalStaffSaved"));
      }

      if (isDelete) {
        await PersonalExternoService.eliminar(payload);
        navigate(listRoute());
      }
    } catch (saveError) {
      setError(saveError.message || t("externalStaffSaveError"));
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
      setError(t("externalStaffPhotoTypeError"));
      return;
    }

    try {
      setError("");
      const foto = await readFileAsPhoto(file);
      setPersonalExterno((current) => ({
        ...current,
        ...foto,
      }));
    } catch {
      setError(t("externalStaffPhotoReadError"));
    }
  };

  const removePhoto = () => {
    setPersonalExterno((current) => ({
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

      const blob = await PersonalExternoService.foto(
        idPersonalExterno || personalExterno.idPersonalExterno
      );
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (downloadError) {
      setError(downloadError.message || t("externalStaffPhotoDownloadError"));
    }
  };

  const handleAttachmentFiles = async (event) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";

    if (files.length === 0) return;

    if (files.some((file) => !isAllowedAttachment(file))) {
      setError(t("externalStaffAttachmentTypeError"));
      return;
    }

    try {
      setError("");
      const nuevosAdjuntos = await Promise.all(files.map(readFileAsAttachment));
      setPersonalExterno((current) => ({
        ...current,
        adjuntos: [...(Array.isArray(current.adjuntos) ? current.adjuntos : []), ...nuevosAdjuntos],
      }));
    } catch {
      setError(t("externalStaffAttachmentReadError"));
    }
  };

  const removeAttachment = (index) => {
    setPersonalExterno((current) => ({
      ...current,
      adjuntos: (Array.isArray(current.adjuntos) ? current.adjuntos : []).filter(
        (_, adjuntoIndex) => adjuntoIndex !== index
      ),
    }));
  };

  const openAttachment = async (adjunto) => {
    try {
      setError("");
      const blob = await PersonalExternoService.archivo(
        idPersonalExterno || personalExterno.idPersonalExterno,
        adjunto.codPersonalExternoAdjunto
      );
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (downloadError) {
      setError(downloadError.message || t("externalStaffAttachmentDownloadError"));
    }
  };

  const titleKeyByMode = {
    add: "externalStaffAddTitle",
    view: "externalStaffViewTitle",
    edit: "externalStaffEditTitle",
    delete: "externalStaffDeleteTitle",
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
            <Spinner label={t("loadingExternalStaffMember")} />
          </div>
        ) : (
          <>
            {isDelete ? (
              <MessageBar intent="warning">
                {t("deleteExternalStaffConfirmation", { staff: personalExterno.nombre })}
              </MessageBar>
            ) : null}

            <div className={styles.tabs} role="tablist" aria-label={t("externalStaffAttachments")}>
              <button
                type="button"
                className={styles.tabButton}
                aria-selected={activeTab === "general"}
                onClick={() => setActiveTab("general")}
              >
                {t("externalStaffTabGeneral")}
              </button>
              <button
                type="button"
                className={styles.tabButton}
                aria-selected={activeTab === "files"}
                onClick={() => setActiveTab("files")}
              >
                {t("externalStaffTabFiles")}
              </button>
            </div>

            {activeTab === "general" ? (
              <div className={styles.formLayout}>
                <div className={styles.fieldColumn}>
                  {!isAdd ? (
                    <Field label={t("externalStaffCode")}>
                      <Input value={String(personalExterno.codPersonalExterno ?? "")} disabled />
                    </Field>
                  ) : null}
                  <Field label={t("externalStaffTechnicianCode")}>
                    <Input
                      maxLength={50}
                      value={personalExterno.codTecnico ?? ""}
                      disabled={!canEditFields}
                      onChange={updateField("codTecnico")}
                    />
                  </Field>
                  <Field label={t("externalStaffName")} required={canEditFields}>
                    <Input
                      value={personalExterno.nombre ?? ""}
                      disabled={!canEditFields}
                      onChange={updateField("nombre")}
                    />
                  </Field>
                  <Field label={t("externalStaffPosition")} required={canEditFields}>
                    <Input
                      value={personalExterno.puesto ?? ""}
                      disabled={!canEditFields}
                      onChange={updateField("puesto")}
                    />
                  </Field>
                  <Field label={t("externalStaffIsTechnician")}>
                    <Checkbox
                      checked={Boolean(personalExterno.esTecnico)}
                      disabled={!canEditFields}
                      onChange={updateBoolField("esTecnico")}
                    />
                  </Field>
                  <Field label={t("externalStaffCompany")} required={canEditFields}>
                    <Select
                      value={String(personalExterno.codCompaniaInspeccion || "")}
                      disabled={!canEditFields || companyLocked}
                      onChange={updateNumberField("codCompaniaInspeccion")}
                    >
                      <option value="">{t("selectOption")}</option>
                      {personalExterno.codCompaniaInspeccion &&
                      personalExterno.companiaInspeccion ? (
                        <option value={personalExterno.codCompaniaInspeccion}>
                          {personalExterno.companiaInspeccion}
                        </option>
                      ) : null}
                      {companias
                        .filter(
                          (option) =>
                            toNumber(option.value) !==
                            toNumber(personalExterno.codCompaniaInspeccion)
                        )
                        .map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.text}
                          </option>
                        ))}
                    </Select>
                  </Field>
                  <Field label={t("externalStaffActive")}>
                    <Checkbox
                      checked={Boolean(personalExterno.estatus)}
                      disabled={!canEditFields}
                      onChange={updateBoolField("estatus")}
                    />
                  </Field>
                </div>

                <Field className={styles.photoField} label={t("externalStaffPhoto")}>
                  <div className={styles.photoPanel}>
                    <div className={styles.photoFrame}>
                      {photoPreviewSrc ? (
                        <img className={styles.photoPreview} src={photoPreviewSrc} alt="" />
                      ) : (
                        <Text>
                          {hasPhoto ? t("externalStaffPhoto") : t("externalStaffNoPhoto")}
                        </Text>
                      )}
                    </div>

                    {canEditFields ? (
                      <label className={styles.fileSelector}>
                        <input
                          type="file"
                          accept=".jpg,.jpeg,.png"
                          disabled={!canEditFields}
                          className={styles.hiddenFileInput}
                          aria-label={t("externalStaffPhotoSelect")}
                          onChange={handlePhotoFile}
                        />
                        <span className={styles.fileSelectorButton}>
                          {t("externalStaffPhotoSelect")}
                        </span>
                      </label>
                    ) : null}

                    <div className={styles.photoInfo}>
                      {personalExterno.fotoNombreArchivo ? (
                        <>
                          <Text className={styles.photoMeta}>
                            {personalExterno.fotoNombreArchivo}
                          </Text>
                          <Text className={styles.photoMeta}>
                            {t("externalStaffPhotoSize")}:{" "}
                            {formatFileSize(personalExterno.fotoTamanoBytes)}
                          </Text>
                        </>
                      ) : (
                        <Text className={styles.photoMeta}>{t("externalStaffNoPhoto")}</Text>
                      )}

                      <div className={styles.photoActions}>
                        {hasPhoto ? (
                          <ListActionButton
                            action="visualizar"
                            label={t("externalStaffPhotoOpen")}
                            text={t("externalStaffPhotoOpen")}
                            disabled={saving}
                            onClick={openPhoto}
                          />
                        ) : null}
                        {canEditFields && hasPhoto ? (
                          <ListActionButton
                            action="eliminar"
                            label={t("externalStaffPhotoRemove")}
                            text={t("externalStaffPhotoRemove")}
                            disabled={saving}
                            onClick={removePhoto}
                          />
                        ) : null}
                      </div>
                    </div>
                  </div>
                </Field>
              </div>
            ) : (
              <div className={styles.filePanel}>
                {canEditFields ? (
                  <Field label={t("externalStaffAttachmentAdd")}>
                    <label className={styles.fileSelector}>
                      <input
                        type="file"
                        multiple
                        accept=".pdf,.jpg,.jpeg,.png"
                        disabled={!canEditFields}
                        className={styles.hiddenFileInput}
                        aria-label={t("externalStaffAttachmentSelectFiles")}
                        onChange={handleAttachmentFiles}
                      />
                      <span className={styles.fileSelectorButton}>
                        {t("externalStaffAttachmentSelectFiles")}
                      </span>
                    </label>
                  </Field>
                ) : null}

                {adjuntos.length > 0 ? (
                  <div className={styles.attachmentRows}>
                    {adjuntos.map((adjunto, index) => (
                      <div
                        key={`${adjunto.nombreArchivo}-${index}`}
                        className={styles.attachmentRow}
                        style={themeStyles.detailRow}
                      >
                        <Field label={t("externalStaffAttachmentName")}>
                          <Input value={adjunto.nombreArchivo ?? ""} disabled />
                        </Field>
                        <Field label={t("externalStaffAttachmentType")}>
                          <Input value={adjunto.tipoContenido ?? ""} disabled />
                        </Field>
                        <Field label={t("externalStaffAttachmentSize")}>
                          <Input value={formatFileSize(adjunto.tamanoBytes)} disabled />
                        </Field>
                        <div className={styles.attachmentActions}>
                          {adjunto.codPersonalExternoAdjunto ? (
                            <ListActionButton
                              action="descargar"
                              label={t("externalStaffAttachmentOpen")}
                              text={t("externalStaffAttachmentOpen")}
                              disabled={saving}
                              onClick={() => openAttachment(adjunto)}
                            />
                          ) : null}
                          {canEditFields ? (
                            <ListActionButton
                              action="eliminar"
                              label={t("externalStaffAttachmentRemove")}
                              text={t("externalStaffAttachmentRemove")}
                              disabled={saving}
                              onClick={() => removeAttachment(index)}
                            />
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Text>{t("externalStaffNoAttachments")}</Text>
                )}
              </div>
            )}

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
              {t("deleteExternalStaffConfirmation", { staff: personalExterno.nombre })}
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

export default PersonalExternoFormPage;
