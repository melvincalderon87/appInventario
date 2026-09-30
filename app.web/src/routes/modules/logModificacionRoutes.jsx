import { Route } from "react-router-dom";
import { ValidarPermiso } from "./ValidarPermiso";
import { lazyPage } from "./lazyPage";

export const logModificacionRoutes = [
  <Route
    key="logmodificacion-listar"
    path="/logmodificacion/listar"
    element={ValidarPermiso(
      lazyPage(() => import("../../pages/logModificacion/logModificacionListPage"))
    )}
  />,
];
