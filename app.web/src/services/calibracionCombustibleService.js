import { config } from "../config/config";
import { buildListQuery, normalizePagedResult } from "../utils/pagination";
import { handleApiResponse, readApiErrorMessage as readErrorMessage } from "./apiResponse";

/** @typedef {import('../models/calibracionCombustible/calibracionCombustible').CalibracionCombustibleDTO} CalibracionCombustibleDTO */

export class CalibracionCombustibleService {
  static async listado(params = {}) {
    const query = buildListQuery(params);
    const response = await fetch(`${config.apiUrl}/calibracioncombustible/Listar?${query}`, {
      method: "GET",
      credentials: "include",
    });

    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok) {
      throw new Error(
        await readErrorMessage(
          response,
          "No fue posible obtener el listado de calibracion combustible."
        )
      );
    }

    return normalizePagedResult(await response.json());
  }

  static async ListarProductoOpcion() {
    const response = await fetch(`${config.apiUrl}/calibracioncombustible/ListarProductoOpcion`, {
      method: "GET",
      credentials: "include",
    });

    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok) {
      throw new Error(
        await readErrorMessage(
          response,
          "No fue posible obtener las opciones de productos tipo combustible."
        )
      );
    }

    return await response.json();
  }

  static async ListarBrazoOpcion(codBahia = "") {
    const searchParams = new URLSearchParams();
    const codigoBahia = String(codBahia ?? "").trim();

    if (codigoBahia) {
      searchParams.set("codbahia", codigoBahia);
    }

    const query = searchParams.toString();
    const response = await fetch(
      `${config.apiUrl}/calibracioncombustible/ListarBrazoOpcion${query ? `?${query}` : ""}`,
      {
        method: "GET",
        credentials: "include",
      }
    );

    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok) {
      throw new Error(
        await readErrorMessage(response, "No fue posible obtener las opciones de brazos.")
      );
    }

    return await response.json();
  }

  static async agregar(calibracionCombustible) {
    return CalibracionCombustibleService.postJson(
      "Agregar",
      calibracionCombustible,
      "No fue posible guardar la calibracion combustible."
    );
  }

  static async obtener(idCalibracionCombustible) {
    const response = await fetch(
      `${config.apiUrl}/calibracioncombustible/Obtener?idcalibracioncombustible=${encodeURIComponent(idCalibracionCombustible)}`,
      {
        method: "GET",
        credentials: "include",
      }
    );

    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok) {
      throw new Error(
        await readErrorMessage(response, "No fue posible obtener la calibracion combustible.")
      );
    }

    return await response.json();
  }

  static async editar(calibracionCombustible) {
    return CalibracionCombustibleService.postJson(
      "Editar",
      calibracionCombustible,
      "No fue posible editar la calibracion combustible."
    );
  }

  static async eliminar(calibracionCombustible) {
    return CalibracionCombustibleService.postJson(
      "Eliminar",
      calibracionCombustible,
      "No fue posible eliminar la calibracion combustible."
    );
  }

  static async log(idCalibracionCombustible) {
    const response = await fetch(
      `${config.apiUrl}/calibracioncombustible/Log?idcalibracioncombustible=${encodeURIComponent(idCalibracionCombustible)}`,
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
          "No fue posible obtener el log de la calibracion combustible."
        )
      );
    }

    return await response.json();
  }

  static async postJson(action, body, fallbackMessage) {
    const response = await fetch(`${config.apiUrl}/calibracioncombustible/${action}`, {
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
