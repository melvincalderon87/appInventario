export interface CompaniaInspeccionDTO {
  idCompaniaInspeccion: string;
  codCompaniaInspeccion: number;
  nombreComercial: string;
  nombreFiscal: string;
  nit: string;
  estatus: boolean;
  adjuntoCantidad?: number;
  adjuntos?: CompaniaInspeccionAdjuntoDTO[];
}

export interface CompaniaInspeccionAdjuntoDTO {
  codCompaniaInspeccionAdjunto?: number;
  codCompaniaInspeccion?: number;
  nombreArchivo: string;
  tipoContenido: string;
  tamanoBytes: number;
  rutaArchivo?: string;
  contenidoBase64?: string;
  estatus?: boolean;
}

export interface CompaniaInspeccionLogDTO extends CompaniaInspeccionDTO {
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
