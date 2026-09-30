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
import { ArrowDown, ArrowUp, Check, Search } from "lucide-react";
import { formSchemas } from "../../validations/formSchemas";
import { setZodValidationError } from "../../validations/zodValidation";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ListActionButton } from "../../components/common/ListActionButton";
import { PERMISOS } from "../../config/permisos";
import { validarPermiso } from "../../services/authService";
import { CapacidadVolumetricaTanqueService } from "../../services/capacidadVolumetricaTanqueService";
import { ProductoService } from "../../services/productoService";
import { TanqueService } from "../../services/tanqueService";
import {
  getTanqueActionPageThemeStyles,
  useTanqueActionPageStyles,
} from "../../styles/pages/tanque/tanqueActionPageStyles";
import { assetUrl } from "../../utils/assets";
import { formatDateByLanguage } from "../../utils/formatDateByLanguage";

const linkIconUrl = assetUrl("images/Link.svg");

const EMPTY_TANQUE = {
  idTanque: "",
  codTanque: "",
  codProducto: 0,
  producto: "",
  tipoTanque: "",
  tanque: "",
  descripcionCorta: "",
  mencod: "",
  alturaMaximaPies: 0,
  alturaMaximaPulgadas: 0,
  tipoPosiconTecho: "No aplica",
  alturaMinimaPies: 0,
  alturaMinimaPulgadas: 0,
  volumenMaximo: 0,
  volumenMinimo: 0,
  volumenTechoPosicionAlta: 0,
  volumenTechoPosicionBaja: 0,
  proveedor: "",
  consumoPropio: false,
  comentario: "",
  estatus: true,
  adjuntos: [],
};

const TANK_TYPE_OPTIONS = [
  { value: "Flotante Externo", labelKey: "tankTypeFloatingExternal" },
  { value: "Conico fijo", labelKey: "tankTypeFixedCone" },
  { value: "Flotante Interno", labelKey: "tankTypeFloatingInternal" },
  { value: "Horizontal", labelKey: "tankTypeHorizontal" },
];

const ROOF_POSITION_OPTIONS = [
  { value: "No aplica", labelKey: "tankRoofPositionNotApplicable" },
  { value: "Baja", labelKey: "tankRoofPositionLow" },
  { value: "Alta", labelKey: "tankRoofPositionHigh" },
];

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

function compareLookupText(a, b, locale) {
  return String(a ?? "").localeCompare(String(b ?? ""), locale || undefined, {
    numeric: true,
    sensitivity: "base",
  });
}

function sortLookupOptions(options, sort, locale) {
  const sortKey = sort?.key === "producto" ? "producto" : "codProducto";
  const direction = sort?.direction === "desc" ? -1 : 1;
  const getPrimaryValue = sortKey === "producto" ? optionText : optionValue;
  const getSecondaryValue = sortKey === "producto" ? optionValue : optionText;

  return [...options].sort((a, b) => {
    const primaryResult = compareLookupText(getPrimaryValue(a), getPrimaryValue(b), locale);
    if (primaryResult !== 0) return primaryResult * direction;

    return compareLookupText(getSecondaryValue(a), getSecondaryValue(b), locale) * direction;
  });
}

const ALLOWED_ATTACHMENT_TYPES = new Set(["application/pdf", "image/jpeg", "image/png"]);

