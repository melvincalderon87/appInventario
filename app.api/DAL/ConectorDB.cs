using System;
using Microsoft.Data;
using Microsoft.Data.SqlClient;
using System.IO;
using Microsoft.Extensions.Configuration;
using System.Data;
using app.Messages;

namespace app
{
    /// <summary>
    /// clase para llamada a la base de datos
    /// </summary>
    public class DB : IDisposable
    {
        internal SqlDataAdapter? da;
        internal SqlConnection? con;
        internal SqlCommand? cmd;
        internal SqlTransaction? Transaction = null;
        internal MsjDB Obj = new MsjDB();

        private readonly string ServerValue;
        private readonly string DatabaseValue;
        private readonly string UserValue;
        private readonly string PasswordValue;
        private readonly string TrustServerCertificateValue;
        private readonly int CommandTimeout;
        private static readonly Lazy<ConfiguracionConexion> Configuracion = new(CargarConfiguracion);
        /// <summary>
        /// Constructor
        /// </summary>
        public DB()
        {
            ConfiguracionConexion configuracion = Configuracion.Value;
            ServerValue = configuracion.Server;
            DatabaseValue = configuracion.Database;
            UserValue = configuracion.Usuario;
            PasswordValue = configuracion.Password;
            TrustServerCertificateValue = configuracion.TrustServerCertificate;
            CommandTimeout = configuracion.CommandTimeout;
        }

        private static ConfiguracionConexion CargarConfiguracion()
        {
            IConfigurationBuilder builder = new ConfigurationBuilder();
            builder.SetBasePath(Directory.GetCurrentDirectory());
            builder.AddJsonFile("webconfig.json", optional: false, reloadOnChange: false);

            var root = builder.Build();

            string server = root.GetSection("ConfiguracionDB:Server").Value ?? string.Empty;
            string database = root.GetSection("ConfiguracionDB:Database").Value ?? "sysInventario";
            string usuario = root.GetSection("ConfiguracionDB:User").Value ?? string.Empty;
            string password = root.GetSection("ConfiguracionDB:Password").Value ?? string.Empty;
            string trustServerCertificate = root["ConfiguracionDB:TrustServerCertificate"] ?? "true";

            if (!int.TryParse(root["ConfiguracionDB:CommandTimeout"], out int timeout))
                timeout = 30;

            return new ConfiguracionConexion(server, database, usuario, password, trustServerCertificate, timeout);
        }

        private sealed record ConfiguracionConexion(
            string Server,
            string Database,
            string Usuario,
            string Password,
            string TrustServerCertificate,
            int CommandTimeout);
        /// <summary>
        /// Procedimiento para conectar a la base de datos configurada para la aplicación.
        /// </summary>
        internal void Conectar()
        {
            string conexion = ObtenerConexion();

            if (con == null)
                con = new SqlConnection(conexion);

            if (con.State != ConnectionState.Open)
                con.Open();
        }
        /// <summary>Abre la conexión de forma asíncrona y cancelable.</summary>
        internal async Task ConectarAsync(CancellationToken cancellationToken = default)
        {
            string conexion = ObtenerConexion();

            if (con == null)
                con = new SqlConnection(conexion);

            if (con.State != ConnectionState.Open)
                await con.OpenAsync(cancellationToken);
        }
        /// <summary>
        /// Procedimiento para cerrar sesión de base datos
        /// </summary>
        internal void Desconectar()
        {
            if (con != null && con.State != ConnectionState.Closed)
                con.Close();
        }
        /// <summary>
        /// Procedimiento para asignar parámetros en una consulta
        /// </summary>
        internal void AsignarParametro(string param, SqlDbType tipo, object? val, int? size = null)
        {
            if (cmd == null)
                throw new InvalidOperationException("Debe crear el comando antes de asignar parámetros.");

            SqlParameter parametro = cmd.Parameters.Add(param, tipo);

            if (size.HasValue)
                parametro.Size = size.Value;

            parametro.Value = val ?? DBNull.Value;
        }
        /// <summary>
        /// Limpia los parámetros del comando actual
        /// </summary>
        internal void LimpiarParametros()
        {
            cmd?.Parameters.Clear();
        }
        /// <summary>
        /// Ejecuta INSERT, UPDATE o DELETE
        /// </summary>
        internal MsjDB EjecutarConsulta(bool Key = false)
        {
            if (cmd == null)
                throw new InvalidOperationException("Debe crear el comando antes de ejecutar.");

            try
            {
                if (Key)
                {
                    object? result = cmd.ExecuteScalar();
                    Obj.Key = result == null || result == DBNull.Value ? 0 : Convert.ToInt32(result);
                }
                else
                {
                    cmd.ExecuteNonQuery();
                    Obj.Key = 0;
                }

                Obj.Estatus = true;
                Obj.Msj = "";
                return Obj;
            }
            catch (SqlException)
            {
                return ManejadorErrores.CrearRespuesta(TipoError.BaseDatos);
            }
        }
        /// <summary>Ejecuta una operación de escritura de forma asíncrona y cancelable.</summary>
        internal async Task<MsjDB> EjecutarConsultaAsync(bool Key = false, CancellationToken cancellationToken = default)
        {
            if (cmd == null)
                throw new InvalidOperationException("Debe crear el comando antes de ejecutar.");

            try
            {
                if (Key)
                {
                    object? result = await cmd.ExecuteScalarAsync(cancellationToken);
                    Obj.Key = result == null || result == DBNull.Value ? 0 : Convert.ToInt32(result);
                }
                else
                {
                    await cmd.ExecuteNonQueryAsync(cancellationToken);
                    Obj.Key = 0;
                }

                Obj.Estatus = true;
                Obj.Msj = "";
                return Obj;
            }
            catch (SqlException)
            {
                return ManejadorErrores.CrearRespuesta(TipoError.BaseDatos);
            }
        }
        /// <summary>
        /// Ejecuta el comando y devuelve un SqlDataReader
        /// </summary>
        internal SqlDataReader EjecutarReader()
        {
            if (cmd == null)
                throw new InvalidOperationException("Debe crear el comando antes de ejecutar.");

            return cmd.ExecuteReader(CommandBehavior.CloseConnection);
        }
        /// <summary>Ejecuta el lector de forma asíncrona y cancelable.</summary>
        internal Task<SqlDataReader> EjecutarReaderAsync(CancellationToken cancellationToken = default)
        {
            if (cmd == null)
                throw new InvalidOperationException("Debe crear el comando antes de ejecutar.");

            return cmd.ExecuteReaderAsync(CommandBehavior.CloseConnection, cancellationToken);
        }
        /// <summary>
        /// Procedimiento para ejecutar una consulta y retorna una tabla
        /// </summary>
        /// <returns></returns>
        internal DataTable EjecutarDataTable()
        {
            using (DataTable dt = new DataTable())
            {
                try
                {
                    da = new SqlDataAdapter(cmd);
                    da.Fill(dt);
                    return dt;
                }
                catch (Exception ex)
                {
                    System.Console.WriteLine(ex.Message);
                    return null;
                }
            }
        }
        /// <summary>
        /// Ejecuta el comando y devuelve un valor escalar
        /// </summary>
        internal object? EjecutarScalar()
        {
            if (cmd == null)
                throw new InvalidOperationException("Debe crear el comando antes de ejecutar.");

