import { useEffect, useState } from "react";
import {
  Combobox,
  Field,
  Input,
  MessageBar,
  Option,
  Spinner,
  Text,
  Title2,
} from "@/components/ui/app-shadcn";
import { useNavigate } from "react-router-dom";
import { ListActionButton } from "../../components/common/ListActionButton";
import { SuplidorService } from "../../services/suplidorService";
import { ProductoService } from "../../services/productoService";
import { VentaService } from "../../services/ventaService";
import { leerPlantillaVentas } from "../../utils/ventaExcel";
import { getMenuThemeStyles, useMenuStyles } from "../../styles/pages/menu/menuPageStyles";

const currentMonth = () => new Date().toISOString().slice(0, 7);
const productosPlantilla = {
  super: "MOGAS 95",
  regular: "MOGAS 91",
  diesel: "ULSD",
  etanol: "Etanol",
};

export default function VentaPlantillaPage() {
  const styles = useMenuStyles();
  const theme = getMenuThemeStyles();
  const navigate = useNavigate();
  const [suplidores, setSuplidores] = useState([]);
  const [productos, setProductos] = useState([]);
  const [codSuplidor, setCodSuplidor] = useState("");
  const [periodo, setPeriodo] = useState(currentMonth());
  const [archivo, setArchivo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    Promise.all([SuplidorService.ListarOpcion(), ProductoService.ListarOpcion()])
      .then(([s, p]) => {
        setSuplidores(s);
        setProductos(p);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);
  const cargar = async () => {
    if (!codSuplidor || !archivo) return setError("Seleccione suplidor y archivo.");
    try {
      setSaving(true);
      setError("");
      const datos = await leerPlantillaVentas(archivo, periodo);
      for (const [tipo, nombre] of Object.entries(productosPlantilla)) {
        const codProducto = productos.find(
          (p) => String(p.text).trim().toUpperCase() === nombre.toUpperCase()
        )?.value;
        if (!codProducto) throw new Error(`No existe el producto ${nombre}.`);
        await VentaService.agregar({
          periodo: `${periodo}-01`,
          codSuplidor,
          codProducto,
          detalles: datos[tipo],
        });
      }
      navigate("/ventas/listar");
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };
  return (
    <section className={styles.root}>
      <div className={styles.header}>
        <div>
          <Title2 className={styles.title}>Cargar plantilla de ventas</Title2>
          <Text className={styles.subtitle}>
            Suba la plantilla descargada con Super, Regular, Diesel y Etanol.
          </Text>
        </div>
        <ListActionButton
          action="regresar"
          label="Regresar"
          text="Regresar"
          onClick={() => navigate("/ventas/listar")}
        />
      </div>
      {error && <MessageBar intent="error">{error}</MessageBar>}
      <div className={styles.formSurface} style={theme.surface}>
        {loading ? (
          <div className={styles.loading}>
            <Spinner label="Cargando opciones..." />
          </div>
        ) : (
          <>
            <div className={styles.formGrid}>
              <Field label="Mes" required>
                <Input
                  type="month"
                  value={periodo}
                  onChange={(_, data) => setPeriodo(data.value)}
                />
              </Field>
              <Field label="Suplidor" required>
                <Combobox
                  selectedOptions={codSuplidor ? [codSuplidor] : []}
                  value={
                    suplidores.find((s) => String(s.value) === String(codSuplidor))?.text ?? ""
                  }
                  placeholder="Seleccione"
                  onOptionSelect={(_, data) => setCodSuplidor(data.optionValue ?? "")}
                >
                  {suplidores.map((s) => (
                    <Option key={s.value} value={s.value} text={s.text}>
                      {s.text}
                    </Option>
                  ))}
                </Combobox>
              </Field>
              <Field label="Archivo Excel" required>
                <Input
                  type="file"
                  accept=".xlsx"
                  onChange={(event) => setArchivo(event.target.files?.[0] ?? null)}
                />
              </Field>
            </div>
            <div className={styles.buttonRow}>
              <ListActionButton
                action="cargar"
                label="Cargar plantilla"
                text={saving ? "Cargando..." : "Cargar plantilla"}
                disabled={saving}
                onClick={cargar}
              />
            </div>
          </>
        )}
      </div>
    </section>
  );
}
