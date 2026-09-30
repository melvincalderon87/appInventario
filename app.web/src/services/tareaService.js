import { config } from "../config/config";
import { buildListQuery, normalizePagedResult } from "../utils/pagination";
import { handleApiResponse, readApiErrorMessage as readErrorMessage } from "./apiResponse";

/** @typedef {import('../models/tarea/tarea').TareaDTO} TareaDTO */
/** @typedef {import('../models/tarea/tarea').TareaLogDTO} TareaLogDTO */

export class TareaService {
  static async ListarOpcion() {
    const response = await fetch(`${config.apiUrl}/tarea/ListarOpcion`, {
      method: "GET",
      credentials: "include",
    });

    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok) {
      throw new Error(await readErrorMessage(response, "No fue posible obtener las tareas."));
    }

    return response.json();
  }

  static async listado(params = {}) {
    const query = buildListQuery(params);
    const response = await fetch(`${config.apiUrl}/tareas?${query}`, {
      method: "GET",
      credentials: "include",
    });

    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok) {
      throw new Error(
        await readErrorMessage(response, "No fue posible obtener el listado de tareas.")
      );
    }

    return normalizePagedResult(await response.json());
  }

  static async obtener(idTarea) {
    const response = await fetch(`${config.apiUrl}/tareas/${encodeURIComponent(idTarea)}`, {
      method: "GET",
      credentials: "include",
    });

    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok) {
      throw new Error(await readErrorMessage(response, "No fue posible obtener la tarea."));
    }

    /** @type {TareaDTO} */
    const tarea = await response.json();
    return tarea;
  }

  static async agregar(tarea) {
    return TareaService.requestJson(
      `${config.apiUrl}/tareas`,
      "POST",
      tarea,
      "No fue posible agregar la tarea."
    );
  }

  static async editar(tarea) {
    return TareaService.requestJson(
      `${config.apiUrl}/tareas/${encodeURIComponent(tarea.codTarea)}`,
      "PUT",
      tarea,
      "No fue posible editar la tarea."
    );
  }

  static async eliminar(tarea) {
    const codTarea = typeof tarea === "object" ? tarea.codTarea : tarea;
    return TareaService.requestJson(
      `${config.apiUrl}/tareas/${encodeURIComponent(codTarea)}`,
      "DELETE",
      undefined,
      "No fue posible eliminar la tarea."
    );
  }

  static async log(idTarea) {
    const response = await fetch(
      `${config.apiUrl}/tarea/Log?idtarea=${encodeURIComponent(idTarea)}`,
      {
        method: "GET",
        credentials: "include",
      }
    );

    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok) {
      throw new Error(
        await readErrorMessage(response, "No fue posible obtener el log de la tarea.")
      );
    }

    /** @type {TareaLogDTO[]} */
    const log = await response.json();
    return log;
  }

  static async requestJson(url, method, body, fallbackMessage) {
    const response = await fetch(url, {
      method,
      headers:
        body === undefined
          ? undefined
          : {
              "Content-Type": "application/json",
            },
      credentials: "include",
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    return await handleApiResponse(response, fallbackMessage);
  }
}
