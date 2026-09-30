import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import FormWizard from "react-form-wizard-component";
import "react-form-wizard-component/dist/style.css";
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
  Select,
  Spinner,
  Text,
  Textarea,
  Title2,
} from "@/components/ui/app-shadcn";
import { useTranslation } from "react-i18next";
import { formSchemas } from "../../validations/formSchemas";
import { setZodValidationError } from "../../validations/zodValidation";
import { useNavigate, useParams } from "react-router-dom";
import { ListActionButton } from "../../components/common/ListActionButton";
import { LocalizedDateInput } from "../../components/common/LocalizedDateInput";
import { PERMISOS } from "../../config/permisos";
import { validarPermiso } from "../../services/authService";
import { CapacidadVolumetricaTanqueService } from "../../services/capacidadVolumetricaTanqueService";
import { CompaniaInspeccionService } from "../../services/companiaInspeccionService";
import { ProductoService } from "../../services/productoService";
import { TanqueService } from "../../services/tanqueService";
import {
  getCapacidadVolumetricaTanqueActionPageThemeStyles,
  useCapacidadVolumetricaTanqueActionPageStyles,
} from "../../styles/pages/capacidadVolumetricaTanque/capacidadVolumetricaTanqueActionPageStyles";
import {
  TANK_VOLUMETRIC_CAPACITY_TEMPLATE_ACCEPT,
  downloadTankVolumetricCapacityFractionTemplate,
  downloadTankVolumetricCapacityTemplate,
  readTankVolumetricCapacityFractionTemplate,
  readTankVolumetricCapacityTemplate,
} from "../../utils/tankVolumetricCapacityExcel";

const FRACTION_DENOMINATOR = 16;
const DEFAULT_FRACTIONS = Array.from({ length: FRACTION_DENOMINATOR - 1 }, (_, index) => index + 1);
const FORM_STEP_HEADER = "header";
const FORM_STEP_BASE = "base";
const FORM_STEP_FRACTIONS = "fractions";
const FORM_STEP_CALCULATED = "calculated";
const FORM_STEP_FILES = "files";
const FORM_STEPS = [
  { key: FORM_STEP_HEADER, labelKey: "tankCalibrationStepHeader" },
  { key: FORM_STEP_BASE, labelKey: "tankCalibrationStepBase" },
  { key: FORM_STEP_FRACTIONS, labelKey: "tankCalibrationStepFractions" },
  { key: FORM_STEP_CALCULATED, labelKey: "tankCalibrationStepCalculated" },
  { key: FORM_STEP_FILES, labelKey: "tankCalibrationStepFiles" },
];

const EMPTY_DETALLE = {
  idCapacidadVolumetricaTanqueDetalle: "",
  codCapacidadVolumetricaTanqueDetalle: 0,
  codCapacidadVolumetricaTanque: 0,
  pies: 0,
  pulgadas: 0,
  dieciseisavos: 0,
  volumen: 0,
};

const EMPTY_DETALLE_BASE = {
  idCapacidadVolumetricaTanqueDetalle2: "",
  codCapacidadVolumetricaTanqueDetalle2: 0,
  codCapacidadVolumetricaTanque: 0,
  pies: 0,
  pulgadas: 0,
  volumen: 0,
};

const EMPTY_DETALLE_FRACCION = {
  idCapacidadVolumetricaTanqueDetalle3: "",
  codCapacidadVolumetricaTanqueDetalle3: 0,
  codCapacidadVolumetricaTanque: 0,
  dieciseisavos: 1,
  volumen: 0,
};

const EMPTY_DOCUMENTO = {
  idCapacidadVolumetricaTanque: "",
  codCapacidadVolumetricaTanque: 0,
  codTanque: "",
  tanque: "",
  codProducto: 0,
  idProducto: "",
  producto: "",
  codCompaniaInspeccion: 0,
  idCompaniaInspeccion: "",
  companiaInspeccion: "",
  fechaCalibracion: new Date().toISOString().slice(0, 10),
  comentarios: "",
  esActual: false,
  detalleCantidad: 0,
  adjuntoCantidad: 0,
  adjuntos: [],
  detallesBase: [{ ...EMPTY_DETALLE_BASE }],
  detallesFracciones: DEFAULT_FRACTIONS.map((fraction) => ({
    ...EMPTY_DETALLE_FRACCION,
    dieciseisavos: fraction,
  })),
  detalles: [{ ...EMPTY_DETALLE }],
};

const detailGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
  gap: "12px",
  alignItems: "end",
  marginTop: "12px",
};

const fractionDetailGridStyle = {
  ...detailGridStyle,
  gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
};

const fractionActionStyle = {
  display: "flex",
  alignItems: "center",
  minHeight: "32px",
};

const detailActionsStyle = {
  display: "flex",
  gap: "8px",
  flexWrap: "wrap",
};

const detailSummaryStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
  gap: "12px",
  marginTop: "12px",
};

const detailSummaryItemStyle = {
  display: "grid",
  gap: "4px",
};

const detailSummaryLabelStyle = {
  color: "var(--app-muted-text, var(--app-user-label))",
  fontSize: "13px",
};

const ALLOWED_ATTACHMENT_TYPES = new Set(["application/pdf", "image/jpeg", "image/png"]);
const HEADER_VALIDATION_FIELDS = {
  codTanque: true,
  codProducto: true,
  codCompaniaInspeccion: true,
  fechaCalibracion: true,
  comentarios: true,
};
const ATTACHMENT_VALIDATION_FIELDS = {
  adjuntos: true,
};
const HEADER_ERROR_KEYS = new Set([
  "tankCalibrationTankRequired",
  "tankCodeMaxLength",
  "tankCalibrationProductRequired",
  "tankCalibrationInspectionCompanyRequired",
  "tankCalibrationDateRequired",
  "tankCalibrationCommentsMaxLength",
]);

function toNumber(value) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
}

function toText(value) {
  return String(value ?? "").trim();
}

function toDateInputValue(value) {
  if (!value) return "";
  return String(value).slice(0, 10);
}

