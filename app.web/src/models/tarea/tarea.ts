export interface TareaDTO {
  idTarea: string;
  codTarea: number;
  descripcion: string;
  tiempo: string;
  estatus: boolean;
  notificacionCantidad: number;
  notificaciones?: import("../notificacion/notificacion").NotificacionDTO[];
}

export interface TareaLogDTO extends TareaDTO {
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
