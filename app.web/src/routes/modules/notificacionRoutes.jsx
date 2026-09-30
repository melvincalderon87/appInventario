import { Route } from "react-router-dom";
import { ValidarPermiso } from "./ValidarPermiso";
import { lazyPage } from "./lazyPage";

export const notificacionRoutes = [
  <Route
    key="notificacion-listar"
    path="/notificacion/listar"
    element={ValidarPermiso(
      lazyPage(() => import("../../pages/notificacion/notificacionListPage"))
    )}
  />,
  <Route
    key="notificacion-agregar"
    path="/notificacion/agregar"
    element={ValidarPermiso(
      lazyPage(() => import("../../pages/notificacion/notificacionAgregarPage"))
    )}
  />,
  <Route
    key="notificacion-visualizar"
    path="/notificacion/visualizar/:idNotificacion"
    element={ValidarPermiso(
      lazyPage(() => import("../../pages/notificacion/notificacionVisualizarPage"))
    )}
  />,
  <Route
    key="notificacion-editar"
    path="/notificacion/editar/:idNotificacion"
    element={ValidarPermiso(
      lazyPage(() => import("../../pages/notificacion/notificacionEditarPage"))
    )}
  />,
  <Route
    key="notificacion-eliminar"
    path="/notificacion/eliminar/:idNotificacion"
    element={ValidarPermiso(
      lazyPage(() => import("../../pages/notificacion/notificacionEliminarPage"))
    )}
  />,
];
