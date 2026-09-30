import { Route } from "react-router-dom";
import { ValidarPermiso } from "./ValidarPermiso";
import { lazyPage } from "./lazyPage";

export const tipoProductoRoutes = [
  <Route
    key="tipoproducto-listar"
    path="/tipoproducto/listar"
    element={ValidarPermiso(
      lazyPage(() => import("../../pages/tipoProducto/tipoProductoListPage"))
    )}
  />,
  <Route
    key="tipoproducto-agregar"
    path="/tipoproducto/agregar"
    element={ValidarPermiso(
      lazyPage(() => import("../../pages/tipoProducto/tipoProductoAgregarPage"))
    )}
  />,
  <Route
    key="tipoproducto-visualizar"
    path="/tipoproducto/visualizar/:idTipoProducto"
    element={ValidarPermiso(
      lazyPage(() => import("../../pages/tipoProducto/tipoProductoVisualizarPage"))
    )}
  />,
  <Route
    key="tipoproducto-editar"
    path="/tipoproducto/editar/:idTipoProducto"
    element={ValidarPermiso(
      lazyPage(() => import("../../pages/tipoProducto/tipoProductoEditarPage"))
    )}
  />,
  <Route
    key="tipoproducto-eliminar"
    path="/tipoproducto/eliminar/:idTipoProducto"
    element={ValidarPermiso(
      lazyPage(() => import("../../pages/tipoProducto/tipoProductoEliminarPage"))
    )}
  />,
  <Route
    key="tipoproducto-log"
    path="/tipoproducto/log/:idTipoProducto"
    element={ValidarPermiso(lazyPage(() => import("../../pages/tipoProducto/tipoProductoLogPage")))}
  />,
];
