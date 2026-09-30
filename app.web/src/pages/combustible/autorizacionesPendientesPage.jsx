import { useEffect, useState } from "react";
import {
  Button,
  Combobox,
  Input,
  MessageBar,
  Option,
  Spinner,
  Text,
  Title2,
} from "@/components/ui/app-shadcn";
import { AutorizacionCombustibleService } from "../../services/autorizacionCombustibleService";
import { getMenuThemeStyles, useMenuStyles } from "../../styles/pages/menu/menuPageStyles";
import { assetUrl } from "../../utils/assets";

const linkIconUrl = assetUrl("images/Link.svg");
const rutasVista = {
  135: "/autorizaciones/ingreso-barco",
  147: "/entradasproducto/visualizar",
  137: "/salidas/visualizar",
  138: "/compraventasuplidores/visualizar",
  159: "/unidad/entrada/visualizar",
  160: "/unidad/salida/visualizar",
  157: "/ajustes/entrada/visualizar",
  158: "/ajustes/salida/visualizar",
  164: "/etanol/entradas/visualizar",
  165: "/etanol/salidas/visualizar",
  166: "/etanol/compraventasuplidores/visualizar",
  167: "/etanol/ingresotuberias/visualizar",
  168: "/etanol/unidad-entrada/visualizar",
  169: "/etanol/unidad-salida/visualizar",
  170: "/etanol/ajuste-entrada/visualizar",
  171: "/etanol/ajuste-salida/visualizar",
};

export default function AutorizacionesPendientesPage() {
  const styles = useMenuStyles();
  const theme = getMenuThemeStyles();
  const [pendientes, setPendientes] = useState([]);
  const [estados, setEstados] = useState({});
  const [comentarios, setComentarios] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const cargar = async () => {
    try {
      setLoading(true);
      const documentos = await AutorizacionCombustibleService.pendientes();
      setPendientes(documentos);
      setEstados(
        Object.fromEntries(
          (documentos ?? []).map((item) => [
            `${item.codMenu}-${item.codDocumento}`,
            item.estado || "Pendiente",
          ])
        )
      );
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const actualizar = async (documento) => {
    try {
      setError("");
      const estado = estados[`${documento.codMenu}-${documento.codDocumento}`] || "Pendiente";
      const comentario =
        comentarios[`${documento.codMenu}-${documento.codDocumento}`]?.trim() || "";
      if (estado !== "Pendiente" && !comentario) {
        setError("Debe ingresar un comentario para autorizar o rechazar el documento.");
        return;
      }
      await AutorizacionCombustibleService.resolver({ ...documento, estado, comentario });
      await cargar();
    } catch (saveError) {
      setError(saveError.message);
    }
  };

  const abrirDocumento = (documento) => {
    const ruta = rutasVista[documento.codMenu];
    if (ruta) {
      const base = window.location.href.split("#")[0];
      window.open(
        `${base}#${ruta}/${encodeURIComponent(documento.codDocumento)}`,
        "_blank",
        "noopener,noreferrer"
      );
    }
  };

  return (
    <section className={styles.root}>
      <div>
        <Title2 className={styles.title}>Autorizaciones pendientes</Title2>
        <Text className={styles.subtitle}>
          Documentos asignados a su usuario para aprobar o rechazar.
        </Text>
      </div>
      {error ? <MessageBar intent="error">{error}</MessageBar> : null}
      <div className={styles.formSurface} style={theme.surface}>
        {loading ? (
          <div className={styles.loading}>
            <Spinner />
          </div>
        ) : pendientes.length === 0 ? (
          <Text className={styles.empty}>No tiene documentos pendientes de autorizar.</Text>
        ) : (
          <div className={styles.menuTableSurface} style={theme.surface}>
            <div className={styles.menuTableScroll}>
              <table className={styles.menuTable} style={{ minWidth: "600px" }}>
                <thead>
                  <tr>
                    <th className={styles.menuHeaderCell}>
                      <span className={styles.menuHeaderContent}>Módulo</span>
                    </th>
                    <th className={styles.menuHeaderCell}>
                      <span className={styles.menuHeaderContent}>Documento</span>
                    </th>
                    <th className={`${styles.menuHeaderCell} ${styles.menuActionsCell}`}>
                      <span className={styles.menuHeaderContent}>Acción</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pendientes.map((item) => {
                    const clave = `${item.codMenu}-${item.codDocumento}`;
                    const estado = estados[clave] || "Pendiente";
                    return (
                      <tr key={clave} className={styles.menuRow}>
                        <td className={styles.menuCell}>{item.modulo}</td>
                        <td className={styles.menuCell}>
                          <span className={styles.masterCell}>
                            <Button
                              size="small"
                              appearance="subtle"
                              icon={
                                <img src={linkIconUrl} alt="" className={styles.masterArrowImage} />
                              }
                              aria-label={`Ver documento ${item.codDocumento}`}
                              title="Ver documento en otra pestaña"
                              className={styles.documentLinkButton}
                              onClick={() => abrirDocumento(item)}
                            />
                            <span>{item.codDocumento}</span>
                          </span>
                        </td>
                        <td className={`${styles.menuCell} ${styles.menuActionsCell}`}>
                          <div className={styles.actionCell}>
                            <div className={styles.tableActions}>
                              <Combobox
                                size="small"
                                selectedOptions={[estado]}
                                value={estado === "Aprobado" ? "Autorizar" : estado}
                                onOptionSelect={(_, data) =>
                                  setEstados((actual) => ({
                                    ...actual,
                                    [clave]: data.optionValue ?? "Pendiente",
                                  }))
                                }
                                className={styles.authorizationStatusCombo}
                              >
                                <Option value="Pendiente">Pendiente</Option>
                                <Option value="Aprobado">Autorizar</Option>
                                <Option value="Rechazado">Rechazar</Option>
                              </Combobox>
                              <Input
                                size="small"
                                value={comentarios[clave] || ""}
                                placeholder="Comentario requerido"
                                onChange={(_, data) =>
                                  setComentarios((actual) => ({ ...actual, [clave]: data.value }))
                                }
                              />
                              <Button
                                size="small"
                                appearance="primary"
                                onClick={() => actualizar(item)}
                              >
                                Actualizar
                              </Button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
