import { config } from "../config/config";
import { buildListQuery, normalizePagedResult } from "../utils/pagination";
import { handleApiResponse, readApiErrorMessage } from "./apiResponse";

export class SaldoInicialService {
  static endpoint(tipo) {
    return (
      {
        COMBUSTIBLE: "saldoInicialCombustible",
        ADITIVO: "saldoInicialAditivo",
        COLORANTE: "saldoInicialColorante",
        ETANOL: "saldoInicialEtanol",
      }[String(tipo).toUpperCase()] || "saldoInicial"
    );
  }
  static async listado(tipo, params = {}) {
    const query = new URLSearchParams(buildListQuery(params));
    const response = await fetch(`${config.apiUrl}/${this.endpoint(tipo)}/Listar?${query}`, {
      credentials: "include",
    });
    if (!response.ok)
      throw new Error(
        await readApiErrorMessage(response, "No fue posible obtener el saldo inicial.")
      );
    return normalizePagedResult(await response.json());
  }
  static async opciones(recurso) {
    const response = await fetch(`${config.apiUrl}/saldoInicial/${recurso}`, {
      credentials: "include",
    });
    if (!response.ok)
      throw new Error(await readApiErrorMessage(response, "No fue posible obtener las opciones."));
    return response.json();
  }
  static async productos(tipo) {
    const endpointByType = {
      COMBUSTIBLE: "/entradasproducto/ListarProductoOpcion",
      ADITIVO: "/aditivo/ListarProductoOpcion",
      COLORANTE: "/colorante/ListarProductoOpcion",
      ETANOL: "/saldoInicialEtanol/Productos",
    };
    const response = await fetch(`${config.apiUrl}${endpointByType[String(tipo).toUpperCase()]}`, {
      credentials: "include",
    });
    if (!response.ok)
      throw new Error(await readApiErrorMessage(response, "No fue posible obtener los productos."));
    return response.json();
  }
  static async suplidores() {
    const response = await fetch(`${config.apiUrl}/socio/ListarOpcion?tiposocio=SUPLIDOR`, {
      credentials: "include",
    });
    if (!response.ok)
      throw new Error(
        await readApiErrorMessage(response, "No fue posible obtener los suplidores.")
      );
    return response.json();
  }
  static async siguienteCorrelativo(tipo) {
    const response = await fetch(`${config.apiUrl}/${this.endpoint(tipo)}/SiguienteCorrelativo`, {
      credentials: "include",
    });
    if (!response.ok)
      throw new Error(
        await readApiErrorMessage(response, "No fue posible obtener el correlativo.")
      );
    const data = await response.json();
    return data?.correlativo ?? 0;
  }
  static agregar(data) {
    return fetch(`${config.apiUrl}/${this.endpoint(data.tipo)}/Agregar`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then((response) => handleApiResponse(response, "No fue posible agregar el saldo inicial."));
  }
  static async obtener(idSaldoInicial, tipo) {
    const params = new URLSearchParams({ idSaldoInicial });
    const response = await fetch(`${config.apiUrl}/${this.endpoint(tipo)}/Obtener?${params}`, {
      credentials: "include",
    });
    if (!response.ok)
      throw new Error(
        await readApiErrorMessage(response, "No fue posible obtener el saldo inicial.")
      );
    return response.json();
  }
  static editar(data) {
    return fetch(`${config.apiUrl}/${this.endpoint(data.tipo)}/Editar`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then((response) => handleApiResponse(response, "No fue posible editar el saldo inicial."));
  }
}
