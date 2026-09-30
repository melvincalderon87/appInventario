import { Route } from "react-router-dom";
import { ValidarPermiso } from "./ValidarPermiso";
import { lazyPage } from "./lazyPage";

export const configuracionSistemaRoutes = [
  <Route
    key="configuracionsistema-listar"
    path="/configuracionsistema/listar"
    element={ValidarPermiso(
      lazyPage(() => import("../../pages/configuracionSistema/configuracionSistemaListPage"))
    )}
  />,
];
