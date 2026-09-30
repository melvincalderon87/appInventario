const PAGE_WIDTH = 792;
const PAGE_HEIGHT = 612;
const MARGIN = 36;

function text(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7E]/g, " ")
    .replace(/[\\()]/g, "\\$&");
}

function number(value) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  }).format(Number(value ?? 0));
}

function date(value) {
  if (!value) return "-";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "-" : parsed.toLocaleDateString("es-GT");
}

function addText(commands, x, y, value, size = 9, bold = false, color = "0 0 0") {
  commands.push(
    `${color} rg BT /${bold ? "F2" : "F1"} ${size} Tf 1 0 0 1 ${x} ${y} Tm (${text(value)}) Tj ET`
  );
}

function line(commands, x1, y1, x2, y2) {
  commands.push(`0.78 0.82 0.86 RG 0.45 w ${x1} ${y1} m ${x2} ${y2} l S`);
}

function fill(commands, x, y, width, height, color = "0.12 0.31 0.47") {
  commands.push(`${color} rg ${x} ${y} ${width} ${height} re f`);
}

function pageHeader(commands, empresa, documento, page, total) {
  fill(commands, 0, PAGE_HEIGHT - 82, PAGE_WIDTH, 82);
  addText(
    commands,
    38,
    PAGE_HEIGHT - 38,
    empresa?.nombreComercial || empresa?.nombreFiscal || "EMPRESA",
    18,
    true,
    "1 1 1"
  );
  addText(
    commands,
    38,
    PAGE_HEIGHT - 57,
    [empresa?.nombreFiscal, empresa?.nit ? `NIT: ${empresa.nit}` : ""]
      .filter(Boolean)
      .join("   |   "),
    9,
    false,
    "1 1 1"
  );
  addText(
    commands,
    PAGE_WIDTH - 250,
    PAGE_HEIGHT - 38,
    "REPORTE DE CAPACIDAD VOLUMETRICA",
    12,
    true,
    "1 1 1"
  );
  addText(
    commands,
    PAGE_WIDTH - 250,
    PAGE_HEIGHT - 57,
    `Tanque: ${documento?.tanque || documento?.codTanque || "-"}`,
    9,
    false,
    "1 1 1"
  );
  addText(
    commands,
    MARGIN,
    PAGE_HEIGHT - 105,
    `Producto: ${documento?.producto || "-"}     Fecha de calibracion: ${date(documento?.fechaCalibracion)}`,
    9
  );
  addText(
    commands,
    MARGIN,
    PAGE_HEIGHT - 120,
    `Compania de inspeccion: ${documento?.companiaInspeccion || "-"}`,
    9
  );
  const contacto = [
    empresa?.direccion,
    empresa?.telefono ? `Tel: ${empresa.telefono}` : "",
    empresa?.paginaWeb,
  ]
    .filter(Boolean)
    .join("   |   ");
  addText(commands, MARGIN, PAGE_HEIGHT - 135, contacto, 8);
  addText(commands, PAGE_WIDTH - 120, 20, `Pagina ${page} de ${total}`, 8);
  line(commands, MARGIN, 31, PAGE_WIDTH - MARGIN, 31);
}

function matrixPages(documento) {
  const rows = Array.isArray(documento?.detallesBase) ? documento.detallesBase : [];
  const feet = [...new Set(rows.map((row) => Number(row.pies ?? 0)))].sort((a, b) => a - b);
  const byHeight = new Map(
    rows.map((row) => [`${Number(row.pies)}-${Number(row.pulgadas)}`, row.volumen])
  );
  const chunks = [];
  for (let index = 0; index < feet.length || (index === 0 && feet.length === 0); index += 8)
    chunks.push(feet.slice(index, index + 8));
  return chunks.map((chunk) => ({ chunk, byHeight }));
}

