import { config } from "../config/config";
import { buildListQuery, normalizePagedResult } from "../utils/pagination";
import { handleApiResponse, readApiErrorMessage as readErrorMessage } from "./apiResponse";

/** @typedef {import('../models/usuarioConfiguracion/usuarioConfiguracion').UsuarioConfiguracionDTO} UsuarioConfiguracionDTO */
/** @typedef {import('../models/usuarioConfiguracion/usuarioConfiguracion').UsuarioConfiguracionLogDTO} UsuarioConfiguracionLogDTO */

export class UsuarioConfiguracionService {
  static async listado(idUsuario, params = {}) {
    const query = buildListQuery(params);
    const response = await fetch(
      `${config.apiUrl}/usuarioconfiguracion/Listar?idusuario=${encodeURIComponent(idUsuario)}&${query}`,
      {
        method: "GET",
        credentials: "include",
      }
    );

    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok) {
      throw new Error(
        await readErrorMessage(response, "No fue posible obtener la configuracion de usuario.")
      );
    }

    return normalizePagedResult(await response.json());
  }

  static async obtener(idUsuario) {
    const response = await fetch(
      `${config.apiUrl}/usuarioconfiguracion/Obtener?idusuario=${encodeURIComponent(idUsuario)}`,
      {
        method: "GET",
        credentials: "include",
      }
    );

    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok) {
      throw new Error(
        await readErrorMessage(response, "No fue posible obtener la configuracion de usuario.")
      );
    }

    /** @type {UsuarioConfiguracionDTO} */
    const configuracion = await response.json();
    return configuracion;
  }

  static async agregar(configuracion) {
    return UsuarioConfiguracionService.postJson(
      "Agregar",
      configuracion,
      "No fue posible agregar la configuracion de usuario."
    );
  }

  static async editar(configuracion) {
    return UsuarioConfiguracionService.postJson(
      "Editar",
      configuracion,
      "No fue posible editar la configuracion de usuario."
    );
  }

  static async eliminar(configuracion) {
    return UsuarioConfiguracionService.postJson(
      "Eliminar",
      configuracion,
      "No fue posible eliminar la configuracion de usuario."
    );
  }

  static async log(idUsuario) {
    const response = await fetch(
      `${config.apiUrl}/usuarioconfiguracion/Log?idusuario=${encodeURIComponent(idUsuario)}`,
      {
        method: "GET",
        credentials: "include",
      }
    );

    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok) {
      throw new Error(
        await readErrorMessage(
          response,
          "No fue posible obtener el log de la configuracion de usuario."
        )
      );
    }

    /** @type {UsuarioConfiguracionLogDTO[]} */
    const log = await response.json();
    return log;
  }

  static async postJson(action, body, fallbackMessage) {
    const response = await fetch(`${config.apiUrl}/usuarioconfiguracion/${action}`, {
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
