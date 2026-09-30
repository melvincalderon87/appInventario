export interface NotificacionDTO {
  idNotificacion?: string;
  codNotificacion: number;
  codTarea?: number | null;
  linea?: number;
  idTarea?: string;
  tareaDescripcion?: string;
  descripcion: string;
  asunto: string;
  para: string;
  copia: string;
  texto: string;
  fechaProgramada?: string | null;
  estado: number;
  estadoDescripcion: string;
  intentos: number;
  error: string;
  fechaEnviado?: string | null;
  fechaCreacion?: string | null;
  estatus: boolean;
  adjuntoCantidad?: number;
  adjuntos?: NotificacionAdjuntoDTO[];
  version?: number;
  codUsuarioCreacion?: string;
  idUsuarioCreacion?: string;
  codUsuarioActualizacion?: string;
  idUsuarioActualizacion?: string;
  fechaActualizacion?: string;
  codUsuarioEliminacion?: string;
  idUsuarioEliminacion?: string;
  fechaEliminacion?: string;
  accionLog?: string;
}

export interface NotificacionAdjuntoDTO {
  codNotificacionAdjunto?: number;
  codNotificacion?: number;
  nombreArchivo: string;
  tipoContenido: string;
  tamanoBytes: number;
  contenidoBase64: string;
  estatus?: boolean;
}
