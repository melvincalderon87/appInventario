import { config } from "../config/config";
import { handleApiResponse, readApiErrorMessage } from "./apiResponse";

export class UsuarioSuplidorService {
  static async listar(idUsuario) {
    const response = await fetch(
      `${config.apiUrl}/usuariosuplidor/Listar?idusuario=${encodeURIComponent(idUsuario)}`,
      { method: "GET", credentials: "include" }
    );
    if (!response.ok) {
      throw new Error(
        await readApiErrorMessage(response, "No fue posible obtener los suplidores del usuario.")
      );
    }
    return response.json();
  }

  static async guardar(idUsuario, codSuplidores) {
    const response = await fetch(`${config.apiUrl}/usuariosuplidor/Guardar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ idUsuario, codSuplidores }),
    });
    return handleApiResponse(response, "No fue posible guardar los accesos a suplidores.");
  }
}
