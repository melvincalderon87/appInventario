export interface PersonalDTO {
  idPersonal: string;
  codPersonal: number;
  codTecnico: string;
  nombre: string;
  puesto: string;
  esTecnico: boolean;
  fotoNombreArchivo?: string;
  fotoTipoContenido?: string;
  fotoTamanoBytes?: number;
  fotoRutaArchivo?: string;
  fotoContenidoBase64?: string;
  fotoEliminar?: boolean;
  estatus: boolean;
}

export interface PersonalLogDTO extends PersonalDTO {
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
