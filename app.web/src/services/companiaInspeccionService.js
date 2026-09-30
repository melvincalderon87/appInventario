import { config } from "../config/config";
import { buildListQuery, normalizePagedResult } from "../utils/pagination";
import { handleApiResponse, readApiErrorMessage as readErrorMessage } from "./apiResponse";

/** @typedef {import('../models/companiaInspeccion/companiaInspeccion').CompaniaInspeccionDTO} CompaniaInspeccionDTO */
/** @typedef {import('../models/companiaInspeccion/companiaInspeccion').CompaniaInspeccionLogDTO} CompaniaInspeccionLogDTO */

export class CompaniaInspeccionService {
  static async ListarOpcion() {
    const response = await fetch(`${config.apiUrl}/companiainspeccion/ListarOpcion`, {
      method: "GET",
      credentials: "include",
    });

    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok) {
      throw new Error(
        await readErrorMessage(
          response,
          "No fue posible obtener las opciones de companias de inspeccion."
        )
      );
    }

    return response.json();
  }

  static async listado(params = {}) {
    const query = buildListQuery(params);
    const response = await fetch(`${config.apiUrl}/companiainspeccion/Listar?${query}`, {
      method: "GET",
      credentials: "include",
    });

    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok) {
      throw new Error(
        await readErrorMessage(
          response,
          "No fue posible obtener el listado de companias de inspeccion."
        )
      );
    }

    return normalizePagedResult(await response.json());
  }

  static async obtener(idCompaniaInspeccion) {
    const response = await fetch(
      `${config.apiUrl}/companiainspeccion/Obtener?idcompaniainspeccion=${encodeURIComponent(idCompaniaInspeccion)}`,
      {
        method: "GET",
        credentials: "include",
      }
    );

    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok) {
      throw new Error(
        await readErrorMessage(response, "No fue posible obtener la compania de inspeccion.")
      );
    }

    /** @type {CompaniaInspeccionDTO} */
    const companiaInspeccion = await response.json();
    return companiaInspeccion;
  }

  static async agregar(companiaInspeccion) {
    return CompaniaInspeccionService.postJson(
      "Agregar",
      companiaInspeccion,
      "No fue posible agregar la compania de inspeccion."
    );
  }

  static async editar(companiaInspeccion) {
    return CompaniaInspeccionService.postJson(
      "Editar",
      companiaInspeccion,
      "No fue posible editar la compania de inspeccion."
    );
  }

  static async archivo(idCompaniaInspeccion, codCompaniaInspeccionAdjunto) {
    const response = await fetch(
      `${config.apiUrl}/companiainspeccion/Archivo?idcompaniainspeccion=${encodeURIComponent(idCompaniaInspeccion)}&codcompaniainspeccionadjunto=${encodeURIComponent(codCompaniaInspeccionAdjunto)}`,
      {
        method: "GET",
        credentials: "include",
      }
    );

    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok) {
      throw new Error(
        await readErrorMessage(
          response,
          "No fue posible obtener el archivo de la compania de inspeccion."
        )
      );
    }

    return response.blob();
  }

  static async eliminar(companiaInspeccion) {
    return CompaniaInspeccionService.postJson(
      "Eliminar",
      companiaInspeccion,
      "No fue posible eliminar la compania de inspeccion."
    );
  }

  static async log(idCompaniaInspeccion) {
    const response = await fetch(
      `${config.apiUrl}/companiainspeccion/Log?idcompaniainspeccion=${encodeURIComponent(idCompaniaInspeccion)}`,
      {
        method: "GET",
        credentials: "include",
      }
    );

    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok) {
      throw new Error(
        await readErrorMessage(
          response,
          "No fue posible obtener el log de la compania de inspeccion."
        )
      );
    }

    /** @type {CompaniaInspeccionLogDTO[]} */
    const log = await response.json();
    return log;
  }

  static async postJson(action, body, fallbackMessage) {
    const response = await fetch(`${config.apiUrl}/companiainspeccion/${action}`, {
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
