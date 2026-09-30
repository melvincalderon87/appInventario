export interface SocioDTO {
  idSocio: string;
  codSocio: string;
  socio: string;
  nombreCortoSocio: string;
  estatus: boolean;
}

export interface SocioLogDTO extends SocioDTO {
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
