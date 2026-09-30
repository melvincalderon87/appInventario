export interface TipoProductoDTO {
  idTipoProducto: string;
  codTipoProducto: string;
  descripcion: string;
  descripcionCorta: string;
  estatus?: boolean;
}

export interface TipoProductoLogDTO extends TipoProductoDTO {
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
