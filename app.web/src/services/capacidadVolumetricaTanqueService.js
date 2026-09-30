import { config } from "../config/config";
import { buildListQuery, normalizePagedResult } from "../utils/pagination";
import { handleApiResponse, readApiErrorMessage as readErrorMessage } from "./apiResponse";

/** @typedef {import('../models/capacidadVolumetricaTanque/capacidadVolumetricaTanque').CapacidadVolumetricaTanqueDTO} CapacidadVolumetricaTanqueDTO */
/** @typedef {import('../models/capacidadVolumetricaTanque/capacidadVolumetricaTanque').CapacidadVolumetricaTanqueLogDTO} CapacidadVolumetricaTanqueLogDTO */

export class CapacidadVolumetricaTanqueService {
  static async ListarOpcion() {
    const response = await fetch(`${config.apiUrl}/capacidadvolumetricatanque/ListarOpcion`, {
      method: "GET",
      credentials: "include",
    });

    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok) {
      throw new Error(
        await readErrorMessage(
          response,
          "No fue posible obtener las opciones de capacidad volumetrica de tanque."
        )
      );
    }

    return await response.json();
  }

  static async listado(params = {}) {
    const searchParams = new URLSearchParams(buildListQuery(params));

    if (String(params.idTanque ?? "").trim()) {
      searchParams.set("idtanque", String(params.idTanque).trim());
    }

    if (params.soloActuales !== undefined && params.soloActuales !== null) {
      searchParams.set("soloactuales", String(Boolean(params.soloActuales)));
    }

    if (params.soloHistoricas !== undefined && params.soloHistoricas !== null) {
      searchParams.set("solohistoricas", String(Boolean(params.soloHistoricas)));
    }

    const query = searchParams.toString();
    const response = await fetch(`${config.apiUrl}/capacidadvolumetricatanque/Listar?${query}`, {
      method: "GET",
      credentials: "include",
    });

    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok) {
      throw new Error(
        await readErrorMessage(
          response,
          "No fue posible obtener el listado de capacidad volumetrica de tanque."
        )
      );
    }

    return normalizePagedResult(await response.json());
  }

  static async obtener(idCapacidadVolumetricaTanque) {
    const response = await fetch(
      `${config.apiUrl}/capacidadvolumetricatanque/Obtener?idcapacidadvolumetricatanque=${encodeURIComponent(idCapacidadVolumetricaTanque)}`,
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
          "No fue posible obtener la capacidad volumetrica de tanque."
        )
      );
    }

    /** @type {CapacidadVolumetricaTanqueDTO} */
    const capacidadVolumetricaTanque = await response.json();
    return capacidadVolumetricaTanque;
  }

  static async resumen(idCapacidadVolumetricaTanque) {
    const response = await fetch(
      `${config.apiUrl}/capacidadvolumetricatanque/Resumen?idcapacidadvolumetricatanque=${encodeURIComponent(idCapacidadVolumetricaTanque)}`,
      { method: "GET", credentials: "include" }
    );

    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok)
      throw new Error(
        await readErrorMessage(
          response,
          "No fue posible obtener el resumen de la capacidad volumetrica."
        )
      );
    return await response.json();
  }

  static async listadoDetalle(idCapacidadVolumetricaTanque, params = {}) {
    const searchParams = new URLSearchParams(buildListQuery(params));
    searchParams.set("idcapacidadvolumetricatanque", idCapacidadVolumetricaTanque);
    ["pies", "pulgadas", "dieciseisavos"].forEach((field) => {
      if (
        params[field] !== undefined &&
        params[field] !== null &&
        String(params[field]).trim() !== ""
      ) {
        searchParams.set(field.toLowerCase(), String(params[field]));
      }
    });
    const response = await fetch(
      `${config.apiUrl}/capacidadvolumetricatanque/ListadoDetalle?${searchParams.toString()}`,
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
          "No fue posible obtener el detalle de la capacidad volumetrica."
        )
      );
    return normalizePagedResult(await response.json());
  }

  static async archivo(idCapacidadVolumetricaTanque, codCapacidadVolumetricaTanqueAdjunto) {
    const response = await fetch(
      `${config.apiUrl}/capacidadvolumetricatanque/Archivo?idcapacidadvolumetricatanque=${encodeURIComponent(idCapacidadVolumetricaTanque)}&codcapacidadvolumetricatanqueadjunto=${encodeURIComponent(codCapacidadVolumetricaTanqueAdjunto)}`,
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
          "No fue posible obtener el archivo de la capacidad volumetrica de tanque."
        )
      );
    }

    return await response.blob();
  }

  static async agregar(capacidadVolumetricaTanque) {
    return CapacidadVolumetricaTanqueService.postJson(
      "Agregar",
      capacidadVolumetricaTanque,
      "No fue posible agregar la capacidad volumetrica de tanque."
    );
  }

  static async editar(capacidadVolumetricaTanque) {
    return CapacidadVolumetricaTanqueService.postJson(
      "Editar",
      capacidadVolumetricaTanque,
      "No fue posible editar la capacidad volumetrica de tanque."
    );
  }

  static async eliminar(capacidadVolumetricaTanque) {
    return CapacidadVolumetricaTanqueService.postJson(
      "Eliminar",
      capacidadVolumetricaTanque,
      "No fue posible eliminar la capacidad volumetrica de tanque."
    );
  }

  static async reemplazarPlantilla({
    idTanque,
    codProducto,
    codCompaniaInspeccion,
    fechaCalibracion,
    comentarios,
    detalles,
  }) {
    return CapacidadVolumetricaTanqueService.postJson(
      "ReemplazarPlantilla",
      { idTanque, codProducto, codCompaniaInspeccion, fechaCalibracion, comentarios, detalles },
      "No fue posible cargar la plantilla de capacidad volumetrica de tanque."
    );
  }

  static async importarPlantillaDirecta({
    idTanque,
    codCompaniaInspeccion,
    fechaCalibracion,
    comentarios,
    detalles,
  }) {
    return CapacidadVolumetricaTanqueService.postJson(
      "ImportarPlantillaDirecta",
      { idTanque, codCompaniaInspeccion, fechaCalibracion, comentarios, detalles },
      "No fue posible cargar la plantilla de capacidad volumetrica directamente."
    );
  }

  static async log(idCapacidadVolumetricaTanque) {
    const response = await fetch(
      `${config.apiUrl}/capacidadvolumetricatanque/Log?idcapacidadvolumetricatanque=${encodeURIComponent(idCapacidadVolumetricaTanque)}`,
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
          "No fue posible obtener el log de la capacidad volumetrica de tanque."
        )
      );
    }

    /** @type {CapacidadVolumetricaTanqueLogDTO[]} */
    const log = await response.json();
    return log;
  }

  static async postJson(action, body, fallbackMessage) {
    const response = await fetch(`${config.apiUrl}/capacidadvolumetricatanque/${action}`, {
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
