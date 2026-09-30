import { Route } from "react-router-dom";
import { ValidarPermiso } from "./ValidarPermiso";
import { lazyPage } from "./lazyPage";

export const brazoRoutes = [
  <Route
    key="brazo-listar"
    path="/brazo/listar"
    element={ValidarPermiso(lazyPage(() => import("../../pages/brazo/brazoListPage")))}
  />,
  <Route
    key="brazo-agregar"
    path="/brazo/agregar"
    element={ValidarPermiso(lazyPage(() => import("../../pages/brazo/brazoAgregarPage")))}
  />,
  <Route
    key="brazo-visualizar"
    path="/brazo/visualizar/:idBrazo"
    element={ValidarPermiso(lazyPage(() => import("../../pages/brazo/brazoVisualizarPage")))}
  />,
  <Route
    key="brazo-editar"
    path="/brazo/editar/:idBrazo"
    element={ValidarPermiso(lazyPage(() => import("../../pages/brazo/brazoEditarPage")))}
  />,
  <Route
    key="brazo-eliminar"
    path="/brazo/eliminar/:idBrazo"
    element={ValidarPermiso(lazyPage(() => import("../../pages/brazo/brazoEliminarPage")))}
  />,
  <Route
    key="brazo-log"
    path="/brazo/log/:idBrazo"
    element={ValidarPermiso(lazyPage(() => import("../../pages/brazo/brazoLogPage")))}
  />,
];
