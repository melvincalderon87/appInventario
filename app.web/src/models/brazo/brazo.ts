export interface BrazoDTO {
  idBrazo: string;
  codBrazo: string;
  codBahia: string;
  idBahia?: string;
  bahia?: string;
  codProducto: number;
  idProducto?: string;
  producto?: string;
  brazo: string;
  comentario: string;
  estatus: boolean;
  adjuntoCantidad?: number;
  adjuntos?: BrazoAdjuntoDTO[];
}

export interface BrazoLogDTO extends BrazoDTO {
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

export interface BrazoAdjuntoDTO {
  codBrazoAdjunto: number;
  codBrazo: string;
  nombreArchivo: string;
  tipoContenido: string;
  tamanoBytes: number;
  rutaArchivo?: string;
  contenidoBase64?: string;
  estatus: boolean;
}
