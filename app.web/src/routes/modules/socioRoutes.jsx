import { Route } from "react-router-dom";
import { ValidarPermiso } from "./ValidarPermiso";
import { lazyPage } from "./lazyPage";

export const suplidorRoutes = [
  <Route
    key="suplidor-listar"
    path="/suplidor/listar"
    element={ValidarPermiso(lazyPage(() => import("../../pages/socio/socioListPage")))}
  />,
  <Route
    key="suplidor-agregar"
    path="/suplidor/agregar"
    element={ValidarPermiso(lazyPage(() => import("../../pages/socio/socioAgregarPage")))}
  />,
  <Route
    key="suplidor-visualizar"
    path="/suplidor/visualizar/:idSuplidor"
    element={ValidarPermiso(lazyPage(() => import("../../pages/socio/socioVisualizarPage")))}
  />,
  <Route
    key="suplidor-editar"
    path="/suplidor/editar/:idSuplidor"
    element={ValidarPermiso(lazyPage(() => import("../../pages/socio/socioEditarPage")))}
  />,
  <Route
    key="suplidor-eliminar"
    path="/suplidor/eliminar/:idSuplidor"
    element={ValidarPermiso(lazyPage(() => import("../../pages/socio/socioEliminarPage")))}
  />,
  <Route
    key="suplidor-log"
    path="/suplidor/log/:idSuplidor"
    element={ValidarPermiso(lazyPage(() => import("../../pages/socio/socioLogPage")))}
  />,
];
