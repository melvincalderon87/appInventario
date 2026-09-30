import ExcelJS from "exceljs/dist/exceljs.min.js";

const MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
const dateValue = (value) => (value ? new Date(`${String(value).slice(0, 10)}T00:00:00`) : null);
const styleHeader = (row) =>
  row.eachCell({ includeEmpty: true }, (cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1F4E78" } };
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
  });
const styleTotal = (row, lastColumn) => {
  for (let column = 1; column <= lastColumn; column += 1) {
    const cell = row.getCell(column);
    cell.font = { bold: true };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD9EAF7" } };
  }
};
const sheetName = (value, used) => {
  const base =
    String(value || "Suplidor")
      .replace(/[\\/:*?[\]]/g, " ")
      .trim()
      .slice(0, 31) || "Suplidor";
  let name = base;
  let index = 2;
  while (used.has(name)) {
    name = `${base.slice(0, 28)} ${index}`;
    index += 1;
  }
  used.add(name);
  return name;
};
const addVolumeBlockTitle = (sheet, fechaInicial, fechaFinal, lastColumn, tipo) => {
  const lastColumnLetter = sheet.getColumn(lastColumn).letter;
  const titleRow = sheet.addRow([`MOVCOM - VOLUMEN ${tipo.toUpperCase()} (GALONES)`]);
  sheet.mergeCells(`A${titleRow.number}:${lastColumnLetter}${titleRow.number}`);
  titleRow.getCell(1).font = { bold: true, size: 14, color: { argb: "FFFFFFFF" } };
  titleRow.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1F4E78" } };
  titleRow.getCell(1).alignment = { horizontal: "center" };
  const rangeRow = sheet.addRow([
    "Rango",
    `${String(fechaInicial).slice(0, 10)} al ${String(fechaFinal).slice(0, 10)}`,
  ]);
  sheet.mergeCells(`B${rangeRow.number}:${lastColumnLetter}${rangeRow.number}`);
  sheet.addRow([]);
};
const addIngresosBarcoSection = (
  sheet,
  suppliers,
  products,
  ingresosBarco,
  tipo
) => {
  const lastColumn = 2 + suppliers.length * Math.max(products.length, 1);
  const lastColumnLetter = sheet.getColumn(lastColumn).letter;
  const titleRow = sheet.addRow([`INGRESOS DE BARCOS - VOLUMEN ${tipo.toUpperCase()} (GALONES)`]);
  sheet.mergeCells(`A${titleRow.number}:${lastColumnLetter}${titleRow.number}`);
  const title = titleRow.getCell(1);
  title.font = { bold: true, size: 11, color: { argb: "FFFFFFFF" } };
  title.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2F6B9A" } };
  const productHeaderRow = sheet.rowCount + 1;
  const productRow = ["Fecha", "Tanquero"];
  products.forEach(([, product]) => suppliers.forEach(() => productRow.push(product)));
  sheet.addRow(productRow);
  const supplierHeaderRow = sheet.rowCount + 1;
  const supplierRow = ["", ""];
  products.forEach(() => suppliers.forEach(([, supplier]) => supplierRow.push(supplier)));
  sheet.addRow(supplierRow);
  sheet.mergeCells(productHeaderRow, 1, supplierHeaderRow, 1);
  sheet.mergeCells(productHeaderRow, 2, supplierHeaderRow, 2);
  let firstProductColumn = 3;
  products.forEach(() => {
    const endProductColumn = firstProductColumn + Math.max(suppliers.length, 1) - 1;
    if (endProductColumn > firstProductColumn)
      sheet.mergeCells(productHeaderRow, firstProductColumn, productHeaderRow, endProductColumn);
    firstProductColumn = endProductColumn + 1;
  });
  styleHeader(sheet.getRow(productHeaderRow));
  styleHeader(sheet.getRow(supplierHeaderRow));
  const ships = [
    ...new Map(
      ingresosBarco.map((row) => [
        row.codIngresoBarco,
        { fecha: row.fechaIngreso, barco: row.barco },
      ])
    ).entries(),
  ].map(([codigo, item]) => ({ codigo, ...item }));
  const displayShips = ships.length
    ? ships
    : [{ codigo: "", fecha: "", barco: "Sin ingresos de barco en el rango seleccionado." }];
  const field = tipo === "ambiente" ? "cantidadAmbiente" : "cantidadEstandar";
  displayShips.forEach((ship) => {
    const values = [dateValue(ship.fecha), ship.barco];
    products.forEach(([productCode]) =>
      suppliers.forEach(([supplierCode]) => {
        const amount =
          ingresosBarco
            .filter(
              (item) =>
                String(item.codIngresoBarco) === String(ship.codigo) &&
                Number(item.codSuplidor) === Number(supplierCode) &&
                Number(item.codProducto) === Number(productCode)
            )
            .reduce((total, item) => total + Number(item[field] ?? 0), 0) * 42;
        values.push(amount || null);
      })
    );
    sheet.addRow(values);
  });
  const lastDataRow = sheet.rowCount;
  const totalRow = ["TOTAL", ""];
  for (let column = 3; column <= lastColumn; column += 1) {
    const letter = sheet.getColumn(column).letter;
    totalRow.push({ formula: `SUM(${letter}${supplierHeaderRow + 1}:${letter}${lastDataRow})` });
  }
  const total = sheet.addRow(totalRow);
  styleTotal(total, lastColumn);
  sheet.addRow([]);
  return { lastColumn, lastColumnLetter };
};
const addMovimientosUnidadSection = (sheet, suppliers, products, movimientosUnidad, tipo) => {
  const lastColumn = 2 + suppliers.length * Math.max(products.length, 1);
  const lastColumnLetter = sheet.getColumn(lastColumn).letter;
  const field = tipo === "ambiente" ? "cantidadAmbiente" : "cantidadEstandar";
  const sectionRow = sheet.addRow([
    `ENTRADAS Y SALIDAS POR UNIDAD - VOLUMEN ${tipo.toUpperCase()} (GALONES)`,
  ]);
  sheet.mergeCells(`A${sectionRow.number}:${lastColumnLetter}${sectionRow.number}`);
  sectionRow.getCell(1).font = { bold: true, size: 11, color: { argb: "FFFFFFFF" } };
  sectionRow.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2F6B9A" } };
  const productHeaderRow = sheet.rowCount + 1;
  const productRow = ["Fecha", "Unidad"];
  products.forEach(([, product]) => suppliers.forEach(() => productRow.push(product)));
  sheet.addRow(productRow);
  const supplierHeaderRow = sheet.rowCount + 1;
  const supplierRow = ["", ""];
  products.forEach(() => suppliers.forEach(([, supplier]) => supplierRow.push(supplier)));
  sheet.addRow(supplierRow);
  sheet.mergeCells(productHeaderRow, 1, supplierHeaderRow, 1);
  sheet.mergeCells(productHeaderRow, 2, supplierHeaderRow, 2);
  let firstProductColumn = 3;
  products.forEach(() => {
    const endProductColumn = firstProductColumn + Math.max(suppliers.length, 1) - 1;
    if (endProductColumn > firstProductColumn)
      sheet.mergeCells(productHeaderRow, firstProductColumn, productHeaderRow, endProductColumn);
    firstProductColumn = endProductColumn + 1;
  });
  styleHeader(sheet.getRow(productHeaderRow));
  styleHeader(sheet.getRow(supplierHeaderRow));
  const units = [
    ...new Map(
      movimientosUnidad.map((row) => [
        `${row.tipo}-${row.codigo}`,
        { codigo: row.codigo, tipo: row.tipo, fecha: row.fecha, unidad: row.siglasUnidad },
      ])
    ).values(),
  ];
  const displayUnits = units.length
    ? units
    : [
        {
          codigo: "",
          tipo: "",
          fecha: "",
          unidad: "Sin movimientos por unidad en el rango seleccionado.",
        },
      ];
  displayUnits.forEach((unit) => {
    const values = [
      dateValue(unit.fecha),
      unit.codigo ? `${unit.tipo}: ${unit.unidad || "Sin unidad"}` : unit.unidad,
    ];
    products.forEach(([productCode]) =>
      suppliers.forEach(([supplierCode]) => {
        const amount =
          movimientosUnidad
            .filter(
              (item) =>
                Number(item.codigo) === Number(unit.codigo) &&
                String(item.tipo) === String(unit.tipo) &&
                Number(item.codSuplidor) === Number(supplierCode) &&
                Number(item.codProducto) === Number(productCode)
            )
            .reduce((totalAmount, item) => totalAmount + Number(item[field] ?? 0), 0) *
          42 *
          (String(unit.tipo).toLowerCase() === "salida" ? -1 : 1);
        values.push(amount || null);
      })
    );
    sheet.addRow(values);
  });
  const lastDataRow = sheet.rowCount;
  const totalRow = ["TOTAL", ""];
  for (let column = 3; column <= lastColumn; column += 1) {
    const letter = sheet.getColumn(column).letter;
    totalRow.push({ formula: `SUM(${letter}${supplierHeaderRow + 1}:${letter}${lastDataRow})` });
  }
  const total = sheet.addRow(totalRow);
  styleTotal(total, lastColumn);
  sheet.addRow([]);
};
const addCompraVentaSection = (sheet, compraVentaSuplidores, tipo) => {
  const field = tipo === "ambiente" ? "cantidadAmbiente" : "cantidadEstandar";
  const sectionRow = sheet.addRow([
    `COMPRA Y VENTA DE SUPLIDORES - VOLUMEN ${tipo.toUpperCase()} (GALONES)`,
  ]);
  sheet.mergeCells(`A${sectionRow.number}:F${sectionRow.number}`);
  sectionRow.getCell(1).font = { bold: true, size: 11, color: { argb: "FFFFFFFF" } };
  sectionRow.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2F6B9A" } };
  const header = sheet.addRow([
    "Fecha",
    "Producto",
    "Suplidor que vende",
    "Venta (-)",
    "Suplidor que compra",
    "Compra (+)",
  ]);
  styleHeader(header);
  const displayRows = compraVentaSuplidores.length ? compraVentaSuplidores : [{ empty: true }];
  displayRows.forEach((row) =>
    sheet.addRow(
      row.empty
        ? ["", "Sin compra o venta de suplidores en el rango seleccionado.", "", "", "", ""]
        : [
            dateValue(row.fecha),
            row.producto,
            row.suplidorOrigen,
            -Number(row[field] ?? 0) * 42,
            row.suplidorDestino,
            Number(row[field] ?? 0) * 42,
          ]
    )
  );
  const lastDataRow = sheet.rowCount;
  const total = sheet.addRow([
    "TOTAL",
    "",
    "",
    { formula: `SUM(D${header.number + 1}:D${lastDataRow})` },
    "",
    { formula: `SUM(F${header.number + 1}:F${lastDataRow})` },
  ]);
  styleTotal(total, 6);
  sheet.getColumn(4).numFmt = "#,##0.00";
  sheet.getColumn(6).numFmt = "#,##0.00";
  sheet.addRow([]);
};
const addDetalleSuplidores = (sheet, rows, tipo, rowsAmbiente = [], tanques = []) => {
  const suppliers = [...new Map(rows.map((row) => [row.codSuplidor, row.suplidor])).entries()];
  suppliers.forEach(([supplierCode, supplier]) => {
    const detailRows = rows.filter((row) => Number(row.codSuplidor) === Number(supplierCode));
    sheet.addRow([]);
    const title = sheet.addRow([
      `DETALLE DEL SUPLIDOR: ${supplier} - VOLUMEN ${tipo.toUpperCase()} (BBL)`,
    ]);
    sheet.mergeCells(`A${title.number}:G${title.number}`);
    title.getCell(1).font = { bold: true, size: 11, color: { argb: "FFFFFFFF" } };
    title.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2F6B9A" } };
    const header = sheet.addRow([
      "Producto",
      "Saldo inicial",
      "Recibos",
      "Despachos",
      "Otras entradas",
      "Otras salidas",
      "Final teorico",
    ]);
    styleHeader(header);
    const startRow = sheet.rowCount + 1;
    detailRows.forEach((row) => {
      const number = sheet.rowCount + 1;
      const initial =
        tipo === "estandar"
          ? initialStandardForDetail(row, rowsAmbiente, tanques)
          : numberValue(row.inicial) / 42;
      sheet.addRow([
        row.producto,
        initial,
        Number(row.recibos ?? 0) / 42,
        Number(row.despachos ?? 0) / 42,
        Number(row.otrasEntradas ?? 0) / 42,
        Number(row.otrasSalidas ?? 0) / 42,
        { formula: `B${number}+C${number}-D${number}+E${number}-F${number}` },
      ]);
    });
    const endRow = sheet.rowCount;
    const total = sheet.addRow([
      "TOTAL",
      { formula: `SUM(B${startRow}:B${endRow})` },
      { formula: `SUM(C${startRow}:C${endRow})` },
      { formula: `SUM(D${startRow}:D${endRow})` },
      { formula: `SUM(E${startRow}:E${endRow})` },
      { formula: `SUM(F${startRow}:F${endRow})` },
      { formula: `SUM(G${startRow}:G${endRow})` },
    ]);
    styleTotal(total, 7);
    for (let column = 2; column <= 7; column += 1) sheet.getColumn(column).numFmt = "#,##0.00";
  });
  return suppliers;
};
const numberValue = (value) => Number(value ?? 0) || 0;
const normalizedText = (value) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .trim();
const summaryProduct = (row) => {
  const product = normalizedText(row.producto);
  if (/(MOGAS\s*95|SUPER|VPOWER|PREMIUM)/.test(product))
    return { key: "MOGAS95", label: "MOGAS 95" };
  if (/(MOGAS\s*91|REGULAR)/.test(product))
    return { key: "MOGAS91", label: "MOGAS 91" };
  if (product.includes("DIESEL")) return { key: "DIESEL", label: "DIESEL" };
  return { key: `PRODUCTO-${row.codProducto}`, label: row.producto || "Sin producto" };
};
const summaryProducts = (rows) => {
  const groups = new Map([
    ["MOGAS95", { key: "MOGAS95", label: "MOGAS 95" }],
    ["MOGAS91", { key: "MOGAS91", label: "MOGAS 91" }],
    ["DIESEL", { key: "DIESEL", label: "DIESEL" }],
  ]);
  rows.forEach((row) => {
    const product = summaryProduct(row);
    if (!groups.has(product.key)) groups.set(product.key, product);
  });
  return [...groups.values()];
};
const summarySuppliers = (suppliers) => {
  const definitions = [
    { label: "UNO", matches: (name) => name.includes("UNO") && !name.includes("FUEL") && !name.includes("PETROL") },
    { label: "UNO PETROLEOS", matches: (name) => name.includes("UNO") && name.includes("PETROL") },
    { label: "UNO FUELS", matches: (name) => name.includes("UNO") && name.includes("FUEL") },
    { label: "CHEVRON", matches: (name) => name.includes("CHEVRON") || name.includes("CVX") },
  ];
  return definitions.map((definition) => {
    const supplier = suppliers.find(([, name]) => definition.matches(normalizedText(name)));
    return [supplier?.[0] ?? null, supplier?.[1] ?? definition.label];
  });
};
const rowsForSummaryProduct = (rows, product) =>
  rows.filter((row) => summaryProduct(row).key === product.key);
