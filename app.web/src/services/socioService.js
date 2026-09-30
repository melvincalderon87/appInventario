import { config } from "../config/config";
import { buildListQuery, normalizePagedResult } from "../utils/pagination";
import { handleApiResponse, readApiErrorMessage as readErrorMessage } from "./apiResponse";

/** @typedef {import('../models/socio/socio').SocioDTO} SocioDTO */
/** @typedef {import('../models/socio/socio').SocioLogDTO} SocioLogDTO */

export class SocioService {
  static async ListarOpcion() {
    const response = await fetch(`${config.apiUrl}/socio/ListarOpcion`, {
      method: "GET",
      credentials: "include",
    });

    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok) {
      throw new Error(
        await readErrorMessage(response, "No fue posible obtener las opciones de socios.")
      );
    }

    return await response.json();
  }

  static async listado(params = {}) {
    const query = buildListQuery(params);
    const response = await fetch(`${config.apiUrl}/socio/Listar?${query}`, {
      method: "GET",
      credentials: "include",
    });

    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok) {
      throw new Error(
        await readErrorMessage(response, "No fue posible obtener el listado de socios.")
      );
    }

    return normalizePagedResult(await response.json());
  }

  static async obtener(idSocio) {
    const response = await fetch(
      `${config.apiUrl}/socio/Obtener?idsocio=${encodeURIComponent(idSocio)}`,
      {
        method: "GET",
        credentials: "include",
      }
    );

    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok) {
      throw new Error(await readErrorMessage(response, "No fue posible obtener el socio."));
    }

    /** @type {SocioDTO} */
    const socio = await response.json();
    return socio;
  }

  static async agregar(socio) {
    return SocioService.postJson("Agregar", socio, "No fue posible agregar el socio.");
  }

  static async editar(socio) {
    return SocioService.postJson("Editar", socio, "No fue posible editar el socio.");
  }

  static async eliminar(socio) {
    return SocioService.postJson("Eliminar", socio, "No fue posible eliminar el socio.");
  }

  static async log(idSocio) {
    const response = await fetch(
      `${config.apiUrl}/socio/Log?idsocio=${encodeURIComponent(idSocio)}`,
      {
        method: "GET",
        credentials: "include",
      }
    );

    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok) {
      throw new Error(await readErrorMessage(response, "No fue posible obtener el log del socio."));
    }

    /** @type {SocioLogDTO[]} */
    const log = await response.json();
    return log;
  }

  static async postJson(action, body, fallbackMessage) {
    const response = await fetch(`${config.apiUrl}/socio/${action}`, {
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
