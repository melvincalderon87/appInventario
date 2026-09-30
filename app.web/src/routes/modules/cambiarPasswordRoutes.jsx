import { Route } from "react-router-dom";
import { ValidarPermiso } from "./ValidarPermiso";
import { lazyPage } from "./lazyPage";

export const cambiarPasswordRoutes = [
  <Route
    key="cambiarpassword-cambiarpassword"
    path="/cambiarpassword/cambiarpassword"
    element={ValidarPermiso(
      lazyPage(() => import("../../pages/cambiarpassword/cambiarPasswordPage"))
    )}
  />,
];
