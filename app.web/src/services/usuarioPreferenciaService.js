import { config } from "../config/config";
import { buildListQuery, normalizePagedResult } from "../utils/pagination";
import { handleApiResponse, readApiErrorMessage as readErrorMessage } from "./apiResponse";

/** @typedef {import('../models/usuarioPreferencia/usuarioPreferencia').UsuarioPreferenciaDTO} UsuarioPreferenciaDTO */
/** @typedef {import('../models/usuarioPreferencia/usuarioPreferencia').UsuarioPreferenciaLogDTO} UsuarioPreferenciaLogDTO */

export class UsuarioPreferenciaService {
  static async listado(idUsuario, params = {}) {
    const query = buildListQuery(params);
    const response = await fetch(
      `${config.apiUrl}/usuariopreferencia/Listar?idusuario=${encodeURIComponent(idUsuario)}&${query}`,
      {
        method: "GET",
        credentials: "include",
      }
    );

    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok) {
      throw new Error(
        await readErrorMessage(response, "No fue posible obtener la preferencia del usuario.")
      );
    }

    return normalizePagedResult(await response.json());
  }

  static async obtener(idUsuario) {
    const response = await fetch(
      `${config.apiUrl}/usuariopreferencia/Obtener?idusuario=${encodeURIComponent(idUsuario)}`,
      {
        method: "GET",
        credentials: "include",
      }
    );

    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok) {
      throw new Error(
        await readErrorMessage(response, "No fue posible obtener la preferencia del usuario.")
      );
    }

    /** @type {UsuarioPreferenciaDTO} */
    const preferencia = await response.json();
    return preferencia;
  }

  static async listarIdioma() {
    const response = await fetch(`${config.apiUrl}/usuariopreferencia/ListarIdioma`, {
      method: "GET",
      credentials: "include",
    });

    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok) {
      throw new Error(
        await readErrorMessage(response, "No fue posible obtener los idiomas para preferencia.")
      );
    }

    const idiomas = await response.json();
    return idiomas;
  }

  static async agregar(preferencia) {
    return UsuarioPreferenciaService.postJson(
      "Agregar",
      preferencia,
      "No fue posible agregar la preferencia de usuario."
    );
  }

  static async editar(preferencia) {
    return UsuarioPreferenciaService.postJson(
      "Editar",
      preferencia,
      "No fue posible editar la preferencia de usuario."
    );
  }

  static async eliminar(preferencia) {
    return UsuarioPreferenciaService.postJson(
      "Eliminar",
      preferencia,
      "No fue posible eliminar la preferencia de usuario."
    );
  }

  static async log(idUsuario) {
    const response = await fetch(
      `${config.apiUrl}/usuariopreferencia/Log?idusuario=${encodeURIComponent(idUsuario)}`,
      {
        method: "GET",
        credentials: "include",
      }
    );

    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok) {
      throw new Error(
        await readErrorMessage(response, "No fue posible obtener el log de la preferencia.")
      );
    }

    /** @type {UsuarioPreferenciaLogDTO[]} */
    const log = await response.json();
    return log;
  }

  static async postJson(action, body, fallbackMessage) {
    const response = await fetch(`${config.apiUrl}/usuariopreferencia/${action}`, {
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
