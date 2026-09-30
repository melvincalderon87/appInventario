import ExcelJS from "exceljs/dist/exceljs.min.js";
const MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
const value = (cell) =>
  typeof cell?.value === "object" ? (cell.value?.result ?? cell.value?.text ?? "") : cell?.value;
const fileName = (value) =>
  String(value || "")
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
export async function descargarPlantillaVenta({ suplidor, producto, periodo }) {
  const date = new Date(`${periodo}-01T00:00:00`);
  const days = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Ventas");
  [
    ["Suplidor", suplidor],
    ["Producto", producto],
    ["Mes", periodo],
  ].forEach((row) => ws.addRow(row));
  ws.addRow([]);
  const header = ws.addRow(["Dia", "Cantidad estandar", "Cantidad ambiente"]);
  header.eachCell({ includeEmpty: false }, (cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1F4E78" } };
  });
  for (let day = 1; day <= days; day += 1) ws.addRow([day, 0, 0]);
  ws.columns = [{ width: 12 }, { width: 20 }, { width: 20 }];
  ws.getColumn(2).numFmt = "#,##0.00";
  ws.getColumn(3).numFmt = "#,##0.00";
  ws.views = [{ state: "frozen", ySplit: 5 }];
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: MIME });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `ventas-${fileName(suplidor)}-${fileName(producto)}-${periodo}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}
export async function leerPlantillaVenta(file, periodo) {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(await file.arrayBuffer());
  const ws = wb.getWorksheet("Ventas") || wb.worksheets[0];
  if (!ws) throw new Error("La plantilla no contiene ventas.");
  const days =
    new Date(`${periodo}-01T00:00:00`).getMonth() >= 0
      ? new Date(Number(periodo.slice(0, 4)), Number(periodo.slice(5, 7)), 0).getDate()
      : 0;
  const detalles = [];
  ws.eachRow({ includeEmpty: false }, (row, number) => {
    if (number < 6) return;
    const dia = Number(value(row.getCell(1)));
    const cantidadEstandar = Number(String(value(row.getCell(2)) ?? "").replace(",", "."));
    const cantidadAmbiente = Number(String(value(row.getCell(3)) ?? "").replace(",", "."));
    if (
      !Number.isInteger(dia) ||
      !Number.isFinite(cantidadEstandar) ||
      !Number.isFinite(cantidadAmbiente) ||
      cantidadEstandar < 0 ||
      cantidadAmbiente < 0
    )
      throw new Error(`Fila ${number}: dia o cantidad invalida.`);
    detalles.push({ dia, cantidadEstandar, cantidadAmbiente });
  });
  if (
    detalles.length !== days ||
    new Set(detalles.map((x) => x.dia)).size !== days ||
    detalles.some((x) => x.dia < 1 || x.dia > days)
  )
    throw new Error("La plantilla debe contener todos los dias exactos del mes.");
  return detalles.sort((a, b) => a.dia - b.dia);
}

const PRODUCTOS_PLANTILLA = [
  ["super", "Super"],
  ["regular", "Regular"],
  ["diesel", "Diesel"],
  ["etanol", "Etanol"],
];

export async function descargarPlantillaVentas({ codSuplidor, suplidor, periodo }) {
  const date = new Date(`${periodo}-01T00:00:00`);
  const days = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Ventas");
  const columns = [
    "Codigo suplidor",
    "Suplidor",
    "Mes",
    "Dia",
    ...PRODUCTOS_PLANTILLA.flatMap(([, label]) => [`${label} estandar`, `${label} ambiente`]),
  ];
  const header = ws.addRow(columns);
  header.eachCell({ includeEmpty: false }, (cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1F4E78" } };
  });
  for (let day = 1; day <= days; day += 1)
    ws.addRow([codSuplidor, suplidor, periodo, day, ...Array(8).fill(0)]);
  ws.columns = columns.map((_, index) => ({ width: index < 4 ? 18 : 20 }));
  for (let i = 5; i <= 12; i += 1) ws.getColumn(i).numFmt = "#,##0.00";
  ws.views = [{ state: "frozen", ySplit: 1 }];
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: MIME });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `ventas-${fileName(suplidor)}-${periodo}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function leerPlantillaVentas(file, periodo) {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(await file.arrayBuffer());
  const ws = wb.getWorksheet("Ventas") || wb.worksheets[0];
  if (!ws) throw new Error("La plantilla no contiene ventas.");
  const days = new Date(Number(periodo.slice(0, 4)), Number(periodo.slice(5, 7)), 0).getDate();
  const resultado = Object.fromEntries(PRODUCTOS_PLANTILLA.map(([key]) => [key, []]));
  ws.eachRow({ includeEmpty: false }, (row, number) => {
    if (number < 2) return;
    const codigoSuplidor = String(value(row.getCell(1)) ?? "").trim();
    const mes = String(value(row.getCell(3)) ?? "").trim();
    const dia = Number(value(row.getCell(4)));
    if (!codigoSuplidor || mes !== periodo || !Number.isInteger(dia) || dia < 1 || dia > days)
      throw new Error(`Fila ${number}: código de suplidor, mes o día inválido.`);
    PRODUCTOS_PLANTILLA.forEach(([key], index) => {
      const estandar = Number(String(value(row.getCell(5 + index * 2)) ?? "").replace(",", "."));
      const ambiente = Number(String(value(row.getCell(6 + index * 2)) ?? "").replace(",", "."));
      if (!Number.isFinite(estandar) || !Number.isFinite(ambiente) || estandar < 0 || ambiente < 0)
        throw new Error(`Fila ${number}: cantidad inválida.`);
      resultado[key].push({ dia, cantidadEstandar: estandar, cantidadAmbiente: ambiente });
    });
  });
  if (
    PRODUCTOS_PLANTILLA.some(
      ([key]) =>
        resultado[key].length !== days || new Set(resultado[key].map((x) => x.dia)).size !== days
    )
  )
    throw new Error("La plantilla debe contener todos los días exactos del mes.");
  return resultado;
}
