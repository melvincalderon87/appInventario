using System.Diagnostics;
using app.Messages;

namespace app;

/// <summary>
/// Asigna un identificador de correlación a cada solicitud y transforma las
/// excepciones no controladas en la respuesta estándar del API.
/// </summary>
public sealed class ManejadorGlobalExcepcionesMiddleware
{
    private const string TraceIdHeader = "X-Trace-Id";
    private readonly RequestDelegate siguiente;
    private readonly ILogger<ManejadorGlobalExcepcionesMiddleware> logger;

    public ManejadorGlobalExcepcionesMiddleware(
        RequestDelegate siguiente,
        ILogger<ManejadorGlobalExcepcionesMiddleware> logger)
    {
        this.siguiente = siguiente;
        this.logger = logger;
    }

    public async Task InvokeAsync(HttpContext contexto)
    {
        string traceId = ObtenerTraceId(contexto);
        contexto.Response.Headers[TraceIdHeader] = traceId;

        using (logger.BeginScope(new Dictionary<string, object?>
        {
            ["TraceId"] = traceId,
            ["Method"] = contexto.Request.Method,
            ["Path"] = contexto.Request.Path.Value ?? ""
        }))
        {
            try
            {
                await siguiente(contexto);

                if (contexto.Response.StatusCode >= StatusCodes.Status500InternalServerError)
                {
                    logger.LogError(
                        "Respuesta de error del servidor. {StatusCode}",
                        contexto.Response.StatusCode);
                }
            }
            catch (OperationCanceledException) when (contexto.RequestAborted.IsCancellationRequested)
            {
                logger.LogInformation("Solicitud cancelada por el cliente.");
            }
            catch (Exception excepcion)
            {
                logger.LogError(
                    excepcion,
                    "Excepción no controlada. {StatusCode}",
                    StatusCodes.Status500InternalServerError);

                if (contexto.Response.HasStarted)
                {
                    logger.LogWarning("No se puede enviar la respuesta estándar porque ya inició.");
                    throw;
                }

                contexto.Response.Clear();
                contexto.Response.StatusCode = StatusCodes.Status500InternalServerError;
                contexto.Response.ContentType = "application/json";
                contexto.Response.Headers[TraceIdHeader] = traceId;

                string idioma = MensajeRespuesta.ObtenerIdiomaActual(contexto);
                await contexto.Response.WriteAsJsonAsync(
                    ManejadorErrores.Interno(idioma, traceId: traceId));
            }
        }
    }

    private static string ObtenerTraceId(HttpContext contexto)
    {
        string activityTraceId = Activity.Current?.TraceId.ToString() ?? "";
        return string.IsNullOrWhiteSpace(activityTraceId) ? contexto.TraceIdentifier : activityTraceId;
    }
}
