import { config } from "../config/config";
import { buildListQuery, normalizePagedResult } from "../utils/pagination";
import { handleApiResponse, readApiErrorMessage as readErrorMessage } from "./apiResponse";

/** @typedef {import('../models/compraVentaSuplidores/compraVentaSuplidores').CompraVentaSuplidoresDTO} CompraVentaSuplidoresDTO */

export class CompraVentaSuplidoresService {
  static async obtenerKey() {
    const response = await fetch(`${config.apiUrl}/compraventasuplidores/ObtenerKey`, {
      credentials: "include",
    });

    return await handleApiResponse(
      response,
      "No fue posible obtener el codigo del traslado de producto."
    );
  }

  static async listado(params = {}) {
    const query = buildListQuery(params);
    const response = await fetch(`${config.apiUrl}/compraventasuplidores/Listar?${query}`, {
      method: "GET",
      credentials: "include",
    });

    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok) {
      throw new Error(
        await readErrorMessage(
          response,
          "No fue posible obtener el listado de traslados de producto."
        )
      );
    }

    return normalizePagedResult(await response.json());
  }

  static async listarProductoCombustibleOpcion() {
    const response = await fetch(`${config.apiUrl}/compraventasuplidores/ListarProductoOpcion`, {
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

  static async obtener(idCompraVentaSuplidores) {
    const response = await fetch(
      `${config.apiUrl}/compraventasuplidores/Obtener?idcompraventasuplidores=${encodeURIComponent(idCompraVentaSuplidores)}`,
      {
        method: "GET",
        credentials: "include",
      }
    );

    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok) {
      throw new Error(
        await readErrorMessage(response, "No fue posible obtener el traslado de producto.")
      );
    }

    /** @type {CompraVentaSuplidoresDTO} */
    const traslado = await response.json();
    return traslado;
  }

  /** @param {CompraVentaSuplidoresDTO} traslado */
  static async agregar(traslado) {
    return CompraVentaSuplidoresService.postJson(
      "Agregar",
      traslado,
      "No fue posible guardar el traslado de producto."
    );
  }

  /** @param {CompraVentaSuplidoresDTO} traslado */
  static async editar(traslado) {
    return CompraVentaSuplidoresService.postJson(
      "Editar",
      traslado,
      "No fue posible editar el traslado de producto."
    );
  }

  /** @param {CompraVentaSuplidoresDTO} traslado */
  static async eliminar(traslado) {
    return CompraVentaSuplidoresService.postJson(
      "Eliminar",
      traslado,
      "No fue posible eliminar el traslado de producto."
    );
  }

  static async postJson(action, body, fallbackMessage) {
    const response = await fetch(`${config.apiUrl}/compraventasuplidores/${action}`, {
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
