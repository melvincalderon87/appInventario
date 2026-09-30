import { Route } from "react-router-dom";
import { ValidarPermiso } from "./ValidarPermiso";
import { lazyPage } from "./lazyPage";

export const consumoPropioRoutes = [
  <Route
    key="consumopropio-listar"
    path="/consumopropio/listar"
    element={ValidarPermiso(
      lazyPage(() => import("../../pages/consumoPropio/consumoPropioListPage"))
    )}
  />,
  <Route
    key="consumopropio-listar-tanque"
    path="/consumopropio/listar/:idTanque"
    element={ValidarPermiso(
      lazyPage(() => import("../../pages/consumoPropio/consumoPropioListPage"))
    )}
  />,
  <Route
    key="consumopropio-agregar"
    path="/consumopropio/agregar"
    element={ValidarPermiso(
      lazyPage(() => import("../../pages/consumoPropio/consumoPropioAgregarPage"))
    )}
  />,
  <Route
    key="consumopropio-agregar-tanque"
    path="/consumopropio/agregar/:idTanque"
    element={ValidarPermiso(
      lazyPage(() => import("../../pages/consumoPropio/consumoPropioAgregarPage"))
    )}
  />,
  <Route
    key="consumopropio-visualizar"
    path="/consumopropio/visualizar/:idConsumoPropio"
    element={ValidarPermiso(
      lazyPage(() => import("../../pages/consumoPropio/consumoPropioVisualizarPage"))
    )}
  />,
  <Route
    key="consumopropio-editar"
    path="/consumopropio/editar/:idConsumoPropio"
    element={ValidarPermiso(
      lazyPage(() => import("../../pages/consumoPropio/consumoPropioEditarPage"))
    )}
  />,
  <Route
    key="consumopropio-eliminar"
    path="/consumopropio/eliminar/:idConsumoPropio"
    element={ValidarPermiso(
      lazyPage(() => import("../../pages/consumoPropio/consumoPropioEliminarPage"))
    )}
  />,
  <Route
    key="consumopropio-log"
    path="/consumopropio/log/:idConsumoPropio"
    element={ValidarPermiso(
      lazyPage(() => import("../../pages/consumoPropio/consumoPropioLogPage"))
    )}
  />,
];
