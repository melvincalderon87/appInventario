import { config } from "../config/config";
import { buildListQuery, normalizePagedResult } from "../utils/pagination";
import { handleApiResponse, readApiErrorMessage as readErrorMessage } from "./apiResponse";

/** @typedef {import('../models/tuberia/tuberia').TuberiaDTO} TuberiaDTO */
/** @typedef {import('../models/tuberia/tuberia').TuberiaLogDTO} TuberiaLogDTO */
/** @typedef {import('../models/tuberia/tuberia').TuberiaResumenProductoDTO} TuberiaResumenProductoDTO */

export class TuberiaService {
  static async ListarOpcion() {
    const response = await fetch(`${config.apiUrl}/tuberia/ListarOpcion`, {
      method: "GET",
      credentials: "include",
    });

    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok) {
      throw new Error(
        await readErrorMessage(response, "No fue posible obtener las opciones de tuberias.")
      );
    }

    return await response.json();
  }

  static async listado(params = {}) {
    const query = buildListQuery(params);
    const response = await fetch(`${config.apiUrl}/tuberia/Listar?${query}`, {
      method: "GET",
      credentials: "include",
    });

    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok) {
      throw new Error(
        await readErrorMessage(response, "No fue posible obtener el listado de tuberias.")
      );
    }

    return normalizePagedResult(await response.json());
  }

  static async resumenPorProducto() {
    const response = await fetch(`${config.apiUrl}/tuberia/ResumenProducto`, {
      method: "GET",
      credentials: "include",
    });

    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok) {
      throw new Error(
        await readErrorMessage(
          response,
          "No fue posible obtener el resumen de tuberias por producto."
        )
      );
    }

    /** @type {TuberiaResumenProductoDTO[]} */
    const resumen = await response.json();
    return Array.isArray(resumen) ? resumen : [];
  }

  static async obtener(idTuberia) {
    const response = await fetch(
      `${config.apiUrl}/tuberia/Obtener?idtuberia=${encodeURIComponent(idTuberia)}`,
      {
        method: "GET",
        credentials: "include",
      }
    );

    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok) {
      throw new Error(await readErrorMessage(response, "No fue posible obtener la tuberia."));
    }

    /** @type {TuberiaDTO} */
    const tuberia = await response.json();
    return tuberia;
  }

  static async archivo(idTuberia, codTuberiaAdjunto) {
    const response = await fetch(
      `${config.apiUrl}/tuberia/Archivo?idtuberia=${encodeURIComponent(idTuberia)}&codtuberiaadjunto=${encodeURIComponent(codTuberiaAdjunto)}`,
      {
        method: "GET",
        credentials: "include",
      }
    );

    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok) {
      throw new Error(
        await readErrorMessage(response, "No fue posible obtener el archivo de la tuberia.")
      );
    }

    return await response.blob();
  }

  static async agregar(tuberia) {
    return TuberiaService.postJson("Agregar", tuberia, "No fue posible agregar la tuberia.");
  }

  static async editar(tuberia) {
    return TuberiaService.postJson("Editar", tuberia, "No fue posible editar la tuberia.");
  }

  static async eliminar(tuberia) {
    return TuberiaService.postJson("Eliminar", tuberia, "No fue posible eliminar la tuberia.");
  }

  static async log(idTuberia) {
    const response = await fetch(
      `${config.apiUrl}/tuberia/Log?idtuberia=${encodeURIComponent(idTuberia)}`,
      {
        method: "GET",
        credentials: "include",
      }
    );

    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok) {
      throw new Error(
        await readErrorMessage(response, "No fue posible obtener el log de la tuberia.")
      );
    }

    /** @type {TuberiaLogDTO[]} */
    const log = await response.json();
    return log;
  }

  static async postJson(action, body, fallbackMessage) {
    const response = await fetch(`${config.apiUrl}/tuberia/${action}`, {
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
