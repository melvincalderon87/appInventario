export interface AditivoDTO {
  idAditivo: string;
  codDocumento: number;
  codSuplidor: number;
  idSuplidor?: string;
  suplidor?: string;
  codProducto: number;
  idProducto?: string;
  producto?: string;
  codTanque: string;
  idTanque?: string;
  tanque?: string;
  fecha?: string;
  tipoMovimiento: string;
  cantidad: number;
  comentario?: string;
  estatus?: boolean;
}

export interface AditivoLogDTO extends AditivoDTO {
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
