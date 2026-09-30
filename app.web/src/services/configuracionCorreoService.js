import { config } from "../config/config";
import { buildListQuery, normalizePagedResult } from "../utils/pagination";
import { handleApiResponse, readApiErrorMessage as readErrorMessage } from "./apiResponse";

/** @typedef {import('../models/configuracionCorreo/configuracionCorreo').ConfiguracionCorreoDTO} ConfiguracionCorreoDTO */
/** @typedef {import('../models/configuracionCorreo/configuracionCorreo').ConfiguracionCorreoLogDTO} ConfiguracionCorreoLogDTO */

export class ConfiguracionCorreoService {
  static async ListarOpcion() {
    const response = await fetch(`${config.apiUrl}/configuracioncorreo/ListarOpcion`, {
      method: "GET",
      credentials: "include",
    });

    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok) {
      throw new Error(
        await readErrorMessage(
          response,
          "No fue posible obtener las opciones de configuraciones de correo."
        )
      );
    }

    const options = await response.json();
    return options;
  }

  static async listado(params = {}) {
    const query = buildListQuery(params);
    const response = await fetch(`${config.apiUrl}/configuracioncorreo/Listar?${query}`, {
      method: "GET",
      credentials: "include",
    });

    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok) {
      throw new Error(
        await readErrorMessage(
          response,
          "No fue posible obtener el listado de configuraciones de correo."
        )
      );
    }

    return normalizePagedResult(await response.json());
  }

  static async obtener(idConfiguracionCorreo) {
    const response = await fetch(
      `${config.apiUrl}/configuracioncorreo/Obtener?idconfiguracioncorreo=${encodeURIComponent(
        idConfiguracionCorreo
      )}`,
      {
        method: "GET",
        credentials: "include",
      }
    );

    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok) {
      throw new Error(
        await readErrorMessage(response, "No fue posible obtener la configuracion de correo.")
      );
    }

    /** @type {ConfiguracionCorreoDTO} */
    const configuracionCorreo = await response.json();
    return configuracionCorreo;
  }

  static async agregar(configuracionCorreo) {
    return ConfiguracionCorreoService.postJson(
      "Agregar",
      configuracionCorreo,
      "No fue posible agregar la configuracion de correo."
    );
  }

  static async editar(configuracionCorreo) {
    return ConfiguracionCorreoService.postJson(
      "Editar",
      configuracionCorreo,
      "No fue posible editar la configuracion de correo."
    );
  }

  static async eliminar(configuracionCorreo) {
    return ConfiguracionCorreoService.postJson(
      "Eliminar",
      configuracionCorreo,
      "No fue posible eliminar la configuracion de correo."
    );
  }

  static async log(idConfiguracionCorreo) {
    const response = await fetch(
      `${config.apiUrl}/configuracioncorreo/Log?idconfiguracioncorreo=${encodeURIComponent(
        idConfiguracionCorreo
      )}`,
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
          "No fue posible obtener el log de la configuracion de correo."
        )
      );
    }

    /** @type {ConfiguracionCorreoLogDTO[]} */
    const log = await response.json();
    return log;
  }

  static async postJson(action, body, fallbackMessage) {
    const response = await fetch(`${config.apiUrl}/configuracioncorreo/${action}`, {
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
