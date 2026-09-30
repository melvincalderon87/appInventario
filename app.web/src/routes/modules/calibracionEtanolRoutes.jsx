import { Route } from "react-router-dom";
import { ValidarPermiso } from "./ValidarPermiso";
import { lazyPage } from "./lazyPage";

export const calibracionEtanolRoutes = [
  <Route
    key="calibracionetanol-listar"
    path="/calibracionetanol/listar"
    element={ValidarPermiso(
      lazyPage(() => import("../../pages/calibracionEtanol/calibracionEtanolListPage"))
    )}
  />,
  <Route
    key="calibracionetanol-agregar"
    path="/calibracionetanol/agregar"
    element={ValidarPermiso(
      lazyPage(() => import("../../pages/calibracionEtanol/calibracionEtanolAgregarPage"))
    )}
  />,
  <Route
    key="calibracionetanol-visualizar"
    path="/calibracionetanol/visualizar/:idCalibracionEtanol"
    element={ValidarPermiso(
      lazyPage(() => import("../../pages/calibracionEtanol/calibracionEtanolVisualizarPage"))
    )}
  />,
  <Route
    key="calibracionetanol-editar"
    path="/calibracionetanol/editar/:idCalibracionEtanol"
    element={ValidarPermiso(
      lazyPage(() => import("../../pages/calibracionEtanol/calibracionEtanolEditarPage"))
    )}
  />,
  <Route
    key="calibracionetanol-eliminar"
    path="/calibracionetanol/eliminar/:idCalibracionEtanol"
    element={ValidarPermiso(
      lazyPage(() => import("../../pages/calibracionEtanol/calibracionEtanolEliminarPage"))
    )}
  />,
  <Route
    key="calibracionetanol-log"
    path="/calibracionetanol/log/:idCalibracionEtanol"
    element={ValidarPermiso(
      lazyPage(() => import("../../pages/calibracionEtanol/calibracionEtanolLogPage"))
    )}
  />,
];
