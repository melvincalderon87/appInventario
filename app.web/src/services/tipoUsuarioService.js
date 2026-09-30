import { config } from "../config/config";
import { buildListQuery, normalizePagedResult } from "../utils/pagination";
import { handleApiResponse, readApiErrorMessage as readErrorMessage } from "./apiResponse";

/** @typedef {import('../models/tipoUsuario/tipoUsuario').TipoUsuarioDTO} TipoUsuarioDTO */
/** @typedef {import('../models/tipoUsuario/tipoUsuario').TipoUsuarioLogDTO} TipoUsuarioLogDTO */

export class TipoUsuarioService {
  static async ListarOpcion() {
    const response = await fetch(`${config.apiUrl}/tipousuario/ListarOpcion`, {
      method: "GET",
      credentials: "include",
    });

    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok) {
      throw new Error(
        await readErrorMessage(response, "No fue posible obtener las opciones de tipos de usuario.")
      );
    }

    const options = await response.json();
    return options;
  }

  static async listado(params = {}) {
    const query = buildListQuery(params);
    const response = await fetch(`${config.apiUrl}/tipousuario/Listar?${query}`, {
      method: "GET",
      credentials: "include",
    });

    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok) {
      throw new Error(
        await readErrorMessage(response, "No fue posible obtener el listado de tipos de usuario.")
      );
    }

    return normalizePagedResult(await response.json());
  }

  static async obtener(idTipoUsuario) {
    const response = await fetch(
      `${config.apiUrl}/tipousuario/Obtener?idtipousuario=${encodeURIComponent(idTipoUsuario)}`,
      {
        method: "GET",
        credentials: "include",
      }
    );

    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok) {
      throw new Error(
        await readErrorMessage(response, "No fue posible obtener el tipo de usuario.")
      );
    }

    /** @type {TipoUsuarioDTO} */
    const tipoUsuario = await response.json();
    return tipoUsuario;
  }

  static async agregar(tipoUsuario) {
    return TipoUsuarioService.postJson(
      "Agregar",
      tipoUsuario,
      "No fue posible agregar el tipo de usuario."
    );
  }

  static async editar(tipoUsuario) {
    return TipoUsuarioService.postJson(
      "Editar",
      tipoUsuario,
      "No fue posible editar el tipo de usuario."
    );
  }

  static async eliminar(tipoUsuario) {
    return TipoUsuarioService.postJson(
      "Eliminar",
      tipoUsuario,
      "No fue posible eliminar el tipo de usuario."
    );
  }

  static async log(idTipoUsuario) {
    const response = await fetch(
      `${config.apiUrl}/tipousuario/Log?idtipousuario=${encodeURIComponent(idTipoUsuario)}`,
      {
        method: "GET",
        credentials: "include",
      }
    );

    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok) {
      throw new Error(
        await readErrorMessage(response, "No fue posible obtener el log del tipo de usuario.")
      );
    }

    /** @type {TipoUsuarioLogDTO[]} */
    const log = await response.json();
    return log;
  }

  static async postJson(action, body, fallbackMessage) {
    const response = await fetch(`${config.apiUrl}/tipousuario/${action}`, {
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
