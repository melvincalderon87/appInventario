import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Spinner } from "@/components/ui/app-shadcn";
import { useTranslation } from "react-i18next";
import { validarPantalla, validarSesion } from "../services/authService";
import { PermisosPantallaProvider } from "../context/permisosPantallaContext";
import { usePrivateRouteStyles } from "../styles/routes/privateRouteStyles";

function PrivateRoute({ children, validarPermisoPantalla = false }) {
  const styles = usePrivateRouteStyles();
  const { t } = useTranslation();
  const location = useLocation();
  const [access, setAccess] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function validateAccess() {
      const authenticated = await validarSesion();

      if (!authenticated) {
        if (isMounted) {
          setAccess({ authenticated: false, authorized: false });
        }

        return;
      }

      if (validarPermisoPantalla) {
        const result = await validarPantalla({ ruta: location.pathname });

        if (isMounted) {
          setAccess({
            authenticated: result.authenticated,
            authorized: result.authorized,
            permisos: result.permisos ?? null,
          });
        }

        return;
      }

      if (isMounted) {
        setAccess({ authenticated: true, authorized: true });
      }
    }

    validateAccess();

    return () => {
      isMounted = false;
    };
  }, [location.pathname, validarPermisoPantalla]);

  if (access === null) {
    return (
      <div className={styles.container}>
        <Spinner label={t("validatingSession")} />
      </div>
    );
  }

  if (!access.authenticated) {
    return <Navigate to="/" replace />;
  }

  if (!access.authorized) {
    return <Navigate to="/inicio" replace />;
  }

  return <PermisosPantallaProvider permisos={access.permisos}>{children}</PermisosPantallaProvider>;
}

export default PrivateRoute;
