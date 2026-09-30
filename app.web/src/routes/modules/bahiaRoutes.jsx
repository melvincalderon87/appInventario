import { Route } from "react-router-dom";
import { ValidarPermiso } from "./ValidarPermiso";
import { lazyPage } from "./lazyPage";

export const bahiaRoutes = [
  <Route
    key="bahia-listar"
    path="/bahia/listar"
    element={ValidarPermiso(lazyPage(() => import("../../pages/bahia/bahiaListPage")))}
  />,
  <Route
    key="bahia-agregar"
    path="/bahia/agregar"
    element={ValidarPermiso(lazyPage(() => import("../../pages/bahia/bahiaAgregarPage")))}
  />,
  <Route
    key="bahia-visualizar"
    path="/bahia/visualizar/:idBahia"
    element={ValidarPermiso(lazyPage(() => import("../../pages/bahia/bahiaVisualizarPage")))}
  />,
  <Route
    key="bahia-editar"
    path="/bahia/editar/:idBahia"
    element={ValidarPermiso(lazyPage(() => import("../../pages/bahia/bahiaEditarPage")))}
  />,
  <Route
    key="bahia-eliminar"
    path="/bahia/eliminar/:idBahia"
    element={ValidarPermiso(lazyPage(() => import("../../pages/bahia/bahiaEliminarPage")))}
  />,
  <Route
    key="bahia-log"
    path="/bahia/log/:idBahia"
    element={ValidarPermiso(lazyPage(() => import("../../pages/bahia/bahiaLogPage")))}
  />,
];
