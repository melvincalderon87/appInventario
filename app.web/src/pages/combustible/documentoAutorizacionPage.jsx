import { useEffect, useState } from "react";
import { Field, Input, MessageBar, Spinner, Text, Title2 } from "@/components/ui/app-shadcn";
import { useLocation, useParams } from "react-router-dom";
import { AutorizacionCombustibleService } from "../../services/autorizacionCombustibleService";
import { EntradasProductoService } from "../../services/entradasProductoService";
import { getMenuThemeStyles, useMenuStyles } from "../../styles/pages/menu/menuPageStyles";

const etiquetas = {
  codigo: "Código",
  fecha: "Fecha",
  barco: "Barco",
  codigoInterno: "Código interno",
  correlativoOTSA: "Correlativo OTSA",
  suplidor: "Suplidor",
  suplidorOrigen: "Suplidor origen",
  suplidorDestino: "Suplidor destino",
  producto: "Producto",
  cantidadEstandar: "Cantidad estándar",
  cantidadAmbiente: "Cantidad ambiente",
  siglasUnidad: "Siglas de unidad",
};
const modulosPorRuta = [
  ["/autorizaciones/ingreso-barco/", 135, "Ingreso de Barco"],
  ["/entradasproducto/visualizar/", 147, "Entrada"],
  ["/salidas/visualizar/", 137, "Salida"],
  ["/compraventasuplidores/visualizar/", 138, "Compra Venta Suplidores"],
  ["/unidad/entrada/visualizar/", 159, "Entrada Unidad"],
  ["/unidad/salida/visualizar/", 160, "Salida Unidad"],
  ["/ajustes/entrada/visualizar/", 157, "Ajuste de Entrada"],
  ["/ajustes/salida/visualizar/", 158, "Ajuste de Salida"],
  ["/etanol/entradas/visualizar/", 164, "Entrada de Etanol"],
  ["/etanol/salidas/visualizar/", 165, "Salida de Etanol"],
  ["/etanol/compraventasuplidores/visualizar/", 166, "Compra Venta de Etanol"],
  ["/etanol/ingresotuberias/visualizar/", 167, "Ingreso por Tuberías de Etanol"],
  ["/etanol/unidad-entrada/visualizar/", 168, "Entrada por Unidad de Etanol"],
  ["/etanol/unidad-salida/visualizar/", 169, "Salida por Unidad de Etanol"],
  ["/etanol/ajuste-entrada/visualizar/", 170, "Ajuste de Entrada de Etanol"],
  ["/etanol/ajuste-salida/visualizar/", 171, "Ajuste de Salida de Etanol"],
];

function mostrarValor(campo, valor) {
  if (campo === "fecha" && valor) return new Intl.DateTimeFormat("es-GT").format(new Date(valor));
  if (["cantidadEstandar", "cantidadAmbiente"].includes(campo))
    return Number(valor ?? 0).toFixed(2);
  return valor || "-";
}

function CampoSoloLectura({ campo, valor }) {
  return (
    <Field label={etiquetas[campo] ?? campo}>
      <Input
        disabled
        value={mostrarValor(campo, valor)}
        style={
          ["cantidadEstandar", "cantidadAmbiente"].includes(campo)
            ? { textAlign: "right" }
            : undefined
        }
      />
    </Field>
  );
}

export default function DocumentoAutorizacionPage() {
  const styles = useMenuStyles();
  const theme = getMenuThemeStyles();
  const { codDocumento } = useParams();
  const location = useLocation();
  const [, codMenu, tituloModulo] =
    modulosPorRuta.find(([ruta]) => location.pathname.startsWith(ruta)) ?? [];
  const [documento, setDocumento] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const cargarDocumento = async () => {
      try {
        setError("");
        const detalle = await AutorizacionCombustibleService.documento(codMenu, codDocumento);
        setDocumento(detalle);
      } catch (loadError) {
        if (Number(codMenu) !== 147) {
          setError(loadError.message);
          return;
        }

        try {
          const listado = await EntradasProductoService.listado({
            page: 1,
            pageSize: 100,
            search: codDocumento,
          });
          const entrada = listado.items?.find(
            (item) => String(item.codEntradaProducto) === String(codDocumento)
          );
          if (!entrada) throw loadError;
          setDocumento({
            codigo: entrada.codEntradaProducto,
            fecha: entrada.fecha,
            suplidor: entrada.suplidor,
            producto: entrada.producto,
            cantidadEstandar: entrada.cantidadEstandar,
            cantidadAmbiente: entrada.cantidadAmbiente,
            siglasUnidad: entrada.siglasUnidad,
          });
        } catch {
          setError(loadError.message);
        }
      }
    };

    cargarDocumento();
  }, [codMenu, codDocumento]);

  return (
    <section className={styles.root}>
      <div>
        <Title2 className={styles.title}>Vista de {tituloModulo || "documento"}</Title2>
        <Text className={styles.subtitle}>Consulta de solo lectura.</Text>
      </div>
      {error ? <MessageBar intent="error">{error}</MessageBar> : null}
      <div className={styles.formSurface} style={theme.surface}>
        {!documento && !error ? (
          <div className={styles.loading}>
            <Spinner />
          </div>
        ) : documento ? (
          <div className={styles.formGrid}>
            {Object.entries(documento)
              .filter(([campo, valor]) => campo !== "detalles" && (campo !== "siglasUnidad" || valor))
              .map(([campo, valor]) => (
                <CampoSoloLectura key={campo} campo={campo} valor={valor} />
              ))}
            {Array.isArray(documento.detalles) && documento.detalles.length > 0 ? (
              <div style={{ gridColumn: "1 / -1", overflowX: "auto" }}>
                <Text weight="semibold">Detalle del ingreso</Text>
                <table style={{ width: "100%", minWidth: 620, marginTop: 12 }}>
                  <thead>
                    <tr>
                      <th>Línea</th>
                      <th>Suplidor</th>
                      <th>Producto</th>
                      <th>Cantidad estándar</th>
                      <th>Cantidad ambiente</th>
                    </tr>
                  </thead>
                  <tbody>
                    {documento.detalles.map((detalle) => (
                      <tr key={detalle.linea}>
                        <td>{detalle.linea}</td>
                        <td>{detalle.suplidor || "-"}</td>
                        <td>{detalle.producto || "-"}</td>
                        <td>{mostrarValor("cantidadEstandar", detalle.cantidadEstandar)}</td>
                        <td>{mostrarValor("cantidadAmbiente", detalle.cantidadAmbiente)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
