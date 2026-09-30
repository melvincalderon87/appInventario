import { config } from "../config/config";
import { buildListQuery, normalizePagedResult } from "../utils/pagination";
import { handleApiResponse, readApiErrorMessage as readErrorMessage } from "./apiResponse";

/** @typedef {import('../models/consumoPropio/consumoPropio').ConsumoPropioDTO} ConsumoPropioDTO */
/** @typedef {import('../models/consumoPropio/consumoPropio').ConsumoPropioLogDTO} ConsumoPropioLogDTO */

export class ConsumoPropioService {
  static async ListarOpcion() {
    const response = await fetch(`${config.apiUrl}/consumopropio/ListarOpcion`, {
      method: "GET",
      credentials: "include",
    });

    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok) {
      throw new Error(
        await readErrorMessage(response, "No fue posible obtener las opciones de consumo propio.")
      );
    }

    return await response.json();
  }

  static async listado(params = {}) {
    const searchParams = new URLSearchParams(buildListQuery(params));

    if (String(params.idTanque ?? "").trim()) {
      searchParams.set("idtanque", String(params.idTanque).trim());
    }

    const query = searchParams.toString();
    const response = await fetch(`${config.apiUrl}/consumopropio/Listar?${query}`, {
      method: "GET",
      credentials: "include",
    });

    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok) {
      throw new Error(
        await readErrorMessage(response, "No fue posible obtener el listado de consumo propio.")
      );
    }

    return normalizePagedResult(await response.json());
  }

  static async obtener(idConsumoPropio) {
    const response = await fetch(
      `${config.apiUrl}/consumopropio/Obtener?idconsumopropio=${encodeURIComponent(idConsumoPropio)}`,
      {
        method: "GET",
        credentials: "include",
      }
    );

    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok) {
      throw new Error(
        await readErrorMessage(response, "No fue posible obtener el consumo propio.")
      );
    }

    /** @type {ConsumoPropioDTO} */
    const consumoPropio = await response.json();
    return consumoPropio;
  }

  static async agregar(consumoPropio) {
    return ConsumoPropioService.postJson(
      "Agregar",
      consumoPropio,
      "No fue posible agregar el consumo propio."
    );
  }

  static async editar(consumoPropio) {
    return ConsumoPropioService.postJson(
      "Editar",
      consumoPropio,
      "No fue posible editar el consumo propio."
    );
  }

  static async eliminar(consumoPropio) {
    return ConsumoPropioService.postJson(
      "Eliminar",
      consumoPropio,
      "No fue posible eliminar el consumo propio."
    );
  }

  static async log(idConsumoPropio) {
    const response = await fetch(
      `${config.apiUrl}/consumopropio/Log?idconsumopropio=${encodeURIComponent(idConsumoPropio)}`,
      {
        method: "GET",
        credentials: "include",
      }
    );

    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok) {
      throw new Error(
        await readErrorMessage(response, "No fue posible obtener el log del consumo propio.")
      );
    }

    /** @type {ConsumoPropioLogDTO[]} */
    const log = await response.json();
    return log;
  }

  static async postJson(action, body, fallbackMessage) {
    const response = await fetch(`${config.apiUrl}/consumopropio/${action}`, {
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
