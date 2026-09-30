import { Route } from "react-router-dom";
import { ValidarPermiso } from "./ValidarPermiso";
import { lazyPage } from "./lazyPage";

export const metroRoutes = [
  <Route
    key="metro-listar"
    path="/metro/listar"
    element={ValidarPermiso(lazyPage(() => import("../../pages/metro/metroListPage")))}
  />,
  <Route
    key="metro-agregar"
    path="/metro/agregar"
    element={ValidarPermiso(lazyPage(() => import("../../pages/metro/metroAgregarPage")))}
  />,
  <Route
    key="metro-visualizar"
    path="/metro/visualizar/:idMetro"
    element={ValidarPermiso(lazyPage(() => import("../../pages/metro/metroVisualizarPage")))}
  />,
  <Route
    key="metro-editar"
    path="/metro/editar/:idMetro"
    element={ValidarPermiso(lazyPage(() => import("../../pages/metro/metroEditarPage")))}
  />,
  <Route
    key="metro-eliminar"
    path="/metro/eliminar/:idMetro"
    element={ValidarPermiso(lazyPage(() => import("../../pages/metro/metroEliminarPage")))}
  />,
  <Route
    key="metro-log"
    path="/metro/log/:idMetro"
    element={ValidarPermiso(lazyPage(() => import("../../pages/metro/metroLogPage")))}
  />,
];
