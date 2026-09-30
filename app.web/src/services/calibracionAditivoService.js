import { config } from "../config/config";
import { buildListQuery, normalizePagedResult } from "../utils/pagination";
import { handleApiResponse, readApiErrorMessage as readErrorMessage } from "./apiResponse";

/** @typedef {import('../models/calibracionAditivo/calibracionAditivo').CalibracionAditivoDTO} CalibracionAditivoDTO */

export class CalibracionAditivoService {
  static async listado(params = {}) {
    const query = buildListQuery(params);
    const response = await fetch(`${config.apiUrl}/calibracionaditivo/Listar?${query}`, {
      method: "GET",
      credentials: "include",
    });

    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok) {
      throw new Error(
        await readErrorMessage(
          response,
          "No fue posible obtener el listado de calibracion aditivo."
        )
      );
    }

    return normalizePagedResult(await response.json());
  }

  static async ListarProductoOpcion() {
    const response = await fetch(`${config.apiUrl}/calibracionaditivo/ListarProductoOpcion`, {
      method: "GET",
      credentials: "include",
    });

    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok) {
      throw new Error(
        await readErrorMessage(
          response,
          "No fue posible obtener las opciones de productos tipo aditivo."
        )
      );
    }

    return await response.json();
  }

  static async agregar(calibracionAditivo) {
    return CalibracionAditivoService.postJson(
      "Agregar",
      calibracionAditivo,
      "No fue posible guardar la calibracion aditivo."
    );
  }

  static async obtener(idCalibracionAditivo) {
    const response = await fetch(
      `${config.apiUrl}/calibracionaditivo/Obtener?idcalibracionaditivo=${encodeURIComponent(idCalibracionAditivo)}`,
      {
        method: "GET",
        credentials: "include",
      }
    );

    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok) {
      throw new Error(
        await readErrorMessage(response, "No fue posible obtener la calibracion aditivo.")
      );
    }

    return await response.json();
  }

  static async editar(calibracionAditivo) {
    return CalibracionAditivoService.postJson(
      "Editar",
      calibracionAditivo,
      "No fue posible editar la calibracion aditivo."
    );
  }

  static async eliminar(calibracionAditivo) {
    return CalibracionAditivoService.postJson(
      "Eliminar",
      calibracionAditivo,
      "No fue posible eliminar la calibracion aditivo."
    );
  }

  static async log(idCalibracionAditivo) {
    const response = await fetch(
      `${config.apiUrl}/calibracionaditivo/Log?idcalibracionaditivo=${encodeURIComponent(idCalibracionAditivo)}`,
      {
        method: "GET",
        credentials: "include",
      }
    );

    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok) {
      throw new Error(
        await readErrorMessage(response, "No fue posible obtener el log de la calibracion aditivo.")
      );
    }

    return await response.json();
  }

  static async postJson(action, body, fallbackMessage) {
    const response = await fetch(`${config.apiUrl}/calibracionaditivo/${action}`, {
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
