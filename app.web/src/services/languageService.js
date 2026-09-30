import { config } from "../config/config";
import { LANGUAGES } from "../config/languages";
import { readApiErrorMessage as readErrorMessage } from "./apiResponse";

const BACKEND_LANGUAGE_CODES = {
  "es-GT": "es-GT",
  "en-US": "en-US",
};

const FALLBACK_LANGUAGE = LANGUAGES[0];

export class LanguageService {
  static getOptions() {
    return LANGUAGES;
  }

  static normalizeUiCode(code) {
    if (!code) return FALLBACK_LANGUAGE.code;

    const normalized = String(code).trim().toLowerCase();
    const option = LANGUAGES.find(
      (item) =>
        item.code.toLowerCase() === normalized ||
        (BACKEND_LANGUAGE_CODES[item.code] ?? item.code).toLowerCase() === normalized
    );

    return option?.code ?? FALLBACK_LANGUAGE.code;
  }

  static toBackendCode(uiCode) {
    return BACKEND_LANGUAGE_CODES[uiCode] ?? BACKEND_LANGUAGE_CODES[FALLBACK_LANGUAGE.code];
  }

  static async changeLanguage(uiCode) {
    const backendCode = this.toBackendCode(uiCode);
    const response = await fetch(
      `${config.apiUrl}/home/CambiarIdioma?codidioma=${encodeURIComponent(backendCode)}`,
      {
        method: "POST",
        credentials: "include",
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error(await readErrorMessage(response, "Sesion expirada"));
      }

      throw new Error(await readErrorMessage(response, "No fue posible cambiar el idioma."));
    }

    return this.getCurrentLanguage();
  }

  static async getCurrentLanguage() {
    const response = await fetch(`${config.apiUrl}/home/ObtenerIdioma`, {
      method: "GET",
      credentials: "include",
    });

    if (response.status === 401) {
      throw new Error(await readErrorMessage(response, "Sesion expirada"));
    }

    if (!response.ok) {
      throw new Error(await readErrorMessage(response, "No fue posible obtener el idioma actual."));
    }

    const contentType = response.headers.get("content-type") ?? "";
    const payload = contentType.includes("application/json")
      ? await response.json()
      : await response.text();

    if (typeof payload === "string") {
      return this.normalizeUiCode(payload);
    }

    return this.normalizeUiCode(
      payload?.codIdioma ??
        payload?.codigoIdioma ??
        payload?.idioma ??
        payload?.language ??
        payload?.value
    );
  }
}
