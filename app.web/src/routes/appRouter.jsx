import { lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { routeSuspense } from "./modules/lazyPage";

const LoginPage = lazy(() => import("../pages/loginPage"));
const PrivateAppRoutes = lazy(() => import("./privateAppRoutes"));

const loginElement = routeSuspense(<LoginPage />, { fullPage: true });

function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={loginElement} />
      <Route path="/*" element={routeSuspense(<PrivateAppRoutes />, { fullPage: true })} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default AppRouter;
