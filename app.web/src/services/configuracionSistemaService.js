import { config } from "../config/config";
import { handleApiResponse, readApiErrorMessage as readErrorMessage } from "./apiResponse";

export class ConfiguracionSistemaService {
  static async obtener() {
    const response = await fetch(`${config.apiUrl}/configuracionsistema/Listar`, {
      method: "GET",
      credentials: "include",
    });
    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok)
      throw new Error(
        await readErrorMessage(response, "No fue posible obtener la configuracion del sistema.")
      );
    return await response.json();
  }

  static async guardarEmpresa(empresa) {
    return this.post("GuardarEmpresa", empresa, "No fue posible guardar los datos de la empresa.");
  }
  static async guardarFondo(fondo) {
    return this.post("GuardarFondo", fondo, "No fue posible guardar el fondo.");
  }
  static async post(action, body, fallback) {
    const response = await fetch(`${config.apiUrl}/configuracionsistema/${action}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
    });
    return await handleApiResponse(response, fallback);
  }
  static async fondoInfo() {
    const response = await fetch(`${config.apiUrl}/configuracionsistema/FondoInfo`, {
      method: "GET",
      credentials: "include",
    });
    return response.ok ? await response.json() : { tieneFondo: false, version: 0 };
  }
  static async empresaInfo() {
    const response = await fetch(`${config.apiUrl}/configuracionsistema/EmpresaInfo`, {
      method: "GET",
      credentials: "include",
    });
    return response.ok ? await response.json() : {};
  }
  static fondoUrl(version = "") {
    return `${config.apiUrl}/configuracionsistema/Fondo${version ? `?v=${encodeURIComponent(version)}` : ""}`;
  }
  static logoUrl(version = "") {
    return `${config.apiUrl}/configuracionsistema/Logo${version ? `?v=${encodeURIComponent(version)}` : ""}`;
  }
}
