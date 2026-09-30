using app.Models.LogModificaciones;
using app.Models.Paginacion;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.Data.SqlClient;
using System.Globalization;
using System.Text;

namespace app.Models.MedicionTanqueTierra
{
    /// <summary>
    /// DAO para el mantenimiento de mediciones de tanque en tierra.
    /// </summary>
    internal class MedicionTanqueTierraDAO
    {
        private readonly DAL ObjDAL = new DAL();
        private readonly Encriptacion ObjEncriptacion = new Encriptacion();

        internal PaginacionResultado<MedicionTanqueTierraDTO> Listado(int page = 1, int pageSize = 50, string search = "", string sort = "")
        {
            AsegurarTablas();
            PaginacionParametros paginacion = PaginacionParametros.Crear(page, pageSize, search, sort);
            int totalCount = 0;
            List<MedicionTanqueTierraDTO> items = ObjDAL.EjecutarReader(QueryListado(paginacion), reader =>
            {
                if (totalCount == 0)
                    totalCount = PaginacionSql.LeerTotal(reader);

                return MapMedicionTanqueTierra(reader);
            });

            return new PaginacionResultado<MedicionTanqueTierraDTO>(items, totalCount, paginacion.Page, paginacion.PageSize);
        }

        internal List<SelectListItem> Listar()
        {
            AsegurarTablas();
            return ObjDAL.EjecutarReader(Query(TipoDAL.Listar), reader => new SelectListItem()
            {
                Text = reader["Descripcion"].ToString(),
                Value = reader["CodMedicionTanqueTierra"].ToString()
            });
        }

        internal MedicionTanqueTierraDTO Obtener(int CodMedicionTanqueTierra)
        {
            AsegurarTablas();
            MedicionTanqueTierraDTO obj = ObjDAL
                .EjecutarReader(Query(TipoDAL.Obtener, CodKey: CodMedicionTanqueTierra), MapMedicionTanqueTierra)
                .FirstOrDefault()
                ?? new MedicionTanqueTierraDTO();

            if (obj.CodMedicionTanqueTierra > 0)
                obj.Detalles = ObtenerDetalles(CodMedicionTanqueTierra);

            return obj;
        }

        internal int ObtenerKey()
        {
            AsegurarTablas();
            return ObjDAL.EjecutarScalar(Query(TipoDAL.ObtenerKey), 1);
        }

        internal int ObtenerKeyDetalle()
        {
            AsegurarTablas();
            return ObjDAL.EjecutarScalar("SELECT ISNULL(MAX(A.[CodMedicionTanqueTierraDetalle]),0)+1 FROM MedicionTanqueTierraDetalle A", 1);
        }

        internal MsjDB Agregar(MedicionTanqueTierraDTO Obj)
        {
            MsjDB tablas = AsegurarTablas();
            if (!tablas.Estatus)
                return tablas;

            Obj.CodMedicionTanqueTierra = ObtenerKey();
            Obj.Version = 1;
            Obj.CodUsuarioCreacion = new VerificarUsuario().SesionUsuario();

            MsjDB validacion = PrepararMedicion(Obj);
            if (!validacion.Estatus)
                return validacion;

            MsjDB msjDB = ObjDAL.Ejecutar(Query(TipoDAL.Agregar, Obj: Obj), Key: false, tipoDAL: TipoDAL.Agregar);

            if (msjDB.Estatus == true)
            {
                LogModificacionDAO.Registrar("MedicionTanqueTierra", "CREADO", "CodMedicionTanqueTierra:" + Obj.CodMedicionTanqueTierra, Nuevo: Obj);
            }

            return msjDB;
        }

        internal MsjDB Editar(MedicionTanqueTierraDTO Obj)
        {
            AsegurarTablas();
            MedicionTanqueTierraDTO ObjAnterior = Obtener(Obj.CodMedicionTanqueTierra);
            if (ObjAnterior.CodMedicionTanqueTierra <= 0)
                return Error("Medicion de tanque en tierra no encontrada.");

            Obj.Version = ObtenerVersion(Obj.CodMedicionTanqueTierra);
            Obj.CodUsuarioActualizacion = new VerificarUsuario().SesionUsuario();

            MsjDB validacion = PrepararMedicion(Obj);
            if (!validacion.Estatus)
                return validacion;

            MsjDB msjDB = ObjDAL.Ejecutar(Query(TipoDAL.Editar, Obj: Obj), Key: false, tipoDAL: TipoDAL.Editar);

            if (msjDB.Estatus == true)
            {
                LogModificacionDAO.Registrar("MedicionTanqueTierra", "EDITADO", "CodMedicionTanqueTierra:" + Obj.CodMedicionTanqueTierra, Anterior: ObjAnterior, Nuevo: Obj);
            }

            return msjDB;
        }

        internal MsjDB Eliminar(MedicionTanqueTierraDTO Obj)
        {
            AsegurarTablas();
            MedicionTanqueTierraDTO ObjAnterior = Obtener(Obj.CodMedicionTanqueTierra);
            if (ObjAnterior.CodMedicionTanqueTierra <= 0)
                return Error("Medicion de tanque en tierra no encontrada.");

            Obj.Version = ObtenerVersion(Obj.CodMedicionTanqueTierra);
            Obj.CodUsuarioEliminacion = new VerificarUsuario().SesionUsuario();

            MsjDB msjDB = ObjDAL.Ejecutar(Query(TipoDAL.Eliminar, Obj: Obj), Key: false, tipoDAL: TipoDAL.Eliminar);

            if (msjDB.Estatus == true)
            {
                LogModificacionDAO.Registrar("MedicionTanqueTierra", "ELIMINADO", "CodMedicionTanqueTierra:" + Obj.CodMedicionTanqueTierra, Anterior: ObjAnterior);
            }

            return msjDB;
        }

        internal bool VerificarMedicion(MedicionTanqueTierraDTO Obj)
        {
            return ObjDAL.EjecutarExiste(Query(TipoDAL.Verificacion, Obj: Obj));
        }

        internal int ObtenerVersion(int CodMedicionTanqueTierra)
        {
            AsegurarTablas();
            return ObjDAL.EjecutarScalar(Query(TipoDAL.Version, CodKey: CodMedicionTanqueTierra), 1);
        }

        internal List<MedicionTanqueTierraDTO> Log(int CodMedicionTanqueTierra)
        {
            AsegurarTablas();
            return ObjDAL.EjecutarReader(Query(TipoDAL.Log, CodKey: CodMedicionTanqueTierra), MapMedicionTanqueTierraLog);
        }

