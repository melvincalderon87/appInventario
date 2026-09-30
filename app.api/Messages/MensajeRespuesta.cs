using app;
using Microsoft.AspNetCore.Http;

namespace app.Messages
{
    public static class MensajeRespuesta
    {
        public static MsjDB Ok(TipoOperacion tipoOperacion, int key = 0, string idioma = "")
        {
            return new MsjDB
            {
                Estatus = true,
                Msj = new MensajeOperacion().Descripcion(tipoOperacion, ObtenerIdioma(idioma)),
                Key = key,
                Codigo = ((int)tipoOperacion).ToString(),
                Tipo = "success",
                Operacion = tipoOperacion.ToString()
            };
        }

        public static MsjDB Error(TipoError tipoError, string detalle = "", string idioma = "", string traceId = "")
        {
            string mensaje = new MensajeError().Descripcion(tipoError, ObtenerIdioma(idioma));

            if (!string.IsNullOrWhiteSpace(detalle))
                mensaje += ": " + detalle;

            return new MsjDB
            {
                Estatus = false,
                Msj = mensaje,
                Key = 0,
                Codigo = ((int)tipoError).ToString(),
                Tipo = "error",
                TraceId = string.IsNullOrWhiteSpace(traceId) ? ObtenerTraceId() : traceId
            };
        }

        public static MsjDB ErrorValidacion(string mensaje, string idioma = "")
        {
            if (string.IsNullOrWhiteSpace(mensaje))
                return Error(TipoError.Validacion, idioma: idioma);

            return Error(TipoError.Validacion, mensaje, idioma);
        }

        public static MsjDB ErrorValidacion(TipoError tipoError, string detalle = "", string idioma = "")
        {
            return Error(tipoError, detalle, idioma);
        }

        public static MsjDB Normalizar(MsjDB respuesta, TipoOperacion? tipoOperacion = null, TipoError tipoError = TipoError.OperacionNoCompletada)
        {
            if (respuesta.Estatus)
            {
                if (tipoOperacion.HasValue)
                {
                    respuesta.Codigo = ((int)tipoOperacion.Value).ToString();
                    respuesta.Tipo = "success";
                    respuesta.Operacion = tipoOperacion.Value.ToString();

                    if (string.IsNullOrWhiteSpace(respuesta.Msj))
                        respuesta.Msj = new MensajeOperacion().Descripcion(tipoOperacion.Value, ObtenerIdioma(""));
                }
                else if (string.IsNullOrWhiteSpace(respuesta.Tipo))
                {
                    respuesta.Tipo = "success";
                }

                return respuesta;
            }

            if (string.IsNullOrWhiteSpace(respuesta.Msj))
                respuesta.Msj = new MensajeError().Descripcion(tipoError, ObtenerIdioma(""));

            if (string.IsNullOrWhiteSpace(respuesta.Codigo))
                respuesta.Codigo = ((int)tipoError).ToString();

            if (tipoOperacion.HasValue && string.IsNullOrWhiteSpace(respuesta.Operacion))
                respuesta.Operacion = tipoOperacion.Value.ToString();

            respuesta.Tipo = "error";
            return respuesta;
        }

        public static object HttpError(TipoError tipoError, string idioma = "", string detalle = "", string traceId = "")
        {
            MsjDB respuesta = Error(tipoError, detalle, idioma, traceId);
            return new
            {
                estatus = respuesta.Estatus,
                msj = respuesta.Msj,
                message = respuesta.Msj,
                key = respuesta.Key,
                codigo = respuesta.Codigo,
                tipo = respuesta.Tipo,
                operacion = respuesta.Operacion,
                traceId = respuesta.TraceId
            };
        }

        /// <summary>
        /// Obtiene el idioma de la solicitud actual y conserva español como idioma seguro por defecto.
        /// </summary>
        public static string ObtenerIdiomaActual(HttpContext? contexto = null)
        {
            try
            {
                string? idioma = contexto?.Session.GetString("Idioma");
                if (string.IsNullOrWhiteSpace(idioma))
                    idioma = Sesion.Obtener.Session.GetString("Idioma");

                if (!string.IsNullOrWhiteSpace(idioma))
                    return idioma.Equals("en-US", StringComparison.OrdinalIgnoreCase) || idioma.Equals("en", StringComparison.OrdinalIgnoreCase)
                        ? "en-US"
                        : "es-GT";
            }
            catch
            {
                // La sesión puede no estar disponible, por ejemplo durante el inicio de sesión.
            }

            string idiomaAceptado = contexto?.Request.Headers.AcceptLanguage.ToString() ?? "";
            return idiomaAceptado.StartsWith("en", StringComparison.OrdinalIgnoreCase) ? "en-US" : "es-GT";
        }

        private static string ObtenerIdioma(string idioma)
        {
            if (!string.IsNullOrWhiteSpace(idioma))
                return idioma.Equals("en-US", StringComparison.OrdinalIgnoreCase) || idioma.Equals("en", StringComparison.OrdinalIgnoreCase)
                    ? "en-US"
                    : "es-GT";

            return ObtenerIdiomaActual();
        }

        private static string ObtenerTraceId()
        {
            try
            {
                return Sesion.Obtener.TraceIdentifier ?? "";
            }
            catch
            {
                return "";
            }
        }
    }
}
