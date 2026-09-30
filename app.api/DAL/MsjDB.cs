namespace app
{
    /// <summary>
    /// Modelo de Resultado de Base de Datos
    /// </summary>
    public class MsjDB
    {
        /// <summary>
        /// Estatus
        /// </summary>               
        public bool Estatus { get; set; }
        /// <summary>
        /// Mensaje
        /// </summary>        
        public string Msj { get; set; } = "";
        /// <summary>
        /// Alias compatible para respuestas HTTP.
        /// </summary>
        public string Message
        {
            get { return Msj; }
            set { Msj = value; }
        }
        /// <summary>
        /// Codigo de Key
        /// </summary>
        public int Key { get; set; }
        /// <summary>
        /// Codigo interno del mensaje.
        /// </summary>
        public string Codigo { get; set; } = "";
        /// <summary>
        /// Tipo de mensaje: success, error, warning o info.
        /// </summary>
        public string Tipo { get; set; } = "";
        /// <summary>
        /// Tipo de operacion asociada cuando aplica.
        /// </summary>
        public string Operacion { get; set; } = "";
        /// <summary>
        /// Identificador de correlación de la solicitud que originó la respuesta.
        /// Úselo para localizar un error en los registros del API.
        /// </summary>
        public string TraceId { get; set; } = "";
    }
}
