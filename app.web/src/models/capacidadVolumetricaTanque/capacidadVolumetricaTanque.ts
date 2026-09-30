export interface CapacidadVolumetricaTanqueDTO {
  idCapacidadVolumetricaTanque: string;
  codCapacidadVolumetricaTanque: number;
  codTanque: string;
  idTanque?: string;
  tanque?: string;
  codProducto: number;
  idProducto?: string;
  producto?: string;
  codCompaniaInspeccion: number;
  idCompaniaInspeccion?: string;
  companiaInspeccion?: string;
  fechaCalibracion?: string;
  comentarios?: string;
  esActual?: boolean;
  detalleCantidad?: number;
  adjuntoCantidad?: number;
  adjuntos?: CapacidadVolumetricaTanqueAdjuntoDTO[];
  detalles?: CapacidadVolumetricaTanqueDetalleDTO[];
  detallesBase?: CapacidadVolumetricaTanqueDetalle2DTO[];
  detallesFracciones?: CapacidadVolumetricaTanqueDetalle3DTO[];
  estatus?: boolean;
}

export interface CapacidadVolumetricaTanqueDetalleDTO {
  idCapacidadVolumetricaTanqueDetalle?: string;
  codCapacidadVolumetricaTanqueDetalle?: number;
  codCapacidadVolumetricaTanque?: number;
  idCapacidadVolumetricaTanque?: string;
  pies: number;
  pulgadas: number;
  dieciseisavos: number;
  volumen: number;
}

export interface CapacidadVolumetricaTanqueDetalle2DTO {
  idCapacidadVolumetricaTanqueDetalle2?: string;
  codCapacidadVolumetricaTanqueDetalle2?: number;
  codCapacidadVolumetricaTanque?: number;
  idCapacidadVolumetricaTanque?: string;
  pies: number;
  pulgadas: number;
  volumen: number;
}

export interface CapacidadVolumetricaTanqueDetalle3DTO {
  idCapacidadVolumetricaTanqueDetalle3?: string;
  codCapacidadVolumetricaTanqueDetalle3?: number;
  codCapacidadVolumetricaTanque?: number;
  idCapacidadVolumetricaTanque?: string;
  dieciseisavos: number;
  volumen: number;
}

export interface CapacidadVolumetricaTanqueAdjuntoDTO {
  codCapacidadVolumetricaTanqueAdjunto?: number;
  codCapacidadVolumetricaTanque?: number;
  nombreArchivo: string;
  tipoContenido: string;
  tamanoBytes: number;
  rutaArchivo?: string;
  contenidoBase64?: string;
  estatus?: boolean;
}

export interface CapacidadVolumetricaTanqueLogDTO extends CapacidadVolumetricaTanqueDTO {
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
