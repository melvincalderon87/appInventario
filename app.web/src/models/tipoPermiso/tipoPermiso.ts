export interface TipoPermisoDTO {
  idTipoPermiso: string;
  codTipoPermiso: number;
  descripcion: string;
  estatus?: boolean;
}

export interface TipoPermisoLogDTO extends TipoPermisoDTO {
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
