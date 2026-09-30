import { Route } from "react-router-dom";
import { ValidarPermiso } from "./ValidarPermiso";
import { lazyPage } from "./lazyPage";

export const aditivoRoutes = [
  <Route
    key="aditivo-listar"
    path="/aditivo/listar"
    element={ValidarPermiso(lazyPage(() => import("../../pages/aditivo/aditivoListPage")))}
  />,
  <Route
    key="aditivo-ingreso-listar"
    path="/aditivo/ingreso/listar"
    element={ValidarPermiso(lazyPage(() => import("../../pages/aditivo/aditivoIngresoListPage")))}
  />,
  <Route
    key="aditivo-salida-listar"
    path="/aditivo/salida/listar"
    element={ValidarPermiso(lazyPage(() => import("../../pages/aditivo/aditivoSalidaListPage")))}
  />,
  <Route
    key="aditivo-ingreso"
    path="/aditivo/ingreso"
    element={ValidarPermiso(lazyPage(() => import("../../pages/aditivo/aditivoIngresoPage")))}
  />,
  <Route
    key="aditivo-salida"
    path="/aditivo/salida"
    element={ValidarPermiso(lazyPage(() => import("../../pages/aditivo/aditivoSalidaPage")))}
  />,
  <Route
    key="aditivo-visualizar"
    path="/aditivo/visualizar/:idAditivo"
    element={ValidarPermiso(lazyPage(() => import("../../pages/aditivo/aditivoVisualizarPage")))}
  />,
  <Route
    key="aditivo-editar"
    path="/aditivo/editar/:idAditivo"
    element={ValidarPermiso(lazyPage(() => import("../../pages/aditivo/aditivoEditarPage")))}
  />,
  <Route
    key="aditivo-eliminar"
    path="/aditivo/eliminar/:idAditivo"
    element={ValidarPermiso(lazyPage(() => import("../../pages/aditivo/aditivoEliminarPage")))}
  />,
];
