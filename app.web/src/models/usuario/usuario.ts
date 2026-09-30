export interface UsuarioDTO {
  idUsuario: string;
  codUsuario: string;
  nombre: string;
  correo: string;
  estatus: boolean;
  password?: string;
}

export interface UsuarioLogDTO extends UsuarioDTO {
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
