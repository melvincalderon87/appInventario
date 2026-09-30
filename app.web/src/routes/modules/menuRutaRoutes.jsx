import { Route } from "react-router-dom";
import { ValidarPermiso } from "./ValidarPermiso";
import { lazyPage } from "./lazyPage";

export const menuRutaRoutes = [
  <Route
    key="menuruta-listar"
    path="/menuruta/listar"
    element={ValidarPermiso(lazyPage(() => import("../../pages/menuRuta/menuRutaListPage")))}
  />,
  <Route
    key="menuruta-agregar"
    path="/menuruta/agregar"
    element={ValidarPermiso(lazyPage(() => import("../../pages/menuRuta/menuRutaAgregarPage")))}
  />,
  <Route
    key="menuruta-visualizar"
    path="/menuruta/visualizar/:ruta"
    element={ValidarPermiso(lazyPage(() => import("../../pages/menuRuta/menuRutaVisualizarPage")))}
  />,
  <Route
    key="menuruta-editar"
    path="/menuruta/editar/:ruta"
    element={ValidarPermiso(lazyPage(() => import("../../pages/menuRuta/menuRutaEditarPage")))}
  />,
  <Route
    key="menuruta-eliminar"
    path="/menuruta/eliminar/:ruta"
    element={ValidarPermiso(lazyPage(() => import("../../pages/menuRuta/menuRutaEliminarPage")))}
  />,
  <Route
    key="menuruta-log"
    path="/menuruta/log/:ruta"
    element={ValidarPermiso(lazyPage(() => import("../../pages/menuRuta/menuRutaLogPage")))}
  />,
];
