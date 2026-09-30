export interface MetroDTO {
  idMetro: string;
  codMetro: string;
  codBahia: string;
  idBahia?: string;
  bahia?: string;
  codBrazo: string;
  idBrazo?: string;
  brazo?: string;
  codProducto: string;
  idProducto?: string;
  producto?: string;
  metro: string;
  tipoMetro: string;
  modelo: string;
  serie: string;
  comentario: string;
  estatus: boolean;
}

export interface MetroLogDTO extends MetroDTO {
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
