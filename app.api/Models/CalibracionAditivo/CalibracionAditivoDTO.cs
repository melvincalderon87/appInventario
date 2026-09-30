using System.ComponentModel.DataAnnotations;

namespace app.Models.CalibracionAditivo
{
    /// <summary>
    /// DTO que representa una calibracion de aditivo del sistema.
    /// </summary>
    public class CalibracionAditivoDTO
    {
        /// <summary>
        /// Identificador de la calibracion en formato encriptado.
        /// </summary>
        public string? IdCalibracionAditivo { get; set; }

        /// <summary>
        /// Codigo numerico de la calibracion.
        /// </summary>
        [Required(ErrorMessage = "Campo Obligatorio")]
        public int CodCalibracionAditivo { get; set; }

        /// <summary>
        /// Fecha del registro.
        /// </summary>
        [Required(ErrorMessage = "Campo Obligatorio")]
        public DateTime? Fecha { get; set; }

        /// <summary>
        /// Codigo de la bahia relacionada.
        /// </summary>
        [Required(ErrorMessage = "Campo Obligatorio")]
        [StringLength(20, ErrorMessage = "El codigo de bahia debe tener maximo 20 caracteres de longitud.")]
        public string CodBahia { get; set; } = "";

        /// <summary>
        /// Identificador de la bahia en formato encriptado.
        /// </summary>
        public string? IdBahia { get; set; }

        /// <summary>
        /// Descripcion de la bahia relacionada.
        /// </summary>
        public string Bahia { get; set; } = "";

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
        /// Codigo del tecnico relacionado.
        /// </summary>
        [Required(ErrorMessage = "Campo Obligatorio")]
        public int CodPersonal { get; set; }

        /// <summary>
        /// Identificador del tecnico en formato encriptado.
        /// </summary>
        public string? IdPersonal { get; set; }

        /// <summary>
        /// Nombre del tecnico relacionado.
        /// </summary>
        public string Personal { get; set; } = "";

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
        /// Nombre comercial de la compania de inspeccion.
        /// </summary>
        public string CompaniaInspeccion { get; set; } = "";

        /// <summary>
        /// Fecha de la calibracion.
        /// </summary>
        [Required(ErrorMessage = "Campo Obligatorio")]
        public DateTime? FechaCalibracion { get; set; }

        /// <summary>
        /// Proxima fecha de calibracion.
        /// </summary>
        public DateTime? ProximaFecha { get; set; }

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
