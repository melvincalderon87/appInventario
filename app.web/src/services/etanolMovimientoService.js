import { config } from "../config/config";
import { buildListQuery, normalizePagedResult } from "../utils/pagination";
import { readApiErrorMessage } from "./apiResponse";

const endpoint = (action, tipo, query = "") =>
  `${config.apiUrl}/etanolmovimiento/${action}?tipo=${encodeURIComponent(tipo)}${query ? `&${query}` : ""}`;

export class EtanolMovimientoService {
  static async listado(tipo, params = {}) {
    const response = await fetch(endpoint("Listar", tipo, buildListQuery(params)), {
      credentials: "include",
    });
    if (!response.ok)
      throw new Error(
        await readApiErrorMessage(response, "No fue posible obtener los movimientos de etanol.")
      );
    return normalizePagedResult(await response.json());
  }

  static async obtenerKey(tipo) {
    const response = await fetch(endpoint("ObtenerKey", tipo), { credentials: "include" });
    if (!response.ok)
      throw new Error(
        await readApiErrorMessage(response, "No fue posible obtener el correlativo.")
      );
    return response.json();
  }

  static async obtener(tipo, codigo) {
    const response = await fetch(
      endpoint("Obtener", tipo, `codigo=${encodeURIComponent(codigo)}`),
      { credentials: "include" }
    );
    if (!response.ok)
      throw new Error(
        await readApiErrorMessage(response, "No fue posible obtener el movimiento de etanol.")
      );
    return response.json();
  }

  static async agregar(tipo, movimiento) {
    const response = await fetch(endpoint("Agregar", tipo), {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(movimiento),
    });
    if (!response.ok)
      throw new Error(
        await readApiErrorMessage(response, "No fue posible guardar el movimiento de etanol.")
      );
    return response.json();
  }

  static async editar(tipo, movimiento) {
    const response = await fetch(endpoint("Editar", tipo), {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(movimiento),
    });
    if (!response.ok)
      throw new Error(
        await readApiErrorMessage(
          response,
          "No fue posible enviar la edición del movimiento de etanol."
        )
      );
    return response.json();
  }
}
