import { config } from "../config/config";
import { buildListQuery, normalizePagedResult } from "../utils/pagination";
import { handleApiResponse, readApiErrorMessage as readErrorMessage } from "./apiResponse";

/** @typedef {import('../models/suplidor/suplidor').SuplidorDTO} SuplidorDTO */
/** @typedef {import('../models/suplidor/suplidor').SuplidorLogDTO} SuplidorLogDTO */

export class SuplidorService {
  static async listarDistribucion(idSuplidor) {
    const response = await fetch(
      `${config.apiUrl}/suplidor/ListarDistribucion?idsuplidor=${encodeURIComponent(idSuplidor)}`,
      { method: "GET", credentials: "include" }
    );
    if (!response.ok)
      throw new Error(await readErrorMessage(response, "No fue posible obtener la distribución."));
    return response.json();
  }

  static async guardarDistribucion(idSuplidor, detalles) {
    return SuplidorService.postJson(
      `GuardarDistribucion?idsuplidor=${encodeURIComponent(idSuplidor)}`,
      detalles,
      "No fue posible guardar la distribución."
    );
  }
  static async ListarOpcion() {
    const response = await fetch(`${config.apiUrl}/suplidor/ListarOpcion`, {
      method: "GET",
      credentials: "include",
    });

    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok) {
      throw new Error(
        await readErrorMessage(response, "No fue posible obtener las opciones de suplidores.")
      );
    }

    return await response.json();
  }

  static async listado(params = {}) {
    const query = buildListQuery(params);
    const response = await fetch(`${config.apiUrl}/suplidor/Listar?${query}`, {
      method: "GET",
      credentials: "include",
    });

    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok) {
      throw new Error(
        await readErrorMessage(response, "No fue posible obtener el listado de suplidores.")
      );
    }

    return normalizePagedResult(await response.json());
  }

  static async obtener(idSuplidor) {
    const response = await fetch(
      `${config.apiUrl}/suplidor/Obtener?idsuplidor=${encodeURIComponent(idSuplidor)}`,
      {
        method: "GET",
        credentials: "include",
      }
    );

    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok) {
      throw new Error(await readErrorMessage(response, "No fue posible obtener el suplidor."));
    }

    /** @type {SuplidorDTO} */
    const suplidor = await response.json();
    return suplidor;
  }

  static async agregar(suplidor) {
    return SuplidorService.postJson("Agregar", suplidor, "No fue posible agregar el suplidor.");
  }

  static async editar(suplidor) {
    return SuplidorService.postJson("Editar", suplidor, "No fue posible editar el suplidor.");
  }

  static async eliminar(suplidor) {
    return SuplidorService.postJson("Eliminar", suplidor, "No fue posible eliminar el suplidor.");
  }

  static async log(idSuplidor) {
    const response = await fetch(
      `${config.apiUrl}/suplidor/Log?idsuplidor=${encodeURIComponent(idSuplidor)}`,
      {
        method: "GET",
        credentials: "include",
      }
    );

    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok) {
      throw new Error(
        await readErrorMessage(response, "No fue posible obtener el log del suplidor.")
      );
    }

    /** @type {SuplidorLogDTO[]} */
    const log = await response.json();
    return log;
  }

  static async postJson(action, body, fallbackMessage) {
    const response = await fetch(`${config.apiUrl}/suplidor/${action}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(body),
    });

    return await handleApiResponse(response, fallbackMessage);
  }
}