function normalizeDocumento(data) {
  const detallesFinales =
    Array.isArray(data.detalles) && data.detalles.length > 0
      ? data.detalles.map((detalle) => ({
          ...EMPTY_DETALLE,
          ...detalle,
        }))
      : [{ ...EMPTY_DETALLE }];
  const detallesBase =
    Array.isArray(data.detallesBase) && data.detallesBase.length > 0
      ? data.detallesBase.map(normalizeBaseDetalle)
      : getBaseDetalles(detallesFinales).map(normalizeBaseDetalle);
  const detallesFracciones =
    Array.isArray(data.detallesFracciones) && data.detallesFracciones.length > 0
      ? data.detallesFracciones.map(normalizeFractionDetalle)
      : extractFractions(detallesFinales).map((fraction) => normalizeFractionDetalle(fraction));

  return {
    ...EMPTY_DOCUMENTO,
    ...data,
    codTanque: toText(data?.codTanque),
    fechaCalibracion: toDateInputValue(data.fechaCalibracion) || EMPTY_DOCUMENTO.fechaCalibracion,
    comentarios: data.comentarios ?? "",
    adjuntos: Array.isArray(data.adjuntos) ? data.adjuntos : [],
    detallesBase: detallesBase.length > 0 ? detallesBase : [{ ...EMPTY_DETALLE_BASE }],
    detallesFracciones,
    detalles: detallesFinales,
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
        codCapacidadVolumetricaTanqueAdjunto: 0,
        codCapacidadVolumetricaTanque: 0,
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

function buildHeightKey(detalle) {
  return [toNumber(detalle.pies), toNumber(detalle.pulgadas), toNumber(detalle.dieciseisavos)].join(
    "-"
  );
}

function hasDuplicateHeights(detalles) {
  const seen = new Set();
  return detalles.some((detalle) => {
    const key = buildHeightKey(detalle);
    if (seen.has(key)) return true;
    seen.add(key);
    return false;
  });
}

function normalizeDetalle(detalle) {
  return {
    ...EMPTY_DETALLE,
    ...detalle,
    pies: toNumber(detalle?.pies),
    pulgadas: toNumber(detalle?.pulgadas),
    dieciseisavos: toNumber(detalle?.dieciseisavos),
    volumen: toNumber(detalle?.volumen),
  };
}

function normalizeBaseDetalle(detalle) {
  return {
    ...EMPTY_DETALLE_BASE,
    ...detalle,
    pies: toNumber(detalle?.pies),
    pulgadas: toNumber(detalle?.pulgadas),
    volumen: toNumber(detalle?.volumen),
  };
}

function normalizeFractionDetalle(detalle) {
  const value = typeof detalle === "object" && detalle !== null ? detalle.dieciseisavos : detalle;

  return {
    ...EMPTY_DETALLE_FRACCION,
    ...(typeof detalle === "object" && detalle !== null ? detalle : {}),
    dieciseisavos: toNumber(value),
    // Se conserva el texto durante la edición para permitir decimales como 2.01.
    volumen: typeof detalle === "object" && detalle !== null ? (detalle.volumen ?? 0) : 0,
  };
}

function fractionDetallesFromValues(values, existingDetalles = []) {
  const existingByFraction = new Map(
    (Array.isArray(existingDetalles) ? existingDetalles : []).map((detalle) => {
      const normalized = normalizeFractionDetalle(detalle);
      return [normalized.dieciseisavos, normalized];
    })
  );

  return normalizeFractionValues(values).map((fraction) => ({
    ...EMPTY_DETALLE_FRACCION,
    ...(existingByFraction.get(fraction) ?? {}),
    dieciseisavos: fraction,
  }));
}

function totalSixteenths(detalle) {
  return (
    (toNumber(detalle.pies) * 12 + toNumber(detalle.pulgadas)) * FRACTION_DENOMINATOR +
    toNumber(detalle.dieciseisavos)
  );
}

function sortDetalles(detalles) {
  return [...(Array.isArray(detalles) ? detalles : [])]
    .map(normalizeDetalle)
    .sort((a, b) => totalSixteenths(a) - totalSixteenths(b));
}

function getBaseDetalles(detalles) {
  return sortDetalles(detalles).filter((detalle) => toNumber(detalle.dieciseisavos) === 0);
}

function extractFractions(detalles) {
  const values = sortDetalles(detalles)
    .map((detalle) => toNumber(detalle.dieciseisavos))
    .filter((value) => Number.isInteger(value) && value > 0 && value < FRACTION_DENOMINATOR);

  const unique = Array.from(new Set(values)).sort((a, b) => a - b);
  return unique.length > 0 ? unique : DEFAULT_FRACTIONS;
}

function normalizeFractionValues(values) {
  return Array.from(
    new Set(
      (Array.isArray(values) ? values : [])
        .map((value) => toNumber(value))
        .filter((value) => Number.isInteger(value) && value > 0 && value < FRACTION_DENOMINATOR)
    )
  ).sort((a, b) => a - b);
}

function roundVolume(value) {
  return Math.round((Number(value) + Number.EPSILON) * 10000) / 10000;
}

function calculateFractionDetails(baseDetalles, fractions) {
  const baseRows = getBaseDetalles(baseDetalles);
  const selectedFractions = normalizeFractionValues(fractions);
  const calculated = [];

  for (let index = 0; index < baseRows.length; index++) {
    const current = normalizeDetalle(baseRows[index]);
    const next = baseRows[index + 1] ? normalizeDetalle(baseRows[index + 1]) : null;
    calculated.push(current);

    if (!next) continue;

    const currentWholeInches = totalSixteenths(current) / FRACTION_DENOMINATOR;
    const nextWholeInches = totalSixteenths(next) / FRACTION_DENOMINATOR;
    if (nextWholeInches - currentWholeInches !== 1) continue;

    const volumeDifference = toNumber(next.volumen) - toNumber(current.volumen);
    selectedFractions.forEach((fraction) => {
      calculated.push({
        ...EMPTY_DETALLE,
        pies: current.pies,
        pulgadas: current.pulgadas,
        dieciseisavos: fraction,
        volumen: roundVolume(
          toNumber(current.volumen) + (volumeDifference * fraction) / FRACTION_DENOMINATOR
        ),
      });
    });
  }

  return sortDetalles(calculated);
}

function findNonConsecutiveBaseHeight(baseDetalles) {
  const baseRows = getBaseDetalles(baseDetalles);
  for (let index = 0; index < baseRows.length - 1; index++) {
    const current = baseRows[index];
    const next = baseRows[index + 1];
    const currentWholeInches = totalSixteenths(current) / FRACTION_DENOMINATOR;
    const nextWholeInches = totalSixteenths(next) / FRACTION_DENOMINATOR;

    if (nextWholeInches - currentWholeInches !== 1) {
      return current;
    }
  }

  return null;
}

function missingCalculatedFractions(detalles, fractions) {
  const rows = sortDetalles(detalles);
  const selectedFractions = normalizeFractionValues(fractions);
  if (selectedFractions.length === 0) return false;

  const baseRows = getBaseDetalles(rows);
  const available = new Set(rows.map(buildHeightKey));

  for (let index = 0; index < baseRows.length - 1; index++) {
    const current = baseRows[index];
    const next = baseRows[index + 1];
    const currentWholeInches = totalSixteenths(current) / FRACTION_DENOMINATOR;
    const nextWholeInches = totalSixteenths(next) / FRACTION_DENOMINATOR;
    if (nextWholeInches - currentWholeInches !== 1) return true;

    for (const fraction of selectedFractions) {
      const key = buildHeightKey({ ...current, dieciseisavos: fraction });
      if (!available.has(key)) return true;
    }
  }

  return false;
}

function formatHeight(detalle) {
  const fraction = toNumber(detalle.dieciseisavos);
  const base = `${toNumber(detalle.pies)}' ${toNumber(detalle.pulgadas)}"`;
  return fraction > 0 ? `${base} ${fraction}/${FRACTION_DENOMINATOR}` : base;
}

function CapacidadVolumetricaTanqueFormPage({ mode }) {
  const styles = useCapacidadVolumetricaTanqueActionPageStyles();
  const themeStyles = getCapacidadVolumetricaTanqueActionPageThemeStyles();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { idCapacidadVolumetricaTanque = "", idTanque = "" } = useParams();
  const wizardRef = useRef(null);
  const { values: documento, setValues: setDocumento } = useFormStateAdapter(EMPTY_DOCUMENTO);
  const [tanques, setTanques] = useState([]);
  const [productos, setProductos] = useState([]);
  const [companiasInspeccion, setCompaniasInspeccion] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false);
  const [activeWizardStep, setActiveWizardStep] = useState(FORM_STEP_HEADER);
  const [fracciones16avos, setFracciones16avos] = useState(DEFAULT_FRACTIONS);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [templateLoading, setTemplateLoading] = useState(false);
  const [templateDownloading, setTemplateDownloading] = useState(false);

  const isAdd = mode === "add";
  const isView = mode === "view";
  const isEdit = mode === "edit";
  const isDelete = mode === "delete";
  const canEditFields = isAdd || isEdit;
  const hasTankContext = Boolean(idTanque);
  const adjuntos = Array.isArray(documento.adjuntos) ? documento.adjuntos : [];
  const baseDetalles = useMemo(() => {
    const source =
      Array.isArray(documento.detallesBase) && documento.detallesBase.length > 0
        ? documento.detallesBase
        : documento.detalles;

    return getBaseDetalles(source).map(normalizeBaseDetalle);
  }, [documento.detallesBase, documento.detalles]);
  const calculatedDetalles = useMemo(() => sortDetalles(documento.detalles), [documento.detalles]);
  const fractionDetalles = useMemo(
    () => fractionDetallesFromValues(fracciones16avos, documento.detallesFracciones),
    [fracciones16avos, documento.detallesFracciones]
  );
  const activeWizardStepIndex = Math.max(
    0,
    FORM_STEPS.findIndex((step) => step.key === activeWizardStep)
  );

  useEffect(() => {
    let isMounted = true;

    async function loadOptions() {
      try {
        const [tanqueOptions, productoOptions, companiaInspeccionOptions] = await Promise.all([
          TanqueService.ListarOpcion(),
          ProductoService.ListarOpcion(),
          CompaniaInspeccionService.ListarOpcion(),
        ]);
        if (isMounted) {
          setTanques(Array.isArray(tanqueOptions) ? tanqueOptions : []);
          setProductos(Array.isArray(productoOptions) ? productoOptions : []);
          setCompaniasInspeccion(
            Array.isArray(companiaInspeccionOptions) ? companiaInspeccionOptions : []
          );
        }
      } catch {
        if (isMounted) {
          setTanques([]);
          setProductos([]);
          setCompaniasInspeccion([]);
        }
      }
    }

    loadOptions();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isAdd) {
      return undefined;
    }

    if (!idTanque) {
      setDocumento(EMPTY_DOCUMENTO);
      setActiveWizardStep(FORM_STEP_HEADER);
      setFracciones16avos(DEFAULT_FRACTIONS);
      return undefined;
    }

    let isMounted = true;

    async function loadTanqueSeleccionado() {
      try {
        setLoading(true);
        setError("");
        const tanque = await TanqueService.obtener(idTanque);

        if (isMounted) {
          setDocumento({
            ...EMPTY_DOCUMENTO,
            codTanque: tanque.codTanque,
            idTanque: tanque.idTanque,
            tanque: tanque.tanque,
            codProducto: tanque.codProducto,
            idProducto: tanque.idProducto,
            producto: tanque.producto,
          });
          setActiveWizardStep(FORM_STEP_HEADER);
          setFracciones16avos(DEFAULT_FRACTIONS);
        }
      } catch (loadError) {
        if (isMounted) setError(loadError.message || t("tankLoadError"));
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadTanqueSeleccionado();

    return () => {
      isMounted = false;
    };
  }, [idTanque, isAdd, setDocumento, t]);

  useEffect(() => {
    if (isAdd) {
      return undefined;
    }

    let isMounted = true;

    async function loadDocumento() {
      try {
        setLoading(true);
        setError("");
        const data = await CapacidadVolumetricaTanqueService.obtener(idCapacidadVolumetricaTanque);
        const normalized = normalizeDocumento(data);
        if (isMounted) {
          setDocumento(normalized);
          setFracciones16avos(
            normalizeFractionValues(
              normalized.detallesFracciones.map((detalle) => detalle.dieciseisavos)
            )
          );
          setActiveWizardStep(FORM_STEP_HEADER);
        }
      } catch (loadError) {
        if (isMounted) setError(loadError.message || t("tankCalibrationLoadError"));
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadDocumento();

    return () => {
      isMounted = false;
    };
  }, [idCapacidadVolumetricaTanque, isAdd, setDocumento, t]);

  const updateTextField = (key) => (_, data) => {
    setDocumento((current) => ({
      ...current,
      [key]: data.value,
    }));
  };

  const updateProductField = (_, data) => {
    const codProducto = toNumber(data.value);
    const producto =
      productos.find((option) => String(option.value) === String(codProducto))?.text ?? "";

    setDocumento((current) => ({
      ...current,
      codProducto,
      producto,
    }));
  };

  const updateInspectionCompanyField = (_, data) => {
    const codCompaniaInspeccion = toNumber(data.value);
    const companiaInspeccion =
      companiasInspeccion.find((option) => String(option.value) === String(codCompaniaInspeccion))
        ?.text ?? "";

    setDocumento((current) => ({
      ...current,
      codCompaniaInspeccion,
      companiaInspeccion,
    }));
  };

  const updateBaseDetailNumberField = (index, key) => (_, data) => {
    setDocumento((current) => ({
      ...current,
      ...(() => {
        const detallesBase = getBaseDetalles(
          Array.isArray(current.detallesBase) && current.detallesBase.length > 0
            ? current.detallesBase
            : current.detalles
        ).map((detalle, detailIndex) =>
          detailIndex === index
            ? {
                ...normalizeBaseDetalle(detalle),
                [key]: toNumber(data.value),
              }
            : normalizeBaseDetalle(detalle)
        );

        return {
          detallesBase,
          detalles: detallesBase.map((detalle) => ({ ...EMPTY_DETALLE, ...detalle })),
        };
      })(),
    }));
  };

  const addBaseDetail = () => {
    setDocumento((current) => ({
      ...current,
      detallesBase: [
        ...getBaseDetalles(
          Array.isArray(current.detallesBase) && current.detallesBase.length > 0
            ? current.detallesBase
            : current.detalles
        ).map(normalizeBaseDetalle),
        { ...EMPTY_DETALLE_BASE },
      ],
      detalles: [
        ...getBaseDetalles(
          Array.isArray(current.detallesBase) && current.detallesBase.length > 0
            ? current.detallesBase
            : current.detalles
        ).map((detalle) => ({ ...EMPTY_DETALLE, ...detalle })),
        { ...EMPTY_DETALLE },
      ],
    }));
  };

  const removeBaseDetail = (index) => {
    setDocumento((current) => ({
      ...current,
      ...(() => {
        const detallesBase = getBaseDetalles(
          Array.isArray(current.detallesBase) && current.detallesBase.length > 0
            ? current.detallesBase
            : current.detalles
        )
          .filter((_, detailIndex) => detailIndex !== index)
          .map(normalizeBaseDetalle);

        return {
          detallesBase,
          detalles: detallesBase.map((detalle) => ({ ...EMPTY_DETALLE, ...detalle })),
        };
      })(),
    }));
  };

  const getBackRoute = () => {
    const targetIdTanque = documento.idTanque || idTanque;
    return targetIdTanque
      ? `/capacidadvolumetricatanque/listar/${encodeURIComponent(targetIdTanque)}`
      : "/capacidadvolumetricatanque/listar";
  };

  const back = () => navigate(getBackRoute());

  const goEdit = async () => {
    const response = await validarPermiso({
      ruta: "/capacidadvolumetricatanque/editar",
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

    navigate(
      `/capacidadvolumetricatanque/editar/${encodeURIComponent(idCapacidadVolumetricaTanque)}`
    );
  };

  const buildPayload = () => ({
    ...documento,
    codTanque: toText(documento.codTanque),
    codProducto: toNumber(documento.codProducto),
    codCompaniaInspeccion: toNumber(documento.codCompaniaInspeccion),
    fechaCalibracion: toDateInputValue(documento.fechaCalibracion),
    comentarios: documento.comentarios ?? "",
    adjuntos: adjuntos.map((adjunto) => ({
      codCapacidadVolumetricaTanqueAdjunto: toNumber(adjunto.codCapacidadVolumetricaTanqueAdjunto),
      codCapacidadVolumetricaTanque: toNumber(documento.codCapacidadVolumetricaTanque),
      nombreArchivo: adjunto.nombreArchivo || "",
      tipoContenido: adjunto.tipoContenido || "application/pdf",
      tamanoBytes: toNumber(adjunto.tamanoBytes),
      rutaArchivo: adjunto.rutaArchivo || "",
      contenidoBase64: adjunto.contenidoBase64 || "",
    })),
    detallesBase: baseDetalles.map((detalle) => ({
      codCapacidadVolumetricaTanqueDetalle2: toNumber(
        detalle.codCapacidadVolumetricaTanqueDetalle2
      ),
      codCapacidadVolumetricaTanque: toNumber(documento.codCapacidadVolumetricaTanque),
      pies: toNumber(detalle.pies),
      pulgadas: toNumber(detalle.pulgadas),
      volumen: toNumber(detalle.volumen),
    })),
    detallesFracciones: fractionDetallesFromValues(
      fracciones16avos,
      documento.detallesFracciones
    ).map((detalle) => ({
      codCapacidadVolumetricaTanqueDetalle3: toNumber(
        detalle.codCapacidadVolumetricaTanqueDetalle3
      ),
      codCapacidadVolumetricaTanque: toNumber(documento.codCapacidadVolumetricaTanque),
      dieciseisavos: toNumber(detalle.dieciseisavos),
      volumen: toNumber(detalle.volumen),
    })),
    detalles: sortDetalles(documento.detalles || []).map((detalle) => ({
      ...detalle,
      pies: toNumber(detalle.pies),
      pulgadas: toNumber(detalle.pulgadas),
      dieciseisavos: toNumber(detalle.dieciseisavos),
      volumen: toNumber(detalle.volumen),
    })),
  });

  const save = async () => {
    try {
      setSaving(true);
      setError("");
      setMessage("");

      const payload = buildPayload();
      const validation = setZodValidationError(
        formSchemas.capacidadVolumetricaTanque,
        payload,
        t,
        setError
      );
      if (!validation.ok) {
        moveToStepForValidationError(validation.errorKey);
        return;
      }

      if (hasDuplicateHeights(payload.detalles)) {
        goToWizardStepByKey(FORM_STEP_BASE);
        setError(t("tankCalibrationDuplicateHeight"));
        return;
      }

      if (missingCalculatedFractions(payload.detalles, fracciones16avos)) {
        goToWizardStepByKey(FORM_STEP_CALCULATED);
        setError(t("tankCalibrationCalculateBeforeSave"));
        return;
      }

      if (isAdd) {
        await CapacidadVolumetricaTanqueService.agregar(payload);
        setMessage(t("tankCalibrationAdded"));
        goToWizardStepByKey(FORM_STEP_HEADER);
        setFracciones16avos(DEFAULT_FRACTIONS);
        setDocumento(
          hasTankContext
            ? {
                ...EMPTY_DOCUMENTO,
                codTanque: payload.codTanque,
                idTanque,
                tanque: documento.tanque,
                codProducto: payload.codProducto,
                producto: documento.producto,
                codCompaniaInspeccion: payload.codCompaniaInspeccion,
                idCompaniaInspeccion: documento.idCompaniaInspeccion,
                companiaInspeccion: documento.companiaInspeccion,
              }
            : EMPTY_DOCUMENTO
        );
      }

      if (isEdit) {
        await CapacidadVolumetricaTanqueService.editar(payload);
        setMessage(t("tankCalibrationSaved"));
      }

      if (isDelete) {
        await CapacidadVolumetricaTanqueService.eliminar(payload);
        navigate(getBackRoute());
      }
    } catch (saveError) {
      setError(saveError.message || t("tankCalibrationSaveError"));
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
      setError(t("tankCalibrationAttachmentTypeError"));
      return;
    }

    try {
      setError("");
      const nuevosAdjuntos = await Promise.all(files.map(readFileAsAttachment));
      setDocumento((current) => ({
        ...current,
        adjuntos: [...(Array.isArray(current.adjuntos) ? current.adjuntos : []), ...nuevosAdjuntos],
      }));
    } catch {
      setError(t("tankCalibrationAttachmentReadError"));
    }
  };

  const handleTemplateFile = async (event) => {
    const [file] = Array.from(event.target.files ?? []);
    event.target.value = "";

    if (!file) return;

    try {
      setTemplateLoading(true);
      setError("");
      setMessage("");
      const detalles = await readTankVolumetricCapacityTemplate(file, t);
      const detallesBase = detalles.map(normalizeBaseDetalle);
      setDocumento((current) => ({
        ...current,
        detallesBase,
        detalles: detallesBase.map((detalle) => ({
          ...EMPTY_DETALLE,
          ...detalle,
          dieciseisavos: 0,
        })),
      }));
      goToWizardStepByKey(FORM_STEP_FRACTIONS);
      setMessage(t("tankCalibrationBaseTemplateLoaded", { count: detalles.length }));
    } catch (templateError) {
      setError(templateError.message || t("tankCalibrationTemplateUploadError"));
    } finally {
      setTemplateLoading(false);
    }
  };

  const handleFractionTemplateFile = async (event) => {
    const [file] = Array.from(event.target.files ?? []);
    event.target.value = "";

    if (!file) return;

    try {
      setTemplateLoading(true);
      setError("");
      setMessage("");
      const fractionDetails = await readTankVolumetricCapacityFractionTemplate(file, t);
      const fractions = normalizeFractionValues(
        fractionDetails.map((detalle) => detalle.dieciseisavos)
      );
      setFracciones16avos(fractions);
      setDocumento((current) => ({
        ...current,
        detallesFracciones: fractionDetallesFromValues(fractions, fractionDetails),
        detalles: getBaseDetalles(
          Array.isArray(current.detallesBase) && current.detallesBase.length > 0
            ? current.detallesBase
            : current.detalles
        ).map((detalle) => ({ ...EMPTY_DETALLE, ...detalle })),
      }));
      goToWizardStepByKey(FORM_STEP_CALCULATED);
      setMessage(t("tankCalibrationFractionTemplateLoaded", { count: fractions.length }));
    } catch (templateError) {
      setError(templateError.message || t("tankCalibrationTemplateUploadError"));
    } finally {
      setTemplateLoading(false);
    }
  };

  const downloadBaseTemplate = async () => {
    try {
      setTemplateDownloading(true);
      setError("");
      await downloadTankVolumetricCapacityTemplate(t, documento.tanque);
    } catch (downloadError) {
      setError(downloadError.message || t("tankCalibrationTemplateDownloadError"));
    } finally {
      setTemplateDownloading(false);
    }
  };

  const downloadFractionTemplate = async () => {
    try {
      setTemplateDownloading(true);
      setError("");
      await downloadTankVolumetricCapacityFractionTemplate(t, documento.tanque);
    } catch (downloadError) {
      setError(downloadError.message || t("tankCalibrationTemplateDownloadError"));
    } finally {
      setTemplateDownloading(false);
    }
  };

  const resetCalculatedDetailsWithFractions = (nextFractions) => {
    setDocumento((current) => ({
      ...current,
      detallesFracciones: fractionDetallesFromValues(nextFractions, current.detallesFracciones),
      detalles: getBaseDetalles(
        Array.isArray(current.detallesBase) && current.detallesBase.length > 0
          ? current.detallesBase
          : current.detalles
      ).map((detalle) => ({ ...EMPTY_DETALLE, ...detalle })),
    }));
  };

  const addFraction = () => {
    const used = new Set(normalizeFractionValues(fracciones16avos));
    const nextValue = DEFAULT_FRACTIONS.find((fraction) => !used.has(fraction));
    const nextFractions = nextValue
      ? normalizeFractionValues([...fracciones16avos, nextValue])
      : fracciones16avos;
    setFracciones16avos(nextFractions);
    resetCalculatedDetailsWithFractions(nextFractions);
  };

  const updateFractionVolume = (fraction) => (_, data) => {
    setDocumento((current) => ({
      ...current,
      detallesFracciones: fractionDetallesFromValues(
        fracciones16avos,
        current.detallesFracciones
      ).map((detalle) =>
        detalle.dieciseisavos === fraction ? { ...detalle, volumen: data.value } : detalle
      ),
    }));
  };

  const removeFraction = (index) => {
    const nextFractions = normalizeFractionValues(
      fracciones16avos.filter((_, itemIndex) => itemIndex !== index)
    );
    setFracciones16avos(nextFractions);
    resetCalculatedDetailsWithFractions(nextFractions);
  };

  const useDefaultFractions = () => {
    setFracciones16avos(DEFAULT_FRACTIONS);
    setDocumento((current) => ({
      ...current,
      detallesFracciones: fractionDetallesFromValues(DEFAULT_FRACTIONS, current.detallesFracciones),
      detalles: getBaseDetalles(
        Array.isArray(current.detallesBase) && current.detallesBase.length > 0
          ? current.detallesBase
          : current.detalles
      ).map((detalle) => ({ ...EMPTY_DETALLE, ...detalle })),
    }));
  };

  const validateHeaderStep = () => {
    setError("");
    const validation = setZodValidationError(
      formSchemas.capacidadVolumetricaTanque.pick(HEADER_VALIDATION_FIELDS),
      buildPayload(),
      t,
      setError
    );

    if (!validation.ok) {
      goToWizardStepByKey(FORM_STEP_HEADER);
    }

    return validation.ok;
  };

  const validateBaseStep = () => {
    setError("");

    if (baseDetalles.length < 2) {
      setError(t("tankCalibrationBaseRowsRequired"));
      goToWizardStepByKey(FORM_STEP_BASE);
      return false;
    }

    if (hasDuplicateHeights(baseDetalles.map((detalle) => ({ ...detalle, dieciseisavos: 0 })))) {
      setError(t("tankCalibrationDuplicateHeight"));
      goToWizardStepByKey(FORM_STEP_BASE);
      return false;
    }

    const invalidBaseDetail = baseDetalles.find(
      (detalle) =>
        !Number.isInteger(toNumber(detalle.pies)) ||
        !Number.isInteger(toNumber(detalle.pulgadas)) ||
        toNumber(detalle.pies) < 0 ||
        toNumber(detalle.pulgadas) < 0 ||
        toNumber(detalle.pulgadas) > 11 ||
        toNumber(detalle.volumen) <= 0
    );

    if (invalidBaseDetail) {
      setError(t("tankCalibrationBaseStepInvalid"));
      goToWizardStepByKey(FORM_STEP_BASE);
      return false;
    }

    const invalidInterval = findNonConsecutiveBaseHeight(baseDetalles);
    if (invalidInterval) {
      setError(
        t("tankCalibrationBaseConsecutiveRequired", { height: formatHeight(invalidInterval) })
      );
      goToWizardStepByKey(FORM_STEP_BASE);
      return false;
    }

    return true;
  };

  const validateFractionStep = () => {
    setError("");
    const fractions = normalizeFractionValues(fracciones16avos);
    if (fractions.length === 0) {
      setError(t("tankCalibrationFractionRequired"));
      goToWizardStepByKey(FORM_STEP_FRACTIONS);
      return false;
    }

    if (
      fractions.some(
        (fraction) =>
          !Number.isInteger(fraction) || fraction <= 0 || fraction >= FRACTION_DENOMINATOR
      )
    ) {
      setError(t("tankCalibrationFractionStepInvalid"));
      goToWizardStepByKey(FORM_STEP_FRACTIONS);
      return false;
    }

    if (fractionDetalles.some((detalle) => toNumber(detalle.volumen) <= 0)) {
      setError(t("tankCalibrationFractionVolumeRequired"));
      goToWizardStepByKey(FORM_STEP_FRACTIONS);
      return false;
    }

    return true;
  };

  const validateCalculatedStep = () => {
    setError("");

    if (hasDuplicateHeights(calculatedDetalles)) {
      setError(t("tankCalibrationDuplicateHeight"));
      goToWizardStepByKey(FORM_STEP_CALCULATED);
      return false;
    }

    if (missingCalculatedFractions(calculatedDetalles, fracciones16avos)) {
      setError(t("tankCalibrationCalculateBeforeSave"));
      goToWizardStepByKey(FORM_STEP_CALCULATED);
      return false;
    }

    return true;
  };

  const validateAttachmentStep = () => {
    setError("");
    const validation = setZodValidationError(
      formSchemas.capacidadVolumetricaTanque.pick(ATTACHMENT_VALIDATION_FIELDS),
      buildPayload(),
      t,
      setError
    );

    if (!validation.ok) {
      goToWizardStepByKey(FORM_STEP_FILES);
    }

    return validation.ok;
  };

  const calculateVolumes = () => {
    setError("");
    setMessage("");

    if (!validateBaseStep() || !validateFractionStep()) {
      return false;
    }

    const fractions = normalizeFractionValues(fracciones16avos);
    const detallesCalculados = calculateFractionDetails(baseDetalles, fractions);
    setDocumento((current) => ({
      ...current,
      detallesBase: baseDetalles,
      detallesFracciones: fractionDetallesFromValues(fractions, current.detallesFracciones),
      detalles: detallesCalculados,
    }));
    goToWizardStepByKey(FORM_STEP_CALCULATED);
    setMessage(t("tankCalibrationVolumesCalculated", { count: detallesCalculados.length }));
    return true;
  };

  const goToWizardStep = (index) => {
    const nextIndex = Math.max(0, Math.min(index, FORM_STEPS.length - 1));
    setActiveWizardStep(FORM_STEPS[nextIndex]?.key ?? FORM_STEP_HEADER);
    wizardRef.current?.goToTab(nextIndex);
  };

  const goToWizardStepByKey = (stepKey) => {
    const index = FORM_STEPS.findIndex((step) => step.key === stepKey);
    goToWizardStep(index === -1 ? 0 : index);
  };

  const moveToStepForValidationError = (errorKey) => {
    if (HEADER_ERROR_KEYS.has(errorKey)) {
      goToWizardStepByKey(FORM_STEP_HEADER);
      return;
    }

    if (String(errorKey || "").startsWith("tankCalibrationAttachment")) {
      goToWizardStepByKey(FORM_STEP_FILES);
      return;
    }

    goToWizardStepByKey(FORM_STEP_CALCULATED);
  };

  const goNextWizardStep = () => {
    setMessage("");

    if (!canEditFields) {
      goToWizardStep(activeWizardStepIndex + 1);
      return;
    }

    if (activeWizardStep === FORM_STEP_HEADER && validateHeaderStep()) {
      goToWizardStep(activeWizardStepIndex + 1);
      return;
    }

    if (activeWizardStep === FORM_STEP_BASE && validateBaseStep()) {
      goToWizardStep(activeWizardStepIndex + 1);
      return;
    }

    if (activeWizardStep === FORM_STEP_FRACTIONS) {
      if (calculateVolumes()) {
        goToWizardStep(activeWizardStepIndex + 1);
      }
      return;
    }

    if (activeWizardStep === FORM_STEP_CALCULATED && validateCalculatedStep()) {
      goToWizardStep(activeWizardStepIndex + 1);
    }
  };

  const goPreviousWizardStep = () => {
    setError("");
    setMessage("");
    goToWizardStep(activeWizardStepIndex - 1);
  };

  const handleWizardTabChange = useCallback(({ nextIndex }) => {
    setActiveWizardStep(FORM_STEPS[nextIndex]?.key ?? FORM_STEP_HEADER);
  }, []);

  const removeAttachment = (index) => {
    setDocumento((current) => ({
      ...current,
      adjuntos: (Array.isArray(current.adjuntos) ? current.adjuntos : []).filter(
        (_, adjuntoIndex) => adjuntoIndex !== index
      ),
    }));
  };

  const openAttachment = async (adjunto) => {
    try {
      setError("");
      const blob = await CapacidadVolumetricaTanqueService.archivo(
        idCapacidadVolumetricaTanque || documento.idCapacidadVolumetricaTanque,
        adjunto.codCapacidadVolumetricaTanqueAdjunto
      );
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (downloadError) {
      setError(downloadError.message || t("tankCalibrationAttachmentDownloadError"));
    }
  };

  const titleKeyByMode = {
    add: "tankCalibrationAddTitle",
    view: "tankCalibrationViewTitle",
    edit: "tankCalibrationEditTitle",
    delete: "tankCalibrationDeleteTitle",
  };

  const documentoLabel = `${documento.tanque || ""} ${documento.producto || ""} ${toDateInputValue(documento.fechaCalibracion)}`;

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
            <Spinner label={t("loadingTankCalibration")} />
          </div>
        ) : (
          <>
            {isDelete ? (
              <MessageBar intent="warning">
                {t("deleteTankCalibrationConfirmation", { calibration: documentoLabel })}
              </MessageBar>
            ) : null}

            <FormWizard
              ref={wizardRef}
              shape="circle"
              color="var(--app-primary, #2563eb)"
              stepSize="sm"
              startIndex={activeWizardStepIndex}
              disableBackOnClickStep
              nextButtonText={t("tankCalibrationNextStep")}
              backButtonText={t("tankCalibrationPreviousStep")}
              finishButtonText={isAdd ? t("add") : t("save")}
              onTabChange={handleWizardTabChange}
              nextButtonTemplate={() => (
                <div className="wizard-footer-right">
                  <ListActionButton
                    action="editar"
                    label={t("tankCalibrationNextStep")}
                    text={t("tankCalibrationNextStep")}
                    disabled={saving}
                    onClick={goNextWizardStep}
                  />
                </div>
              )}
              backButtonTemplate={() => (
                <div className="wizard-footer-left">
                  <ListActionButton
                    action="regresar"
                    label={t("tankCalibrationPreviousStep")}
                    text={t("tankCalibrationPreviousStep")}
                    disabled={saving}
                    onClick={goPreviousWizardStep}
                  />
                </div>
              )}
              finishButtonTemplate={() => (
                <div className="wizard-footer-right">
                  {isView ? (
                    <ListActionButton
                      action="editar"
                      label={t("edit")}
                      text={t("edit")}
                      onClick={goEdit}
                    />
                  ) : null}
                  {canEditFields ? (
                    <ListActionButton
                      action={isAdd ? "agregar" : "editar"}
                      label={isAdd ? t("add") : t("save")}
                      text={saving ? t("saving") : isAdd ? t("add") : t("save")}
                      disabled={saving}
                      onClick={() => {
                        if (validateAttachmentStep()) save();
                      }}
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
              )}
            >
              <FormWizard.TabContent
                id={FORM_STEP_HEADER}
                title={t("tankCalibrationStepHeader")}
                isValid={false}
                showErrorOnTab={false}
              >
                <div className={styles.formGrid}>
                  {!isAdd ? (
                    <Field label={t("tankCalibrationCode")}>
                      <Input
                        value={String(documento.codCapacidadVolumetricaTanque ?? "")}
                        disabled
                      />
                    </Field>
                  ) : null}
                  <Field label={t("tankCalibrationTank")} required={canEditFields}>
                    {hasTankContext ? (
                      <Input value={documento.tanque || ""} disabled />
                    ) : (
                      <Select
                        value={String(documento.codTanque || "")}
                        disabled={!canEditFields}
                        onChange={updateTextField("codTanque")}
                      >
                        <option value="">{t("selectOption")}</option>
                        {tanques.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.text}
                          </option>
                        ))}
                      </Select>
                    )}
                  </Field>
                  <Field label={t("tankCalibrationProduct")} required={canEditFields}>
                    <Select
                      value={String(documento.codProducto || "")}
                      disabled={!canEditFields}
                      onChange={updateProductField}
                    >
                      <option value="">{t("selectOption")}</option>
                      {productos.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.text}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label={t("tankCalibrationInspectionCompany")} required={canEditFields}>
                    <Select
                      value={String(documento.codCompaniaInspeccion || "")}
                      disabled={!canEditFields}
                      onChange={updateInspectionCompanyField}
                    >
                      <option value="">{t("selectOption")}</option>
                      {companiasInspeccion.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.text}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label={t("tankCalibrationDate")} required={canEditFields}>
                    <LocalizedDateInput
                      value={toDateInputValue(documento.fechaCalibracion)}
                      disabled={!canEditFields}
                      onChange={updateTextField("fechaCalibracion")}
                    />
                  </Field>
                  {!isAdd ? (
                    <Field label={t("tankCalibrationCurrent")}>
                      <Input value={documento.esActual ? t("yes") : t("no")} disabled />
                    </Field>
                  ) : null}
                  <Field label={t("tankCalibrationComments")}>
                    <Textarea
                      value={documento.comentarios ?? ""}
                      disabled={!canEditFields}
                      onChange={updateTextField("comentarios")}
                      rows={3}
                    />
                  </Field>
                </div>
              </FormWizard.TabContent>

              <FormWizard.TabContent
                id={FORM_STEP_BASE}
                title={t("tankCalibrationStepBase")}
                isValid={false}
                showErrorOnTab={false}
              >
                {canEditFields ? (
                  <div style={detailActionsStyle}>
                    <ListActionButton
                      action="descargar"
                      label={t("tankCalibrationDownloadBaseTemplate")}
                      text={t("tankCalibrationDownloadBaseTemplate")}
                      disabled={templateDownloading || saving}
                      onClick={downloadBaseTemplate}
                    />
                    <label className={styles.fileSelector}>
                      <input
                        type="file"
                        accept={TANK_VOLUMETRIC_CAPACITY_TEMPLATE_ACCEPT}
                        disabled={templateLoading || saving}
                        className={styles.hiddenFileInput}
                        aria-label={t("tankCalibrationUploadBaseTemplate")}
                        onChange={handleTemplateFile}
                      />
                      <span className={styles.fileSelectorButton}>
                        {templateLoading
                          ? t("tankCalibrationTemplateUploading")
                          : t("tankCalibrationUploadBaseTemplate")}
                      </span>
                    </label>
                    <ListActionButton
                      action="agregar"
                      label={t("tankCalibrationAddBaseRow")}
                      text={t("tankCalibrationAddBaseRow")}
                      onClick={addBaseDetail}
                    />
                  </div>
                ) : null}

                {baseDetalles.map((detalle, index) => (
                  <div key={`base-${index}-${buildHeightKey(detalle)}`} style={detailGridStyle}>
                    <Field label={t("tankCalibrationHeightFeet")}>
                      <Input
                        type="number"
                        value={String(detalle.pies ?? 0)}
                        disabled={!canEditFields}
                        onChange={updateBaseDetailNumberField(index, "pies")}
                      />
                    </Field>
                    <Field label={t("tankCalibrationHeightInches")}>
                      <Input
                        type="number"
                        value={String(detalle.pulgadas ?? 0)}
                        disabled={!canEditFields}
                        onChange={updateBaseDetailNumberField(index, "pulgadas")}
                      />
                    </Field>
                    <Field label={t("tankCalibrationVolume")} required={canEditFields}>
                      <Input
                        type="number"
                        value={String(detalle.volumen ?? 0)}
                        disabled={!canEditFields}
                        onChange={updateBaseDetailNumberField(index, "volumen")}
                      />
                    </Field>
                    {canEditFields ? (
                      <ListActionButton
                        action="eliminar"
                        label={t("delete")}
                        disabled={baseDetalles.length <= 1}
                        onClick={() => removeBaseDetail(index)}
                      />
                    ) : null}
                  </div>
                ))}
              </FormWizard.TabContent>

              <FormWizard.TabContent
                id={FORM_STEP_FRACTIONS}
                title={t("tankCalibrationStepFractions")}
                isValid={false}
                showErrorOnTab={false}
              >
                {canEditFields ? (
                  <div style={detailActionsStyle}>
                    <ListActionButton
                      action="descargar"
                      label={t("tankCalibrationDownloadFractionTemplate")}
                      text={t("tankCalibrationDownloadFractionTemplate")}
                      disabled={templateDownloading || saving}
                      onClick={downloadFractionTemplate}
                    />
                    <label className={styles.fileSelector}>
                      <input
                        type="file"
                        accept={TANK_VOLUMETRIC_CAPACITY_TEMPLATE_ACCEPT}
                        disabled={templateLoading || saving}
                        className={styles.hiddenFileInput}
                        aria-label={t("tankCalibrationUploadFractionTemplate")}
                        onChange={handleFractionTemplateFile}
                      />
                      <span className={styles.fileSelectorButton}>
                        {templateLoading
                          ? t("tankCalibrationTemplateUploading")
                          : t("tankCalibrationUploadFractionTemplate")}
                      </span>
                    </label>
                    <ListActionButton
                      action="editar"
                      label={t("tankCalibrationUseDefaultFractions")}
                      text={t("tankCalibrationUseDefaultFractions")}
                      onClick={useDefaultFractions}
                    />
                    <ListActionButton
                      action="agregar"
                      label={t("tankCalibrationAddFraction")}
                      text={t("tankCalibrationAddFraction")}
                      onClick={addFraction}
                    />
                  </div>
                ) : null}

                {fractionDetalles.map((detalle, index) => (
                  <div
                    key={`fraction-${detalle.dieciseisavos}-${index}`}
                    style={fractionDetailGridStyle}
                  >
                    <Field label={t("tankCalibrationHeightFractionNumerator")}>
                      <Input type="number" value={String(detalle.dieciseisavos)} disabled />
                    </Field>
                    <Field label={t("tankCalibrationHeightFractionDenominator")}>
                      <Input value={String(FRACTION_DENOMINATOR)} disabled />
                    </Field>
                    <Field label={t("tankCalibrationVolume")} required={canEditFields}>
                      <Input
                        type="text"
                        inputMode="decimal"
                        value={String(detalle.volumen ?? 0)}
                        disabled={!canEditFields}
                        onChange={updateFractionVolume(detalle.dieciseisavos)}
                      />
                    </Field>
                    {canEditFields ? (
                      <Field label={t("delete")}>
                        <div style={fractionActionStyle}>
                          <ListActionButton
                            action="eliminar"
                            label={t("delete")}
                            disabled={fracciones16avos.length <= 1}
                            onClick={() => removeFraction(index)}
                          />
                        </div>
                      </Field>
                    ) : null}
                  </div>
                ))}
              </FormWizard.TabContent>

              <FormWizard.TabContent
                id={FORM_STEP_CALCULATED}
                title={t("tankCalibrationStepCalculated")}
                isValid={false}
                showErrorOnTab={false}
              >
                <div style={detailSummaryStyle}>
                  <div style={detailSummaryItemStyle}>
                    <Text style={detailSummaryLabelStyle}>{t("tankCalibrationBaseRows")}</Text>
                    <Text weight="semibold">{baseDetalles.length}</Text>
                  </div>
                  <div style={detailSummaryItemStyle}>
                    <Text style={detailSummaryLabelStyle}>{t("tankCalibrationFractions")}</Text>
                    <Text weight="semibold">{fracciones16avos.length}</Text>
                  </div>
                  <div style={detailSummaryItemStyle}>
                    <Text style={detailSummaryLabelStyle}>
                      {t("tankCalibrationCalculatedRows")}
                    </Text>
                    <Text weight="semibold">{calculatedDetalles.length}</Text>
                  </div>
                </div>

                {canEditFields ? (
                  <div style={detailActionsStyle}>
                    <ListActionButton
                      action="editar"
                      label={t("tankCalibrationCalculateVolumes")}
                      text={t("tankCalibrationCalculateVolumes")}
                      disabled={saving}
                      onClick={calculateVolumes}
                    />
                  </div>
                ) : null}

                {calculatedDetalles.map((detalle, index) => (
                  <div
                    key={`calculated-${index}-${buildHeightKey(detalle)}`}
                    style={detailGridStyle}
                  >
                    <Field label={t("tankCalibrationHeight")}>
                      <Input value={formatHeight(detalle)} disabled />
                    </Field>
                    <Field label={t("tankCalibrationHeightFractionNumerator")}>
                      <Input value={String(detalle.dieciseisavos ?? 0)} disabled />
                    </Field>
                    <Field label={t("tankCalibrationVolume")}>
                      <Input value={String(detalle.volumen ?? 0)} disabled />
                    </Field>
                  </div>
                ))}
              </FormWizard.TabContent>

              <FormWizard.TabContent
                id={FORM_STEP_FILES}
                title={t("tankCalibrationStepFiles")}
                isValid={false}
                showErrorOnTab={false}
              >
                <div className={styles.filePanel}>
                  {canEditFields ? (
                    <Field label={t("tankCalibrationAttachmentAdd")}>
                      <label className={styles.fileSelector}>
                        <input
                          type="file"
                          multiple
                          accept=".pdf,.jpg,.jpeg,.png"
                          disabled={!canEditFields}
                          className={styles.hiddenFileInput}
                          aria-label={t("tankCalibrationAttachmentSelectFiles")}
                          onChange={handleAttachmentFiles}
                        />
                        <span className={styles.fileSelectorButton}>
                          {t("tankCalibrationAttachmentSelectFiles")}
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
                          <Field label={t("tankCalibrationAttachmentName")}>
                            <Input value={adjunto.nombreArchivo ?? ""} disabled />
                          </Field>
                          <Field label={t("tankCalibrationAttachmentType")}>
                            <Input value={adjunto.tipoContenido ?? ""} disabled />
                          </Field>
                          <Field label={t("tankCalibrationAttachmentSize")}>
                            <Input value={formatFileSize(adjunto.tamanoBytes)} disabled />
                          </Field>
                          <div className={styles.attachmentActions}>
                            {adjunto.codCapacidadVolumetricaTanqueAdjunto ? (
                              <ListActionButton
                                action="descargar"
                                label={t("tankCalibrationAttachmentOpen")}
                                text={t("tankCalibrationAttachmentOpen")}
                                disabled={saving}
                                onClick={() => openAttachment(adjunto)}
                              />
                            ) : null}
                            {canEditFields ? (
                              <ListActionButton
                                action="eliminar"
                                label={t("tankCalibrationAttachmentRemove")}
                                text={t("tankCalibrationAttachmentRemove")}
                                disabled={saving}
                                onClick={() => removeAttachment(index)}
                              />
                            ) : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <Text>{t("tankCalibrationNoAttachments")}</Text>
                  )}
                </div>
              </FormWizard.TabContent>
            </FormWizard>
          </>
        )}
      </div>

      <Dialog open={openDeleteConfirm} onOpenChange={(_, data) => setOpenDeleteConfirm(data.open)}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>{t("confirmDelete")}</DialogTitle>
            <DialogContent>
              {t("deleteTankCalibrationConfirmation", { calibration: documentoLabel })}
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

export default CapacidadVolumetricaTanqueFormPage;
