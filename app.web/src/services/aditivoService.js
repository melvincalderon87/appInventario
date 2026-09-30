import { config } from "../config/config";
import { buildListQuery, normalizePagedResult } from "../utils/pagination";
import { handleApiResponse, readApiErrorMessage as readErrorMessage } from "./apiResponse";

/** @typedef {import('../models/aditivo/aditivo').AditivoDTO} AditivoDTO */
/** @typedef {import('../models/aditivo/aditivo').AditivoLogDTO} AditivoLogDTO */

export class AditivoService {
  static async ListarProductoOpcion() {
    const response = await fetch(`${config.apiUrl}/aditivo/ListarProductoOpcion`, {
      method: "GET",
      credentials: "include",
    });

    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok) {
      throw new Error(
        await readErrorMessage(response, "No fue posible obtener los productos aditivos.")
      );
    }

    return await response.json();
  }

  static async listado(params = {}) {
    const searchParams = new URLSearchParams(buildListQuery(params));

    if (String(params.tipoMovimiento ?? "").trim()) {
      searchParams.set("tipomovimiento", String(params.tipoMovimiento).trim());
    }

    const query = searchParams.toString();
    const response = await fetch(`${config.apiUrl}/aditivo/Listar?${query}`, {
      method: "GET",
      credentials: "include",
    });

    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok) {
      throw new Error(
        await readErrorMessage(response, "No fue posible obtener el listado de aditivos.")
      );
    }

    return normalizePagedResult(await response.json());
  }

  static async obtener(idAditivo) {
    const response = await fetch(
      `${config.apiUrl}/aditivo/Obtener?idaditivo=${encodeURIComponent(idAditivo)}`,
      {
        method: "GET",
        credentials: "include",
      }
    );

    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok) {
      throw new Error(
        await readErrorMessage(response, "No fue posible obtener el movimiento de aditivo.")
      );
    }

    /** @type {AditivoDTO} */
    const aditivo = await response.json();
    return aditivo;
  }

  static async agregar(aditivo) {
    return AditivoService.postJson(
      "Agregar",
      aditivo,
      "No fue posible agregar el movimiento de aditivo."
    );
  }

  static async editar(aditivo) {
    return AditivoService.postJson(
      "Editar",
      aditivo,
      "No fue posible editar el movimiento de aditivo."
    );
  }

  static async eliminar(aditivo) {
    return AditivoService.postJson(
      "Eliminar",
      aditivo,
      "No fue posible eliminar el movimiento de aditivo."
    );
  }

  static async log(idAditivo) {
    const response = await fetch(
      `${config.apiUrl}/aditivo/Log?idaditivo=${encodeURIComponent(idAditivo)}`,
      {
        method: "GET",
        credentials: "include",
      }
    );

    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok) {
      throw new Error(
        await readErrorMessage(response, "No fue posible obtener el log del aditivo.")
      );
    }

    /** @type {AditivoLogDTO[]} */
    const log = await response.json();
    return log;
  }

  static async postJson(action, body, fallbackMessage) {
    const response = await fetch(`${config.apiUrl}/aditivo/${action}`, {
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
