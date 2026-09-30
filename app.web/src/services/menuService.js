import { config } from "../config/config";
import { buildListQuery, normalizePagedResult } from "../utils/pagination";
import { handleApiResponse, readApiErrorMessage as readErrorMessage } from "./apiResponse";

/** @typedef {import('../models/menu/menu').MenuDTO} MenuDTO */
/** @typedef {import('../models/menu/menu').MenuLogDTO} MenuLogDTO */

export class MenuService {
  static async ListarOpcion() {
    const response = await fetch(`${config.apiUrl}/menu/ListarOpcion`, {
      method: "GET",
      credentials: "include",
    });

    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok) {
      throw new Error(
        await readErrorMessage(response, "No fue posible obtener las opciones de menu.")
      );
    }

    return response.json();
  }

  static async listado(params = {}) {
    const query = buildListQuery(params);
    const response = await fetch(`${config.apiUrl}/menu/Listar?${query}`, {
      method: "GET",
      credentials: "include",
    });

    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok) {
      throw new Error(
        await readErrorMessage(response, "No fue posible obtener el listado de menus.")
      );
    }

    return normalizePagedResult(await response.json());
  }

  static async obtener(idMenu) {
    const response = await fetch(
      `${config.apiUrl}/menu/Obtener?idmenu=${encodeURIComponent(idMenu)}`,
      {
        method: "GET",
        credentials: "include",
      }
    );

    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok) {
      throw new Error(await readErrorMessage(response, "No fue posible obtener el menu."));
    }

    /** @type {MenuDTO} */
    const menu = await response.json();
    return menu;
  }

  static async agregar(menu) {
    return MenuService.postJson("Agregar", menu, "No fue posible agregar el menu.");
  }

  static async editar(menu) {
    return MenuService.postJson("Editar", menu, "No fue posible editar el menu.");
  }

  static async eliminar(menu) {
    return MenuService.postJson("Eliminar", menu, "No fue posible eliminar el menu.");
  }

  static async log(idMenu) {
    const response = await fetch(`${config.apiUrl}/menu/Log?idmenu=${encodeURIComponent(idMenu)}`, {
      method: "GET",
      credentials: "include",
    });

    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok) {
      throw new Error(await readErrorMessage(response, "No fue posible obtener el log del menu."));
    }

    /** @type {MenuLogDTO[]} */
    const log = await response.json();
    return log;
  }

  static async postJson(action, body, fallbackMessage) {
    const response = await fetch(`${config.apiUrl}/menu/${action}`, {
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
