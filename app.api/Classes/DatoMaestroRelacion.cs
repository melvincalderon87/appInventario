using System;
using System.Collections.Generic;
using System.Linq;
using app.Messages;
using Microsoft.Data.SqlClient;

namespace app
{
    internal sealed class DatoMaestroRelacion
    {
        private readonly DAL ObjDAL = new DAL();

        internal MsjDB ValidarEliminacion(string tabla, string columnaLlave, object? valorLlave)
        {
            if (valorLlave == null || string.IsNullOrWhiteSpace(valorLlave.ToString()))
                return Ok();

            List<RelacionTabla> relaciones = ObjDAL.EjecutarReader(
                QueryRelaciones(tabla, columnaLlave),
                MapRelacion);

            List<string> tablasConRegistros = relaciones
                .Where(relacion => ExisteRegistroRelacionado(relacion, valorLlave))
                .Select(relacion => relacion.TablaCompleta)
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();

            if (tablasConRegistros.Count == 0)
                return Ok();

            return ManejadorErrores.CrearRespuesta(
                TipoError.RegistroRelacionado,
                string.Join(", ", tablasConRegistros));
        }

        private bool ExisteRegistroRelacionado(RelacionTabla relacion, object valorLlave)
        {
            return ObjDAL.EjecutarExiste(QueryExisteRegistroRelacionado(relacion, valorLlave));
        }

        private string QueryRelaciones(string tabla, string columnaLlave)
        {
            return "SELECT DISTINCT R.EsquemaTabla,R.Tabla,R.Columna "
                + "FROM ("
                + QueryRelacionesPorLlaveForanea(tabla, columnaLlave)
                + " UNION "
                + QueryRelacionesPorNombreColumna(tabla, columnaLlave)
                + QueryRelacionesAdicionales(tabla, columnaLlave)
                + ") R "
                + "ORDER BY R.EsquemaTabla,R.Tabla,R.Columna";
        }

        private string QueryRelacionesPorLlaveForanea(string tabla, string columnaLlave)
        {
            return "SELECT "
                + "S.name AS EsquemaTabla,"
                + "TP.name AS Tabla,"
                + "CP.name AS Columna "
                + "FROM sys.foreign_keys FK "
                + "INNER JOIN sys.foreign_key_columns FKC ON FK.object_id = FKC.constraint_object_id "
                + "INNER JOIN sys.tables TP ON FKC.parent_object_id = TP.object_id "
                + "INNER JOIN sys.schemas S ON TP.schema_id = S.schema_id "
                + "INNER JOIN sys.columns CP ON FKC.parent_object_id = CP.object_id AND FKC.parent_column_id = CP.column_id "
                + "INNER JOIN sys.tables TR ON FKC.referenced_object_id = TR.object_id "
                + "INNER JOIN sys.columns CR ON FKC.referenced_object_id = CR.object_id AND FKC.referenced_column_id = CR.column_id "
                + "WHERE TR.name = '" + SqlTexto(tabla) + "' "
                + "AND CR.name = '" + SqlTexto(columnaLlave) + "' "
                + "AND TP.name <> '" + SqlTexto(tabla) + "' "
                + "AND TP.name NOT LIKE '%[_]LOG'";
        }

        private string QueryRelacionesPorNombreColumna(string tabla, string columnaLlave)
        {
            return "SELECT "
                + "S.name AS EsquemaTabla,"
                + "T.name AS Tabla,"
                + "C.name AS Columna "
                + "FROM sys.tables T "
                + "INNER JOIN sys.schemas S ON T.schema_id = S.schema_id "
                + "INNER JOIN sys.columns C ON T.object_id = C.object_id "
                + "WHERE C.name = '" + SqlTexto(columnaLlave) + "' "
                + "AND T.name <> '" + SqlTexto(tabla) + "' "
                + "AND T.name NOT LIKE '%[_]LOG'";
        }

        private string QueryRelacionesAdicionales(string tabla, string columnaLlave)
        {
            if (!tabla.Equals("Menu", StringComparison.OrdinalIgnoreCase)
                || !columnaLlave.Equals("CodMenu", StringComparison.OrdinalIgnoreCase))
                return "";

            return " UNION SELECT "
                + "S.name AS EsquemaTabla,"
                + "T.name AS Tabla,"
                + "C.name AS Columna "
                + "FROM sys.tables T "
                + "INNER JOIN sys.schemas S ON T.schema_id = S.schema_id "
                + "INNER JOIN sys.columns C ON T.object_id = C.object_id "
                + "WHERE T.name = 'Menu' "
                + "AND C.name = 'Padre'";
        }

        private string QueryExisteRegistroRelacionado(RelacionTabla relacion, object valorLlave)
        {
            return "SELECT 1 FROM "
                + SqlIdentificador(relacion.EsquemaTabla)
                + "."
                + SqlIdentificador(relacion.Tabla)
                + " WHERE "
                + SqlIdentificador(relacion.Columna)
                + " = N'"
                + SqlTexto(valorLlave.ToString() ?? "")
                + "'";
        }

        private RelacionTabla MapRelacion(SqlDataReader reader)
        {
            return new RelacionTabla
            {
                EsquemaTabla = reader["EsquemaTabla"].ToString() ?? "dbo",
                Tabla = reader["Tabla"].ToString() ?? "",
                Columna = reader["Columna"].ToString() ?? ""
            };
        }

        private static string SqlIdentificador(string valor)
        {
            return "[" + valor.Replace("]", "]]") + "]";
        }

        private static string SqlTexto(string valor)
        {
            return valor.Replace("'", "''");
        }

        private static MsjDB Ok()
        {
            return new MsjDB { Estatus = true, Msj = "", Key = 0 };
        }

        private sealed class RelacionTabla
        {
            internal string EsquemaTabla { get; set; } = "dbo";
            internal string Tabla { get; set; } = "";
            internal string Columna { get; set; } = "";
            internal string TablaCompleta => EsquemaTabla + "." + Tabla;
        }
    }
}