        internal string Query(TipoDAL TipoDAL = TipoDAL.NoSeleccionado, int CodKey = 0, MedicionTanqueTierraDTO? Obj = null)
        {
            switch (TipoDAL)
            {
                case TipoDAL.Agregar:
                    return QueryAgregar(Obj!);
                case TipoDAL.Editar:
                    return QueryEditar(Obj!);
                case TipoDAL.Eliminar:
                    return QueryEliminar(Obj!);
                case TipoDAL.Listado:
                    return SelectBase();
                case TipoDAL.Listar:
                    return "SELECT A.[CodMedicionTanqueTierra], "
                        + "CONCAT(CONVERT(VARCHAR(10), A.[Fecha], 103), ' - ', ISNULL(B.[Barco], ''), ' - ', ISNULL(S.[Suplidor], '')) AS [Descripcion] "
                        + "FROM MedicionTanqueTierra A "
                        + "LEFT JOIN Barco B ON A.[CodBarco] = B.[CodBarco] "
                        + "LEFT JOIN Suplidor S ON A.[CodSuplidor] = S.[CodSuplidor] "
                        + "WHERE ISNULL(A.[Estatus], 1) = 1 "
                        + "ORDER BY A.[Fecha] DESC, A.[CodMedicionTanqueTierra] DESC";
                case TipoDAL.Obtener:
                    return SelectBase() + "WHERE A.[CodMedicionTanqueTierra]='" + CodKey + "' AND ISNULL(A.[Estatus], 1) = 1";
                case TipoDAL.ObtenerKey:
                    return "SELECT ISNULL(MAX(A.[CodMedicionTanqueTierra]),0)+1 as 'CodMedicionTanqueTierra' FROM MedicionTanqueTierra A";
                case TipoDAL.Verificacion:
                    return "SELECT 1 FROM MedicionTanqueTierra A "
                        + "WHERE A.[Fecha]=" + SqlFecha(Obj!.Fecha) + " "
                        + "AND A.[CodBarco]='" + Obj.CodBarco + "' "
                        + "AND A.[CodSuplidor]='" + Obj.CodSuplidor + "' "
                        + "AND A.[CodProducto]='" + Obj.CodProducto + "' "
                        + "AND A.[CodCompaniaInspeccion]='" + Obj.CodCompaniaInspeccion + "' "
                        + "AND A.[CodMedicionTanqueTierra] <> '" + Obj.CodMedicionTanqueTierra + "' "
                        + "AND ISNULL(A.[Estatus], 1) = 1";
                case TipoDAL.Version:
                    return "SELECT ISNULL(MAX(A.[Version]),0)+1 as 'Version' "
                        + "FROM (SELECT [CodMedicionTanqueTierra],[Version] FROM MedicionTanqueTierra_LOG UNION ALL SELECT [CodMedicionTanqueTierra],[Version] FROM MedicionTanqueTierra) A "
                        + "WHERE A.[CodMedicionTanqueTierra]='" + CodKey + "'";
                case TipoDAL.Log:
                    return "SELECT A.[CodMedicionTanqueTierra],A.[Fecha],"
                        + "A.[CodBarco],ISNULL(B.[Barco], '') AS [Barco],"
                        + "A.[CodSuplidor],ISNULL(S.[Suplidor], '') AS [Suplidor],"
                        + "A.[CodProducto],ISNULL(P.[Producto], '') AS [Producto],"
                        + "A.[CodCompaniaInspeccion],ISNULL(CI.[NombreComercial], '') AS [CompaniaInspeccion],"
                        + "0 AS [DetalleCantidad],CAST(0 AS DECIMAL(18,4)) AS [VolumenEstandarBrutoTotal],"
                        + "A.[Estatus],A.[Version],A.[CodUsuarioCreacion],A.[FechaCreacion],"
                        + "A.[CodUsuarioActualizacion],A.[FechaActualizacion],A.[CodUsuarioEliminacion],A.[FechaEliminacion],A.[AccionLog] "
                        + "FROM (SELECT * FROM MedicionTanqueTierra_LOG UNION ALL SELECT * FROM MedicionTanqueTierra) A "
                        + "LEFT JOIN Barco B ON A.[CodBarco] = B.[CodBarco] "
                        + "LEFT JOIN Suplidor S ON A.[CodSuplidor] = S.[CodSuplidor] "
                        + "LEFT JOIN Producto P ON A.[CodProducto] = P.[CodProducto] "
                        + "LEFT JOIN CompaniaInspeccion CI ON A.[CodCompaniaInspeccion] = CI.[CodCompaniaInspeccion] "
                        + "WHERE A.[CodMedicionTanqueTierra] = '" + CodKey + "' "
                        + "ORDER BY A.[Version]";
                default:
                    return "";
            }
        }

        private MsjDB PrepararMedicion(MedicionTanqueTierraDTO Obj)
        {
            if (!Obj.Fecha.HasValue)
                return Error("La fecha es requerida.");

            if (Obj.CodBarco <= 0)
                return Error("El barco es requerido.");

            if (Obj.CodSuplidor <= 0)
                return Error("El suplidor es requerido.");

            if (Obj.CodProducto <= 0)
                return Error("El producto es requerido.");

            if (Obj.CodCompaniaInspeccion <= 0)
                return Error("La compania de inspeccion es requerida.");

            if (!BarcoExiste(Obj.CodBarco))
                return Error("El barco seleccionado no existe.");

            if (!SocioExiste(Obj.CodSuplidor))
                return Error("El suplidor seleccionado no existe.");

            if (!ProductoExiste(Obj.CodProducto))
                return Error("El producto seleccionado no existe.");

            if (!CompaniaInspeccionExiste(Obj.CodCompaniaInspeccion))
                return Error("La compania de inspeccion seleccionada no existe.");

            Obj.Fecha = Obj.Fecha.Value.Date;

            if (VerificarMedicion(Obj))
                return Error("Ya existe una medicion de tanque en tierra con los mismos datos del encabezado.");

            if (Obj.Detalles == null || Obj.Detalles.Count == 0)
                return Error("Debe agregar al menos una fila al detalle.");

            int siguienteDetalle = ObtenerKeyDetalle();
            for (int index = 0; index < Obj.Detalles.Count; index++)
            {
                MedicionTanqueTierraDetalleDTO detalle = Obj.Detalles[index];
                detalle.CodMedicionTanqueTierra = Obj.CodMedicionTanqueTierra;
                detalle.CodMedicionTanqueTierraDetalle = siguienteDetalle++;
                detalle.Linea = index + 1;
                detalle.Tipo = (detalle.Tipo ?? "").Trim().ToUpperInvariant();
                detalle.Hora = (detalle.Hora ?? "").Trim();

                detalle.CodTanque = (detalle.CodTanque ?? "").Trim();

                if (string.IsNullOrWhiteSpace(detalle.CodTanque))
                    return Error("El tanque es requerido en todas las filas.");

                if (detalle.CodTanque.Length > 20)
                    return Error("El codigo del tanque no puede exceder 20 caracteres.");

                if (!TanqueExiste(detalle.CodTanque))
                    return Error("Uno de los tanques seleccionados no existe.");

                if (string.IsNullOrWhiteSpace(detalle.Tipo))
                    return Error("El tipo es requerido en todas las filas.");

                if (detalle.Tipo != "O" && detalle.Tipo != "C")
                    return Error("El tipo debe ser O o C en todas las filas.");

                if (!detalle.Fecha.HasValue)
                    return Error("La fecha es requerida en todas las filas.");

                detalle.Fecha = detalle.Fecha.Value.Date;

                if (!HoraValida(detalle.Hora))
                    return Error("La hora es requerida en formato HH:mm en todas las filas.");

                if (detalle.Pies < 0)
                    return Error("La medida del tanque en pies debe ser mayor o igual a cero.");

                if (detalle.Pulgadas < 0 || detalle.Pulgadas > 11)
                    return Error("La medida del tanque en pulgadas debe estar entre 0 y 11.");

                if (detalle.Dieciseisavos < 0 || detalle.Dieciseisavos > 15)
                    return Error("Los dieciseisavos de medida del tanque deben estar entre 0 y 15.");

                decimal? volumenCalibracion = ObtenerVolumenCalibracion(detalle.CodTanque, Obj.CodProducto, detalle.Pies, detalle.Pulgadas, detalle.Dieciseisavos);
                if (!volumenCalibracion.HasValue)
                    return Error("No existe una calibracion vigente para el tanque, producto y medida indicados.");

                detalle.Volumen = volumenCalibracion.Value;

                if (detalle.MedidaAguaPies < 0)
                    return Error("La medida de agua en pies debe ser mayor o igual a cero.");

                if (detalle.MedidaAguaPulgadas < 0 || detalle.MedidaAguaPulgadas > 11)
                    return Error("La medida de agua en pulgadas debe estar entre 0 y 11.");

                if (detalle.Volumen <= 0)
                    return Error("El total volumen debe ser mayor a cero en todas las filas.");

                if (detalle.VolumenAguaLibre < 0)
                    return Error("El volumen de agua libre debe ser mayor o igual a cero.");

                if (detalle.VolumenBrutoObservado <= 0)
                    return Error("El volumen bruto observado debe ser mayor a cero en todas las filas.");

                if (detalle.Temperatura <= 0)
                    return Error("La temperatura debe ser mayor a cero en todas las filas.");

                if (detalle.Api <= 0)
                    return Error("El API debe ser mayor a cero en todas las filas.");

                if (detalle.Factor <= 0)
                    return Error("El factor debe ser mayor a cero en todas las filas.");

                if (detalle.VolumenEstandarBruto <= 0)
                    return Error("El volumen estandar bruto debe ser mayor a cero en todas las filas.");
            }

            return Ok();
        }

