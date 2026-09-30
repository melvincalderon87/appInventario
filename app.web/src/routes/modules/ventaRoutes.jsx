import { Route } from "react-router-dom";
import { ValidarPermiso } from "./ValidarPermiso";
import { lazyPage } from "./lazyPage";
export const ventaRoutes = [
  <Route
    key="ventas-listar"
    path="/ventas/listar"
    element={ValidarPermiso(lazyPage(() => import("../../pages/venta/ventaListPage")))}
  />,
  <Route
    key="ventas-agregar"
    path="/ventas/agregar"
    element={ValidarPermiso(lazyPage(() => import("../../pages/venta/ventaAgregarPage")))}
  />,
  <Route
    key="ventas-cargar-plantilla"
    path="/ventas/cargar-plantilla"
    element={ValidarPermiso(lazyPage(() => import("../../pages/venta/ventaPlantillaPage")))}
  />,
];
