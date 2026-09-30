export interface BarcoDetalleDTO {
  codBarco?: number;
  linea?: number;
  codSuplidor: number;
  idSuplidor?: string;
  suplidor?: string;
  codProducto: number;
  idProducto?: string;
  producto?: string;
  cantidad: number;
}

export interface BarcoDTO {
  idBarco: string;
  codBarco: number;
  barco: string;
  fechaPrevista: string;
  comentario?: string;
  cantidadTotal?: number;
  detalleCantidad?: number;
  detalles: BarcoDetalleDTO[];
  estatus?: boolean;
}

export interface BarcoLogDTO extends BarcoDTO {
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

export interface IngresoBarcoDetalleDTO {
  linea?: number;
  codSuplidor: number;
  codProducto: number;
  cantidadEstandar: number;
  cantidadAmbiente?: number;
}

export interface IngresoBarcoDTO {
  codIngresoBarco?: number;
  codBarco: number;
  fechaIngreso: string;
  codigoInterno: string;
  detalles: IngresoBarcoDetalleDTO[];
}

export interface IngresoTuberiasDTO {
  codIngresoTuberias?: number;
  fecha: string;
  codBarco: number;
  codSuplidor: number;
  codProducto: number;
  cantidadEstandar: number;
  cantidadAmbiente: number;
}
