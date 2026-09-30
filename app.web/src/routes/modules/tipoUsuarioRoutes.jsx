import { Route } from "react-router-dom";
import { ValidarPermiso } from "./ValidarPermiso";
import { lazyPage } from "./lazyPage";

export const tipoUsuarioRoutes = [
  <Route
    key="tipousuario-listar"
    path="/tipousuario/listar"
    element={ValidarPermiso(lazyPage(() => import("../../pages/tipoUsuario/tipoUsuarioListPage")))}
  />,
  <Route
    key="tipousuario-agregar"
    path="/tipousuario/agregar"
    element={ValidarPermiso(
      lazyPage(() => import("../../pages/tipoUsuario/tipoUsuarioAgregarPage"))
    )}
  />,
  <Route
    key="tipousuario-visualizar"
    path="/tipousuario/visualizar/:idTipoUsuario"
    element={ValidarPermiso(
      lazyPage(() => import("../../pages/tipoUsuario/tipoUsuarioVisualizarPage"))
    )}
  />,
  <Route
    key="tipousuario-editar"
    path="/tipousuario/editar/:idTipoUsuario"
    element={ValidarPermiso(
      lazyPage(() => import("../../pages/tipoUsuario/tipoUsuarioEditarPage"))
    )}
  />,
  <Route
    key="tipousuario-eliminar"
    path="/tipousuario/eliminar/:idTipoUsuario"
    element={ValidarPermiso(
      lazyPage(() => import("../../pages/tipoUsuario/tipoUsuarioEliminarPage"))
    )}
  />,
  <Route
    key="tipousuario-log"
    path="/tipousuario/log/:idTipoUsuario"
    element={ValidarPermiso(lazyPage(() => import("../../pages/tipoUsuario/tipoUsuarioLogPage")))}
  />,
];
