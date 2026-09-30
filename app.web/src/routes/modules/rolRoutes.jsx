import { Route } from "react-router-dom";
import { ValidarPermiso } from "./ValidarPermiso";
import { lazyPage } from "./lazyPage";

export const rolRoutes = [
  <Route
    key="rol-listar"
    path="/rol/listar"
    element={ValidarPermiso(lazyPage(() => import("../../pages/rol/rolListPage")))}
  />,
  <Route
    key="rol-agregar"
    path="/rol/agregar"
    element={ValidarPermiso(lazyPage(() => import("../../pages/rol/rolAgregarPage")))}
  />,
  <Route
    key="rol-visualizar"
    path="/rol/visualizar/:idRol"
    element={ValidarPermiso(lazyPage(() => import("../../pages/rol/rolVisualizarPage")))}
  />,
  <Route
    key="rol-editar"
    path="/rol/editar/:idRol"
    element={ValidarPermiso(lazyPage(() => import("../../pages/rol/rolEditarPage")))}
  />,
  <Route
    key="rol-eliminar"
    path="/rol/eliminar/:idRol"
    element={ValidarPermiso(lazyPage(() => import("../../pages/rol/rolEliminarPage")))}
  />,
  <Route
    key="rol-log"
    path="/rol/log/:idRol"
    element={ValidarPermiso(lazyPage(() => import("../../pages/rol/rolLogPage")))}
  />,
];
