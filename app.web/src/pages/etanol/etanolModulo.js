const MODULOS = {
  entradas: ["entrada", "Entrada de Etanol"],
  salidas: ["salida", "Salida de Etanol"],
  compraventasuplidores: ["compraventa", "Compra Venta Suplidores de Etanol"],
  ingresotuberias: ["tuberias", "Ingreso por Tuberías de Etanol"],
  "unidad-entrada": ["unidad-entrada", "Entrada por Unidad de Etanol"],
  "unidad-salida": ["unidad-salida", "Salida por Unidad de Etanol"],
  "ajuste-entrada": ["ajuste-entrada", "Ajuste de Entrada de Etanol"],
  "ajuste-salida": ["ajuste-salida", "Ajuste de Salida de Etanol"],
};

export function etanolModuloDesdeRuta(pathname) {
  const segmento = pathname.split("/")[2] || "entradas";
  const [tipo, titulo] = MODULOS[segmento] || MODULOS.entradas;
  return { segmento, tipo, titulo };
}
