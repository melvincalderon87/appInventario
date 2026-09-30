import ExcelJS from "exceljs/dist/exceljs.min.js";
import { formSchemas } from "../validations/formSchemas";
import { getZodErrorMessageKey } from "../validations/zodValidation";

const BASE_SHEET_NAME = "Tabla calibracion";
const FRACTION_SHEET_NAME = "Fracciones";
const EXCEL_MIME_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
const FRACTION_DENOMINATOR = 16;

const BASE_TEMPLATE_COLUMNS = [
  {
    key: "pies",
    headerKey: "tankCalibrationHeightFeet",
    fallback: "Pies",
    width: 16,
    aliases: ["pies", "heightfeet", "feet"],
  },
  {
    key: "pulgadas",
    headerKey: "tankCalibrationHeightInches",
    fallback: "Pulgadas",
    width: 18,
    aliases: ["pulgadas", "heightinches", "inches"],
  },
  {
    key: "volumen",
    headerKey: "tankCalibrationVolume",
    fallback: "Volumen",
    width: 16,
    aliases: ["volumen", "volume", "capacidad", "capacity"],
  },
];

const FRACTION_COLUMN = {
  key: "dieciseisavos",
  headerKey: "tankCalibrationHeightFractionNumerator",
  fallback: "Dieciseisavos / 16",
  width: 20,
  aliases: [
    "fraccionnumerador",
    "dieciseisavos16",
    "sixteenths16",
    "fraccion16avos",
    "fraccionen16avos",
    "numerador",
    "heightfractionnumerator",
    "fractionnumerator",
    "numerator",
  ],
};

const FRACTION_TEMPLATE_COLUMNS = [
  {
    key: "dieciseisavos",
    headerKey: "tankCalibrationHeightFractionNumerator",
    fallback: "Dieciseisavos / 16",
    width: 20,
    aliases: FRACTION_COLUMN.aliases,
  },
  {
    key: "volumen",
    headerKey: "tankCalibrationVolume",
    fallback: "Volumen",
    width: 16,
    aliases: ["volumen", "volume", "capacidad", "capacity"],
  },
];

const DIRECT_TEMPLATE_COLUMNS = [
  BASE_TEMPLATE_COLUMNS[0],
  BASE_TEMPLATE_COLUMNS[1],
  FRACTION_COLUMN,
  BASE_TEMPLATE_COLUMNS[2],
];

export const TANK_VOLUMETRIC_CAPACITY_TEMPLATE_ACCEPT = `.xlsx,${EXCEL_MIME_TYPE}`;

function downloadBuffer(buffer, fileName) {
  const blob = new Blob([buffer], { type: EXCEL_MIME_TYPE });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export async function downloadTankVolumetricCapacityDetail(documento, t) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Inventario";
  const worksheet = workbook.addWorksheet(
    translate(t, "tankCalibrationDetails", "Capacidad volumetrica")
  );
  const date = documento?.fechaCalibracion ? new Date(documento.fechaCalibracion) : null;

  const headerRows = [
    [translate(t, "tankCalibrationCode", "Codigo"), documento?.codCapacidadVolumetricaTanque ?? ""],
    [
      translate(t, "tankCalibrationTank", "Tanque"),
      documento?.tanque || documento?.codTanque || "",
    ],
    [translate(t, "tankCalibrationProduct", "Producto"), documento?.producto || ""],
    [
      translate(t, "tankCalibrationInspectionCompany", "Compania de inspeccion"),
      documento?.companiaInspeccion || "",
    ],
    [
      translate(t, "tankCalibrationDate", "Fecha calibracion"),
      date && !Number.isNaN(date.getTime()) ? date : "",
    ],
    [translate(t, "tankCalibrationComments", "Comentarios"), documento?.comentarios || ""],
  ];

  headerRows.forEach(([label, value]) => {
    const row = worksheet.addRow([label, value]);
    row.getCell(1).font = { bold: true };
    if (value instanceof Date) row.getCell(2).numFmt = "dd/mm/yyyy";
  });

  worksheet.addRow([]);
  const tableHeader = worksheet.addRow([
    `${translate(t, "tankCalibrationHeightFeet", "Pies")} '`,
    `${translate(t, "tankCalibrationHeightInches", "Pulgadas")} "`,
    translate(t, "tankCalibrationHeightFractionNumerator", "Dieciseisavos / 16"),
    translate(t, "tankCalibrationVolume", "Volumen"),
  ]);
  [1, 2, 3, 4].forEach((column) => {
    const cell = tableHeader.getCell(column);
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1F4E78" } };
  });

  (Array.isArray(documento?.detalles) ? documento.detalles : []).forEach((detalle) => {
    const row = worksheet.addRow([
      Number(detalle.pies ?? 0),
      Number(detalle.pulgadas ?? 0),
      Number(detalle.dieciseisavos ?? 0),
      Number(detalle.volumen ?? 0),
    ]);
    row.getCell(4).numFmt = "0.0000";
  });

  worksheet.columns = [{ width: 16 }, { width: 20 }, { width: 22 }, { width: 18 }];
  worksheet.views = [{ state: "frozen", ySplit: 7 }];
  const buffer = await workbook.xlsx.writeBuffer();
  const code = documento?.codCapacidadVolumetricaTanque ?? "detalle";
  downloadBuffer(buffer, `capacidad-volumetrica-${code}.xlsx`);
}

