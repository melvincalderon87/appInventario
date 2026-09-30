import { config } from "../config/config";
import { handleApiResponse } from "./apiResponse";
import { buildListQuery, normalizePagedResult } from "../utils/pagination";

/** @typedef {import('../models/barco/barco').IngresoBarcoDTO} IngresoBarcoDTO */

export class IngresoBarcoService {
  static async listado(params = {}) {
    const response = await fetch(`${config.apiUrl}/ingresobarco/Listar?${buildListQuery(params)}`, {
      method: "GET",
      credentials: "include",
    });
    return normalizePagedResult(
      await handleApiResponse(response, "No fue posible obtener el listado de ingresos de barco.")
    );
  }

  static async obtener(codigo) {
    const response = await fetch(
      `${config.apiUrl}/ingresobarco/Obtener?codigo=${encodeURIComponent(codigo)}`,
      {
        method: "GET",
        credentials: "include",
      }
    );
    return await handleApiResponse(response, "No fue posible obtener el ingreso de barco.");
  }

  static async listarProductoCombustibleOpcion() {
    const response = await fetch(`${config.apiUrl}/ingresobarco/ListarProductoOpcion`, {
      method: "GET",
      credentials: "include",
    });
    return await handleApiResponse(
      response,
      "No fue posible obtener los productos tipo combustible."
    );
  }

  /** @param {IngresoBarcoDTO} ingreso */
  static async agregar(ingreso) {
    const response = await fetch(`${config.apiUrl}/ingresobarco/Agregar`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(ingreso),
    });

    return await handleApiResponse(response, "No fue posible guardar el ingreso de barco.");
  }

  static async editar(ingreso) {
    const response = await fetch(`${config.apiUrl}/ingresobarco/Editar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(ingreso),
    });
    return await handleApiResponse(response, "No fue posible actualizar el ingreso de barco.");
  }
}
