import { config } from "../config/config";
import { handleApiResponse } from "./apiResponse";
export class AutorizacionCombustibleService {
  static async listar() {
    const r = await fetch(`${config.apiUrl}/autorizacioncombustible/Listar`, {
      credentials: "include",
    });
    return handleApiResponse(r, "No fue posible obtener los autorizadores.");
  }
  static async opciones() {
    const r = await fetch(`${config.apiUrl}/autorizacioncombustible/Opciones`, {
      credentials: "include",
    });
    return handleApiResponse(r, "No fue posible obtener las opciones.");
  }
  static async asignar(data) {
    const r = await fetch(`${config.apiUrl}/autorizacioncombustible/Asignar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });
    return handleApiResponse(r, "No fue posible asignar el autorizador.");
  }
  static async pendientes() {
    const r = await fetch(`${config.apiUrl}/autorizacioncombustible/Pendientes`, {
      credentials: "include",
    });
    return handleApiResponse(r, "No fue posible obtener los pendientes.");
  }
  static async documento(codMenu, codDocumento) {
    const r = await fetch(
      `${config.apiUrl}/autorizacioncombustible/Documento?codMenu=${encodeURIComponent(codMenu)}&codDocumento=${encodeURIComponent(codDocumento)}`,
      { credentials: "include" }
    );
    return handleApiResponse(r, "No fue posible obtener el documento.");
  }
  static async resolver(data) {
    const r = await fetch(`${config.apiUrl}/autorizacioncombustible/Resolver`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });
    return handleApiResponse(r, "No fue posible resolver la autorización.");
  }
}
