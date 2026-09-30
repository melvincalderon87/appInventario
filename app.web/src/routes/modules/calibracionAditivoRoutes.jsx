import { Route } from "react-router-dom";
import { ValidarPermiso } from "./ValidarPermiso";
import { lazyPage } from "./lazyPage";

export const calibracionAditivoRoutes = [
  <Route
    key="calibracionaditivo-listar"
    path="/calibracionaditivo/listar"
    element={ValidarPermiso(
      lazyPage(() => import("../../pages/calibracionAditivo/calibracionAditivoListPage"))
    )}
  />,
  <Route
    key="calibracionaditivo-agregar"
    path="/calibracionaditivo/agregar"
    element={ValidarPermiso(
      lazyPage(() => import("../../pages/calibracionAditivo/calibracionAditivoAgregarPage"))
    )}
  />,
  <Route
    key="calibracionaditivo-visualizar"
    path="/calibracionaditivo/visualizar/:idCalibracionAditivo"
    element={ValidarPermiso(
      lazyPage(() => import("../../pages/calibracionAditivo/calibracionAditivoVisualizarPage"))
    )}
  />,
  <Route
    key="calibracionaditivo-editar"
    path="/calibracionaditivo/editar/:idCalibracionAditivo"
    element={ValidarPermiso(
      lazyPage(() => import("../../pages/calibracionAditivo/calibracionAditivoEditarPage"))
    )}
  />,
  <Route
    key="calibracionaditivo-eliminar"
    path="/calibracionaditivo/eliminar/:idCalibracionAditivo"
    element={ValidarPermiso(
      lazyPage(() => import("../../pages/calibracionAditivo/calibracionAditivoEliminarPage"))
    )}
  />,
  <Route
    key="calibracionaditivo-log"
    path="/calibracionaditivo/log/:idCalibracionAditivo"
    element={ValidarPermiso(
      lazyPage(() => import("../../pages/calibracionAditivo/calibracionAditivoLogPage"))
    )}
  />,
];
