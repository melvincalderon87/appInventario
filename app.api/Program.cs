using app;
using Microsoft.AspNetCore.CookiePolicy;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.ResponseCompression;
using System.Security.Cryptography.X509Certificates;
using System.Text.Json;
using System.Threading.RateLimiting;

var builder = WebApplication.CreateBuilder(args);

builder.Configuration.SetBasePath(Directory.GetCurrentDirectory());
builder.Configuration.AddJsonFile("appsettings.json", optional: true, reloadOnChange: true);
builder.Configuration.AddJsonFile($"appsettings.{builder.Environment.EnvironmentName}.json", optional: true, reloadOnChange: true);
builder.Configuration.AddJsonFile("webconfig.json", optional: true, reloadOnChange: true);
builder.Configuration.AddEnvironmentVariables();
builder.Logging.ClearProviders();
builder.Logging.AddJsonConsole(options => options.IncludeScopes = true);

if (ShouldUseReactHttpsCertificate(builder))
{
    UseReactHttpsCertificate(builder);
}

string apiUrl = builder.Configuration["Api:Url"] ?? "https://localhost:5002";
if (!IsHostedByIis())
{
    builder.WebHost.UseUrls(apiUrl);
}

// Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.CustomSchemaIds(type => type.FullName?.Replace("+", ".") ?? type.Name);
});

builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(context =>
    {
        string ip = context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        string path = context.Request.Path.Value?.ToLowerInvariant() ?? "";

        if (path.StartsWith("/api/login/login"))
        {
            return RateLimitPartition.GetFixedWindowLimiter(
                $"{ip}:login",
                _ => new FixedWindowRateLimiterOptions
                {
                    PermitLimit = 10,
                    Window = TimeSpan.FromMinutes(1),
                    QueueLimit = 0,
                    AutoReplenishment = true
                });
        }

        return RateLimitPartition.GetFixedWindowLimiter(
            ip,
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 300,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0,
                AutoReplenishment = true
            });
    });
});

builder.Services.AddMemoryCache();
builder.Services.AddDistributedMemoryCache();
builder.Services.AddResponseCompression(options =>
{
    options.EnableForHttps = true;
    options.Providers.Add<BrotliCompressionProvider>();
    options.Providers.Add<GzipCompressionProvider>();
});

// Controllers
builder.Services.AddControllers(options =>
    {
        options.Filters.Add<ValidarBodyRequeridoFilter>();
    })
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.DictionaryKeyPolicy = JsonNamingPolicy.CamelCase;
    });

// Agregar Sesion
builder.Services.AddSession(options =>
{
    options.Cookie.Name = ".app.session";
    options.IdleTimeout = TimeSpan.FromDays(1);
    options.Cookie.IsEssential = true;
    options.Cookie.HttpOnly = true;
    options.Cookie.SameSite = SameSiteMode.None;
    options.Cookie.SecurePolicy = CookieSecurePolicy.Always;
});

// CORS
var FrontEnd = "AllowFrontend";
var defaultFrontendOrigins = new[]
{
    "https://localhost:5001",
    "https://127.0.0.1:5001",
    "https://app.otsa.com.gt",
    "https://10.10.40.4",
    "https://10.10.40.4:443"
};
var frontendOrigins = GetAllowedCorsOrigins(builder.Configuration, defaultFrontendOrigins);
var allowedCorsOrigins = frontendOrigins.ToHashSet(StringComparer.OrdinalIgnoreCase);
builder.Services.AddCors(options =>
{
    options.AddPolicy(name: FrontEnd, policy =>
    {
        policy.SetIsOriginAllowed(origin => allowedCorsOrigins.Contains(NormalizeCorsOrigin(origin)))
           .AllowAnyHeader()
           .AllowAnyMethod()
           .AllowCredentials()
           .SetPreflightMaxAge(TimeSpan.FromHours(1));
    });
});
builder.Services.AddSingleton<IHttpContextAccessor, HttpContextAccessor>();
var app_ = builder.Build();

