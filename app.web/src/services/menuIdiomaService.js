import { config } from "../config/config";
import { buildListQuery, normalizePagedResult } from "../utils/pagination";
import { handleApiResponse, readApiErrorMessage as readErrorMessage } from "./apiResponse";

/** @typedef {import('../models/menuIdioma/menuIdioma').MenuIdiomaDTO} MenuIdiomaDTO */
/** @typedef {import('../models/menuIdioma/menuIdioma').MenuIdiomaLogDTO} MenuIdiomaLogDTO */

export class MenuIdiomaService {
  static async listado(params = {}) {
    const query = buildListQuery(params);
    const response = await fetch(`${config.apiUrl}/menuIdioma/Listar?${query}`, {
      method: "GET",
      credentials: "include",
    });

    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok) {
      throw new Error(
        await readErrorMessage(response, "No fue posible obtener el listado de menu/idioma.")
      );
    }

    return normalizePagedResult(await response.json());
  }

  static async obtener(idMenuIdioma) {
    const response = await fetch(
      `${config.apiUrl}/menuIdioma/Obtener?idmenuidioma=${encodeURIComponent(idMenuIdioma)}`,
      {
        method: "GET",
        credentials: "include",
      }
    );

    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok) {
      throw new Error(
        await readErrorMessage(response, "No fue posible obtener la traduccion del menu.")
      );
    }

    /** @type {MenuIdiomaDTO} */
    const data = await response.json();
    return data;
  }

  static async agregar(menuIdioma) {
    return MenuIdiomaService.postJson(
      "Agregar",
      menuIdioma,
      "No fue posible agregar la traduccion del menu."
    );
  }

  static async editar(menuIdioma) {
    return MenuIdiomaService.postJson(
      "Editar",
      menuIdioma,
      "No fue posible editar la traduccion del menu."
    );
  }

  static async eliminar(menuIdioma) {
    return MenuIdiomaService.postJson(
      "Eliminar",
      menuIdioma,
      "No fue posible eliminar la traduccion del menu."
    );
  }

  static async log(idMenuIdioma) {
    const response = await fetch(
      `${config.apiUrl}/menuIdioma/Log?idmenuidioma=${encodeURIComponent(idMenuIdioma)}`,
      {
        method: "GET",
        credentials: "include",
      }
    );

    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok) {
      throw new Error(
        await readErrorMessage(response, "No fue posible obtener el log de la traduccion del menu.")
      );
    }

    /** @type {MenuIdiomaLogDTO[]} */
    const data = await response.json();
    return data;
  }

  static async postJson(action, body, fallbackMessage) {
    const response = await fetch(`${config.apiUrl}/menuIdioma/${action}`, {
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
