import { Route } from "react-router-dom";
import { ValidarPermiso } from "./ValidarPermiso";
import { lazyPage } from "./lazyPage";

export const usuarioRoutes = [
  <Route
    key="usuario-listar"
    path="/usuario/listar"
    element={ValidarPermiso(lazyPage(() => import("../../pages/usuario/usuarioListPage")))}
  />,
  <Route
    key="usuario-agregar"
    path="/usuario/agregar"
    element={ValidarPermiso(lazyPage(() => import("../../pages/usuario/usuarioAgregarPage")))}
  />,
  <Route
    key="usuario-visualizar"
    path="/usuario/visualizar/:idUsuario"
    element={ValidarPermiso(lazyPage(() => import("../../pages/usuario/usuarioVisualizarPage")))}
  />,
  <Route
    key="usuario-editar"
    path="/usuario/editar/:idUsuario"
    element={ValidarPermiso(lazyPage(() => import("../../pages/usuario/usuarioEditarPage")))}
  />,
  <Route
    key="usuario-eliminar"
    path="/usuario/eliminar/:idUsuario"
    element={ValidarPermiso(lazyPage(() => import("../../pages/usuario/usuarioEliminarPage")))}
  />,
  <Route
    key="usuario-cambiarpassword"
    path="/usuario/cambiarpassword/:idUsuario"
    element={ValidarPermiso(lazyPage(() => import("../../pages/usuario/usuarioPasswordPage")))}
  />,
  <Route
    key="usuario-log"
    path="/usuario/log/:idUsuario"
    element={ValidarPermiso(lazyPage(() => import("../../pages/usuario/usuarioLogPage")))}
  />,
];
