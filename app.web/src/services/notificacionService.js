import { config } from "../config/config";
import { buildListQuery, normalizePagedResult } from "../utils/pagination";
import { handleApiResponse, readApiErrorMessage as readErrorMessage } from "./apiResponse";

/** @typedef {import('../models/notificacion/notificacion').NotificacionDTO} NotificacionDTO */

export class NotificacionService {
  static async listado(params = {}) {
    const searchParams = new URLSearchParams(buildListQuery(params));

    if (Number(params.codTarea) > 0) {
      searchParams.set("codTarea", String(params.codTarea));
    }

    const response = await fetch(`${config.apiUrl}/notificaciones?${searchParams.toString()}`, {
      method: "GET",
      credentials: "include",
    });

    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok) {
      throw new Error(
        await readErrorMessage(response, "No fue posible obtener el listado de notificaciones.")
      );
    }

    return normalizePagedResult(await response.json());
  }

  static async obtener(idNotificacion) {
    const response = await fetch(
      `${config.apiUrl}/notificaciones/${encodeURIComponent(idNotificacion)}`,
      {
        method: "GET",
        credentials: "include",
      }
    );

    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok) {
      throw new Error(await readErrorMessage(response, "No fue posible obtener la notificacion."));
    }

    /** @type {NotificacionDTO} */
    const notificacion = await response.json();
    return notificacion;
  }

  static async agregar(notificacion) {
    return NotificacionService.requestJson(
      `${config.apiUrl}/notificaciones`,
      "POST",
      notificacion,
      "No fue posible agregar la notificacion."
    );
  }

  static async editar(notificacion) {
    return NotificacionService.requestJson(
      `${config.apiUrl}/notificaciones/${encodeURIComponent(notificacion.codNotificacion)}`,
      "PUT",
      notificacion,
      "No fue posible editar la notificacion."
    );
  }

  static async eliminar(notificacion) {
    const codNotificacion =
      typeof notificacion === "object" ? notificacion.codNotificacion : notificacion;

    return NotificacionService.requestJson(
      `${config.apiUrl}/notificaciones/${encodeURIComponent(codNotificacion)}`,
      "DELETE",
      undefined,
      "No fue posible eliminar la notificacion."
    );
  }

  static async programar(codNotificacion, fechaProgramada) {
    return NotificacionService.requestJson(
      `${config.apiUrl}/notificaciones/${encodeURIComponent(codNotificacion)}/programar`,
      "POST",
      { fechaProgramada: fechaProgramada || null },
      "No fue posible programar la notificacion."
    );
  }

  static async enviarAhora(codNotificacion) {
    return NotificacionService.requestJson(
      `${config.apiUrl}/notificaciones/${encodeURIComponent(codNotificacion)}/enviar-ahora`,
      "POST",
      {},
      "No fue posible enviar la notificacion."
    );
  }

  static async reintentar(codNotificacion) {
    return NotificacionService.requestJson(
      `${config.apiUrl}/notificaciones/${encodeURIComponent(codNotificacion)}/reintentar`,
      "POST",
      {},
      "No fue posible reintentar la notificacion."
    );
  }

  static async cancelar(codNotificacion) {
    return NotificacionService.requestJson(
      `${config.apiUrl}/notificaciones/${encodeURIComponent(codNotificacion)}/cancelar`,
      "POST",
      {},
      "No fue posible cancelar la notificacion."
    );
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
