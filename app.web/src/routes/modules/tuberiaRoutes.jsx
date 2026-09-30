import { Route } from "react-router-dom";
import { ValidarPermiso } from "./ValidarPermiso";
import { lazyPage } from "./lazyPage";

export const tuberiaRoutes = [
  <Route
    key="tuberia-listar"
    path="/tuberia/listar"
    element={ValidarPermiso(lazyPage(() => import("../../pages/tuberia/tuberiaListPage")))}
  />,
  <Route
    key="tuberia-agregar"
    path="/tuberia/agregar"
    element={ValidarPermiso(lazyPage(() => import("../../pages/tuberia/tuberiaAgregarPage")))}
  />,
  <Route
    key="tuberia-visualizar"
    path="/tuberia/visualizar/:idTuberia"
    element={ValidarPermiso(lazyPage(() => import("../../pages/tuberia/tuberiaVisualizarPage")))}
  />,
  <Route
    key="tuberia-editar"
    path="/tuberia/editar/:idTuberia"
    element={ValidarPermiso(lazyPage(() => import("../../pages/tuberia/tuberiaEditarPage")))}
  />,
  <Route
    key="tuberia-eliminar"
    path="/tuberia/eliminar/:idTuberia"
    element={ValidarPermiso(lazyPage(() => import("../../pages/tuberia/tuberiaEliminarPage")))}
  />,
  <Route
    key="tuberia-log"
    path="/tuberia/log/:idTuberia"
    element={ValidarPermiso(lazyPage(() => import("../../pages/tuberia/tuberiaLogPage")))}
  />,
];
