import { Route } from "react-router-dom";
import { ValidarPermiso } from "./ValidarPermiso";
import { lazyPage } from "./lazyPage";

export const auditoriaRoutes = [
  <Route
    key="auditoria-listar"
    path="/auditoria/listar"
    element={ValidarPermiso(lazyPage(() => import("../../pages/auditoria/auditoriaListPage")))}
  />,
];
