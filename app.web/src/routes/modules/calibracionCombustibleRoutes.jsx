import { Route } from "react-router-dom";
import { ValidarPermiso } from "./ValidarPermiso";
import { lazyPage } from "./lazyPage";

export const calibracionCombustibleRoutes = [
  <Route
    key="calibracioncombustible-listar"
    path="/calibracioncombustible/listar"
    element={ValidarPermiso(
      lazyPage(() => import("../../pages/calibracionCombustible/calibracionCombustibleListPage"))
    )}
  />,
  <Route
    key="calibracioncombustible-agregar"
    path="/calibracioncombustible/agregar"
    element={ValidarPermiso(
      lazyPage(() => import("../../pages/calibracionCombustible/calibracionCombustibleAgregarPage"))
    )}
  />,
  <Route
    key="calibracioncombustible-visualizar"
    path="/calibracioncombustible/visualizar/:idCalibracionCombustible"
    element={ValidarPermiso(
      lazyPage(
        () => import("../../pages/calibracionCombustible/calibracionCombustibleVisualizarPage")
      )
    )}
  />,
  <Route
    key="calibracioncombustible-editar"
    path="/calibracioncombustible/editar/:idCalibracionCombustible"
    element={ValidarPermiso(
      lazyPage(() => import("../../pages/calibracionCombustible/calibracionCombustibleEditarPage"))
    )}
  />,
  <Route
    key="calibracioncombustible-eliminar"
    path="/calibracioncombustible/eliminar/:idCalibracionCombustible"
    element={ValidarPermiso(
      lazyPage(
        () => import("../../pages/calibracionCombustible/calibracionCombustibleEliminarPage")
      )
    )}
  />,
  <Route
    key="calibracioncombustible-log"
    path="/calibracioncombustible/log/:idCalibracionCombustible"
    element={ValidarPermiso(
      lazyPage(() => import("../../pages/calibracionCombustible/calibracionCombustibleLogPage"))
    )}
  />,
];