function translate(t, key, fallback, options = {}) {
  return t(key, { defaultValue: fallback, ...options });
}

function normalizeHeader(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function getCellValue(cell) {
  const value = cell?.value;

  if (value === null || value === undefined) return "";
  if (typeof value !== "object" || value instanceof Date) return value;
  if (Object.prototype.hasOwnProperty.call(value, "result")) return value.result;
  if (Object.prototype.hasOwnProperty.call(value, "text")) return value.text;
  if (Array.isArray(value.richText)) {
    return value.richText.map((part) => part.text ?? "").join("");
  }

  return "";
}

function normalizeNumberText(value) {
  const text = String(value ?? "")
    .trim()
    .replace(/\s/g, "");
  const hasComma = text.includes(",");
  const hasDot = text.includes(".");

  if (hasComma && hasDot) {
    return text.lastIndexOf(",") > text.lastIndexOf(".")
      ? text.replace(/\./g, "").replace(",", ".")
      : text.replace(/,/g, "");
  }

  return text.replace(",", ".");
}

function parseNumberCell(cell) {
  const value = getCellValue(cell);

  if (typeof value === "number") return value;
  if (value === null || value === undefined || String(value).trim() === "") return null;

  const numberValue = Number(normalizeNumberText(value));
  return Number.isFinite(numberValue) ? numberValue : Number.NaN;
}

function isEmptyRaw(value) {
  return String(value ?? "").trim() === "";
}

function getColumnMap(worksheet, templateColumns, optionalColumns = []) {
  const headerRow = worksheet.getRow(1);
  const map = {};
  const allColumns = [...templateColumns, ...optionalColumns];

  headerRow.eachCell((cell, columnNumber) => {
    const normalized = normalizeHeader(getCellValue(cell));
    const templateColumn = allColumns.find((column) => column.aliases.includes(normalized));

    if (templateColumn && !map[templateColumn.key]) {
      map[templateColumn.key] = columnNumber;
    }
  });

  return map;
}

function buildTemplateColumns(t, templateColumns) {
  return templateColumns.map((column) => {
    const header = translate(t, column.headerKey, column.fallback);
    const headerWithUnit =
      column.key === "pies" ? `${header} '` : column.key === "pulgadas" ? `${header} "` : header;

    return {
      key: column.key,
      header: headerWithUnit,
      width: column.width,
    };
  });
}

function buildTemplateFileName(prefix, tankName) {
  const safeTankName = String(tankName || "tanque")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();

  return `${prefix}-${safeTankName || "tanque"}.xlsx`;
}

function styleHeader(row) {
  row.font = { bold: true, color: { argb: "FFFFFFFF" } };
  row.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF2F5D62" },
  };
  row.alignment = { vertical: "middle" };
}

