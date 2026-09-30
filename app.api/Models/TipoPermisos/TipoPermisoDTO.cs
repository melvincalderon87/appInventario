using System.ComponentModel.DataAnnotations;

namespace app.Models.TipoPermisos
{
    /// <summary>
    /// DTO que representa un tipo de permiso del sistema.
    /// </summary>
    public class TipoPermisoDTO
    {
        /// <summary>
        /// Identificador encriptado del tipo de permiso.
        /// </summary>
        public string? IdTipoPermiso { get; set; }

        /// <summary>
        /// Codigo del tipo de permiso.
        /// </summary>
        [Required(ErrorMessage = "Campo Obligatorio")]
        public int CodTipoPermiso { get; set; }

        /// <summary>
        /// Descripcion del tipo de permiso.
        /// </summary>
        [Required(ErrorMessage = "Campo Obligatorio")]
        public string Descripcion { get; set; }

        /// <summary>
        /// Version del registro para control de cambios.
        /// </summary>
        public int Version { get; set; }

        public string? CodUsuarioCreacion { get; set; }
        public string? IdUsuarioCreacion { get; set; }
        public DateTime? FechaCreacion { get; set; }
        public string? CodUsuarioActualizacion { get; set; }
        public string? IdUsuarioActualizacion { get; set; }
        public DateTime? FechaActualizacion { get; set; }
        public bool Estatus { get; set; } = true;
        public string? CodUsuarioEliminacion { get; set; }
        public string? IdUsuarioEliminacion { get; set; }
        public DateTime? FechaEliminacion { get; set; }
        public string AccionLog { get; set; } = "C";
    }
}
