import { Route } from "react-router-dom";
import { ValidarPermiso } from "./ValidarPermiso";
import { lazyPage } from "./lazyPage";

export const compraVentaSuplidoresRoutes = [
  <Route
    key="compraventasuplidores-listar"
    path="/compraventasuplidores/listar"
    element={ValidarPermiso(
      lazyPage(() => import("../../pages/compraVentaSuplidores/compraVentaSuplidoresListPage"))
    )}
  />,
  <Route
    key="compraventasuplidores-agregar"
    path="/compraventasuplidores/agregar"
    element={ValidarPermiso(
      lazyPage(() => import("../../pages/compraVentaSuplidores/compraVentaSuplidoresAgregarPage"))
    )}
  />,
  <Route
    key="compraventasuplidores-editar"
    path="/compraventasuplidores/editar/:idCompraVentaSuplidores"
    element={ValidarPermiso(
      lazyPage(() => import("../../pages/compraVentaSuplidores/compraVentaSuplidoresEditarPage"))
    )}
  />,
  <Route
    key="compraventasuplidores-visualizar"
    path="/compraventasuplidores/visualizar/:codDocumento"
    element={ValidarPermiso(
      lazyPage(() => import("../../pages/combustible/documentoAutorizacionPage"))
    )}
  />,
  <Route
    key="compraventasuplidores-eliminar"
    path="/compraventasuplidores/eliminar/:idCompraVentaSuplidores"
    element={ValidarPermiso(
      lazyPage(() => import("../../pages/compraVentaSuplidores/compraVentaSuplidoresEliminarPage"))
    )}
  />,
];
