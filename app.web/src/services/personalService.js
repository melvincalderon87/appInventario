import { config } from "../config/config";
import { buildListQuery, normalizePagedResult } from "../utils/pagination";
import { handleApiResponse, readApiErrorMessage as readErrorMessage } from "./apiResponse";

/** @typedef {import('../models/personal/personal').PersonalDTO} PersonalDTO */
/** @typedef {import('../models/personal/personal').PersonalLogDTO} PersonalLogDTO */

export class PersonalService {
  static async ListarOpcion() {
    const response = await fetch(`${config.apiUrl}/personal/ListarOpcion`, {
      method: "GET",
      credentials: "include",
    });

    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok) {
      throw new Error(
        await readErrorMessage(response, "No fue posible obtener las opciones de personal.")
      );
    }

    return response.json();
  }

  static async ListarTecnicoOpcion() {
    const response = await fetch(`${config.apiUrl}/personal/ListarTecnicoOpcion`, {
      method: "GET",
      credentials: "include",
    });

    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok) {
      throw new Error(
        await readErrorMessage(response, "No fue posible obtener las opciones de tecnicos.")
      );
    }

    return response.json();
  }

  static async listado(params = {}) {
    const query = buildListQuery(params);
    const response = await fetch(`${config.apiUrl}/personal/Listar?${query}`, {
      method: "GET",
      credentials: "include",
    });

    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok) {
      throw new Error(
        await readErrorMessage(response, "No fue posible obtener el listado de personal.")
      );
    }

    return normalizePagedResult(await response.json());
  }

  static async obtener(idPersonal) {
    const response = await fetch(
      `${config.apiUrl}/personal/Obtener?idpersonal=${encodeURIComponent(idPersonal)}`,
      {
        method: "GET",
        credentials: "include",
      }
    );

    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok) {
      throw new Error(await readErrorMessage(response, "No fue posible obtener el personal."));
    }

    /** @type {PersonalDTO} */
    const personal = await response.json();
    return personal;
  }

  static async foto(idPersonal) {
    const response = await fetch(
      `${config.apiUrl}/personal/Foto?idpersonal=${encodeURIComponent(idPersonal)}`,
      {
        method: "GET",
        credentials: "include",
      }
    );

    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok) {
      throw new Error(
        await readErrorMessage(response, "No fue posible obtener la foto del personal.")
      );
    }

    return response.blob();
  }

  static async agregar(personal) {
    return PersonalService.postJson("Agregar", personal, "No fue posible agregar el personal.");
  }

  static async editar(personal) {
    return PersonalService.postJson("Editar", personal, "No fue posible editar el personal.");
  }

  static async eliminar(personal) {
    return PersonalService.postJson("Eliminar", personal, "No fue posible eliminar el personal.");
  }

  static async log(idPersonal) {
    const response = await fetch(
      `${config.apiUrl}/personal/Log?idpersonal=${encodeURIComponent(idPersonal)}`,
      {
        method: "GET",
        credentials: "include",
      }
    );

    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok) {
      throw new Error(
        await readErrorMessage(response, "No fue posible obtener el log del personal.")
      );
    }

    /** @type {PersonalLogDTO[]} */
    const log = await response.json();
    return log;
  }

  static async postJson(action, body, fallbackMessage) {
    const response = await fetch(`${config.apiUrl}/personal/${action}`, {
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
