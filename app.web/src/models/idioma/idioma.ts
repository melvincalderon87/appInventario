export interface IdiomaDTO {
  idIdioma: string;
  idioma: string;
  descripcion: string;
  estatus?: boolean;
}

export interface IdiomaLogDTO extends IdiomaDTO {
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
