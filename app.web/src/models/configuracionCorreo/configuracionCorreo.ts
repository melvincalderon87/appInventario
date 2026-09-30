export interface ConfiguracionCorreoDTO {
  idConfiguracionCorreo: string;
  codConfiguracionCorreo: number;
  descripcion: string;
  direccionCorreo: string;
  nombreUsuario: string;
  password: string;
  proveedorAutenticacion: string;
  tipoAutenticacion: string;
  servidorSalida: string;
  puertoSalida: number;
  sslSalida: boolean;
  tenantId: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  authorizationUrl: string;
  tokenUrl: string;
  scope: string;
  refreshToken: string;
  accessToken: string;
  fechaExpiracionToken?: string;
  fechaUltimaAutenticacion?: string;
  estatusAutenticacion: string;
  ultimoErrorAutenticacion: string;
  estatus: boolean;
}

export interface ConfiguracionCorreoLogDTO extends ConfiguracionCorreoDTO {
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
