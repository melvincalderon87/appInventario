export interface UsuarioPreferenciaDTO {
  idUsuario: string;
  codUsuario: string;
  idioma: string;
  theme: string;
  version?: number | null;
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

export interface UsuarioPreferenciaLogDTO extends UsuarioPreferenciaDTO {}
