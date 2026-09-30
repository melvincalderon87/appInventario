import { Route } from "react-router-dom";
import { ValidarPermiso } from "./ValidarPermiso";
import { lazyPage } from "./lazyPage";

export const configuracionCorreoRoutes = [
  <Route
    key="configuracioncorreo-listar"
    path="/configuracioncorreo/listar"
    element={ValidarPermiso(
      lazyPage(() => import("../../pages/configuracionCorreo/configuracionCorreoListPage"))
    )}
  />,
  <Route
    key="configuracioncorreo-agregar"
    path="/configuracioncorreo/agregar"
    element={ValidarPermiso(
      lazyPage(() => import("../../pages/configuracionCorreo/configuracionCorreoAgregarPage"))
    )}
  />,
  <Route
    key="configuracioncorreo-visualizar"
    path="/configuracioncorreo/visualizar/:idConfiguracionCorreo"
    element={ValidarPermiso(
      lazyPage(() => import("../../pages/configuracionCorreo/configuracionCorreoVisualizarPage"))
    )}
  />,
  <Route
    key="configuracioncorreo-editar"
    path="/configuracioncorreo/editar/:idConfiguracionCorreo"
    element={ValidarPermiso(
      lazyPage(() => import("../../pages/configuracionCorreo/configuracionCorreoEditarPage"))
    )}
  />,
  <Route
    key="configuracioncorreo-eliminar"
    path="/configuracioncorreo/eliminar/:idConfiguracionCorreo"
    element={ValidarPermiso(
      lazyPage(() => import("../../pages/configuracionCorreo/configuracionCorreoEliminarPage"))
    )}
  />,
  <Route
    key="configuracioncorreo-log"
    path="/configuracioncorreo/log/:idConfiguracionCorreo"
    element={ValidarPermiso(
      lazyPage(() => import("../../pages/configuracionCorreo/configuracionCorreoLogPage"))
    )}
  />,
];
