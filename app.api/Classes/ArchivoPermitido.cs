using System;
using System.IO;

namespace app
{
    internal static class ArchivoPermitido
    {
        internal const int MaxAdjuntos = 10;
        internal const int MaxArchivoBytes = 10 * 1024 * 1024;
        internal const string AcceptAdjuntos = ".pdf,.jpg,.jpeg,.png";

        internal static string NormalizarTipoContenido(string? tipoContenido, string nombreArchivo, bool permitirPdf)
        {
            string tipo = (tipoContenido ?? "").Trim().ToLowerInvariant();
            if (!string.IsNullOrWhiteSpace(tipo))
                return tipo;

            return Path.GetExtension(nombreArchivo).ToLowerInvariant() switch
            {
                ".pdf" when permitirPdf => "application/pdf",
                ".jpg" => "image/jpeg",
                ".jpeg" => "image/jpeg",
                ".png" => "image/png",
                _ => "application/octet-stream"
            };
        }

        internal static string NormalizarContenidoBase64(string? contenido)
        {
            string valor = (contenido ?? "").Trim();
            int separador = valor.IndexOf(',', StringComparison.Ordinal);
            return separador >= 0 ? valor.Substring(separador + 1) : valor;
        }

        internal static bool MetadataAdjuntoPermitida(string nombreArchivo, string tipoContenido)
        {
            return ExtensionPermitida(nombreArchivo, permitirPdf: true)
                && TipoContenidoPermitido(tipoContenido, permitirPdf: true)
                && ExtensionCoincideConTipo(nombreArchivo, tipoContenido, permitirPdf: true);
        }

        internal static bool MetadataImagenPermitida(string nombreArchivo, string tipoContenido)
        {
            return ExtensionPermitida(nombreArchivo, permitirPdf: false)
                && TipoContenidoPermitido(tipoContenido, permitirPdf: false)
                && ExtensionCoincideConTipo(nombreArchivo, tipoContenido, permitirPdf: false);
        }

        internal static bool TipoContenidoPermitido(string tipoContenido, bool permitirPdf)
        {
            string tipo = (tipoContenido ?? "").Trim().ToLowerInvariant();
            return tipo == "image/jpeg"
                || tipo == "image/png"
                || (permitirPdf && tipo == "application/pdf");
        }

        internal static bool ExtensionPermitida(string nombreArchivo, bool permitirPdf)
        {
            string extension = Path.GetExtension(nombreArchivo).ToLowerInvariant();
            return extension == ".jpg"
                || extension == ".jpeg"
                || extension == ".png"
                || (permitirPdf && extension == ".pdf");
        }

        internal static string ExtensionPermitida(string nombreArchivo, string tipoContenido, bool permitirPdf)
        {
            string extension = Path.GetExtension(nombreArchivo).ToLowerInvariant();
            if (ExtensionPermitida(nombreArchivo, permitirPdf))
                return extension;

            return (tipoContenido ?? "").Trim().ToLowerInvariant() switch
            {
                "application/pdf" when permitirPdf => ".pdf",
                "image/jpeg" => ".jpg",
                "image/png" => ".png",
                _ => permitirPdf ? ".pdf" : ".jpg"
            };
        }

        internal static bool FirmaContenidoValida(string tipoContenido, byte[] contenido)
        {
            string tipo = (tipoContenido ?? "").Trim().ToLowerInvariant();
            return tipo switch
            {
                "application/pdf" => TienePrefijo(contenido, new byte[] { 0x25, 0x50, 0x44, 0x46, 0x2D }),
                "image/jpeg" => contenido.Length >= 3
                    && contenido[0] == 0xFF
                    && contenido[1] == 0xD8
                    && contenido[2] == 0xFF,
                "image/png" => TienePrefijo(contenido, new byte[] { 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A }),
                _ => false
            };
        }

        private static bool ExtensionCoincideConTipo(string nombreArchivo, string tipoContenido, bool permitirPdf)
        {
            string extension = Path.GetExtension(nombreArchivo).ToLowerInvariant();
            string tipo = (tipoContenido ?? "").Trim().ToLowerInvariant();

            return extension switch
            {
                ".pdf" => permitirPdf && tipo == "application/pdf",
                ".jpg" => tipo == "image/jpeg",
                ".jpeg" => tipo == "image/jpeg",
                ".png" => tipo == "image/png",
                _ => false
            };
        }

        private static bool TienePrefijo(byte[] contenido, byte[] firma)
        {
            if (contenido.Length < firma.Length)
                return false;

            for (int i = 0; i < firma.Length; i++)
            {
                if (contenido[i] != firma[i])
                    return false;
            }

            return true;
        }
    }
}
