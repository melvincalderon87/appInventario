export interface PermisoRolDTO {
  idRol: string;
  codRol: number;
  rolDescripcion: string;
  codMenu: number;
  idMenu: string;
  menuDescripcion: string;
  codTipoPermiso: number;
  tipoPermisoDescripcion: string;
  asignado: boolean;
}

export interface PermisoLogItemDTO {
  version?: number;
  codRol: number;
  idRol?: string;
  codMenu: number;
  idMenu?: string;
  codTipoPermiso: number;
  rol?: {
    idRol?: string;
    codRol: number;
    descripcion: string;
  };
  menu?: {
    idMenu?: string;
    codMenu: number;
    descripcion: string;
  };
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
