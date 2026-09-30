import { Route } from "react-router-dom";
import { ValidarPermiso } from "./ValidarPermiso";
import { lazyPage } from "./lazyPage";

export const menuRoutes = [
  <Route
    key="menu-listar"
    path="/menu/listar"
    element={ValidarPermiso(lazyPage(() => import("../../pages/menu/menuListPage")))}
  />,
  <Route
    key="menu-agregar"
    path="/menu/agregar"
    element={ValidarPermiso(lazyPage(() => import("../../pages/menu/menuAgregarPage")))}
  />,
  <Route
    key="menu-visualizar"
    path="/menu/visualizar/:idMenu"
    element={ValidarPermiso(lazyPage(() => import("../../pages/menu/menuVisualizarPage")))}
  />,
  <Route
    key="menu-editar"
    path="/menu/editar/:idMenu"
    element={ValidarPermiso(lazyPage(() => import("../../pages/menu/menuEditarPage")))}
  />,
  <Route
    key="menu-eliminar"
    path="/menu/eliminar/:idMenu"
    element={ValidarPermiso(lazyPage(() => import("../../pages/menu/menuEliminarPage")))}
  />,
  <Route
    key="menu-log"
    path="/menu/log/:idMenu"
    element={ValidarPermiso(lazyPage(() => import("../../pages/menu/menuLogPage")))}
  />,
];
