export interface ColoranteDTO {
  idColorante: string;
  codDocumento: number;
  codProducto: string;
  idProducto?: string;
  producto?: string;
  tipoProducto?: string;
  descripcionCorta?: string;
  fecha?: string;
  tipoMovimiento: string;
  codBarco?: number;
  idBarco?: string;
  barco?: string;
  codSuplidor?: number;
  idSuplidor?: string;
  suplidor?: string;
  cantidad: number;
  comentarios?: string;
  estatus?: boolean;
}

export interface ColoranteLogDTO extends ColoranteDTO {
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
