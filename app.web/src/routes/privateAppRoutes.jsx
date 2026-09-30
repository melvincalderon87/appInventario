import { lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { usuarioRoutes } from "./modules/usuarioRoutes";
import { usuarioConfiguracionRoutes } from "./modules/usuarioConfiguracionRoutes";
import { usuarioPreferenciaRoutes } from "./modules/usuarioPreferenciaRoutes";
import { usuarioSuplidorRoutes } from "./modules/usuarioSuplidorRoutes";
import { configuracionCorreoRoutes } from "./modules/configuracionCorreoRoutes";
import { configuracionSistemaRoutes } from "./modules/configuracionSistemaRoutes";
import { tareaRoutes } from "./modules/tareaRoutes";
import { notificacionRoutes } from "./modules/notificacionRoutes";
import { rolRoutes } from "./modules/rolRoutes";
import { permisoRoutes } from "./modules/permisoRoutes";
import { idiomaRoutes } from "./modules/idiomaRoutes";
import { menuRoutes } from "./modules/menuRoutes";
import { menuIdiomaRoutes } from "./modules/menuIdiomaRoutes";
import { tipoUsuarioRoutes } from "./modules/tipoUsuarioRoutes";
import { tipoProductoRoutes } from "./modules/tipoProductoRoutes";
import { socioRoutes } from "./modules/tipoSocioRoutes";
import { suplidorRoutes } from "./modules/socioRoutes";
import { personalRoutes } from "./modules/personalRoutes";
import { personalExternoRoutes } from "./modules/personalExternoRoutes";
import { companiaInspeccionRoutes } from "./modules/companiaInspeccionRoutes";
import { productoRoutes } from "./modules/productoRoutes";
import { bahiaRoutes } from "./modules/bahiaRoutes";
import { brazoRoutes } from "./modules/brazoRoutes";
import { metroRoutes } from "./modules/metroRoutes";
import { barcoRoutes } from "./modules/barcoRoutes";
import { tanqueRoutes } from "./modules/tanqueRoutes";
import { tuberiaRoutes } from "./modules/tuberiaRoutes";
import { capacidadVolumetricaTanqueRoutes } from "./modules/capacidadVolumetricaTanqueRoutes";
import { volumenTanqueRoutes } from "./modules/volumenTanqueRoutes";
import { calibracionCombustibleRoutes } from "./modules/calibracionCombustibleRoutes";
import { calibracionEtanolRoutes } from "./modules/calibracionEtanolRoutes";
import { calibracionAditivoRoutes } from "./modules/calibracionAditivoRoutes";
import { consumoPropioRoutes } from "./modules/consumoPropioRoutes";
import { coloranteRoutes } from "./modules/coloranteRoutes";
import { aditivoRoutes } from "./modules/aditivoRoutes";
import { salidasRoutes } from "./modules/salidasRoutes";
import { entradasProductoRoutes } from "./modules/entradasProductoRoutes";
import { compraVentaSuplidoresRoutes } from "./modules/compraVentaSuplidoresRoutes";
import { medicionTanqueTierraRoutes } from "./modules/medicionTanqueTierraRoutes";
import { tipoPermisoRoutes } from "./modules/tipoPermisoRoutes";
import { cambiarPasswordRoutes } from "./modules/cambiarPasswordRoutes";
import { menuRutaRoutes } from "./modules/menuRutaRoutes";
import { logModificacionRoutes } from "./modules/logModificacionRoutes";
import { auditoriaRoutes } from "./modules/auditoriaRoutes";
import { saldoInicialRoutes } from "./modules/saldoInicialRoutes";
import { movComStandarRoutes } from "./modules/movComStandarRoutes";
import { ventaRoutes } from "./modules/ventaRoutes";
import { etanolRoutes } from "./modules/etanolRoutes";
import { reportesRoutes } from "./modules/reportesRoutes";
import { routeSuspense } from "./modules/lazyPage";

const HomePage = lazy(() => import("../pages/homePage"));
const MainLayout = lazy(() => import("../layouts/mainLayout"));
const PrivateRoute = lazy(() => import("./privateRoute"));

const protectedLayoutElement = routeSuspense(
  <PrivateRoute>{routeSuspense(<MainLayout />, { fullPage: true })}</PrivateRoute>,
  { fullPage: true }
);
const homeElement = routeSuspense(<PrivateRoute>{routeSuspense(<HomePage />)}</PrivateRoute>);

export default function PrivateAppRoutes() {
  return (
    <Routes>
      <Route element={protectedLayoutElement}>
        <Route path="/inicio" element={homeElement} />
        {usuarioRoutes}
        {usuarioConfiguracionRoutes}
        {usuarioPreferenciaRoutes}
        {usuarioSuplidorRoutes}
        {configuracionCorreoRoutes}
        {configuracionSistemaRoutes}
        {tareaRoutes}
        {notificacionRoutes}
        {rolRoutes}
        {permisoRoutes}
        {idiomaRoutes}
        {menuRoutes}
        {menuIdiomaRoutes}
        {tipoUsuarioRoutes}
        {tipoProductoRoutes}
        {socioRoutes}
        {suplidorRoutes}
        {personalRoutes}
        {personalExternoRoutes}
        {companiaInspeccionRoutes}
        {productoRoutes}
        {bahiaRoutes}
        {brazoRoutes}
        {metroRoutes}
        {barcoRoutes}
        {tanqueRoutes}
        {tuberiaRoutes}
        {capacidadVolumetricaTanqueRoutes}
        {volumenTanqueRoutes}
        {calibracionCombustibleRoutes}
        {calibracionEtanolRoutes}
        {calibracionAditivoRoutes}
        {consumoPropioRoutes}
        {coloranteRoutes}
        {aditivoRoutes}
        {salidasRoutes}
        {entradasProductoRoutes}
        {compraVentaSuplidoresRoutes}
        {medicionTanqueTierraRoutes}
        {tipoPermisoRoutes}
        {cambiarPasswordRoutes}
        {menuRutaRoutes}
        {logModificacionRoutes}
        {auditoriaRoutes}
        {saldoInicialRoutes}
        {movComStandarRoutes}
        {ventaRoutes}
        {etanolRoutes}
        {reportesRoutes}
        <Route path="*" element={<Navigate to="/inicio" replace />} />
      </Route>
    </Routes>
  );
}
