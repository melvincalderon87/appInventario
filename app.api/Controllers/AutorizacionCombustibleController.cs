using app.Messages;
using Microsoft.AspNetCore.Mvc;

namespace app.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AutorizacionCombustibleController : ControllerBase
    {
        private readonly DAL dal = new DAL();
        private readonly VerificarUsuario verificar = new VerificarUsuario();
        private static readonly int[] Modulos = { 135, 147, 137, 138, 159, 160, 157, 158, 164, 165, 166, 167, 168, 169, 170, 171 };

        [AuditoriaSistema, RequierePermiso(Menus.AutorizadoresCombustible, Permisos.Listar)]
        [HttpGet("Listar")]
        public IActionResult Listar()
        {
            var sesion = verificar.ObtenerSesion(); if (!sesion.Autenticado) return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
            var datos = dal.EjecutarReader("SELECT A.CodUsuario,U.Nombre,A.CodMenu,M.Descripcion AS Modulo FROM AutorizadorDocumentos A INNER JOIN Usuario U ON U.CodUsuario=A.CodUsuario INNER JOIN Menu M ON M.CodMenu=A.CodMenu WHERE A.Estatus=1 ORDER BY M.Orden,U.Nombre", r => new { codUsuario = r["CodUsuario"].ToString(), nombre = r["Nombre"].ToString(), codMenu = Convert.ToInt32(r["CodMenu"]), modulo = r["Modulo"].ToString() });
            return Ok(datos);
        }

        [AuditoriaSistema, RequierePermiso(Menus.AutorizadoresCombustible, Permisos.Listar)]
        [HttpGet("Opciones")]
        public IActionResult Opciones()
        {
            var sesion = verificar.ObtenerSesion(); if (!sesion.Autenticado) return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
            var usuarios = dal.EjecutarReader("SELECT CodUsuario,Nombre FROM Usuario WHERE Estatus=1 ORDER BY Nombre", r => new { value = r["CodUsuario"].ToString(), text = r["Nombre"].ToString() });
            var menus = dal.EjecutarReader("SELECT CodMenu,Descripcion FROM Menu WHERE CodMenu IN(135,147,137,138,159,160,157,158,164,165,166,167,168,169,170,171) AND Estatus=1 ORDER BY Orden", r => new { value = r["CodMenu"].ToString(), text = r["Descripcion"].ToString() });
            return Ok(new { usuarios, menus });
        }

        [AuditoriaSistema, RequierePermiso(Menus.AutorizadoresCombustible, Permisos.Agregar)]
        [HttpPost("Asignar")]
        public IActionResult Asignar([FromBody] Asignacion dto)
        {
            var sesion = verificar.ObtenerSesion(); if (!sesion.Autenticado) return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
            if (string.IsNullOrWhiteSpace(dto.CodUsuario) || !Modulos.Contains(dto.CodMenu)) return BadRequest(new MsjDB { Estatus = false, Msj = "Usuario o módulo inválido." });
            string usuario = dto.CodUsuario.Replace("'", "''"); string actual = verificar.SesionUsuario().Replace("'", "");
            dal.Ejecutar("IF EXISTS(SELECT 1 FROM AutorizadorDocumentos WHERE CodUsuario=N'" + usuario + "' AND CodMenu=" + dto.CodMenu + ") UPDATE AutorizadorDocumentos SET Estatus=1,Version=Version+1,CodUsuarioActualizacion=N'" + actual + "',FechaActualizacion=GETDATE(),AccionLog='U' WHERE CodUsuario=N'" + usuario + "' AND CodMenu=" + dto.CodMenu + " ELSE INSERT INTO AutorizadorDocumentos(CodUsuario,CodMenu,Estatus,Version,CodUsuarioCreacion,FechaCreacion,AccionLog) VALUES(N'" + usuario + "'," + dto.CodMenu + ",1,1,N'" + actual + "',GETDATE(),'C')", Key: false, tipoDAL: TipoDAL.Agregar);
            return Ok(new MsjDB { Estatus = true, Msj = "Autorizador asignado." });
        }
        [AuditoriaSistema, RequierePermiso(Menus.AutorizacionesPendientes, Permisos.Listar)]
        [HttpGet("Pendientes")]
        public IActionResult Pendientes()
        {
            var sesion = verificar.ObtenerSesion(); if (!sesion.Autenticado) return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma)); string usuario = verificar.SesionUsuario().Replace("'", "");
            var datos = dal.EjecutarReader("SELECT A.CodMenu,A.CodDocumento,A.Estado,M.Descripcion AS Modulo FROM AutorizacionDocumento A INNER JOIN AutorizadorDocumentos AU ON AU.CodMenu=A.CodMenu AND AU.CodUsuario=N'" + usuario + "' AND AU.Estatus=1 INNER JOIN Menu M ON M.CodMenu=A.CodMenu WHERE A.Estatus=1 AND A.Estado=N'Pendiente' ORDER BY A.FechaCreacion DESC", r => new { codMenu = Convert.ToInt32(r["CodMenu"]), codDocumento = r["CodDocumento"].ToString(), estado = r["Estado"].ToString(), modulo = r["Modulo"].ToString() }); return Ok(datos);
        }

        [AuditoriaSistema, RequierePermiso(Menus.AutorizacionesPendientes, Permisos.Listar)]
        [HttpGet("Documento")]
        public IActionResult Documento([FromQuery] int codMenu, [FromQuery] string codDocumento)
        {
            var sesion = verificar.ObtenerSesion(); if (!sesion.Autenticado) return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
            if (!Modulos.Contains(codMenu) || !int.TryParse(codDocumento, out int codigo)) return BadRequest(new MsjDB { Estatus = false, Msj = "Documento inválido." });
            string usuario = verificar.SesionUsuario().Replace("'", "");
            if (!dal.EjecutarExiste("SELECT 1 FROM AutorizadorDocumentos WHERE CodUsuario=N'" + usuario + "' AND CodMenu=" + codMenu + " AND Estatus=1")) return Forbid();
            if (codMenu == (int)Menus.IngresoBarco)
            {
                var ingreso = dal.EjecutarReader("SELECT I.CodIngresoBarco AS Codigo,I.FechaIngreso AS Fecha,ISNULL(B.Barco,'') AS Barco,ISNULL(I.CodigoInterno,'') AS CodigoInterno,ISNULL(I.CorrelativoOTSA,'') AS CorrelativoOTSA FROM IngresoBarco I LEFT JOIN Barco B ON B.CodBarco=I.CodBarco WHERE I.CodIngresoBarco=" + codigo + " AND I.Estatus=1", r => new { codigo = Convert.ToInt32(r["Codigo"]), fecha = r["Fecha"], barco = r["Barco"].ToString(), codigoInterno = r["CodigoInterno"].ToString(), correlativoOTSA = r["CorrelativoOTSA"].ToString() }).FirstOrDefault();
                if (ingreso is null) return NotFound();
                var detalles = dal.EjecutarReader("SELECT D.Linea,ISNULL(S.Suplidor,'') AS Suplidor,ISNULL(P.Producto,'') AS Producto,D.CantidadEstandar,D.CantidadAmbiente FROM IngresoBarcoDetalle D LEFT JOIN Suplidor S ON S.CodSuplidor=D.CodSuplidor LEFT JOIN Producto P ON P.CodProducto=D.CodProducto WHERE D.CodIngresoBarco=" + codigo + " AND D.Estatus=1 ORDER BY D.Linea", r => new { linea = Convert.ToInt32(r["Linea"]), suplidor = r["Suplidor"].ToString(), producto = r["Producto"].ToString(), cantidadEstandar = Convert.ToDecimal(r["CantidadEstandar"]), cantidadAmbiente = Convert.ToDecimal(r["CantidadAmbiente"]) });
                return Ok(new { ingreso.codigo, ingreso.fecha, ingreso.barco, ingreso.codigoInterno, ingreso.correlativoOTSA, detalles });
            }
            string tabla = codMenu switch { 147 => "EntradasCombustible", 137 => "SalidasCombustible", 159 => "UnidadEntradaCombustible", 160 => "UnidadSalidaCombustible", 157 => "AjusteEntradaCombustible", 158 => "AjusteSalidaCombustible", _ => "" };
            string llave = codMenu switch { 147 => "CodEntradasCombustible", 137 => "CodSalidasCombustible", 159 => "CodUnidadEntradaCombustible", 160 => "CodUnidadSalidaCombustible", 157 => "CodAjusteEntradaCombustible", 158 => "CodAjusteSalidaCombustible", _ => "" };
            if (ObtenerDocumentoEtanol(codMenu, out string tablaEtanol, out string llaveEtanol, out _))
            {
                string suplidor = codMenu == 166 ? "N''" : "ISNULL(S.Suplidor,'')";
                string origen = codMenu == 166 ? "ISNULL(SO.Suplidor,'')" : "N''";
                string destino = codMenu == 166 ? "ISNULL(SD.Suplidor,'')" : "N''";
                string unidad = codMenu is 164 or 165 or 168 or 169 or 170 or 171 ? "ISNULL(A.SiglasUnidad,'')" : "N''";
                string joins = codMenu == 166 ? " LEFT JOIN Suplidor SO ON SO.CodSuplidor=A.CodSuplidorOrigen LEFT JOIN Suplidor SD ON SD.CodSuplidor=A.CodSuplidorDestino" : " LEFT JOIN Suplidor S ON S.CodSuplidor=A.CodSuplidor";
                var etanol = dal.EjecutarReader("SELECT A." + llaveEtanol + " AS Codigo,A.Fecha," + suplidor + " Suplidor," + origen + " SuplidorOrigen," + destino + " SuplidorDestino,ISNULL(P.Producto,'') Producto,A.CantidadEstandar,A.CantidadAmbiente," + unidad + " SiglasUnidad FROM " + tablaEtanol + " A" + joins + " LEFT JOIN Producto P ON P.CodProducto=A.CodProducto WHERE A." + llaveEtanol + "=" + codigo, r => new { codigo = Convert.ToInt32(r["Codigo"]), fecha = r["Fecha"], suplidor = r["Suplidor"].ToString(), suplidorOrigen = r["SuplidorOrigen"].ToString(), suplidorDestino = r["SuplidorDestino"].ToString(), producto = r["Producto"].ToString(), cantidadEstandar = Convert.ToDecimal(r["CantidadEstandar"]), cantidadAmbiente = Convert.ToDecimal(r["CantidadAmbiente"]), siglasUnidad = r["SiglasUnidad"].ToString() }).FirstOrDefault();
                return etanol is null ? NotFound() : Ok(etanol);
            }
            if (codMenu == 138)
            {
                var traslado = dal.EjecutarReader("SELECT A.CodCompraVentaSuplidoresCombustible AS Codigo,A.Fecha,ISNULL(SO.Suplidor,'') AS SuplidorOrigen,ISNULL(SD.Suplidor,'') AS SuplidorDestino,ISNULL(P.Producto,'') AS Producto,A.CantidadEstandar,A.CantidadAmbiente FROM CompraVentaSuplidoresCombustible A LEFT JOIN Suplidor SO ON SO.CodSuplidor=A.CodSuplidorOrigen LEFT JOIN Suplidor SD ON SD.CodSuplidor=A.CodSuplidorDestino LEFT JOIN Producto P ON P.CodProducto=A.CodProducto WHERE A.CodCompraVentaSuplidoresCombustible=" + codigo + " AND A.Estatus=1", r => new { codigo = Convert.ToInt32(r["Codigo"]), fecha = r["Fecha"], suplidorOrigen = r["SuplidorOrigen"].ToString(), suplidorDestino = r["SuplidorDestino"].ToString(), producto = r["Producto"].ToString(), cantidadEstandar = Convert.ToDecimal(r["CantidadEstandar"]), cantidadAmbiente = Convert.ToDecimal(r["CantidadAmbiente"]) }).FirstOrDefault();
                return traslado is null ? NotFound() : Ok(traslado);
            }
            var documento = dal.EjecutarReader("SELECT A." + llave + " AS Codigo,A.Fecha,ISNULL(S.Suplidor,'') AS Suplidor,ISNULL(P.Producto,'') AS Producto,A.CantidadEstandar,A.CantidadAmbiente,ISNULL(A.SiglasUnidad,'') AS SiglasUnidad FROM " + tabla + " A LEFT JOIN Suplidor S ON S.CodSuplidor=A.CodSuplidor LEFT JOIN Producto P ON P.CodProducto=A.CodProducto WHERE A." + llave + "=" + codigo + " AND A.Estatus=1", r => new { codigo = Convert.ToInt32(r["Codigo"]), fecha = r["Fecha"], suplidor = r["Suplidor"].ToString(), producto = r["Producto"].ToString(), cantidadEstandar = Convert.ToDecimal(r["CantidadEstandar"]), cantidadAmbiente = Convert.ToDecimal(r["CantidadAmbiente"]), siglasUnidad = r["SiglasUnidad"].ToString() }).FirstOrDefault();
            return documento is null ? NotFound() : Ok(documento);
        }
        [AuditoriaSistema, RequierePermiso(Menus.AutorizacionesPendientes, Permisos.Aprobar)]
        [HttpPost("Resolver")]
        public IActionResult Resolver([FromBody] Resolucion dto)
        {
            var sesion = verificar.ObtenerSesion(); if (!sesion.Autenticado) return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma)); if (!Modulos.Contains(dto.CodMenu) || string.IsNullOrWhiteSpace(dto.CodDocumento) || (dto.Estado != "Pendiente" && dto.Estado != "Aprobado" && dto.Estado != "Rechazado") || (dto.Estado != "Pendiente" && string.IsNullOrWhiteSpace(dto.Comentario))) return BadRequest(new MsjDB { Estatus = false, Msj = "Resolución y comentario son requeridos." }); string usuario = verificar.SesionUsuario().Replace("'", ""); string documento = dto.CodDocumento.Replace("'", "");
            if (!dal.EjecutarExiste("SELECT 1 FROM AutorizadorDocumentos WHERE CodUsuario=N'" + usuario + "' AND CodMenu=" + dto.CodMenu + " AND Estatus=1")) return Forbid();
            if (!dal.EjecutarExiste("SELECT 1 FROM AutorizacionDocumento WHERE CodMenu=" + dto.CodMenu + " AND CodDocumento=N'" + documento + "' AND Estatus=1 AND Estado=N'Pendiente'")) return BadRequest(new MsjDB { Estatus = false, Msj = "El documento ya fue autorizado, rechazado o no está pendiente." });
            if (dto.CodMenu == 135 && int.TryParse(documento, out int temporal) && temporal < 0 && dto.Estado != "Pendiente")
            {
                int original = -temporal;
                string movimiento = dto.Estado == "Aprobado"
                    ? "UPDATE I SET CodBarco=T.CodBarco,FechaIngreso=T.FechaIngreso,CodigoInterno=T.CodigoInterno,CorrelativoOTSA=T.CorrelativoOTSA,CodAutorizador=N'" + usuario + "',FechaAutorizacion=GETDATE(),ComentarioAutorizacion=N'" + (dto.Comentario ?? "").Replace("'", "") + "',Version=I.Version+1,CodUsuarioActualizacion=N'" + usuario + "',FechaActualizacion=GETDATE() FROM IngresoBarco I INNER JOIN IngresoBarco T ON T.CodIngresoBarco=" + temporal + " WHERE I.CodIngresoBarco=" + original + "; DELETE FROM IngresoBarcoDetalle WHERE CodIngresoBarco=" + original + "; INSERT INTO IngresoBarcoDetalle(CodIngresoBarco,Linea,CodSuplidor,CodProducto,CantidadEstandar,CantidadAmbiente) SELECT " + original + ",Linea,CodSuplidor,CodProducto,CantidadEstandar,CantidadAmbiente FROM IngresoBarcoDetalle WHERE CodIngresoBarco=" + temporal + "; DELETE FROM IngresoBarcoDetalle WHERE CodIngresoBarco=" + temporal + "; DELETE FROM IngresoBarco WHERE CodIngresoBarco=" + temporal + "; "
                    : "DELETE FROM IngresoBarcoDetalle WHERE CodIngresoBarco=" + temporal + "; DELETE FROM IngresoBarco WHERE CodIngresoBarco=" + temporal + "; ";
                var msjTemporal = dal.Ejecutar("BEGIN TRY BEGIN TRANSACTION; " + movimiento + "UPDATE AutorizacionDocumento SET Estado=N'" + dto.Estado + "',CodUsuarioAutorizacion=N'" + usuario + "',FechaAutorizacion=GETDATE(),ComentarioAutorizacion=N'" + (dto.Comentario ?? "").Replace("'", "") + "',Version=Version+1,CodUsuarioActualizacion=N'" + usuario + "',FechaActualizacion=GETDATE(),AccionLog='U' WHERE CodMenu=135 AND CodDocumento=N'" + documento + "' AND Estado=N'Pendiente'; COMMIT TRANSACTION; END TRY BEGIN CATCH IF @@TRANCOUNT>0 ROLLBACK TRANSACTION; THROW; END CATCH", Key: false, tipoDAL: TipoDAL.Editar);
                return Ok(msjTemporal);
            }
            if (int.TryParse(documento, out int codigoEtanol) && codigoEtanol < 0 && dto.Estado != "Pendiente" && ObtenerDocumentoEtanol(dto.CodMenu, out string tablaEtanol, out string llaveEtanol, out string columnasEtanol))
            {
                int original = -codigoEtanol;
                string comentario = (dto.Comentario ?? "").Replace("'", "");
                string aplicar = dto.Estado == "Aprobado"
                    ? "UPDATE O SET " + columnasEtanol + ",O.CodAutorizador=N'" + usuario + "',O.FechaAutorizacion=GETDATE(),O.ComentarioAutorizacion=N'" + comentario + "',O.Version=O.Version+1,O.CodUsuarioActualizacion=N'" + usuario + "',O.FechaActualizacion=GETDATE(),O.AccionLog='U' FROM " + tablaEtanol + " O INNER JOIN " + tablaEtanol + " T ON T." + llaveEtanol + "=" + codigoEtanol + " WHERE O." + llaveEtanol + "=" + original + "; DELETE FROM " + tablaEtanol + " WHERE " + llaveEtanol + "=" + codigoEtanol + ";"
                    : "DELETE FROM " + tablaEtanol + " WHERE " + llaveEtanol + "=" + codigoEtanol + ";";
                string sqlTemporal = "BEGIN TRY BEGIN TRANSACTION; UPDATE AutorizacionDocumento SET Estado=N'" + dto.Estado + "',CodUsuarioAutorizacion=N'" + usuario + "',FechaAutorizacion=GETDATE(),ComentarioAutorizacion=N'" + comentario + "',Version=Version+1,CodUsuarioActualizacion=N'" + usuario + "',FechaActualizacion=GETDATE(),AccionLog='U' WHERE CodMenu=" + dto.CodMenu + " AND CodDocumento=N'" + documento + "' AND Estado=N'Pendiente'; IF @@ROWCOUNT<>1 THROW 50001,'El documento ya fue resuelto.',1; " + aplicar + " COMMIT TRANSACTION; END TRY BEGIN CATCH IF @@TRANCOUNT>0 ROLLBACK TRANSACTION; THROW; END CATCH";
                return Ok(dal.Ejecutar(sqlTemporal, Key: false, tipoDAL: TipoDAL.Editar));
            }
            if (dto.Estado == "Aprobado" && int.TryParse(documento, out int codigo) && (ObtenerDocumentoEtanol(dto.CodMenu, out string tablaControl, out string llaveControl, out _) || ObtenerDocumentoCombustible(dto.CodMenu, out tablaControl, out llaveControl)))
            {
                string comentario = (dto.Comentario ?? "").Replace("'", "");
                string sql = "BEGIN TRY BEGIN TRANSACTION; UPDATE AutorizacionDocumento SET Estado=N'Aprobado',CodUsuarioAutorizacion=N'" + usuario + "',FechaAutorizacion=GETDATE(),ComentarioAutorizacion=N'" + comentario + "',Version=Version+1,CodUsuarioActualizacion=N'" + usuario + "',FechaActualizacion=GETDATE(),AccionLog='U' WHERE CodMenu=" + dto.CodMenu + " AND CodDocumento=N'" + documento + "' AND Estado=N'Pendiente'; IF @@ROWCOUNT<>1 THROW 50001,'El documento ya fue resuelto.',1; UPDATE " + tablaControl + " SET CodAutorizador=N'" + usuario + "',FechaAutorizacion=GETDATE(),ComentarioAutorizacion=N'" + comentario + "' WHERE " + llaveControl + "=" + codigo + "; COMMIT TRANSACTION; END TRY BEGIN CATCH IF @@TRANCOUNT>0 ROLLBACK TRANSACTION; THROW; END CATCH";
                return Ok(dal.Ejecutar(sql, Key: false, tipoDAL: TipoDAL.Editar));
            }
            var msj = dal.Ejecutar("UPDATE AutorizacionDocumento SET Estado=N'" + dto.Estado + "',CodUsuarioAutorizacion=" + (dto.Estado == "Pendiente" ? "NULL" : "N'" + usuario + "'") + ",FechaAutorizacion=" + (dto.Estado == "Pendiente" ? "NULL" : "GETDATE()") + ",ComentarioAutorizacion=N'" + (dto.Comentario ?? "").Replace("'", "") + "',Version=Version+1,CodUsuarioActualizacion=N'" + usuario + "',FechaActualizacion=GETDATE(),AccionLog='U' WHERE CodMenu=" + dto.CodMenu + " AND CodDocumento=N'" + documento + "' AND Estado=N'Pendiente'", Key: false, tipoDAL: TipoDAL.Editar); return Ok(msj);
        }
        private static bool ObtenerDocumentoEtanol(int menu, out string tabla, out string llave, out string columnas)
        {
            (tabla, llave, columnas) = menu switch
            {
                164 => ("EntradasEtanol", "CodEntradasEtanol", "O.Fecha=T.Fecha,O.CodSuplidor=T.CodSuplidor,O.CodProducto=T.CodProducto,O.CantidadEstandar=T.CantidadEstandar,O.CantidadAmbiente=T.CantidadAmbiente,O.SiglasUnidad=T.SiglasUnidad"),
                165 => ("SalidasEtanol", "CodSalidasEtanol", "O.Fecha=T.Fecha,O.CodSuplidor=T.CodSuplidor,O.CodProducto=T.CodProducto,O.CantidadEstandar=T.CantidadEstandar,O.CantidadAmbiente=T.CantidadAmbiente,O.SiglasUnidad=T.SiglasUnidad"),
                166 => ("CompraVentaSuplidoresEtanol", "CodCompraVentaSuplidoresEtanol", "O.Fecha=T.Fecha,O.CodSuplidorOrigen=T.CodSuplidorOrigen,O.CodSuplidorDestino=T.CodSuplidorDestino,O.CodProducto=T.CodProducto,O.CantidadEstandar=T.CantidadEstandar,O.CantidadAmbiente=T.CantidadAmbiente"),
                167 => ("IngresoTuberiasEtanol", "CodIngresoTuberiasEtanol", "O.Fecha=T.Fecha,O.CodSuplidor=T.CodSuplidor,O.CodBarco=T.CodBarco,O.CodProducto=T.CodProducto,O.CantidadEstandar=T.CantidadEstandar,O.CantidadAmbiente=T.CantidadAmbiente"),
                168 => ("UnidadEntradaEtanol", "CodUnidadEntradaEtanol", "O.Fecha=T.Fecha,O.CodSuplidor=T.CodSuplidor,O.CodProducto=T.CodProducto,O.CantidadEstandar=T.CantidadEstandar,O.CantidadAmbiente=T.CantidadAmbiente,O.SiglasUnidad=T.SiglasUnidad"),
                169 => ("UnidadSalidaEtanol", "CodUnidadSalidaEtanol", "O.Fecha=T.Fecha,O.CodSuplidor=T.CodSuplidor,O.CodProducto=T.CodProducto,O.CantidadEstandar=T.CantidadEstandar,O.CantidadAmbiente=T.CantidadAmbiente,O.SiglasUnidad=T.SiglasUnidad"),
                170 => ("AjusteEntradaEtanol", "CodAjusteEntradaEtanol", "O.Fecha=T.Fecha,O.CodSuplidor=T.CodSuplidor,O.CodProducto=T.CodProducto,O.CantidadEstandar=T.CantidadEstandar,O.CantidadAmbiente=T.CantidadAmbiente,O.SiglasUnidad=T.SiglasUnidad"),
                171 => ("AjusteSalidaEtanol", "CodAjusteSalidaEtanol", "O.Fecha=T.Fecha,O.CodSuplidor=T.CodSuplidor,O.CodProducto=T.CodProducto,O.CantidadEstandar=T.CantidadEstandar,O.CantidadAmbiente=T.CantidadAmbiente,O.SiglasUnidad=T.SiglasUnidad"),
                _ => ("", "", "")
            };
            return tabla.Length > 0;
        }
        private static bool ObtenerDocumentoCombustible(int menu, out string tabla, out string llave)
        {
            (tabla, llave) = menu switch
            {
                147 => ("EntradasCombustible", "CodEntradasCombustible"),
                137 => ("SalidasCombustible", "CodSalidasCombustible"),
                138 => ("CompraVentaSuplidoresCombustible", "CodCompraVentaSuplidoresCombustible"),
                157 => ("AjusteEntradaCombustible", "CodAjusteEntradaCombustible"),
                158 => ("AjusteSalidaCombustible", "CodAjusteSalidaCombustible"),
                159 => ("UnidadEntradaCombustible", "CodUnidadEntradaCombustible"),
                160 => ("UnidadSalidaCombustible", "CodUnidadSalidaCombustible"),
                _ => ("", "")
            };
            return tabla.Length > 0;
        }
        public class Asignacion { public string CodUsuario { get; set; } = ""; public int CodMenu { get; set; } }
        public class Resolucion { public int CodMenu { get; set; } public string CodDocumento { get; set; } = ""; public string Estado { get; set; } = ""; public string? Comentario { get; set; } }
    }
}
