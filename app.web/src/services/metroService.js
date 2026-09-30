import { config } from "../config/config";
import { buildListQuery, normalizePagedResult } from "../utils/pagination";
import { handleApiResponse, readApiErrorMessage as readErrorMessage } from "./apiResponse";

/** @typedef {import('../models/metro/metro').MetroDTO} MetroDTO */
/** @typedef {import('../models/metro/metro').MetroLogDTO} MetroLogDTO */

export class MetroService {
  static async ListarOpcion() {
    const response = await fetch(`${config.apiUrl}/metro/ListarOpcion`, {
      method: "GET",
      credentials: "include",
    });

    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok) {
      throw new Error(
        await readErrorMessage(response, "No fue posible obtener las opciones de metros.")
      );
    }

    return await response.json();
  }

  static async listado(params = {}) {
    const query = buildListQuery(params);
    const response = await fetch(`${config.apiUrl}/metro/Listar?${query}`, {
      method: "GET",
      credentials: "include",
    });

    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok) {
      throw new Error(
        await readErrorMessage(response, "No fue posible obtener el listado de metros.")
      );
    }

    return normalizePagedResult(await response.json());
  }

  static async obtener(idMetro) {
    const response = await fetch(
      `${config.apiUrl}/metro/Obtener?idmetro=${encodeURIComponent(idMetro)}`,
      {
        method: "GET",
        credentials: "include",
      }
    );

    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok) {
      throw new Error(await readErrorMessage(response, "No fue posible obtener el metro."));
    }

    /** @type {MetroDTO} */
    const metro = await response.json();
    return metro;
  }

  static async agregar(metro) {
    return MetroService.postJson("Agregar", metro, "No fue posible agregar el metro.");
  }

  static async editar(metro) {
    return MetroService.postJson("Editar", metro, "No fue posible editar el metro.");
  }

  static async eliminar(metro) {
    return MetroService.postJson("Eliminar", metro, "No fue posible eliminar el metro.");
  }

  static async log(idMetro) {
    const response = await fetch(
      `${config.apiUrl}/metro/Log?idmetro=${encodeURIComponent(idMetro)}`,
      {
        method: "GET",
        credentials: "include",
      }
    );

    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok) {
      throw new Error(await readErrorMessage(response, "No fue posible obtener el log del metro."));
    }

    /** @type {MetroLogDTO[]} */
    const log = await response.json();
    return log;
  }

  static async postJson(action, body, fallbackMessage) {
    const response = await fetch(`${config.apiUrl}/metro/${action}`, {
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
