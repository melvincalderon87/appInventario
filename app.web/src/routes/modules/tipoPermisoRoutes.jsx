import { Route } from "react-router-dom";
import { ValidarPermiso } from "./ValidarPermiso";
import { lazyPage } from "./lazyPage";

export const tipoPermisoRoutes = [
  <Route
    key="tipopermiso-listar"
    path="/tipopermiso/listar"
    element={ValidarPermiso(lazyPage(() => import("../../pages/tipoPermiso/tipoPermisoListPage")))}
  />,
  <Route
    key="tipopermiso-agregar"
    path="/tipopermiso/agregar"
    element={ValidarPermiso(
      lazyPage(() => import("../../pages/tipoPermiso/tipoPermisoAgregarPage"))
    )}
  />,
  <Route
    key="tipopermiso-visualizar"
    path="/tipopermiso/visualizar/:idTipoPermiso"
    element={ValidarPermiso(
      lazyPage(() => import("../../pages/tipoPermiso/tipoPermisoVisualizarPage"))
    )}
  />,
  <Route
    key="tipopermiso-editar"
    path="/tipopermiso/editar/:idTipoPermiso"
    element={ValidarPermiso(
      lazyPage(() => import("../../pages/tipoPermiso/tipoPermisoEditarPage"))
    )}
  />,
  <Route
    key="tipopermiso-eliminar"
    path="/tipopermiso/eliminar/:idTipoPermiso"
    element={ValidarPermiso(
      lazyPage(() => import("../../pages/tipoPermiso/tipoPermisoEliminarPage"))
    )}
  />,
  <Route
    key="tipopermiso-log"
    path="/tipopermiso/log/:idTipoPermiso"
    element={ValidarPermiso(lazyPage(() => import("../../pages/tipoPermiso/tipoPermisoLogPage")))}
  />,
];
