export interface SalidasDTO {
  codSalida?: number;
  fecha: string;
  codSuplidor: number;
  codProducto: number;
  cantidadEstandar: number;
  cantidadAmbiente: number;
  idSalida?: string;
  idSuplidor?: string;
  suplidor?: string;
  idProducto?: string;
  producto?: string;
  estatus?: boolean;
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
