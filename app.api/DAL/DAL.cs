using Microsoft.Data.SqlClient;
using System;
using System.Data;
using app.Messages;
namespace app
{
    internal sealed class DAL
    {
        internal DataTable Ejecutar(string Query)
        {
            DataTable dt;
            using (DB db = new DB())
            {
                db.Conectar();
                db.CrearComando(Query);
                dt = db.EjecutarDataTable();
                db.Desconectar();
                db.Dispose();
            }
            return dt;
        }
        internal List<T> Ejecutar<T>(string Query, Func<SqlDataReader, T> map)
        {
            return EjecutarReader(Query, map);
        }
        internal List<T> EjecutarReader<T>(string Query, Func<SqlDataReader, T> map)
        {
            List<T> lista = new List<T>();

            using (DB db = new DB())
            {
                db.Conectar();
                db.CrearComando(Query);

                using (SqlDataReader reader = db.EjecutarReader())
                {
                    while (reader.Read())
                    {
                        lista.Add(map(reader));
                    }
                }

                db.Desconectar();
                db.Dispose();
            }

            return lista;
        }
        /// <summary>
        /// Ejecuta una consulta de lectura sin bloquear el hilo y permite cancelar la solicitud SQL.
        /// </summary>
        internal async Task<List<T>> EjecutarReaderAsync<T>(
            string Query,
            Func<SqlDataReader, T> map,
            CancellationToken cancellationToken = default)
        {
            List<T> lista = new();
            using DB db = new();
            await db.ConectarAsync(cancellationToken);
            db.CrearComando(Query);

            using SqlDataReader reader = await db.EjecutarReaderAsync(cancellationToken);
            while (await reader.ReadAsync(cancellationToken))
                lista.Add(map(reader));

            return lista;
        }
        internal MsjDB Ejecutar(string Query, bool Key = false, TipoOperacion? tipoOperacion = null)
        {
            MsjDB ObjMsj = new MsjDB();
            using (DB db = new DB())
            {
                db.Conectar();
                db.CrearComando(Query);
                ObjMsj = db.EjecutarConsulta(Key: Key);
                db.Desconectar();
                db.Dispose();
            }
            return MensajeRespuesta.Normalizar(ObjMsj, tipoOperacion);
        }
        /// <summary>Ejecuta una operación de escritura de forma asíncrona y cancelable.</summary>
        internal async Task<MsjDB> EjecutarAsync(
            string Query,
            bool Key = false,
            TipoOperacion? tipoOperacion = null,
            CancellationToken cancellationToken = default)
        {
            using DB db = new();
            await db.ConectarAsync(cancellationToken);
            db.CrearComando(Query);
            MsjDB respuesta = await db.EjecutarConsultaAsync(Key, cancellationToken);
            return MensajeRespuesta.Normalizar(respuesta, tipoOperacion);
        }

        internal MsjDB Ejecutar(string Query, bool Key, TipoDAL tipoDAL)
        {
            return Ejecutar(Query, Key, ObtenerTipoOperacion(tipoDAL));
        }

        private static TipoOperacion? ObtenerTipoOperacion(TipoDAL tipoDAL)
        {
            switch (tipoDAL)
            {
                case TipoDAL.Agregar:
                    return TipoOperacion.Agregar;
                case TipoDAL.Editar:
                    return TipoOperacion.Editar;
                case TipoDAL.Eliminar:
                    return TipoOperacion.Eliminar;
                default:
                    return null;
            }
        }
        internal T EjecutarScalar<T>(string Query, T defaultValue = default)
        {
            using (DB db = new DB())
            {
                db.Conectar();
                db.CrearComando(Query);
                object? result = db.EjecutarScalar();
                db.Desconectar();
                db.Dispose();

                if (result == null)
                    return defaultValue;

                Type targetType = Nullable.GetUnderlyingType(typeof(T)) ?? typeof(T);
                return (T)Convert.ChangeType(result, targetType);
            }
        }
        /// <summary>Ejecuta un escalar sin bloquear el hilo y permite cancelación.</summary>
        internal async Task<T> EjecutarScalarAsync<T>(
            string Query,
            T defaultValue = default!,
            CancellationToken cancellationToken = default)
        {
            using DB db = new();
            await db.ConectarAsync(cancellationToken);
            db.CrearComando(Query);
            object? result = await db.EjecutarScalarAsync(cancellationToken);

            if (result == null)
                return defaultValue;

            Type targetType = Nullable.GetUnderlyingType(typeof(T)) ?? typeof(T);
            return (T)Convert.ChangeType(result, targetType);
        }
        internal bool EjecutarExiste(string Query)
        {
            using (DB db = new DB())
            {
                db.Conectar();
                db.CrearComando(Query);
                object? result = db.EjecutarScalar();
                db.Desconectar();
                db.Dispose();

                return result != null;
            }
        }
        /// <summary>Verifica existencia de forma asíncrona y cancelable.</summary>
        internal async Task<bool> EjecutarExisteAsync(string Query, CancellationToken cancellationToken = default)
        {
            using DB db = new();
            await db.ConectarAsync(cancellationToken);
            db.CrearComando(Query);
            return await db.EjecutarScalarAsync(cancellationToken) != null;
        }
    }
}