        private string QueryAgregar(MedicionTanqueTierraDTO Obj)
        {
            string usuario = SqlTexto(Obj.CodUsuarioCreacion);
            StringBuilder query = new StringBuilder();
            query.Append("BEGIN TRY BEGIN TRANSACTION; ");
            query.Append("INSERT INTO MedicionTanqueTierra ")
                .Append("(CodMedicionTanqueTierra,Fecha,CodBarco,CodSuplidor,CodProducto,CodCompaniaInspeccion,Estatus,Version,CodUsuarioCreacion,FechaCreacion,AccionLog) VALUES('")
                .Append(Obj.CodMedicionTanqueTierra).Append("',")
                .Append(SqlFecha(Obj.Fecha)).Append(",'")
                .Append(Obj.CodBarco).Append("','")
                .Append(Obj.CodSuplidor).Append("','")
                .Append(Obj.CodProducto).Append("','")
                .Append(Obj.CodCompaniaInspeccion).Append("',1,1,'")
                .Append(usuario).Append("',GETDATE(),'C'); ");
            query.Append(QueryInsertarDetalles(Obj, usuario, 1, "C"));
            query.Append("COMMIT TRANSACTION; END TRY BEGIN CATCH IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION; THROW; END CATCH");
            return query.ToString();
        }

        private string QueryEditar(MedicionTanqueTierraDTO Obj)
        {
            string usuario = SqlTexto(Obj.CodUsuarioActualizacion);
            StringBuilder query = new StringBuilder();
            query.Append("BEGIN TRY BEGIN TRANSACTION; ");
            query.Append(QueryCopiarLogActual(Obj.CodMedicionTanqueTierra));
            query.Append("UPDATE MedicionTanqueTierra SET ")
                .Append("Fecha=").Append(SqlFecha(Obj.Fecha)).Append(",")
                .Append("CodBarco='").Append(Obj.CodBarco).Append("',")
                .Append("CodSuplidor='").Append(Obj.CodSuplidor).Append("',")
                .Append("CodProducto='").Append(Obj.CodProducto).Append("',")
                .Append("CodCompaniaInspeccion='").Append(Obj.CodCompaniaInspeccion).Append("',")
                .Append("Estatus=1,")
                .Append("Version=").Append(Obj.Version).Append(",")
                .Append("CodUsuarioActualizacion='").Append(usuario).Append("',")
                .Append("FechaActualizacion=GETDATE(),")
                .Append("AccionLog='U' ")
                .Append("WHERE CodMedicionTanqueTierra='").Append(Obj.CodMedicionTanqueTierra).Append("'; ");
            query.Append("DELETE FROM MedicionTanqueTierraDetalle WHERE CodMedicionTanqueTierra='").Append(Obj.CodMedicionTanqueTierra).Append("'; ");
            query.Append(QueryInsertarDetalles(Obj, usuario, Obj.Version, "U"));
            query.Append("COMMIT TRANSACTION; END TRY BEGIN CATCH IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION; THROW; END CATCH");
            return query.ToString();
        }

        private string QueryEliminar(MedicionTanqueTierraDTO Obj)
        {
            string usuario = SqlTexto(Obj.CodUsuarioEliminacion);
            StringBuilder query = new StringBuilder();
            query.Append("BEGIN TRY BEGIN TRANSACTION; ");
            query.Append("INSERT INTO MedicionTanqueTierra_LOG ")
                .Append("(CodMedicionTanqueTierra,Fecha,CodBarco,CodSuplidor,CodProducto,CodCompaniaInspeccion,Estatus,Version,CodUsuarioCreacion,FechaCreacion,CodUsuarioActualizacion,FechaActualizacion,CodUsuarioEliminacion,FechaEliminacion,AccionLog) ")
                .Append("SELECT CodMedicionTanqueTierra,Fecha,CodBarco,CodSuplidor,CodProducto,CodCompaniaInspeccion,CAST(0 AS BIT),")
                .Append(Obj.Version).Append(",CodUsuarioCreacion,FechaCreacion,CodUsuarioActualizacion,FechaActualizacion,'")
                .Append(usuario).Append("',GETDATE(),'D' ")
                .Append("FROM MedicionTanqueTierra WHERE CodMedicionTanqueTierra='").Append(Obj.CodMedicionTanqueTierra).Append("'; ");
            query.Append("INSERT INTO MedicionTanqueTierraDetalle_LOG ")
                .Append("(CodMedicionTanqueTierraDetalle,CodMedicionTanqueTierra,Linea,CodTanque,Tipo,Fecha,Hora,Pies,Pulgadas,Dieciseisavos,Volumen,CorreccionTecho,MedidaAguaPies,MedidaAguaPulgadas,VolumenAguaLibre,VolumenBrutoObservado,Temperatura,Api,Factor,VolumenEstandarBruto,Estatus,Version,CodUsuarioCreacion,FechaCreacion,CodUsuarioActualizacion,FechaActualizacion,CodUsuarioEliminacion,FechaEliminacion,AccionLog) ")
                .Append("SELECT CodMedicionTanqueTierraDetalle,CodMedicionTanqueTierra,Linea,CodTanque,Tipo,Fecha,Hora,Pies,Pulgadas,Dieciseisavos,Volumen,CorreccionTecho,MedidaAguaPies,MedidaAguaPulgadas,VolumenAguaLibre,VolumenBrutoObservado,Temperatura,Api,Factor,VolumenEstandarBruto,CAST(0 AS BIT),")
                .Append(Obj.Version).Append(",CodUsuarioCreacion,FechaCreacion,CodUsuarioActualizacion,FechaActualizacion,'")
                .Append(usuario).Append("',GETDATE(),'D' ")
                .Append("FROM MedicionTanqueTierraDetalle WHERE CodMedicionTanqueTierra='").Append(Obj.CodMedicionTanqueTierra).Append("'; ");
            query.Append("DELETE FROM MedicionTanqueTierraDetalle WHERE CodMedicionTanqueTierra='").Append(Obj.CodMedicionTanqueTierra).Append("'; ");
            query.Append("DELETE FROM MedicionTanqueTierra WHERE CodMedicionTanqueTierra='").Append(Obj.CodMedicionTanqueTierra).Append("'; ");
            query.Append("COMMIT TRANSACTION; END TRY BEGIN CATCH IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION; THROW; END CATCH");
            return query.ToString();
        }

