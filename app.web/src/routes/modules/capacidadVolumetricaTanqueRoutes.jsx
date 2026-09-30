import { Route } from "react-router-dom";
import { ValidarPermiso } from "./ValidarPermiso";
import { lazyPage } from "./lazyPage";

export const capacidadVolumetricaTanqueRoutes = [
  <Route
    key="capacidadvolumetricatanque-listar"
    path="/capacidadvolumetricatanque/listar"
    element={ValidarPermiso(
      lazyPage(
        () => import("../../pages/capacidadVolumetricaTanque/capacidadVolumetricaTanqueListPage")
      )
    )}
  />,
  <Route
    key="capacidadvolumetricatanque-listar-tanque"
    path="/capacidadvolumetricatanque/listar/:idTanque"
    element={ValidarPermiso(
      lazyPage(
        () => import("../../pages/capacidadVolumetricaTanque/capacidadVolumetricaTanqueListPage")
      )
    )}
  />,
  <Route
    key="capacidadvolumetricatanque-agregar"
    path="/capacidadvolumetricatanque/agregar"
    element={ValidarPermiso(
      lazyPage(
        () => import("../../pages/capacidadVolumetricaTanque/capacidadVolumetricaTanqueAgregarPage")
      )
    )}
  />,
  <Route
    key="capacidadvolumetricatanque-agregar-tanque"
    path="/capacidadvolumetricatanque/agregar/:idTanque"
    element={ValidarPermiso(
      lazyPage(
        () => import("../../pages/capacidadVolumetricaTanque/capacidadVolumetricaTanqueAgregarPage")
      )
    )}
  />,
  <Route
    key="capacidadvolumetricatanque-plantilla-directa"
    path="/capacidadvolumetricatanque/agregar/directa/:idTanque"
    element={ValidarPermiso(
      lazyPage(
        () =>
          import("../../pages/capacidadVolumetricaTanque/capacidadVolumetricaTanquePlantillaAditivoPage")
      )
    )}
  />,
  <Route
    key="capacidadvolumetricatanque-visualizar"
    path="/capacidadvolumetricatanque/visualizar/:idCapacidadVolumetricaTanque"
    element={ValidarPermiso(
      lazyPage(
        () =>
          import("../../pages/capacidadVolumetricaTanque/capacidadVolumetricaTanqueVisualizarPage")
      )
    )}
  />,
  <Route
    key="capacidadvolumetricatanque-editar"
    path="/capacidadvolumetricatanque/editar/:idCapacidadVolumetricaTanque"
    element={ValidarPermiso(
      lazyPage(
        () => import("../../pages/capacidadVolumetricaTanque/capacidadVolumetricaTanqueEditarPage")
      )
    )}
  />,
  <Route
    key="capacidadvolumetricatanque-eliminar"
    path="/capacidadvolumetricatanque/eliminar/:idCapacidadVolumetricaTanque"
    element={ValidarPermiso(
      lazyPage(
        () =>
          import("../../pages/capacidadVolumetricaTanque/capacidadVolumetricaTanqueEliminarPage")
      )
    )}
  />,
  <Route
    key="capacidadvolumetricatanque-log"
    path="/capacidadvolumetricatanque/log/:idCapacidadVolumetricaTanque"
    element={ValidarPermiso(
      lazyPage(
        () => import("../../pages/capacidadVolumetricaTanque/capacidadVolumetricaTanqueLogPage")
      )
    )}
  />,
];
