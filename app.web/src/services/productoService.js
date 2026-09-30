import { config } from "../config/config";
import { buildListQuery, normalizePagedResult } from "../utils/pagination";
import { handleApiResponse, readApiErrorMessage as readErrorMessage } from "./apiResponse";

/** @typedef {import('../models/producto/producto').ProductoDTO} ProductoDTO */
/** @typedef {import('../models/producto/producto').ProductoLogDTO} ProductoLogDTO */

export class ProductoService {
  static async ListarOpcion() {
    const response = await fetch(`${config.apiUrl}/producto/ListarOpcion`, {
      method: "GET",
      credentials: "include",
    });

    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok) {
      throw new Error(
        await readErrorMessage(response, "No fue posible obtener las opciones de productos.")
      );
    }

    return await response.json();
  }

  static async listado(params = {}) {
    const query = buildListQuery(params);
    const response = await fetch(`${config.apiUrl}/producto/Listar?${query}`, {
      method: "GET",
      credentials: "include",
    });

    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok) {
      throw new Error(
        await readErrorMessage(response, "No fue posible obtener el listado de productos.")
      );
    }

    return normalizePagedResult(await response.json());
  }

  static async obtener(idProducto) {
    const response = await fetch(
      `${config.apiUrl}/producto/Obtener?idproducto=${encodeURIComponent(idProducto)}`,
      {
        method: "GET",
        credentials: "include",
      }
    );

    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok) {
      throw new Error(await readErrorMessage(response, "No fue posible obtener el producto."));
    }

    /** @type {ProductoDTO} */
    const producto = await response.json();
    return producto;
  }

  static async agregar(producto) {
    return ProductoService.postJson("Agregar", producto, "No fue posible agregar el producto.");
  }

  static async editar(producto) {
    return ProductoService.postJson("Editar", producto, "No fue posible editar el producto.");
  }

  static async eliminar(producto) {
    return ProductoService.postJson("Eliminar", producto, "No fue posible eliminar el producto.");
  }

  static async log(idProducto) {
    const response = await fetch(
      `${config.apiUrl}/producto/Log?idproducto=${encodeURIComponent(idProducto)}`,
      {
        method: "GET",
        credentials: "include",
      }
    );

    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok) {
      throw new Error(
        await readErrorMessage(response, "No fue posible obtener el log del producto.")
      );
    }

    /** @type {ProductoLogDTO[]} */
    const log = await response.json();
    return log;
  }

  static async postJson(action, body, fallbackMessage) {
    const response = await fetch(`${config.apiUrl}/producto/${action}`, {
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
