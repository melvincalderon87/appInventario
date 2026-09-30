using System.ComponentModel.DataAnnotations;

namespace app.Models.CapacidadVolumetricaTanque
{
    /// <summary>
    /// DTO que representa el encabezado de capacidad volumetrica de tanque del sistema.
    /// </summary>
    public class CapacidadVolumetricaTanqueDTO
    {
        /// <summary>
        /// Identificador de la capacidad volumetrica en formato encriptado.
        /// </summary>
        public string? IdCapacidadVolumetricaTanque { get; set; }

        /// <summary>
        /// Codigo numerico de la capacidad volumetrica.
        /// </summary>
        [Required(ErrorMessage = "Campo Obligatorio")]
        public int CodCapacidadVolumetricaTanque { get; set; }

        /// <summary>
        /// Codigo del tanque relacionado.
        /// </summary>
        [Required(ErrorMessage = "Campo Obligatorio")]
        [StringLength(20, ErrorMessage = "El codigo de tanque debe tener maximo 20 caracteres de longitud.")]
        public string CodTanque { get; set; } = "";

        /// <summary>
        /// Identificador del tanque en formato encriptado.
        /// </summary>
        public string? IdTanque { get; set; }

        /// <summary>
        /// Descripcion del tanque relacionado.
        /// </summary>
        public string Tanque { get; set; } = "";

        /// <summary>
        /// Codigo del producto relacionado.
        /// </summary>
        [Required(ErrorMessage = "Campo Obligatorio")]
        public int CodProducto { get; set; }

        /// <summary>
        /// Identificador del producto en formato encriptado.
        /// </summary>
        public string? IdProducto { get; set; }

        /// <summary>
        /// Descripcion del producto relacionado.
        /// </summary>
        public string Producto { get; set; } = "";

        /// <summary>
        /// Codigo de la compania de inspeccion relacionada.
        /// </summary>
        [Required(ErrorMessage = "Campo Obligatorio")]
        public int CodCompaniaInspeccion { get; set; }

        /// <summary>
        /// Identificador de la compania de inspeccion en formato encriptado.
        /// </summary>
        public string? IdCompaniaInspeccion { get; set; }

        /// <summary>
        /// Descripcion de la compania de inspeccion relacionada.
        /// </summary>
        public string CompaniaInspeccion { get; set; } = "";

        /// <summary>
        /// Fecha de calibracion del documento de capacidad volumetrica.
        /// </summary>
        public DateTime? FechaCalibracion { get; set; }

        /// <summary>
        /// Comentarios del documento de capacidad volumetrica.
        /// </summary>
        public string Comentarios { get; set; } = "";

        /// <summary>
        /// Indica si es el documento actual del tanque.
        /// </summary>
        public bool EsActual { get; set; }

        /// <summary>
        /// Cantidad de detalles del documento.
        /// </summary>
        public int DetalleCantidad { get; set; }

        /// <summary>
        /// Detalles de alturas y capacidades del documento.
        /// </summary>
        public List<CapacidadVolumetricaTanqueDetalleDTO> Detalles { get; set; } = new List<CapacidadVolumetricaTanqueDetalleDTO>();

        /// <summary>
        /// Detalles base ingresados en el paso 1 del wizard.
        /// </summary>
        public List<CapacidadVolumetricaTanqueDetalle2DTO> DetallesBase { get; set; } = new List<CapacidadVolumetricaTanqueDetalle2DTO>();

        /// <summary>
        /// Fracciones en 16avos ingresadas en el paso 2 del wizard.
        /// </summary>
        public List<CapacidadVolumetricaTanqueDetalle3DTO> DetallesFracciones { get; set; } = new List<CapacidadVolumetricaTanqueDetalle3DTO>();

        /// <summary>
        /// Cantidad de archivos adjuntos del documento.
        /// </summary>
        public int AdjuntoCantidad { get; set; }

        /// <summary>
        /// Archivos adjuntos del encabezado.
        /// </summary>
        public List<CapacidadVolumetricaTanqueAdjuntoDTO> Adjuntos { get; set; } = new List<CapacidadVolumetricaTanqueAdjuntoDTO>();

        /// <summary>
        /// Version del registro para control de cambios.
        /// </summary>
        public int Version { get; set; }

        /// <summary>
        /// Codigo del usuario que creo el registro.
        /// </summary>
        public string? CodUsuarioCreacion { get; set; }

        /// <summary>
        /// Identificador del usuario que creo el registro.
        /// </summary>
        public string? IdUsuarioCreacion { get; set; }

        /// <summary>
        /// Fecha de creacion del registro.
        /// </summary>
        public DateTime? FechaCreacion { get; set; }

        /// <summary>
        /// Codigo del usuario que actualizo el registro.
        /// </summary>
        public string? CodUsuarioActualizacion { get; set; }

        /// <summary>
        /// Identificador del usuario que actualizo el registro.
        /// </summary>
        public string? IdUsuarioActualizacion { get; set; }

        /// <summary>
        /// Fecha de ultima actualizacion del registro.
        /// </summary>
        public DateTime? FechaActualizacion { get; set; }
        public bool Estatus { get; set; } = true;
        public string? CodUsuarioEliminacion { get; set; }
        public string? IdUsuarioEliminacion { get; set; }
        public DateTime? FechaEliminacion { get; set; }
        public string AccionLog { get; set; } = "C";
    }

}
