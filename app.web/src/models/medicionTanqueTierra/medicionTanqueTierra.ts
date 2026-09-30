export interface MedicionTanqueTierraDetalleDTO {
  idMedicionTanqueTierraDetalle?: string;
  codMedicionTanqueTierraDetalle?: number;
  codMedicionTanqueTierra?: number;
  idMedicionTanqueTierra?: string;
  linea?: number;
  codTanque: string;
  idTanque?: string;
  tanque?: string;
  tipo: string;
  fecha: string;
  hora: string;
  pies: number;
  pulgadas: number;
  dieciseisavos: number;
  volumen: number;
  correccionTecho: number;
  medidaAguaPies: number;
  medidaAguaPulgadas: number;
  volumenAguaLibre: number;
  volumenBrutoObservado: number;
  temperatura: number;
  api: number;
  factor: number;
  volumenEstandarBruto: number;
}

export interface MedicionTanqueTierraDTO {
  idMedicionTanqueTierra: string;
  codMedicionTanqueTierra: number;
  fecha: string;
  codBarco: number;
  idBarco?: string;
  barco?: string;
  codSuplidor: number;
  idSuplidor?: string;
  suplidor?: string;
  codProducto: number;
  idProducto?: string;
  producto?: string;
  codCompaniaInspeccion: number;
  idCompaniaInspeccion?: string;
  companiaInspeccion?: string;
  detalleCantidad?: number;
  volumenEstandarBrutoTotal?: number;
  detalles: MedicionTanqueTierraDetalleDTO[];
  estatus?: boolean;
}

export interface MedicionTanqueTierraLogDTO extends MedicionTanqueTierraDTO {
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
