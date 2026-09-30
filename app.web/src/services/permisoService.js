import { config } from "../config/config";
import { buildListQuery, normalizePagedResult } from "../utils/pagination";
import { handleApiResponse, readApiErrorMessage as readErrorMessage } from "./apiResponse";

/** @typedef {import('../models/permiso/permisoRol').PermisoRolDTO} PermisoRolDTO */
/** @typedef {import('../models/permiso/permisoRol').PermisoLogItemDTO} PermisoLogItemDTO */

export class PermisoService {
  static async listarPorRol(idRol, params = {}) {
    const query = buildListQuery(params);
    const response = await fetch(
      `${config.apiUrl}/permiso/Listar?idrol=${encodeURIComponent(idRol)}&${query}`,
      {
        method: "GET",
        credentials: "include",
      }
    );

    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok) {
      throw new Error(
        await readErrorMessage(response, "No fue posible obtener los permisos del rol.")
      );
    }

    /** @type {PermisoRolDTO[]} */
    const permisos = await response.json();
    return normalizePagedResult(permisos);
  }

  static async agregarPermiso(payload) {
    return PermisoService.postJson("Agregar", payload, "No fue posible asignar el permiso.");
  }

  static async eliminarPermiso(payload) {
    return PermisoService.postJson("Eliminar", payload, "No fue posible quitar el permiso.");
  }

  static async actualizarCambios(cambios = []) {
    const tareas = cambios.map((cambio) => {
      const payload = {
        codRol: cambio.codRol,
        codMenu: cambio.codMenu,
        codTipoPermiso: cambio.codTipoPermiso,
      };

      return cambio.asignado
        ? PermisoService.agregarPermiso(payload)
        : PermisoService.eliminarPermiso(payload);
    });

    return Promise.all(tareas);
  }

  static async log(idRol, idMenu) {
    const response = await fetch(
      `${config.apiUrl}/permiso/Log?idrol=${encodeURIComponent(idRol)}&idmenu=${encodeURIComponent(idMenu)}`,
      {
        method: "GET",
        credentials: "include",
      }
    );

    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok) {
      throw new Error(
        await readErrorMessage(response, "No fue posible obtener el log del permiso.")
      );
    }

    /** @type {PermisoLogItemDTO[]} */
    const log = await response.json();
    return log;
  }

  static async postJson(action, body, fallbackMessage) {
    const response = await fetch(`${config.apiUrl}/permiso/${action}`, {
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
