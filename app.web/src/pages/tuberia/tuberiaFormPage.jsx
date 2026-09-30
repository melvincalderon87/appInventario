import { useEffect, useMemo, useState } from "react";
import { useFormStateAdapter } from "../../hooks/useFormStateAdapter";
import {
  Button,
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
import { Check, Search } from "lucide-react";
import { formSchemas } from "../../validations/formSchemas";
import { setZodValidationError } from "../../validations/zodValidation";
import { useNavigate, useParams } from "react-router-dom";
import { ListActionButton } from "../../components/common/ListActionButton";
import { LocalizedDateInput } from "../../components/common/LocalizedDateInput";
import { PERMISOS } from "../../config/permisos";
import { validarPermiso } from "../../services/authService";
import { CompaniaInspeccionService } from "../../services/companiaInspeccionService";
import { ProductoService } from "../../services/productoService";
import { TanqueService } from "../../services/tanqueService";
import { TipoProductoService } from "../../services/tipoProductoService";
import { TuberiaService } from "../../services/tuberiaService";
import {
  getTuberiaActionPageThemeStyles,
  useTuberiaActionPageStyles,
} from "../../styles/pages/tuberia/tuberiaActionPageStyles";

const EMPTY_TUBERIA = {
  idTuberia: "",
  codTuberia: "",
  codTanque: "",
  tanque: "",
  codTipoProducto: "",
  tipoProducto: "",
  codProducto: "",
  producto: "",
  ubicacion: "",
  tramoLinea: "",
  diametroInicio: 0,
  diametroFinal: 0,
  volumen: 0,
  fechaCertificacion: "",
  codCompaniaInspeccion: 0,
  companiaInspeccion: "",
  tipoMovimiento: "ENTRADA",
  comentario: "",
  estatus: true,
  adjuntos: [],
};

function toNumber(value) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
}

function toText(value) {
  return String(value ?? "").trim();
}

function optionValue(option) {
  return String(option?.value ?? option?.Value ?? "");
}

function optionText(option) {
  return String(option?.text ?? option?.Text ?? option?.label ?? optionValue(option));
}

function getSelectedOptionText(options, value, fallback = "") {
  const selectedValue = String(value ?? "");
  if (!selectedValue || selectedValue === "0") return "";

  const selectedOption = options.find((option) => optionValue(option) === selectedValue);
  return optionText(selectedOption) || String(fallback ?? selectedValue);
}

function filterLookupOptions(options, search) {
  const searchText = String(search ?? "")
    .trim()
    .toLowerCase();
  if (!searchText) return options;

  return options.filter((option) =>
    `${optionValue(option)} ${optionText(option)}`.toLowerCase().includes(searchText)
  );
}

const ALLOWED_ATTACHMENT_TYPES = new Set(["application/pdf", "image/jpeg", "image/png"]);

function toDateInputValue(value) {
  if (!value) return "";
  return String(value).slice(0, 10);
}