        private string QueryCopiarLogActual(int CodMedicionTanqueTierra)
        {
            return "INSERT INTO MedicionTanqueTierra_LOG "
                + "(CodMedicionTanqueTierra,Fecha,CodBarco,CodSuplidor,CodProducto,CodCompaniaInspeccion,Estatus,Version,CodUsuarioCreacion,FechaCreacion,CodUsuarioActualizacion,FechaActualizacion,CodUsuarioEliminacion,FechaEliminacion,AccionLog) "
                + "SELECT CodMedicionTanqueTierra,Fecha,CodBarco,CodSuplidor,CodProducto,CodCompaniaInspeccion,Estatus,Version,CodUsuarioCreacion,FechaCreacion,CodUsuarioActualizacion,FechaActualizacion,CodUsuarioEliminacion,FechaEliminacion,AccionLog "
                + "FROM MedicionTanqueTierra WHERE CodMedicionTanqueTierra='" + CodMedicionTanqueTierra + "'; "
                + "INSERT INTO MedicionTanqueTierraDetalle_LOG "
                + "(CodMedicionTanqueTierraDetalle,CodMedicionTanqueTierra,Linea,CodTanque,Tipo,Fecha,Hora,Pies,Pulgadas,Dieciseisavos,Volumen,CorreccionTecho,MedidaAguaPies,MedidaAguaPulgadas,VolumenAguaLibre,VolumenBrutoObservado,Temperatura,Api,Factor,VolumenEstandarBruto,Estatus,Version,CodUsuarioCreacion,FechaCreacion,CodUsuarioActualizacion,FechaActualizacion,CodUsuarioEliminacion,FechaEliminacion,AccionLog) "
                + "SELECT CodMedicionTanqueTierraDetalle,CodMedicionTanqueTierra,Linea,CodTanque,Tipo,Fecha,Hora,Pies,Pulgadas,Dieciseisavos,Volumen,CorreccionTecho,MedidaAguaPies,MedidaAguaPulgadas,VolumenAguaLibre,VolumenBrutoObservado,Temperatura,Api,Factor,VolumenEstandarBruto,Estatus,Version,CodUsuarioCreacion,FechaCreacion,CodUsuarioActualizacion,FechaActualizacion,CodUsuarioEliminacion,FechaEliminacion,AccionLog "
                + "FROM MedicionTanqueTierraDetalle WHERE CodMedicionTanqueTierra='" + CodMedicionTanqueTierra + "'; ";
        }

        private string QueryInsertarDetalles(MedicionTanqueTierraDTO Obj, string usuario, int version, string accionLog)
        {
            if (Obj.Detalles.Count == 0)
                return "";

            List<string> values = Obj.Detalles.Select(detalle =>
                "('" + detalle.CodMedicionTanqueTierraDetalle + "','" + Obj.CodMedicionTanqueTierra + "','" + detalle.Linea + "',N'" + SqlTexto(detalle.CodTanque) + "','" + SqlTexto(detalle.Tipo) + "',"
                + SqlFecha(detalle.Fecha) + ","
                + SqlHora(detalle.Hora) + ",'"
                + detalle.Pies + "','"
                + detalle.Pulgadas + "','"
                + detalle.Dieciseisavos + "',"
                + SqlNumero(detalle.Volumen) + ","
                + SqlNumero(detalle.CorreccionTecho) + ",'"
                + detalle.MedidaAguaPies + "','"
                + detalle.MedidaAguaPulgadas + "',"
                + SqlNumero(detalle.VolumenAguaLibre) + ","
                + SqlNumero(detalle.VolumenBrutoObservado) + ","
                + SqlNumero(detalle.Temperatura) + ","
                + SqlNumero(detalle.Api) + ","
                + SqlNumero(detalle.Factor) + ","
                + SqlNumero(detalle.VolumenEstandarBruto) + ",1,"
                + version + ",'"
                + usuario + "',GETDATE(),'"
                + SqlTexto(accionLog) + "')"
            ).ToList();

            return "INSERT INTO MedicionTanqueTierraDetalle "
                + "(CodMedicionTanqueTierraDetalle,CodMedicionTanqueTierra,Linea,CodTanque,Tipo,Fecha,Hora,Pies,Pulgadas,Dieciseisavos,Volumen,CorreccionTecho,MedidaAguaPies,MedidaAguaPulgadas,VolumenAguaLibre,VolumenBrutoObservado,Temperatura,Api,Factor,VolumenEstandarBruto,Estatus,Version,CodUsuarioCreacion,FechaCreacion,AccionLog) VALUES "
                + string.Join(",", values) + "; ";
        }

        private string SelectBase()
        {
            return "SELECT A.[CodMedicionTanqueTierra],A.[Fecha],"
                + "A.[CodBarco],ISNULL(B.[Barco], '') AS [Barco],"
                + "A.[CodSuplidor],ISNULL(S.[Suplidor], '') AS [Suplidor],"
                + "A.[CodProducto],ISNULL(P.[Producto], '') AS [Producto],"
                + "A.[CodCompaniaInspeccion],ISNULL(CI.[NombreComercial], '') AS [CompaniaInspeccion],"
                + "ISNULL(A.[Estatus], 1) AS [Estatus],"
                + "(SELECT COUNT(1) FROM MedicionTanqueTierraDetalle D WHERE D.[CodMedicionTanqueTierra] = A.[CodMedicionTanqueTierra] AND ISNULL(D.[Estatus], 1) = 1) AS [DetalleCantidad],"
                + "(SELECT ISNULL(SUM(D.[VolumenEstandarBruto]),0) FROM MedicionTanqueTierraDetalle D WHERE D.[CodMedicionTanqueTierra] = A.[CodMedicionTanqueTierra] AND ISNULL(D.[Estatus], 1) = 1) AS [VolumenEstandarBrutoTotal] "
                + "FROM MedicionTanqueTierra A "
                + "LEFT JOIN Barco B ON A.[CodBarco] = B.[CodBarco] "
                + "LEFT JOIN Suplidor S ON A.[CodSuplidor] = S.[CodSuplidor] "
                + "LEFT JOIN Producto P ON A.[CodProducto] = P.[CodProducto] "
                + "LEFT JOIN CompaniaInspeccion CI ON A.[CodCompaniaInspeccion] = CI.[CodCompaniaInspeccion] ";
        }

        private string QueryListado(PaginacionParametros paginacion)
        {
            Dictionary<string, string> sortColumns = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["codMedicionTanqueTierra"] = "A.[CodMedicionTanqueTierra]",
                ["fecha"] = "A.[Fecha]",
                ["barco"] = "B.[Barco]",
                ["suplidor"] = "S.[Suplidor]",
                ["producto"] = "P.[Producto]",
                ["companiaInspeccion"] = "CI.[NombreComercial]",
                ["detalleCantidad"] = "DetalleCantidad",
                ["volumenEstandarBrutoTotal"] = "VolumenEstandarBrutoTotal"
            };
            string where = "WHERE ISNULL(A.[Estatus], 1) = 1 "
                + PaginacionSql.WhereBusqueda(paginacion.Search, new[]
                {
                    "CONVERT(VARCHAR(20), A.[CodMedicionTanqueTierra])",
                    "CONVERT(VARCHAR(10), A.[Fecha], 103)",
                    "B.[Barco]",
                    "S.[Suplidor]",
                    "P.[Producto]",
                    "CI.[NombreComercial]"
                });
            string orderBy = PaginacionSql.OrderBy(paginacion.Sort, sortColumns, "A.[Fecha] DESC, A.[CodMedicionTanqueTierra] DESC");

