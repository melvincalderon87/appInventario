import { config } from "../config/config";
import { buildListQuery, normalizePagedResult } from "../utils/pagination";
import { handleApiResponse, readApiErrorMessage as readErrorMessage } from "./apiResponse";

export class MenuRutaService {
  static async listado(params = {}) {
    const query = buildListQuery(params);
    const response = await fetch(`${config.apiUrl}/menuruta/Listar?${query}`, {
      method: "GET",
      credentials: "include",
    });

    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok) {
      throw new Error(
        await readErrorMessage(response, "No fue posible obtener el listado de rutas de menu.")
      );
    }

    return normalizePagedResult(await response.json());
  }

  static async obtener(ruta) {
    const response = await fetch(
      `${config.apiUrl}/menuruta/Obtener?ruta=${encodeURIComponent(ruta)}`,
      {
        method: "GET",
        credentials: "include",
      }
    );

    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok) {
      throw new Error(await readErrorMessage(response, "No fue posible obtener la ruta de menu."));
    }

    return response.json();
  }

  static async agregar(menuRuta) {
    return MenuRutaService.postJson("Agregar", menuRuta, "No fue posible agregar la ruta de menu.");
  }

  static async editar(menuRuta) {
    return MenuRutaService.postJson("Editar", menuRuta, "No fue posible editar la ruta de menu.");
  }

  static async eliminar(menuRuta) {
    return MenuRutaService.postJson(
      "Eliminar",
      menuRuta,
      "No fue posible eliminar la ruta de menu."
    );
  }

  static async log(ruta) {
    const response = await fetch(`${config.apiUrl}/menuruta/Log?ruta=${encodeURIComponent(ruta)}`, {
      method: "GET",
      credentials: "include",
    });

    if (response.status === 401)
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    if (!response.ok) {
      throw new Error(
        await readErrorMessage(response, "No fue posible obtener el log de la ruta de menu.")
      );
    }

    return response.json();
  }

  static async postJson(action, body, fallbackMessage) {
    const response = await fetch(`${config.apiUrl}/menuruta/${action}`, {
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
