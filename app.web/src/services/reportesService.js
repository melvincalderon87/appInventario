import { config } from "../config/config";
import { readApiErrorMessage } from "./apiResponse";

export class ReportesService {
  static async ingresosBarco(tipo, fechaInicial, fechaFinal) {
    const query = new URLSearchParams({ tipo, fechaInicial, fechaFinal });
    const response = await fetch(`${config.apiUrl}/reportes/ingresos-barco?${query}`, { credentials: "include" });
    if (response.status === 204) return [];
    if (!response.ok) throw new Error(await readApiErrorMessage(response, "No fue posible obtener el reporte."));
    const data = await response.json(); return Array.isArray(data) ? data : [];
  }
  static async carga(tipo, fechaInicial, fechaFinal) {
    const query = new URLSearchParams({ fechaInicial, fechaFinal });
    const response = await fetch(`${config.apiUrl}/reportes/carga-${tipo}?${query}`, {
      credentials: "include",
    });
    if (response.status === 204) return [];
    if (!response.ok)
      throw new Error(await readApiErrorMessage(response, "No fue posible obtener el reporte."));
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  }
}
