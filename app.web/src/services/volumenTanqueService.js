import { config } from "../config/config";
import { buildListQuery, normalizePagedResult } from "../utils/pagination";
import { handleApiResponse, readApiErrorMessage as readErrorMessage } from "./apiResponse";

/** @typedef {import('../models/volumenTanque/volumenTanque').VolumenTanqueDTO} VolumenTanqueDTO */
/** @typedef {import('../models/volumenTanque/volumenTanque').VolumenTanqueLogDTO} VolumenTanqueLogDTO */

export class VolumenTanqueService {
  static async ListarOpcion() {
    const response = await fetch(`${config.apiUrl}/volumentanque/ListarOpcion`, {
      method: "GET",
      credentials: "include",
    });

    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok) {
      throw new Error(
        await readErrorMessage(
          response,
          "No fue posible obtener las opciones de volumen de tanque."
        )
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
    const response = await fetch(`${config.apiUrl}/volumentanque/Listar?${query}`, {
      method: "GET",
      credentials: "include",
    });

    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok) {
      throw new Error(
        await readErrorMessage(response, "No fue posible obtener el listado de volumen de tanque.")
      );
    }

    return normalizePagedResult(await response.json());
  }

  static async obtener(idVolumenTanque) {
    const response = await fetch(
      `${config.apiUrl}/volumentanque/Obtener?idvolumentanque=${encodeURIComponent(idVolumenTanque)}`,
      {
        method: "GET",
        credentials: "include",
      }
    );

    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok) {
      throw new Error(
        await readErrorMessage(response, "No fue posible obtener el volumen de tanque.")
      );
    }

    /** @type {VolumenTanqueDTO} */
    const volumenTanque = await response.json();
    return volumenTanque;
  }

  static async calcularVolumen(volumenTanque) {
    return VolumenTanqueService.postJson(
      "CalcularVolumen",
      volumenTanque,
      "No fue posible extraer el volumen."
    );
  }

  static async esCombustible(codTanque) {
    const response = await fetch(
      `${config.apiUrl}/volumentanque/EsCombustible?codtanque=${encodeURIComponent(codTanque)}`,
      {
        method: "GET",
        credentials: "include",
      }
    );
    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok)
      throw new Error(
        await readErrorMessage(response, "No fue posible validar el tipo de producto.")
      );
    const data = await response.json();
    return Boolean(data?.esCombustible);
  }

  static async agregar(volumenTanque) {
    return VolumenTanqueService.postJson(
      "Agregar",
      volumenTanque,
      "No fue posible agregar el volumen de tanque."
    );
  }

  static async editar(volumenTanque) {
    return VolumenTanqueService.postJson(
      "Editar",
      volumenTanque,
      "No fue posible editar el volumen de tanque."
    );
  }

  static async eliminar(volumenTanque) {
    return VolumenTanqueService.postJson(
      "Eliminar",
      volumenTanque,
      "No fue posible eliminar el volumen de tanque."
    );
  }

  static async log(idVolumenTanque) {
    const response = await fetch(
      `${config.apiUrl}/volumentanque/Log?idvolumentanque=${encodeURIComponent(idVolumenTanque)}`,
      {
        method: "GET",
        credentials: "include",
      }
    );

    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok) {
      throw new Error(
        await readErrorMessage(response, "No fue posible obtener el log de volumen de tanque.")
      );
    }

    /** @type {VolumenTanqueLogDTO[]} */
    const log = await response.json();
    return log;
  }

  static async postJson(action, body, fallbackMessage) {
    const response = await fetch(`${config.apiUrl}/volumentanque/${action}`, {
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
