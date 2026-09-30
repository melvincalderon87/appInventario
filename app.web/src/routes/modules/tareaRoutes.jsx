import { Route } from "react-router-dom";
import { ValidarPermiso } from "./ValidarPermiso";
import { lazyPage } from "./lazyPage";

export const tareaRoutes = [
  <Route
    key="tarea-listar"
    path="/tarea/listar"
    element={ValidarPermiso(lazyPage(() => import("../../pages/tarea/tareaListPage")))}
  />,
  <Route
    key="tarea-agregar"
    path="/tarea/agregar"
    element={ValidarPermiso(lazyPage(() => import("../../pages/tarea/tareaAgregarPage")))}
  />,
  <Route
    key="tarea-visualizar"
    path="/tarea/visualizar/:idTarea"
    element={ValidarPermiso(lazyPage(() => import("../../pages/tarea/tareaVisualizarPage")))}
  />,
  <Route
    key="tarea-editar"
    path="/tarea/editar/:idTarea"
    element={ValidarPermiso(lazyPage(() => import("../../pages/tarea/tareaEditarPage")))}
  />,
  <Route
    key="tarea-eliminar"
    path="/tarea/eliminar/:idTarea"
    element={ValidarPermiso(lazyPage(() => import("../../pages/tarea/tareaEliminarPage")))}
  />,
  <Route
    key="tarea-log"
    path="/tarea/log/:idTarea"
    element={ValidarPermiso(lazyPage(() => import("../../pages/tarea/tareaLogPage")))}
  />,
];
