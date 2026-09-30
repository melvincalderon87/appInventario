import { Route } from "react-router-dom";
import { ValidarPermiso } from "./ValidarPermiso";
import { lazyPage } from "./lazyPage";

export const usuarioSuplidorRoutes = [
  <Route
    key="usuariosuplidor-listar"
    path="/usuariosuplidor/listar/:idUsuario"
    element={ValidarPermiso(
      lazyPage(() => import("../../pages/usuarioSuplidor/usuarioSuplidorListPage"))
    )}
  />,
];
