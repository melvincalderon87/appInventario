import { Navigate, Route } from "react-router-dom";
import { ValidarPermiso } from "./ValidarPermiso";
import { lazyPage } from "./lazyPage";

export const permisoRoutes = [
  <Route
    key="rol-permisos-root"
    path="/rol/permisos"
    element={ValidarPermiso(<Navigate to="/rol/listar" replace />)}
  />,
  <Route
    key="rol-permisos"
    path="/rol/permisos/:idRol"
    element={ValidarPermiso(lazyPage(() => import("../../pages/permiso/permisoListPage")))}
  />,
  <Route
    key="permiso-log"
    path="/permiso/log/:idRol/:idMenu"
    element={ValidarPermiso(lazyPage(() => import("../../pages/permiso/permisoLogPage")))}
  />,
];
