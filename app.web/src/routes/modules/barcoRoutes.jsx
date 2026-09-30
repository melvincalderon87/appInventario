import { Route } from "react-router-dom";
import { ValidarPermiso } from "./ValidarPermiso";
import { lazyPage } from "./lazyPage";

export const barcoRoutes = [
  <Route
    key="barco-listar"
    path="/barco/listar"
    element={ValidarPermiso(lazyPage(() => import("../../pages/barco/barcoListPage")))}
  />,
  <Route
    key="barco-agregar"
    path="/barco/agregar"
    element={ValidarPermiso(lazyPage(() => import("../../pages/barco/barcoAgregarPage")))}
  />,
  <Route
    key="barco-ingresobarco"
    path="/barco/ingresobarco"
    element={ValidarPermiso(lazyPage(() => import("../../pages/barco/barcoIngresoBarcoListPage")))}
  />,
  <Route
    key="barco-ingresobarco-agregar"
    path="/barco/ingresobarco/agregar"
    element={ValidarPermiso(lazyPage(() => import("../../pages/barco/barcoIngresoBarcoPage")))}
  />,
  <Route
    key="barco-ingresobarco-editar"
    path="/barco/ingresobarco/editar/:codigo"
    element={ValidarPermiso(
      lazyPage(() => import("../../pages/barco/barcoIngresoBarcoEditarPage"))
    )}
  />,
  <Route
    key="autorizacion-ingreso-barco-visualizar"
    path="/autorizaciones/ingreso-barco/:codDocumento"
    element={ValidarPermiso(
      lazyPage(() => import("../../pages/combustible/documentoAutorizacionPage"))
    )}
  />,
  <Route
    key="barco-ingresotuberias"
    path="/barco/ingresotuberias"
    element={ValidarPermiso(lazyPage(() => import("../../pages/barco/barcoIngresoTuberiasPage")))}
  />,
  <Route
    key="barco-ingresotuberias-listar"
    path="/barco/ingresotuberias/listar"
    element={ValidarPermiso(
      lazyPage(() => import("../../pages/barco/barcoIngresoTuberiasListPage"))
    )}
  />,
  <Route
    key="combustible-ingresotuberias"
    path="/combustible/ingresotuberias"
    element={ValidarPermiso(lazyPage(() => import("../../pages/barco/barcoIngresoTuberiasPage")))}
  />,
  <Route
    key="combustible-ingresotuberias-listar"
    path="/combustible/ingresotuberias/listar"
    element={ValidarPermiso(
      lazyPage(() => import("../../pages/barco/barcoIngresoTuberiasListPage"))
    )}
  />,
  <Route
    key="barco-visualizar"
    path="/barco/visualizar/:idBarco"
    element={ValidarPermiso(lazyPage(() => import("../../pages/barco/barcoVisualizarPage")))}
  />,
  <Route
    key="barco-editar"
    path="/barco/editar/:idBarco"
    element={ValidarPermiso(lazyPage(() => import("../../pages/barco/barcoEditarPage")))}
  />,
  <Route
    key="barco-eliminar"
    path="/barco/eliminar/:idBarco"
    element={ValidarPermiso(lazyPage(() => import("../../pages/barco/barcoEliminarPage")))}
  />,
  <Route
    key="barco-log"
    path="/barco/log/:idBarco"
    element={ValidarPermiso(lazyPage(() => import("../../pages/barco/barcoLogPage")))}
  />,
];
