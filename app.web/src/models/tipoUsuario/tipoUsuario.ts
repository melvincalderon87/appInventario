export interface TipoUsuarioDTO {
  idTipoUsuario: string;
  codTipoUsuario: number;
  descripcion: string;
  estatus?: boolean;
}

export interface TipoUsuarioLogDTO extends TipoUsuarioDTO {
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