            object? result = cmd.ExecuteScalar();
            return result == DBNull.Value ? null : result;
        }
        /// <summary>Ejecuta un escalar de forma asíncrona y cancelable.</summary>
        internal async Task<object?> EjecutarScalarAsync(CancellationToken cancellationToken = default)
        {
            if (cmd == null)
                throw new InvalidOperationException("Debe crear el comando antes de ejecutar.");

            object? result = await cmd.ExecuteScalarAsync(cancellationToken);
            return result == DBNull.Value ? null : result;
        }
        /// <summary>
        /// Ejecuta el comando y devuelve un valor escalar tipado
        /// </summary>
        internal T? EjecutarScalar<T>()
        {
            object? result = EjecutarScalar();

            if (result == null)
                return default;

            return (T)Convert.ChangeType(result, typeof(T));
        }
        /// <summary>
        /// Inicia transacción
        /// </summary>
        internal void BeginTransaction(IsolationLevel isolationLevel = IsolationLevel.ReadCommitted)
        {
            if (con == null || con.State != ConnectionState.Open)
                throw new InvalidOperationException("Debe conectar antes de iniciar una transacción.");

            if (Transaction == null)
                Transaction = con.BeginTransaction(isolationLevel);

            if (cmd != null)
                cmd.Transaction = Transaction;
        }
        /// <summary>
        /// Confirma transacción
        /// </summary>
        internal void Commit()
        {
            if (Transaction != null)
            {
                Transaction.Commit();
                Transaction.Dispose();
                Transaction = null;
            }

            if (cmd != null)
                cmd.Transaction = null;
        }
        /// <summary>
        /// Revierte transacción
        /// </summary>
        internal void Rollback()
        {
            if (Transaction != null)
            {
                Transaction.Rollback();
                Transaction.Dispose();
                Transaction = null;
            }

            if (cmd != null)
                cmd.Transaction = null;
        }
        /// <summary>
        /// Crea el comando SQL
        /// </summary>
        internal void CrearComando(string consulta, CommandType commandType = CommandType.Text)
        {
            if (string.IsNullOrWhiteSpace(consulta))
                throw new ArgumentException("La consulta no puede ir vacía.", nameof(consulta));

            if (con == null || con.State != ConnectionState.Open)
                throw new InvalidOperationException("Debe conectar antes de crear el comando.");

            cmd?.Dispose();
            cmd = new SqlCommand(AgregarContextoUsuario(consulta), con)
            {
                CommandType = commandType,
                CommandTimeout = CommandTimeout
            };

            if (Transaction != null)
                cmd.Transaction = Transaction;
        }

        private string AgregarContextoUsuario(string consulta)
        {
            try
            {
                string? codUsuarioSesion = Sesion.Obtener.Session.GetString("CodUsuario");
                if (string.IsNullOrWhiteSpace(codUsuarioSesion))
                    return consulta;

                string codUsuario = new Encriptacion().Desencriptar(codUsuarioSesion);
                if (string.IsNullOrWhiteSpace(codUsuario))
                    return consulta;

                return "EXEC sys.sp_set_session_context @key=N'CodUsuario', @value=N'"
                    + SqlTexto(codUsuario) + "'; " + consulta;
            }
            catch
            {
                return consulta;
            }
        }

        private string SqlTexto(string valor)
        {
            return valor.Replace("'", "''");
        }
        /// <summary>
        /// Construye la conexión usando exclusivamente la configuración del servidor.
        /// </summary>
        internal string ObtenerConexion()
        {
            return $"Server={ServerValue};Database={DatabaseValue};User ID={UserValue};Password={PasswordValue};TrustServerCertificate={TrustServerCertificateValue};";
        }
        public void Dispose()
        {
            try
            {
                Transaction?.Dispose();
                cmd?.Dispose();

                if (con != null)
                {
                    if (con.State != ConnectionState.Closed)
                        con.Close();

                    con.Dispose();
                }
            }
            catch
            {
            }
        }
    }
}
