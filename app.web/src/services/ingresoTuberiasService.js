import { config } from "../config/config";
import { handleApiResponse } from "./apiResponse";
import { buildListQuery, normalizePagedResult } from "../utils/pagination";

/** @typedef {import('../models/barco/barco').IngresoTuberiasDTO} IngresoTuberiasDTO */

export class IngresoTuberiasService {
  static async listado(params = {}) {
    const response = await fetch(
      `${config.apiUrl}/ingresotuberias/Listar?${buildListQuery(params)}`,
      { method: "GET", credentials: "include" }
    );
    return normalizePagedResult(
      await handleApiResponse(
        response,
        "No fue posible obtener el listado de ingresos por tuberias."
      )
    );
  }

  static async listarProductoCombustibleOpcion() {
    const response = await fetch(`${config.apiUrl}/ingresotuberias/ListarProductoOpcion`, {
      method: "GET",
      credentials: "include",
    });
    return await handleApiResponse(
      response,
      "No fue posible obtener los productos tipo combustible."
    );
  }

  /** @param {IngresoTuberiasDTO} ingreso */
  static async agregar(ingreso) {
    const response = await fetch(`${config.apiUrl}/ingresotuberias/Agregar`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(ingreso),
    });

    return await handleApiResponse(response, "No fue posible guardar el ingreso por tuberias.");
  }
}