function applyBaseTemplateValidation(worksheet) {
  for (let rowNumber = 2; rowNumber <= 1000; rowNumber++) {
    worksheet.getCell(`A${rowNumber}`).dataValidation = {
      type: "whole",
      operator: "greaterThanOrEqual",
      formulae: [0],
      allowBlank: true,
    };
    worksheet.getCell(`B${rowNumber}`).dataValidation = {
      type: "decimal",
      operator: "greaterThan",
      formulae: [0],
      allowBlank: true,
    };
    worksheet.getCell(`B${rowNumber}`).dataValidation = {
      type: "whole",
      operator: "between",
      formulae: [0, 11],
      allowBlank: true,
    };
    worksheet.getCell(`C${rowNumber}`).dataValidation = {
      type: "decimal",
      operator: "greaterThan",
      formulae: [0],
      allowBlank: true,
    };
  }
}

function applyFractionTemplateValidation(worksheet) {
  for (let rowNumber = 2; rowNumber <= 100; rowNumber++) {
    worksheet.getCell(`A${rowNumber}`).dataValidation = {
      type: "whole",
      operator: "between",
      formulae: [1, 15],
      allowBlank: true,
    };
  }
}

function addBaseInstructionSheet(workbook, t) {
  const instructions = workbook.addWorksheet(
    translate(t, "tankCalibrationTemplateInstructionsSheet", "Instrucciones")
  );
  instructions.columns = [
    { key: "field", width: 24 },
    { key: "description", width: 48 },
  ];
  instructions.addRow([
    translate(t, "tankCalibrationTemplateField", "Campo"),
    translate(t, "tankCalibrationTemplateDescription", "Descripcion"),
  ]);
  instructions.addRow([
    `${translate(t, "tankCalibrationHeightFeet", "Pies")} '`,
    translate(t, "tankCalibrationTemplateFeetDescription", "Numero entero mayor o igual a 0."),
  ]);
  instructions.addRow([
    `${translate(t, "tankCalibrationHeightInches", "Pulgadas")} "`,
    translate(t, "tankCalibrationTemplateInchesDescription", "Numero entero entre 0 y 11."),
  ]);
  instructions.addRow([
    translate(t, "tankCalibrationVolume", "Volumen"),
    translate(t, "tankCalibrationTemplateVolumeDescription", "Numero mayor que 0."),
  ]);
  styleHeader(instructions.getRow(1));
}

function addFractionInstructionSheet(workbook, t) {
  const instructions = workbook.addWorksheet(
    translate(t, "tankCalibrationTemplateInstructionsSheet", "Instrucciones")
  );
  instructions.columns = [
    { key: "field", width: 24 },
    { key: "description", width: 48 },
  ];
  instructions.addRow([
    translate(t, "tankCalibrationTemplateField", "Campo"),
    translate(t, "tankCalibrationTemplateDescription", "Descripcion"),
  ]);
  instructions.addRow([
    translate(t, "tankCalibrationHeightFractionNumerator", "Dieciseisavos / 16"),
    translate(
      t,
      "tankCalibrationTemplateFractionNumeratorDescription",
      "Numero entero entre 1 y 15. El denominador es fijo en 16."
    ),
  ]);
  instructions.addRow([
    translate(t, "tankCalibrationVolume", "Volumen"),
    translate(t, "tankCalibrationTemplateVolumeDescription", "Numero mayor que 0."),
  ]);
  styleHeader(instructions.getRow(1));
}

