import { config } from "../config/config";
import { buildListQuery, normalizePagedResult } from "../utils/pagination";
import { handleApiResponse, readApiErrorMessage as readErrorMessage } from "./apiResponse";

/** @typedef {import('../models/medicionTanqueTierra/medicionTanqueTierra').MedicionTanqueTierraDTO} MedicionTanqueTierraDTO */
/** @typedef {import('../models/medicionTanqueTierra/medicionTanqueTierra').MedicionTanqueTierraLogDTO} MedicionTanqueTierraLogDTO */

export class MedicionTanqueTierraService {
  static async volumenCalibracion({ codTanque, codProducto, pies, pulgadas, dieciseisavos }) {
    const query = new URLSearchParams({
      codtanque: codTanque,
      codproducto: String(codProducto),
      pies: String(pies),
      pulgadas: String(pulgadas),
      dieciseisavos: String(dieciseisavos),
    });
    const response = await fetch(
      `${config.apiUrl}/mediciontanquetierra/VolumenCalibracion?${query}`,
      { method: "GET", credentials: "include" }
    );
    if (!response.ok)
      throw new Error(
        await readErrorMessage(response, "No existe una calibracion para la medida indicada.")
      );
    return await response.json();
  }
  static async ListarOpcion() {
    const response = await fetch(`${config.apiUrl}/mediciontanquetierra/ListarOpcion`, {
      method: "GET",
      credentials: "include",
    });

    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok) {
      throw new Error(
        await readErrorMessage(
          response,
          "No fue posible obtener las opciones de medicion de tanque en tierra."
        )
      );
    }

    return await response.json();
  }

  static async listado(params = {}) {
    const query = buildListQuery(params);
    const response = await fetch(`${config.apiUrl}/mediciontanquetierra/Listar?${query}`, {
      method: "GET",
      credentials: "include",
    });

    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok) {
      throw new Error(
        await readErrorMessage(
          response,
          "No fue posible obtener el listado de mediciones de tanque en tierra."
        )
      );
    }

    return normalizePagedResult(await response.json());
  }

  static async obtener(idMedicionTanqueTierra) {
    const response = await fetch(
      `${config.apiUrl}/mediciontanquetierra/Obtener?idmediciontanquetierra=${encodeURIComponent(idMedicionTanqueTierra)}`,
      {
        method: "GET",
        credentials: "include",
      }
    );

    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok) {
      throw new Error(
        await readErrorMessage(response, "No fue posible obtener la medicion de tanque en tierra.")
      );
    }

    /** @type {MedicionTanqueTierraDTO} */
    const medicion = await response.json();
    return medicion;
  }

  static async agregar(medicion) {
    return MedicionTanqueTierraService.postJson(
      "Agregar",
      medicion,
      "No fue posible agregar la medicion de tanque en tierra."
    );
  }

  static async editar(medicion) {
    return MedicionTanqueTierraService.postJson(
      "Editar",
      medicion,
      "No fue posible editar la medicion de tanque en tierra."
    );
  }

  static async eliminar(medicion) {
    return MedicionTanqueTierraService.postJson(
      "Eliminar",
      medicion,
      "No fue posible eliminar la medicion de tanque en tierra."
    );
  }

  static async log(idMedicionTanqueTierra) {
    const response = await fetch(
      `${config.apiUrl}/mediciontanquetierra/Log?idmediciontanquetierra=${encodeURIComponent(idMedicionTanqueTierra)}`,
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
          "No fue posible obtener el log de la medicion de tanque en tierra."
        )
      );
    }

    /** @type {MedicionTanqueTierraLogDTO[]} */
    const log = await response.json();
    return log;
  }

  static async postJson(action, body, fallbackMessage) {
    const response = await fetch(`${config.apiUrl}/mediciontanquetierra/${action}`, {
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
