import { Navigate, Route } from "react-router-dom";
import { ValidarPermiso } from "./ValidarPermiso";
import { lazyPage } from "./lazyPage";

export const usuarioPreferenciaRoutes = [
  <Route
    key="usuariopreferencia-listar-root"
    path="/usuariopreferencia/listar"
    element={ValidarPermiso(<Navigate to="/usuario/listar" replace />)}
  />,
  <Route
    key="usuariopreferencia-listar"
    path="/usuariopreferencia/listar/:idUsuario"
    element={ValidarPermiso(
      lazyPage(() => import("../../pages/usuarioPreferencia/usuarioPreferenciaListPage"))
    )}
  />,
  <Route
    key="usuariopreferencia-agregar"
    path="/usuariopreferencia/agregar/:idUsuario"
    element={ValidarPermiso(
      lazyPage(() => import("../../pages/usuarioPreferencia/usuarioPreferenciaAgregarPage"))
    )}
  />,
  <Route
    key="usuariopreferencia-visualizar"
    path="/usuariopreferencia/visualizar/:idUsuario"
    element={ValidarPermiso(
      lazyPage(() => import("../../pages/usuarioPreferencia/usuarioPreferenciaVisualizarPage"))
    )}
  />,
  <Route
    key="usuariopreferencia-editar"
    path="/usuariopreferencia/editar/:idUsuario"
    element={ValidarPermiso(
      lazyPage(() => import("../../pages/usuarioPreferencia/usuarioPreferenciaEditarPage"))
    )}
  />,
  <Route
    key="usuariopreferencia-eliminar"
    path="/usuariopreferencia/eliminar/:idUsuario"
    element={ValidarPermiso(
      lazyPage(() => import("../../pages/usuarioPreferencia/usuarioPreferenciaEliminarPage"))
    )}
  />,
  <Route
    key="usuariopreferencia-log"
    path="/usuariopreferencia/log/:idUsuario"
    element={ValidarPermiso(
      lazyPage(() => import("../../pages/usuarioPreferencia/usuarioPreferenciaLogPage"))
    )}
  />,
];
