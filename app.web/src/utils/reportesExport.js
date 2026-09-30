const save = (blob, name) => { const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = name; link.click(); URL.revokeObjectURL(url); };
export async function exportExcel(title, headers, rows, fileName) {
  const { default: ExcelJS } = await import("exceljs/dist/exceljs.min.js");
  const book = new ExcelJS.Workbook(); const sheet = book.addWorksheet("Reporte");
  sheet.addRow([title]); sheet.mergeCells(1, 1, 1, headers.length); sheet.getCell("A1").font = { bold: true, size: 14 };
  const header = sheet.addRow(headers); header.font = { bold: true }; rows.forEach((row) => sheet.addRow(row)); sheet.columns.forEach((column) => { column.width = 18; });
  save(new Blob([await book.xlsx.writeBuffer()], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), `${fileName}.xlsx`);
}
export async function exportPdf(title, headers, rows, fileName) {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
  const pdf = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  pdf.setFontSize(14); pdf.text(title, 36, 34);
  autoTable(pdf, { head: [headers], body: rows, startY: 48, styles: { fontSize: 7, cellPadding: 4 }, headStyles: { fillColor: [31, 78, 120], textColor: 255 }, margin: { left: 28, right: 28 }, didDrawPage: () => { pdf.setFontSize(7); pdf.text(`Página ${pdf.getNumberOfPages()}`, 780, 580, { align: "right" }); } });
  pdf.save(`${fileName}.pdf`);
}
