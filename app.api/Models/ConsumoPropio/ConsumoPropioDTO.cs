using System.ComponentModel.DataAnnotations;

namespace app.Models.ConsumoPropio
{
    /// <summary>
    /// DTO que representa un registro de consumo propio por medicion de tanque.
    /// </summary>
    public class ConsumoPropioDTO
    {
        /// <summary>
        /// Identificador del registro en formato encriptado.
        /// </summary>
        public string? IdConsumoPropio { get; set; }

        /// <summary>
        /// Codigo numerico del registro.
        /// </summary>
        [Required(ErrorMessage = "Campo Obligatorio")]
        public int CodConsumoPropio { get; set; }

        /// <summary>
        /// Codigo del tanque relacionado.
        /// </summary>
        [Required(ErrorMessage = "Campo Obligatorio")]
        [StringLength(20, ErrorMessage = "El campo no puede exceder 20 caracteres")]
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
        /// Fecha de la medicion.
        /// </summary>
        public DateTime? Fecha { get; set; }

        /// <summary>
        /// Altura medida en pies.
        /// </summary>
        public int Pies { get; set; }

        /// <summary>
        /// Altura medida en pulgadas.
        /// </summary>
        public int Pulgadas { get; set; }

        /// <summary>
        /// Numerador de la fraccion de altura medida.
        /// </summary>
        public int Dieciseisavos { get; set; }

        /// <summary>
        /// Cantidad actual del registro anterior del mismo tanque.
        /// </summary>
        public decimal CantidadAnterior { get; set; }

        /// <summary>
        /// Diferencia entre la cantidad actual y la cantidad anterior.
        /// </summary>
        public decimal Cantidad { get; set; }

        /// <summary>
        /// Cantidad total actual calculada para la medicion.
        /// </summary>
        public decimal CantidadActual { get; set; }

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
