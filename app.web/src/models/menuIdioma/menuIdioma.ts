export interface MenuIdiomaDTO {
  idMenuIdioma: string;
  codMenu: number;
  idioma: string;
  descripcion: string;
  estatus?: boolean;
}

export interface MenuIdiomaLogDTO extends MenuIdiomaDTO {
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
