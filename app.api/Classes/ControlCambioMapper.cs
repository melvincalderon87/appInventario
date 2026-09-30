using Microsoft.Data.SqlClient;
using System.Reflection;

namespace app
{
    internal static class ControlCambioMapper
    {
        internal static void Mapear(object destino, SqlDataReader reader, Encriptacion encriptacion)
        {
            MapearEntero(destino, reader, "Version");
            MapearBooleano(destino, reader, "Estatus");
            MapearTexto(destino, reader, "AccionLog");

            MapearUsuario(destino, reader, encriptacion, "CodUsuarioCreacion", "IdUsuarioCreacion");
            MapearFecha(destino, reader, "FechaCreacion");
            MapearUsuario(destino, reader, encriptacion, "CodUsuarioActualizacion", "IdUsuarioActualizacion");
            MapearFecha(destino, reader, "FechaActualizacion");
            MapearUsuario(destino, reader, encriptacion, "CodUsuarioEliminacion", "IdUsuarioEliminacion");
            MapearFecha(destino, reader, "FechaEliminacion");
        }

        private static void MapearUsuario(
            object destino,
            SqlDataReader reader,
            Encriptacion encriptacion,
            string propiedadCodigo,
            string propiedadId)
        {
            string valor = ObtenerTexto(reader, propiedadCodigo);
            Asignar(destino, propiedadCodigo, valor);

            if (!string.IsNullOrWhiteSpace(valor))
                Asignar(destino, propiedadId, encriptacion.Encriptar(valor));
        }

        private static void MapearTexto(object destino, SqlDataReader reader, string columna)
        {
            Asignar(destino, columna, ObtenerTexto(reader, columna));
        }

        private static void MapearFecha(object destino, SqlDataReader reader, string columna)
        {
            if (!TieneColumna(reader, columna) || reader[columna] == DBNull.Value)
                return;

            if (DateTime.TryParse(reader[columna].ToString(), out DateTime fecha))
                Asignar(destino, columna, fecha);
        }

        private static void MapearEntero(object destino, SqlDataReader reader, string columna)
        {
            if (!TieneColumna(reader, columna) || reader[columna] == DBNull.Value)
                return;

            Asignar(destino, columna, Convert.ToInt32(reader[columna]));
        }

        private static void MapearBooleano(object destino, SqlDataReader reader, string columna)
        {
            if (!TieneColumna(reader, columna) || reader[columna] == DBNull.Value)
                return;

            Asignar(destino, columna, Convert.ToBoolean(reader[columna]));
        }

        private static string ObtenerTexto(SqlDataReader reader, string columna)
        {
            if (!TieneColumna(reader, columna) || reader[columna] == DBNull.Value)
                return "";

            return reader[columna].ToString() ?? "";
        }

        private static bool TieneColumna(SqlDataReader reader, string columna)
        {
            for (int index = 0; index < reader.FieldCount; index++)
            {
                if (string.Equals(reader.GetName(index), columna, StringComparison.OrdinalIgnoreCase))
                    return true;
            }

            return false;
        }

        private static void Asignar(object destino, string propiedad, object? valor)
        {
            PropertyInfo? propertyInfo = destino.GetType().GetProperty(propiedad);
            if (propertyInfo == null || !propertyInfo.CanWrite)
                return;

            Type propertyType = Nullable.GetUnderlyingType(propertyInfo.PropertyType) ?? propertyInfo.PropertyType;
            if (valor == null)
            {
                propertyInfo.SetValue(destino, null);
                return;
            }

            if (propertyType == typeof(string))
            {
                propertyInfo.SetValue(destino, valor.ToString());
                return;
            }

            propertyInfo.SetValue(destino, Convert.ChangeType(valor, propertyType));
        }
    }
}
