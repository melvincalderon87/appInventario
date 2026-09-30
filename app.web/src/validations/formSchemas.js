import { z } from "zod";
import {
  requiredNonNegativeNumber,
  requiredPositiveNumber,
  requiredShortString,
  requiredString,
  toFiniteNumber,
} from "./zodValidation";

function detailsSchema(detailShape, requiredMessage) {
  return z.preprocess(
    (value) => (Array.isArray(value) ? value : []),
    z.array(z.object(detailShape)).min(1, { message: requiredMessage })
  );
}

function templateNumber(value) {
  if (value === null || value === undefined || String(value).trim() === "") {
    return Number.NaN;
  }

  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : Number.NaN;
}

function requiredTemplateNonNegativeNumber(message) {
  return z.any().refine(
    (value) => {
      const numericValue = templateNumber(value);
      return Number.isFinite(numericValue) && numericValue >= 0;
    },
    { message }
  );
}

function requiredTemplatePositiveNumber(message) {
  return z.any().refine(
    (value) => {
      const numericValue = templateNumber(value);
      return Number.isFinite(numericValue) && numericValue > 0;
    },
    { message }
  );
}

function requiredMaxString(requiredMessage, maxLengthMessage, maxLength) {
  return requiredString(requiredMessage).refine(
    (value) => String(value ?? "").length <= maxLength,
    { message: maxLengthMessage }
  );
}

function optionalMaxString(maxLengthMessage, maxLength) {
  return z.any().refine((value) => String(value ?? "").length <= maxLength, {
    message: maxLengthMessage,
  });
}

const tankTypeValues = ["Flotante Externo", "Conico fijo", "Flotante Interno", "Horizontal"];

const tankRoofPositionValues = ["Baja", "Alta", "No aplica"];
const meterTypeValues = ["Turbina", "Desplazamiento Positivo", "Modelo Genesis"];
const colorantMovementIngresoValues = ["INGRESO", "AJUSTE"];
const colorantMovementSalidaValues = ["SALIDA", "INYECTAR_MANIFOLD", "PRESTAMO"];
const colorantMovementAllValues = [
  ...colorantMovementIngresoValues,
  ...colorantMovementSalidaValues,
];
const productTypeValues = ["Base", "Aditivo", "Etanol"];

function normalizeColorantMovement(value) {
  return String(value ?? "")
    .trim()
    .toUpperCase();
}

function isColorantSalidaMovimiento(value) {
  return colorantMovementSalidaValues.includes(normalizeColorantMovement(value));
}

function isColorantMovimientoValido(value) {
  return colorantMovementAllValues.includes(normalizeColorantMovement(value));
}

function requiredFiniteNumber(message) {
  return z.any().refine((value) => Number.isFinite(Number(value)), { message });
}

function requiredEmail(requiredMessage, invalidMessage, maxLengthMessage, maxLength = 150) {
  return requiredMaxString(requiredMessage, maxLengthMessage, maxLength).refine(
    (value) => {
      const email = String(value ?? "").trim();
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(email);
    },
    { message: invalidMessage }
  );
}

function hasValue(value) {
  return String(value ?? "").trim().length > 0;
}

function htmlHasText(value) {
  const text = String(value ?? "")
    .replace(/<[^>]*>/gu, " ")
    .replace(/&nbsp;/giu, " ")
    .replace(/\s+/gu, " ")
    .trim();

  return text.length > 0;
}

function normalizeEmailProvider(value) {
  const provider = String(value ?? "").trim();
  if (provider === "Office365" || provider === "Gmail") return provider;
  return "SMTP";
}

function isOAuthEmailProvider(value) {
  return normalizeEmailProvider(value) !== "SMTP";
}

