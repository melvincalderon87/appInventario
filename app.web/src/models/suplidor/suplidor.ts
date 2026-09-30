export interface SuplidorDTO {
  idSuplidor: string;
  codSuplidor: string;
  codSocio: string;
  idSocio?: string;
  socio?: string;
  suplidor: string;
  suplidorNombreCorto: string;
  estatus: boolean;
}

export interface SuplidorLogDTO extends SuplidorDTO {
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
