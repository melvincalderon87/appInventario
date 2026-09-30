import { config } from "../config/config";
import { buildListQuery, normalizePagedResult } from "../utils/pagination";
import { handleApiResponse, readApiErrorMessage as readErrorMessage } from "./apiResponse";

/** @typedef {import('../models/tipoPermiso/tipoPermiso').TipoPermisoDTO} TipoPermisoDTO */
/** @typedef {import('../models/tipoPermiso/tipoPermiso').TipoPermisoLogDTO} TipoPermisoLogDTO */

export class TipoPermisoService {
  static async ListarOpcion() {
    const response = await fetch(`${config.apiUrl}/tipopermiso/ListarOpcion`, {
      method: "GET",
      credentials: "include",
    });

    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok) {
      throw new Error(
        await readErrorMessage(response, "No fue posible obtener las opciones de tipos de permiso.")
      );
    }

    const options = await response.json();
    return options;
  }

  static async listado(params = {}) {
    const query = buildListQuery(params);
    const response = await fetch(`${config.apiUrl}/tipopermiso/Listar?${query}`, {
      method: "GET",
      credentials: "include",
    });

    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok) {
      throw new Error(
        await readErrorMessage(response, "No fue posible obtener el listado de tipos de permiso.")
      );
    }

    return normalizePagedResult(await response.json());
  }

  static async obtener(idTipoPermiso) {
    const response = await fetch(
      `${config.apiUrl}/tipopermiso/Obtener?idtipopermiso=${encodeURIComponent(idTipoPermiso)}`,
      {
        method: "GET",
        credentials: "include",
      }
    );

    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok) {
      throw new Error(
        await readErrorMessage(response, "No fue posible obtener el tipo de permiso.")
      );
    }

    /** @type {TipoPermisoDTO} */
    const tipoPermiso = await response.json();
    return tipoPermiso;
  }

  static async agregar(tipoPermiso) {
    return TipoPermisoService.postJson(
      "Agregar",
      tipoPermiso,
      "No fue posible agregar el tipo de permiso."
    );
  }

  static async editar(tipoPermiso) {
    return TipoPermisoService.postJson(
      "Editar",
      tipoPermiso,
      "No fue posible editar el tipo de permiso."
    );
  }

  static async eliminar(tipoPermiso) {
    return TipoPermisoService.postJson(
      "Eliminar",
      tipoPermiso,
      "No fue posible eliminar el tipo de permiso."
    );
  }

  static async log(idTipoPermiso) {
    const response = await fetch(
      `${config.apiUrl}/tipopermiso/Log?idtipopermiso=${encodeURIComponent(idTipoPermiso)}`,
      {
        method: "GET",
        credentials: "include",
      }
    );

    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok) {
      throw new Error(
        await readErrorMessage(response, "No fue posible obtener el log del tipo de permiso.")
      );
    }

    /** @type {TipoPermisoLogDTO[]} */
    const log = await response.json();
    return log;
  }

  static async postJson(action, body, fallbackMessage) {
    const response = await fetch(`${config.apiUrl}/tipopermiso/${action}`, {
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
