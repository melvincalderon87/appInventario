import { config } from "../config/config";
import { buildListQuery, normalizePagedResult } from "../utils/pagination";
import { handleApiResponse, readApiErrorMessage as readErrorMessage } from "./apiResponse";

/** @typedef {import('../models/personalExterno/personalExterno').PersonalExternoDTO} PersonalExternoDTO */
/** @typedef {import('../models/personalExterno/personalExterno').PersonalExternoLogDTO} PersonalExternoLogDTO */

export class PersonalExternoService {
  static async ListarOpcion(idCompaniaInspeccion = "") {
    const query = idCompaniaInspeccion
      ? `?idcompaniainspeccion=${encodeURIComponent(idCompaniaInspeccion)}`
      : "";
    const response = await fetch(`${config.apiUrl}/personalexterno/ListarOpcion${query}`, {
      method: "GET",
      credentials: "include",
    });

    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok) {
      throw new Error(
        await readErrorMessage(response, "No fue posible obtener las opciones de personal externo.")
      );
    }

    return response.json();
  }

  static async listado(params = {}) {
    const searchParams = new URLSearchParams(buildListQuery(params));

    if (String(params.idCompaniaInspeccion ?? "").trim()) {
      searchParams.set("idcompaniainspeccion", String(params.idCompaniaInspeccion).trim());
    }

    const query = searchParams.toString();
    const response = await fetch(`${config.apiUrl}/personalexterno/Listar?${query}`, {
      method: "GET",
      credentials: "include",
    });

    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok) {
      throw new Error(
        await readErrorMessage(response, "No fue posible obtener el listado de personal externo.")
      );
    }

    return normalizePagedResult(await response.json());
  }

  static async obtener(idPersonalExterno) {
    const response = await fetch(
      `${config.apiUrl}/personalexterno/Obtener?idpersonalexterno=${encodeURIComponent(idPersonalExterno)}`,
      {
        method: "GET",
        credentials: "include",
      }
    );

    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok) {
      throw new Error(
        await readErrorMessage(response, "No fue posible obtener el personal externo.")
      );
    }

    /** @type {PersonalExternoDTO} */
    const personalExterno = await response.json();
    return personalExterno;
  }

  static async foto(idPersonalExterno) {
    const response = await fetch(
      `${config.apiUrl}/personalexterno/Foto?idpersonalexterno=${encodeURIComponent(idPersonalExterno)}`,
      {
        method: "GET",
        credentials: "include",
      }
    );

    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok) {
      throw new Error(
        await readErrorMessage(response, "No fue posible obtener la foto del personal externo.")
      );
    }

    return response.blob();
  }

  static async archivo(idPersonalExterno, codPersonalExternoAdjunto) {
    const response = await fetch(
      `${config.apiUrl}/personalexterno/Archivo?idpersonalexterno=${encodeURIComponent(idPersonalExterno)}&codpersonalexternoadjunto=${encodeURIComponent(codPersonalExternoAdjunto)}`,
      {
        method: "GET",
        credentials: "include",
      }
    );

    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok) {
      throw new Error(
        await readErrorMessage(response, "No fue posible obtener el archivo del personal externo.")
      );
    }

    return response.blob();
  }

  static async agregar(personalExterno) {
    return PersonalExternoService.postJson(
      "Agregar",
      personalExterno,
      "No fue posible agregar el personal externo."
    );
  }

  static async editar(personalExterno) {
    return PersonalExternoService.postJson(
      "Editar",
      personalExterno,
      "No fue posible editar el personal externo."
    );
  }

  static async eliminar(personalExterno) {
    return PersonalExternoService.postJson(
      "Eliminar",
      personalExterno,
      "No fue posible eliminar el personal externo."
    );
  }

  static async log(idPersonalExterno) {
    const response = await fetch(
      `${config.apiUrl}/personalexterno/Log?idpersonalexterno=${encodeURIComponent(idPersonalExterno)}`,
      {
        method: "GET",
        credentials: "include",
      }
    );

    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok) {
      throw new Error(
        await readErrorMessage(response, "No fue posible obtener el log del personal externo.")
      );
    }

    /** @type {PersonalExternoLogDTO[]} */
    const log = await response.json();
    return log;
  }

  static async postJson(action, body, fallbackMessage) {
    const response = await fetch(`${config.apiUrl}/personalexterno/${action}`, {
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
