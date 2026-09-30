import { config } from "../config/config";
import { buildListQuery, normalizePagedResult } from "../utils/pagination";
import { handleApiResponse, readApiErrorMessage as readErrorMessage } from "./apiResponse";

/** @typedef {import('../models/calibracionEtanol/calibracionEtanol').CalibracionEtanolDTO} CalibracionEtanolDTO */

export class CalibracionEtanolService {
  static async listado(params = {}) {
    const query = buildListQuery(params);
    const response = await fetch(`${config.apiUrl}/calibracionetanol/Listar?${query}`, {
      method: "GET",
      credentials: "include",
    });

    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok) {
      throw new Error(
        await readErrorMessage(response, "No fue posible obtener el listado de calibracion etanol.")
      );
    }

    return normalizePagedResult(await response.json());
  }

  static async ListarProductoOpcion() {
    const response = await fetch(`${config.apiUrl}/calibracionetanol/ListarProductoOpcion`, {
      method: "GET",
      credentials: "include",
    });

    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok) {
      throw new Error(
        await readErrorMessage(
          response,
          "No fue posible obtener las opciones de productos tipo etanol."
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
      `${config.apiUrl}/calibracionetanol/ListarBrazoOpcion${query ? `?${query}` : ""}`,
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

  static async agregar(calibracionEtanol) {
    return CalibracionEtanolService.postJson(
      "Agregar",
      calibracionEtanol,
      "No fue posible guardar la calibracion etanol."
    );
  }

  static async obtener(idCalibracionEtanol) {
    const response = await fetch(
      `${config.apiUrl}/calibracionetanol/Obtener?idcalibracionetanol=${encodeURIComponent(idCalibracionEtanol)}`,
      {
        method: "GET",
        credentials: "include",
      }
    );

    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok) {
      throw new Error(
        await readErrorMessage(response, "No fue posible obtener la calibracion etanol.")
      );
    }

    return await response.json();
  }

  static async editar(calibracionEtanol) {
    return CalibracionEtanolService.postJson(
      "Editar",
      calibracionEtanol,
      "No fue posible editar la calibracion etanol."
    );
  }

  static async eliminar(calibracionEtanol) {
    return CalibracionEtanolService.postJson(
      "Eliminar",
      calibracionEtanol,
      "No fue posible eliminar la calibracion etanol."
    );
  }

  static async log(idCalibracionEtanol) {
    const response = await fetch(
      `${config.apiUrl}/calibracionetanol/Log?idcalibracionetanol=${encodeURIComponent(idCalibracionEtanol)}`,
      {
        method: "GET",
        credentials: "include",
      }
    );

    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok) {
      throw new Error(
        await readErrorMessage(response, "No fue posible obtener el log de la calibracion etanol.")
      );
    }

    return await response.json();
  }

  static async postJson(action, body, fallbackMessage) {
    const response = await fetch(`${config.apiUrl}/calibracionetanol/${action}`, {
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
