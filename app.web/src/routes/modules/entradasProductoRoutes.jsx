import { Route } from "react-router-dom";
import { ValidarPermiso } from "./ValidarPermiso";
import { lazyPage } from "./lazyPage";

export const entradasProductoRoutes = [
  <Route
    key="entradasproducto-listar"
    path="/entradasproducto/listar"
    element={ValidarPermiso(
      lazyPage(() => import("../../pages/entradasProducto/entradasProductoListPage"))
    )}
  />,
  <Route
    key="entradasproducto-agregar"
    path="/entradasproducto/agregar"
    element={ValidarPermiso(
      lazyPage(() => import("../../pages/entradasProducto/entradasProductoAgregarPage"))
    )}
  />,
  <Route
    key="entradasproducto-visualizar"
    path="/entradasproducto/visualizar/:codDocumento"
    element={ValidarPermiso(
      lazyPage(() => import("../../pages/combustible/documentoAutorizacionPage"))
    )}
  />,
  <Route
    key="ajustes-entrada"
    path="/ajustes/entrada"
    element={ValidarPermiso(
      lazyPage(() => import("../../pages/entradasProducto/entradasProductoAgregarPage"))
    )}
  />,
  <Route
    key="ajustes-entrada-listar"
    path="/ajustes/entrada/listar"
    element={ValidarPermiso(
      lazyPage(() => import("../../pages/combustible/movimientoCombustibleListPage"))
    )}
  />,
  <Route
    key="ajustes-entrada-visualizar"
    path="/ajustes/entrada/visualizar/:codDocumento"
    element={ValidarPermiso(
      lazyPage(() => import("../../pages/combustible/documentoAutorizacionPage"))
    )}
  />,
  <Route
    key="unidad-entrada"
    path="/unidad/entrada"
    element={ValidarPermiso(
      lazyPage(() => import("../../pages/entradasProducto/entradasProductoAgregarPage"))
    )}
  />,
  <Route
    key="unidad-entrada-listar"
    path="/unidad/entrada/listar"
    element={ValidarPermiso(
      lazyPage(() => import("../../pages/combustible/movimientoCombustibleListPage"))
    )}
  />,
  <Route
    key="unidad-entrada-visualizar"
    path="/unidad/entrada/visualizar/:codDocumento"
    element={ValidarPermiso(
      lazyPage(() => import("../../pages/combustible/documentoAutorizacionPage"))
    )}
  />,
  <Route
    key="combustible-autorizadores"
    path="/combustible/autorizadores"
    element={ValidarPermiso(
      lazyPage(() => import("../../pages/combustible/autorizadoresCombustiblePage"))
    )}
  />,
  <Route
    key="gestion-autorizaciones-pendientes"
    path="/gestion/autorizaciones-pendientes"
    element={ValidarPermiso(
      lazyPage(() => import("../../pages/combustible/autorizacionesPendientesPage"))
    )}
  />,
];