export function downloadTankVolumetricCapacityPdf(documento, empresa) {
  const matrix = matrixPages(documento);
  const totalPages = matrix.length + 1;
  const pages = [];
  matrix.forEach(({ chunk, byHeight }, index) => {
    const commands = [];
    pageHeader(commands, empresa, documento, index + 1, totalPages);
    addText(commands, MARGIN, 450, "TABLA BASE DE CALIBRACION", 12, true);
    const startX = MARGIN;
    const startY = 420;
    const rowHeight = 23;
    const firstWidth = 70;
    const cellWidth = (PAGE_WIDTH - MARGIN * 2 - firstWidth) / 8;
    fill(commands, startX, startY, firstWidth + cellWidth * chunk.length, rowHeight);
    addText(commands, startX + 12, startY + 7, 'Pulgadas "', 8, true, "1 1 1");
    chunk.forEach((foot, column) =>
      addText(
        commands,
        startX + firstWidth + column * cellWidth + 8,
        startY + 7,
        `${foot}'`,
        8,
        true,
        "1 1 1"
      )
    );
    for (let inch = 0; inch < 12; inch += 1) {
      const y = startY - (inch + 1) * rowHeight;
      line(commands, startX, y, startX + firstWidth + cellWidth * chunk.length, y);
      line(commands, startX, y, startX, y + rowHeight);
      line(commands, startX + firstWidth, y, startX + firstWidth, y + rowHeight);
      addText(commands, startX + 26, y + 7, `${inch}"`, 8, true);
      chunk.forEach((foot, column) => {
        const x = startX + firstWidth + column * cellWidth;
        line(commands, x + cellWidth, y, x + cellWidth, y + rowHeight);
        const volume = byHeight.get(`${foot}-${inch}`);
        addText(commands, x + 7, y + 7, volume === undefined ? "-" : number(volume), 8);
      });
    }
    addText(
      commands,
      MARGIN,
      102,
      "Los valores corresponden a los registros de la tabla base de calibracion.",
      8
    );
    pages.push(commands.join("\n"));
  });
  const fractions = Array.isArray(documento?.detallesFracciones)
    ? [...documento.detallesFracciones].sort(
        (a, b) => Number(a.dieciseisavos) - Number(b.dieciseisavos)
      )
    : [];
  const commands = [];
  pageHeader(commands, empresa, documento, totalPages, totalPages);
  addText(commands, MARGIN, 450, "REFERENCIA DE DIECISEISAVOS", 12, true);
  addText(
    commands,
    MARGIN,
    434,
    "Incremento de volumen que se suma al valor base para cada fraccion.",
    9
  );
  const rowHeight = 28;
  const startY = 398;
  const tableWidth = 330;
  const numberWidth = 130;
  const drawFractionHeader = (x) => {
    fill(commands, x, startY, tableWidth, rowHeight);
    addText(commands, x + 12, startY + 9, "Dieciseisavos / 16", 9, true, "1 1 1");
    addText(commands, x + numberWidth + 12, startY + 9, "Volumen que representa", 9, true, "1 1 1");
  };
  const drawFractionRow = (fraction, index, x) => {
    const y = startY - (index + 1) * rowHeight;
    fill(
      commands,
      x,
      y,
      tableWidth,
      rowHeight,
      index % 2 === 0 ? "0.93 0.96 0.98" : "0.87 0.92 0.95"
    );
    line(commands, x + numberWidth, y, x + numberWidth, y + rowHeight);
    addText(commands, x + 12, y + 9, `${Number(fraction.dieciseisavos)}/16`, 9, true);
    addText(commands, x + numberWidth + 12, y + 9, number(fraction.volumen), 9);
  };
  const secondTableX = PAGE_WIDTH - MARGIN - tableWidth;
  drawFractionHeader(MARGIN);
  if (fractions.length > 8) drawFractionHeader(secondTableX);
  fractions.forEach((fraction, index) => {
    drawFractionRow(fraction, index % 8, index < 8 ? MARGIN : secondTableX);
  });
  addText(commands, MARGIN, 132, `Comentario: ${documento?.comentarios || "-"}`, 8);
  addText(
    commands,
    MARGIN,
    102,
    "Formula: volumen final = volumen base + incremento del dieciseisavo indicado.",
    8
  );
  pages.push(commands.join("\n"));

  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    `<< /Type /Pages /Kids [${pages.map((_, index) => `${5 + index * 2} 0 R`).join(" ")}] /Count ${pages.length} >>`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
  ];
  pages.forEach((content, index) => {
    const pageObject = 5 + index * 2;
    const contentObject = pageObject + 1;
    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentObject} 0 R >>`
    );
    objects.push(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`);
  });
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets
    .slice(1)
    .map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`)
    .join("")}trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  const archive = new Blob([pdf], { type: "application/pdf" });
  const url = URL.createObjectURL(archive);
  const link = document.createElement("a");
  link.href = url;
  link.download = `capacidad-volumetrica-${documento?.codCapacidadVolumetricaTanque ?? "detalle"}.pdf`;
  link.target = "_self";
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
