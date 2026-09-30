export interface CompraVentaSuplidoresDTO {
  codCompraVentaSuplidores?: number;
  fecha: string;
  codSuplidorOrigen: number;
  codSuplidorDestino: number;
  codProducto: number;
  cantidadEstandar: number;
  cantidadAmbiente: number;
  idCompraVentaSuplidores?: string;
  idSuplidorOrigen?: string;
  suplidorOrigen?: string;
  idSuplidorDestino?: string;
  suplidorDestino?: string;
  idProducto?: string;
  producto?: string;
  estatus?: boolean;
  version?: number;
  codUsuarioCreacion?: string;
  idUsuarioCreacion?: string;
  fechaCreacion?: string;
  codUsuarioActualizacion?: string;
  idUsuarioActualizacion?: string;
  fechaActualizacion?: string;
  codUsuarioEliminacion?: string;
  idUsuarioEliminacion?: string;
  fechaEliminacion?: string;
  accionLog?: string;
}