            return "SELECT A.[CodMedicionTanqueTierra],A.[Fecha],"
                + "A.[CodBarco],ISNULL(B.[Barco], '') AS [Barco],"
                + "A.[CodSuplidor],ISNULL(S.[Suplidor], '') AS [Suplidor],"
                + "A.[CodProducto],ISNULL(P.[Producto], '') AS [Producto],"
                + "A.[CodCompaniaInspeccion],ISNULL(CI.[NombreComercial], '') AS [CompaniaInspeccion],"
                + "ISNULL(A.[Estatus], 1) AS [Estatus],"
                + "(SELECT COUNT(1) FROM MedicionTanqueTierraDetalle D WHERE D.[CodMedicionTanqueTierra] = A.[CodMedicionTanqueTierra] AND ISNULL(D.[Estatus], 1) = 1) AS [DetalleCantidad],"
                + "(SELECT ISNULL(SUM(D.[VolumenEstandarBruto]),0) FROM MedicionTanqueTierraDetalle D WHERE D.[CodMedicionTanqueTierra] = A.[CodMedicionTanqueTierra] AND ISNULL(D.[Estatus], 1) = 1) AS [VolumenEstandarBrutoTotal],"
                + "COUNT(1) OVER() AS [" + PaginacionSql.TotalRegistrosAlias + "] "
                + "FROM MedicionTanqueTierra A "
                + "LEFT JOIN Barco B ON A.[CodBarco] = B.[CodBarco] "
                + "LEFT JOIN Suplidor S ON A.[CodSuplidor] = S.[CodSuplidor] "
                + "LEFT JOIN Producto P ON A.[CodProducto] = P.[CodProducto] "
                + "LEFT JOIN CompaniaInspeccion CI ON A.[CodCompaniaInspeccion] = CI.[CodCompaniaInspeccion] "
                + where
                + "ORDER BY " + orderBy
                + PaginacionSql.OffsetFetch(paginacion);
        }

        private List<MedicionTanqueTierraDetalleDTO> ObtenerDetalles(int CodMedicionTanqueTierra)
        {
            return ObjDAL.EjecutarReader(QueryDetalles(CodMedicionTanqueTierra), MapDetalle);
        }

        private string QueryDetalles(int CodMedicionTanqueTierra)
        {
            return "SELECT A.[CodMedicionTanqueTierraDetalle],A.[CodMedicionTanqueTierra],A.[Linea],"
                + "A.[CodTanque],ISNULL(T.[Tanque], '') AS [Tanque],A.[Tipo],A.[Fecha],A.[Hora],"
                + "A.[Pies],A.[Pulgadas],A.[Dieciseisavos],"
                + "A.[Volumen],A.[CorreccionTecho],A.[MedidaAguaPies],A.[MedidaAguaPulgadas],"
                + "A.[VolumenAguaLibre],A.[VolumenBrutoObservado],A.[Temperatura],A.[Api],A.[Factor],A.[VolumenEstandarBruto] "
                + "FROM MedicionTanqueTierraDetalle A "
                + "LEFT JOIN Tanque T ON A.[CodTanque] = T.[CodTanque] "
                + "WHERE A.[CodMedicionTanqueTierra]='" + CodMedicionTanqueTierra + "' AND ISNULL(A.[Estatus], 1) = 1 "
                + "ORDER BY A.[Linea]";
        }

        private bool BarcoExiste(int CodBarco)
        {
            return ObjDAL.EjecutarExiste("SELECT 1 FROM Barco A WHERE A.[CodBarco]='" + CodBarco + "'");
        }

        private bool SocioExiste(int CodSuplidor)
        {
            return ObjDAL.EjecutarExiste("SELECT 1 FROM Suplidor A WHERE A.[CodSuplidor]='" + CodSuplidor + "'");
        }

        private bool ProductoExiste(int CodProducto)
        {
            return ObjDAL.EjecutarExiste("SELECT 1 FROM Producto A WHERE A.[CodProducto]='" + CodProducto + "'");
        }

        private bool CompaniaInspeccionExiste(int CodCompaniaInspeccion)
        {
            return ObjDAL.EjecutarExiste("SELECT 1 FROM CompaniaInspeccion A WHERE A.[CodCompaniaInspeccion]='" + CodCompaniaInspeccion + "'");
        }

        private bool TanqueExiste(string CodTanque)
        {
            return ObjDAL.EjecutarExiste("SELECT 1 FROM Tanque A WHERE A.[CodTanque]=N'" + SqlTexto(CodTanque) + "'");
        }

        internal decimal? ObtenerVolumenCalibracion(string codTanque, int codProducto, int pies, int pulgadas, int dieciseisavos)
        {
            string query = "SELECT TOP 1 D.[Volumen] FROM CapacidadVolumetricaTanque C "
                + "INNER JOIN CapacidadVolumetricaTanqueDetalle D ON D.[CodCapacidadVolumetricaTanque] = C.[CodCapacidadVolumetricaTanque] "
                + "WHERE C.[CodTanque] = N'" + SqlTexto(codTanque) + "' "
                + "AND C.[CodProducto] = '" + codProducto + "' AND ISNULL(C.[EsActual], 0) = 1 AND ISNULL(C.[Estatus], 1) = 1 "
                + "AND D.[Pies] = '" + pies + "' AND D.[Pulgadas] = '" + pulgadas + "' "
                + "AND D.[Dieciseisavos] = '" + dieciseisavos + "' AND ISNULL(D.[Estatus], 1) = 1 "
                + "ORDER BY C.[FechaCalibracion] DESC, C.[CodCapacidadVolumetricaTanque] DESC";
            return ObjDAL.EjecutarScalar<decimal?>(query, null);
        }

        private bool ExisteTabla(string tabla)
        {
            return ObjDAL.EjecutarExiste("SELECT 1 FROM sys.tables WHERE object_id = OBJECT_ID('dbo." + SqlTexto(tabla) + "')");
        }

        private MsjDB AsegurarTablas()
        {
            MsjDB resultado = ObjDAL.Ejecutar(QueryCrearTablas(), Key: false);
            return resultado.Estatus
                ? Ok()
                : Error("No fue posible crear las tablas de medicion de tanque en tierra.");
        }

