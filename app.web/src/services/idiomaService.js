import { config } from "../config/config";
import { buildListQuery, normalizePagedResult } from "../utils/pagination";
import { handleApiResponse, readApiErrorMessage as readErrorMessage } from "./apiResponse";

/** @typedef {import('../models/idioma/idioma').IdiomaDTO} IdiomaDTO */
/** @typedef {import('../models/idioma/idioma').IdiomaLogDTO} IdiomaLogDTO */

export class IdiomaService {
  static async ListarOpcion() {
    const response = await fetch(`${config.apiUrl}/idioma/ListarOpcion`, {
      method: "GET",
      credentials: "include",
    });

    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok) {
      throw new Error(
        await readErrorMessage(response, "No fue posible obtener las opciones de idiomas.")
      );
    }

    const options = await response.json();
    return options;
  }

  static async listado(params = {}) {
    const query = buildListQuery(params);
    const response = await fetch(`${config.apiUrl}/idioma/Listar?${query}`, {
      method: "GET",
      credentials: "include",
    });

    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok) {
      throw new Error(
        await readErrorMessage(response, "No fue posible obtener el listado de idiomas.")
      );
    }

    return normalizePagedResult(await response.json());
  }

  static async obtener(idIdioma) {
    const response = await fetch(
      `${config.apiUrl}/idioma/Obtener?ididioma=${encodeURIComponent(idIdioma)}`,
      {
        method: "GET",
        credentials: "include",
      }
    );

    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok) {
      throw new Error(await readErrorMessage(response, "No fue posible obtener el idioma."));
    }

    /** @type {IdiomaDTO} */
    const idioma = await response.json();
    return idioma;
  }

  static async agregar(idioma) {
    return IdiomaService.postJson("Agregar", idioma, "No fue posible agregar el idioma.");
  }

  static async editar(idioma) {
    return IdiomaService.postJson("Editar", idioma, "No fue posible editar el idioma.");
  }

  static async eliminar(idioma) {
    return IdiomaService.postJson("Eliminar", idioma, "No fue posible eliminar el idioma.");
  }

  static async log(idIdioma) {
    const response = await fetch(
      `${config.apiUrl}/idioma/Log?ididioma=${encodeURIComponent(idIdioma)}`,
      {
        method: "GET",
        credentials: "include",
      }
    );

    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok) {
      throw new Error(
        await readErrorMessage(response, "No fue posible obtener el log del idioma.")
      );
    }

    /** @type {IdiomaLogDTO[]} */
    const log = await response.json();
    return log;
  }

  static async postJson(action, body, fallbackMessage) {
    const response = await fetch(`${config.apiUrl}/idioma/${action}`, {
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
