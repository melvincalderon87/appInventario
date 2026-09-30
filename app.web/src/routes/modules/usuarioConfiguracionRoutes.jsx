import { Navigate, Route } from "react-router-dom";
import { ValidarPermiso } from "./ValidarPermiso";
import { lazyPage } from "./lazyPage";

export const usuarioConfiguracionRoutes = [
  <Route
    key="usuarioconfiguracion-listar-root"
    path="/usuarioconfiguracion/listar"
    element={ValidarPermiso(<Navigate to="/usuario/listar" replace />)}
  />,
  <Route
    key="usuarioconfiguracion-listar"
    path="/usuarioconfiguracion/listar/:idUsuario"
    element={ValidarPermiso(
      lazyPage(() => import("../../pages/usuarioConfiguracion/usuarioConfiguracionListPage"))
    )}
  />,
  <Route
    key="usuarioconfiguracion-agregar"
    path="/usuarioconfiguracion/agregar/:idUsuario"
    element={ValidarPermiso(
      lazyPage(() => import("../../pages/usuarioConfiguracion/usuarioConfiguracionAgregarPage"))
    )}
  />,
  <Route
    key="usuarioconfiguracion-visualizar"
    path="/usuarioconfiguracion/visualizar/:idUsuario"
    element={ValidarPermiso(
      lazyPage(() => import("../../pages/usuarioConfiguracion/usuarioConfiguracionVisualizarPage"))
    )}
  />,
  <Route
    key="usuarioconfiguracion-editar"
    path="/usuarioconfiguracion/editar/:idUsuario"
    element={ValidarPermiso(
      lazyPage(() => import("../../pages/usuarioConfiguracion/usuarioConfiguracionEditarPage"))
    )}
  />,
  <Route
    key="usuarioconfiguracion-eliminar"
    path="/usuarioconfiguracion/eliminar/:idUsuario"
    element={ValidarPermiso(
      lazyPage(() => import("../../pages/usuarioConfiguracion/usuarioConfiguracionEliminarPage"))
    )}
  />,
  <Route
    key="usuarioconfiguracion-log"
    path="/usuarioconfiguracion/log/:idUsuario"
    element={ValidarPermiso(
      lazyPage(() => import("../../pages/usuarioConfiguracion/usuarioConfiguracionLogPage"))
    )}
  />,
];
