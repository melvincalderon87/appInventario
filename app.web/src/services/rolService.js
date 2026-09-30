import { config } from "../config/config";
import { buildListQuery, normalizePagedResult } from "../utils/pagination";
import { handleApiResponse, readApiErrorMessage as readErrorMessage } from "./apiResponse";

/** @typedef {import('../models/rol/rol').RolDTO} RolDTO */
/** @typedef {import('../models/rol/rol').RolLogDTO} RolLogDTO */

export class RolService {
  static async ListarOpcion() {
    const response = await fetch(`${config.apiUrl}/rol/ListarOpcion`, {
      method: "GET",
      credentials: "include",
    });

    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok) {
      throw new Error(
        await readErrorMessage(response, "No fue posible obtener las opciones de roles.")
      );
    }

    const options = await response.json();
    return options;
  }

  static async listado(params = {}) {
    const query = buildListQuery(params);
    const response = await fetch(`${config.apiUrl}/rol/Listar?${query}`, {
      method: "GET",
      credentials: "include",
    });

    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok) {
      throw new Error(
        await readErrorMessage(response, "No fue posible obtener el listado de roles.")
      );
    }

    return normalizePagedResult(await response.json());
  }

  static async obtener(idRol) {
    const response = await fetch(
      `${config.apiUrl}/rol/Obtener?idrol=${encodeURIComponent(idRol)}`,
      {
        method: "GET",
        credentials: "include",
      }
    );

    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok) {
      throw new Error(await readErrorMessage(response, "No fue posible obtener el rol."));
    }

    /** @type {RolDTO} */
    const rol = await response.json();
    return rol;
  }

  static async agregar(rol) {
    return RolService.postJson("Agregar", rol, "No fue posible agregar el rol.");
  }

  static async editar(rol) {
    return RolService.postJson("Editar", rol, "No fue posible editar el rol.");
  }

  static async eliminar(rol) {
    return RolService.postJson("Eliminar", rol, "No fue posible eliminar el rol.");
  }

  static async log(idRol) {
    const response = await fetch(`${config.apiUrl}/rol/Log?idrol=${encodeURIComponent(idRol)}`, {
      method: "GET",
      credentials: "include",
    });

    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok) {
      throw new Error(await readErrorMessage(response, "No fue posible obtener el log del rol."));
    }

    /** @type {RolLogDTO[]} */
    const log = await response.json();
    return log;
  }

  static async postJson(action, body, fallbackMessage) {
    const response = await fetch(`${config.apiUrl}/rol/${action}`, {
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
