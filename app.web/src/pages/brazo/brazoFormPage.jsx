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
import { PERMISOS } from "../../config/permisos";
import { validarPermiso } from "../../services/authService";
import { BahiaService } from "../../services/bahiaService";
import { ProductoService } from "../../services/productoService";
import { BrazoService } from "../../services/brazoService";
import {
  getBrazoActionPageThemeStyles,
  useBrazoActionPageStyles,
} from "../../styles/pages/brazo/brazoActionPageStyles";

const EMPTY_BRAZO = {
  idBrazo: "",
  codBrazo: "",
  codBahia: "",
  idBahia: "",
  bahia: "",
  codProducto: 0,
  idProducto: "",
  producto: "",
  brazo: "",
  comentario: "",
  estatus: true,
  adjuntos: [],
};

function toNumber(value) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
}

function optionValue(option) {
  return String(option?.value ?? "");
}

function optionText(option) {
  return String(option?.text ?? option?.label ?? option?.value ?? "");
}

function getSelectedOptionText(options, value, fallback = "") {
  const selectedValue = String(value ?? "");
  if (!selectedValue) return "";

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

function normalizeBrazo(data) {
  return {
    ...EMPTY_BRAZO,
    ...data,
    comentario: data?.comentario ?? "",
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
        codBrazoAdjunto: 0,
        codBrazo: "",
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

function BrazoFormPage({ mode }) {
  const styles = useBrazoActionPageStyles();
  const themeStyles = getBrazoActionPageThemeStyles();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { idBrazo = "" } = useParams();
  const { values: brazo, setValues: setBrazo } = useFormStateAdapter(EMPTY_BRAZO);
  const [bahias, setBahias] = useState([]);
  const [productos, setProductos] = useState([]);
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
  const adjuntos = Array.isArray(brazo.adjuntos) ? brazo.adjuntos : [];
  const selectedBahiaLabel = getSelectedOptionText(bahias, brazo.codBahia, brazo.bahia);
  const selectedProductoLabel = getSelectedOptionText(productos, brazo.codProducto, brazo.producto);
  const isBayLookup = lookupType === "bahia";
  const lookupOptions = isBayLookup ? bahias : productos;
  const filteredLookupOptions = useMemo(
    () => filterLookupOptions(lookupOptions, lookupSearch),
    [lookupOptions, lookupSearch]
  );
  const lookupTitle = isBayLookup ? t("armBaySearchTitle") : t("armProductSearchTitle");
  const lookupSearchPlaceholder = isBayLookup ? t("armSearchBay") : t("armSearchProduct");
  const lookupEmptyMessage = isBayLookup ? t("armNoBaysFound") : t("armNoProductsFound");

  useEffect(() => {
    let isMounted = true;

    async function loadOptions() {
      try {
        const [bahiaData, productoData] = await Promise.all([
          BahiaService.ListarOpcion(),
          ProductoService.ListarOpcion(),
        ]);
        if (isMounted) {
          setBahias(Array.isArray(bahiaData) ? bahiaData : []);
          setProductos(Array.isArray(productoData) ? productoData : []);
        }
      } catch {
        if (isMounted) {
          setBahias([]);
          setProductos([]);
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

    async function loadBrazo() {
      try {
        setLoading(true);
        setError("");
        const data = await BrazoService.obtener(idBrazo);
        if (isMounted) setBrazo(normalizeBrazo(data));
      } catch (loadError) {
        if (isMounted) setError(loadError.message || t("armLoadError"));
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadBrazo();

    return () => {
      isMounted = false;
    };
  }, [idBrazo, isAdd, setBrazo, t]);

  const updateField = (key) => (_, data) => {
    setBrazo((current) => ({
      ...current,
      [key]: data.value,
    }));
  };

  const updateBoolField = (key) => (_, data) => {
    setBrazo((current) => ({
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

    setBrazo((current) => {
      if (isBayLookup) {
        return {
          ...current,
          codBahia: value,
          idBahia: option?.idBahia ?? option?.id ?? "",
          bahia: text,
        };
      }

      return {
        ...current,
        codProducto: toNumber(value),
        idProducto: option?.idProducto ?? option?.id ?? "",
        producto: text,
      };
    });

    closeLookupDialog();
  };

  const back = () => navigate("/brazo/listar");

  const goEdit = async () => {
    const response = await validarPermiso({
      ruta: "/brazo/editar",
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

    navigate(`/brazo/editar/${encodeURIComponent(idBrazo)}`);
  };

  const save = async () => {
    try {
      setSaving(true);
      setError("");
      setMessage("");

      if (!setZodValidationError(formSchemas.brazo, brazo, t, setError).ok) return;

      const payload = {
        idBrazo: brazo.idBrazo ?? "",
        codBrazo: String(brazo.codBrazo ?? "").trim(),
        codBahia: String(brazo.codBahia ?? "").trim(),
        codProducto: toNumber(brazo.codProducto),
        brazo: String(brazo.brazo ?? "").trim(),
        comentario: brazo.comentario ?? "",
        estatus: Boolean(brazo.estatus),
        adjuntos: adjuntos.map((adjunto) => ({
          codBrazoAdjunto: toNumber(adjunto.codBrazoAdjunto),
          codBrazo: String(brazo.codBrazo ?? "").trim(),
          nombreArchivo: adjunto.nombreArchivo || "",
          tipoContenido: adjunto.tipoContenido || "application/octet-stream",
          tamanoBytes: toNumber(adjunto.tamanoBytes),
          rutaArchivo: adjunto.rutaArchivo || "",
          contenidoBase64: adjunto.contenidoBase64 || "",
        })),
      };

      if (isAdd) {
        await BrazoService.agregar(payload);
        setMessage(t("armAdded"));
        setBrazo(EMPTY_BRAZO);
        setActiveTab("general");
      }

      if (isEdit) {
        await BrazoService.editar(payload);
        setMessage(t("armSaved"));
      }

      if (isDelete) {
        await BrazoService.eliminar(payload);
        navigate("/brazo/listar");
      }
    } catch (saveError) {
      setError(saveError.message || t("armSaveError"));
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
      setError(t("armAttachmentTypeError"));
      return;
    }

    try {
      setError("");
      const nuevosAdjuntos = await Promise.all(files.map(readFileAsAttachment));
      setBrazo((current) => ({
        ...current,
        adjuntos: [...(Array.isArray(current.adjuntos) ? current.adjuntos : []), ...nuevosAdjuntos],
      }));
    } catch {
      setError(t("armAttachmentReadError"));
    }
  };

  const removeAttachment = (index) => {
    setBrazo((current) => ({
      ...current,
      adjuntos: (Array.isArray(current.adjuntos) ? current.adjuntos : []).filter(
        (_, adjuntoIndex) => adjuntoIndex !== index
      ),
    }));
  };

  const openAttachment = async (adjunto) => {
    try {
      setError("");
      const blob = await BrazoService.archivo(idBrazo || brazo.idBrazo, adjunto.codBrazoAdjunto);
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (downloadError) {
      setError(downloadError.message || t("armAttachmentDownloadError"));
    }
  };

  const titleKeyByMode = {
    add: "armAddTitle",
    view: "armViewTitle",
    edit: "armEditTitle",
    delete: "armDeleteTitle",
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
            <Spinner label={t("loadingArm")} />
          </div>
        ) : (
          <>
            {isDelete ? (
              <MessageBar intent="warning">
                {t("deleteArmConfirmation", { arm: brazo.brazo })}
              </MessageBar>
            ) : null}

            <div className={styles.tabs} role="tablist" aria-label={t("armAttachments")}>
              <button
                type="button"
                className={styles.tabButton}
                aria-selected={activeTab === "general"}
                onClick={() => setActiveTab("general")}
              >
                {t("armTabGeneral")}
              </button>
              <button
                type="button"
                className={styles.tabButton}
                aria-selected={activeTab === "files"}
                onClick={() => setActiveTab("files")}
              >
                {t("armTabFiles")}
              </button>
            </div>

            {activeTab === "general" ? (
              <div className={styles.formRows}>
                <div className={`${styles.formRow} ${styles.formRowThree}`}>
                  <Field label={t("armCode")} required={isAdd}>
                    <Input
                      maxLength={20}
                      value={String(brazo.codBrazo ?? "")}
                      disabled={!isAdd}
                      onChange={updateField("codBrazo")}
                    />
                  </Field>
                  <Field label={t("armBay")} required={canEditFields}>
                    <div className={styles.lookupControl}>
                      <Input value={selectedBahiaLabel} readOnly placeholder={t("selectOption")} />
                      <Button
                        size="small"
                        appearance="secondary"
                        icon={<Search />}
                        disabled={!canEditFields}
                        onClick={() => openLookupDialog("bahia")}
                      >
                        {t("armLookupSearch")}
                      </Button>
                    </div>
                  </Field>
                  <Field label={t("armName")} required={canEditFields}>
                    <Input
                      value={brazo.brazo ?? ""}
                      disabled={!canEditFields}
                      onChange={updateField("brazo")}
                    />
                  </Field>
                </div>

                <div className={`${styles.formRow} ${styles.formRowOne}`}>
                  <Field label={t("armComment")}>
                    <Textarea
                      maxLength={250}
                      rows={3}
                      value={brazo.comentario ?? ""}
                      disabled={!canEditFields}
                      onChange={updateField("comentario")}
                    />
                  </Field>
                </div>

                <fieldset className={styles.formFrame}>
                  <legend className={styles.formFrameTitle}>{t("armProductFrameTitle")}</legend>
                  <div className={styles.productFrameGrid}>
                    <Field label={t("armProduct")} required={canEditFields}>
                      <div className={styles.lookupControl}>
                        <Input
                          value={selectedProductoLabel}
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
                          {t("armLookupSearch")}
                        </Button>
                      </div>
                    </Field>
                    <Field label={t("armStatus")}>
                      <Switch
                        checked={Boolean(brazo.estatus)}
                        disabled={!canEditFields}
                        label={brazo.estatus ? t("active") : t("inactive")}
                        onChange={updateBoolField("estatus")}
                      />
                    </Field>
                  </div>
                </fieldset>
              </div>
            ) : (
              <div className={styles.filePanel}>
                {canEditFields ? (
                  <Field label={t("armAttachmentAdd")}>
                    <label className={styles.fileSelector}>
                      <input
                        type="file"
                        multiple
                        accept=".pdf,.jpg,.jpeg,.png"
                        disabled={!canEditFields}
                        className={styles.hiddenFileInput}
                        aria-label={t("armAttachmentSelectFiles")}
                        onChange={handleAttachmentFiles}
                      />
                      <span className={styles.fileSelectorButton}>
                        {t("armAttachmentSelectFiles")}
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
                        <Field label={t("armAttachmentName")}>
                          <Input value={adjunto.nombreArchivo ?? ""} disabled />
                        </Field>
                        <Field label={t("armAttachmentType")}>
                          <Input value={adjunto.tipoContenido ?? ""} disabled />
                        </Field>
                        <Field label={t("armAttachmentSize")}>
                          <Input value={formatFileSize(adjunto.tamanoBytes)} disabled />
                        </Field>
                        <div className={styles.attachmentActions}>
                          {adjunto.codBrazoAdjunto ? (
                            <ListActionButton
                              action="descargar"
                              label={t("armAttachmentOpen")}
                              text={t("armAttachmentOpen")}
                              disabled={saving}
                              onClick={() => openAttachment(adjunto)}
                            />
                          ) : null}
                          {canEditFields ? (
                            <ListActionButton
                              action="eliminar"
                              label={t("armAttachmentRemove")}
                              text={t("armAttachmentRemove")}
                              disabled={saving}
                              onClick={() => removeAttachment(index)}
                            />
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Text>{t("armNoAttachments")}</Text>
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
                      <TableHeaderCell>{t("armLookupCode")}</TableHeaderCell>
                      <TableHeaderCell>{t("armLookupName")}</TableHeaderCell>
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
                              {t("armLookupSelect")}
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

      <Dialog open={openDeleteConfirm} onOpenChange={(_, data) => setOpenDeleteConfirm(data.open)}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>{t("confirmDelete")}</DialogTitle>
            <DialogContent>{t("deleteArmConfirmation", { arm: brazo.brazo })}</DialogContent>
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

export default BrazoFormPage;
