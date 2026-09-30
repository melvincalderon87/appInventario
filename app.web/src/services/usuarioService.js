import { config } from "../config/config";
import { appendParam, buildListQuery, normalizePagedResult } from "../utils/pagination";
import { handleApiResponse, readApiErrorMessage as readErrorMessage } from "./apiResponse";

/** @typedef {import('../models/usuario/usuario').UsuarioDTO} UsuarioDTO */
/** @typedef {import('../models/usuario/usuario').UsuarioLogDTO} UsuarioLogDTO */

export class UsuarioService {
  static async listado(params = {}) {
    const query = buildListQuery(params);
    const response = await fetch(`${config.apiUrl}/usuario/Listar?${query}`, {
      method: "GET",
      credentials: "include",
    });

    if (response.status === 401) {
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    }

    if (!response.ok) {
      throw new Error(
        await readErrorMessage(response, "No fue posible obtener el listado de usuarios.")
      );
    }

    return normalizePagedResult(await response.json());
  }

  static async obtener(idUsuario) {
    const response = await fetch(
      `${config.apiUrl}/usuario/Obtener?idusuario=${encodeURIComponent(idUsuario)}`,
      {
        method: "GET",
        credentials: "include",
      }
    );

    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok) {
      throw new Error(await readErrorMessage(response, "No fue posible obtener el usuario."));
    }

    /** @type {UsuarioDTO} */
    const usuario = await response.json();
    return usuario;
  }

  static async editar(usuario) {
    return UsuarioService.postJson("Editar", usuario, "No fue posible editar el usuario.");
  }

  static async agregar(usuario) {
    return UsuarioService.postJson("Agregar", usuario, "No fue posible agregar el usuario.");
  }

  static async eliminar(usuario) {
    return UsuarioService.postJson("Eliminar", usuario, "No fue posible eliminar el usuario.");
  }

  static async cambiarPassword({ idUsuario, password, confirmacionPassword }) {
    return UsuarioService.postJson(
      "CambiarPassword",
      { idUsuario, password, confirmacionPassword },
      "No fue posible cambiar la contraseña."
    );
  }

  static async exportar(params = {}) {
    const searchParams = new URLSearchParams();
    appendParam(searchParams, "search", params.search);
    appendParam(searchParams, "sort", params.sort);

    const response = await fetch(`${config.apiUrl}/usuario/Exportar?${searchParams.toString()}`, {
      method: "GET",
      credentials: "include",
    });

    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (response.status === 403) throw new Error("No tiene permiso para exportar usuarios.");
    if (!response.ok) {
      throw new Error(await readErrorMessage(response, "No fue posible exportar los usuarios."));
    }

    const usuarios = await response.json();
    return Array.isArray(usuarios) ? usuarios : [];
  }

  static async log(idUsuario) {
    const response = await fetch(
      `${config.apiUrl}/usuario/Log?idusuario=${encodeURIComponent(idUsuario)}`,
      {
        method: "GET",
        credentials: "include",
      }
    );

    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok) {
      throw new Error(
        await readErrorMessage(response, "No fue posible obtener el log del usuario.")
      );
    }

    /** @type {UsuarioLogDTO[]} */
    const log = await response.json();
    return log;
  }

  static async postJson(action, body, fallbackMessage) {
    const response = await fetch(`${config.apiUrl}/usuario/${action}`, {
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
