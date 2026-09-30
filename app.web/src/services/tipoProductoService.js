import { config } from "../config/config";
import { buildListQuery, normalizePagedResult } from "../utils/pagination";
import { handleApiResponse, readApiErrorMessage as readErrorMessage } from "./apiResponse";

/** @typedef {import('../models/tipoProducto/tipoProducto').TipoProductoDTO} TipoProductoDTO */
/** @typedef {import('../models/tipoProducto/tipoProducto').TipoProductoLogDTO} TipoProductoLogDTO */

export class TipoProductoService {
  static async ListarOpcion() {
    const response = await fetch(`${config.apiUrl}/tipoproducto/ListarOpcion`, {
      method: "GET",
      credentials: "include",
    });

    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok) {
      throw new Error(
        await readErrorMessage(
          response,
          "No fue posible obtener las opciones de tipos de producto."
        )
      );
    }

    const options = await response.json();
    return options;
  }

  static async listado(params = {}) {
    const query = buildListQuery(params);
    const response = await fetch(`${config.apiUrl}/tipoproducto/Listar?${query}`, {
      method: "GET",
      credentials: "include",
    });

    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok) {
      throw new Error(
        await readErrorMessage(response, "No fue posible obtener el listado de tipos de producto.")
      );
    }

    return normalizePagedResult(await response.json());
  }

  static async obtener(idTipoProducto) {
    const response = await fetch(
      `${config.apiUrl}/tipoproducto/Obtener?idtipoproducto=${encodeURIComponent(idTipoProducto)}`,
      {
        method: "GET",
        credentials: "include",
      }
    );

    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok) {
      throw new Error(
        await readErrorMessage(response, "No fue posible obtener el tipo de producto.")
      );
    }

    /** @type {TipoProductoDTO} */
    const tipoProducto = await response.json();
    return tipoProducto;
  }

  static async agregar(tipoProducto) {
    return TipoProductoService.postJson(
      "Agregar",
      tipoProducto,
      "No fue posible agregar el tipo de producto."
    );
  }

  static async editar(tipoProducto) {
    return TipoProductoService.postJson(
      "Editar",
      tipoProducto,
      "No fue posible editar el tipo de producto."
    );
  }

  static async eliminar(tipoProducto) {
    return TipoProductoService.postJson(
      "Eliminar",
      tipoProducto,
      "No fue posible eliminar el tipo de producto."
    );
  }

  static async log(idTipoProducto) {
    const response = await fetch(
      `${config.apiUrl}/tipoproducto/Log?idtipoproducto=${encodeURIComponent(idTipoProducto)}`,
      {
        method: "GET",
        credentials: "include",
      }
    );

    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok) {
      throw new Error(
        await readErrorMessage(response, "No fue posible obtener el log del tipo de producto.")
      );
    }

    /** @type {TipoProductoLogDTO[]} */
    const log = await response.json();
    return log;
  }

  static async postJson(action, body, fallbackMessage) {
    const response = await fetch(`${config.apiUrl}/tipoproducto/${action}`, {
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
