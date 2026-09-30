import { Route } from "react-router-dom";
import { ValidarPermiso } from "./ValidarPermiso";
import { lazyPage } from "./lazyPage";

export const companiaInspeccionRoutes = [
  <Route
    key="companiainspeccion-listar"
    path="/companiainspeccion/listar"
    element={ValidarPermiso(
      lazyPage(() => import("../../pages/companiaInspeccion/companiaInspeccionListPage"))
    )}
  />,
  <Route
    key="companiainspeccion-agregar"
    path="/companiainspeccion/agregar"
    element={ValidarPermiso(
      lazyPage(() => import("../../pages/companiaInspeccion/companiaInspeccionAgregarPage"))
    )}
  />,
  <Route
    key="companiainspeccion-visualizar"
    path="/companiainspeccion/visualizar/:idCompaniaInspeccion"
    element={ValidarPermiso(
      lazyPage(() => import("../../pages/companiaInspeccion/companiaInspeccionVisualizarPage"))
    )}
  />,
  <Route
    key="companiainspeccion-editar"
    path="/companiainspeccion/editar/:idCompaniaInspeccion"
    element={ValidarPermiso(
      lazyPage(() => import("../../pages/companiaInspeccion/companiaInspeccionEditarPage"))
    )}
  />,
  <Route
    key="companiainspeccion-eliminar"
    path="/companiainspeccion/eliminar/:idCompaniaInspeccion"
    element={ValidarPermiso(
      lazyPage(() => import("../../pages/companiaInspeccion/companiaInspeccionEliminarPage"))
    )}
  />,
  <Route
    key="companiainspeccion-log"
    path="/companiainspeccion/log/:idCompaniaInspeccion"
    element={ValidarPermiso(
      lazyPage(() => import("../../pages/companiaInspeccion/companiaInspeccionLogPage"))
    )}
  />,
];
