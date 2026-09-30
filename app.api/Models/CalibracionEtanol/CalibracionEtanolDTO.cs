using System.ComponentModel.DataAnnotations;

namespace app.Models.CalibracionEtanol
{
    /// <summary>
    /// DTO que representa una calibracion de etanol del sistema.
    /// </summary>
    public class CalibracionEtanolDTO
    {
        /// <summary>
        /// Identificador de la calibracion en formato encriptado.
        /// </summary>
        public string? IdCalibracionEtanol { get; set; }

        /// <summary>
        /// Codigo numerico de la calibracion.
        /// </summary>
        [Required(ErrorMessage = "Campo Obligatorio")]
        public int CodCalibracionEtanol { get; set; }

        /// <summary>
        /// Fecha de la calibracion.
        /// </summary>
        [Required(ErrorMessage = "Campo Obligatorio")]
        public DateTime? Fecha { get; set; }

        /// <summary>
        /// Proxima fecha de calibracion.
        /// </summary>
        public DateTime? ProximaFecha { get; set; }

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
        /// Codigo del brazo relacionado.
        /// </summary>
        [Required(ErrorMessage = "Campo Obligatorio")]
        [StringLength(20, ErrorMessage = "El codigo de brazo debe tener maximo 20 caracteres de longitud.")]
        public string CodBrazo { get; set; } = "";

        /// <summary>
        /// Identificador del brazo en formato encriptado.
        /// </summary>
        public string? IdBrazo { get; set; }

        /// <summary>
        /// Descripcion del brazo relacionado.
        /// </summary>
        public string Brazo { get; set; } = "";

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
        /// Cantidad de la calibracion.
        /// </summary>
        public decimal CantidadCalibracion { get; set; }

        /// <summary>
        /// Hora de inicio de la calibracion.
        /// </summary>
        public string? HoraInicio { get; set; }

        /// <summary>
        /// Hora final de la calibracion.
        /// </summary>
        public string? HoraFinal { get; set; }

        /// <summary>
        /// Tiempo total de la calibracion en minutos.
        /// </summary>
        public int? TiempoTotal { get; set; }

        /// <summary>
        /// Factor de calibracion.
        /// </summary>
        public decimal? FactorCalibracion { get; set; }

        /// <summary>
        /// Porcentaje de desviacion.
        /// </summary>
        public decimal? PorcentajeDesviacion { get; set; }

        /// <summary>
        /// Volumen bruto final despues de calibrar.
        /// </summary>
        public decimal? VolumenBrutoFinalDespuesCalibrar { get; set; }

        /// <summary>
        /// Volumen final de la calibracion anterior.
        /// </summary>
        public decimal? VolumenFinalCalibracionAnterior { get; set; }

        /// <summary>
        /// Volumen encontrado inicial de calibracion.
        /// </summary>
        public decimal? VolumenEncontradoInicialCalibracion { get; set; }

        /// <summary>
        /// Proximo volumen a calibrar.
        /// </summary>
        public decimal? ProximoVolumenACalibrar { get; set; }

        /// <summary>
        /// Volumen despachado.
        /// </summary>
        public decimal? VolumenDespachado { get; set; }

        /// <summary>
        /// Comentarios de la calibracion.
        /// </summary>
        public string? Comentarios { get; set; }

        /// <summary>
        /// Temperatura rack.
        /// </summary>
        public decimal? TemperaturaRack { get; set; }

        /// <summary>
        /// Temperatura Serafin.
        /// </summary>
        public decimal? TemperaturaSerafin { get; set; }

        /// <summary>
        /// Diferencia de temperaturas.
        /// </summary>
        public decimal? DiferenciaTemperaturas { get; set; }

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
