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
  Spinner,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
  Text,
  Textarea,
  Title2,
} from "@/components/ui/app-shadcn";
import { useTranslation } from "react-i18next";
import { formSchemas } from "../../validations/formSchemas";
import { setZodValidationError } from "../../validations/zodValidation";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ListActionButton } from "../../components/common/ListActionButton";
import { PERMISOS } from "../../config/permisos";
import { validarPermiso } from "../../services/authService";
import { BahiaService } from "../../services/bahiaService";
import { BrazoService } from "../../services/brazoService";
import {
  getBahiaActionPageThemeStyles,
  useBahiaActionPageStyles,
} from "../../styles/pages/bahia/bahiaActionPageStyles";
import { assetUrl } from "../../utils/assets";

const linkIconUrl = assetUrl("images/Link.svg");

const EMPTY_BAHIA = {
  idBahia: "",
  codBahia: "",
  bahia: "",
  descripcionCorta: "",
  cantidadBrazos: 0,
  cantidadAditivos: 0,
  cantidadEtanol: 0,
  multiload: "",
  comentario: "",
  estatus: true,
  adjuntos: [],
};

function toNumber(value) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
}

const ALLOWED_ATTACHMENT_TYPES = new Set(["application/pdf", "image/jpeg", "image/png"]);

function normalizeBahia(data) {
  return {
    ...EMPTY_BAHIA,
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
        codBahiaAdjunto: 0,
        codBahia: "",
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

function BahiaFormPage({ mode }) {
  const styles = useBahiaActionPageStyles();
  const themeStyles = getBahiaActionPageThemeStyles();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { idBahia = "" } = useParams();
  const { values: bahia, setValues: setBahia } = useFormStateAdapter(EMPTY_BAHIA);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  const [brazos, setBrazos] = useState([]);
  const [loadingBrazos, setLoadingBrazos] = useState(false);
  const [brazosError, setBrazosError] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const isAdd = mode === "add";
  const isView = mode === "view";
  const isEdit = mode === "edit";
  const isDelete = mode === "delete";
  const canEditFields = isAdd || isEdit;
  const adjuntos = Array.isArray(bahia.adjuntos) ? bahia.adjuntos : [];
  const showArmsTab = !isAdd && Boolean(idBahia || bahia.idBahia);
  const isArmsTab = activeTab === "arms";

  useEffect(() => {
    if (isAdd) {
      setLoading(false);
      return undefined;
    }

    let isMounted = true;

    async function loadBahia() {
      try {
        setLoading(true);
        setError("");
        const data = await BahiaService.obtener(idBahia);
        if (isMounted) setBahia(normalizeBahia(data));
      } catch (loadError) {
        if (isMounted) setError(loadError.message || t("bayLoadError"));
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadBahia();

    return () => {
      isMounted = false;
    };
  }, [idBahia, isAdd, setBahia, t]);

  useEffect(() => {
    const idBahiaActual = idBahia || bahia.idBahia || "";

    if (!showArmsTab || !idBahiaActual) {
      setBrazos([]);
      setLoadingBrazos(false);
      setBrazosError("");
      return undefined;
    }

    let isMounted = true;

    async function loadBrazos() {
      try {
        setLoadingBrazos(true);
        setBrazosError("");
        const pagina = await BrazoService.listado({
          idBahia: idBahiaActual,
          page: 1,
          pageSize: 100,
          sort: "codBrazo:asc",
        });

        if (isMounted) {
          setBrazos(Array.isArray(pagina.items) ? pagina.items : []);
        }
      } catch (loadError) {
        if (isMounted) {
          setBrazos([]);
          setBrazosError(loadError.message || t("bayArmsLoadError"));
        }
      } finally {
        if (isMounted) setLoadingBrazos(false);
      }
    }

    loadBrazos();

    return () => {
      isMounted = false;
    };
  }, [showArmsTab, idBahia, bahia.idBahia, t]);

  const updateField = (key) => (_, data) => {
    setBahia((current) => ({
      ...current,
      [key]: data.value,
    }));
  };

  const updateNumberField = (key) => (_, data) => {
    setBahia((current) => ({
      ...current,
      [key]: toNumber(data.value),
    }));
  };

  const updateBoolField = (key) => (_, data) => {
    setBahia((current) => ({
      ...current,
      [key]: Boolean(data.checked),
    }));
  };

  const back = () => navigate("/bahia/listar");

  const goEdit = async () => {
    const response = await validarPermiso({
      ruta: "/bahia/editar",
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

    navigate(`/bahia/editar/${encodeURIComponent(idBahia)}`);
  };

  const save = async () => {
    try {
      setSaving(true);
      setError("");
      setMessage("");

      if (!setZodValidationError(formSchemas.bahia, bahia, t, setError).ok) return;

      const payload = {
        ...bahia,
        codBahia: String(bahia.codBahia ?? "").trim(),
        cantidadBrazos: toNumber(bahia.cantidadBrazos),
        cantidadAditivos: toNumber(bahia.cantidadAditivos),
        cantidadEtanol: toNumber(bahia.cantidadEtanol),
        multiload: bahia.multiload ?? "",
        comentario: bahia.comentario ?? "",
        estatus: Boolean(bahia.estatus),
        adjuntos: adjuntos.map((adjunto) => ({
          codBahiaAdjunto: toNumber(adjunto.codBahiaAdjunto),
          codBahia: String(bahia.codBahia ?? "").trim(),
          nombreArchivo: adjunto.nombreArchivo || "",
          tipoContenido: adjunto.tipoContenido || "application/octet-stream",
          tamanoBytes: toNumber(adjunto.tamanoBytes),
          rutaArchivo: adjunto.rutaArchivo || "",
          contenidoBase64: adjunto.contenidoBase64 || "",
        })),
      };

      if (isAdd) {
        await BahiaService.agregar(payload);
        setMessage(t("bayAdded"));
        setBahia(EMPTY_BAHIA);
        setActiveTab("general");
      }

      if (isEdit) {
        await BahiaService.editar(payload);
        setMessage(t("baySaved"));
      }

      if (isDelete) {
        await BahiaService.eliminar(payload);
        navigate("/bahia/listar");
      }
    } catch (saveError) {
      setError(saveError.message || t("baySaveError"));
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
      setError(t("bayAttachmentTypeError"));
      return;
    }

    try {
      setError("");
      const nuevosAdjuntos = await Promise.all(files.map(readFileAsAttachment));
      setBahia((current) => ({
        ...current,
        adjuntos: [...(Array.isArray(current.adjuntos) ? current.adjuntos : []), ...nuevosAdjuntos],
      }));
    } catch {
      setError(t("bayAttachmentReadError"));
    }
  };

  const removeAttachment = (index) => {
    setBahia((current) => ({
      ...current,
      adjuntos: (Array.isArray(current.adjuntos) ? current.adjuntos : []).filter(
        (_, adjuntoIndex) => adjuntoIndex !== index
      ),
    }));
  };

  const openAttachment = async (adjunto) => {
    try {
      setError("");
      const blob = await BahiaService.archivo(idBahia || bahia.idBahia, adjunto.codBahiaAdjunto);
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (downloadError) {
      setError(downloadError.message || t("bayAttachmentDownloadError"));
    }
  };

  const renderBrazoCode = (brazo) => {
    if (!brazo?.codBrazo) return "";
    if (!brazo.idBrazo) return brazo.codBrazo;

    return (
      <Link
        className={styles.relatedLink}
        to={`/brazo/visualizar/${encodeURIComponent(brazo.idBrazo)}`}
        aria-label={t("armName")}
      >
        <img className={styles.relatedLinkImage} src={linkIconUrl} alt="" />
        <span>{brazo.codBrazo}</span>
      </Link>
    );
  };

  const renderBrazosTab = () => (
    <div className={styles.relatedPanel}>
      {brazosError ? <MessageBar intent="error">{brazosError}</MessageBar> : null}
      {loadingBrazos ? (
        <div className={styles.relatedLoading}>
          <Spinner label={t("loadingArms")} />
        </div>
      ) : (
        <>
          <Text className={styles.relatedSummary}>
            {t("armListCount", { count: brazos.length })}
          </Text>
          <div className={styles.relatedTableSurface}>
            <Table aria-label={t("bayRelatedArms")} className={styles.relatedTable}>
              <TableHeader>
                <TableRow>
                  <TableHeaderCell>{t("armCode")}</TableHeaderCell>
                  <TableHeaderCell>{t("armName")}</TableHeaderCell>
                  <TableHeaderCell>{t("armProduct")}</TableHeaderCell>
                  <TableHeaderCell>{t("armComment")}</TableHeaderCell>
                  <TableHeaderCell>{t("armStatus")}</TableHeaderCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {brazos.length > 0 ? (
                  brazos.map((brazo) => (
                    <TableRow key={brazo.idBrazo || brazo.codBrazo}>
                      <TableCell>{renderBrazoCode(brazo)}</TableCell>
                      <TableCell>{brazo.brazo || "-"}</TableCell>
                      <TableCell>{brazo.producto || "-"}</TableCell>
                      <TableCell>{brazo.comentario || "-"}</TableCell>
                      <TableCell>{brazo.estatus !== false ? t("active") : t("inactive")}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <Text className={styles.empty}>{t("bayNoArmsFound")}</Text>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );

  const titleKeyByMode = {
    add: "bayAddTitle",
    view: "bayViewTitle",
    edit: "bayEditTitle",
    delete: "bayDeleteTitle",
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
            <Spinner label={t("loadingBay")} />
          </div>
        ) : (
          <>
            {isDelete ? (
              <MessageBar intent="warning">
                {t("deleteBayConfirmation", { bay: bahia.bahia })}
              </MessageBar>
            ) : null}

            <div className={styles.tabs} role="tablist" aria-label={t("bayAttachments")}>
              <button
                type="button"
                className={styles.tabButton}
                aria-selected={activeTab === "general"}
                onClick={() => setActiveTab("general")}
              >
                {t("bayTabGeneral")}
              </button>
              <button
                type="button"
                className={styles.tabButton}
                aria-selected={activeTab === "files"}
                onClick={() => setActiveTab("files")}
              >
                {t("bayTabFiles")}
              </button>
              {showArmsTab ? (
                <button
                  type="button"
                  className={styles.tabButton}
                  aria-selected={activeTab === "arms"}
                  onClick={() => setActiveTab("arms")}
                >
                  {t("bayTabArms")}
                </button>
              ) : null}
            </div>

            {activeTab === "general" ? (
              <div className={styles.formRows}>
                <div className={`${styles.formRow} ${styles.formRowThree}`}>
                  <Field label={t("bayCode")} required={isAdd}>
                    <Input
                      maxLength={20}
                      value={String(bahia.codBahia ?? "")}
                      disabled={!isAdd}
                      onChange={updateField("codBahia")}
                    />
                  </Field>
                  <Field label={t("bayName")} required={canEditFields}>
                    <Input
                      value={bahia.bahia ?? ""}
                      disabled={!canEditFields}
                      onChange={updateField("bahia")}
                    />
                  </Field>
                  <Field label={t("bayShortDescription")} required={canEditFields}>
                    <Input
                      maxLength={10}
                      value={bahia.descripcionCorta ?? ""}
                      disabled={!canEditFields}
                      onChange={updateField("descripcionCorta")}
                    />
                  </Field>
                </div>

                <fieldset className={styles.sectionFrame}>
                  <legend className={styles.sectionFrameTitle}>{t("bayQuantityFrameTitle")}</legend>
                  <div className={styles.sectionFrameGrid}>
                    <Field label={t("bayArmsQuantity")}>
                      <Input
                        type="number"
                        value={String(bahia.cantidadBrazos ?? 0)}
                        disabled={!canEditFields}
                        onChange={updateNumberField("cantidadBrazos")}
                      />
                    </Field>
                    <Field label={t("bayAdditivesQuantity")}>
                      <Input
                        type="number"
                        value={String(bahia.cantidadAditivos ?? 0)}
                        disabled={!canEditFields}
                        onChange={updateNumberField("cantidadAditivos")}
                      />
                    </Field>
                    <Field label={t("bayEthanolQuantity")}>
                      <Input
                        type="number"
                        value={String(bahia.cantidadEtanol ?? 0)}
                        disabled={!canEditFields}
                        onChange={updateNumberField("cantidadEtanol")}
                      />
                    </Field>
                  </div>
                </fieldset>

                <fieldset className={styles.sectionFrame}>
                  <legend className={styles.sectionFrameTitle}>
                    {t("bayMultiloadFrameTitle")}
                  </legend>
                  <div className={styles.sectionFrameGrid}>
                    <Field label={t("bayMultiload")}>
                      <Input
                        maxLength={100}
                        value={bahia.multiload ?? ""}
                        disabled={!canEditFields}
                        onChange={updateField("multiload")}
                      />
                    </Field>
                  </div>
                </fieldset>

                <div className={`${styles.formRow} ${styles.formRowOne}`}>
                  <Field label={t("bayComment")}>
                    <Textarea
                      maxLength={250}
                      rows={3}
                      value={bahia.comentario ?? ""}
                      disabled={!canEditFields}
                      onChange={updateField("comentario")}
                    />
                  </Field>
                </div>

                <div className={`${styles.formRow} ${styles.formRowOne}`}>
                  <Field label={t("bayStatus")}>
                    <Switch
                      checked={Boolean(bahia.estatus)}
                      disabled={!canEditFields}
                      label={bahia.estatus ? t("active") : t("inactive")}
                      onChange={updateBoolField("estatus")}
                    />
                  </Field>
                </div>
              </div>
            ) : activeTab === "files" ? (
              <div className={styles.filePanel}>
                {canEditFields ? (
                  <Field label={t("bayAttachmentAdd")}>
                    <label className={styles.fileSelector}>
                      <input
                        type="file"
                        multiple
                        accept=".pdf,.jpg,.jpeg,.png"
                        disabled={!canEditFields}
                        className={styles.hiddenFileInput}
                        aria-label={t("bayAttachmentSelectFiles")}
                        onChange={handleAttachmentFiles}
                      />
                      <span className={styles.fileSelectorButton}>
                        {t("bayAttachmentSelectFiles")}
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
                        <Field label={t("bayAttachmentName")}>
                          <Input value={adjunto.nombreArchivo ?? ""} disabled />
                        </Field>
                        <Field label={t("bayAttachmentType")}>
                          <Input value={adjunto.tipoContenido ?? ""} disabled />
                        </Field>
                        <Field label={t("bayAttachmentSize")}>
                          <Input value={formatFileSize(adjunto.tamanoBytes)} disabled />
                        </Field>
                        <div className={styles.attachmentActions}>
                          {adjunto.codBahiaAdjunto ? (
                            <ListActionButton
                              action="descargar"
                              label={t("bayAttachmentOpen")}
                              text={t("bayAttachmentOpen")}
                              disabled={saving}
                              onClick={() => openAttachment(adjunto)}
                            />
                          ) : null}
                          {canEditFields ? (
                            <ListActionButton
                              action="eliminar"
                              label={t("bayAttachmentRemove")}
                              text={t("bayAttachmentRemove")}
                              disabled={saving}
                              onClick={() => removeAttachment(index)}
                            />
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Text>{t("bayNoAttachments")}</Text>
                )}
              </div>
            ) : (
              renderBrazosTab()
            )}

            {!isArmsTab ? (
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
            ) : null}
          </>
        )}
      </div>

      <Dialog open={openDeleteConfirm} onOpenChange={(_, data) => setOpenDeleteConfirm(data.open)}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>{t("confirmDelete")}</DialogTitle>
            <DialogContent>{t("deleteBayConfirmation", { bay: bahia.bahia })}</DialogContent>
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

export default BahiaFormPage;
