import { Route } from "react-router-dom";
import { ValidarPermiso } from "./ValidarPermiso";
import { lazyPage } from "./lazyPage";

export const salidasRoutes = [
  <Route
    key="salidas-listar"
    path="/salidas/listar"
    element={ValidarPermiso(lazyPage(() => import("../../pages/salidas/salidasListPage")))}
  />,
  <Route
    key="salidas-agregar"
    path="/salidas/agregar"
    element={ValidarPermiso(lazyPage(() => import("../../pages/salidas/salidasAgregarPage")))}
  />,
  <Route
    key="ajustes-salida"
    path="/ajustes/salida"
    element={ValidarPermiso(lazyPage(() => import("../../pages/salidas/salidasAgregarPage")))}
  />,
  <Route
    key="ajustes-salida-listar"
    path="/ajustes/salida/listar"
    element={ValidarPermiso(
      lazyPage(() => import("../../pages/combustible/movimientoCombustibleListPage"))
    )}
  />,
  <Route
    key="unidad-salida"
    path="/unidad/salida"
    element={ValidarPermiso(lazyPage(() => import("../../pages/salidas/salidasAgregarPage")))}
  />,
  <Route
    key="unidad-salida-listar"
    path="/unidad/salida/listar"
    element={ValidarPermiso(
      lazyPage(() => import("../../pages/combustible/movimientoCombustibleListPage"))
    )}
  />,
  <Route
    key="salidas-editar"
    path="/salidas/editar/:idSalida"
    element={ValidarPermiso(lazyPage(() => import("../../pages/salidas/salidasEditarPage")))}
  />,
  <Route
    key="salidas-visualizar"
    path="/salidas/visualizar/:codDocumento"
    element={ValidarPermiso(
      lazyPage(() => import("../../pages/combustible/documentoAutorizacionPage"))
    )}
  />,
  <Route
    key="ajustes-salida-visualizar"
    path="/ajustes/salida/visualizar/:codDocumento"
    element={ValidarPermiso(
      lazyPage(() => import("../../pages/combustible/documentoAutorizacionPage"))
    )}
  />,
  <Route
    key="unidad-salida-visualizar"
    path="/unidad/salida/visualizar/:codDocumento"
    element={ValidarPermiso(
      lazyPage(() => import("../../pages/combustible/documentoAutorizacionPage"))
    )}
  />,
  <Route
    key="salidas-eliminar"
    path="/salidas/eliminar/:idSalida"
    element={ValidarPermiso(lazyPage(() => import("../../pages/salidas/salidasEliminarPage")))}
  />,
];
