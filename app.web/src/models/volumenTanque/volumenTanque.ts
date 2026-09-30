export interface VolumenTanqueDTO {
  idVolumenTanque: string;
  codDocumento: number;
  fecha?: string;
  codTanque: string;
  idTanque?: string;
  tanque?: string;
  pies: number;
  pulgadas: number;
  dieciseisavos: number;
  volumen: number;
  estatus?: boolean;
}

export interface VolumenTanqueLogDTO extends VolumenTanqueDTO {
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
