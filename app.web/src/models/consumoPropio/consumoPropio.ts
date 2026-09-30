export interface ConsumoPropioDTO {
  idConsumoPropio: string;
  codConsumoPropio: number;
  codTanque: string;
  idTanque?: string;
  tanque?: string;
  fecha?: string;
  pies: number;
  pulgadas: number;
  dieciseisavos: number;
  cantidadAnterior: number;
  cantidad: number;
  cantidadActual: number;
  estatus?: boolean;
}

export interface ConsumoPropioLogDTO extends ConsumoPropioDTO {
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
