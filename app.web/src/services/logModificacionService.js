import { config } from "../config/config";
import { readApiErrorMessage as readErrorMessage } from "./apiResponse";
import {
  appendParam,
  normalizePage,
  normalizePageSize,
  normalizePagedResult,
} from "../utils/pagination";

export class LogModificacionService {
  static async listado(filters = {}) {
    const searchParams = new URLSearchParams();

    appendParam(searchParams, "tabla", filters.tabla);
    appendParam(searchParams, "accion", filters.accion);
    appendParam(searchParams, "codusuario", filters.codUsuario);
    appendParam(searchParams, "fechainicio", filters.fechaInicio);
    appendParam(searchParams, "fechafin", filters.fechaFin);
    appendParam(searchParams, "search", filters.search ?? filters.texto);
    appendParam(searchParams, "sort", filters.sort);
    searchParams.set("page", String(normalizePage(filters.page)));
    searchParams.set("pageSize", String(normalizePageSize(filters.pageSize)));

    const query = searchParams.toString();
    const response = await fetch(
      `${config.apiUrl}/logmodificacion/Listar${query ? `?${query}` : ""}`,
      {
        method: "GET",
        credentials: "include",
      }
    );

    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok) {
      throw new Error(
        await readErrorMessage(response, "No fue posible obtener el log de modificaciones.")
      );
    }

    return normalizePagedResult(await response.json());
  }

  static async listarModulos() {
    const response = await fetch(`${config.apiUrl}/logmodificacion/ListarModulos`, {
      method: "GET",
      credentials: "include",
    });

    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok) {
      throw new Error(
        await readErrorMessage(response, "No fue posible obtener los modulos del log.")
      );
    }

    return response.json();
  }
}
