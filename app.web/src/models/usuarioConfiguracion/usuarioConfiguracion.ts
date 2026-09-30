export interface UsuarioConfiguracionDTO {
  idUsuario: string;
  codUsuario: string;
  codTipoUsuario: number;
  codRol: number;
  version?: number | null;
  tipoUsuario?: string;
  rol?: string;
  codUsuarioCreacion?: string | null;
  idUsuarioCreacion?: string | null;
  fechaCreacion?: string | null;
  codUsuarioActualizacion?: string | null;
  idUsuarioActualizacion?: string | null;
  fechaActualizacion?: string | null;
  estatus?: boolean;
  codUsuarioEliminacion?: string | null;
  idUsuarioEliminacion?: string | null;
  fechaEliminacion?: string | null;
  accionLog?: string | null;
}

export interface UsuarioConfiguracionLogDTO extends UsuarioConfiguracionDTO {}
