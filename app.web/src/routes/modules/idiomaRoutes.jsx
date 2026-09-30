import { Route } from "react-router-dom";
import { ValidarPermiso } from "./ValidarPermiso";
import { lazyPage } from "./lazyPage";

export const idiomaRoutes = [
  <Route
    key="idioma-listar"
    path="/idioma/listar"
    element={ValidarPermiso(lazyPage(() => import("../../pages/idioma/idiomaListPage")))}
  />,
  <Route
    key="idioma-agregar"
    path="/idioma/agregar"
    element={ValidarPermiso(lazyPage(() => import("../../pages/idioma/idiomaAgregarPage")))}
  />,
  <Route
    key="idioma-visualizar"
    path="/idioma/visualizar/:idIdioma"
    element={ValidarPermiso(lazyPage(() => import("../../pages/idioma/idiomaVisualizarPage")))}
  />,
  <Route
    key="idioma-editar"
    path="/idioma/editar/:idIdioma"
    element={ValidarPermiso(lazyPage(() => import("../../pages/idioma/idiomaEditarPage")))}
  />,
  <Route
    key="idioma-eliminar"
    path="/idioma/eliminar/:idIdioma"
    element={ValidarPermiso(lazyPage(() => import("../../pages/idioma/idiomaEliminarPage")))}
  />,
  <Route
    key="idioma-log"
    path="/idioma/log/:idIdioma"
    element={ValidarPermiso(lazyPage(() => import("../../pages/idioma/idiomaLogPage")))}
  />,
];
