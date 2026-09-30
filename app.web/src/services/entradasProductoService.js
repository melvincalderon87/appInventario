import { config } from "../config/config";
import { buildListQuery, normalizePagedResult } from "../utils/pagination";
import { readApiErrorMessage as readErrorMessage } from "./apiResponse";

export class EntradasProductoService {
  static async obtenerKey() {
    const response = await fetch(`${config.apiUrl}/entradasproducto/ObtenerKey`, {
      method: "GET",
      credentials: "include",
    });
    if (!response.ok)
      throw new Error(await readErrorMessage(response, "No fue posible obtener el correlativo."));
    return response.json();
  }

  static async agregar(entrada) {
    const response = await fetch(`${config.apiUrl}/entradasproducto/Agregar`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(entrada),
    });
    if (!response.ok)
      throw new Error(
        await readErrorMessage(response, "No fue posible guardar la entrada de producto.")
      );
    return response.json();
  }

  static async agregarAjuste(entrada) {
    const response = await fetch(`${config.apiUrl}/entradasproducto/AjusteAgregar`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(entrada),
    });
    if (!response.ok)
      throw new Error(
        await readErrorMessage(response, "No fue posible guardar el ajuste de entrada.")
      );
    return response.json();
  }
  static async agregarUnidad(entrada) {
    const response = await fetch(`${config.apiUrl}/entradasproducto/UnidadAgregar`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(entrada),
    });
    if (!response.ok)
      throw new Error(
        await readErrorMessage(response, "No fue posible guardar la entrada por unidad.")
      );
    return response.json();
  }

  static async listarProductoCombustibleOpcion() {
    const response = await fetch(`${config.apiUrl}/entradasproducto/ListarProductoOpcion`, {
      method: "GET",
      credentials: "include",
    });
    if (!response.ok)
      throw new Error(
        await readErrorMessage(response, "No fue posible obtener los productos tipo combustible.")
      );
    return response.json();
  }

  static async listado(params = {}) {
    const response = await fetch(
      `${config.apiUrl}/entradasproducto/Listar?${buildListQuery(params)}`,
      {
        method: "GET",
        credentials: "include",
      }
    );
    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok)
      throw new Error(
        await readErrorMessage(
          response,
          "No fue posible obtener el listado de entradas de producto."
        )
      );
    return normalizePagedResult(await response.json());
  }

  static async listadoAjustes(params = {}) {
    const response = await fetch(
      `${config.apiUrl}/entradasproducto/AjusteListar?${buildListQuery(params)}`,
      { credentials: "include" }
    );
    if (!response.ok)
      throw new Error(
        await readErrorMessage(response, "No fue posible obtener los ajustes de entrada.")
      );
    return normalizePagedResult(await response.json());
  }

  static async listadoUnidad(params = {}) {
    const response = await fetch(
      `${config.apiUrl}/entradasproducto/UnidadListar?${buildListQuery(params)}`,
      { credentials: "include" }
    );
    if (!response.ok)
      throw new Error(
        await readErrorMessage(response, "No fue posible obtener las entradas por unidad.")
      );
    return normalizePagedResult(await response.json());
  }
}
