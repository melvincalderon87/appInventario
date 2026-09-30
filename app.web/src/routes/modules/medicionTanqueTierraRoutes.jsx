import { Route } from "react-router-dom";
import { ValidarPermiso } from "./ValidarPermiso";
import { lazyPage } from "./lazyPage";

export const medicionTanqueTierraRoutes = [
  <Route
    key="mediciontanquetierra-listar"
    path="/mediciontanquetierra/listar"
    element={ValidarPermiso(
      lazyPage(() => import("../../pages/medicionTanqueTierra/medicionTanqueTierraListPage"))
    )}
  />,
  <Route
    key="mediciontanquetierra-agregar"
    path="/mediciontanquetierra/agregar"
    element={ValidarPermiso(
      lazyPage(() => import("../../pages/medicionTanqueTierra/medicionTanqueTierraAgregarPage"))
    )}
  />,
  <Route
    key="mediciontanquetierra-visualizar"
    path="/mediciontanquetierra/visualizar/:idMedicionTanqueTierra"
    element={ValidarPermiso(
      lazyPage(() => import("../../pages/medicionTanqueTierra/medicionTanqueTierraVisualizarPage"))
    )}
  />,
  <Route
    key="mediciontanquetierra-editar"
    path="/mediciontanquetierra/editar/:idMedicionTanqueTierra"
    element={ValidarPermiso(
      lazyPage(() => import("../../pages/medicionTanqueTierra/medicionTanqueTierraEditarPage"))
    )}
  />,
  <Route
    key="mediciontanquetierra-eliminar"
    path="/mediciontanquetierra/eliminar/:idMedicionTanqueTierra"
    element={ValidarPermiso(
      lazyPage(() => import("../../pages/medicionTanqueTierra/medicionTanqueTierraEliminarPage"))
    )}
  />,
  <Route
    key="mediciontanquetierra-log"
    path="/mediciontanquetierra/log/:idMedicionTanqueTierra"
    element={ValidarPermiso(
      lazyPage(() => import("../../pages/medicionTanqueTierra/medicionTanqueTierraLogPage"))
    )}
  />,
];