// Configure the HTTP request pipeline.
if (app_.Environment.IsDevelopment())
{
    app_.UseSwagger();
    app_.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "APP API v1");
        c.DefaultModelsExpandDepth(-1);
    });
}
app_.UseHttpsRedirection();
app_.UseResponseCompression();
app_.UseRouting();
app_.UseCors(FrontEnd);
app_.Use(async (context, next) =>
{
    if (context.Request.Path.StartsWithSegments("/api", StringComparison.OrdinalIgnoreCase))
    {
        context.Response.Headers.TryAdd("Content-Security-Policy", "default-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'");
        context.Response.Headers.TryAdd("X-Content-Type-Options", "nosniff");
        context.Response.Headers.TryAdd("X-Frame-Options", "DENY");
        context.Response.Headers.TryAdd("Referrer-Policy", "strict-origin-when-cross-origin");
        context.Response.Headers.TryAdd("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=(), usb=()");
    }

    await next();
});
app_.UseRateLimiter();
app_.UseCookiePolicy(new CookiePolicyOptions
{
    HttpOnly = HttpOnlyPolicy.Always,
    Secure = CookieSecurePolicy.Always,
    MinimumSameSitePolicy = SameSiteMode.None
});
app_.UseSession();
app_.UseMiddleware<ManejadorGlobalExcepcionesMiddleware>();
app_.UseAuthentication();
app_.UseAuthorization();
Sesion.Servicios = app_.Services;
app_.MapControllers();
app_.Logger.LogInformation("API lista para recibir solicitudes en {ApiUrl}", apiUrl);
app_.Run();

static bool IsHostedByIis()
{
    return !string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable("ASPNETCORE_PORT"))
        || !string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable("ASPNETCORE_APPL_PATH"))
        || !string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable("ASPNETCORE_IIS_PHYSICAL_PATH"));
}

static bool ShouldUseReactHttpsCertificate(WebApplicationBuilder builder)
{
    return builder.Environment.IsDevelopment() && !IsHostedByIis();
}

static string[] GetAllowedCorsOrigins(IConfiguration configuration, string[] defaultOrigins)
{
    string[] configuredOrigins = configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
        ?? Array.Empty<string>();

    return configuredOrigins
        .Concat(defaultOrigins)
        .Select(NormalizeCorsOrigin)
        .Where(origin => !string.IsNullOrWhiteSpace(origin))
        .Distinct(StringComparer.OrdinalIgnoreCase)
        .ToArray();
}

static string NormalizeCorsOrigin(string? origin)
{
    string value = (origin ?? "").Trim().TrimEnd('/');
    if (!Uri.TryCreate(value, UriKind.Absolute, out Uri? uri))
    {
        return value;
    }

    return uri.GetLeftPart(UriPartial.Authority).TrimEnd('/');
}

static void UseReactHttpsCertificate(WebApplicationBuilder builder)
{
    string certPath = Path.GetFullPath(Path.Combine(
        builder.Environment.ContentRootPath,
        "..",
        "app.web",
        "cert",
        "cert.pem"));
    string keyPath = Path.GetFullPath(Path.Combine(
        builder.Environment.ContentRootPath,
        "..",
        "app.web",
        "cert",
        "key.pem"));

    if (!File.Exists(certPath) || !File.Exists(keyPath))
    {
        return;
    }

    using X509Certificate2 pemCertificate = X509Certificate2.CreateFromPemFile(certPath, keyPath);
    X509Certificate2 certificate = new(
        pemCertificate.Export(X509ContentType.Pkcs12),
        (string?)null,
        X509KeyStorageFlags.UserKeySet | X509KeyStorageFlags.Exportable);

    builder.WebHost.ConfigureKestrel(options =>
    {
        options.ConfigureHttpsDefaults(httpsOptions =>
        {
            httpsOptions.ServerCertificate = certificate;
        });
    });
}
