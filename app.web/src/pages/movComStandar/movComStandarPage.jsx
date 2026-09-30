import { useState } from "react";
import { useTranslation } from "react-i18next";
import { DateTime } from "luxon";
import { Button, Field, MessageBar, Spinner, Text, Title2 } from "@/components/ui/app-shadcn";
import { Download } from "lucide-react";
import { MovComStandarService } from "../../services/movComStandarService";
import { downloadMovComStandarExcel } from "../../utils/movComStandarExcel";
import { getMenuThemeStyles, useMenuStyles } from "../../styles/pages/menu/menuPageStyles";
import { LocalizedDateInput } from "../../components/common/LocalizedDateInput";

const firstDayOfCurrentMonth = () => DateTime.local().startOf("month").toISODate();
const currentDay = () => DateTime.local().toISODate();
const parseIsoDate = (value) => DateTime.fromISO(String(value ?? ""), { zone: "local" });

export default function MovComStandarPage() {
  const styles = useMenuStyles();
  const { i18n } = useTranslation();
  const english = i18n.language.toLowerCase().startsWith("en");
  const theme = getMenuThemeStyles();
  const [fechaInicial, setFechaInicial] = useState(firstDayOfCurrentMonth);
  const [fechaFinal, setFechaFinal] = useState(currentDay);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const descargar = async () => {
    if (!fechaInicial || !fechaFinal) {
      setError("Seleccione las fechas inicial y final.");
      return;
    }
    const inicio = parseIsoDate(fechaInicial);
    const fin = parseIsoDate(fechaFinal);
    if (!inicio.isValid || !fin.isValid) {
      setError("Ingrese fechas válidas.");
      return;
    }
    if (inicio > fin) {
      setError("La fecha inicial no puede ser mayor que la fecha final.");
      return;
    }
    try {
      setLoading(true);
      setError("");
      const consultarOpcional = (consulta) => consulta();
      const [
        rows,
        rowsAmbiente,
        ingresosBarco,
        ingresosBarcoAmbiente,
        movimientosUnidad,
        movimientosUnidadAmbiente,
        entradasUnidadEtanol,
        entradasUnidadEtanolAmbiente,
        compraVentaSuplidores,
        compraVentaSuplidoresAmbiente,
        tanques,
        aditivos,
        consumosBi,
        consumosBiDiarios,
        consumosBiDiariosAmbiente,
        consumosBiDiariosEtanol,
        consumosBiDiariosEtanolAmbiente,
        consumosBiDiariosCombustibles,
        consumosBiDiariosCombustiblesAmbiente,
      ] = await Promise.all([
        MovComStandarService.generar(fechaInicial, fechaFinal),
        consultarOpcional(() => MovComStandarService.generarAmbiente(fechaInicial, fechaFinal)),
        consultarOpcional(() => MovComStandarService.ingresosBarco(fechaInicial, fechaFinal)),
        consultarOpcional(() =>
          MovComStandarService.ingresosBarcoAmbiente(fechaInicial, fechaFinal)
        ),
        consultarOpcional(() => MovComStandarService.movimientosUnidad(fechaInicial, fechaFinal)),
        consultarOpcional(() =>
          MovComStandarService.movimientosUnidadAmbiente(fechaInicial, fechaFinal)
        ),
        consultarOpcional(() => MovComStandarService.entradasUnidadEtanol(fechaInicial, fechaFinal)),
        consultarOpcional(() => MovComStandarService.entradasUnidadEtanol(fechaInicial, fechaFinal, true)),
        consultarOpcional(() =>
          MovComStandarService.compraVentaSuplidores(fechaInicial, fechaFinal)
        ),
        consultarOpcional(() =>
          MovComStandarService.compraVentaSuplidoresAmbiente(fechaInicial, fechaFinal)
        ),
        consultarOpcional(() => MovComStandarService.tanques(fechaInicial, fechaFinal)),
        consultarOpcional(() => MovComStandarService.aditivos(fechaInicial, fechaFinal)),
        consultarOpcional(() => MovComStandarService.consumosBiAditivos(fechaInicial, fechaFinal)),
        consultarOpcional(() =>
          MovComStandarService.consumosBiDiariosAditivos(fechaInicial, fechaFinal)
        ),
        consultarOpcional(() =>
          MovComStandarService.consumosBiDiariosAditivosAmbiente(fechaInicial, fechaFinal)
        ),
        consultarOpcional(() =>
          MovComStandarService.consumosBiDiariosEtanol(fechaInicial, fechaFinal)
        ),
        consultarOpcional(() =>
          MovComStandarService.consumosBiDiariosEtanolAmbiente(fechaInicial, fechaFinal)
        ),
        consultarOpcional(() =>
          MovComStandarService.consumosBiDiariosCombustibles(fechaInicial, fechaFinal)
        ),
        consultarOpcional(() =>
          MovComStandarService.consumosBiDiariosCombustiblesAmbiente(fechaInicial, fechaFinal)
        ),
      ]);
      const aditivosConConsumos = new Map(aditivos.map((item) => [item.codProducto, item]));
      consumosBi.forEach((item) =>
        aditivosConConsumos.set(item.codProducto, {
          ...(aditivosConConsumos.get(item.codProducto) ?? {
            codProducto: item.codProducto,
            producto: item.producto,
            saldoInicial: 0,
            otrosIngresos: 0,
            otrasSalidas: 0,
            finalFisicoTanques: 0,
          }),
          consumosBi: item.consumos,
        })
      );
      await downloadMovComStandarExcel(
        rows,
        fechaInicial,
        fechaFinal,
        ingresosBarco,
        movimientosUnidad,
        compraVentaSuplidores,
        tanques,
        [...aditivosConConsumos.values()],
        consumosBiDiarios,
        consumosBiDiariosEtanol,
        consumosBiDiariosCombustibles,
        rowsAmbiente,
        ingresosBarcoAmbiente,
        movimientosUnidadAmbiente,
        compraVentaSuplidoresAmbiente,
        consumosBiDiariosAmbiente,
        consumosBiDiariosEtanolAmbiente,
        consumosBiDiariosCombustiblesAmbiente,
        entradasUnidadEtanol,
        entradasUnidadEtanolAmbiente
      );
    } catch (requestError) {
      setError(requestError.message || "No fue posible generar MovCom.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <section className={styles.root}>
      <div className={styles.header}>
        <div>
          <Title2 className={styles.title}>Movcom</Title2>
          <Text className={styles.subtitle}>
            Reporte de inventario teórico agrupado por socio, disponible en PDF.
          </Text>
        </div>
      </div>
      {error && <MessageBar intent="error">{error}</MessageBar>}
      <div className={styles.listSurface} style={theme.surface}>
        <div style={{ display: "flex", alignItems: "end", gap: 12, padding: 20, flexWrap: "wrap" }}>
          <Field label={english ? "Start date" : "Fecha inicial"} required>
            <LocalizedDateInput
              value={fechaInicial}
              onChange={(_, data) => setFechaInicial(data.value)}
            />
          </Field>
          <Field label={english ? "End date" : "Fecha final"} required>
            <LocalizedDateInput
              value={fechaFinal}
              onChange={(_, data) => setFechaFinal(data.value)}
            />
          </Field>
          <Button
            appearance="primary"
            icon={loading ? <Spinner /> : <Download />}
            disabled={loading}
            onClick={descargar}
          >
            {loading
              ? english
                ? "Generating..."
                : "Generando..."
              : english
                ? "Download Excel"
                : "Descargar Excel"}
          </Button>
        </div>
      </div>
      {loading && (
        <div className={styles.listSurface}>
          <Spinner label="Generando reporte de MovCom..." />
        </div>
      )}
    </section>
  );
}
