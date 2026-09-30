import { Route } from "react-router-dom";
import { ValidarPermiso } from "./ValidarPermiso";
import { lazyPage } from "./lazyPage";

export const coloranteRoutes = [
  <Route
    key="colorante-listar"
    path="/colorante/listar"
    element={ValidarPermiso(lazyPage(() => import("../../pages/colorante/coloranteListPage")))}
  />,
  <Route
    key="colorante-ingreso-listar"
    path="/colorante/ingreso/listar"
    element={ValidarPermiso(
      lazyPage(() => import("../../pages/colorante/coloranteIngresoListPage"))
    )}
  />,
  <Route
    key="colorante-salida-listar"
    path="/colorante/salida/listar"
    element={ValidarPermiso(
      lazyPage(() => import("../../pages/colorante/coloranteSalidaListPage"))
    )}
  />,
  <Route
    key="colorante-ingreso"
    path="/colorante/ingreso"
    element={ValidarPermiso(lazyPage(() => import("../../pages/colorante/coloranteIngresoPage")))}
  />,
  <Route
    key="colorante-salida"
    path="/colorante/salida"
    element={ValidarPermiso(lazyPage(() => import("../../pages/colorante/coloranteSalidaPage")))}
  />,
  <Route
    key="colorante-visualizar"
    path="/colorante/visualizar/:idColorante"
    element={ValidarPermiso(
      lazyPage(() => import("../../pages/colorante/coloranteVisualizarPage"))
    )}
  />,
  <Route
    key="colorante-editar"
    path="/colorante/editar/:idColorante"
    element={ValidarPermiso(lazyPage(() => import("../../pages/colorante/coloranteEditarPage")))}
  />,
  <Route
    key="colorante-eliminar"
    path="/colorante/eliminar/:idColorante"
    element={ValidarPermiso(lazyPage(() => import("../../pages/colorante/coloranteEliminarPage")))}
  />,
  <Route
    key="colorante-log"
    path="/colorante/log/:idColorante"
    element={ValidarPermiso(lazyPage(() => import("../../pages/colorante/coloranteLogPage")))}
  />,
];
