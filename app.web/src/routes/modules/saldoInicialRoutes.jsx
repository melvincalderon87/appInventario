import { Route } from "react-router-dom";
import { ValidarPermiso } from "./ValidarPermiso";
import { lazyPage } from "./lazyPage";
export const saldoInicialRoutes = [
  <Route
    key="saldo-inicial-combustible"
    path="/saldo-inicial/combustible"
    element={ValidarPermiso(
      lazyPage(() => import("../../pages/saldoInicial/saldoInicialCombustiblePage"))
    )}
  />,
  <Route
    key="saldo-inicial-combustible-listar"
    path="/saldo-inicial/combustible/listar"
    element={ValidarPermiso(
      lazyPage(() => import("../../pages/saldoInicial/saldoInicialCombustiblePage"))
    )}
  />,
  <Route
    key="saldo-inicial-combustible-agregar"
    path="/saldo-inicial/combustible/agregar"
    element={ValidarPermiso(
      lazyPage(() => import("../../pages/saldoInicial/saldoInicialCombustibleAgregarPage"))
    )}
  />,
  <Route
    key="saldo-inicial-combustible-editar"
    path="/saldo-inicial/combustible/editar/:idSaldoInicial"
    element={ValidarPermiso(
      lazyPage(() =>
        import("../../pages/saldoInicial/saldoInicialAgregarPages").then((m) => ({
          default: m.SaldoInicialCombustibleEditarPage,
        }))
      )
    )}
  />,
  <Route
    key="saldo-inicial-aditivo"
    path="/saldo-inicial/aditivo"
    element={ValidarPermiso(
      lazyPage(() => import("../../pages/saldoInicial/saldoInicialAditivoPage"))
    )}
  />,
  <Route
    key="saldo-inicial-aditivo-listar"
    path="/saldo-inicial/aditivo/listar"
    element={ValidarPermiso(
      lazyPage(() => import("../../pages/saldoInicial/saldoInicialAditivoPage"))
    )}
  />,
  <Route
    key="saldo-inicial-aditivo-agregar"
    path="/saldo-inicial/aditivo/agregar"
    element={ValidarPermiso(
      lazyPage(() =>
        import("../../pages/saldoInicial/saldoInicialAgregarPages").then((m) => ({
          default: m.SaldoInicialAditivoAgregarPage,
        }))
      )
    )}
  />,
  <Route
    key="saldo-inicial-aditivo-editar"
    path="/saldo-inicial/aditivo/editar/:idSaldoInicial"
    element={ValidarPermiso(
      lazyPage(() =>
        import("../../pages/saldoInicial/saldoInicialAgregarPages").then((m) => ({
          default: m.SaldoInicialAditivoEditarPage,
        }))
      )
    )}
  />,
  <Route
    key="saldo-inicial-colorante"
    path="/saldo-inicial/colorante"
    element={ValidarPermiso(
      lazyPage(() => import("../../pages/saldoInicial/saldoInicialColorantePage"))
    )}
  />,
  <Route
    key="saldo-inicial-colorante-listar"
    path="/saldo-inicial/colorante/listar"
    element={ValidarPermiso(
      lazyPage(() => import("../../pages/saldoInicial/saldoInicialColorantePage"))
    )}
  />,
  <Route
    key="saldo-inicial-colorante-agregar"
    path="/saldo-inicial/colorante/agregar"
    element={ValidarPermiso(
      lazyPage(() =>
        import("../../pages/saldoInicial/saldoInicialAgregarPages").then((m) => ({
          default: m.SaldoInicialColoranteAgregarPage,
        }))
      )
    )}
  />,
  <Route
    key="saldo-inicial-colorante-editar"
    path="/saldo-inicial/colorante/editar/:idSaldoInicial"
    element={ValidarPermiso(
      lazyPage(() =>
        import("../../pages/saldoInicial/saldoInicialAgregarPages").then((m) => ({
          default: m.SaldoInicialColoranteEditarPage,
        }))
      )
    )}
  />,
  <Route
    key="saldo-inicial-etanol"
    path="/saldo-inicial/etanol"
    element={ValidarPermiso(
      lazyPage(() => import("../../pages/saldoInicial/saldoInicialEtanolPage"))
    )}
  />,
  <Route
    key="saldo-inicial-etanol-listar"
    path="/saldo-inicial/etanol/listar"
    element={ValidarPermiso(
      lazyPage(() => import("../../pages/saldoInicial/saldoInicialEtanolPage"))
    )}
  />,
  <Route
    key="saldo-inicial-etanol-agregar"
    path="/saldo-inicial/etanol/agregar"
    element={ValidarPermiso(
      lazyPage(() =>
        import("../../pages/saldoInicial/saldoInicialAgregarPages").then((m) => ({
          default: m.SaldoInicialEtanolAgregarPage,
        }))
      )
    )}
  />,
  <Route
    key="saldo-inicial-etanol-editar"
    path="/saldo-inicial/etanol/editar/:idSaldoInicial"
    element={ValidarPermiso(
      lazyPage(() =>
        import("../../pages/saldoInicial/saldoInicialAgregarPages").then((m) => ({
          default: m.SaldoInicialEtanolEditarPage,
        }))
      )
    )}
  />,
];