export const formSchemas = {
  aditivoEntrada: z.object({
    fecha: requiredString("additiveDateRequired"),
    codSuplidor: requiredPositiveNumber("additivePartnerRequired"),
    codProducto: requiredPositiveNumber("additiveProductRequired"),
    codTanque: requiredMaxString("additiveTankRequired", "tankCodeMaxLength", 20),
    cantidad: requiredPositiveNumber("additiveQuantityInvalid"),
    comentario: optionalMaxString("additiveCommentMaxLength", 250),
  }),
  aditivoSalida: z.object({
    codProducto: requiredPositiveNumber("additiveProductRequired"),
    codTanque: requiredMaxString("additiveTankRequired", "tankCodeMaxLength", 20),
    cantidad: requiredPositiveNumber("additiveQuantityInvalid"),
    comentario: optionalMaxString("additiveCommentMaxLength", 250),
  }),
  bahia: z.object({
    codBahia: requiredMaxString("bayCodeRequired", "bayCodeMaxLength", 20),
    bahia: requiredString("bayNameRequired"),
    descripcionCorta: requiredShortString(
      "bayShortDescriptionRequired",
      "bayShortDescriptionMaxLength"
    ),
    cantidadBrazos: requiredNonNegativeNumber("bayQuantityInvalid"),
    cantidadAditivos: requiredNonNegativeNumber("bayQuantityInvalid"),
    cantidadEtanol: requiredNonNegativeNumber("bayQuantityInvalid"),
    multiload: optionalMaxString("bayMultiloadMaxLength", 100),
    comentario: optionalMaxString("bayCommentMaxLength", 250),
    estatus: z.any().optional(),
    adjuntos: z.preprocess(
      (value) => (Array.isArray(value) ? value : []),
      z
        .array(
          z.object({
            nombreArchivo: requiredMaxString(
              "bayAttachmentNameRequired",
              "bayAttachmentNameMaxLength",
              260
            ),
            tipoContenido: optionalMaxString("bayAttachmentTypeMaxLength", 150),
            rutaArchivo: z.any().optional(),
            contenidoBase64: z.any().optional(),
            tamanoBytes: z.any().refine(
              (value) => {
                const numericValue = toFiniteNumber(value);
                return Number.isFinite(numericValue) && numericValue <= 10 * 1024 * 1024;
              },
              { message: "bayAttachmentSizeMaxLength" }
            ),
          })
        )
        .max(10, { message: "bayAttachmentMaxCount" })
    ),
  }),
  barco: z.object({
    barco: requiredString("shipNameRequired"),
    fechaPrevista: requiredString("shipExpectedDateRequired"),
    detalles: detailsSchema(
      {
        codSuplidor: requiredPositiveNumber("shipDetailPartnerRequired"),
        codProducto: requiredPositiveNumber("shipDetailProductRequired"),
        cantidad: requiredPositiveNumber("shipDetailQuantityInvalid"),
      },
      "shipDetailRequired"
    ),
  }),
  barcoIngreso: z.object({
    codBarco: requiredPositiveNumber("shipEntryShipRequired"),
    fechaIngreso: requiredString("shipEntryDateRequired"),
    codigoInterno: requiredString("shipEntryInternalCodeRequired"),
    detalles: detailsSchema(
      {
        codSuplidor: requiredPositiveNumber("shipEntryDetailPartnerRequired"),
        codProducto: requiredPositiveNumber("shipEntryDetailProductRequired"),
        cantidadEstandar: requiredPositiveNumber("shipEntryStandardQuantityInvalid"),
      },
      "shipEntryDetailRequired"
    ),
  }),
  barcoIngresoTuberias: z.object({
    fecha: requiredString("pipelineEntryDateRequired"),
    codBarco: requiredPositiveNumber("pipelineEntryShipRequired"),
    codSuplidor: requiredPositiveNumber("pipelineEntryPartnerRequired"),
    codProducto: requiredPositiveNumber("pipelineEntryProductRequired"),
    cantidadEstandar: requiredPositiveNumber("pipelineEntryStandardQuantityInvalid"),
    cantidadAmbiente: requiredPositiveNumber("pipelineEntryAmbientQuantityInvalid"),
  }),
  companiaInspeccion: z.object({
    nombreComercial: requiredMaxString(
      "inspectionCompanyCommercialNameRequired",
      "inspectionCompanyCommercialNameMaxLength",
      200
    ),
    nombreFiscal: requiredMaxString(
      "inspectionCompanyFiscalNameRequired",
      "inspectionCompanyFiscalNameMaxLength",
      250
    ),
    nit: requiredMaxString("inspectionCompanyNitRequired", "inspectionCompanyNitMaxLength", 50),
    estatus: z.any().optional(),
    adjuntos: z.preprocess(
      (value) => (Array.isArray(value) ? value : []),
      z
        .array(
          z.object({
            nombreArchivo: requiredMaxString(
              "inspectionCompanyAttachmentNameRequired",
              "inspectionCompanyAttachmentNameMaxLength",
              260
            ),
            tipoContenido: optionalMaxString("inspectionCompanyAttachmentTypeMaxLength", 150),
            rutaArchivo: z.any().optional(),
            contenidoBase64: z.any().optional(),
            tamanoBytes: z.any().refine(
              (value) => {
                const numericValue = toFiniteNumber(value);
                return Number.isFinite(numericValue) && numericValue <= 10 * 1024 * 1024;
              },
              { message: "inspectionCompanyAttachmentSizeMaxLength" }
            ),
          })
        )
        .max(10, { message: "inspectionCompanyAttachmentMaxCount" })
    ),
  }),
  brazo: z.object({
    codBrazo: requiredMaxString("armCodeRequired", "armCodeMaxLength", 20),
    codBahia: requiredMaxString("armBayRequired", "bayCodeMaxLength", 20),
    codProducto: requiredPositiveNumber("armProductRequired"),
    brazo: requiredString("armNameRequired"),
    comentario: optionalMaxString("armCommentMaxLength", 250),
    estatus: z.any().optional(),
    adjuntos: z.preprocess(
      (value) => (Array.isArray(value) ? value : []),
      z
        .array(
          z.object({
            nombreArchivo: requiredMaxString(
              "armAttachmentNameRequired",
              "armAttachmentNameMaxLength",
              260
            ),
            tipoContenido: optionalMaxString("armAttachmentTypeMaxLength", 150),
            rutaArchivo: z.any().optional(),
            contenidoBase64: z.any().optional(),
            tamanoBytes: z.any().refine(
              (value) => {
                const numericValue = toFiniteNumber(value);
                return Number.isFinite(numericValue) && numericValue <= 10 * 1024 * 1024;
              },
              { message: "armAttachmentSizeMaxLength" }
            ),
          })
        )
        .max(10, { message: "armAttachmentMaxCount" })
    ),
  }),
  calibracionAditivo: z.object({
    fecha: requiredString("additiveCalibrationDateRequired"),
    codBahia: requiredMaxString("additiveCalibrationBayRequired", "bayCodeMaxLength", 20),
    codProducto: requiredPositiveNumber("additiveCalibrationProductRequired"),
    codPersonal: requiredPositiveNumber("additiveCalibrationTechnicianRequired"),
    codCompaniaInspeccion: requiredPositiveNumber("additiveCalibrationInspectionCompanyRequired"),
    fechaCalibracion: requiredString("additiveCalibrationCalibrationDateRequired"),
  }),
  calibracionEtanol: z.object({
    fecha: requiredString("ethanolCalibrationDateRequired"),
    codBahia: requiredMaxString("ethanolCalibrationBayRequired", "bayCodeMaxLength", 20),
    codBrazo: requiredMaxString("ethanolCalibrationArmRequired", "armCodeMaxLength", 20),
    codProducto: requiredPositiveNumber("ethanolCalibrationProductRequired"),
    codPersonal: requiredPositiveNumber("ethanolCalibrationTechnicianRequired"),
    codCompaniaInspeccion: requiredPositiveNumber("ethanolCalibrationInspectionCompanyRequired"),
    cantidadCalibracion: requiredPositiveNumber("ethanolCalibrationQuantityInvalid"),
    comentarios: optionalMaxString("ethanolCalibrationCommentsMaxLength", 1000),
  }),
  calibracionCombustible: z.object({
    fecha: requiredString("armCalibrationDateRequired"),
    codBahia: requiredMaxString("armCalibrationBayRequired", "bayCodeMaxLength", 20),
    codBrazo: requiredMaxString("armCalibrationArmRequired", "armCodeMaxLength", 20),
    codProducto: requiredPositiveNumber("armCalibrationProductRequired"),
    codPersonal: requiredPositiveNumber("armCalibrationTechnicianRequired"),
    codCompaniaInspeccion: requiredPositiveNumber("armCalibrationInspectionCompanyRequired"),
    cantidadCalibracion: requiredPositiveNumber("armCalibrationQuantityInvalid"),
    comentarios: optionalMaxString("armCalibrationCommentsMaxLength", 1000),
  }),
  capacidadVolumetricaTanque: z.object({
    codTanque: requiredMaxString("tankCalibrationTankRequired", "tankCodeMaxLength", 20),
    codProducto: requiredPositiveNumber("tankCalibrationProductRequired"),
    codCompaniaInspeccion: requiredPositiveNumber("tankCalibrationInspectionCompanyRequired"),
    fechaCalibracion: requiredString("tankCalibrationDateRequired"),
    comentarios: optionalMaxString("tankCalibrationCommentsMaxLength", 1000),
    adjuntos: z.preprocess(
      (value) => (Array.isArray(value) ? value : []),
      z
        .array(
          z.object({
            nombreArchivo: requiredMaxString(
              "tankCalibrationAttachmentNameRequired",
              "tankCalibrationAttachmentNameMaxLength",
              260
            ),
            tipoContenido: optionalMaxString("tankCalibrationAttachmentTypeMaxLength", 150),
            rutaArchivo: z.any().optional(),
            contenidoBase64: z.any().optional(),
            tamanoBytes: z.any().refine(
              (value) => {
                const numericValue = toFiniteNumber(value);
                return Number.isFinite(numericValue) && numericValue <= 10 * 1024 * 1024;
              },
              { message: "tankCalibrationAttachmentSizeMaxLength" }
            ),
          })
        )
        .max(10, { message: "tankCalibrationAttachmentMaxCount" })
    ),
    detalles: detailsSchema(
      {
        pies: requiredNonNegativeNumber("tankCalibrationHeightFeetInvalid"),
        pulgadas: requiredNonNegativeNumber("tankCalibrationHeightInchesInvalid"),
        dieciseisavos: requiredNonNegativeNumber("tankCalibrationHeightFractionInvalid").refine(
          (value) => toFiniteNumber(value) <= 15,
          {
            message: "tankCalibrationHeightFractionRange",
          }
        ),
        volumen: requiredPositiveNumber("tankCalibrationVolumeRequired"),
      },
      "tankCalibrationDetailRequired"
    ),
  }),
  capacidadVolumetricaTanquePlantillaFila: z.object({
    pies: requiredTemplateNonNegativeNumber("tankCalibrationHeightFeetInvalid").refine(
      (value) => Number.isInteger(templateNumber(value)),
      {
        message: "tankCalibrationHeightIntegerRequired",
      }
    ),
    pulgadas: requiredTemplateNonNegativeNumber("tankCalibrationHeightInchesInvalid")
      .refine((value) => Number.isInteger(templateNumber(value)), {
        message: "tankCalibrationHeightIntegerRequired",
      })
      .refine((value) => templateNumber(value) <= 11, {
        message: "tankCalibrationHeightInchesRange",
      }),
    dieciseisavos: requiredTemplateNonNegativeNumber("tankCalibrationHeightFractionInvalid")
      .refine((value) => Number.isInteger(templateNumber(value)), {
        message: "tankCalibrationHeightIntegerRequired",
      })
      .refine((value) => templateNumber(value) <= 15, {
        message: "tankCalibrationHeightFractionRange",
      }),
    volumen: requiredTemplatePositiveNumber("tankCalibrationVolumeRequired"),
  }),
  coloranteMovimiento: z.object({
    codProducto: requiredMaxString("colorantProductRequired", "productCodeMaxLength", 20),
    fecha: requiredString("colorantDateRequired"),
    tipoMovimiento: z
      .any()
      .refine((value) => isColorantMovimientoValido(value), { message: "colorantMovementInvalid" }),
    cantidad: requiredPositiveNumber("colorantQuantityInvalid"),
    comentarios: optionalMaxString("colorantCommentsMaxLength", 250),
  }),
  colorante: z.object({
    codProducto: requiredMaxString("colorantProductRequired", "productCodeMaxLength", 20),
    fecha: requiredString("colorantDateRequired"),
    tipoMovimiento: z
      .any()
      .refine((value) => isColorantMovimientoValido(value), { message: "colorantMovementInvalid" }),
    cantidad: requiredPositiveNumber("colorantQuantityInvalid"),
    comentarios: optionalMaxString("colorantCommentsMaxLength", 250),
  }),
  coloranteSalida: z.object({
    codProducto: requiredMaxString("colorantProductRequired", "productCodeMaxLength", 20),
    fecha: requiredString("colorantDateRequired"),
    tipoMovimiento: z
      .any()
      .refine((value) => isColorantSalidaMovimiento(value), { message: "colorantMovementInvalid" }),
    codSuplidor: z.any().optional(),
    cantidad: requiredPositiveNumber("colorantQuantityInvalid"),
    comentarios: optionalMaxString("colorantCommentsMaxLength", 250),
  }),
  coloranteSalidaBarco: z.object({
    codProducto: requiredMaxString("colorantProductRequired", "productCodeMaxLength", 20),
    fecha: requiredString("colorantDateRequired"),
    codBarco: requiredPositiveNumber("colorantShipRequired"),
    codSuplidor: requiredPositiveNumber("colorantPartnerRequired"),
    cantidad: requiredPositiveNumber("colorantQuantityInvalid"),
    comentarios: optionalMaxString("colorantCommentsMaxLength", 250),
  }),
  configuracionCorreo: z
    .object({
      descripcion: requiredMaxString(
        "emailConfigurationDescriptionRequired",
        "emailConfigurationDescriptionMaxLength",
        100
      ),
      direccionCorreo: requiredEmail(
        "emailConfigurationEmailRequired",
        "emailConfigurationEmailInvalid",
        "emailConfigurationEmailMaxLength"
      ),
      nombreUsuario: requiredMaxString(
        "emailConfigurationUserNameRequired",
        "emailConfigurationUserNameMaxLength",
        150
      ),
      password: optionalMaxString("emailConfigurationPasswordMaxLength", 50),
      proveedorAutenticacion: requiredMaxString(
        "emailConfigurationAuthProviderRequired",
        "emailConfigurationAuthProviderMaxLength",
        30
      ),
      tipoAutenticacion: optionalMaxString("emailConfigurationAuthTypeMaxLength", 30),
      servidorSalida: requiredMaxString(
        "emailConfigurationOutgoingServerRequired",
        "emailConfigurationOutgoingServerMaxLength",
        150
      ),
      puertoSalida: requiredPositiveNumber("emailConfigurationOutgoingPortRequired"),
      tenantId: optionalMaxString("emailConfigurationTenantIdMaxLength", 150),
      clientId: optionalMaxString("emailConfigurationClientIdMaxLength", 150),
      clientSecret: optionalMaxString("emailConfigurationClientSecretMaxLength", 250),
      redirectUri: optionalMaxString("emailConfigurationRedirectUriMaxLength", 250),
      authorizationUrl: optionalMaxString("emailConfigurationAuthorizationUrlMaxLength", 500),
      tokenUrl: optionalMaxString("emailConfigurationTokenUrlMaxLength", 500),
      scope: optionalMaxString("emailConfigurationScopeMaxLength", 500),
      estatusAutenticacion: optionalMaxString("emailConfigurationAuthStatusMaxLength", 30),
      ultimoErrorAutenticacion: optionalMaxString("emailConfigurationLastAuthErrorMaxLength", 1000),
    })
    .refine(
      (data) =>
        ["SMTP", "Personalizado", "Office365", "Gmail"].includes(
          String(data.proveedorAutenticacion ?? "")
        ),
      {
        message: "emailConfigurationAuthProviderRequired",
        path: ["proveedorAutenticacion"],
      }
    )
    .refine(
      (data) => isOAuthEmailProvider(data.proveedorAutenticacion) || hasValue(data.password),
      {
        message: "emailConfigurationPasswordRequired",
        path: ["password"],
      }
    )
    .refine(
      (data) => !isOAuthEmailProvider(data.proveedorAutenticacion) || hasValue(data.clientId),
      {
        message: "emailConfigurationClientIdRequired",
        path: ["clientId"],
      }
    )
    .refine(
      (data) => !isOAuthEmailProvider(data.proveedorAutenticacion) || hasValue(data.clientSecret),
      {
        message: "emailConfigurationClientSecretRequired",
        path: ["clientSecret"],
      }
    )
    .refine(
      (data) => !isOAuthEmailProvider(data.proveedorAutenticacion) || hasValue(data.redirectUri),
      {
        message: "emailConfigurationRedirectUriRequired",
        path: ["redirectUri"],
      }
    )
    .refine(
      (data) =>
        !isOAuthEmailProvider(data.proveedorAutenticacion) || hasValue(data.authorizationUrl),
      {
        message: "emailConfigurationAuthorizationUrlRequired",
        path: ["authorizationUrl"],
      }
    )
    .refine(
      (data) => !isOAuthEmailProvider(data.proveedorAutenticacion) || hasValue(data.tokenUrl),
      {
        message: "emailConfigurationTokenUrlRequired",
        path: ["tokenUrl"],
      }
    )
    .refine((data) => !isOAuthEmailProvider(data.proveedorAutenticacion) || hasValue(data.scope), {
      message: "emailConfigurationScopeRequired",
      path: ["scope"],
    })
    .refine((data) => data.proveedorAutenticacion !== "Office365" || hasValue(data.tenantId), {
      message: "emailConfigurationTenantIdRequired",
      path: ["tenantId"],
    }),
  consumoPropio: z.object({
    codTanque: requiredMaxString("ownConsumptionTankRequired", "tankCodeMaxLength", 20),
    fecha: requiredString("ownConsumptionDateRequired"),
    pies: requiredNonNegativeNumber("ownConsumptionMeasurementInvalid"),
    pulgadas: requiredNonNegativeNumber("ownConsumptionMeasurementInvalid").refine(
      (value) => toFiniteNumber(value) <= 11,
      {
        message: "ownConsumptionInchesRange",
      }
    ),
    dieciseisavos: requiredNonNegativeNumber("ownConsumptionMeasurementInvalid").refine(
      (value) => toFiniteNumber(value) <= 15,
      {
        message: "ownConsumptionSixteenthsRange",
      }
    ),
  }),
  volumenTanque: z.object({
    codTanque: requiredMaxString("tankVolumeTankRequired", "tankCodeMaxLength", 20),
    fecha: requiredString("tankVolumeDateRequired"),
    pies: requiredNonNegativeNumber("tankVolumeMeasurementInvalid").refine(
      (value) => Number.isInteger(toFiniteNumber(value)),
      {
        message: "tankVolumeIntegerRequired",
      }
    ),
    pulgadas: requiredNonNegativeNumber("tankVolumeMeasurementInvalid")
      .refine((value) => Number.isInteger(toFiniteNumber(value)), {
        message: "tankVolumeIntegerRequired",
      })
      .refine((value) => toFiniteNumber(value) <= 11, {
        message: "tankVolumeHeightRange",
      }),
    dieciseisavos: requiredNonNegativeNumber("tankVolumeMeasurementInvalid")
      .refine((value) => Number.isInteger(toFiniteNumber(value)), {
        message: "tankVolumeIntegerRequired",
      })
      .refine((value) => toFiniteNumber(value) <= 15, {
        message: "tankVolumeSixteenthsRange",
      }),
  }),
  idioma: z.object({
    idioma: requiredString("languageCodeRequired"),
    descripcion: requiredString("idiomaDescriptionRequired"),
  }),
  menu: z.object({
    descripcion: requiredString("menuDescriptionRequired"),
  }),
  menuIdioma: z.object({
    codMenu: requiredPositiveNumber("menuMenuRequired"),
    idioma: requiredString("languageCodeRequired"),
    descripcion: requiredString("menuIdiomaDescriptionRequired"),
  }),
  menuRuta: z.object({
    ruta: requiredString("menuRouteRequired"),
    codMenu: requiredPositiveNumber("menuRouteMenuRequired"),
    codTipoPermiso: requiredPositiveNumber("menuRoutePermissionRequired"),
  }),
  medicionTanqueTierra: z.object({
    fecha: requiredString("groundTankMeasurementDateRequired"),
    codBarco: requiredPositiveNumber("groundTankMeasurementShipRequired"),
    codSuplidor: requiredPositiveNumber("groundTankMeasurementPartnerRequired"),
    codProducto: requiredPositiveNumber("groundTankMeasurementProductRequired"),
    codCompaniaInspeccion: requiredPositiveNumber("groundTankMeasurementInspectionCompanyRequired"),
    detalles: detailsSchema(
      {
        codTanque: requiredMaxString(
          "groundTankMeasurementDetailTankRequired",
          "tankCodeMaxLength",
          20
        ),
        tipo: requiredString("groundTankMeasurementTypeRequired").refine(
          (value) =>
            ["O", "C"].includes(
              String(value ?? "")
                .trim()
                .toUpperCase()
            ),
          { message: "groundTankMeasurementTypeInvalid" }
        ),
        fecha: requiredString("groundTankMeasurementDetailDateRequired"),
        hora: requiredString("groundTankMeasurementDetailTimeRequired"),
        pies: requiredNonNegativeNumber("groundTankMeasurementFeetInvalid"),
        pulgadas: requiredNonNegativeNumber("groundTankMeasurementInchesInvalid").refine(
          (value) => toFiniteNumber(value) <= 11,
          {
            message: "groundTankMeasurementInchesInvalid",
          }
        ),
        dieciseisavos: requiredNonNegativeNumber("groundTankMeasurementFractionInvalid").refine(
          (value) => toFiniteNumber(value) <= 15,
          { message: "groundTankMeasurementFractionInvalid" }
        ),
        volumen: requiredPositiveNumber("groundTankMeasurementTotalVolumeInvalid"),
        correccionTecho: requiredFiniteNumber("groundTankMeasurementRoofCorrectionInvalid"),
        medidaAguaPies: requiredNonNegativeNumber("groundTankMeasurementWaterFeetInvalid"),
        medidaAguaPulgadas: requiredNonNegativeNumber(
          "groundTankMeasurementWaterInchesInvalid"
        ).refine((value) => toFiniteNumber(value) <= 11, {
          message: "groundTankMeasurementWaterInchesInvalid",
        }),
        volumenAguaLibre: requiredNonNegativeNumber("groundTankMeasurementFreeWaterVolumeInvalid"),
        volumenBrutoObservado: requiredPositiveNumber(
          "groundTankMeasurementObservedGrossVolumeInvalid"
        ),
        temperatura: requiredPositiveNumber("groundTankMeasurementTemperatureInvalid"),
        api: requiredPositiveNumber("groundTankMeasurementApiInvalid"),
        factor: requiredPositiveNumber("groundTankMeasurementFactorInvalid"),
        volumenEstandarBruto: requiredPositiveNumber(
          "groundTankMeasurementStandardGrossVolumeInvalid"
        ),
      },
      "groundTankMeasurementDetailRequired"
    ),
  }),
  producto: z.object({
    codProducto: requiredMaxString("productCodeRequired", "productCodeMaxLength", 20),
    codTipoProducto: requiredMaxString("productTypeRequired", "productTypeCodeMaxLength", 20),
    tipo: requiredString("productCategoryRequired").refine(
      (value) => productTypeValues.includes(String(value ?? "")),
      { message: "productCategoryInvalid" }
    ),
    producto: requiredString("productNameRequired"),
    descripcionCorta: requiredShortString(
      "productShortDescriptionRequired",
      "productShortDescriptionMaxLength"
    ),
    estatus: z.any().optional(),
  }),
  metro: z.object({
    codMetro: requiredMaxString("meterCodeRequired", "meterCodeMaxLength", 20),
    codBahia: requiredMaxString("meterBayRequired", "bayCodeMaxLength", 20),
    codBrazo: requiredMaxString("meterArmRequired", "armCodeMaxLength", 20),
    codProducto: requiredMaxString("meterProductRequired", "meterProductCodeMaxLength", 20),
    metro: requiredMaxString("meterNameRequired", "meterNameMaxLength", 200),
    tipoMetro: requiredString("meterTypeRequired").refine(
      (value) => meterTypeValues.includes(String(value ?? "")),
      { message: "meterTypeInvalid" }
    ),
    modelo: requiredMaxString("meterModelRequired", "meterModelMaxLength", 200),
    serie: requiredMaxString("meterSeriesRequired", "meterSeriesMaxLength", 200),
    comentario: optionalMaxString("meterCommentMaxLength", 250),
    estatus: z.any().optional(),
  }),
  rol: z.object({
    descripcion: requiredString("roleDescriptionRequired"),
  }),
  salidaProducto: z.object({
    fecha: requiredString("exitDateRequired"),
    codSuplidor: requiredPositiveNumber("exitPartnerRequired"),
    codProducto: requiredPositiveNumber("exitProductRequired"),
    cantidadEstandar: requiredPositiveNumber("exitStandardQuantityInvalid"),
    cantidadAmbiente: requiredPositiveNumber("exitAmbientQuantityInvalid"),
  }),
  suplidor: z.object({
    codSocio: requiredMaxString("partnerTypeCodeRequired", "partnerTypeCodeMaxLength", 20),
    suplidor: requiredString("partnerDescriptionRequired"),
    suplidorNombreCorto: requiredShortString(
      "partnerShortDescriptionRequired",
      "partnerShortDescriptionMaxLength"
    ),
    estatus: z.any().optional(),
  }),
  personal: z.object({
    codTecnico: optionalMaxString("staffTechnicianCodeMaxLength", 50),
    nombre: requiredString("staffNameRequired"),
    puesto: requiredString("staffPositionRequired"),
  }),
  personalExterno: z.object({
    codCompaniaInspeccion: requiredPositiveNumber("externalStaffCompanyRequired"),
    codTecnico: optionalMaxString("externalStaffTechnicianCodeMaxLength", 50),
    nombre: requiredString("externalStaffNameRequired"),
    puesto: requiredString("externalStaffPositionRequired"),
    adjuntos: z.preprocess(
      (value) => (Array.isArray(value) ? value : []),
      z
        .array(
          z.object({
            nombreArchivo: requiredMaxString(
              "externalStaffAttachmentNameRequired",
              "externalStaffAttachmentNameMaxLength",
              260
            ),
            tipoContenido: optionalMaxString("externalStaffAttachmentTypeMaxLength", 150),
            rutaArchivo: z.any().optional(),
            contenidoBase64: z.any().optional(),
            tamanoBytes: z.any().refine(
              (value) => {
                const numericValue = toFiniteNumber(value);
                return Number.isFinite(numericValue) && numericValue <= 10 * 1024 * 1024;
              },
              { message: "externalStaffAttachmentSizeMaxLength" }
            ),
          })
        )
        .max(10, { message: "externalStaffAttachmentMaxCount" })
    ),
  }),
  tanque: z.object({
    codTanque: requiredMaxString("tankCodeRequired", "tankCodeMaxLength", 20),
    codProducto: requiredPositiveNumber("tankProductRequired"),
    tipoTanque: requiredString("tankTypeRequired").refine(
      (value) => tankTypeValues.includes(String(value ?? "")),
      { message: "tankTypeInvalid" }
    ),
    tipoPosiconTecho: requiredString("tankRoofPositionRequired").refine(
      (value) => tankRoofPositionValues.includes(String(value ?? "")),
      { message: "tankRoofPositionInvalid" }
    ),
    tanque: requiredString("tankNameRequired"),
    descripcionCorta: requiredShortString(
      "tankShortDescriptionRequired",
      "tankShortDescriptionMaxLength"
    ),
    comentario: optionalMaxString("tankCommentMaxLength", 250),
    adjuntos: z.preprocess(
      (value) => (Array.isArray(value) ? value : []),
      z
        .array(
          z.object({
            nombreArchivo: requiredMaxString(
              "tankAttachmentNameRequired",
              "tankAttachmentNameMaxLength",
              260
            ),
            tipoContenido: optionalMaxString("tankAttachmentTypeMaxLength", 150),
            rutaArchivo: z.any().optional(),
            contenidoBase64: z.any().optional(),
            tamanoBytes: z.any().refine(
              (value) => {
                const numericValue = toFiniteNumber(value);
                return Number.isFinite(numericValue) && numericValue <= 10 * 1024 * 1024;
              },
              { message: "tankAttachmentSizeMaxLength" }
            ),
          })
        )
        .max(10, { message: "tankAttachmentMaxCount" })
    ),
  }),
  tuberia: z.object({
    codTuberia: requiredMaxString("pipelineCodeRequired", "pipelineCodeMaxLength", 20),
    codTanque: optionalMaxString("tankCodeMaxLength", 20),
    codTipoProducto: requiredMaxString(
      "pipelineProductTypeRequired",
      "productTypeCodeMaxLength",
      20
    ),
    codProducto: requiredMaxString("pipelineProductRequired", "productCodeMaxLength", 20),
    ubicacion: requiredMaxString("pipelineLocationRequired", "pipelineLocationMaxLength", 250),
    tramoLinea: requiredMaxString(
      "pipelineLineSectionRequired",
      "pipelineLineSectionMaxLength",
      250
    ),
    diametroInicio: requiredPositiveNumber("pipelineDiameterStartRequired"),
    diametroFinal: requiredPositiveNumber("pipelineDiameterEndRequired"),
    volumen: requiredPositiveNumber("pipelineVolumeRequired"),
    fechaCertificacion: requiredString("pipelineCertificationDateRequired"),
    codCompaniaInspeccion: requiredPositiveNumber("pipelineInspectionCompanyRequired"),
    tipoMovimiento: z.any().refine(
      (value) =>
        ["ENTRADA", "SALIDA", "NO APLICA"].includes(
          String(value ?? "")
            .trim()
            .toUpperCase()
        ),
      { message: "pipelineMovementTypeRequired" }
    ),
    comentario: optionalMaxString("pipelineCommentMaxLength", 250),
    estatus: z.any().optional(),
    adjuntos: z.preprocess(
      (value) => (Array.isArray(value) ? value : []),
      z
        .array(
          z.object({
            nombreArchivo: requiredMaxString(
              "pipelineAttachmentNameRequired",
              "pipelineAttachmentNameMaxLength",
              260
            ),
            tipoContenido: optionalMaxString("pipelineAttachmentTypeMaxLength", 150),
            rutaArchivo: z.any().optional(),
            contenidoBase64: z.any().optional(),
            tamanoBytes: z.any().refine(
              (value) => {
                const numericValue = toFiniteNumber(value);
                return Number.isFinite(numericValue) && numericValue <= 10 * 1024 * 1024;
              },
              { message: "pipelineAttachmentSizeMaxLength" }
            ),
          })
        )
        .max(10, { message: "pipelineAttachmentMaxCount" })
    ),
  }),
  tarea: z.object({
    descripcion: requiredMaxString("taskDescriptionRequired", "taskDescriptionMaxLength", 250),
    tiempo: optionalMaxString("taskTimeMaxLength", 100),
  }),
  notificacion: z.object({
    codTarea: z.any().optional(),
    descripcion: requiredMaxString(
      "notificationDescriptionRequired",
      "notificationDescriptionMaxLength",
      250
    ),
    asunto: optionalMaxString("notificationSubjectMaxLength", 500),
    para: optionalMaxString("notificationToMaxLength", 4000),
    copia: optionalMaxString("notificationCopyMaxLength", 4000),
    texto: z.any().refine(htmlHasText, {
      message: "notificationTextRequired",
    }),
    fechaProgramada: z.any().optional(),
    adjuntos: z.preprocess(
      (value) => (Array.isArray(value) ? value : []),
      z
        .array(
          z.object({
            nombreArchivo: requiredMaxString(
              "notificationAttachmentNameRequired",
              "notificationAttachmentNameMaxLength",
              260
            ),
            tipoContenido: optionalMaxString("notificationAttachmentTypeMaxLength", 150),
            contenidoBase64: requiredString("notificationAttachmentContentRequired"),
            tamanoBytes: z.any().refine(
              (value) => {
                const numericValue = toFiniteNumber(value);
                return Number.isFinite(numericValue) && numericValue <= 10 * 1024 * 1024;
              },
              { message: "notificationAttachmentSizeMaxLength" }
            ),
          })
        )
        .max(10, { message: "notificationAttachmentMaxCount" })
    ),
  }),
  tipoPermiso: z.object({
    descripcion: requiredString("permissionTypeDescriptionRequired"),
  }),
  tipoProducto: z.object({
    codTipoProducto: requiredMaxString("productTypeCodeRequired", "productTypeCodeMaxLength", 20),
    descripcion: requiredString("productTypeDescriptionRequired"),
    descripcionCorta: requiredShortString(
      "productTypeShortDescriptionRequired",
      "productTypeShortDescriptionMaxLength"
    ),
  }),
  socio: z.object({
    codSocio: requiredMaxString("partnerTypeCodeRequired", "partnerTypeCodeMaxLength", 20),
    socio: requiredString("partnerTypeNameRequired"),
    nombreCortoSocio: requiredShortString(
      "partnerTypeShortDescriptionRequired",
      "partnerTypeShortDescriptionMaxLength"
    ),
    estatus: z.any().optional(),
  }),
  tipoUsuario: z.object({
    descripcion: requiredString("userTypeDescriptionRequired"),
  }),
  compraVentaSuplidores: z
    .object({
      fecha: requiredString("productTransferDateRequired"),
      codSuplidorOrigen: requiredPositiveNumber("productTransferSourcePartnerRequired"),
      codSuplidorDestino: requiredPositiveNumber("productTransferTargetPartnerRequired"),
      codProducto: requiredPositiveNumber("productTransferProductRequired"),
      cantidadEstandar: requiredPositiveNumber("productTransferStandardQuantityInvalid"),
      cantidadAmbiente: requiredPositiveNumber("productTransferAmbientQuantityInvalid"),
    })
    .refine(
      (data) => toFiniteNumber(data.codSuplidorOrigen) !== toFiniteNumber(data.codSuplidorDestino),
      { message: "productTransferDifferentPartnersRequired", path: ["codSuplidorDestino"] }
    ),
  usuario: z
    .object({
      codUsuario: requiredMaxString("userCodeRequired", "userCodeMaxLength", 50),
      nombre: requiredMaxString("userNameRequired", "userNameMaxLength", 100),
      correo: requiredEmail("userEmailRequired", "userEmailInvalid", "userEmailMaxLength", 100),
      password: requiredString("userPasswordRequired"),
      confirmacionPassword: requiredString("passwordMismatch"),
      estatus: z.any().optional(),
    })
    .refine((data) => data.password === data.confirmacionPassword, {
      message: "passwordMismatch",
      path: ["confirmacionPassword"],
    }),
  usuarioConfiguracion: z.object({
    codTipoUsuario: requiredPositiveNumber("userConfigurationTypeRequired"),
    codRol: requiredPositiveNumber("userConfigurationRoleRequired"),
  }),
  usuarioPreferencia: z.object({
    idUsuario: requiredString("userCodeRequired"),
    idioma: requiredString("userPreferenceLanguageRequired"),
    theme: requiredString("userPreferenceThemeRequired"),
  }),
};

export const passwordChangeSchema = z
  .object({
    password: requiredString("passwordMismatch"),
    confirmacionPassword: requiredString("passwordMismatch"),
  })
  .refine((data) => data.password === data.confirmacionPassword, {
    message: "passwordMismatch",
    path: ["confirmacionPassword"],
  });
