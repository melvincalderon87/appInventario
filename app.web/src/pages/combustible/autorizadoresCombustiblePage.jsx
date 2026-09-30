import { useEffect, useState } from "react";
import {
  Button,
  Combobox,
  Field,
  MessageBar,
  Option,
  Spinner,
  Text,
  Title2,
} from "@/components/ui/app-shadcn";
import { AutorizacionCombustibleService } from "../../services/autorizacionCombustibleService";
import { getMenuThemeStyles, useMenuStyles } from "../../styles/pages/menu/menuPageStyles";

export default function AutorizadoresCombustiblePage() {
  const styles = useMenuStyles();
  const theme = getMenuThemeStyles();
  const [asignaciones, setAsignaciones] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [menus, setMenus] = useState([]);
  const [usuario, setUsuario] = useState("");
  const [menu, setMenu] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const cargar = async () => {
    try {
      setLoading(true);
      const [datos, opciones] = await Promise.all([
        AutorizacionCombustibleService.listar(),
        AutorizacionCombustibleService.opciones(),
      ]);
      setAsignaciones(datos);
      setUsuarios(opciones.usuarios ?? []);
      setMenus(opciones.menus ?? []);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const asignar = async () => {
    if (!usuario || !menu) {
      setError("Seleccione usuario y módulo.");
      return;
    }

    try {
      setError("");
      await AutorizacionCombustibleService.asignar({ codUsuario: usuario, codMenu: Number(menu) });
      setUsuario("");
      setMenu("");
      await cargar();
    } catch (saveError) {
      setError(saveError.message);
    }
  };

  const textoSeleccionado = (opciones, valor) =>
    opciones.find((item) => String(item.value) === String(valor))?.text ?? "";

  return (
    <section className={styles.root}>
      <div>
        <Title2 className={styles.title}>Autorizadores de Documentos</Title2>
        <Text className={styles.subtitle}>
          Uno de los usuarios asignados puede aprobar cada documento. Ingreso Tuberías no requiere
          autorización.
        </Text>
      </div>

      {error ? <MessageBar intent="error">{error}</MessageBar> : null}

      <div className={styles.formSurface} style={theme.surface}>
        {loading ? (
          <div className={styles.loading}>
            <Spinner />
          </div>
        ) : (
          <>
            <div className={styles.formGrid}>
              <Field label="Usuario" required>
                <Combobox
                  selectedOptions={usuario ? [usuario] : []}
                  value={textoSeleccionado(usuarios, usuario)}
                  placeholder="Seleccione"
                  onOptionSelect={(_, data) => setUsuario(data.optionValue ?? "")}
                >
                  {usuarios.map((item) => (
                    <Option key={item.value} value={item.value}>
                      {item.text}
                    </Option>
                  ))}
                </Combobox>
              </Field>
              <Field label="Módulo" required>
                <Combobox
                  selectedOptions={menu ? [menu] : []}
                  value={textoSeleccionado(menus, menu)}
                  placeholder="Seleccione"
                  onOptionSelect={(_, data) => setMenu(data.optionValue ?? "")}
                >
                  {menus.map((item) => (
                    <Option key={item.value} value={item.value}>
                      {item.text}
                    </Option>
                  ))}
                </Combobox>
              </Field>
            </div>
            <div className={styles.buttonRow}>
              <Button appearance="primary" onClick={asignar}>
                Asignar autorizador
              </Button>
            </div>

            <div
              className={styles.menuTableSurface}
              style={{ ...theme.surface, marginTop: "20px" }}
            >
              <div className={styles.menuTableScroll}>
                <table className={styles.menuTable} style={{ minWidth: "600px" }}>
                  <thead>
                    <tr>
                      <th className={styles.menuHeaderCell}>
                        <span className={styles.menuHeaderContent}>Módulo</span>
                      </th>
                      <th className={styles.menuHeaderCell}>
                        <span className={styles.menuHeaderContent}>Usuario autorizador</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {asignaciones.map((item, index) => (
                      <tr
                        key={`${item.codMenu}-${item.codUsuario}-${index}`}
                        className={styles.menuRow}
                      >
                        <td className={styles.menuCell}>{item.modulo}</td>
                        <td className={styles.menuCell}>{item.nombre}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
