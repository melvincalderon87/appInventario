import { useEffect, useState } from "react";
import { Button, Field, Input, MessageBar, Spinner, Title2 } from "@/components/ui/app-shadcn";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { LocalizedDateInput } from "../../components/common/LocalizedDateInput";
import { EtanolMovimientoService } from "../../services/etanolMovimientoService";
import {
  getSalidasActionPageThemeStyles,
  useSalidasActionPageStyles,
} from "../../styles/pages/salidas/salidasActionPageStyles";
import { etanolModuloDesdeRuta } from "./etanolModulo";

const vacio = {
  codigo: 0,
  fecha: "",
  codSuplidor: "",
  codSuplidorOrigen: "",
  codSuplidorDestino: "",
  codProducto: "",
  codBarco: 0,
  cantidadEstandar: 0,
  cantidadAmbiente: 0,
  siglasUnidad: "",
};
export default function EtanolMovimientoAgregarPage() {
  const styles = useSalidasActionPageStyles();
  const themeStyles = getSalidasActionPageThemeStyles();
  const location = useLocation();
  const navigate = useNavigate();
  const { codigo } = useParams();
  const editando = Boolean(codigo);
  const modulo = etanolModuloDesdeRuta(location.pathname);
  const traslado = modulo.tipo === "compraventa";
  const tuberias = modulo.tipo === "tuberias";
  const [dato, setDato] = useState(vacio);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  useEffect(() => {
    let activo = true;
    const cargar = editando
      ? EtanolMovimientoService.obtener(modulo.tipo, codigo)
      : EtanolMovimientoService.obtenerKey(modulo.tipo).then((r) => ({
          ...vacio,
          codigo: Number(r.codigo || 0),
        }));
    cargar
      .then((r) => activo && setDato({ ...vacio, ...r, fecha: r.fecha?.slice(0, 10) || "" }))
      .catch((e) => activo && setError(e.message))
      .finally(() => activo && setCargando(false));
    return () => {
      activo = false;
    };
  }, [modulo.tipo, codigo, editando]);
  const cambiar = (campo) => (_, d) => setDato((x) => ({ ...x, [campo]: d.value }));
  const guardar = async () => {
    try {
      setGuardando(true);
      setError("");
      const movimiento = {
        ...dato,
        codBarco: Number(dato.codBarco || 0),
        cantidadEstandar: Number(dato.cantidadEstandar || 0),
        cantidadAmbiente: Number(dato.cantidadAmbiente || 0),
      };
      await (editando
        ? EtanolMovimientoService.editar(modulo.tipo, movimiento)
        : EtanolMovimientoService.agregar(modulo.tipo, movimiento));
      setMensaje(
        editando ? "Edición enviada para autorización." : "Movimiento de etanol guardado."
      );
    } catch (e) {
      setError(e.message);
    } finally {
      setGuardando(false);
    }
  };
  return (
    <section className={styles.root}>
      <div className={styles.toolbar}>
        <Title2 className={styles.title}>
          {editando ? `Editar ${modulo.titulo}` : modulo.titulo}
        </Title2>
        <Button onClick={() => navigate(`/etanol/${modulo.segmento}/listar`)}>Regresar</Button>
      </div>
      {error ? <MessageBar intent="error">{error}</MessageBar> : null}
      {mensaje ? <MessageBar intent="success">{mensaje}</MessageBar> : null}
      <div className={styles.formSurface} style={themeStyles.surface}>
        {cargando ? (
          <Spinner />
        ) : (
          <>
            <div className={styles.formGrid}>
              <Field label="Código">
                <Input value={String(dato.codigo)} disabled />
              </Field>
              <Field label="Fecha" required>
                <LocalizedDateInput value={dato.fecha} onChange={cambiar("fecha")} />
              </Field>
              {traslado ? (
                <>
                  <Field label="Suplidor origen" required>
                    <Input value={dato.codSuplidorOrigen} onChange={cambiar("codSuplidorOrigen")} />
                  </Field>
                  <Field label="Suplidor destino" required>
                    <Input
                      value={dato.codSuplidorDestino}
                      onChange={cambiar("codSuplidorDestino")}
                    />
                  </Field>
                </>
              ) : (
                <Field label="Suplidor" required>
                  <Input value={dato.codSuplidor} onChange={cambiar("codSuplidor")} />
                </Field>
              )}
              {tuberias ? (
                <Field label="Barco" required>
                  <Input
                    type="number"
                    value={String(dato.codBarco || "")}
                    onChange={cambiar("codBarco")}
                  />
                </Field>
              ) : null}
              <Field label="Producto de Etanol" required>
                <Input value={dato.codProducto} onChange={cambiar("codProducto")} />
              </Field>
              {!traslado && !tuberias ? (
                <Field label="Siglas de unidad">
                  <Input value={dato.siglasUnidad} onChange={cambiar("siglasUnidad")} />
                </Field>
              ) : null}
              <Field label="Cantidad estándar">
                <Input
                  type="number"
                  min="0"
                  value={String(dato.cantidadEstandar)}
                  onChange={cambiar("cantidadEstandar")}
                />
              </Field>
              <Field label="Cantidad ambiente">
                <Input
                  type="number"
                  min="0"
                  value={String(dato.cantidadAmbiente)}
                  onChange={cambiar("cantidadAmbiente")}
                />
              </Field>
            </div>
            <div className={styles.buttonRow}>
              <Button appearance="primary" disabled={guardando} onClick={guardar}>
                {guardando ? "Guardando..." : editando ? "Enviar a autorización" : "Guardar"}
              </Button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
