export interface TanqueDTO {
  idTanque: string;
  codTanque: string;
  codProducto: number;
  idProducto?: string;
  producto?: string;
  tipoTanque: string;
  tanque: string;
  descripcionCorta: string;
  mencod: string;
  alturaMaximaPies: number;
  alturaMaximaPulgadas: number;
  tipoPosiconTecho: string;
  alturaMinimaPies: number;
  alturaMinimaPulgadas: number;
  volumenMaximo: number;
  volumenMinimo: number;
  volumenTechoPosicionAlta: number;
  volumenTechoPosicionBaja: number;
  proveedor: string;
  consumoPropio: boolean;
  comentario: string;
  estatus: boolean;
  adjuntoCantidad?: number;
  adjuntos?: TanqueAdjuntoDTO[];
}

export interface TanqueLogDTO extends TanqueDTO {
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

export interface TanqueAdjuntoDTO {
  codTanqueAdjunto?: number;
  codTanque?: string;
  nombreArchivo: string;
  tipoContenido: string;
  tamanoBytes: number;
  rutaArchivo?: string;
  contenidoBase64?: string;
  estatus?: boolean;
}