        private string QueryCrearTablas()
        {
            return "IF OBJECT_ID('dbo.MedicionTanqueTierra', 'U') IS NULL "
                + "BEGIN CREATE TABLE dbo.MedicionTanqueTierra ("
                + "CodMedicionTanqueTierra INT NOT NULL,"
                + "Fecha DATETIME NOT NULL,"
                + "CodBarco INT NOT NULL,"
                + "CodSuplidor INT NOT NULL,"
                + "CodProducto INT NOT NULL,"
                + "CodCompaniaInspeccion INT NOT NULL,"
                + "Estatus BIT NOT NULL CONSTRAINT DF_MedicionTanqueTierra_Estatus DEFAULT(1),"
                + "Version INT NOT NULL CONSTRAINT DF_MedicionTanqueTierra_Version DEFAULT(1),"
                + "CodUsuarioCreacion NVARCHAR(450) NULL,"
                + "FechaCreacion DATETIME NULL,"
                + "CodUsuarioActualizacion NVARCHAR(450) NULL,"
                + "FechaActualizacion DATETIME NULL,"
                + "CodUsuarioEliminacion NVARCHAR(450) NULL,"
                + "FechaEliminacion DATETIME NULL,"
                + "AccionLog NVARCHAR(1) NOT NULL CONSTRAINT DF_MedicionTanqueTierra_AccionLog DEFAULT('C'),"
                + "CONSTRAINT PK_MedicionTanqueTierra PRIMARY KEY CLUSTERED (CodMedicionTanqueTierra ASC)"
                + "); END; "
                + "IF OBJECT_ID('dbo.MedicionTanqueTierra_LOG', 'U') IS NULL "
                + "BEGIN CREATE TABLE dbo.MedicionTanqueTierra_LOG ("
                + "CodMedicionTanqueTierra INT NOT NULL,"
                + "Fecha DATETIME NOT NULL,"
                + "CodBarco INT NOT NULL,"
                + "CodSuplidor INT NOT NULL,"
                + "CodProducto INT NOT NULL,"
                + "CodCompaniaInspeccion INT NOT NULL,"
                + "Estatus BIT NOT NULL,"
                + "Version INT NOT NULL,"
                + "CodUsuarioCreacion NVARCHAR(450) NULL,"
                + "FechaCreacion DATETIME NULL,"
                + "CodUsuarioActualizacion NVARCHAR(450) NULL,"
                + "FechaActualizacion DATETIME NULL,"
                + "CodUsuarioEliminacion NVARCHAR(450) NULL,"
                + "FechaEliminacion DATETIME NULL,"
                + "AccionLog NVARCHAR(1) NOT NULL"
                + "); END; "
                + "IF OBJECT_ID('dbo.MedicionTanqueTierraDetalle', 'U') IS NULL "
                + "BEGIN CREATE TABLE dbo.MedicionTanqueTierraDetalle ("
                + "CodMedicionTanqueTierraDetalle INT NOT NULL,"
                + "CodMedicionTanqueTierra INT NOT NULL,"
                + "Linea INT NOT NULL,"
                + "CodTanque NVARCHAR(20) NOT NULL,"
                + "Tipo NVARCHAR(1) NOT NULL,"
                + "Fecha DATETIME NOT NULL,"
                + "Hora TIME NOT NULL,"
                + "Pies INT NOT NULL CONSTRAINT DF_MedicionTanqueTierraDetalle_Pies DEFAULT(0),"
                + "Pulgadas INT NOT NULL CONSTRAINT DF_MedicionTanqueTierraDetalle_Pulgadas DEFAULT(0),"
                + "Dieciseisavos INT NOT NULL CONSTRAINT DF_MedicionTanqueTierraDetalle_Dieciseisavos DEFAULT(0),"
                + "Volumen DECIMAL(18,4) NOT NULL CONSTRAINT DF_MedicionTanqueTierraDetalle_Volumen DEFAULT(0),"
                + "CorreccionTecho DECIMAL(18,4) NOT NULL CONSTRAINT DF_MedicionTanqueTierraDetalle_CorreccionTecho DEFAULT(0),"
                + "MedidaAguaPies INT NOT NULL CONSTRAINT DF_MedicionTanqueTierraDetalle_MedidaAguaPies DEFAULT(0),"
                + "MedidaAguaPulgadas INT NOT NULL CONSTRAINT DF_MedicionTanqueTierraDetalle_MedidaAguaPulgadas DEFAULT(0),"
                + "VolumenAguaLibre DECIMAL(18,4) NOT NULL CONSTRAINT DF_MedicionTanqueTierraDetalle_VolumenAguaLibre DEFAULT(0),"
                + "VolumenBrutoObservado DECIMAL(18,4) NOT NULL CONSTRAINT DF_MedicionTanqueTierraDetalle_VolumenBrutoObservado DEFAULT(0),"
                + "Temperatura DECIMAL(18,4) NOT NULL CONSTRAINT DF_MedicionTanqueTierraDetalle_Temperatura DEFAULT(0),"
                + "Api DECIMAL(18,4) NOT NULL CONSTRAINT DF_MedicionTanqueTierraDetalle_Api DEFAULT(0),"
                + "Factor DECIMAL(18,8) NOT NULL CONSTRAINT DF_MedicionTanqueTierraDetalle_Factor DEFAULT(0),"
                + "VolumenEstandarBruto DECIMAL(18,4) NOT NULL CONSTRAINT DF_MedicionTanqueTierraDetalle_VolumenEstandarBruto DEFAULT(0),"
                + "Estatus BIT NOT NULL CONSTRAINT DF_MedicionTanqueTierraDetalle_Estatus DEFAULT(1),"
                + "Version INT NOT NULL CONSTRAINT DF_MedicionTanqueTierraDetalle_Version DEFAULT(1),"
                + "CodUsuarioCreacion NVARCHAR(450) NULL,"
                + "FechaCreacion DATETIME NULL,"
                + "CodUsuarioActualizacion NVARCHAR(450) NULL,"
                + "FechaActualizacion DATETIME NULL,"
                + "CodUsuarioEliminacion NVARCHAR(450) NULL,"
                + "FechaEliminacion DATETIME NULL,"
                + "AccionLog NVARCHAR(1) NOT NULL CONSTRAINT DF_MedicionTanqueTierraDetalle_AccionLog DEFAULT('C'),"
                + "CONSTRAINT PK_MedicionTanqueTierraDetalle PRIMARY KEY CLUSTERED (CodMedicionTanqueTierraDetalle ASC)"
                + "); END; "
                + "IF OBJECT_ID('dbo.MedicionTanqueTierraDetalle_LOG', 'U') IS NULL "
                + "BEGIN CREATE TABLE dbo.MedicionTanqueTierraDetalle_LOG ("
                + "CodMedicionTanqueTierraDetalle INT NOT NULL,"
                + "CodMedicionTanqueTierra INT NOT NULL,"
                + "Linea INT NOT NULL,"
                + "CodTanque NVARCHAR(20) NOT NULL,"
                + "Tipo NVARCHAR(1) NOT NULL,"
                + "Fecha DATETIME NOT NULL,"
                + "Hora TIME NOT NULL,"
                + "Pies INT NOT NULL,"
                + "Pulgadas INT NOT NULL,"
                + "Dieciseisavos INT NOT NULL,"
                + "Volumen DECIMAL(18,4) NOT NULL,"
                + "CorreccionTecho DECIMAL(18,4) NOT NULL,"
                + "MedidaAguaPies INT NOT NULL,"
                + "MedidaAguaPulgadas INT NOT NULL,"
                + "VolumenAguaLibre DECIMAL(18,4) NOT NULL,"
                + "VolumenBrutoObservado DECIMAL(18,4) NOT NULL,"
                + "Temperatura DECIMAL(18,4) NOT NULL,"
                + "Api DECIMAL(18,4) NOT NULL,"
                + "Factor DECIMAL(18,8) NOT NULL,"
                + "VolumenEstandarBruto DECIMAL(18,4) NOT NULL,"
                + "Estatus BIT NOT NULL,"
                + "Version INT NOT NULL,"
                + "CodUsuarioCreacion NVARCHAR(450) NULL,"
                + "FechaCreacion DATETIME NULL,"
                + "CodUsuarioActualizacion NVARCHAR(450) NULL,"
                + "FechaActualizacion DATETIME NULL,"
                + "CodUsuarioEliminacion NVARCHAR(450) NULL,"
                + "FechaEliminacion DATETIME NULL,"
                + "AccionLog NVARCHAR(1) NOT NULL"
                + "); END; "
                + "IF OBJECT_ID('dbo.MedicionTanqueTierraDetalle', 'U') IS NOT NULL AND COL_LENGTH('dbo.MedicionTanqueTierraDetalle', 'Tipo') IS NULL "
                + "ALTER TABLE dbo.MedicionTanqueTierraDetalle ADD Tipo NVARCHAR(1) NULL; "
                + "IF OBJECT_ID('dbo.MedicionTanqueTierraDetalle', 'U') IS NOT NULL AND COL_LENGTH('dbo.MedicionTanqueTierraDetalle', 'Fecha') IS NULL "
                + "ALTER TABLE dbo.MedicionTanqueTierraDetalle ADD Fecha DATETIME NULL; "
                + "IF OBJECT_ID('dbo.MedicionTanqueTierraDetalle', 'U') IS NOT NULL AND COL_LENGTH('dbo.MedicionTanqueTierraDetalle', 'Hora') IS NULL "
                + "ALTER TABLE dbo.MedicionTanqueTierraDetalle ADD Hora TIME NULL; "
                + "IF OBJECT_ID('dbo.MedicionTanqueTierraDetalle', 'U') IS NOT NULL AND COL_LENGTH('dbo.MedicionTanqueTierraDetalle', 'SiOC') IS NOT NULL "
                + "EXEC('ALTER TABLE dbo.MedicionTanqueTierraDetalle ALTER COLUMN SiOC NVARCHAR(10) NULL'); "
                + "IF OBJECT_ID('dbo.MedicionTanqueTierraDetalle', 'U') IS NOT NULL AND COL_LENGTH('dbo.MedicionTanqueTierraDetalle', 'FechaHora') IS NOT NULL "
                + "EXEC('ALTER TABLE dbo.MedicionTanqueTierraDetalle ALTER COLUMN FechaHora DATETIME NULL'); "
                + "IF OBJECT_ID('dbo.MedicionTanqueTierraDetalle_LOG', 'U') IS NOT NULL AND COL_LENGTH('dbo.MedicionTanqueTierraDetalle_LOG', 'Tipo') IS NULL "
                + "ALTER TABLE dbo.MedicionTanqueTierraDetalle_LOG ADD Tipo NVARCHAR(1) NULL; "
                + "IF OBJECT_ID('dbo.MedicionTanqueTierraDetalle_LOG', 'U') IS NOT NULL AND COL_LENGTH('dbo.MedicionTanqueTierraDetalle_LOG', 'Fecha') IS NULL "
                + "ALTER TABLE dbo.MedicionTanqueTierraDetalle_LOG ADD Fecha DATETIME NULL; "
                + "IF OBJECT_ID('dbo.MedicionTanqueTierraDetalle_LOG', 'U') IS NOT NULL AND COL_LENGTH('dbo.MedicionTanqueTierraDetalle_LOG', 'Hora') IS NULL "
                + "ALTER TABLE dbo.MedicionTanqueTierraDetalle_LOG ADD Hora TIME NULL; "
                + "IF OBJECT_ID('dbo.MedicionTanqueTierraDetalle_LOG', 'U') IS NOT NULL AND COL_LENGTH('dbo.MedicionTanqueTierraDetalle_LOG', 'SiOC') IS NOT NULL "
                + "EXEC('ALTER TABLE dbo.MedicionTanqueTierraDetalle_LOG ALTER COLUMN SiOC NVARCHAR(10) NULL'); "
                + "IF OBJECT_ID('dbo.MedicionTanqueTierraDetalle_LOG', 'U') IS NOT NULL AND COL_LENGTH('dbo.MedicionTanqueTierraDetalle_LOG', 'FechaHora') IS NOT NULL "
                + "EXEC('ALTER TABLE dbo.MedicionTanqueTierraDetalle_LOG ALTER COLUMN FechaHora DATETIME NULL'); "
                + "IF OBJECT_ID('dbo.MedicionTanqueTierraDetalle', 'U') IS NOT NULL AND COL_LENGTH('dbo.MedicionTanqueTierraDetalle', 'SiOC') IS NOT NULL "
                + "EXEC('UPDATE dbo.MedicionTanqueTierraDetalle SET Tipo = CASE WHEN UPPER(ISNULL(CONVERT(NVARCHAR(10), SiOC), '''')) = ''C'' THEN ''C'' ELSE ''O'' END WHERE Tipo IS NULL OR Tipo = '''''); "
                + "IF OBJECT_ID('dbo.MedicionTanqueTierraDetalle', 'U') IS NOT NULL AND COL_LENGTH('dbo.MedicionTanqueTierraDetalle', 'FechaHora') IS NOT NULL "
                + "EXEC('UPDATE dbo.MedicionTanqueTierraDetalle SET Fecha = CONVERT(DATETIME, CONVERT(DATE, FechaHora)), Hora = CONVERT(TIME, FechaHora) WHERE Fecha IS NULL OR Hora IS NULL'); "
                + "IF OBJECT_ID('dbo.MedicionTanqueTierraDetalle', 'U') IS NOT NULL "
                + "EXEC('UPDATE dbo.MedicionTanqueTierraDetalle SET Tipo = ISNULL(NULLIF(Tipo, ''''), ''O''), Fecha = ISNULL(Fecha, CONVERT(DATETIME, CONVERT(DATE, GETDATE()))), Hora = ISNULL(Hora, CONVERT(TIME, ''00:00'')) WHERE Tipo IS NULL OR Tipo = '''' OR Fecha IS NULL OR Hora IS NULL'); "
                + "IF OBJECT_ID('dbo.MedicionTanqueTierraDetalle_LOG', 'U') IS NOT NULL AND COL_LENGTH('dbo.MedicionTanqueTierraDetalle_LOG', 'SiOC') IS NOT NULL "
                + "EXEC('UPDATE dbo.MedicionTanqueTierraDetalle_LOG SET Tipo = CASE WHEN UPPER(ISNULL(CONVERT(NVARCHAR(10), SiOC), '''')) = ''C'' THEN ''C'' ELSE ''O'' END WHERE Tipo IS NULL OR Tipo = '''''); "
                + "IF OBJECT_ID('dbo.MedicionTanqueTierraDetalle_LOG', 'U') IS NOT NULL AND COL_LENGTH('dbo.MedicionTanqueTierraDetalle_LOG', 'FechaHora') IS NOT NULL "
                + "EXEC('UPDATE dbo.MedicionTanqueTierraDetalle_LOG SET Fecha = CONVERT(DATETIME, CONVERT(DATE, FechaHora)), Hora = CONVERT(TIME, FechaHora) WHERE Fecha IS NULL OR Hora IS NULL'); "
                + "IF OBJECT_ID('dbo.MedicionTanqueTierraDetalle_LOG', 'U') IS NOT NULL "
                + "EXEC('UPDATE dbo.MedicionTanqueTierraDetalle_LOG SET Tipo = ISNULL(NULLIF(Tipo, ''''), ''O''), Fecha = ISNULL(Fecha, CONVERT(DATETIME, CONVERT(DATE, GETDATE()))), Hora = ISNULL(Hora, CONVERT(TIME, ''00:00'')) WHERE Tipo IS NULL OR Tipo = '''' OR Fecha IS NULL OR Hora IS NULL'); "
                + "IF COL_LENGTH('dbo.MedicionTanqueTierraDetalle', 'MedidaTanqueFraccionDenominador') IS NOT NULL BEGIN DECLARE @DFDetalle SYSNAME; SELECT @DFDetalle = dc.name FROM sys.default_constraints dc INNER JOIN sys.columns c ON c.default_object_id = dc.object_id WHERE c.object_id = OBJECT_ID('dbo.MedicionTanqueTierraDetalle') AND c.name = 'MedidaTanqueFraccionDenominador'; IF @DFDetalle IS NOT NULL EXEC('ALTER TABLE dbo.MedicionTanqueTierraDetalle DROP CONSTRAINT [' + @DFDetalle + ']'); ALTER TABLE dbo.MedicionTanqueTierraDetalle DROP COLUMN MedidaTanqueFraccionDenominador; END; "
                + "IF COL_LENGTH('dbo.MedicionTanqueTierraDetalle_LOG', 'MedidaTanqueFraccionDenominador') IS NOT NULL ALTER TABLE dbo.MedicionTanqueTierraDetalle_LOG DROP COLUMN MedidaTanqueFraccionDenominador; "
                + "IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('dbo.MedicionTanqueTierraDetalle') AND name = 'IX_MedicionTanqueTierraDetalle_Encabezado') "
                + "CREATE INDEX IX_MedicionTanqueTierraDetalle_Encabezado ON dbo.MedicionTanqueTierraDetalle(CodMedicionTanqueTierra, Estatus); "
                + "IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('dbo.MedicionTanqueTierra_LOG') AND name = 'IX_MedicionTanqueTierra_LOG_Codigo') "
                + "CREATE INDEX IX_MedicionTanqueTierra_LOG_Codigo ON dbo.MedicionTanqueTierra_LOG(CodMedicionTanqueTierra, Version); "
                + "IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('dbo.MedicionTanqueTierraDetalle_LOG') AND name = 'IX_MedicionTanqueTierraDetalle_LOG_Encabezado') "
                + "CREATE INDEX IX_MedicionTanqueTierraDetalle_LOG_Encabezado ON dbo.MedicionTanqueTierraDetalle_LOG(CodMedicionTanqueTierra, Version);";
        }

