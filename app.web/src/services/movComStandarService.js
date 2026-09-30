import { config } from "../config/config";
import { readApiErrorMessage } from "./apiResponse";

export class MovComStandarService {
  static async consumosBiAditivos(fechaInicial, fechaFinal) {
    const query = new URLSearchParams({ fechaInicial, fechaFinal });
    const response = await fetch(`${config.apiUrl}/movcomstandar/ConsumosBiAditivos?${query}`, {
      credentials: "include",
    });
    if (!response.ok)
      throw new Error(
        await readApiErrorMessage(response, "No fue posible obtener los consumos BI de aditivos.")
      );
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  }

  static async consumosBiDiariosAditivos(fechaInicial, fechaFinal) {
    const query = new URLSearchParams({ fechaInicial, fechaFinal });
    const response = await fetch(
      `${config.apiUrl}/movcomstandar/ConsumosBiDiariosAditivos?${query}`,
      { credentials: "include" }
    );
    if (!response.ok)
      throw new Error(
        await readApiErrorMessage(
          response,
          "No fue posible obtener el detalle diario de consumos BI de aditivos."
        )
      );
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  }

  static async consumosBiDiariosAditivosAmbiente(fechaInicial, fechaFinal) {
    const query = new URLSearchParams({ fechaInicial, fechaFinal });
    const response = await fetch(
      `${config.apiUrl}/movcomstandar/ConsumosBiDiariosAditivosAmbiente?${query}`,
      { credentials: "include" }
    );
    if (!response.ok)
      throw new Error(
        await readApiErrorMessage(
          response,
          "No fue posible obtener el detalle diario ambiente de aditivos."
        )
      );
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  }

  static async consumosBiDiariosEtanol(fechaInicial, fechaFinal) {
    const query = new URLSearchParams({ fechaInicial, fechaFinal });
    const response = await fetch(
      `${config.apiUrl}/movcomstandar/ConsumosBiDiariosEtanol?${query}`,
      { credentials: "include" }
    );
    if (!response.ok)
      throw new Error(
        await readApiErrorMessage(
          response,
          "No fue posible obtener el detalle diario de consumo BI de etanol."
        )
      );
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  }

  static async consumosBiDiariosEtanolAmbiente(fechaInicial, fechaFinal) {
    const query = new URLSearchParams({ fechaInicial, fechaFinal });
    const response = await fetch(
      `${config.apiUrl}/movcomstandar/ConsumosBiDiariosEtanolAmbiente?${query}`,
      { credentials: "include" }
    );
    if (!response.ok)
      throw new Error(
        await readApiErrorMessage(
          response,
          "No fue posible obtener el detalle diario ambiente de etanol."
        )
      );
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  }

  static async consumosBiDiariosCombustibles(fechaInicial, fechaFinal) {
    const query = new URLSearchParams({ fechaInicial, fechaFinal });
    const response = await fetch(
      `${config.apiUrl}/movcomstandar/ConsumosBiDiariosCombustibles?${query}`,
      { credentials: "include" }
    );
    if (!response.ok)
      throw new Error(
        await readApiErrorMessage(
          response,
          "No fue posible obtener el detalle diario de combustibles BI."
        )
      );
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  }

  static async consumosBiDiariosCombustiblesAmbiente(fechaInicial, fechaFinal) {
    const query = new URLSearchParams({ fechaInicial, fechaFinal });
    const response = await fetch(
      `${config.apiUrl}/movcomstandar/ConsumosBiDiariosCombustiblesAmbiente?${query}`,
      { credentials: "include" }
    );
    if (!response.ok)
      throw new Error(
        await readApiErrorMessage(
          response,
          "No fue posible obtener el detalle diario ambiente de combustibles."
        )
      );
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  }

  static async aditivos(fechaInicial, fechaFinal) {
    const query = new URLSearchParams({ fechaInicial, fechaFinal });
    const response = await fetch(`${config.apiUrl}/movcomstandar/Aditivos?${query}`, {
      credentials: "include",
    });
    if (!response.ok)
      throw new Error(
        await readApiErrorMessage(response, "No fue posible obtener el reporte de aditivos.")
      );
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  }

