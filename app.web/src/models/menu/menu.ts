export interface MenuDTO {
  codMenu: number;
  idMenu: string;
  descripcion: string;
  link: string;
  accion: string;
  icono: string;
  padre: number;
  orden: number;
  estatus: boolean;
  children: MenuDTO[];
}

export interface MenuLogDTO extends MenuDTO {
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
