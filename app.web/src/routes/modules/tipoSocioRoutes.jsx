import { Route } from "react-router-dom";
import { ValidarPermiso } from "./ValidarPermiso";
import { lazyPage } from "./lazyPage";

export const socioRoutes = [
  <Route
    key="socio-listar"
    path="/socio/listar"
    element={ValidarPermiso(lazyPage(() => import("../../pages/tipoSocio/tipoSocioListPage")))}
  />,
  <Route
    key="socio-agregar"
    path="/socio/agregar"
    element={ValidarPermiso(lazyPage(() => import("../../pages/tipoSocio/tipoSocioAgregarPage")))}
  />,
  <Route
    key="socio-visualizar"
    path="/socio/visualizar/:idSocio"
    element={ValidarPermiso(
      lazyPage(() => import("../../pages/tipoSocio/tipoSocioVisualizarPage"))
    )}
  />,
  <Route
    key="socio-editar"
    path="/socio/editar/:idSocio"
    element={ValidarPermiso(lazyPage(() => import("../../pages/tipoSocio/tipoSocioEditarPage")))}
  />,
  <Route
    key="socio-eliminar"
    path="/socio/eliminar/:idSocio"
    element={ValidarPermiso(lazyPage(() => import("../../pages/tipoSocio/tipoSocioEliminarPage")))}
  />,
  <Route
    key="socio-log"
    path="/socio/log/:idSocio"
    element={ValidarPermiso(lazyPage(() => import("../../pages/tipoSocio/tipoSocioLogPage")))}
  />,
];
