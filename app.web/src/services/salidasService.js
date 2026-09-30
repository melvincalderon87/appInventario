import { config } from "../config/config";
import { buildListQuery, normalizePagedResult } from "../utils/pagination";
import { handleApiResponse, readApiErrorMessage as readErrorMessage } from "./apiResponse";

/** @typedef {import('../models/salidas/salidas').SalidasDTO} SalidasDTO */

export class SalidasService {
  static async obtenerKey() {
    const response = await fetch(`${config.apiUrl}/salidas/ObtenerKey`, {
      credentials: "include",
    });

    return await handleApiResponse(response, "No fue posible obtener el codigo de la salida.");
  }

  static async listado(params = {}) {
    const query = buildListQuery(params);
    const response = await fetch(`${config.apiUrl}/salidas/Listar?${query}`, {
      method: "GET",
      credentials: "include",
    });

    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok) {
      throw new Error(
        await readErrorMessage(
          response,
          "No fue posible obtener el listado de salidas de producto."
        )
      );
    }

    return normalizePagedResult(await response.json());
  }

  static async listadoAjustes(params = {}) {
    const response = await fetch(
      `${config.apiUrl}/salidas/AjusteListar?${buildListQuery(params)}`,
      { credentials: "include" }
    );
    return normalizePagedResult(
      await handleApiResponse(response, "No fue posible obtener los ajustes de salida.")
    );
  }

  static async listadoUnidad(params = {}) {
    const response = await fetch(
      `${config.apiUrl}/salidas/UnidadListar?${buildListQuery(params)}`,
      { credentials: "include" }
    );
    return normalizePagedResult(
      await handleApiResponse(response, "No fue posible obtener las salidas por unidad.")
    );
  }

  static async listarProductoCombustibleOpcion() {
    const response = await fetch(`${config.apiUrl}/salidas/ListarProductoOpcion`, {
      method: "GET",
      credentials: "include",
    });

    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok)
      throw new Error(
        await readErrorMessage(response, "No fue posible obtener los productos tipo combustible.")
      );
    return await response.json();
  }

  static async obtener(idSalida) {
    const response = await fetch(
      `${config.apiUrl}/salidas/Obtener?idsalida=${encodeURIComponent(idSalida)}`,
      {
        method: "GET",
        credentials: "include",
      }
    );

    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok) {
      throw new Error(
        await readErrorMessage(response, "No fue posible obtener la salida de producto.")
      );
    }

    /** @type {SalidasDTO} */
    const salida = await response.json();
    return salida;
  }

  /** @param {SalidasDTO} salida */
  static async agregar(salida) {
    return SalidasService.postJson("Agregar", salida, "No fue posible guardar la salida.");
  }

  static async agregarAjuste(salida) {
    return SalidasService.postJson(
      "AjusteAgregar",
      salida,
      "No fue posible guardar el ajuste de salida."
    );
  }
  static async agregarUnidad(salida) {
    return SalidasService.postJson(
      "UnidadAgregar",
      salida,
      "No fue posible guardar la salida por unidad."
    );
  }

  /** @param {SalidasDTO} salida */
  static async editar(salida) {
    return SalidasService.postJson("Editar", salida, "No fue posible editar la salida.");
  }

  /** @param {SalidasDTO} salida */
  static async eliminar(salida) {
    return SalidasService.postJson("Eliminar", salida, "No fue posible eliminar la salida.");
  }

  static async postJson(action, body, fallbackMessage) {
    const response = await fetch(`${config.apiUrl}/salidas/${action}`, {
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
