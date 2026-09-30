import { config } from "../config/config";
import { buildListQuery, normalizePagedResult } from "../utils/pagination";
import { handleApiResponse, readApiErrorMessage as readErrorMessage } from "./apiResponse";

/** @typedef {import('../models/brazo/brazo').BrazoDTO} BrazoDTO */
/** @typedef {import('../models/brazo/brazo').BrazoLogDTO} BrazoLogDTO */

export class BrazoService {
  static async ListarOpcion() {
    const response = await fetch(`${config.apiUrl}/brazo/ListarOpcion`, {
      method: "GET",
      credentials: "include",
    });

    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok) {
      throw new Error(
        await readErrorMessage(response, "No fue posible obtener las opciones de brazos.")
      );
    }

    return await response.json();
  }

  static async listado(params = {}) {
    const searchParams = new URLSearchParams(buildListQuery(params));
    if (String(params.idBahia ?? "").trim()) {
      searchParams.set("idbahia", String(params.idBahia).trim());
    }

    const query = searchParams.toString();
    const response = await fetch(`${config.apiUrl}/brazo/Listar?${query}`, {
      method: "GET",
      credentials: "include",
    });

    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok) {
      throw new Error(
        await readErrorMessage(response, "No fue posible obtener el listado de brazos.")
      );
    }

    return normalizePagedResult(await response.json());
  }

  static async obtener(idBrazo) {
    const response = await fetch(
      `${config.apiUrl}/brazo/Obtener?idbrazo=${encodeURIComponent(idBrazo)}`,
      {
        method: "GET",
        credentials: "include",
      }
    );

    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok) {
      throw new Error(await readErrorMessage(response, "No fue posible obtener el brazo."));
    }

    /** @type {BrazoDTO} */
    const brazo = await response.json();
    return brazo;
  }

  static async archivo(idBrazo, codBrazoAdjunto) {
    const response = await fetch(
      `${config.apiUrl}/brazo/Archivo?idbrazo=${encodeURIComponent(idBrazo)}&codbrazoadjunto=${encodeURIComponent(codBrazoAdjunto)}`,
      {
        method: "GET",
        credentials: "include",
      }
    );

    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok) {
      throw new Error(
        await readErrorMessage(response, "No fue posible obtener el archivo del brazo.")
      );
    }

    return await response.blob();
  }

  static async agregar(brazo) {
    return BrazoService.postJson("Agregar", brazo, "No fue posible agregar el brazo.");
  }

  static async editar(brazo) {
    return BrazoService.postJson("Editar", brazo, "No fue posible editar el brazo.");
  }

  static async eliminar(brazo) {
    return BrazoService.postJson("Eliminar", brazo, "No fue posible eliminar el brazo.");
  }

  static async log(idBrazo) {
    const response = await fetch(
      `${config.apiUrl}/brazo/Log?idbrazo=${encodeURIComponent(idBrazo)}`,
      {
        method: "GET",
        credentials: "include",
      }
    );

    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok) {
      throw new Error(await readErrorMessage(response, "No fue posible obtener el log del brazo."));
    }

    /** @type {BrazoLogDTO[]} */
    const log = await response.json();
    return log;
  }

  static async postJson(action, body, fallbackMessage) {
    const response = await fetch(`${config.apiUrl}/brazo/${action}`, {
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
