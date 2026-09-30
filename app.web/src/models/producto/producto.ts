export interface ProductoDTO {
  idProducto: string;
  codProducto: string;
  codTipoProducto: string;
  idTipoProducto?: string;
  tipoProducto?: string;
  tipo?: string;
  producto: string;
  descripcionCorta: string;
  estatus: boolean;
}

export interface ProductoLogDTO extends ProductoDTO {
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
