import { Route } from "react-router-dom";
import { ValidarPermiso } from "./ValidarPermiso";
import { lazyPage } from "./lazyPage";

export const volumenTanqueRoutes = [
  <Route
    key="volumentanque-listar"
    path="/volumentanque/listar"
    element={ValidarPermiso(
      lazyPage(() => import("../../pages/volumenTanque/volumenTanqueListPage"))
    )}
  />,
  <Route
    key="volumentanque-agregar"
    path="/volumentanque/agregar"
    element={ValidarPermiso(
      lazyPage(() => import("../../pages/volumenTanque/volumenTanqueAgregarPage"))
    )}
  />,
  <Route
    key="volumentanque-visualizar"
    path="/volumentanque/visualizar/:idVolumenTanque"
    element={ValidarPermiso(
      lazyPage(() => import("../../pages/volumenTanque/volumenTanqueVisualizarPage"))
    )}
  />,
  <Route
    key="volumentanque-editar"
    path="/volumentanque/editar/:idVolumenTanque"
    element={ValidarPermiso(
      lazyPage(() => import("../../pages/volumenTanque/volumenTanqueEditarPage"))
    )}
  />,
  <Route
    key="volumentanque-eliminar"
    path="/volumentanque/eliminar/:idVolumenTanque"
    element={ValidarPermiso(
      lazyPage(() => import("../../pages/volumenTanque/volumenTanqueEliminarPage"))
    )}
  />,
  <Route
    key="volumentanque-log"
    path="/volumentanque/log/:idVolumenTanque"
    element={ValidarPermiso(
      lazyPage(() => import("../../pages/volumenTanque/volumenTanqueLogPage"))
    )}
  />,
];