const tanksForSummaryProduct = (tanques, product) =>
  tanques.filter((tank) => summaryProduct(tank).key === product.key);
const sumInitial = (rows) => rows.reduce((total, row) => total + numberValue(row.inicial), 0);
const factorForSummaryProduct = (product, tanques) => {
  const factors = tanksForSummaryProduct(tanques, product)
    .map((tank) => ({ factor: Number(tank.factor), volume: numberValue(tank.volumenAmbiente) }))
    .filter((tank) => Number.isFinite(tank.factor) && tank.factor > 0);
  if (!factors.length) return null;
  const volume = factors.reduce((total, tank) => total + tank.volume, 0);
  if (volume > 0)
    return factors.reduce((total, tank) => total + tank.volume * tank.factor, 0) / volume;
  return factors.reduce((total, tank) => total + tank.factor, 0) / factors.length;
};
const initialStandardFromAmbiente = (product, rowsAmbiente, tanques) => {
  if (!rowsAmbiente.length) return 0;
  const saldoAmbiente = sumInitial(rowsForSummaryProduct(rowsAmbiente, product));
  if (saldoAmbiente === 0) return 0;
  const factor = factorForSummaryProduct(product, tanques);
  return factor === null ? 0 : (saldoAmbiente * factor) / 42;
};
const initialStandardForDetail = (row, rowsAmbiente, tanques) => {
  const product = summaryProduct(row);
  const saldoAmbiente = sumInitial(
    rowsAmbiente.filter(
      (item) =>
        Number(item.codSuplidor) === Number(row.codSuplidor) &&
        Number(item.codProducto) === Number(row.codProducto)
    )
  );
  if (saldoAmbiente === 0) return 0;
  const factor = factorForSummaryProduct(product, tanques);
  return factor === null ? 0 : (saldoAmbiente * factor) / 42;
};
const tankTotalsForProduct = (product, productRows, tanques, tipo) => {
  const matchingTanks = tanksForSummaryProduct(tanques, product);
  if (matchingTanks.length) {
    const volumeField = tipo === "ambiente" ? "volumenAmbiente" : "volumenEstandar";
    return {
      physical: matchingTanks.reduce((total, tank) => total + numberValue(tank[volumeField]), 0) / 42,
      available: matchingTanks.reduce(
        (total, tank) => total + numberValue(tank.capacidadDisponible),
        0
      ) / 42,
    };
  }
  const physicalByProduct = new Map();
  productRows.forEach((row) => {
    const code = String(row.codProducto);
    physicalByProduct.set(code, Math.max(physicalByProduct.get(code) ?? 0, numberValue(row.fisicoTanques)));
  });
  return {
    physical: [...physicalByProduct.values()].reduce((total, value) => total + value, 0) / 42,
    available: 0,
  };
};
const addResumenFinal = (sheet, rows, suppliers, tipo, tanques = [], rowsAmbiente = []) => {
  const products = summaryProducts(rows);
  const supplierCount = suppliers.length;
  const totalAgColumn = 4 + supplierCount;
  const totalBblColumn = totalAgColumn + 1;
  const finalColumn = totalBblColumn + 1;
  const physicalColumn = finalColumn + 1;
  const pipeColumn = physicalColumn + 1;
  const pgTotalColumn = pipeColumn + 1;
  const pgPercentColumn = pgTotalColumn + 1;
  const pgSupplierStartColumn = pgPercentColumn + 1;
  const availableColumn = tipo === "ambiente" ? pgSupplierStartColumn + supplierCount : null;
  const lastColumn = availableColumn ?? pgSupplierStartColumn + supplierCount - 1;
  const lastLetter = sheet.getColumn(lastColumn).letter;
  sheet.addRow([]);
  const title = sheet.addRow([`RESUMEN FINAL POR PRODUCTO - VOLUMEN ${tipo.toUpperCase()}`]);
  sheet.mergeCells(`A${title.number}:${lastLetter}${title.number}`);
  title.getCell(1).font = { bold: true, size: 11, color: { argb: "FFFFFFFF" } };
  title.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2F6B9A" } };
  if (tipo === "estandar") {
    const note = sheet.addRow([
      "Saldo inicial Standard = saldo inicial Ambiente × factor ponderado de los tanques del producto.",
    ]);
    sheet.mergeCells(`A${note.number}:${lastLetter}${note.number}`);
    note.getCell(1).font = { italic: true, color: { argb: "FF7F6000" } };
  }
  const header = sheet.addRow([
    "Producto",
    tipo === "estandar" ? "Saldo ini. BBL (Ambiente × factor)" : "Saldo ini. BBL",
    "Recibos BBL",
    ...suppliers.map(([, supplier]) => `${supplier} (AG)`),
    "Totales (AG)",
    "Totales BBL",
    "Final teorico",
    "Fisico tanques BBL",
    "Tuberia interna BBL",
    "P/G total",
    "P/G %",
    ...suppliers.map(([, supplier]) => `${supplier} P/G`),
    ...(tipo === "ambiente" ? ["Espacio disponible BBL"] : []),
  ]);
  styleHeader(header);
  const startRow = sheet.rowCount + 1;
  products.forEach((product) => {
    const productRows = rowsForSummaryProduct(rows, product);
    const dispatches = suppliers.map(([supplierCode]) => {
      if (supplierCode === null) return 0;
      return productRows
        .filter((row) => Number(row.codSuplidor) === Number(supplierCode))
        .reduce((total, row) => total + numberValue(row.despachos), 0);
    });
    const tanks = tankTotalsForProduct(product, productRows, tanques, tipo);
    const pipeByProduct = new Map();
    productRows.forEach((row) => {
      const code = String(row.codProducto);
      pipeByProduct.set(code, Math.max(pipeByProduct.get(code) ?? 0, numberValue(row.tuberiaInterna)));
    });
    const pipe = [...pipeByProduct.values()].reduce((total, value) => total + value, 0) / 42;
    const saldoInicial =
      tipo === "estandar"
        ? initialStandardFromAmbiente(product, rowsAmbiente, tanques)
        : sumInitial(productRows) / 42;
    const entradas =
      productRows.reduce((total, row) => total + numberValue(row.otrasEntradas), 0) / 42;
    const salidas =
      productRows.reduce((total, row) => total + numberValue(row.otrasSalidas), 0) / 42;
    const number = sheet.rowCount + 1;
    const ag = sheet.getColumn(totalAgColumn).letter;
    const bbl = sheet.getColumn(totalBblColumn).letter;
    const final = sheet.getColumn(finalColumn).letter;
    const fisico = sheet.getColumn(physicalColumn).letter;
    const tuberia = sheet.getColumn(pipeColumn).letter;
    const pg = sheet.getColumn(pgTotalColumn).letter;
    const values = [
      product.label,
      saldoInicial,
      productRows.reduce((total, row) => total + numberValue(row.recibos), 0) / 42,
      ...dispatches,
      { formula: `SUM(D${number}:${sheet.getColumn(totalAgColumn - 1).letter}${number})` },
      { formula: `${ag}${number}/42` },
      {
        formula:
          tipo === "estandar"
            ? `IF(ISNUMBER(B${number}),B${number}+C${number}-${bbl}${number}+${entradas}-${salidas},0)`
            : `B${number}+C${number}-${bbl}${number}+${entradas}-${salidas}`,
      },
      tanks.physical,
      pipe,
      { formula: `IF(ISNUMBER(${final}${number}),${fisico}${number}+${tuberia}${number}-${final}${number},0)` },
      { formula: `IF(AND(ISNUMBER(${pg}${number}),${bbl}${number}<>0),${pg}${number}/${bbl}${number},0)` },
    ];
    suppliers.forEach((_, index) => {
      const supplierColumn = sheet.getColumn(4 + index).letter;
      values.push({
        formula: `IF(AND(ISNUMBER(${pg}${number}),${ag}${number}<>0),${supplierColumn}${number}/${ag}${number}*${pg}${number},0)`,
      });
    });
    if (availableColumn) values.push(tanks.available);
    sheet.addRow(values);
  });
  const endRow = sheet.rowCount;
  const totals = ["TOTAL"];
  for (let column = 2; column <= lastColumn; column += 1) {
    const letter = sheet.getColumn(column).letter;
    totals.push({
      formula:
        column === pgPercentColumn
          ? `IF(AND(ISNUMBER(${sheet.getColumn(pgTotalColumn).letter}${endRow + 1}),${sheet.getColumn(totalBblColumn).letter}${endRow + 1}<>0),${sheet.getColumn(pgTotalColumn).letter}${endRow + 1}/${sheet.getColumn(totalBblColumn).letter}${endRow + 1},0)`
          : `SUM(${letter}${startRow}:${letter}${endRow})`,
    });
  }
  const total = sheet.addRow(totals);
  styleTotal(total, lastColumn);
  for (let column = 2; column <= lastColumn; column += 1)
    sheet.getColumn(column).numFmt = column === pgPercentColumn ? "0.00%" : "#,##0.00";
  return lastColumn;
};
const addAditivosReport = (sheet, aditivos, tanques) => {
  sheet.addRow([]);
  sheet.addRow([]);
  sheet.addRow([]);
  const title = sheet.addRow(["REPORTE DE ADITIVOS EN GALONES"]);
  sheet.mergeCells(`A${title.number}:Q${title.number}`);
  title.getCell(1).font = { bold: true, size: 11, color: { argb: "FF000000" } };
  title.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFFF00" } };
  title.getCell(1).alignment = { horizontal: "center" };
  const note = sheet.addRow([
    "Los campos sin fuente registrada en la aplicación se muestran como 0: Galera Sur, inyectado real, imbombeables y promedio de venta diaria.",
  ]);
  sheet.mergeCells(`A${note.number}:Q${note.number}`);
  note.getCell(1).alignment = { wrapText: true };
  note.getCell(1).font = { italic: true, color: { argb: "FF7F6000" } };
  const header = sheet.addRow([
    "Aditivo",
    "Tanque(s)",
    "Saldo inicial AG",
    "Otros ingresos",
    "Almacenado Galera Sur",
    "Otras salidas",
    "Inyectado teórico",
    "Inyectado real",
    "Final teórico",
    "Final físico tanques",
    "Final físico total",
    "Imbombeables",
    "Volumen disponible",
    "Promedio venta diaria",
    "Días disponibles",
    "Dif. galones",
    "P/G",
  ]);
  styleHeader(header);
  const startRow = sheet.rowCount + 1;
  const displayRows = aditivos.length ? aditivos : [{ empty: true }];
  displayRows.forEach((row) => {
    if (row.empty) {
      sheet.addRow(["Sin movimientos de aditivos en el rango seleccionado."]);
      return;
    }
    const tankNames = tanques
      .filter((tank) => Number(tank.codProducto) === Number(row.codProducto))
      .map((tank) => tank.codTanque || tank.tanque)
      .filter(Boolean)
      .join(", ");
    const number = sheet.rowCount + 1;
    sheet.addRow([
      row.producto,
      tankNames || 0,
      numberValue(row.saldoInicial),
      numberValue(row.otrosIngresos),
      0,
      numberValue(row.otrasSalidas),
      numberValue(row.consumosBi),
      0,
      { formula: `IF(ISNUMBER(E${number}),C${number}+D${number}+E${number}-F${number}-G${number},0)` },
      numberValue(row.finalFisicoTanques),
      { formula: `IF(ISNUMBER(E${number}),E${number}+J${number},0)` },
      0,
      { formula: `IF(AND(ISNUMBER(K${number}),ISNUMBER(L${number})),K${number}-L${number},0)` },
      0,
      { formula: `IF(AND(ISNUMBER(M${number}),ISNUMBER(N${number}),N${number}<>0),M${number}/N${number},0)` },
      { formula: `IF(AND(ISNUMBER(K${number}),ISNUMBER(I${number})),K${number}-I${number},0)` },
      { formula: `IF(AND(ISNUMBER(P${number}),G${number}<>0),P${number}/G${number},0)` },
    ]);
  });
  const endRow = sheet.rowCount;
  if (aditivos.length) {
    const total = sheet.addRow([
      "TOTAL",
      "",
      { formula: `SUM(C${startRow}:C${endRow})` },
      { formula: `SUM(D${startRow}:D${endRow})` },
      0,
      { formula: `SUM(F${startRow}:F${endRow})` },
      { formula: `SUM(G${startRow}:G${endRow})` },
      0,
      0,
      { formula: `SUM(J${startRow}:J${endRow})` },
      0,
      0,
      0,
      0,
      0,
      0,
      0,
    ]);
    styleTotal(total, 17);
  }
  sheet.getColumn(1).width = Math.max(sheet.getColumn(1).width || 0, 30);
  sheet.getColumn(2).width = 20;
  for (let column = 3; column <= 17; column += 1) {
    sheet.getColumn(column).width = Math.max(sheet.getColumn(column).width || 0, 18);
    if (![5, 8, 9, 11, 12, 13, 14, 15, 16, 17].includes(column))
      sheet.getColumn(column).numFmt = "#,##0.00";
  }
};
const dateKey = (date) => {
  if (date instanceof Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
  return String(date ?? "").slice(0, 10);
};
const addDailyConsumptionTable = (sheet, title, supplierCode, rows, days, fallbackProducts = []) => {
  const products = [
    ...new Map([
      ...fallbackProducts,
      ...rows.map((row) => [row.codProducto, row.producto]),
    ]).entries(),
  ];
  const lastColumn = products.length + 1;
  const lastColumnLetter = sheet.getColumn(lastColumn).letter;
  const titleRow = sheet.addRow([title]);
  sheet.mergeCells(`A${titleRow.number}:${lastColumnLetter}${titleRow.number}`);
  titleRow.getCell(1).font = { bold: true, size: 11, color: { argb: "FFFFFFFF" } };
  titleRow.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2F6B9A" } };
  const header = sheet.addRow(["Fecha", ...products.map(([, product]) => product)]);
  styleHeader(header);
  const startRow = sheet.rowCount + 1;
  days.forEach((day) => {
    const dayKey = dateKey(day);
    sheet.addRow([
      day,
      ...products.map(
        ([productCode]) =>
          rows
            .filter(
              (row) =>
                dateKey(row.fecha) === dayKey &&
                Number(row.codSuplidor) === Number(supplierCode) &&
              Number(row.codProducto) === Number(productCode)
            )
            .reduce((total, row) => total + Number(row.consumos ?? 0), 0)
      ),
    ]);
  });
  const total = sheet.addRow([
    "TOTAL",
    ...products.map((_, index) => {
      const letter = sheet.getColumn(index + 2).letter;
      return { formula: `SUM(${letter}${startRow}:${letter}${sheet.rowCount})` };
    }),
  ]);
  styleTotal(total, lastColumn);
  sheet.getColumn(1).width = 14;
  sheet.getColumn(1).numFmt = "yyyy-mm-dd";
  for (let column = 2; column <= lastColumn; column += 1) {
    sheet.getColumn(column).width = Math.max(sheet.getColumn(column).width || 0, 20);
    sheet.getColumn(column).numFmt = "#,##0.00";
  }
  sheet.addRow([]);
};

const addEthanolUnitSheets = (workbook, used, fechaInicial, fechaFinal, standardRows, ambientRows) => {
  const suppliers = [
    ...new Map([...standardRows, ...ambientRows].map((row) => [row.codSuplidor, row.suplidor])).entries(),
  ];
  suppliers.forEach(([supplierCode, supplier]) => {
    const entries = new Map();
    standardRows.filter((row) => Number(row.codSuplidor) === Number(supplierCode)).forEach((row) =>
      entries.set(`${row.tipo}-${row.codigo}`, { ...entries.get(`${row.tipo}-${row.codigo}`), ...row, standard: Number(row.cantidadEstandar ?? 0) })
    );
    ambientRows.filter((row) => Number(row.codSuplidor) === Number(supplierCode)).forEach((row) =>
      entries.set(`${row.tipo}-${row.codigo}`, { ...entries.get(`${row.tipo}-${row.codigo}`), ...row, ambient: Number(row.cantidadAmbiente ?? 0) })
    );
    const tab = workbook.addWorksheet(sheetName(`Etanol ${supplier}`, used));
    tab.addRow([`RECEPCION DE UNIDADES ETANOL - ${supplier.toUpperCase()} (GALONES)`]);
    tab.mergeCells("A1:E1");
    tab.getCell("A1").font = { bold: true, size: 14, color: { argb: "FFFFFFFF" } };
    tab.getCell("A1").fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1F4E78" } };
    tab.getCell("A1").alignment = { horizontal: "center" };
    tab.addRow(["Rango", `${String(fechaInicial).slice(0, 10)} al ${String(fechaFinal).slice(0, 10)}`]);
    tab.mergeCells("B2:E2");
    tab.addRow([]);
    const header = tab.addRow(["Fecha", "Unidad", "AG Boletas", "AH Real", "AI Corregido"]);
    styleHeader(header);
    const firstDataRow = tab.rowCount + 1;
    [...entries.values()]
      .sort((a, b) => String(a.fecha).localeCompare(String(b.fecha)) || String(a.siglasUnidad).localeCompare(String(b.siglasUnidad)))
      .forEach((row) => tab.addRow([dateValue(row.fecha), row.siglasUnidad || "Sin unidad", Number(row.cantidadBoletas ?? 0) * 42, (row.standard ?? 0) * 42, (row.ambient ?? 0) * 42]));
    const total = tab.addRow([
      "TOTAL",
      "",
      { formula: `SUM(C${firstDataRow}:C${tab.rowCount})` },
      { formula: `SUM(D${firstDataRow}:D${tab.rowCount})` },
      { formula: `SUM(E${firstDataRow}:E${tab.rowCount})` },
    ]);
    styleTotal(total, 5);
    tab.getColumn(1).width = 14;
    tab.getColumn(1).numFmt = "yyyy-mm-dd";
    tab.getColumn(2).width = 16;
    tab.getColumn(3).width = 18;
    tab.getColumn(4).width = 18;
    tab.getColumn(5).width = 18;
    tab.getColumn(3).numFmt = "#,##0.00";
    tab.getColumn(4).numFmt = "#,##0.00";
    tab.getColumn(5).numFmt = "#,##0.00";
  });
};

export async function downloadMovComStandarExcel(
  rows,
  fechaInicial,
  fechaFinal,
  ingresosBarco = [],
  movimientosUnidad = [],
  compraVentaSuplidores = [],
  tanques = [],
  aditivos = [],
  consumosBiDiarios = [],
  consumosBiDiariosEtanol = [],
  consumosBiDiariosCombustibles = [],
  rowsAmbiente = [],
  ingresosBarcoAmbiente = [],
  movimientosUnidadAmbiente = [],
  compraVentaSuplidoresAmbiente = [],
  consumosBiDiariosAmbiente = [],
  consumosBiDiariosEtanolAmbiente = [],
  consumosBiDiariosCombustiblesAmbiente = [],
  entradasUnidadEtanol = [],
  entradasUnidadEtanolAmbiente = []
) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Reportes");
  const suppliers = [
    ...new Map(
      [
        ...rows,
        ...ingresosBarco,
        ...movimientosUnidad,
        ...ingresosBarcoAmbiente,
        ...movimientosUnidadAmbiente,
      ].map((row) => [row.codSuplidor, row.suplidor])
    ).entries(),
  ];
  const products = [
    ...new Map(
      [
        ...rows,
        ...ingresosBarco,
        ...movimientosUnidad,
        ...ingresosBarcoAmbiente,
        ...movimientosUnidadAmbiente,
      ].map((row) => [row.codProducto, row.producto])
    ).entries(),
  ];
  const lastColumn = 2 + suppliers.length * Math.max(products.length, 1);
  addVolumeBlockTitle(sheet, fechaInicial, fechaFinal, lastColumn, "ambiente");
  addIngresosBarcoSection(
    sheet,
    suppliers,
    products,
    ingresosBarcoAmbiente,
    "ambiente"
  );
  addMovimientosUnidadSection(sheet, suppliers, products, movimientosUnidadAmbiente, "ambiente");
  addCompraVentaSection(sheet, compraVentaSuplidoresAmbiente, "ambiente");
  addDetalleSuplidores(sheet, rowsAmbiente, "ambiente");
  addResumenFinal(sheet, rowsAmbiente, summarySuppliers(suppliers), "ambiente", tanques);
  sheet.addRow([]);
  sheet.addRow([]);
  sheet.addRow([]);
  addVolumeBlockTitle(sheet, fechaInicial, fechaFinal, lastColumn, "estandar");
  addIngresosBarcoSection(
    sheet,
    suppliers,
    products,
    ingresosBarco,
    "estandar"
  );
  addMovimientosUnidadSection(sheet, suppliers, products, movimientosUnidad, "estandar");
  addCompraVentaSection(sheet, compraVentaSuplidores, "estandar");
  const detailSuppliers = addDetalleSuplidores(sheet, rows, "estandar", rowsAmbiente, tanques);
  const summaryLastColumn = addResumenFinal(
    sheet,
    rows,
    summarySuppliers(suppliers),
    "estandar",
    tanques,
    rowsAmbiente
  );
  const columnWidths = [14, 32, 24, 18, 28, 18];
  columnWidths.forEach((width, index) => {
    sheet.getColumn(index + 1).width = width;
  });
  for (let column = 7; column <= summaryLastColumn; column += 1) sheet.getColumn(column).width = 20;
  const usedSheetNames = new Set(["Reportes"]);
  const rangeStart = dateValue(fechaInicial);
  const rangeEnd = dateValue(fechaFinal);
  const days = [];
  for (let day = new Date(rangeStart); day <= rangeEnd; day.setDate(day.getDate() + 1))
    days.push(new Date(day));
  const dailyAditivoProducts = [
    ...new Map(aditivos.map((row) => [row.codProducto, row.producto])).entries(),
  ];
  const etanolProductsFromData = [
    ...new Map(
      [...consumosBiDiariosEtanol, ...consumosBiDiariosEtanolAmbiente].map((row) => [
        row.codProducto,
        row.producto,
      ])
    ).entries(),
  ];
  const dailyEtanolProducts = etanolProductsFromData.length
    ? etanolProductsFromData
    : [[null, "ETANOL"]];
  detailSuppliers.forEach(([supplierCode, supplier]) => {
    const dailySheet = workbook.addWorksheet(sheetName(supplier, usedSheetNames));
    const lastColumn = Math.max(products.length + 1, 2);
    const lastColumnLetter = dailySheet.getColumn(lastColumn).letter;
    dailySheet.addRow([`DESPACHOS DIARIOS SEGUN FOLIOS - ${supplier} (GALONES)`]);
    dailySheet.mergeCells(`A1:${lastColumnLetter}1`);
    dailySheet.getCell("A1").font = { bold: true, size: 14, color: { argb: "FFFFFFFF" } };
    dailySheet.getCell("A1").fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF1F4E78" },
    };
    dailySheet.getCell("A1").alignment = { horizontal: "center" };
    dailySheet.addRow([
      "Rango",
      `${String(fechaInicial).slice(0, 10)} al ${String(fechaFinal).slice(0, 10)}`,
    ]);
    dailySheet.mergeCells(`B2:${lastColumnLetter}2`);
    dailySheet.addRow([]);
    addDailyConsumptionTable(
      dailySheet,
      "DETALLE DIARIO DE CONSUMOS DE COMBUSTIBLES - AMBIENTE (GALONES)",
      supplierCode,
      consumosBiDiariosCombustiblesAmbiente,
      days,
      products
    );
    addDailyConsumptionTable(
      dailySheet,
      "DETALLE DIARIO DE CONSUMO DE ETANOL - AMBIENTE (GALONES)",
      supplierCode,
      consumosBiDiariosEtanolAmbiente,
      days,
      dailyEtanolProducts
    );
    addDailyConsumptionTable(
      dailySheet,
      "DETALLE DIARIO DE CONSUMOS DE COMBUSTIBLES - ESTANDAR (GALONES)",
      supplierCode,
      consumosBiDiariosCombustibles,
      days,
      products
    );
    addDailyConsumptionTable(
      dailySheet,
      "DETALLE DIARIO DE CONSUMO DE ETANOL - ESTANDAR (GALONES)",
      supplierCode,
      consumosBiDiariosEtanol,
      days,
      dailyEtanolProducts
    );
    addDailyConsumptionTable(
      dailySheet,
      "DETALLE DIARIO DE CONSUMOS DE ADITIVOS - AMBIENTE (GALONES)",
      supplierCode,
      consumosBiDiariosAmbiente,
      days,
      dailyAditivoProducts
    );
    addDailyConsumptionTable(
      dailySheet,
      "DETALLE DIARIO DE CONSUMOS DE ADITIVOS - ESTANDAR (GALONES)",
      supplierCode,
      consumosBiDiarios,
      days,
      dailyAditivoProducts
    );
  });
  addEthanolUnitSheets(workbook, usedSheetNames, fechaInicial, fechaFinal, entradasUnidadEtanol, entradasUnidadEtanolAmbiente);
  const tankSheet = workbook.addWorksheet("Tanques");
  tankSheet.addRow(["RESUMEN POR TANQUES - VOLUMEN AMBIENTE (GALONES)"]);
  tankSheet.mergeCells("A1:M1");
  tankSheet.getCell("A1").font = { bold: true, size: 14, color: { argb: "FFFFFFFF" } };
  tankSheet.getCell("A1").fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF1F4E78" },
  };
  tankSheet.getCell("A1").alignment = { horizontal: "center" };
  tankSheet.addRow([
    "Fecha de medicion",
    tanques[0]?.fecha
      ? String(tanques[0].fecha).slice(0, 10)
      : "Sin mediciones en el rango seleccionado",
  ]);
  tankSheet.mergeCells("B2:M2");
  tankSheet.addRow([]);
  const tankHeader = tankSheet.addRow([
    "TK",
    "Medida total",
    "Volumen total",
    "Medida de agua",
    "Volumen agua",
    "Correc. techo",
    "Temp",
    "API",
    "Factor",
    "Volumen ambiente",
    "Volumen estandar",
    "Capacidad maxima",
    "Capacidad disponible",
  ]);
  styleHeader(tankHeader);
  const tankProducts = [
    ...new Map(tanques.map((row) => [row.codProducto, row.producto])).entries(),
  ];
  tankProducts.forEach(([productCode, product]) => {
    const productTanks = tanques.filter((row) => Number(row.codProducto) === Number(productCode));
    const groupRow = tankSheet.addRow([product]);
    tankSheet.mergeCells(`A${groupRow.number}:M${groupRow.number}`);
    groupRow.getCell(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    groupRow.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2F6B9A" } };
    const startRow = tankSheet.rowCount + 1;
    productTanks.forEach((row) =>
      tankSheet.addRow([
        row.codTanque || row.tanque,
        `${row.pies}' ${row.pulgadas}" ${row.dieciseisavos}/16`,
        Number(row.volumen ?? 0),
        `${row.medidaAguaPies}' ${row.medidaAguaPulgadas}"`,
        Number(row.volumenAgua ?? 0),
        Number(row.correccionTecho ?? 0),
        Number(row.temperatura ?? 0),
        Number(row.api ?? 0),
        Number(row.factor ?? 0),
        Number(row.volumenAmbiente ?? 0),
        Number(row.volumenEstandar ?? 0),
        Number(row.capacidadMaxima ?? 0),
        Number(row.capacidadDisponible ?? 0),
      ])
    );
    const endRow = tankSheet.rowCount;
    const total = tankSheet.addRow([
      `TOTAL ${product}`,
      "",
      { formula: `SUM(C${startRow}:C${endRow})` },
      "",
      { formula: `SUM(E${startRow}:E${endRow})` },
      { formula: `SUM(F${startRow}:F${endRow})` },
      { formula: `AVERAGE(G${startRow}:G${endRow})` },
      { formula: `AVERAGE(H${startRow}:H${endRow})` },
      { formula: `AVERAGE(I${startRow}:I${endRow})` },
      { formula: `SUM(J${startRow}:J${endRow})` },
      { formula: `SUM(K${startRow}:K${endRow})` },
      { formula: `SUM(L${startRow}:L${endRow})` },
      { formula: `SUM(M${startRow}:M${endRow})` },
    ]);
    styleTotal(total, 13);
  });
  if (!tankProducts.length) {
    const empty = tankSheet.addRow(["Sin mediciones de tanques en el rango seleccionado."]);
    tankSheet.mergeCells(`A${empty.number}:M${empty.number}`);
  }
  const standardTankTitle = tankSheet.addRow(["RESUMEN POR TANQUES - VOLUMEN ESTANDAR (GALONES)"]);
  tankSheet.mergeCells(`A${standardTankTitle.number}:M${standardTankTitle.number}`);
  standardTankTitle.getCell(1).font = { bold: true, size: 14, color: { argb: "FFFFFFFF" } };
  standardTankTitle.getCell(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF1F4E78" },
  };
  standardTankTitle.getCell(1).alignment = { horizontal: "center" };
  const standardTankHeader = tankSheet.addRow([
    "TK",
    "Medida total",
    "Volumen total",
    "Medida de agua",
    "Volumen agua",
    "Correc. techo",
    "Temp",
    "API",
    "Factor",
    "Volumen ambiente",
    "Volumen estandar",
    "Capacidad maxima",
    "Capacidad disponible",
  ]);
  styleHeader(standardTankHeader);
  tankProducts.forEach(([productCode, product]) => {
    const productTanks = tanques.filter((row) => Number(row.codProducto) === Number(productCode));
    const groupRow = tankSheet.addRow([product]);
    tankSheet.mergeCells(`A${groupRow.number}:M${groupRow.number}`);
    groupRow.getCell(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    groupRow.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2F6B9A" } };
    productTanks.forEach((row) =>
      tankSheet.addRow([
        row.codTanque || row.tanque,
        `${row.pies}' ${row.pulgadas}" ${row.dieciseisavos}/16`,
        Number(row.volumen ?? 0),
        `${row.medidaAguaPies}' ${row.medidaAguaPulgadas}"`,
        Number(row.volumenAgua ?? 0),
        Number(row.correccionTecho ?? 0),
        Number(row.temperatura ?? 0),
        Number(row.api ?? 0),
        Number(row.factor ?? 0),
        Number(row.volumenAmbiente ?? 0),
        Number(row.volumenEstandar ?? 0),
        Number(row.capacidadMaxima ?? 0),
        Number(row.capacidadDisponible ?? 0),
      ])
    );
  });
  tankSheet.getColumn(1).width = 12;
  tankSheet.getColumn(2).width = 16;
  tankSheet.getColumn(3).width = 17;
  tankSheet.getColumn(4).width = 16;
  for (let column = 5; column <= 13; column += 1) {
    tankSheet.getColumn(column).width = 18;
    tankSheet.getColumn(column).numFmt = column === 9 ? "0.00000" : "#,##0.00";
  }
  addAditivosReport(sheet, aditivos, tanques);
  sheet.getColumn(1).width = 36;
  sheet.getColumn(2).width = 20;
  for (let column = 3; column <= lastColumn; column += 1) {
    sheet.getColumn(column).width = 16;
    sheet.getColumn(column).numFmt = "#,##0.00";
  }
  sheet.getColumn(1).numFmt = "yyyy-mm-dd";
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: MIME });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `movcom-ingresos-${fechaInicial}-${fechaFinal}.xlsx`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
