import { Route } from "react-router-dom";
import { ValidarPermiso } from "./ValidarPermiso";
import { lazyPage } from "./lazyPage";

export const productoRoutes = [
  <Route
    key="producto-listar"
    path="/producto/listar"
    element={ValidarPermiso(lazyPage(() => import("../../pages/producto/productoListPage")))}
  />,
  <Route
    key="producto-agregar"
    path="/producto/agregar"
    element={ValidarPermiso(lazyPage(() => import("../../pages/producto/productoAgregarPage")))}
  />,
  <Route
    key="producto-visualizar"
    path="/producto/visualizar/:idProducto"
    element={ValidarPermiso(lazyPage(() => import("../../pages/producto/productoVisualizarPage")))}
  />,
  <Route
    key="producto-editar"
    path="/producto/editar/:idProducto"
    element={ValidarPermiso(lazyPage(() => import("../../pages/producto/productoEditarPage")))}
  />,
  <Route
    key="producto-eliminar"
    path="/producto/eliminar/:idProducto"
    element={ValidarPermiso(lazyPage(() => import("../../pages/producto/productoEliminarPage")))}
  />,
  <Route
    key="producto-log"
    path="/producto/log/:idProducto"
    element={ValidarPermiso(lazyPage(() => import("../../pages/producto/productoLogPage")))}
  />,
];
