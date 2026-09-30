export interface ConfiguracionSistemaFondoDTO {
  codConfiguracionSistema: number;
  fondoNombreArchivo: string;
  fondoTipoContenido: string;
  fondoTamanoBytes: number;
  fondoRutaArchivo: string;
  fondoContenidoBase64?: string;
  version?: number;
}

export interface ConfiguracionSistemaEmpresaDTO {
  codConfiguracionSistema: number;
  nombreComercial: string;
  nombreFiscal: string;
  nit: string;
  direccion: string;
  telefono: string;
  paginaWeb: string;
  logoNombreArchivo: string;
  logoTipoContenido: string;
  logoTamanoBytes: number;
  logoRutaArchivo: string;
  logoContenidoBase64?: string;
  version?: number;
}
