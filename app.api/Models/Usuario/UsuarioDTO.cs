using System.ComponentModel.DataAnnotations;

namespace app.Models.Usuarios
{
    /// <summary>
    /// DTO que representa un usuario del sistema.
    /// </summary>
    public class UsuarioDTO
    {
        /// <summary>
        /// Identificador del usuario en formato encriptado.
        /// </summary>
        [Display(Name = "Id Usuario")]
        public string IdUsuario { get; set; }

        /// <summary>
        /// Codigo unico del usuario.
        /// </summary>
        [Required(ErrorMessage = "Campo Obligatorio")]
        [StringLength(50, ErrorMessage = "Codigo de Usuario debe ser menor de 50 caracteres de longitud.")]
        public string CodUsuario { get; set; }

        /// <summary>
        /// Nombre completo del usuario.
        /// </summary>
        [Required(ErrorMessage = "Campo Obligatorio")]
        [StringLength(100, ErrorMessage = "Nombre de Usuario debe ser menor de 100 caracteres de longitud.")]
        public string Nombre { get; set; }

        /// <summary>
        /// Correo electronico del usuario.
        /// </summary>
        [Required(ErrorMessage = "Campo Obligatorio")]
        [StringLength(100, ErrorMessage = "Correo electronico debe ser menor de 100 caracteres de longitud.")]
        public string Correo { get; set; }

        /// <summary>
        /// Contrasena del usuario.
        /// </summary>
        public string Password { get; set; }

        /// <summary>
        /// Indica si el usuario esta activo.
        /// </summary>
        public bool Estatus { get; set; }
        /// <summary>
        /// Version del registro para control de cambios.
        /// </summary>
        public int? Version { get; set; }

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
        public string? CodUsuarioEliminacion { get; set; }
        public string? IdUsuarioEliminacion { get; set; }
        public DateTime? FechaEliminacion { get; set; }
        public string AccionLog { get; set; } = "C";
    }
}
