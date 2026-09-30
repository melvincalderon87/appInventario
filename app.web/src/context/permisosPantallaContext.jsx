import { createContext, useContext, useMemo } from "react";

/* eslint-disable react-refresh/only-export-components */

const PermisosPantallaContext = createContext({
  permisos: null,
  tienePermiso: () => false,
});

function normalizePermissionValue(value) {
  return (
    String(value ?? "")
      .trim()
      .toUpperCase() === "SI"
  );
}

export function PermisosPantallaProvider({ children, permisos }) {
  const value = useMemo(
    () => ({
      permisos,
      tienePermiso: (permiso) => {
        const key = String(permiso ?? "").toLowerCase() === "listar" ? "listado" : String(permiso ?? "");
        const pascalKey = key ? key.charAt(0).toUpperCase() + key.slice(1) : key;
        return normalizePermissionValue(permisos?.[key] ?? permisos?.[pascalKey]);
      },
    }),
    [permisos]
  );

  return (
    <PermisosPantallaContext.Provider value={value}>{children}</PermisosPantallaContext.Provider>
  );
}

export function usePermisosPantalla() {
  return useContext(PermisosPantallaContext);
}
