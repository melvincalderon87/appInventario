using app;

namespace app.Messages;

/// <summary>
/// Punto único para construir respuestas de error del API.
/// Conserva el catálogo, idiomas, códigos y estructura de MensajeRespuesta.
/// </summary>
public static class ManejadorErrores
{
    public static object Crear(
        TipoError tipoError,
        string idioma = "",
        string detalle = "",
        string traceId = "") =>
        MensajeRespuesta.HttpError(tipoError, idioma, detalle, traceId);

    public static MsjDB CrearRespuesta(
        TipoError tipoError,
        string detalle = "",
        string idioma = "",
        string traceId = "") =>
        MensajeRespuesta.Error(tipoError, detalle, idioma, traceId);

    public static MsjDB Validacion(string mensaje, string idioma = "") =>
        MensajeRespuesta.ErrorValidacion(mensaje, idioma);

    public static MsjDB Validacion(TipoError tipoError, string detalle = "", string idioma = "") =>
        MensajeRespuesta.ErrorValidacion(tipoError, detalle, idioma);

    public static object NoAutorizado(string idioma = "", string detalle = "", string traceId = "") =>
        Crear(TipoError.Usuario_Nologin, idioma, detalle, traceId);

    public static object SinPermiso(string idioma = "", string detalle = "", string traceId = "") =>
        Crear(TipoError.SinPermiso, idioma, detalle, traceId);

    public static object NoEncontrado(string idioma = "", string detalle = "", string traceId = "") =>
        Crear(TipoError.RegistroNoEncontrado, idioma, detalle, traceId);

    public static object Interno(string idioma = "", string detalle = "", string traceId = "") =>
        Crear(TipoError.ServidorInterno, idioma, detalle, traceId);
}
