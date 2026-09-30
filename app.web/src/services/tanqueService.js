import { config } from "../config/config";
import { buildListQuery, normalizePagedResult } from "../utils/pagination";
import { handleApiResponse, readApiErrorMessage as readErrorMessage } from "./apiResponse";

/** @typedef {import('../models/tanque/tanque').TanqueDTO} TanqueDTO */
/** @typedef {import('../models/tanque/tanque').TanqueLogDTO} TanqueLogDTO */

export class TanqueService {
  static async ListarOpcion(params = {}) {
    const searchParams = new URLSearchParams();

    appendTankFilters(searchParams, params);

    const query = searchParams.toString();
    const url = query
      ? `${config.apiUrl}/tanque/ListarOpcion?${query}`
      : `${config.apiUrl}/tanque/ListarOpcion`;
    const response = await fetch(url, {
      method: "GET",
      credentials: "include",
    });

    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok) {
      throw new Error(
        await readErrorMessage(response, "No fue posible obtener las opciones de tanques.")
      );
    }

    return await response.json();
  }

  static async listado(params = {}) {
    const searchParams = new URLSearchParams(buildListQuery(params));
    appendTankFilters(searchParams, params);

    const query = searchParams.toString();
    const response = await fetch(`${config.apiUrl}/tanque/Listar?${query}`, {
      method: "GET",
      credentials: "include",
    });

    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok) {
      throw new Error(
        await readErrorMessage(response, "No fue posible obtener el listado de tanques.")
      );
    }

    return normalizePagedResult(await response.json());
  }

  static async obtener(idTanque) {
    const response = await fetch(
      `${config.apiUrl}/tanque/Obtener?idtanque=${encodeURIComponent(idTanque)}`,
      {
        method: "GET",
        credentials: "include",
      }
    );

    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok) {
      throw new Error(await readErrorMessage(response, "No fue posible obtener el tanque."));
    }

    /** @type {TanqueDTO} */
    const tanque = await response.json();
    return tanque;
  }

  static async archivo(idTanque, codTanqueAdjunto) {
    const response = await fetch(
      `${config.apiUrl}/tanque/Archivo?idtanque=${encodeURIComponent(idTanque)}&codtanqueadjunto=${encodeURIComponent(codTanqueAdjunto)}`,
      {
        method: "GET",
        credentials: "include",
      }
    );

    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok) {
      throw new Error(
        await readErrorMessage(response, "No fue posible obtener el archivo del tanque.")
      );
    }

    return await response.blob();
  }

  static async agregar(tanque) {
    return TanqueService.postJson("Agregar", tanque, "No fue posible agregar el tanque.");
  }

  static async editar(tanque) {
    return TanqueService.postJson("Editar", tanque, "No fue posible editar el tanque.");
  }

  static async eliminar(tanque) {
    return TanqueService.postJson("Eliminar", tanque, "No fue posible eliminar el tanque.");
  }

  static async log(idTanque) {
    const response = await fetch(
      `${config.apiUrl}/tanque/Log?idtanque=${encodeURIComponent(idTanque)}`,
      {
        method: "GET",
        credentials: "include",
      }
    );

    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok) {
      throw new Error(
        await readErrorMessage(response, "No fue posible obtener el log del tanque.")
      );
    }

    /** @type {TanqueLogDTO[]} */
    const log = await response.json();
    return log;
  }

  static async postJson(action, body, fallbackMessage) {
    const response = await fetch(`${config.apiUrl}/tanque/${action}`, {
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

function appendTankFilters(searchParams, params = {}) {
  if (params.consumoPropio !== undefined && params.consumoPropio !== null) {
    searchParams.set("consumopropio", String(params.consumoPropio));
  }

  if (String(params.tipoProducto ?? "").trim()) {
    searchParams.set("tipoproducto", String(params.tipoProducto).trim());
  }
}
