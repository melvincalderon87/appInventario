using System.ComponentModel.DataAnnotations;

namespace app.Models.LogModificaciones
{
    /// <summary>Contrato de datos del modulo LogModificacion.</summary>
    public class LogModificacionDTO
    {
        /// <summary>
        /// Campo Correlativo de Log de Modificaciones
        /// </summary>
        [Display(Name = "Id")]
        public string IdLogModificacion { get; set; } = "";

        /// <summary>
        /// Campo Correlativo de Log de Modificaciones
        /// </summary>
        [Display(Name = "Codigo")]
        public int CodLogModificacion { get; set; }

        /// <summary>
        /// Campo Fecha de Modificacion
        /// </summary>
        [DataType(DataType.Date)]
        [DisplayFormat(DataFormatString = "{0:dd/MM/yyyy HH:mm}", ApplyFormatInEditMode = true)]
        public DateTime Fecha { get; set; }

        /// <summary>
        /// Campo Codigo de Usuario
        /// </summary>
        public string CodUsuario { get; set; } = "";

        /// <summary>
        /// Campo Nombre de Tabla Modificada
        /// </summary>
        public string Tabla { get; set; } = "";

        /// <summary>
        /// Campo de Tipo de Accion de Modificacion
        /// </summary>
        public string Accion { get; set; } = "";

        /// <summary>
        /// Campo Llave Primaria de Tabla modificada
        /// </summary>
        public string Llave { get; set; } = "";

        /// <summary>
        /// Campo de cambios realizados
        /// </summary>
        public string Descripcion { get; set; } = "";
        public int Version { get; set; }
        public bool Estatus { get; set; } = true;
        public string? CodUsuarioCreacion { get; set; }
        public string? IdUsuarioCreacion { get; set; }
        public DateTime? FechaCreacion { get; set; }
        public string? CodUsuarioActualizacion { get; set; }
        public string? IdUsuarioActualizacion { get; set; }
        public DateTime? FechaActualizacion { get; set; }
        public string? CodUsuarioEliminacion { get; set; }
        public string? IdUsuarioEliminacion { get; set; }
        public DateTime? FechaEliminacion { get; set; }
        public string AccionLog { get; set; } = "C";
    }
}
