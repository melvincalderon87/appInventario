export interface BahiaDTO {
  idBahia: string;
  codBahia: string;
  bahia: string;
  descripcionCorta: string;
  cantidadBrazos: number;
  cantidadAditivos: number;
  cantidadEtanol: number;
  multiload: string;
  comentario: string;
  estatus: boolean;
  adjuntos: BahiaAdjuntoDTO[];
  adjuntoCantidad?: number;
}

export interface BahiaAdjuntoDTO {
  codBahiaAdjunto: number;
  codBahia: string;
  nombreArchivo: string;
  tipoContenido: string;
  tamanoBytes: number;
  rutaArchivo: string;
  contenidoBase64?: string;
}

export interface BahiaLogDTO extends BahiaDTO {
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