function normalizeMovement(value) {
  const normalized = String(value ?? "")
    .trim()
    .toUpperCase();
  if (normalized === "ENTRADA" || normalized === "SALIDA" || normalized === "NO APLICA")
    return normalized;
  return "";
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
        codTuberiaAdjunto: 0,
        codTuberia: "",
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

function normalizeTuberia(data) {
  return {
    ...EMPTY_TUBERIA,
    ...data,
    codTuberia: toText(data?.codTuberia),
    codTanque: toText(data?.codTanque),
    fechaCertificacion: toDateInputValue(data?.fechaCertificacion),
    tipoMovimiento: normalizeMovement(data?.tipoMovimiento) || EMPTY_TUBERIA.tipoMovimiento,
    comentario: data?.comentario ?? "",
    adjuntos: Array.isArray(data?.adjuntos) ? data.adjuntos : [],
  };
}

function TuberiaFormPage({ mode }) {
  const styles = useTuberiaActionPageStyles();
  const themeStyles = getTuberiaActionPageThemeStyles();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { idTuberia = "" } = useParams();
  const { values: tuberia, setValues: setTuberia } = useFormStateAdapter(EMPTY_TUBERIA);
  const [tanques, setTanques] = useState([]);
  const [tiposProducto, setTiposProducto] = useState([]);
  const [productos, setProductos] = useState([]);
  const [companiasInspeccion, setCompaniasInspeccion] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false);
  const [lookupType, setLookupType] = useState("");
  const [lookupSearch, setLookupSearch] = useState("");
  const [activeTab, setActiveTab] = useState("general");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const isAdd = mode === "add";
  const isView = mode === "view";
  const isEdit = mode === "edit";
  const isDelete = mode === "delete";
  const canEditFields = isAdd || isEdit;
  const adjuntos = Array.isArray(tuberia.adjuntos) ? tuberia.adjuntos : [];
  const selectedProductLabel = getSelectedOptionText(
    productos,
    tuberia.codProducto,
    tuberia.producto
  );
  const selectedCompanyLabel = getSelectedOptionText(
    companiasInspeccion,
    tuberia.codCompaniaInspeccion,
    tuberia.companiaInspeccion
  );
  const isProductLookup = lookupType === "producto";
  const lookupOptions = isProductLookup ? productos : companiasInspeccion;
  const filteredLookupOptions = useMemo(
    () => filterLookupOptions(lookupOptions, lookupSearch),
    [lookupOptions, lookupSearch]
  );
  const lookupTitle = isProductLookup
    ? t("pipelineProductSearchTitle")
    : t("pipelineInspectionCompanySearchTitle");
  const lookupSearchPlaceholder = isProductLookup
    ? t("pipelineSearchProduct")
    : t("pipelineSearchInspectionCompany");
  const lookupEmptyMessage = isProductLookup
    ? t("pipelineNoProductsFound")
    : t("pipelineNoInspectionCompaniesFound");

  useEffect(() => {
    let isMounted = true;

    async function loadOptions() {
      const [tanquesData, tiposProductoData, productosData, companiasInspeccionData] =
        await Promise.allSettled([
          TanqueService.ListarOpcion(),
          TipoProductoService.ListarOpcion(),
          ProductoService.ListarOpcion(),
          CompaniaInspeccionService.ListarOpcion(),
        ]);

      if (!isMounted) return;

      setTanques(
        tanquesData.status === "fulfilled" && Array.isArray(tanquesData.value)
          ? tanquesData.value
          : []
      );
      setTiposProducto(
        tiposProductoData.status === "fulfilled" && Array.isArray(tiposProductoData.value)
          ? tiposProductoData.value
          : []
      );
      setProductos(
        productosData.status === "fulfilled" && Array.isArray(productosData.value)
          ? productosData.value
          : []
      );
      setCompaniasInspeccion(
        companiasInspeccionData.status === "fulfilled" &&
          Array.isArray(companiasInspeccionData.value)
          ? companiasInspeccionData.value
          : []
      );
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

    async function loadTuberia() {
      try {
        setLoading(true);
        setError("");
        const data = await TuberiaService.obtener(idTuberia);
        if (isMounted) setTuberia(normalizeTuberia(data));
      } catch (loadError) {
        if (isMounted) setError(loadError.message || t("pipelineLoadError"));
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadTuberia();

    return () => {
      isMounted = false;
    };
  }, [idTuberia, isAdd, setTuberia, t]);

  const updateField = (key) => (_, data) => {
    setTuberia((current) => ({
      ...current,
      [key]: data.value,
    }));
  };

  const updateNumberField = (key) => (_, data) => {
    setTuberia((current) => ({
      ...current,
      [key]: toNumber(data.value),
    }));
  };

  const updateBoolField = (key) => (_, data) => {
    setTuberia((current) => ({
      ...current,
      [key]: Boolean(data.checked),
    }));
  };

  const openLookupDialog = (type) => {
    if (!canEditFields) return;

    setLookupSearch("");
    setLookupType(type);
  };

  const closeLookupDialog = () => {
    setLookupType("");
    setLookupSearch("");
  };

  const selectLookupOption = (option) => {
    const value = optionValue(option);
    const text = optionText(option);

    setTuberia((current) => {
      if (isProductLookup) {
        return {
          ...current,
          codProducto: value,
          producto: text,
        };
      }

      return {
        ...current,
        codCompaniaInspeccion: toNumber(value),
        companiaInspeccion: text,
      };
    });

    closeLookupDialog();
  };

  const back = () => navigate("/tuberia/listar");

  const goEdit = async () => {
    const response = await validarPermiso({
      ruta: "/tuberia/editar",
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

    navigate(`/tuberia/editar/${encodeURIComponent(idTuberia)}`);
  };

  const save = async () => {
    try {
      setSaving(true);
      setError("");
      setMessage("");

      if (!setZodValidationError(formSchemas.tuberia, tuberia, t, setError).ok) return;

      const payload = {
        ...tuberia,
        codTuberia: toText(tuberia.codTuberia),
        codTanque: toText(tuberia.codTanque),
        codTipoProducto: String(tuberia.codTipoProducto ?? "").trim(),
        codProducto: toText(tuberia.codProducto),
        diametroInicio: toNumber(tuberia.diametroInicio),
        diametroFinal: toNumber(tuberia.diametroFinal),
        volumen: toNumber(tuberia.volumen),
        fechaCertificacion: tuberia.fechaCertificacion || null,
        codCompaniaInspeccion: toNumber(tuberia.codCompaniaInspeccion),
        tipoMovimiento: normalizeMovement(tuberia.tipoMovimiento),
        estatus: tuberia.estatus !== false,
        adjuntos: adjuntos.map((adjunto) => ({
          codTuberiaAdjunto: toNumber(adjunto.codTuberiaAdjunto),
          codTuberia: toText(tuberia.codTuberia),
          nombreArchivo: adjunto.nombreArchivo || "",
          tipoContenido: adjunto.tipoContenido || "application/octet-stream",
          tamanoBytes: toNumber(adjunto.tamanoBytes),
          rutaArchivo: adjunto.rutaArchivo || "",
          contenidoBase64: adjunto.contenidoBase64 || "",
        })),
      };

      if (isAdd) {
        await TuberiaService.agregar(payload);
        setMessage(t("pipelineAdded"));
        setTuberia(EMPTY_TUBERIA);
        setActiveTab("general");
      }

      if (isEdit) {
        await TuberiaService.editar(payload);
        setMessage(t("pipelineSaved"));
      }

      if (isDelete) {
        await TuberiaService.eliminar(payload);
        navigate("/tuberia/listar");
      }
    } catch (saveError) {
      setError(saveError.message || t("pipelineSaveError"));
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
      setError(t("pipelineAttachmentTypeError"));
      return;
    }

    try {
      setError("");
      const nuevosAdjuntos = await Promise.all(files.map(readFileAsAttachment));
      setTuberia((current) => ({
        ...current,
        adjuntos: [...(Array.isArray(current.adjuntos) ? current.adjuntos : []), ...nuevosAdjuntos],
      }));
    } catch {
      setError(t("pipelineAttachmentReadError"));
    }
  };

  const removeAttachment = (index) => {
    setTuberia((current) => ({
      ...current,
      adjuntos: (Array.isArray(current.adjuntos) ? current.adjuntos : []).filter(
        (_, adjuntoIndex) => adjuntoIndex !== index
      ),
    }));
  };

  const openAttachment = async (adjunto) => {
    try {
      setError("");
      const blob = await TuberiaService.archivo(
        idTuberia || tuberia.idTuberia,
        adjunto.codTuberiaAdjunto
      );
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (downloadError) {
      setError(downloadError.message || t("pipelineAttachmentDownloadError"));
    }
  };

  const titleKeyByMode = {
    add: "pipelineAddTitle",
    view: "pipelineViewTitle",
    edit: "pipelineEditTitle",
    delete: "pipelineDeleteTitle",
  };
  const deletePipelineReference = String(tuberia.codTuberia || tuberia.ubicacion || "");

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
            <Spinner label={t("loadingPipeline")} />
          </div>
        ) : (
          <>
            {isDelete ? (
              <MessageBar intent="warning">
                {t("deletePipelineConfirmation", { pipeline: deletePipelineReference })}
              </MessageBar>
            ) : null}

            <div className={styles.tabs} role="tablist" aria-label={t("pipelineAttachments")}>
              <button
                type="button"
                className={styles.tabButton}
                aria-selected={activeTab === "general"}
                onClick={() => setActiveTab("general")}
              >
                {t("pipelineTabGeneral")}
              </button>
              <button
                type="button"
                className={styles.tabButton}
                aria-selected={activeTab === "files"}
                onClick={() => setActiveTab("files")}
              >
                {t("pipelineTabFiles")}
              </button>
            </div>

            {activeTab === "general" ? (
              <div className={styles.formRows}>
                <div className={`${styles.formRow} ${styles.formRowTwo}`}>
                  <Field label={t("pipelineCode")} required={isAdd}>
                    <Input
                      maxLength={20}
                      value={String(tuberia.codTuberia ?? "")}
                      disabled={!isAdd}
                      onChange={updateField("codTuberia")}
                    />
                  </Field>
                  <Field label={t("pipelineTank")}>
                    <Select
                      value={String(tuberia.codTanque || "")}
                      disabled={!canEditFields}
                      onChange={updateField("codTanque")}
                    >
                      <option value="">{t("selectOption")}</option>
                      {tanques.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.text}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label={t("pipelineProductType")} required={canEditFields}>
                    <Select
                      value={String(tuberia.codTipoProducto ?? "")}
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
                  <Field label={t("pipelineProduct")} required={canEditFields}>
                    <div className={styles.lookupControl}>
                      <Input
                        value={selectedProductLabel}
                        readOnly
                        placeholder={t("selectOption")}
                      />
                      <Button
                        size="small"
                        appearance="secondary"
                        icon={<Search />}
                        disabled={!canEditFields}
                        onClick={() => openLookupDialog("producto")}
                      >
                        {t("pipelineLookupSearch")}
                      </Button>
                    </div>
                  </Field>
                  <Field label={t("pipelineLocation")} required={canEditFields}>
                    <Textarea
                      maxLength={250}
                      rows={3}
                      value={tuberia.ubicacion ?? ""}
                      disabled={!canEditFields}
                      onChange={updateField("ubicacion")}
                    />
                  </Field>
                  <Field label={t("pipelineLineSection")} required={canEditFields}>
                    <Textarea
                      maxLength={250}
                      rows={3}
                      placeholder={t("pipelineLineSectionPlaceholder")}
                      value={tuberia.tramoLinea ?? ""}
                      disabled={!canEditFields}
                      onChange={updateField("tramoLinea")}
                    />
                  </Field>
                  <Field label={t("pipelineDiameterStart")} required={canEditFields}>
                    <Input
                      type="number"
                      step="0.0001"
                      value={String(tuberia.diametroInicio ?? 0)}
                      disabled={!canEditFields}
                      onChange={updateNumberField("diametroInicio")}
                    />
                  </Field>
                  <Field label={t("pipelineDiameterEnd")} required={canEditFields}>
                    <Input
                      type="number"
                      step="0.0001"
                      value={String(tuberia.diametroFinal ?? 0)}
                      disabled={!canEditFields}
                      onChange={updateNumberField("diametroFinal")}
                    />
                  </Field>
                  <Field label={t("pipelineVolume")} required={canEditFields}>
                    <Input
                      type="number"
                      step="0.0001"
                      value={String(tuberia.volumen ?? 0)}
                      disabled={!canEditFields}
                      onChange={updateNumberField("volumen")}
                    />
                  </Field>
                  <Field label={t("pipelineCertificationDate")} required={canEditFields}>
                    <LocalizedDateInput
                      value={toDateInputValue(tuberia.fechaCertificacion)}
                      disabled={!canEditFields}
                      onChange={updateField("fechaCertificacion")}
                    />
                  </Field>
                  <Field label={t("pipelineInspectionCompany")} required={canEditFields}>
                    <div className={styles.lookupControl}>
                      <Input
                        value={selectedCompanyLabel}
                        readOnly
                        placeholder={t("selectOption")}
                      />
                      <Button
                        size="small"
                        appearance="secondary"
                        icon={<Search />}
                        disabled={!canEditFields}
                        onClick={() => openLookupDialog("companiaInspeccion")}
                      >
                        {t("pipelineLookupSearch")}
                      </Button>
                    </div>
                  </Field>
                  <Field label={t("pipelineMovementType")} required={canEditFields}>
                    <Select
                      value={normalizeMovement(tuberia.tipoMovimiento)}
                      disabled={!canEditFields}
                      onChange={updateField("tipoMovimiento")}
                    >
                      <option value="">{t("selectOption")}</option>
                      <option value="ENTRADA">{t("pipelineMovementEntry")}</option>
                      <option value="SALIDA">{t("pipelineMovementExit")}</option>
                      <option value="NO APLICA">{t("pipelineMovementNotApplicable")}</option>
                    </Select>
                  </Field>
                  <Field label={t("pipelineComment")}>
                    <Textarea
                      maxLength={250}
                      rows={3}
                      value={tuberia.comentario ?? ""}
                      disabled={!canEditFields}
                      onChange={updateField("comentario")}
                    />
                  </Field>
                  <Field label={t("pipelineStatus")}>
                    <Switch
                      checked={tuberia.estatus !== false}
                      disabled={!canEditFields}
                      label={tuberia.estatus !== false ? t("active") : t("inactive")}
                      onChange={updateBoolField("estatus")}
                    />
                  </Field>
                </div>
              </div>
            ) : (
              <div className={styles.filePanel}>
                {canEditFields ? (
                  <Field label={t("pipelineAttachmentAdd")}>
                    <label className={styles.fileSelector}>
                      <input
                        type="file"
                        multiple
                        accept=".pdf,.jpg,.jpeg,.png"
                        disabled={!canEditFields}
                        className={styles.hiddenFileInput}
                        aria-label={t("pipelineAttachmentSelectFiles")}
                        onChange={handleAttachmentFiles}
                      />
                      <span className={styles.fileSelectorButton}>
                        {t("pipelineAttachmentSelectFiles")}
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
                        <Field label={t("pipelineAttachmentName")}>
                          <Input value={adjunto.nombreArchivo ?? ""} disabled />
                        </Field>
                        <Field label={t("pipelineAttachmentType")}>
                          <Input value={adjunto.tipoContenido ?? ""} disabled />
                        </Field>
                        <Field label={t("pipelineAttachmentSize")}>
                          <Input value={formatFileSize(adjunto.tamanoBytes)} disabled />
                        </Field>
                        <div className={styles.attachmentActions}>
                          {adjunto.codTuberiaAdjunto ? (
                            <ListActionButton
                              action="descargar"
                              label={t("pipelineAttachmentOpen")}
                              text={t("pipelineAttachmentOpen")}
                              disabled={saving}
                              onClick={() => openAttachment(adjunto)}
                            />
                          ) : null}
                          {canEditFields ? (
                            <ListActionButton
                              action="eliminar"
                              label={t("pipelineAttachmentRemove")}
                              text={t("pipelineAttachmentRemove")}
                              disabled={saving}
                              onClick={() => removeAttachment(index)}
                            />
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Text>{t("pipelineNoAttachments")}</Text>
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
              {t("deletePipelineConfirmation", { pipeline: deletePipelineReference })}
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

      <Dialog
        open={Boolean(lookupType)}
        onOpenChange={(_, data) => {
          if (!data.open) closeLookupDialog();
        }}
      >
        <DialogSurface className={styles.lookupDialogSurface} data-lookup-dialog>
          <DialogBody>
            <DialogTitle>{lookupTitle}</DialogTitle>
            <DialogContent>
              <div className={styles.lookupSearchRow}>
                <Input
                  autoFocus
                  value={lookupSearch}
                  placeholder={lookupSearchPlaceholder}
                  contentBefore={<Search />}
                  onChange={(_, data) => setLookupSearch(data.value)}
                />
              </div>
              <div className={styles.lookupTableWrap}>
                <Table className={styles.lookupTable}>
                  <TableHeader>
                    <TableRow>
                      <TableHeaderCell>{t("pipelineLookupCode")}</TableHeaderCell>
                      <TableHeaderCell>{t("pipelineLookupName")}</TableHeaderCell>
                      <TableHeaderCell className={styles.lookupActionCell}>
                        {t("actions")}
                      </TableHeaderCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLookupOptions.length > 0 ? (
                      filteredLookupOptions.map((option) => (
                        <TableRow
                          key={`${lookupType}-${optionValue(option)}-${optionText(option)}`}
                          className={styles.lookupTableRow}
                          onDoubleClick={() => selectLookupOption(option)}
                        >
                          <TableCell>{optionValue(option)}</TableCell>
                          <TableCell>{optionText(option)}</TableCell>
                          <TableCell className={styles.lookupActionCell}>
                            <Button
                              size="small"
                              appearance="primary"
                              icon={<Check />}
                              onClick={() => selectLookupOption(option)}
                            >
                              {t("pipelineLookupSelect")}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={3} className={styles.lookupEmptyCell}>
                          <Text>{lookupEmptyMessage}</Text>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </DialogContent>
            <DialogActions>
              <ListActionButton
                action="regresar"
                label={t("back")}
                text={t("back")}
                onClick={closeLookupDialog}
              />
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </section>
  );
}

export default TuberiaFormPage;
