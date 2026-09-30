export interface PersonalExternoDTO {
  idPersonalExterno: string;
  codPersonalExterno: number;
  idCompaniaInspeccion: string;
  codCompaniaInspeccion: number;
  companiaInspeccion: string;
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
  adjuntoCantidad?: number;
  adjuntos?: PersonalExternoAdjuntoDTO[];
}

export interface PersonalExternoAdjuntoDTO {
  codPersonalExternoAdjunto?: number;
  codPersonalExterno?: number;
  nombreArchivo: string;
  tipoContenido: string;
  tamanoBytes: number;
  rutaArchivo?: string;
  contenidoBase64?: string;
  estatus?: boolean;
}

export interface PersonalExternoLogDTO extends PersonalExternoDTO {
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
