import { config } from "../config/config";
import { buildListQuery, normalizePagedResult } from "../utils/pagination";
import { handleApiResponse, readApiErrorMessage as readErrorMessage } from "./apiResponse";

/** @typedef {import('../models/colorante/colorante').ColoranteDTO} ColoranteDTO */
/** @typedef {import('../models/colorante/colorante').ColoranteLogDTO} ColoranteLogDTO */

export class ColoranteService {
  static async ListarOpcion() {
    const response = await fetch(`${config.apiUrl}/colorante/ListarOpcion`, {
      method: "GET",
      credentials: "include",
    });

    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok) {
      throw new Error(
        await readErrorMessage(response, "No fue posible obtener las opciones de colorante.")
      );
    }

    return await response.json();
  }

  static async ListarProductoOpcion() {
    const response = await fetch(`${config.apiUrl}/colorante/ListarProductoOpcion`, {
      method: "GET",
      credentials: "include",
    });

    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok) {
      throw new Error(
        await readErrorMessage(response, "No fue posible obtener los productos colorante.")
      );
    }

    return await response.json();
  }

  static async listado(params = {}) {
    const searchParams = new URLSearchParams(buildListQuery(params));

    if (String(params.tipoMovimiento ?? "").trim()) {
      searchParams.set("tipomovimiento", String(params.tipoMovimiento).trim());
    }

    if (String(params.idProducto ?? "").trim()) {
      searchParams.set("idproducto", String(params.idProducto).trim());
    }

    const query = searchParams.toString();
    const response = await fetch(`${config.apiUrl}/colorante/Listar?${query}`, {
      method: "GET",
      credentials: "include",
    });

    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok) {
      throw new Error(
        await readErrorMessage(response, "No fue posible obtener el listado de colorantes.")
      );
    }

    return normalizePagedResult(await response.json());
  }

  static async obtener(idColorante) {
    const response = await fetch(
      `${config.apiUrl}/colorante/Obtener?idcolorante=${encodeURIComponent(idColorante)}`,
      {
        method: "GET",
        credentials: "include",
      }
    );

    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok) {
      throw new Error(
        await readErrorMessage(response, "No fue posible obtener el movimiento de colorante.")
      );
    }

    /** @type {ColoranteDTO} */
    const colorante = await response.json();
    return colorante;
  }

  static async agregar(colorante) {
    return ColoranteService.postJson(
      "Agregar",
      colorante,
      "No fue posible agregar el movimiento de colorante."
    );
  }

  static async editar(colorante) {
    return ColoranteService.postJson(
      "Editar",
      colorante,
      "No fue posible editar el movimiento de colorante."
    );
  }

  static async eliminar(colorante) {
    return ColoranteService.postJson(
      "Eliminar",
      colorante,
      "No fue posible eliminar el movimiento de colorante."
    );
  }

  static async log(idColorante) {
    const response = await fetch(
      `${config.apiUrl}/colorante/Log?idcolorante=${encodeURIComponent(idColorante)}`,
      {
        method: "GET",
        credentials: "include",
      }
    );

    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok) {
      throw new Error(
        await readErrorMessage(response, "No fue posible obtener el log del colorante.")
      );
    }

    /** @type {ColoranteLogDTO[]} */
    const log = await response.json();
    return log;
  }

  static async postJson(action, body, fallbackMessage) {
    const response = await fetch(`${config.apiUrl}/colorante/${action}`, {
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