        private MedicionTanqueTierraDTO MapMedicionTanqueTierra(SqlDataReader reader)
        {
            MedicionTanqueTierraDTO Obj = new MedicionTanqueTierraDTO();
            Obj.CodMedicionTanqueTierra = Convert.ToInt32(reader["CodMedicionTanqueTierra"]);
            Obj.IdMedicionTanqueTierra = ObjEncriptacion.Encriptar(Obj.CodMedicionTanqueTierra.ToString());
            Obj.Fecha = Fecha(reader["Fecha"]);
            Obj.CodBarco = Int(reader["CodBarco"]);
            Obj.IdBarco = ObjEncriptacion.Encriptar(Obj.CodBarco.ToString());
            Obj.Barco = reader["Barco"].ToString() ?? "";
            Obj.CodSuplidor = Int(reader["CodSuplidor"]);
            Obj.IdSuplidor = ObjEncriptacion.Encriptar(Obj.CodSuplidor.ToString());
            Obj.Suplidor = reader["Suplidor"].ToString() ?? "";
            Obj.CodProducto = Int(reader["CodProducto"]);
            Obj.IdProducto = ObjEncriptacion.Encriptar(Obj.CodProducto.ToString());
            Obj.Producto = reader["Producto"].ToString() ?? "";
            Obj.CodCompaniaInspeccion = Int(reader["CodCompaniaInspeccion"]);
            Obj.IdCompaniaInspeccion = ObjEncriptacion.Encriptar(Obj.CodCompaniaInspeccion.ToString());
            Obj.CompaniaInspeccion = reader["CompaniaInspeccion"].ToString() ?? "";
            Obj.DetalleCantidad = Int(reader["DetalleCantidad"]);
            Obj.VolumenEstandarBrutoTotal = Decimal(reader["VolumenEstandarBrutoTotal"]);
            Obj.Estatus = Bool(reader["Estatus"]);
            return Obj;
        }