function addDirectInstructionSheet(workbook, t) {
  const instructions = workbook.addWorksheet(
    translate(t, "tankCalibrationTemplateInstructionsSheet", "Instrucciones")
  );
  instructions.columns = [{ width: 24 }, { width: 56 }];
  instructions.addRow([
    translate(t, "tankCalibrationTemplateField", "Campo"),
    translate(t, "tankCalibrationTemplateDescription", "Descripcion"),
  ]);
  instructions.addRow([
    translate(t, "tankCalibrationHeightFeet", "Pies"),
    translate(t, "tankCalibrationTemplateFeetDescription", "Numero entero mayor o igual a 0."),
  ]);
  instructions.addRow([
    translate(t, "tankCalibrationHeightInches", "Pulgadas"),
    translate(t, "tankCalibrationTemplateInchesDescription", "Numero entero entre 0 y 11."),
  ]);
  instructions.addRow([
    translate(t, "tankCalibrationHeightFractionNumerator", "Dieciseisavos / 16"),
    translate(
      t,
      "tankCalibrationTemplateFractionNumeratorDescription",
      "Numero entero entre 0 y 15. El denominador es fijo en 16."
    ),
  ]);
  instructions.addRow([
    translate(t, "tankCalibrationVolume", "Volumen"),
    translate(t, "tankCalibrationTemplateVolumeDescription", "Numero mayor que 0."),
  ]);
  styleHeader(instructions.getRow(1));
}

async function downloadWorkbook(workbook, fileName) {
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: EXCEL_MIME_TYPE });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

export async function downloadTankVolumetricCapacityTemplate(t, tankName) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "appInventario";
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet(BASE_SHEET_NAME);
  worksheet.columns = buildTemplateColumns(t, BASE_TEMPLATE_COLUMNS);
  worksheet.views = [{ state: "frozen", ySplit: 1 }];
  styleHeader(worksheet.getRow(1));
  worksheet.getColumn("pies").numFmt = "0";
  worksheet.getColumn("pulgadas").numFmt = "0";
  worksheet.getColumn("volumen").numFmt = "#,##0.00";
  applyBaseTemplateValidation(worksheet);
  addBaseInstructionSheet(workbook, t);

  await downloadWorkbook(
    workbook,
    buildTemplateFileName("plantilla-capacidad-volumentrica-tabla", tankName)
  );
}

export async function downloadTankVolumetricCapacityFractionTemplate(t, tankName) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "appInventario";
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet(FRACTION_SHEET_NAME);
  worksheet.columns = buildTemplateColumns(t, FRACTION_TEMPLATE_COLUMNS);
  worksheet.views = [{ state: "frozen", ySplit: 1 }];
  styleHeader(worksheet.getRow(1));
  worksheet.getColumn("dieciseisavos").numFmt = "0";
  worksheet.getColumn("volumen").numFmt = "#,##0.00";
  applyFractionTemplateValidation(worksheet);
  addFractionInstructionSheet(workbook, t);

  for (let fraction = 1; fraction < FRACTION_DENOMINATOR; fraction++) {
    worksheet.addRow({ dieciseisavos: fraction, volumen: null });
  }

  await downloadWorkbook(
    workbook,
    buildTemplateFileName("plantilla-capacidad-volumentrica-fracciones", tankName)
  );
}

export async function downloadTankVolumetricCapacityDirectTemplate(t, tankName) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "appInventario";
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet("Tabla aditivo");
  worksheet.columns = buildTemplateColumns(t, DIRECT_TEMPLATE_COLUMNS);
  worksheet.views = [{ state: "frozen", ySplit: 1 }];
  styleHeader(worksheet.getRow(1));
  worksheet.getColumn("pies").numFmt = "0";
  worksheet.getColumn("pulgadas").numFmt = "0";
  worksheet.getColumn("dieciseisavos").numFmt = "0";
  worksheet.getColumn("volumen").numFmt = "#,##0.00";
  applyBaseTemplateValidation(worksheet);
  for (let rowNumber = 2; rowNumber <= 100; rowNumber++) {
    worksheet.getCell(`C${rowNumber}`).dataValidation = {
      type: "whole",
      operator: "between",
      formulae: [0, 15],
      allowBlank: true,
    };
    worksheet.getCell(`D${rowNumber}`).dataValidation = {
      type: "decimal",
      operator: "greaterThan",
      formulae: [0],
      allowBlank: true,
    };
  }
  addDirectInstructionSheet(workbook, t);

  await downloadWorkbook(
    workbook,
    buildTemplateFileName("plantilla-capacidad-volumetrica-aditivo", tankName)
  );
}

