import { lazy } from "react";
import { routeSuspense } from "./lazyPage";

const PrivateRoute = lazy(() => import("../privateRoute"));

export function ValidarPermiso(element) {
  return routeSuspense(<PrivateRoute validarPermisoPantalla>{element}</PrivateRoute>);
}