        private MedicionTanqueTierraDTO MapMedicionTanqueTierraLog(SqlDataReader reader)
        {
            MedicionTanqueTierraDTO Obj = MapMedicionTanqueTierra(reader);
            ControlCambioMapper.Mapear(Obj, reader, ObjEncriptacion);
            return Obj;
        }

        private MedicionTanqueTierraDetalleDTO MapDetalle(SqlDataReader reader)
        {
            MedicionTanqueTierraDetalleDTO Obj = new MedicionTanqueTierraDetalleDTO();
            Obj.CodMedicionTanqueTierraDetalle = Int(reader["CodMedicionTanqueTierraDetalle"]);
            Obj.IdMedicionTanqueTierraDetalle = ObjEncriptacion.Encriptar(Obj.CodMedicionTanqueTierraDetalle.ToString());
            Obj.CodMedicionTanqueTierra = Int(reader["CodMedicionTanqueTierra"]);
            Obj.IdMedicionTanqueTierra = ObjEncriptacion.Encriptar(Obj.CodMedicionTanqueTierra.ToString());
            Obj.Linea = Int(reader["Linea"]);
            Obj.CodTanque = reader["CodTanque"].ToString() ?? "";
            Obj.IdTanque = ObjEncriptacion.Encriptar(Obj.CodTanque);
            Obj.Tanque = reader["Tanque"].ToString() ?? "";
            Obj.Tipo = reader["Tipo"].ToString() ?? "";
            Obj.Fecha = Fecha(reader["Fecha"]);
            Obj.Hora = Hora(reader["Hora"]);
            Obj.Pies = Int(reader["Pies"]);
            Obj.Pulgadas = Int(reader["Pulgadas"]);
            Obj.Dieciseisavos = Int(reader["Dieciseisavos"]);
            Obj.Volumen = Decimal(reader["Volumen"]);
            Obj.CorreccionTecho = Decimal(reader["CorreccionTecho"]);
            Obj.MedidaAguaPies = Int(reader["MedidaAguaPies"]);
            Obj.MedidaAguaPulgadas = Int(reader["MedidaAguaPulgadas"]);
            Obj.VolumenAguaLibre = Decimal(reader["VolumenAguaLibre"]);
            Obj.VolumenBrutoObservado = Decimal(reader["VolumenBrutoObservado"]);
            Obj.Temperatura = Decimal(reader["Temperatura"]);
            Obj.Api = Decimal(reader["Api"]);
            Obj.Factor = Decimal(reader["Factor"]);
            Obj.VolumenEstandarBruto = Decimal(reader["VolumenEstandarBruto"]);
            return Obj;
        }

        private DateTime? Fecha(object valor)
        {
            if (valor != DBNull.Value && DateTime.TryParse(valor.ToString(), out DateTime fecha))
                return fecha;

            return null;
        }

        private string Hora(object valor)
        {
            if (valor == DBNull.Value)
                return "";

            if (valor is TimeSpan tiempo)
                return tiempo.ToString(@"hh\:mm", CultureInfo.InvariantCulture);

            if (TimeSpan.TryParse(valor.ToString(), CultureInfo.InvariantCulture, out TimeSpan hora))
                return hora.ToString(@"hh\:mm", CultureInfo.InvariantCulture);

            return "";
        }

        private bool Bool(object valor)
        {
            if (valor == DBNull.Value)
                return false;

            return Convert.ToBoolean(valor);
        }

        private int Int(object valor)
        {
            if (valor == DBNull.Value)
                return 0;

            return Convert.ToInt32(valor);
        }

        private decimal Decimal(object valor)
        {
            if (valor == DBNull.Value)
                return 0;

            return Convert.ToDecimal(valor);
        }

        private string SqlTexto(string? valor)
        {
            return (valor ?? "").Replace("'", "''");
        }

        private string SqlFecha(DateTime? valor)
        {
            if (!valor.HasValue)
                return "NULL";

            return "'" + valor.Value.ToString("yyyy-MM-ddTHH:mm:ss", CultureInfo.InvariantCulture) + "'";
        }

        private string SqlHora(string? valor)
        {
            return HoraValida(valor)
                ? "'" + SqlTexto(valor!.Trim()) + "'"
                : "NULL";
        }

        private bool HoraValida(string? valor)
        {
            return TimeSpan.TryParse(valor, CultureInfo.InvariantCulture, out TimeSpan hora)
                && hora >= TimeSpan.Zero
                && hora < TimeSpan.FromDays(1);
        }

        private string SqlNumero(decimal valor)
        {
            return valor.ToString(CultureInfo.InvariantCulture);
        }

        private MsjDB Ok()
        {
            return new MsjDB { Estatus = true, Msj = "", Key = 0 };
        }

        private MsjDB Error(string mensaje)
        {
            return new MsjDB { Estatus = false, Msj = mensaje, Key = 0 };
        }
    }
}
