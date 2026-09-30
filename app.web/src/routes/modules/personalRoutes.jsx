import { Route } from "react-router-dom";
import { ValidarPermiso } from "./ValidarPermiso";
import { lazyPage } from "./lazyPage";

export const personalRoutes = [
  <Route
    key="personal-listar"
    path="/personal/listar"
    element={ValidarPermiso(lazyPage(() => import("../../pages/personal/personalListPage")))}
  />,
  <Route
    key="personal-agregar"
    path="/personal/agregar"
    element={ValidarPermiso(lazyPage(() => import("../../pages/personal/personalAgregarPage")))}
  />,
  <Route
    key="personal-visualizar"
    path="/personal/visualizar/:idPersonal"
    element={ValidarPermiso(lazyPage(() => import("../../pages/personal/personalVisualizarPage")))}
  />,
  <Route
    key="personal-editar"
    path="/personal/editar/:idPersonal"
    element={ValidarPermiso(lazyPage(() => import("../../pages/personal/personalEditarPage")))}
  />,
  <Route
    key="personal-eliminar"
    path="/personal/eliminar/:idPersonal"
    element={ValidarPermiso(lazyPage(() => import("../../pages/personal/personalEliminarPage")))}
  />,
  <Route
    key="personal-log"
    path="/personal/log/:idPersonal"
    element={ValidarPermiso(lazyPage(() => import("../../pages/personal/personalLogPage")))}
  />,
];
