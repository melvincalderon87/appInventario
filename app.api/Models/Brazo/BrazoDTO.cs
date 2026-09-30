using System.ComponentModel.DataAnnotations;
using System.Collections.Generic;

namespace app.Models.Brazo
{
    /// <summary>
    /// DTO que representa un brazo del sistema.
    /// </summary>
    public class BrazoDTO
    {
        /// <summary>
        /// Identificador del brazo en formato encriptado.
        /// </summary>
        public string? IdBrazo { get; set; }

        /// <summary>
        /// Codigo del brazo.
        /// </summary>
        [Required(ErrorMessage = "Campo Obligatorio")]
        [StringLength(20, ErrorMessage = "El codigo de brazo debe tener maximo 20 caracteres de longitud.")]
        public string CodBrazo { get; set; } = "";

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
        /// Nombre del brazo.
        /// </summary>
        [Required(ErrorMessage = "Campo Obligatorio")]
        public string Brazo { get; set; } = "";

        /// <summary>
        /// Comentario del brazo.
        /// </summary>
        [StringLength(250, ErrorMessage = "El comentario debe tener maximo 250 caracteres de longitud.")]
        public string Comentario { get; set; } = "";

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

        /// <summary>
        /// Estado del brazo.
        /// </summary>
        public bool Estatus { get; set; } = true;

        /// <summary>
        /// Cantidad de adjuntos asociados.
        /// </summary>
        public int AdjuntoCantidad { get; set; }

        /// <summary>
        /// Adjuntos del brazo.
        /// </summary>
        public List<BrazoAdjuntoDTO> Adjuntos { get; set; } = new List<BrazoAdjuntoDTO>();

        public string? CodUsuarioEliminacion { get; set; }
        public string? IdUsuarioEliminacion { get; set; }
        public DateTime? FechaEliminacion { get; set; }
        public string AccionLog { get; set; } = "C";
    }
}
