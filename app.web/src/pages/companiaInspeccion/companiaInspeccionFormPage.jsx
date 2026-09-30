import { useEffect, useState } from "react";
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
import { CompaniaInspeccionService } from "../../services/companiaInspeccionService";
import {
  getCompaniaInspeccionActionPageThemeStyles,
  useCompaniaInspeccionActionPageStyles,
} from "../../styles/pages/companiaInspeccion/companiaInspeccionActionPageStyles";

const EMPTY_COMPANIA_INSPECCION = {
  idCompaniaInspeccion: "",
  codCompaniaInspeccion: 0,
  nombreComercial: "",
  nombreFiscal: "",
  nit: "",
  estatus: true,
  adjuntos: [],
};

function toNumber(value) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
}

const ALLOWED_ATTACHMENT_TYPES = new Set(["application/pdf", "image/jpeg", "image/png"]);

function normalizeCompaniaInspeccion(data) {
  return {
    ...EMPTY_COMPANIA_INSPECCION,
    ...data,
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

function isAllowedAttachment(file) {
  const name = String(file.name || "").toLowerCase();
  const hasAllowedExtension =
    name.endsWith(".pdf") ||
    name.endsWith(".jpg") ||
    name.endsWith(".jpeg") ||
    name.endsWith(".png");

  return hasAllowedExtension && ALLOWED_ATTACHMENT_TYPES.has(inferContentType(file));
}

function readFileAsAttachment(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? "");
      const base64 = result.includes(",") ? result.split(",").pop() : result;
      resolve({
        codCompaniaInspeccionAdjunto: 0,
        codCompaniaInspeccion: 0,
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

function CompaniaInspeccionFormPage({ mode }) {
  const styles = useCompaniaInspeccionActionPageStyles();
  const themeStyles = getCompaniaInspeccionActionPageThemeStyles();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { idCompaniaInspeccion = "" } = useParams();
  const { values: companiaInspeccion, setValues: setCompaniaInspeccion } =
    useFormStateAdapter(EMPTY_COMPANIA_INSPECCION);
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
  const adjuntos = Array.isArray(companiaInspeccion.adjuntos) ? companiaInspeccion.adjuntos : [];

  useEffect(() => {
    if (isAdd) {
      setLoading(false);
      return undefined;
    }

    let isMounted = true;

    async function loadCompaniaInspeccion() {
      try {
        setLoading(true);
        setError("");
        const data = await CompaniaInspeccionService.obtener(idCompaniaInspeccion);
        if (isMounted) setCompaniaInspeccion(normalizeCompaniaInspeccion(data));
      } catch (loadError) {
        if (isMounted) setError(loadError.message || t("inspectionCompanyLoadError"));
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadCompaniaInspeccion();

    return () => {
      isMounted = false;
    };
  }, [idCompaniaInspeccion, isAdd, setCompaniaInspeccion, t]);

  const updateField = (key) => (_, data) => {
    setCompaniaInspeccion((current) => ({
      ...current,
      [key]: data.value,
    }));
  };

  const updateBoolField = (key) => (_, data) => {
    setCompaniaInspeccion((current) => ({
      ...current,
      [key]: Boolean(data.checked),
    }));
  };

  const back = () => navigate("/companiainspeccion/listar");

  const goEdit = async () => {
    const response = await validarPermiso({
      ruta: "/companiainspeccion/editar",
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

    navigate(`/companiainspeccion/editar/${encodeURIComponent(idCompaniaInspeccion)}`);
  };

  const save = async () => {
    try {
      setSaving(true);
      setError("");
      setMessage("");

      if (
        !setZodValidationError(formSchemas.companiaInspeccion, companiaInspeccion, t, setError).ok
      )
        return;

      const payload = {
        ...companiaInspeccion,
        codCompaniaInspeccion: toNumber(companiaInspeccion.codCompaniaInspeccion),
        estatus: Boolean(companiaInspeccion.estatus),
        adjuntos: adjuntos.map((adjunto) => ({
          codCompaniaInspeccionAdjunto: toNumber(adjunto.codCompaniaInspeccionAdjunto),
          codCompaniaInspeccion: toNumber(companiaInspeccion.codCompaniaInspeccion),
          nombreArchivo: adjunto.nombreArchivo || "",
          tipoContenido: adjunto.tipoContenido || "application/octet-stream",
          tamanoBytes: toNumber(adjunto.tamanoBytes),
          rutaArchivo: adjunto.rutaArchivo || "",
          contenidoBase64: adjunto.contenidoBase64 || "",
        })),
      };

      if (isAdd) {
        const result = await CompaniaInspeccionService.agregar(payload);
        const createdKey = result?.key || result?.Key || payload.codCompaniaInspeccion;
        setMessage(t("inspectionCompanyAdded"));

        if (createdKey) {
          const data = await CompaniaInspeccionService.obtener(createdKey);
          navigate(
            `/companiainspeccion/editar/${encodeURIComponent(data.idCompaniaInspeccion || createdKey)}`,
            {
              replace: true,
            }
          );
          return;
        }

        setCompaniaInspeccion(EMPTY_COMPANIA_INSPECCION);
      }

      if (isEdit) {
        await CompaniaInspeccionService.editar(payload);
        const data = await CompaniaInspeccionService.obtener(idCompaniaInspeccion);
        setCompaniaInspeccion(normalizeCompaniaInspeccion(data));
        setMessage(t("inspectionCompanySaved"));
      }

      if (isDelete) {
        await CompaniaInspeccionService.eliminar(payload);
        navigate("/companiainspeccion/listar");
      }
    } catch (saveError) {
      setError(saveError.message || t("inspectionCompanySaveError"));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    setOpenDeleteConfirm(false);
    await save();
  };

  const handleAttachmentFiles = async (event) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";

    if (files.length === 0) return;

    if (files.some((file) => !isAllowedAttachment(file))) {
      setError(t("inspectionCompanyAttachmentTypeError"));
      return;
    }

    try {
      setError("");
      const nuevosAdjuntos = await Promise.all(files.map(readFileAsAttachment));
      setCompaniaInspeccion((current) => ({
        ...current,
        adjuntos: [...(Array.isArray(current.adjuntos) ? current.adjuntos : []), ...nuevosAdjuntos],
      }));
    } catch {
      setError(t("inspectionCompanyAttachmentReadError"));
    }
  };

  const removeAttachment = (index) => {
    setCompaniaInspeccion((current) => ({
      ...current,
      adjuntos: (Array.isArray(current.adjuntos) ? current.adjuntos : []).filter(
        (_, adjuntoIndex) => adjuntoIndex !== index
      ),
    }));
  };

  const openAttachment = async (adjunto) => {
    try {
      setError("");
      const blob = await CompaniaInspeccionService.archivo(
        idCompaniaInspeccion || companiaInspeccion.idCompaniaInspeccion,
        adjunto.codCompaniaInspeccionAdjunto
      );
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (downloadError) {
      setError(downloadError.message || t("inspectionCompanyAttachmentDownloadError"));
    }
  };

  const titleKeyByMode = {
    add: "inspectionCompanyAddTitle",
    view: "inspectionCompanyViewTitle",
    edit: "inspectionCompanyEditTitle",
    delete: "inspectionCompanyDeleteTitle",
  };

  return (
    <section className={styles.root}>
      <div className={styles.toolbar}>
        <div>
          <Title2 className={styles.title}>{t(titleKeyByMode[mode])}</Title2>
        </div>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "flex-end" }}>
          {!isAdd && companiaInspeccion.idCompaniaInspeccion ? (
            <ListActionButton
              action="visualizar"
              label={t("inspectionCompanyExternalStaff")}
              text={t("inspectionCompanyExternalStaff")}
              onClick={() =>
                navigate(
                  `/personalexterno/listar/${encodeURIComponent(companiaInspeccion.idCompaniaInspeccion)}`
                )
              }
            />
          ) : null}
          <ListActionButton action="regresar" label={t("back")} text={t("back")} onClick={back} />
        </div>
      </div>

      {error ? <MessageBar intent="error">{error}</MessageBar> : null}
      {message ? <MessageBar intent="success">{message}</MessageBar> : null}

      <div className={styles.formSurface} style={themeStyles.surface}>
        {loading ? (
          <div className={styles.loading}>
            <Spinner label={t("loadingInspectionCompany")} />
          </div>
        ) : (
          <>
            {isDelete ? (
              <MessageBar intent="warning">
                {t("deleteInspectionCompanyConfirmation", {
                  company: companiaInspeccion.nombreComercial,
                })}
              </MessageBar>
            ) : null}

            <div
              className={styles.tabs}
              role="tablist"
              aria-label={t("inspectionCompanyAttachments")}
            >
              <button
                type="button"
                className={styles.tabButton}
                aria-selected={activeTab === "general"}
                onClick={() => setActiveTab("general")}
              >
                {t("inspectionCompanyTabGeneral")}
              </button>
              <button
                type="button"
                className={styles.tabButton}
                aria-selected={activeTab === "files"}
                onClick={() => setActiveTab("files")}
              >
                {t("inspectionCompanyTabFiles")}
              </button>
            </div>

            {activeTab === "general" ? (
              <div className={styles.formGrid}>
                {!isAdd ? (
                  <Field label={t("inspectionCompanyCode")}>
                    <Input
                      value={String(companiaInspeccion.codCompaniaInspeccion ?? "")}
                      disabled
                    />
                  </Field>
                ) : null}
                <Field label={t("inspectionCompanyCommercialName")} required={canEditFields}>
                  <Input
                    value={companiaInspeccion.nombreComercial ?? ""}
                    disabled={!canEditFields}
                    onChange={updateField("nombreComercial")}
                  />
                </Field>
                <Field label={t("inspectionCompanyFiscalName")} required={canEditFields}>
                  <Input
                    value={companiaInspeccion.nombreFiscal ?? ""}
                    disabled={!canEditFields}
                    onChange={updateField("nombreFiscal")}
                  />
                </Field>
                <Field label={t("inspectionCompanyNit")} required={canEditFields}>
                  <Input
                    maxLength={50}
                    value={companiaInspeccion.nit ?? ""}
                    disabled={!canEditFields}
                    onChange={updateField("nit")}
                  />
                </Field>
                <Field label={t("inspectionCompanyActive")}>
                  <Checkbox
                    checked={Boolean(companiaInspeccion.estatus)}
                    disabled={!canEditFields}
                    onChange={updateBoolField("estatus")}
                  />
                </Field>
              </div>
            ) : (
              <div className={styles.filePanel}>
                {canEditFields ? (
                  <Field label={t("inspectionCompanyAttachmentAdd")}>
                    <label className={styles.fileSelector}>
                      <input
                        type="file"
                        multiple
                        accept=".pdf,.jpg,.jpeg,.png"
                        disabled={!canEditFields}
                        className={styles.hiddenFileInput}
                        aria-label={t("inspectionCompanyAttachmentSelectFiles")}
                        onChange={handleAttachmentFiles}
                      />
                      <span className={styles.fileSelectorButton}>
                        {t("inspectionCompanyAttachmentSelectFiles")}
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
                        <Field label={t("inspectionCompanyAttachmentName")}>
                          <Input value={adjunto.nombreArchivo ?? ""} disabled />
                        </Field>
                        <Field label={t("inspectionCompanyAttachmentType")}>
                          <Input value={adjunto.tipoContenido ?? ""} disabled />
                        </Field>
                        <Field label={t("inspectionCompanyAttachmentSize")}>
                          <Input value={formatFileSize(adjunto.tamanoBytes)} disabled />
                        </Field>
                        <div className={styles.attachmentActions}>
                          {adjunto.codCompaniaInspeccionAdjunto ? (
                            <ListActionButton
                              action="descargar"
                              label={t("inspectionCompanyAttachmentOpen")}
                              text={t("inspectionCompanyAttachmentOpen")}
                              disabled={saving}
                              onClick={() => openAttachment(adjunto)}
                            />
                          ) : null}
                          {canEditFields ? (
                            <ListActionButton
                              action="eliminar"
                              label={t("inspectionCompanyAttachmentRemove")}
                              text={t("inspectionCompanyAttachmentRemove")}
                              disabled={saving}
                              onClick={() => removeAttachment(index)}
                            />
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Text>{t("inspectionCompanyNoAttachments")}</Text>
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
              {t("deleteInspectionCompanyConfirmation", {
                company: companiaInspeccion.nombreComercial,
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

export default CompaniaInspeccionFormPage;