function normalizeTanque(data) {
  return {
    ...EMPTY_TANQUE,
    ...data,
    codTanque: toText(data?.codTanque),
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
        codTanqueAdjunto: 0,
        codTanque: "",
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

function TanqueFormPage({ mode }) {
  const styles = useTanqueActionPageStyles();
  const themeStyles = getTanqueActionPageThemeStyles();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { idTanque = "" } = useParams();
  const { values: tanque, setValues: setTanque } = useFormStateAdapter(EMPTY_TANQUE);
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false);
  const [openProductLookup, setOpenProductLookup] = useState(false);
  const [productLookupSearch, setProductLookupSearch] = useState("");
  const [productLookupSort, setProductLookupSort] = useState({
    key: "codProducto",
    direction: "asc",
  });
  const [activeTab, setActiveTab] = useState("general");
  const [capacidadesActuales, setCapacidadesActuales] = useState([]);
  const [capacidadesHistoricas, setCapacidadesHistoricas] = useState([]);
  const [loadingCapacidades, setLoadingCapacidades] = useState(false);
  const [capacidadError, setCapacidadError] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const isAdd = mode === "add";
  const isView = mode === "view";
  const isEdit = mode === "edit";
  const isDelete = mode === "delete";
  const canEditFields = isAdd || isEdit;
  const adjuntos = Array.isArray(tanque.adjuntos) ? tanque.adjuntos : [];
  const showCapacityTabs = !isAdd && Boolean(idTanque || tanque.idTanque);
  const isCapacityHistoryTab =
    activeTab === "currentCapacities" || activeTab === "volumetricCapacities";
  const selectedProductLabel = getSelectedOptionText(
    productos,
    tanque.codProducto,
    tanque.producto
  );
  const filteredProductOptions = useMemo(
    () =>
      sortLookupOptions(
        filterLookupOptions(productos, productLookupSearch),
        productLookupSort,
        i18n.language
      ),
    [productos, productLookupSearch, productLookupSort, i18n.language]
  );

  useEffect(() => {
    let isMounted = true;

    async function loadOptions() {
      try {
        const data = await ProductoService.ListarOpcion();
        if (isMounted) setProductos(Array.isArray(data) ? data : []);
      } catch {
        if (isMounted) setProductos([]);
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

    async function loadTanque() {
      try {
        setLoading(true);
        setError("");
        const data = await TanqueService.obtener(idTanque);
        if (isMounted) setTanque(normalizeTanque(data));
      } catch (loadError) {
        if (isMounted) setError(loadError.message || t("tankLoadError"));
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadTanque();

    return () => {
      isMounted = false;
    };
  }, [idTanque, isAdd, setTanque, t]);

  useEffect(() => {
    if (isAdd || !idTanque) {
      setCapacidadesActuales([]);
      setCapacidadesHistoricas([]);
      setLoadingCapacidades(false);
      setCapacidadError("");
      return undefined;
    }

    let isMounted = true;

    async function loadCapacidadesVolumetricas() {
      try {
        setLoadingCapacidades(true);
        setCapacidadError("");

        const [actualesPage, historicasPage] = await Promise.all([
          CapacidadVolumetricaTanqueService.listado({
            idTanque,
            page: 1,
            pageSize: 100,
            soloActuales: true,
          }),
          CapacidadVolumetricaTanqueService.listado({
            idTanque,
            page: 1,
            pageSize: 100,
            soloHistoricas: true,
          }),
        ]);

        if (!isMounted) return;

        setCapacidadesActuales(Array.isArray(actualesPage.items) ? actualesPage.items : []);
        setCapacidadesHistoricas(Array.isArray(historicasPage.items) ? historicasPage.items : []);
      } catch (loadError) {
        if (!isMounted) return;

        setCapacidadesActuales([]);
        setCapacidadesHistoricas([]);
        setCapacidadError(loadError.message || t("tankVolumetricCapacityLoadError"));
      } finally {
        if (isMounted) setLoadingCapacidades(false);
      }
    }

    loadCapacidadesVolumetricas();

    return () => {
      isMounted = false;
    };
  }, [idTanque, isAdd, t]);

  const updateField = (key) => (_, data) => {
    setTanque((current) => ({
      ...current,
      [key]: data.value,
    }));
  };

  const updateNumberField = (key) => (_, data) => {
    setTanque((current) => ({
      ...current,
      [key]: toNumber(data.value),
    }));
  };

  const updateBoolField = (key) => (_, data) => {
    setTanque((current) => ({
      ...current,
      [key]: Boolean(data.checked),
    }));
  };

  const openProductLookupDialog = () => {
    if (!canEditFields) return;

    setProductLookupSearch("");
    setOpenProductLookup(true);
  };

  const closeProductLookupDialog = () => {
    setOpenProductLookup(false);
    setProductLookupSearch("");
  };

  const toggleProductLookupSort = (key) => {
    setProductLookupSort((current) => ({
      key,
      direction: current.key === key && current.direction === "asc" ? "desc" : "asc",
    }));
  };

  const getProductLookupSortLabel = (key) =>
    productLookupSort.key === key && productLookupSort.direction === "asc"
      ? t("gridSortDescending")
      : t("gridSortAscending");

  const getProductLookupAriaSort = (key) => {
    if (productLookupSort.key !== key) return "none";
    return productLookupSort.direction === "asc" ? "ascending" : "descending";
  };

  const renderProductLookupSortIcon = (key) => {
    if (productLookupSort.key !== key) return null;

    const Icon = productLookupSort.direction === "asc" ? ArrowUp : ArrowDown;
    return <Icon size={14} aria-hidden="true" />;
  };

  const renderProductLookupSortHeader = (key, label) => (
    <button
      type="button"
      className={styles.lookupSortButton}
      onClick={() => toggleProductLookupSort(key)}
      aria-label={`${label}: ${getProductLookupSortLabel(key)}`}
      title={getProductLookupSortLabel(key)}
    >
      <span>{label}</span>
      <span className={styles.lookupSortIndicator} aria-hidden="true">
        {renderProductLookupSortIcon(key)}
      </span>
    </button>
  );

  const selectProductOption = (option) => {
    setTanque((current) => ({
      ...current,
      codProducto: toNumber(optionValue(option)),
      producto: optionText(option),
    }));
    closeProductLookupDialog();
  };

  const back = () => navigate("/tanque/listar");

  const goEdit = async () => {
    const response = await validarPermiso({
      ruta: "/tanque/editar",
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

    navigate(`/tanque/editar/${encodeURIComponent(idTanque)}`);
  };

  const save = async () => {
    try {
      setSaving(true);
      setError("");
      setMessage("");

      if (!setZodValidationError(formSchemas.tanque, tanque, t, setError).ok) return;

      const payload = {
        ...tanque,
        codTanque: toText(tanque.codTanque),
        codProducto: toNumber(tanque.codProducto),
        tipoTanque: tanque.tipoTanque || "",
        alturaMaximaPies: toNumber(tanque.alturaMaximaPies),
        alturaMaximaPulgadas: toNumber(tanque.alturaMaximaPulgadas),
        tipoPosiconTecho: tanque.tipoPosiconTecho || "No aplica",
        alturaMinimaPies: toNumber(tanque.alturaMinimaPies),
        alturaMinimaPulgadas: toNumber(tanque.alturaMinimaPulgadas),
        volumenMaximo: toNumber(tanque.volumenMaximo),
        volumenMinimo: toNumber(tanque.volumenMinimo),
        volumenTechoPosicionAlta: toNumber(tanque.volumenTechoPosicionAlta),
        volumenTechoPosicionBaja: toNumber(tanque.volumenTechoPosicionBaja),
        consumoPropio: Boolean(tanque.consumoPropio),
        estatus: Boolean(tanque.estatus),
        adjuntos: adjuntos.map((adjunto) => ({
          codTanqueAdjunto: toNumber(adjunto.codTanqueAdjunto),
          codTanque: toText(tanque.codTanque),
          nombreArchivo: adjunto.nombreArchivo || "",
          tipoContenido: adjunto.tipoContenido || "application/octet-stream",
          tamanoBytes: toNumber(adjunto.tamanoBytes),
          rutaArchivo: adjunto.rutaArchivo || "",
          contenidoBase64: adjunto.contenidoBase64 || "",
        })),
      };

      if (isAdd) {
        await TanqueService.agregar(payload);
        setMessage(t("tankAdded"));
        setTanque(EMPTY_TANQUE);
        setActiveTab("general");
      }

      if (isEdit) {
        await TanqueService.editar(payload);
        setMessage(t("tankSaved"));
      }

      if (isDelete) {
        await TanqueService.eliminar(payload);
        navigate("/tanque/listar");
      }
    } catch (saveError) {
      setError(saveError.message || t("tankSaveError"));
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
      setError(t("tankAttachmentTypeError"));
      return;
    }

    try {
      setError("");
      const nuevosAdjuntos = await Promise.all(files.map(readFileAsAttachment));
      setTanque((current) => ({
        ...current,
        adjuntos: [...(Array.isArray(current.adjuntos) ? current.adjuntos : []), ...nuevosAdjuntos],
      }));
    } catch {
      setError(t("tankAttachmentReadError"));
    }
  };

  const removeAttachment = (index) => {
    setTanque((current) => ({
      ...current,
      adjuntos: (Array.isArray(current.adjuntos) ? current.adjuntos : []).filter(
        (_, adjuntoIndex) => adjuntoIndex !== index
      ),
    }));
  };

  const openAttachment = async (adjunto) => {
    try {
      setError("");
      const blob = await TanqueService.archivo(
        idTanque || tanque.idTanque,
        adjunto.codTanqueAdjunto
      );
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (downloadError) {
      setError(downloadError.message || t("tankAttachmentDownloadError"));
    }
  };

  const renderCapacidadLink = (documento) => {
    if (!documento?.codCapacidadVolumetricaTanque) return "";
    if (!documento.idCapacidadVolumetricaTanque) return documento.codCapacidadVolumetricaTanque;

    return (
      <span className={styles.masterCell}>
        <Link
          className={styles.masterArrowLink}
          to={`/capacidadvolumetricatanque/visualizar/${encodeURIComponent(documento.idCapacidadVolumetricaTanque)}`}
          aria-label={t("tankVolumetricCapacityOpen")}
        >
          <img className={styles.masterArrowImage} src={linkIconUrl} alt="" />
        </Link>
        <span>{documento.codCapacidadVolumetricaTanque}</span>
      </span>
    );
  };

  const renderCapacidadesTab = (items, labelKey, emptyKey) => (
    <div className={styles.relatedPanel}>
      {capacidadError ? <MessageBar intent="error">{capacidadError}</MessageBar> : null}
      {loadingCapacidades ? (
        <div className={styles.relatedLoading}>
          <Spinner label={t("loadingTankCalibrations")} />
        </div>
      ) : (
        <>
          <Text className={styles.relatedSummary}>
            {t("tankListCount", { count: items.length })}
          </Text>
          <div className={styles.relatedTableSurface}>
            <Table aria-label={t(labelKey)} className={styles.relatedTable}>
              <TableHeader>
                <TableRow>
                  <TableHeaderCell>{t("tankCalibrationCode")}</TableHeaderCell>
                  <TableHeaderCell>{t("tankCalibrationProduct")}</TableHeaderCell>
                  <TableHeaderCell>{t("tankCalibrationDate")}</TableHeaderCell>
                  <TableHeaderCell>{t("tankCalibrationCurrent")}</TableHeaderCell>
                  <TableHeaderCell>{t("tankStatus")}</TableHeaderCell>
                  <TableHeaderCell>{t("tankCalibrationDetailCount")}</TableHeaderCell>
                  <TableHeaderCell>{t("tankCalibrationComments")}</TableHeaderCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length > 0 ? (
                  items.map((documento) => (
                    <TableRow
                      key={
                        documento.idCapacidadVolumetricaTanque ||
                        documento.codCapacidadVolumetricaTanque
                      }
                    >
                      <TableCell>{renderCapacidadLink(documento)}</TableCell>
                      <TableCell>{documento.producto || "-"}</TableCell>
                      <TableCell>
                        {formatDateByLanguage(documento.fechaCalibracion, i18n.language)}
                      </TableCell>
                      <TableCell>{documento.esActual ? t("yes") : t("no")}</TableCell>
                      <TableCell>
                        {documento.estatus !== false ? t("active") : t("inactive")}
                      </TableCell>
                      <TableCell>{documento.detalleCantidad ?? 0}</TableCell>
                      <TableCell>{documento.comentarios || "-"}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7}>
                      <Text className={styles.empty}>{t(emptyKey)}</Text>
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
    add: "tankAddTitle",
    view: "tankViewTitle",
    edit: "tankEditTitle",
    delete: "tankDeleteTitle",
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
            <Spinner label={t("loadingTank")} />
          </div>
        ) : (
          <>
            {isDelete ? (
              <MessageBar intent="warning">
                {t("deleteTankConfirmation", { tank: tanque.tanque })}
              </MessageBar>
            ) : null}

            <div className={styles.tabs} role="tablist" aria-label={t("tankTabs")}>
              <button
                type="button"
                className={styles.tabButton}
                aria-selected={activeTab === "general"}
                onClick={() => setActiveTab("general")}
              >
                {t("tankTabGeneral")}
              </button>
              <button
                type="button"
                className={styles.tabButton}
                aria-selected={activeTab === "files"}
                onClick={() => setActiveTab("files")}
              >
                {t("tankTabFiles")}
              </button>
              {showCapacityTabs ? (
                <>
                  <button
                    type="button"
                    className={styles.tabButton}
                    aria-selected={activeTab === "currentCapacities"}
                    onClick={() => setActiveTab("currentCapacities")}
                  >
                    {t("tankTabCurrentVolumetricCapacities")}
                  </button>
                  <button
                    type="button"
                    className={styles.tabButton}
                    aria-selected={activeTab === "volumetricCapacities"}
                    onClick={() => setActiveTab("volumetricCapacities")}
                  >
                    {t("tankTabVolumetricCapacities")}
                  </button>
                </>
              ) : null}
            </div>

            {activeTab === "general" ? (
              <div className={styles.formRows}>
                <div className={`${styles.formRow} ${styles.formRowThree}`}>
                  <Field label={t("tankCode")} required={isAdd}>
                    <Input
                      maxLength={20}
                      value={String(tanque.codTanque ?? "")}
                      disabled={!isAdd}
                      onChange={updateField("codTanque")}
                    />
                  </Field>
                  <Field label={t("tankName")} required={canEditFields}>
                    <Input
                      value={tanque.tanque ?? ""}
                      disabled={!canEditFields}
                      onChange={updateField("tanque")}
                    />
                  </Field>
                  <Field label={t("tankShortDescription")} required={canEditFields}>
                    <Input
                      maxLength={10}
                      value={tanque.descripcionCorta ?? ""}
                      disabled={!canEditFields}
                      onChange={updateField("descripcionCorta")}
                    />
                  </Field>
                  <Field label={t("tankMencod")}>
                    <Input
                      value={tanque.mencod ?? ""}
                      disabled={!canEditFields}
                      onChange={updateField("mencod")}
                    />
                  </Field>
                </div>

                <div className={`${styles.formRow} ${styles.productConfigRow}`}>
                  <Field label={t("tankProduct")} required={canEditFields}>
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
                        onClick={openProductLookupDialog}
                      >
                        {t("tankLookupSearch")}
                      </Button>
                    </div>
                  </Field>
                  <Field label={t("tankType")} required={canEditFields}>
                    <Select
                      value={tanque.tipoTanque ?? ""}
                      disabled={!canEditFields}
                      onChange={updateField("tipoTanque")}
                    >
                      <option value="">{t("selectOption")}</option>
                      {TANK_TYPE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {t(option.labelKey)}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label={t("tankRoofPosition")} required={canEditFields}>
                    <Select
                      value={tanque.tipoPosiconTecho ?? "No aplica"}
                      disabled={!canEditFields}
                      onChange={updateField("tipoPosiconTecho")}
                    >
                      {ROOF_POSITION_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {t(option.labelKey)}
                        </option>
                      ))}
                    </Select>
                  </Field>
                </div>

                <div className={styles.heightGroups}>
                  <fieldset className={styles.heightFrame}>
                    <legend className={styles.heightFrameTitle}>
                      {t("tankMaximumHeightTitle")}
                    </legend>
                    <div className={styles.heightFrameGrid}>
                      <Field label={t("tankFeet")}>
                        <Input
                          type="number"
                          value={String(tanque.alturaMaximaPies ?? 0)}
                          disabled={!canEditFields}
                          onChange={updateNumberField("alturaMaximaPies")}
                        />
                      </Field>
                      <Field label={t("tankInches")}>
                        <Input
                          type="number"
                          value={String(tanque.alturaMaximaPulgadas ?? 0)}
                          disabled={!canEditFields}
                          onChange={updateNumberField("alturaMaximaPulgadas")}
                        />
                      </Field>
                    </div>
                  </fieldset>

                  <fieldset className={styles.heightFrame}>
                    <legend className={styles.heightFrameTitle}>
                      {t("tankMinimumHeightTitle")}
                    </legend>
                    <div className={styles.heightFrameGrid}>
                      <Field label={t("tankFeet")}>
                        <Input
                          type="number"
                          value={String(tanque.alturaMinimaPies ?? 0)}
                          disabled={!canEditFields}
                          onChange={updateNumberField("alturaMinimaPies")}
                        />
                      </Field>
                      <Field label={t("tankInches")}>
                        <Input
                          type="number"
                          value={String(tanque.alturaMinimaPulgadas ?? 0)}
                          disabled={!canEditFields}
                          onChange={updateNumberField("alturaMinimaPulgadas")}
                        />
                      </Field>
                    </div>
                  </fieldset>
                </div>

                <fieldset className={styles.heightFrame}>
                  <legend className={styles.heightFrameTitle}>{t("tankVolumeTitle")}</legend>
                  <div className={styles.volumeFrameGrid}>
                    <Field label={t("tankVolumeMaximum")}>
                      <Input
                        type="number"
                        step="any"
                        value={String(tanque.volumenMaximo ?? 0)}
                        disabled={!canEditFields}
                        onChange={updateNumberField("volumenMaximo")}
                      />
                    </Field>
                    <Field label={t("tankVolumeMinimum")}>
                      <Input
                        type="number"
                        step="any"
                        value={String(tanque.volumenMinimo ?? 0)}
                        disabled={!canEditFields}
                        onChange={updateNumberField("volumenMinimo")}
                      />
                    </Field>
                    <Field label={t("tankVolumeRoofHigh")}>
                      <Input
                        type="number"
                        step="any"
                        value={String(tanque.volumenTechoPosicionAlta ?? 0)}
                        disabled={!canEditFields}
                        onChange={updateNumberField("volumenTechoPosicionAlta")}
                      />
                    </Field>
                    <Field label={t("tankVolumeRoofLow")}>
                      <Input
                        type="number"
                        step="any"
                        value={String(tanque.volumenTechoPosicionBaja ?? 0)}
                        disabled={!canEditFields}
                        onChange={updateNumberField("volumenTechoPosicionBaja")}
                      />
                    </Field>
                  </div>
                </fieldset>

                <div className={styles.commentStatusRow}>
                  <Field label={t("tankComment")}>
                    <Textarea
                      maxLength={250}
                      rows={3}
                      value={tanque.comentario ?? ""}
                      disabled={!canEditFields}
                      onChange={updateField("comentario")}
                    />
                  </Field>
                  <div className={styles.statusControls}>
                    <Field label={t("tankOwnConsumption")}>
                      <Switch
                        checked={Boolean(tanque.consumoPropio)}
                        disabled={!canEditFields}
                        label={tanque.consumoPropio ? t("yes") : t("no")}
                        onChange={updateBoolField("consumoPropio")}
                      />
                    </Field>
                    <Field label={t("tankStatus")}>
                      <Switch
                        checked={Boolean(tanque.estatus)}
                        disabled={!canEditFields}
                        label={tanque.estatus ? t("active") : t("inactive")}
                        onChange={updateBoolField("estatus")}
                      />
                    </Field>
                  </div>
                </div>
              </div>
            ) : activeTab === "files" ? (
              <div className={styles.filePanel}>
                {canEditFields ? (
                  <Field label={t("tankAttachmentAdd")}>
                    <label className={styles.fileSelector}>
                      <input
                        type="file"
                        multiple
                        accept=".pdf,.jpg,.jpeg,.png"
                        disabled={!canEditFields}
                        className={styles.hiddenFileInput}
                        aria-label={t("tankAttachmentSelectFiles")}
                        onChange={handleAttachmentFiles}
                      />
                      <span className={styles.fileSelectorButton}>
                        {t("tankAttachmentSelectFiles")}
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
                        <Field label={t("tankAttachmentName")}>
                          <Input value={adjunto.nombreArchivo ?? ""} disabled />
                        </Field>
                        <Field label={t("tankAttachmentType")}>
                          <Input value={adjunto.tipoContenido ?? ""} disabled />
                        </Field>
                        <Field label={t("tankAttachmentSize")}>
                          <Input value={formatFileSize(adjunto.tamanoBytes)} disabled />
                        </Field>
                        <div className={styles.attachmentActions}>
                          {adjunto.codTanqueAdjunto ? (
                            <ListActionButton
                              action="descargar"
                              label={t("tankAttachmentOpen")}
                              text={t("tankAttachmentOpen")}
                              disabled={saving}
                              onClick={() => openAttachment(adjunto)}
                            />
                          ) : null}
                          {canEditFields ? (
                            <ListActionButton
                              action="eliminar"
                              label={t("tankAttachmentRemove")}
                              text={t("tankAttachmentRemove")}
                              disabled={saving}
                              onClick={() => removeAttachment(index)}
                            />
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Text>{t("tankNoAttachments")}</Text>
                )}
              </div>
            ) : activeTab === "currentCapacities" ? (
              renderCapacidadesTab(
                capacidadesActuales,
                "tankTabCurrentVolumetricCapacities",
                "tankNoCurrentVolumetricCapacities"
              )
            ) : (
              renderCapacidadesTab(
                capacidadesHistoricas,
                "tankTabVolumetricCapacities",
                "tankNoVolumetricCapacities"
              )
            )}

            {!isCapacityHistoryTab ? (
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

      <Dialog
        open={openProductLookup}
        onOpenChange={(_, data) => {
          if (!data.open) closeProductLookupDialog();
        }}
      >
        <DialogSurface className={styles.lookupDialogSurface} data-lookup-dialog>
          <DialogBody>
            <DialogTitle>{t("tankProductSearchTitle")}</DialogTitle>
            <DialogContent>
              <div className={styles.lookupSearchRow}>
                <Input
                  autoFocus
                  value={productLookupSearch}
                  placeholder={t("tankSearchProduct")}
                  contentBefore={<Search />}
                  onChange={(_, data) => setProductLookupSearch(data.value)}
                />
              </div>
              <div className={styles.lookupTableWrap}>
                <Table className={styles.lookupTable}>
                  <TableHeader>
                    <TableRow>
                      <TableHeaderCell aria-sort={getProductLookupAriaSort("codProducto")}>
                        {renderProductLookupSortHeader("codProducto", t("tankLookupCode"))}
                      </TableHeaderCell>
                      <TableHeaderCell aria-sort={getProductLookupAriaSort("producto")}>
                        {renderProductLookupSortHeader("producto", t("tankLookupName"))}
                      </TableHeaderCell>
                      <TableHeaderCell className={styles.lookupActionCell}>
                        {t("actions")}
                      </TableHeaderCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProductOptions.length > 0 ? (
                      filteredProductOptions.map((option) => (
                        <TableRow
                          key={`${optionValue(option)}-${optionText(option)}`}
                          className={styles.lookupTableRow}
                          onDoubleClick={() => selectProductOption(option)}
                        >
                          <TableCell>{optionValue(option)}</TableCell>
                          <TableCell>{optionText(option)}</TableCell>
                          <TableCell className={styles.lookupActionCell}>
                            <Button
                              size="small"
                              appearance="primary"
                              icon={<Check />}
                              onClick={() => selectProductOption(option)}
                            >
                              {t("tankLookupSelect")}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={3} className={styles.lookupEmptyCell}>
                          <Text>{t("tankNoProductsFound")}</Text>
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
                onClick={closeProductLookupDialog}
              />
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      <Dialog open={openDeleteConfirm} onOpenChange={(_, data) => setOpenDeleteConfirm(data.open)}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>{t("confirmDelete")}</DialogTitle>
            <DialogContent>{t("deleteTankConfirmation", { tank: tanque.tanque })}</DialogContent>
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

export default TanqueFormPage;
