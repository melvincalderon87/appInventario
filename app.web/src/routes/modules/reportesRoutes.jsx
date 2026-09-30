import { Route } from "react-router-dom";
import { ValidarPermiso } from "./ValidarPermiso";
import { lazyPage } from "./lazyPage";

export const reportesRoutes = [
  <Route key="reporte-carga" path="/reportes/carga" element={ValidarPermiso(lazyPage(() => import("../../pages/reportes/reporteCargaPage")))} />,
  <Route key="reporte-ingresos-barco" path="/reportes/ingresos-barco" element={ValidarPermiso(lazyPage(() => import("../../pages/reportes/reporteCargaPage")))} />,
];
