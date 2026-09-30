import { useState } from "react";
import { useLocation } from "react-router-dom";
import { DateTime } from "luxon";
import { Button, Field, MessageBar, Spinner, Text, Title2 } from "@/components/ui/app-shadcn";
import { Download } from "lucide-react";
import { LocalizedDateInput } from "../../components/common/LocalizedDateInput";
import { ReportesService } from "../../services/reportesService";
import { getMenuThemeStyles, useMenuStyles } from "../../styles/pages/menu/menuPageStyles";
import { exportExcel, exportPdf } from "../../utils/reportesExport";

const firstDay = () => DateTime.local().startOf("month").toISODate();
const lastDay = () => DateTime.local().endOf("month").toISODate();
const format = (value, digits = 2) => Number(value || 0).toLocaleString("es-GT", { minimumFractionDigits: digits, maximumFractionDigits: digits });

export default function ReporteCargaRoute() {
  const { pathname } = useLocation();

  return <ReporteCargaPage key={pathname} />;
}

function ReporteCargaPage() {
  const styles = useMenuStyles();
  const theme = getMenuThemeStyles();
  const barcos = useLocation().pathname.endsWith("ingresos-barco");
  const [tipo, setTipo] = useState("ambiente");
  const ambiente = tipo === "ambiente";
  const tipoTexto = ambiente ? "Ambiente" : "Standard";
  const titulo = barcos ? `Reporte de Ingresos de Barcos - ${tipoTexto}` : `Reporte de Carga por ${tipoTexto}`;
  const subtitulo = barcos ? "Ingresos registrados según la fecha de ingreso del barco." : "Datos de carga obtenidos del servidor BI según la fecha del folio.";
  const headers = barcos ? ["Fecha", "Ingreso", "Barco", "Código interno", "Suplidor", "Producto", `Cantidad cargada ${tipoTexto}`] : ["Fecha de carga", "Folio", "CodCliente", "Cliente", "Unidad", "Piloto", "Producto TMS", "Factor", "VCF", `Cantidad cargada ${tipoTexto}`];
  const [fechaInicial, setFechaInicial] = useState(firstDay);
  const [fechaFinal, setFechaFinal] = useState(lastDay);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formato, setFormato] = useState("excel");

  const consultar = async () => {
    if (!fechaInicial || !fechaFinal || fechaInicial > fechaFinal) {
      setError("Seleccione un rango de fechas válido.");
      return;
    }
    try {
      setLoading(true);
      setError("");
      const resultado = barcos ? await ReportesService.ingresosBarco(tipo, fechaInicial, fechaFinal) : await ReportesService.carga(tipo, fechaInicial, fechaFinal);
      if (!resultado?.length) {
        setError("No existen registros para el rango de fechas y tipo seleccionados.");
        return;
      }
      const valores = resultado.map((row) => barcos ? [String(row.fechaIngreso || "").slice(0, 10), row.codigoIngreso, row.barco, row.codigoInterno, row.suplidor, row.producto, format(row.cantidadCargada)] : [String(row.fechaCarga || "").slice(0, 10), row.folio, row.codCliente, row.cliente, row.unidad, row.piloto, row.productoTms, format(row.factor, 6), format(row.vcf, 6), format(row.cantidadCargada)]);
      const tituloArchivo = `${titulo} | ${fechaInicial} al ${fechaFinal}`;
      const nombreArchivo = `${barcos ? "Ingresos-Barcos" : "Reporte-Carga"}-${tipoTexto}-${fechaInicial}-${fechaFinal}`;
      if (formato === "pdf") await exportPdf(tituloArchivo, headers, valores, nombreArchivo);
      else await exportExcel(tituloArchivo, headers, valores, nombreArchivo);
    } catch (requestError) {
      setError(requestError.message || "No fue posible obtener el reporte.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <section className={styles.root}>
      <div className={styles.header}>
        <div><Title2 className={styles.title}>{titulo}</Title2><Text className={styles.subtitle}>{subtitulo}</Text></div>
      </div>
      {error && <MessageBar intent="error">{error}</MessageBar>}
      <div className={styles.listSurface} style={theme.surface}>
        <div style={{ display: "flex", alignItems: "end", gap: 12, padding: 20, flexWrap: "wrap" }}>
          <Field label="Fecha inicial" required><LocalizedDateInput value={fechaInicial} onChange={(_, data) => setFechaInicial(data.value)} /></Field>
          <Field label="Fecha final" required><LocalizedDateInput value={fechaFinal} onChange={(_, data) => setFechaFinal(data.value)} /></Field>
          <Field label="Tipo" required><select value={tipo} onChange={(event) => setTipo(event.target.value)} style={{ minHeight: 32, padding: "0 8px" }}><option value="ambiente">Ambiente</option><option value="estandar">Standard</option></select></Field>
          <Field label="Generar en" required><select value={formato} onChange={(event) => setFormato(event.target.value)} style={{ minHeight: 32, padding: "0 8px" }}><option value="excel">Excel</option><option value="pdf">PDF</option></select></Field>
          <Button appearance="primary" icon={loading ? <Spinner /> : <Download />} disabled={loading} onClick={consultar}>{loading ? "Generando..." : "Generar reporte"}</Button>
        </div>
      </div>
    </section>
  );
}
