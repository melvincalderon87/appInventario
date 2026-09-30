import { Route } from "react-router-dom";
import { ValidarPermiso } from "./ValidarPermiso";
import { lazyPage } from "./lazyPage";

export const personalExternoRoutes = [
  <Route
    key="personalexterno-listar"
    path="/personalexterno/listar"
    element={ValidarPermiso(
      lazyPage(() => import("../../pages/personalExterno/personalExternoListPage"))
    )}
  />,
  <Route
    key="personalexterno-listar-compania"
    path="/personalexterno/listar/:idCompaniaInspeccion"
    element={ValidarPermiso(
      lazyPage(() => import("../../pages/personalExterno/personalExternoListPage"))
    )}
  />,
  <Route
    key="personalexterno-agregar"
    path="/personalexterno/agregar"
    element={ValidarPermiso(
      lazyPage(() => import("../../pages/personalExterno/personalExternoAgregarPage"))
    )}
  />,
  <Route
    key="personalexterno-agregar-compania"
    path="/personalexterno/agregar/:idCompaniaInspeccion"
    element={ValidarPermiso(
      lazyPage(() => import("../../pages/personalExterno/personalExternoAgregarPage"))
    )}
  />,
  <Route
    key="personalexterno-visualizar"
    path="/personalexterno/visualizar/:idPersonalExterno"
    element={ValidarPermiso(
      lazyPage(() => import("../../pages/personalExterno/personalExternoVisualizarPage"))
    )}
  />,
  <Route
    key="personalexterno-editar"
    path="/personalexterno/editar/:idPersonalExterno"
    element={ValidarPermiso(
      lazyPage(() => import("../../pages/personalExterno/personalExternoEditarPage"))
    )}
  />,
  <Route
    key="personalexterno-eliminar"
    path="/personalexterno/eliminar/:idPersonalExterno"
    element={ValidarPermiso(
      lazyPage(() => import("../../pages/personalExterno/personalExternoEliminarPage"))
    )}
  />,
  <Route
    key="personalexterno-log"
    path="/personalexterno/log/:idPersonalExterno"
    element={ValidarPermiso(
      lazyPage(() => import("../../pages/personalExterno/personalExternoLogPage"))
    )}
  />,
];
