import { config } from "../config/config";
import { readApiErrorMessage as readErrorMessage } from "./apiResponse";
import {
  appendParam,
  normalizePage,
  normalizePageSize,
  normalizePagedResult,
} from "../utils/pagination";

export class AuditoriaService {
  static async listado(filters = {}) {
    const searchParams = new URLSearchParams();

    appendParam(searchParams, "controlador", filters.controlador);
    appendParam(searchParams, "accion", filters.accion);
    appendParam(searchParams, "codusuario", filters.codUsuario);
    appendParam(searchParams, "metodo", filters.metodo);
    appendParam(searchParams, "fechainicio", filters.fechaInicio);
    appendParam(searchParams, "fechafin", filters.fechaFin);
    appendParam(searchParams, "search", filters.search ?? filters.texto);
    appendParam(searchParams, "sort", filters.sort);
    searchParams.set("page", String(normalizePage(filters.page)));
    searchParams.set("pageSize", String(normalizePageSize(filters.pageSize)));

    const query = searchParams.toString();
    const response = await fetch(`${config.apiUrl}/auditoria/Listar${query ? `?${query}` : ""}`, {
      method: "GET",
      credentials: "include",
    });

    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok) {
      throw new Error(await readErrorMessage(response, "No fue posible obtener la auditoria."));
    }

    return normalizePagedResult(await response.json());
  }

  static async listarControladores() {
    const response = await fetch(`${config.apiUrl}/auditoria/ListarControladores`, {
      method: "GET",
      credentials: "include",
    });

    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok) {
      throw new Error(
        await readErrorMessage(response, "No fue posible obtener los controladores de auditoria.")
      );
    }

    return response.json();
  }

  static async obtener(idAuditoria) {
    const searchParams = new URLSearchParams();
    appendParam(searchParams, "idauditoria", idAuditoria);

    const response = await fetch(`${config.apiUrl}/auditoria/Obtener?${searchParams.toString()}`, {
      method: "GET",
      credentials: "include",
    });

    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok) {
      throw new Error(
        await readErrorMessage(response, "No fue posible obtener el registro de auditoria.")
      );
    }

    return response.json();
  }
}