export async function readTankVolumetricCapacityTemplate(file, t) {
  const workbook = new ExcelJS.Workbook();
  const buffer = await file.arrayBuffer();
  await workbook.xlsx.load(buffer);

  const worksheet = workbook.getWorksheet(BASE_SHEET_NAME) || workbook.worksheets[0];
  if (!worksheet) {
    throw new Error(
      translate(t, "tankCalibrationTemplateEmpty", "La plantilla no contiene detalles para cargar.")
    );
  }

  const columnMap = getColumnMap(worksheet, BASE_TEMPLATE_COLUMNS, [FRACTION_COLUMN]);
  const missingColumns = BASE_TEMPLATE_COLUMNS.filter((column) => !columnMap[column.key]);

  if (missingColumns.length > 0) {
    const columns = missingColumns
      .map((column) => translate(t, column.headerKey, column.fallback))
      .join(", ");

    throw new Error(t("tankCalibrationTemplateMissingColumns", { columns }));
  }

  const rows = [];
  const seenHeights = new Set();

  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) return;

    const rawValues = {
      pies: getCellValue(row.getCell(columnMap.pies)),
      pulgadas: getCellValue(row.getCell(columnMap.pulgadas)),
      volumen: getCellValue(row.getCell(columnMap.volumen)),
      dieciseisavos: columnMap.dieciseisavos
        ? getCellValue(row.getCell(columnMap.dieciseisavos))
        : 0,
    };

    if (BASE_TEMPLATE_COLUMNS.every((column) => isEmptyRaw(rawValues[column.key]))) {
      return;
    }

    const values = {
      pies: parseNumberCell(row.getCell(columnMap.pies)),
      pulgadas: parseNumberCell(row.getCell(columnMap.pulgadas)),
      dieciseisavos: columnMap.dieciseisavos
        ? isEmptyRaw(rawValues.dieciseisavos)
          ? 0
          : parseNumberCell(row.getCell(columnMap.dieciseisavos))
        : 0,
      volumen: parseNumberCell(row.getCell(columnMap.volumen)),
    };

    const validation = formSchemas.capacidadVolumetricaTanquePlantillaFila.safeParse(values);
    if (!validation.success) {
      const messageKey = getZodErrorMessageKey(validation.error, "requiredFields");
      throw new Error(
        t("tankCalibrationTemplateRowError", { row: rowNumber, error: t(messageKey) })
      );
    }

    if (Number(values.dieciseisavos) !== 0) {
      throw new Error(t("tankCalibrationBaseTemplateFractionError", { row: rowNumber }));
    }

    const pies = Number(values.pies);
    const pulgadas = Number(values.pulgadas);
    const volumen = Number(values.volumen);
    const heightKey = `${pies}-${pulgadas}`;

    if (seenHeights.has(heightKey)) {
      throw new Error(t("tankCalibrationTemplateDuplicateHeight", { row: rowNumber }));
    }

    seenHeights.add(heightKey);
    rows.push({
      pies,
      pulgadas,
      dieciseisavos: 0,
      volumen,
    });
  });

  if (rows.length === 0) {
    throw new Error(t("tankCalibrationTemplateEmpty"));
  }

  return rows;
}

