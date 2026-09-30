export interface TuberiaDTO {
  idTuberia: string;
  codTuberia: string;
  codTanque?: string;
  idTanque?: string;
  tanque?: string;
  codTipoProducto: string;
  idTipoProducto?: string;
  tipoProducto?: string;
  codProducto: string;
  idProducto?: string;
  producto?: string;
  ubicacion: string;
  tramoLinea: string;
  diametroInicio: number;
  diametroFinal: number;
  volumen: number;
  fechaCertificacion?: string;
  codCompaniaInspeccion: number;
  idCompaniaInspeccion?: string;
  companiaInspeccion?: string;
  tipoMovimiento: string;
  comentario: string;
  estatus: boolean;
  adjuntoCantidad?: number;
  adjuntos?: TuberiaAdjuntoDTO[];
}

export interface TuberiaAdjuntoDTO {
  codTuberiaAdjunto: number;
  codTuberia: string;
  nombreArchivo: string;
  tipoContenido: string;
  tamanoBytes: number;
  rutaArchivo: string;
  contenidoBase64?: string;
  estatus: boolean;
}

export interface TuberiaResumenProductoDTO {
  codProducto: string;
  idProducto?: string;
  producto: string;
  cantidadTuberias: number;
  volumenTotal: number;
}

export interface TuberiaLogDTO extends TuberiaDTO {
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
