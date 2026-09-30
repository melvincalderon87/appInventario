using System;
using System.Collections.Generic;
using System.Linq;

namespace app.Models.Paginacion
{
    public sealed class PaginacionResultado<T>
    {
        public PaginacionResultado()
        {
        }

        public PaginacionResultado(IEnumerable<T> items, int totalCount, int page, int pageSize)
        {
            Items = items.ToList();
            TotalCount = totalCount;
            Page = page;
            PageSize = pageSize;
            TotalPages = totalCount <= 0 ? 1 : (int)Math.Ceiling(totalCount / (double)pageSize);
        }

        public IReadOnlyList<T> Items { get; set; } = new List<T>();
        public int TotalCount { get; set; }
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = PaginacionParametros.DefaultPageSize;
        public int TotalPages { get; set; } = 1;

        public PaginacionResultado<TResult> Map<TResult>(Func<T, TResult> map)
        {
            return new PaginacionResultado<TResult>(Items.Select(map), TotalCount, Page, PageSize);
        }
    }

    internal sealed class PaginacionParametros
    {
        internal const int DefaultPageSize = 50;
        internal const int MaxPageSize = 100;

        internal int Page { get; init; }
        internal int PageSize { get; init; }
        internal int Offset => (Page - 1) * PageSize;
        internal string Search { get; init; } = "";
        internal string Sort { get; init; } = "";

        internal static PaginacionParametros Crear(int page, int pageSize, string? search, string? sort)
        {
            int safePage = page <= 0 ? 1 : page;
            int safePageSize = pageSize <= 0 ? DefaultPageSize : Math.Min(pageSize, MaxPageSize);

            return new PaginacionParametros
            {
                Page = safePage,
                PageSize = safePageSize,
                Search = (search ?? "").Trim(),
                Sort = (sort ?? "").Trim()
            };
        }
    }

    internal static class PaginacionSql
    {
        internal const string TotalRegistrosAlias = "TotalRegistros";

        internal static string SqlTexto(string? value)
        {
            return (value ?? "").Replace("'", "''");
        }

        internal static string WhereBusqueda(string? search, IEnumerable<string> columnas)
        {
            string texto = SqlTexto(search?.Trim());

            if (string.IsNullOrWhiteSpace(texto))
                return "";

            return "AND ("
                + string.Join(" OR ", columnas.Select(columna => columna + " LIKE '%" + texto + "%'"))
                + ") ";
        }

        internal static string OrderBy(
            string? sort,
            IReadOnlyDictionary<string, string> columnasPermitidas,
            string defaultOrderBy)
        {
            if (string.IsNullOrWhiteSpace(sort))
                return defaultOrderBy;

            string[] partes = sort.Split(':', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

            if (partes.Length == 0 || !columnasPermitidas.TryGetValue(partes[0], out string? columna))
                return defaultOrderBy;

            string direccion = partes.Length > 1 && partes[1].Equals("desc", StringComparison.OrdinalIgnoreCase)
                ? "DESC"
                : "ASC";

            return columna + " " + direccion;
        }

        internal static int LeerTotal(Microsoft.Data.SqlClient.SqlDataReader reader)
        {
            int ordinal = reader.GetOrdinal(TotalRegistrosAlias);

            if (reader.IsDBNull(ordinal))
                return 0;

            return Convert.ToInt32(reader[TotalRegistrosAlias]);
        }

        internal static string OffsetFetch(PaginacionParametros paginacion)
        {
            return " OFFSET " + paginacion.Offset + " ROWS FETCH NEXT " + paginacion.PageSize + " ROWS ONLY";
        }
    }
}
