import { config } from "../config/config";
import { buildListQuery, normalizePagedResult } from "../utils/pagination";
import { handleApiResponse, readApiErrorMessage as readErrorMessage } from "./apiResponse";

/** @typedef {import('../models/barco/barco').BarcoDTO} BarcoDTO */
/** @typedef {import('../models/barco/barco').BarcoLogDTO} BarcoLogDTO */

export class BarcoService {
  static async ListarOpcion() {
    const response = await fetch(`${config.apiUrl}/barco/ListarOpcion`, {
      method: "GET",
      credentials: "include",
    });

    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok) {
      throw new Error(
        await readErrorMessage(response, "No fue posible obtener las opciones de barcos.")
      );
    }

    return await response.json();
  }

  static async ListarProductoCombustibleOpcion() {
    const response = await fetch(`${config.apiUrl}/barco/ListarProductoOpcion`, {
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

  static async BuscarOpcion(params = {}) {
    const searchParams = new URLSearchParams();
    const search = String(params.search ?? "").trim();
    const limite = Number(params.limite ?? 20);

    if (search) searchParams.set("search", search);
    searchParams.set("limite", String(Number.isFinite(limite) ? limite : 20));

    const response = await fetch(`${config.apiUrl}/barco/BuscarOpcion?${searchParams.toString()}`, {
      method: "GET",
      credentials: "include",
    });

    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok) {
      throw new Error(await readErrorMessage(response, "No fue posible buscar barcos."));
    }

    return await response.json();
  }

  static async ListarIngresadosRecientementeOpcion() {
    const response = await fetch(`${config.apiUrl}/barco/ListarIngresadosRecientementeOpcion`, {
      method: "GET",
      credentials: "include",
    });

    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok) {
      throw new Error(
        await readErrorMessage(
          response,
          "No fue posible obtener los barcos ingresados recientemente."
        )
      );
    }

    return await response.json();
  }

  static async ListarFechaPrevistaUltimosDosMesesOpcion() {
    const response = await fetch(
      `${config.apiUrl}/barco/ListarFechaPrevistaUltimosDosMesesOpcion`,
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
          "No fue posible obtener los barcos de fecha prevista reciente."
        )
      );
    }

    return await response.json();
  }

  static async listado(params = {}) {
    const query = buildListQuery(params);
    const response = await fetch(`${config.apiUrl}/barco/Listar?${query}`, {
      method: "GET",
      credentials: "include",
    });

    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok) {
      throw new Error(
        await readErrorMessage(response, "No fue posible obtener el listado de barcos.")
      );
    }

    return normalizePagedResult(await response.json());
  }

  static async obtener(idBarco) {
    const response = await fetch(
      `${config.apiUrl}/barco/Obtener?idbarco=${encodeURIComponent(idBarco)}`,
      {
        method: "GET",
        credentials: "include",
      }
    );

    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok) {
      throw new Error(await readErrorMessage(response, "No fue posible obtener el barco."));
    }

    /** @type {BarcoDTO} */
    const barco = await response.json();
    return barco;
  }

  static async agregar(barco) {
    return BarcoService.postJson("Agregar", barco, "No fue posible agregar el barco.");
  }

  static async editar(barco) {
    return BarcoService.postJson("Editar", barco, "No fue posible editar el barco.");
  }

  static async eliminar(barco) {
    return BarcoService.postJson("Eliminar", barco, "No fue posible eliminar el barco.");
  }

  static async log(idBarco) {
    const response = await fetch(
      `${config.apiUrl}/barco/Log?idbarco=${encodeURIComponent(idBarco)}`,
      {
        method: "GET",
        credentials: "include",
      }
    );

    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok) {
      throw new Error(await readErrorMessage(response, "No fue posible obtener el log del barco."));
    }

    /** @type {BarcoLogDTO[]} */
    const log = await response.json();
    return log;
  }

  static async postJson(action, body, fallbackMessage) {
    const response = await fetch(`${config.apiUrl}/barco/${action}`, {
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
