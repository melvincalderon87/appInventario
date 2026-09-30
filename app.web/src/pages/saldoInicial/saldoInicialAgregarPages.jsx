import SaldoInicialPage from "./saldoInicialPage";
export const SaldoInicialCombustibleAgregarPage = () => (
  <SaldoInicialPage tipo="COMBUSTIBLE" mode="form" />
);
export const SaldoInicialAditivoAgregarPage = () => <SaldoInicialPage tipo="ADITIVO" mode="form" />;
export const SaldoInicialColoranteAgregarPage = () => (
  <SaldoInicialPage tipo="COLORANTE" mode="form" />
);
export const SaldoInicialCombustibleEditarPage = () => (
  <SaldoInicialPage tipo="COMBUSTIBLE" mode="form" />
);
export const SaldoInicialAditivoEditarPage = () => <SaldoInicialPage tipo="ADITIVO" mode="form" />;
export const SaldoInicialColoranteEditarPage = () => (
  <SaldoInicialPage tipo="COLORANTE" mode="form" />
);
export const SaldoInicialEtanolAgregarPage = () => <SaldoInicialPage tipo="ETANOL" mode="form" />;
export const SaldoInicialEtanolEditarPage = () => <SaldoInicialPage tipo="ETANOL" mode="form" />;
