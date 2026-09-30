import { Route } from "react-router-dom";
import { ValidarPermiso } from "./ValidarPermiso";
import { lazyPage } from "./lazyPage";

const Listado = lazyPage(() => import("../../pages/etanol/etanolMovimientoListPage"));
const Agregar = lazyPage(() => import("../../pages/etanol/etanolMovimientoAgregarPage"));
const Documento = lazyPage(() => import("../../pages/combustible/documentoAutorizacionPage"));
const modulos = [
  "entradas",
  "salidas",
  "compraventasuplidores",
  "ingresotuberias",
  "unidad-entrada",
  "unidad-salida",
  "ajuste-entrada",
  "ajuste-salida",
];
export const etanolRoutes = modulos.flatMap((modulo) => [
  <Route
    key={`etanol-${modulo}-listar`}
    path={`/etanol/${modulo}/listar`}
    element={ValidarPermiso(Listado)}
  />,
  <Route
    key={`etanol-${modulo}-agregar`}
    path={`/etanol/${modulo}/agregar`}
    element={ValidarPermiso(Agregar)}
  />,
  <Route
    key={`etanol-${modulo}-editar`}
    path={`/etanol/${modulo}/editar/:codigo`}
    element={ValidarPermiso(Agregar)}
  />,
  <Route
    key={`etanol-${modulo}-visualizar`}
    path={`/etanol/${modulo}/visualizar/:codDocumento`}
    element={ValidarPermiso(Documento)}
  />,
]);