export async function readTankVolumetricCapacityDirectTemplate(file, t) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(await file.arrayBuffer());
  const worksheet = workbook.getWorksheet("Tabla aditivo") || workbook.worksheets[0];
  if (!worksheet) throw new Error(t("tankCalibrationTemplateEmpty"));

  const columnMap = getColumnMap(worksheet, DIRECT_TEMPLATE_COLUMNS);
  const missingColumns = DIRECT_TEMPLATE_COLUMNS.filter((column) => !columnMap[column.key]);
  if (missingColumns.length > 0) {
    throw new Error(
      t("tankCalibrationTemplateMissingColumns", {
        columns: missingColumns
          .map((column) => translate(t, column.headerKey, column.fallback))
          .join(", "),
      })
    );
  }

  const rows = [];
  const seenHeights = new Set();
  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) return;
    const raw = Object.fromEntries(
      DIRECT_TEMPLATE_COLUMNS.map((column) => [
        column.key,
        getCellValue(row.getCell(columnMap[column.key])),
      ])
    );
    if (DIRECT_TEMPLATE_COLUMNS.every((column) => isEmptyRaw(raw[column.key]))) return;

    const values = Object.fromEntries(
      DIRECT_TEMPLATE_COLUMNS.map((column) => [
        column.key,
        parseNumberCell(row.getCell(columnMap[column.key])),
      ])
    );
    const validation = formSchemas.capacidadVolumetricaTanquePlantillaFila.safeParse(values);
    if (!validation.success) {
      const messageKey = getZodErrorMessageKey(validation.error, "requiredFields");
      throw new Error(
        t("tankCalibrationTemplateRowError", { row: rowNumber, error: t(messageKey) })
      );
    }

    const { pies, pulgadas, dieciseisavos, volumen } = values;
    const heightKey = `${pies}-${pulgadas}-${dieciseisavos}`;
    if (seenHeights.has(heightKey))
      throw new Error(t("tankCalibrationTemplateDuplicateHeight", { row: rowNumber }));
    seenHeights.add(heightKey);
    rows.push({
      pies: Number(pies),
      pulgadas: Number(pulgadas),
      dieciseisavos: Number(dieciseisavos),
      volumen: Number(volumen),
    });
  });

  if (rows.length === 0) throw new Error(t("tankCalibrationTemplateEmpty"));
  return rows.sort(
    (a, b) =>
      (a.pies * 12 + a.pulgadas) * 16 +
      a.dieciseisavos -
      ((b.pies * 12 + b.pulgadas) * 16 + b.dieciseisavos)
  );
}

export async function readTankVolumetricCapacityFractionTemplate(file, t) {
  const workbook = new ExcelJS.Workbook();
  const buffer = await file.arrayBuffer();
  await workbook.xlsx.load(buffer);

  const worksheet = workbook.getWorksheet(FRACTION_SHEET_NAME) || workbook.worksheets[0];
  if (!worksheet) {
    throw new Error(
      translate(
        t,
        "tankCalibrationFractionTemplateEmpty",
        "La plantilla no contiene fracciones para cargar."
      )
    );
  }

  const columnMap = getColumnMap(worksheet, FRACTION_TEMPLATE_COLUMNS);
  const missingColumns = FRACTION_TEMPLATE_COLUMNS.filter((column) => !columnMap[column.key]);

  if (missingColumns.length > 0) {
    const columns = missingColumns
      .map((column) => translate(t, column.headerKey, column.fallback))
      .join(", ");

    throw new Error(t("tankCalibrationTemplateMissingColumns", { columns }));
  }

  const fractions = [];
  const seenFractions = new Set();

  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) return;

    const rawFraction = getCellValue(row.getCell(columnMap.dieciseisavos));
    const rawVolume = getCellValue(row.getCell(columnMap.volumen));
    if (isEmptyRaw(rawFraction) && isEmptyRaw(rawVolume)) return;

    const value = parseNumberCell(row.getCell(columnMap.dieciseisavos));
    const volumen = parseNumberCell(row.getCell(columnMap.volumen));
    if (
      !Number.isInteger(value) ||
      value < 1 ||
      value >= FRACTION_DENOMINATOR ||
      !Number.isFinite(volumen) ||
      volumen <= 0
    ) {
      throw new Error(t("tankCalibrationFractionTemplateRowError", { row: rowNumber }));
    }

    if (seenFractions.has(value)) {
      throw new Error(t("tankCalibrationFractionTemplateDuplicate", { row: rowNumber }));
    }

    seenFractions.add(value);
    fractions.push({
      dieciseisavos: value,
      volumen,
    });
  });

  if (fractions.length === 0) {
    throw new Error(t("tankCalibrationFractionTemplateEmpty"));
  }

  return fractions.sort((a, b) => a.dieciseisavos - b.dieciseisavos);
}
