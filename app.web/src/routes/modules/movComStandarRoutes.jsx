import { Route } from "react-router-dom";
import { ValidarPermiso } from "./ValidarPermiso";
import { lazyPage } from "./lazyPage";

export const movComStandarRoutes = [
  <Route
    key="movcomstandar"
    path="/movcomstandar"
    element={ValidarPermiso(lazyPage(() => import("../../pages/movComStandar/movComStandarPage")))}
  />,
];
