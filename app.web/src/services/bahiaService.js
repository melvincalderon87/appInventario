import { config } from "../config/config";
import { buildListQuery, normalizePagedResult } from "../utils/pagination";
import { handleApiResponse, readApiErrorMessage as readErrorMessage } from "./apiResponse";

/** @typedef {import('../models/bahia/bahia').BahiaDTO} BahiaDTO */
/** @typedef {import('../models/bahia/bahia').BahiaLogDTO} BahiaLogDTO */

export class BahiaService {
  static async ListarOpcion() {
    const response = await fetch(`${config.apiUrl}/bahia/ListarOpcion`, {
      method: "GET",
      credentials: "include",
    });

    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok) {
      throw new Error(
        await readErrorMessage(response, "No fue posible obtener las opciones de bahias.")
      );
    }

    return await response.json();
  }

  static async listado(params = {}) {
    const query = buildListQuery(params);
    const response = await fetch(`${config.apiUrl}/bahia/Listar?${query}`, {
      method: "GET",
      credentials: "include",
    });

    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok) {
      throw new Error(
        await readErrorMessage(response, "No fue posible obtener el listado de bahias.")
      );
    }

    return normalizePagedResult(await response.json());
  }

  static async obtener(idBahia) {
    const response = await fetch(
      `${config.apiUrl}/bahia/Obtener?idbahia=${encodeURIComponent(idBahia)}`,
      {
        method: "GET",
        credentials: "include",
      }
    );

    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok) {
      throw new Error(await readErrorMessage(response, "No fue posible obtener la bahia."));
    }

    /** @type {BahiaDTO} */
    const bahia = await response.json();
    return bahia;
  }

  static async archivo(idBahia, codBahiaAdjunto) {
    const response = await fetch(
      `${config.apiUrl}/bahia/Archivo?idbahia=${encodeURIComponent(idBahia)}&codbahiaadjunto=${encodeURIComponent(codBahiaAdjunto)}`,
      {
        method: "GET",
        credentials: "include",
      }
    );

    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok) {
      throw new Error(
        await readErrorMessage(response, "No fue posible obtener el archivo de la bahia.")
      );
    }

    return await response.blob();
  }

  static async agregar(bahia) {
    return BahiaService.postJson("Agregar", bahia, "No fue posible agregar la bahia.");
  }

  static async editar(bahia) {
    return BahiaService.postJson("Editar", bahia, "No fue posible editar la bahia.");
  }

  static async eliminar(bahia) {
    return BahiaService.postJson("Eliminar", bahia, "No fue posible eliminar la bahia.");
  }

  static async log(idBahia) {
    const response = await fetch(
      `${config.apiUrl}/bahia/Log?idbahia=${encodeURIComponent(idBahia)}`,
      {
        method: "GET",
        credentials: "include",
      }
    );

    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok) {
      throw new Error(
        await readErrorMessage(response, "No fue posible obtener el log de la bahia.")
      );
    }

    /** @type {BahiaLogDTO[]} */
    const log = await response.json();
    return log;
  }

  static async postJson(action, body, fallbackMessage) {
    const response = await fetch(`${config.apiUrl}/bahia/${action}`, {
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
