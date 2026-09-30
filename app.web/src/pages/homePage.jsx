import { useEffect, useState } from "react";
import { useMainLayoutStyles } from "../styles/layouts/mainLayoutStyles";
import { ConfiguracionSistemaService } from "../services/configuracionSistemaService";

const homeBackgroundBaseStyle = {
  minHeight: "calc(100vh - 96px)",
  margin: "-20px",
  backgroundSize: "cover",
  backgroundPosition: "center",
  backgroundRepeat: "no-repeat",
};

function HomePage() {
  const styles = useMainLayoutStyles();
  const [backgroundUrl, setBackgroundUrl] = useState("");

  useEffect(() => {
    let isMounted = true;

    ConfiguracionSistemaService.fondoInfo()
      .then((info) => {
        if (isMounted && info?.tieneFondo) {
          setBackgroundUrl(ConfiguracionSistemaService.fondoUrl(info.version));
        }
      })
      .catch(() => {
        if (isMounted) setBackgroundUrl("");
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div
      className={styles.page}
      style={
        backgroundUrl
          ? {
              ...homeBackgroundBaseStyle,
              backgroundImage: `url("${backgroundUrl}")`,
            }
          : undefined
      }
    >
      {/* La alerta se muestra ahora en la barra superior, junto al idioma.
        <MessageBar intent="warning">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
            <div><Text weight="semibold">Tiene {pendientes.length || 2} documento(s) pendiente(s) de autorizar.</Text><Text style={{ display: "block", marginTop: "4px" }}>{pendientes.length ? "Revise y apruebe o rechace los documentos asignados." : "Ejemplo temporal de alerta para visualizar el diseño."}</Text></div>
            <Button appearance="primary" onClick={() => navigate("/combustible/autorizadores")}>Ver pendientes</Button>
          </div>
        </MessageBar>
      </div> : null}
      */}
    </div>
  );
}

export default HomePage;
