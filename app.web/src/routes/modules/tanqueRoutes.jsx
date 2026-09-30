import { Route } from "react-router-dom";
import { ValidarPermiso } from "./ValidarPermiso";
import { lazyPage } from "./lazyPage";

export const tanqueRoutes = [
  <Route
    key="tanque-listar"
    path="/tanque/listar"
    element={ValidarPermiso(lazyPage(() => import("../../pages/tanque/tanqueListPage")))}
  />,
  <Route
    key="tanque-agregar"
    path="/tanque/agregar"
    element={ValidarPermiso(lazyPage(() => import("../../pages/tanque/tanqueAgregarPage")))}
  />,
  <Route
    key="tanque-visualizar"
    path="/tanque/visualizar/:idTanque"
    element={ValidarPermiso(lazyPage(() => import("../../pages/tanque/tanqueVisualizarPage")))}
  />,
  <Route
    key="tanque-editar"
    path="/tanque/editar/:idTanque"
    element={ValidarPermiso(lazyPage(() => import("../../pages/tanque/tanqueEditarPage")))}
  />,
  <Route
    key="tanque-eliminar"
    path="/tanque/eliminar/:idTanque"
    element={ValidarPermiso(lazyPage(() => import("../../pages/tanque/tanqueEliminarPage")))}
  />,
  <Route
    key="tanque-log"
    path="/tanque/log/:idTanque"
    element={ValidarPermiso(lazyPage(() => import("../../pages/tanque/tanqueLogPage")))}
  />,
];