  static async tanques(fechaInicial, fechaFinal) {
    const query = new URLSearchParams({ fechaInicial, fechaFinal });
    const response = await fetch(`${config.apiUrl}/movcomstandar/Tanques?${query}`, {
      credentials: "include",
    });
    if (!response.ok)
      throw new Error(
        await readApiErrorMessage(response, "No fue posible obtener los volúmenes de tanques.")
      );
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  }

  static async ingresosBarco(fechaInicial, fechaFinal) {
    const query = new URLSearchParams({ fechaInicial, fechaFinal });
    const response = await fetch(`${config.apiUrl}/movcomstandar/IngresosBarco?${query}`, {
      credentials: "include",
    });
    if (!response.ok)
      throw new Error(
        await readApiErrorMessage(response, "No fue posible obtener los ingresos de barco.")
      );
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  }

  static async ingresosBarcoAmbiente(fechaInicial, fechaFinal) {
    const query = new URLSearchParams({ fechaInicial, fechaFinal });
    const response = await fetch(`${config.apiUrl}/movcomstandar/IngresosBarcoAmbiente?${query}`, {
      credentials: "include",
    });
    if (!response.ok)
      throw new Error(
        await readApiErrorMessage(
          response,
          "No fue posible obtener los ingresos de barco ambiente."
        )
      );
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  }

  static async movimientosUnidad(fechaInicial, fechaFinal) {
    const query = new URLSearchParams({ fechaInicial, fechaFinal });
    const response = await fetch(`${config.apiUrl}/movcomstandar/MovimientosUnidad?${query}`, {
      credentials: "include",
    });
    if (!response.ok)
      throw new Error(
        await readApiErrorMessage(response, "No fue posible obtener los movimientos por unidad.")
      );
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  }

  static async movimientosUnidadAmbiente(fechaInicial, fechaFinal) {
    const query = new URLSearchParams({ fechaInicial, fechaFinal });
    const response = await fetch(
      `${config.apiUrl}/movcomstandar/MovimientosUnidadAmbiente?${query}`,
      { credentials: "include" }
    );
    if (!response.ok)
      throw new Error(
        await readApiErrorMessage(
          response,
          "No fue posible obtener los movimientos por unidad ambiente."
        )
      );
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  }

  static async entradasUnidadEtanol(fechaInicial, fechaFinal, ambiente = false) {
    const query = new URLSearchParams({ fechaInicial, fechaFinal, ambiente });
    const response = await fetch(`${config.apiUrl}/movcomstandar/EntradasUnidadEtanol?${query}`, {
      credentials: "include",
    });
    if (!response.ok)
      throw new Error(await readApiErrorMessage(response, "No fue posible obtener los ingresos de etanol por unidad."));
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  }

  static async compraVentaSuplidores(fechaInicial, fechaFinal) {
    const query = new URLSearchParams({ fechaInicial, fechaFinal });
    const response = await fetch(`${config.apiUrl}/movcomstandar/CompraVentaSuplidores?${query}`, {
      credentials: "include",
    });
    if (!response.ok)
      throw new Error(
        await readApiErrorMessage(
          response,
          "No fue posible obtener las compras y ventas de suplidores."
        )
      );
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  }

  static async compraVentaSuplidoresAmbiente(fechaInicial, fechaFinal) {
    const query = new URLSearchParams({ fechaInicial, fechaFinal });
    const response = await fetch(
      `${config.apiUrl}/movcomstandar/CompraVentaSuplidoresAmbiente?${query}`,
      { credentials: "include" }
    );
    if (!response.ok)
      throw new Error(
        await readApiErrorMessage(response, "No fue posible obtener las compras y ventas ambiente.")
      );
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  }

  static async generar(fechaInicial, fechaFinal) {
    const query = new URLSearchParams({ fechaInicial, fechaFinal });
    const response = await fetch(`${config.apiUrl}/movcomstandar/Generar?${query}`, {
      credentials: "include",
    });
    if (!response.ok)
      throw new Error(await readApiErrorMessage(response, "No fue posible generar MovComStandar."));
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  }

  static async generarAmbiente(fechaInicial, fechaFinal) {
    const query = new URLSearchParams({ fechaInicial, fechaFinal });
    const response = await fetch(`${config.apiUrl}/movcomstandar/GenerarAmbiente?${query}`, {
      credentials: "include",
    });
    if (!response.ok)
      throw new Error(
        await readApiErrorMessage(response, "No fue posible generar MovCom ambiente.")
      );
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  }
}
