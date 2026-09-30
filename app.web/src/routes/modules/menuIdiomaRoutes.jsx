import { Route } from "react-router-dom";
import { ValidarPermiso } from "./ValidarPermiso";
import { lazyPage } from "./lazyPage";

export const menuIdiomaRoutes = [
  <Route
    key="menuidioma-listar"
    path="/menuidioma/listar"
    element={ValidarPermiso(lazyPage(() => import("../../pages/menuIdioma/menuIdiomaListPage")))}
  />,
  <Route
    key="menuidioma-agregar"
    path="/menuidioma/agregar"
    element={ValidarPermiso(lazyPage(() => import("../../pages/menuIdioma/menuIdiomaAgregarPage")))}
  />,
  <Route
    key="menuidioma-visualizar"
    path="/menuidioma/visualizar/:idMenuIdioma"
    element={ValidarPermiso(
      lazyPage(() => import("../../pages/menuIdioma/menuIdiomaVisualizarPage"))
    )}
  />,
  <Route
    key="menuidioma-editar"
    path="/menuidioma/editar/:idMenuIdioma"
    element={ValidarPermiso(lazyPage(() => import("../../pages/menuIdioma/menuIdiomaEditarPage")))}
  />,
  <Route
    key="menuidioma-eliminar"
    path="/menuidioma/eliminar/:idMenuIdioma"
    element={ValidarPermiso(
      lazyPage(() => import("../../pages/menuIdioma/menuIdiomaEliminarPage"))
    )}
  />,
  <Route
    key="menuidioma-log"
    path="/menuidioma/log/:idMenuIdioma"
    element={ValidarPermiso(lazyPage(() => import("../../pages/menuIdioma/menuIdiomaLogPage")))}
  />,
];
