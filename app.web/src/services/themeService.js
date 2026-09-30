import { config } from "../config/config";
import { getDefaultThemeId, getAppThemeById } from "../config/appThemes";
import { readApiErrorMessage as readErrorMessage } from "./apiResponse";

export class ThemeService {
  static normalizeThemeId(theme) {
    if (!theme) return getDefaultThemeId();

    return getAppThemeById(String(theme).trim().toLowerCase()).id;
  }

  static async getCurrentTheme() {
    const response = await fetch(`${config.apiUrl}/home/ObtenerTheme`, {
      method: "GET",
      credentials: "include",
    });

    if (response.status === 401) {
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    }

    if (!response.ok) {
      throw new Error(await readErrorMessage(response, "No fue posible obtener el tema actual."));
    }

    const contentType = response.headers.get("content-type") ?? "";
    const payload = contentType.includes("application/json")
      ? await response.json()
      : await response.text();

    if (typeof payload === "string") {
      return this.normalizeThemeId(payload);
    }

    return this.normalizeThemeId(
      payload?.theme ?? payload?.Theme ?? payload?.tema ?? payload?.value
    );
  }

  static async changeTheme(themeId) {
    const normalizedThemeId = this.normalizeThemeId(themeId);
    const response = await fetch(
      `${config.apiUrl}/home/CambiarTheme?codtheme=${encodeURIComponent(normalizedThemeId)}`,
      {
        method: "POST",
        credentials: "include",
      }
    );

    if (response.status === 401) {
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    }

    if (!response.ok) {
      throw new Error(await readErrorMessage(response, "No fue posible cambiar el tema."));
    }

    return this.getCurrentTheme();
  }
}
