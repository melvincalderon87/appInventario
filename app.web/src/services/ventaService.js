import { config } from "../config/config";
import { handleApiResponse, readApiErrorMessage } from "./apiResponse";
import { buildListQuery, normalizePagedResult } from "../utils/pagination";
export class VentaService {
  static async listado(params = {}) {
    const query = buildListQuery(params);
    const r = await fetch(`${config.apiUrl}/venta/Listar?${query}`, { credentials: "include" });
    if (!r.ok) throw new Error(await readApiErrorMessage(r, "No fue posible obtener las ventas."));
    return normalizePagedResult(await r.json());
  }
  static async obtener(idVenta) {
    const r = await fetch(`${config.apiUrl}/venta/Obtener?idventa=${encodeURIComponent(idVenta)}`, {
      credentials: "include",
    });
    if (!r.ok)
      throw new Error(
        await readApiErrorMessage(r, "No fue posible obtener el documento de venta.")
      );
    return r.json();
  }
  static async agregar(venta) {
    const r = await fetch(`${config.apiUrl}/venta/Agregar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(venta),
    });
    return handleApiResponse(r, "No fue posible guardar la venta.");
  }
}
