using app.Models.LogModificaciones;
using app.Models.Paginacion;
using Microsoft.AspNetCore.Mvc.Rendering;
using System;
using System.Collections.Generic;

namespace app.Models.Menu
{
    /// <summary>Acceso a datos del modulo Menu.</summary>
    internal class MenuDAO
    {
        private DAL ObjDAL = new DAL();
        private MsjDB MsjDB = new MsjDB();
        private Encriptacion ObjEncriptacion = new Encriptacion();

        /// <summary>
        /// Devuelve la lista plana del menú del usuario según sesión e idioma
        /// </summary>
        internal List<MenuDTO> ObtenerMenu(string Idioma)
        {
            string CodUsuario = ObjEncriptacion.Desencriptar(
                Sesion.Obtener.Session.GetString("CodUsuario"));

            return ObjDAL.EjecutarReader(Query(CodUsuario: CodUsuario, Idioma: Idioma), MapMenu);
        }

        /// <summary>
        /// Devuelve el menú del usuario como árbol jerárquico (N niveles)
        /// Este es el método que consume el controller para React
        /// </summary>
        internal List<MenuDTO> ObtenerMenuArbol(string Idioma)
        {
            List<MenuDTO> flat = ObtenerMenu(Idioma);
            NormalizarMenuSistema(flat, Idioma);
            return BuildTree(flat);
        }

        /// <summary>
        /// Construye el árbol recursivo a partir de la lista plana
        /// </summary>
        private List<MenuDTO> BuildTree(List<MenuDTO> flat)
        {
            var lookup = flat.ToDictionary(m => m.CodMenu);
            var roots = new List<MenuDTO>();

            foreach (var item in flat.OrderBy(m => m.Padre).ThenBy(m => m.Orden).ThenBy(m => m.CodMenu))
            {
                if (item.Padre == 0 || !lookup.ContainsKey(item.Padre))
                    roots.Add(item);
                else
                    lookup[item.Padre].Children.Add(item);
            }
            return roots;
        }

        private void NormalizarMenuSistema(List<MenuDTO> flat, string Idioma)
        {
            NormalizarRutasDeMenus(flat);
            flat.RemoveAll(m => m.CodMenu == (int)Menus.Permiso);
            MenuDTO? medicionTanqueTierra = flat.FirstOrDefault(m => m.CodMenu == (int)Menus.MedicionTanqueTierra);
            if (medicionTanqueTierra != null)
            {
                medicionTanqueTierra.Descripcion = Idioma == "en-US" ? "Ground tank measurement" : "Medicion de tanque en tierra";
                medicionTanqueTierra.Link = "/mediciontanquetierra/listar";
                medicionTanqueTierra.Icono = "Gauge";
                medicionTanqueTierra.Padre = (int)Menus.MenuBarco;
                medicionTanqueTierra.Orden = 1;
            }

            NormalizarHijoBarco(flat, Menus.IngresoBarco, 2);

            NormalizarMenuProducto(flat, Idioma);
            NormalizarMenuSaldoInicial(flat, Idioma);
            NormalizarCalibracionEtanol(flat);

            MenuDTO? volumenTanque = flat.FirstOrDefault(m => m.CodMenu == (int)Menus.VolumenTanque);
            if (volumenTanque != null)
            {
                MenuDTO? menuVolumen = flat.FirstOrDefault(m => m.CodMenu == (int)Menus.MenuVolumen);
                if (menuVolumen == null)
                {
                    menuVolumen = new MenuDTO
                    {
                        IdMenu = ObjEncriptacion.Encriptar(((int)Menus.MenuVolumen).ToString()),
                        CodMenu = (int)Menus.MenuVolumen,
                        Descripcion = Idioma == "en-US" ? "Volume" : "Volumen",
                        Link = "",
                        Accion = "",
                        Icono = "Barrel",
                        Padre = 0,
                        Orden = 4,
                        Estatus = true
                    };
                    flat.Add(menuVolumen);
                }
                else
                {
                    menuVolumen.Descripcion = Idioma == "en-US" ? "Volume" : "Volumen";
                    menuVolumen.Link = "";
                    menuVolumen.Accion = "";
                    menuVolumen.Icono = "Barrel";
                    menuVolumen.Padre = 0;
                    menuVolumen.Orden = 4;
                    menuVolumen.Estatus = true;
                }

                volumenTanque.Descripcion = Idioma == "en-US" ? "Tank volume" : "Volumen tanque";
                volumenTanque.Link = "/volumentanque/listar";
                volumenTanque.Icono = "Gauge";
                volumenTanque.Padre = (int)Menus.MenuVolumen;
                volumenTanque.Orden = 1;
            }

            bool menuSalidasVacio = !flat.Any(m => m.Padre == (int)Menus.Salidas);
            if (menuSalidasVacio)
            {
                flat.RemoveAll(m => m.CodMenu == (int)Menus.Salidas);
            }

            ReordenarMenusPrincipales(flat);
        }

        // Las rutas del menú son parte del contrato de navegación de React.  Se
        // normalizan por código de menú para que cambios históricos en la tabla
        // Menu (mayúsculas, aliases u omisiones de /listar) no lleven al
        // redireccionamiento comodín de la aplicación.
        private static void NormalizarRutasDeMenus(List<MenuDTO> flat)
        {
            var rutas = new Dictionary<Menus, string>
            {
                [Menus.Auditoria] = "/auditoria/listar",
                [Menus.CambioPassword] = "/cambiarpassword/cambiarpassword",
                [Menus.LogModificacion] = "/logmodificacion/listar",
                [Menus.MenuRuta] = "/menuruta/listar",
                [Menus.ConfiguracionCorreo] = "/configuracioncorreo/listar",
                [Menus.Tarea] = "/tarea/listar",
                [Menus.Notificacion] = "/notificacion/listar",
                [Menus.ConfiguracionSistema] = "/configuracionsistema/listar",
                [Menus.TipoProducto] = "/tipoproducto/listar",
                [Menus.Socio] = "/socio/listar",
                [Menus.Suplidor] = "/suplidor/listar",
                [Menus.Producto] = "/producto/listar",
                [Menus.Bahia] = "/bahia/listar",
                [Menus.Brazo] = "/brazo/listar",
                [Menus.Metro] = "/metro/listar",
                [Menus.VolumenTanque] = "/volumentanque/listar",
                [Menus.EntradasProducto] = "/entradasproducto/listar",
                [Menus.AjusteEntradaProducto] = "/ajustes/entrada/listar",
                [Menus.AjusteSalidaProducto] = "/ajustes/salida/listar",
                [Menus.EntradaUnidad] = "/unidad/entrada/listar",
                [Menus.SalidaUnidad] = "/unidad/salida/listar",
                [Menus.AutorizadoresCombustible] = "/combustible/autorizadores",
                [Menus.AutorizacionesPendientes] = "/gestion/autorizaciones-pendientes",
                [Menus.Barco] = "/barco/listar",
                [Menus.IngresoBarco] = "/barco/ingresobarco",
                [Menus.IngresoTuberias] = "/combustible/ingresotuberias/listar",
                [Menus.EtanolEntrada] = "/etanol/entradas/listar",
                [Menus.EtanolSalida] = "/etanol/salidas/listar",
                [Menus.EtanolCompraVentaSuplidores] = "/etanol/compraventasuplidores/listar",
                [Menus.EtanolIngresoTuberias] = "/etanol/ingresotuberias/listar",
                [Menus.EtanolEntradaUnidad] = "/etanol/unidad-entrada/listar",
                [Menus.EtanolSalidaUnidad] = "/etanol/unidad-salida/listar",
                [Menus.EtanolAjusteEntrada] = "/etanol/ajuste-entrada/listar",
                [Menus.EtanolAjusteSalida] = "/etanol/ajuste-salida/listar",
                [Menus.SaldoInicialEtanol] = "/saldo-inicial/etanol/listar",
                [Menus.Salida] = "/salidas/listar",
                [Menus.CompraVentaSuplidores] = "/compraventasuplidores/listar",
                [Menus.MedicionTanqueTierra] = "/mediciontanquetierra/listar",
                [Menus.Tanque] = "/tanque/listar",
                [Menus.Personal] = "/personal/listar",
                [Menus.CompaniaInspeccion] = "/companiainspeccion/listar",
                [Menus.PersonalExterno] = "/personalexterno/listar",
                [Menus.Tuberia] = "/tuberia/listar",
                [Menus.CapacidadVolumetricaTanque] = "/capacidadvolumetricatanque/listar",
                [Menus.CalibracionCombustible] = "/calibracioncombustible/listar",
                [Menus.CalibracionEtanol] = "/calibracionetanol/listar",
                [Menus.CalibracionAditivo] = "/calibracionaditivo/listar",
                [Menus.ConsumoPropio] = "/consumopropio/listar",
                [Menus.Colorante] = "/colorante/ingreso/listar",
                [Menus.Aditivo] = "/aditivo/ingreso/listar",
                [Menus.SalidaAditivo] = "/aditivo/salida/listar",
                [Menus.SalidaColorante] = "/colorante/salida/listar",
                [Menus.SaldoInicialCombustible] = "/saldo-inicial/combustible/listar",
                [Menus.SaldoInicialAditivo] = "/saldo-inicial/aditivo/listar",
                [Menus.SaldoInicialColorante] = "/saldo-inicial/colorante/listar",
                [Menus.MovComStandar] = "/movcomstandar",
                [Menus.ReporteCarga] = "/reportes/carga",
                [Menus.ReporteIngresosBarcos] = "/reportes/ingresos-barco",
                [Menus.TipoUsuario] = "/tipousuario/listar",
                [Menus.Usuario] = "/usuario/listar",
                [Menus.Rol] = "/rol/listar",
                [Menus.UsuarioConfiguracion] = "/usuarioconfiguracion/listar",
                [Menus.Idioma] = "/idioma/listar",
                [Menus.Menu] = "/menu/listar",
                [Menus.MenuIdioma] = "/menuidioma/listar",
                [Menus.TipoPermiso] = "/tipopermiso/listar",
                [Menus.UsuarioPreferencia] = "/usuariopreferencia/listar",
                [Menus.Permiso] = "/rol/permisos",
                [Menus.Venta] = "/ventas/listar"
            };

            foreach (MenuDTO item in flat)
            {
                if (rutas.TryGetValue((Menus)item.CodMenu, out string? ruta))
                    item.Link = ruta;
            }
        }

        private static void NormalizarCalibracionEtanol(List<MenuDTO> flat)
        {
            MenuDTO? calibracionEtanol = flat.FirstOrDefault(m => m.CodMenu == (int)Menus.CalibracionEtanol);
            if (calibracionEtanol != null)
            {
                calibracionEtanol.Padre = (int)Menus.MenuCalibracion;
                calibracionEtanol.Orden = 3;
            }
        }

        private static void ReordenarMenusPrincipales(List<MenuDTO> flat)
        {
            Menus[] orden =
            {
                Menus.Archivo,
                Menus.Gestion,
                Menus.DatosMaestros,
                Menus.SaldoInicial,
                Menus.MenuVolumen,
                Menus.MenuConsumoPropio,
                Menus.MenuCalibracion,
                Menus.MenuAditivo,
                Menus.MenuColorante,
                Menus.MenuProducto,
                Menus.MenuEtanol,
                Menus.MenuBarco,
                Menus.MenuVentas,
                Menus.Reportes
            };

            var ordenes = orden
                .Select((menu, indice) => new { Menu = (int)menu, Orden = indice + 1 })
                .ToDictionary(item => item.Menu, item => item.Orden);

            foreach (MenuDTO item in flat.Where(item => item.Padre == 0))
            {
                item.Orden = ordenes.TryGetValue(item.CodMenu, out int ordenMenu)
                    ? ordenMenu
                    : orden.Length + item.Orden;
            }
        }

        private void NormalizarHijoBarco(List<MenuDTO> flat, Menus menu, int orden)
        {
            MenuDTO? item = flat.FirstOrDefault(m => m.CodMenu == (int)menu);
            if (item != null && item.Padre == (int)Menus.MenuBarco)
            {
                item.Orden = orden;
            }
        }

        private void NormalizarMenuProducto(List<MenuDTO> flat, string idioma)
        {
            MenuDTO? salidaProducto = flat.FirstOrDefault(m => m.CodMenu == (int)Menus.Salida);
            MenuDTO? compraVentaSuplidores = flat.FirstOrDefault(m => m.CodMenu == (int)Menus.CompraVentaSuplidores);
            MenuDTO? ingresoTuberias = flat.FirstOrDefault(m => m.CodMenu == (int)Menus.IngresoTuberias);

            if (salidaProducto == null && compraVentaSuplidores == null && ingresoTuberias == null)
                return;

            MenuDTO? menuProducto = flat.FirstOrDefault(m => m.CodMenu == (int)Menus.MenuProducto);
            if (menuProducto == null)
            {
                menuProducto = new MenuDTO
                {
                    IdMenu = ObjEncriptacion.Encriptar(((int)Menus.MenuProducto).ToString()),
                    CodMenu = (int)Menus.MenuProducto,
                    Estatus = true
                };
                flat.Add(menuProducto);
            }

            menuProducto.Descripcion = idioma == "en-US" ? "Fuel" : "Combustible";
            menuProducto.Link = "";
            menuProducto.Accion = "";
            menuProducto.Icono = "Package";
            menuProducto.Padre = 0;
            menuProducto.Orden = 5;
            menuProducto.Estatus = true;

            MenuDTO? entradaProducto = flat.FirstOrDefault(m => m.CodMenu == (int)Menus.EntradasProducto);
            MenuDTO? entradaUnidad = flat.FirstOrDefault(m => m.CodMenu == (int)Menus.EntradaUnidad);
            MenuDTO? salidaUnidad = flat.FirstOrDefault(m => m.CodMenu == (int)Menus.SalidaUnidad);
            MenuDTO? ajusteEntrada = flat.FirstOrDefault(m => m.CodMenu == (int)Menus.AjusteEntradaProducto);
            MenuDTO? ajusteSalida = flat.FirstOrDefault(m => m.CodMenu == (int)Menus.AjusteSalidaProducto);

            NormalizarHijoCombustible(entradaProducto, idioma == "en-US" ? "Fuel entry" : "Entrada Combustible", "/entradasproducto/listar", 1);
            NormalizarHijoCombustible(salidaProducto, idioma == "en-US" ? "Fuel exit" : "Salida Combustible", "/salidas/listar", 2);
            NormalizarHijoCombustible(compraVentaSuplidores, idioma == "en-US" ? "Fuel supplier purchases and sales" : "Compra Venta Suplidores Combustible", "/compraventasuplidores/listar", 3);
            NormalizarHijoCombustible(ingresoTuberias, idioma == "en-US" ? "Fuel pipeline entry" : "Ingreso Tuberias Combustible", "/combustible/ingresotuberias/listar", 4);
            NormalizarHijoCombustible(entradaUnidad, idioma == "en-US" ? "Fuel unit entry" : "Entrada Unidad Combustible", "/unidad/entrada/listar", 5);
            NormalizarHijoCombustible(salidaUnidad, idioma == "en-US" ? "Fuel unit exit" : "Salida Unidad Combustible", "/unidad/salida/listar", 6);
            NormalizarHijoCombustible(ajusteEntrada, idioma == "en-US" ? "Fuel entry adjustment" : "Ajuste de Entrada Combustible", "/ajustes/entrada/listar", 7);
            NormalizarHijoCombustible(ajusteSalida, idioma == "en-US" ? "Fuel exit adjustment" : "Ajuste de Salida Combustible", "/ajustes/salida/listar", 8);
        }

        private static void NormalizarHijoCombustible(MenuDTO? item, string descripcion, string link, int orden)
        {
            if (item == null) return;
            item.Descripcion = descripcion;
            item.Link = link;
            item.Padre = (int)Menus.MenuProducto;
            item.Orden = orden;
        }

        private void NormalizarMenuSaldoInicial(List<MenuDTO> flat, string idioma)
        {
            MenuDTO? combustible = flat.FirstOrDefault(m => m.CodMenu == (int)Menus.SaldoInicialCombustible);
            MenuDTO? aditivo = flat.FirstOrDefault(m => m.CodMenu == (int)Menus.SaldoInicialAditivo);
            MenuDTO? colorante = flat.FirstOrDefault(m => m.CodMenu == (int)Menus.SaldoInicialColorante);
            MenuDTO? etanol = flat.FirstOrDefault(m => m.CodMenu == (int)Menus.SaldoInicialEtanol);

            if (combustible == null && aditivo == null && colorante == null && etanol == null)
            {
                flat.RemoveAll(m => m.CodMenu == (int)Menus.SaldoInicial);
                return;
            }

            MenuDTO? saldoInicial = flat.FirstOrDefault(m => m.CodMenu == (int)Menus.SaldoInicial);
            if (saldoInicial == null)
            {
                saldoInicial = new MenuDTO
                {
                    IdMenu = ObjEncriptacion.Encriptar(((int)Menus.SaldoInicial).ToString()),
                    CodMenu = (int)Menus.SaldoInicial
                };
                flat.Add(saldoInicial);
            }

            saldoInicial.Descripcion = idioma == "en-US" ? "Opening balance" : "Saldo inicial";
            saldoInicial.Link = "";
            saldoInicial.Accion = "";
            saldoInicial.Icono = "Database";
            saldoInicial.Padre = 0;
            saldoInicial.Orden = 6;
            saldoInicial.Estatus = true;

            NormalizarHijoSaldoInicial(combustible, idioma == "en-US" ? "Fuel" : "Combustible", "/saldo-inicial/combustible/listar", 1);
            NormalizarHijoSaldoInicial(aditivo, idioma == "en-US" ? "Additive" : "Aditivo", "/saldo-inicial/aditivo/listar", 2);
            NormalizarHijoSaldoInicial(colorante, idioma == "en-US" ? "Colorant" : "Colorante", "/saldo-inicial/colorante/listar", 3);
            NormalizarHijoSaldoInicial(etanol, idioma == "en-US" ? "Ethanol" : "Etanol", "/saldo-inicial/etanol/listar", 4);
        }

        private static void NormalizarHijoSaldoInicial(MenuDTO? item, string descripcion, string link, int orden)
        {
            if (item == null) return;
            item.Descripcion = descripcion;
            item.Link = link;
            item.Accion = "";
            item.Icono = "Database";
            item.Padre = (int)Menus.SaldoInicial;
            item.Orden = orden;
        }

        /// <summary>
        /// Lista para dropdowns SelectListItem con descripción e id
        /// </summary>
        internal List<SelectListItem> Listar(string Idioma)
        {
            return ObjDAL.EjecutarReader(Query(TipoDAL.Listar, Idioma: Idioma), reader => new SelectListItem
            {
                Text = reader["Descripcion"].ToString() + " [ " + reader["CodMenu"] + " ]",
                Value = reader["CodMenu"].ToString()
            });
        }

        /// <summary>
        /// Listado administrativo completo
        /// </summary>
        internal PaginacionResultado<MenuDTO> Listado(int page = 1, int pageSize = 50, string search = "", string sort = "")
        {
            PaginacionParametros paginacion = PaginacionParametros.Crear(page, pageSize, search, sort);
            int totalCount = 0;
            List<MenuDTO> items = ObjDAL.EjecutarReader(QueryListado(paginacion), reader =>
            {
                if (totalCount == 0)
                    totalCount = PaginacionSql.LeerTotal(reader);

                return MapMenuAdmin(reader);
            });

            return new PaginacionResultado<MenuDTO>(items, totalCount, paginacion.Page, paginacion.PageSize);
        }

        /// <summary>
        /// Obtiene un registro individual por CodMenu
        /// </summary>
        internal MenuDTO Obtener(int CodMenu)
        {
            return ObjDAL.EjecutarReader(Query(TipoDAL.Obtener, CodKey: CodMenu), MapMenuAdmin).FirstOrDefault() ?? new MenuDTO();
        }

        internal int ObtenerKey(int Padre = 0)
        {
            return ObjDAL.EjecutarScalar(Query(TipoDAL.ObtenerKey, CodKey: Padre), Padre == 0 ? 1 : 101);
        }

        internal MsjDB Agregar(MenuDTO Obj)
        {
            Obj.CodMenu = ObtenerKey(Obj.Padre);
            Obj.Version = 1;
            Obj.CodUsuarioCreacion = new VerificarUsuario().SesionUsuario();
            MsjDB = ObjDAL.Ejecutar(Query(TipoDAL.Agregar, Obj: Obj), Key: false, tipoDAL: TipoDAL.Agregar);

            if (MsjDB.Estatus == true)
            {
                LogModificacionDAO.Registrar("Menu", "CREADO", "CodMenu:" + Obj.CodMenu, Nuevo: Obj);
            }

            return MsjDB;
        }

        /// <summary>
        /// Edita un registro de menú
        /// </summary>
        internal MsjDB Editar(MenuDTO Obj)
        {
            MenuDTO ObjAnterior = Obtener(Obj.CodMenu);
            Obj.Version = ObtenerVersion(Obj.CodMenu);
            Obj.CodUsuarioActualizacion = new VerificarUsuario().SesionUsuario();
            MsjDB = ObjDAL.Ejecutar(Query(TipoDAL.Editar, Obj: Obj), Key: false, tipoDAL: TipoDAL.Editar);

            if (MsjDB.Estatus == true)
            {
                LogModificacionDAO.Registrar("Menu", "EDITADO", "CodMenu:" + Obj.CodMenu, Anterior: ObjAnterior, Nuevo: Obj);
            }

            return MsjDB;
        }

        internal MsjDB Eliminar(MenuDTO Obj)
        {
            MenuDTO ObjAnterior = Obtener(Obj.CodMenu);
            MsjDB ValidacionRelacion = new DatoMaestroRelacion().ValidarEliminacion("Menu", "CodMenu", Obj.CodMenu);
            if (!ValidacionRelacion.Estatus)
                return ValidacionRelacion;

            MsjDB = ObjDAL.Ejecutar(Query(TipoDAL.Eliminar, Obj: Obj), Key: false, tipoDAL: TipoDAL.Eliminar);

            if (MsjDB.Estatus == true)
            {
                LogModificacionDAO.Registrar("Menu", "ELIMINADO", "CodMenu:" + Obj.CodMenu, Anterior: ObjAnterior);
            }

            return MsjDB;
        }

        /// <summary>
        /// Verifica si ya existe otro menú con la misma descripción
        /// </summary>
        internal bool VerificarDescripcion(MenuDTO Obj)
        {
            return ObjDAL.EjecutarExiste(Query(TipoDAL.Verificacion, Obj: Obj));
        }

        /// <summary>
        /// Obtiene la próxima versión para auditoría
        /// </summary>
        internal int ObtenerVersion(int CodMenu)
        {
            return ObjDAL.EjecutarScalar(Query(TipoDAL.Version, CodKey: CodMenu), 1);
        }

        /// <summary>
        /// Historial de cambios de un menú (temporal table)
        /// </summary>
        internal List<MenuDTO> Log(int CodMenu)
        {
            return ObjDAL.EjecutarReader(Query(TipoDAL.Log, CodKey: CodMenu), MapMenuLog);
        }

        /// <summary>
        /// Generador de queries â€” centralizado
        /// </summary>
        internal string Query(TipoDAL TipoDAL = TipoDAL.NoSeleccionado, int CodKey = 0,
            string CodUsuario = "", MenuDTO Obj = null, string Idioma = "",
            int Version = 0, string CodUsuarioActualizacion = "")
        {
            switch (TipoDAL)
            {
                case TipoDAL.Agregar:
                    return "INSERT INTO Menu (CodMenu, Descripcion, Link, Accion, Icono, Padre, Orden, Estatus, Version, CodUsuarioCreacion, FechaCreacion) "
                        + "VALUES("
                        + Obj.CodMenu + ","
                        + "'" + Sql(Obj.Descripcion) + "',"
                        + "'" + Sql(Obj.Link) + "',"
                        + "'" + Sql(Obj.Accion) + "',"
                        + "'" + Sql(Obj.Icono) + "',"
                        + Obj.Padre + ","
                        + Obj.Orden + ","
                        + (Obj.Estatus ? "1" : "0") + "," + Obj.Version + ","
                        + "'" + Sql(Obj.CodUsuarioCreacion) + "',"
                        + "GETDATE())";

                case TipoDAL.Editar:
                    return "UPDATE Menu SET "
                        + "Descripcion='" + Sql(Obj.Descripcion) + "',"
                        + "Link='" + Sql(Obj.Link) + "',"
                        + "Accion='" + Sql(Obj.Accion) + "',"
                        + "Icono='" + Sql(Obj.Icono) + "',"
                        + "Padre=" + Obj.Padre + ","
                        + "Orden=" + Obj.Orden + ","
                        + "Estatus=" + (Obj.Estatus ? "1" : "0") + ","
                        + "Version=" + Obj.Version + ","
                        + "CodUsuarioActualizacion='" + Sql(Obj.CodUsuarioActualizacion) + "',"
                        + "FechaActualizacion=GETDATE() "
                        + "WHERE CodMenu=" + Obj.CodMenu;

                case TipoDAL.Eliminar:
                    return "DELETE FROM Menu WHERE CodMenu=" + Obj.CodMenu;

                case TipoDAL.Listado:
                    return "SELECT A.[CodMenu], A.[Descripcion], A.[Link], A.[Accion], "
                         + "A.[Icono], A.[Padre], A.[Orden], A.[Estatus] "
                         + "FROM Menu A "
                         + "ORDER BY A.[Padre], A.[Orden]";

                case TipoDAL.Listar:
                    return Idioma != "es-GT"
                        ? "SELECT A.[CodMenu], B.[Descripcion], A.[Link] "
                        + "FROM Menu A "
                        + "INNER JOIN MenuIdioma B ON A.[CodMenu] = B.[CodMenu] "
                        + "WHERE B.[Idioma] = '" + Idioma.Replace("'", "''") + "' "
                        + "ORDER BY B.[Descripcion]"

                        : "SELECT A.[CodMenu], A.[Descripcion], A.[Link] "
                        + "FROM Menu A "
                        + "ORDER BY A.[Descripcion]";

                case TipoDAL.Obtener:
                    return "SELECT A.[CodMenu], A.[Descripcion], A.[Link], A.[Accion], "
                         + "A.[Icono], A.[Padre], A.[Orden], A.[Estatus] "
                         + "FROM Menu A "
                         + "WHERE A.[CodMenu] = " + CodKey;

                case TipoDAL.ObtenerKey:
                    if (CodKey == 0)
                    {
                        return "WITH Numeros AS ("
                             + "SELECT TOP (99) ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) AS CodMenu "
                             + "FROM sys.all_objects"
                             + ") "
                             + "SELECT ISNULL(MIN(N.[CodMenu]), 1) AS CodMenu "
                             + "FROM Numeros N "
                             + "WHERE NOT EXISTS (SELECT 1 FROM Menu A WHERE A.[CodMenu] = N.[CodMenu])";
                    }

                    return "WITH Numeros AS ("
                         + "SELECT TOP (900) ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) + 100 AS CodMenu "
                         + "FROM sys.all_objects"
                         + "), Reservados AS ("
                         + "SELECT " + (int)Menus.ConfiguracionCorreo + " AS CodMenu "
                         + "UNION ALL SELECT " + (int)Menus.Tarea + " "
                         + "UNION ALL SELECT " + (int)Menus.Notificacion + " "
                         + ") "
                         + "SELECT ISNULL(MIN(N.[CodMenu]), 101) AS CodMenu "
                         + "FROM Numeros N "
                         + "WHERE NOT EXISTS (SELECT 1 FROM Menu A WHERE A.[CodMenu] = N.[CodMenu]) "
                         + "AND NOT EXISTS (SELECT 1 FROM Reservados R WHERE R.[CodMenu] = N.[CodMenu])";

                case TipoDAL.Version:
                    return "SELECT ISNULL(MAX(A.[Version]), 0) + 1 AS Version "
                         + "FROM (SELECT * FROM Menu_LOG UNION ALL SELECT * FROM Menu) A "
                         + "WHERE A.[CodMenu] = " + CodKey;

                case TipoDAL.Log:
                    return "SELECT A.[CodMenu], A.[Descripcion], A.[Link], A.[Accion], "
                         + "A.[Icono], A.[Padre], A.[Orden], A.[Estatus], "
                         + "A.[Version], A.[CodUsuarioCreacion], A.[FechaCreacion], "
                         + "A.[CodUsuarioActualizacion],A.[FechaActualizacion],A.[CodUsuarioEliminacion],A.[FechaEliminacion],A.[AccionLog],A.[Estatus] "
                         + "FROM (SELECT * FROM Menu_LOG UNION ALL SELECT * FROM Menu) A "
                         + "WHERE A.[CodMenu] = " + CodKey + " "
                         + "ORDER BY A.[Version]";
                case TipoDAL.Verificacion:
                    return "SELECT 1 FROM Menu A "
                         + "WHERE A.[Descripcion] = '" + Sql(Obj.Descripcion) + "' "
                         + "AND A.[CodMenu] <> " + Obj.CodMenu;

                default:
                    // Query principal del menú por usuario soporta 3 niveles
                    // ORDER BY Padre, Orden garantiza que BuildTree arme correctamente el árbol
                    return Idioma != "es-GT"
                        ? "SELECT D.[CodMenu], "
                        + "MI.[Descripcion], "
                        + "D.[Link], D.[Accion], D.[Icono], D.[Padre], D.[Orden], D.[Estatus] "
                        + "FROM Menu D "
                        + "INNER JOIN UsuarioConfiguracion B ON B.[CodUsuario] = '" + CodUsuario.Replace("'", "''") + "' "
                        + "INNER JOIN MenuIdioma MI ON D.[CodMenu] = MI.[CodMenu] "
                        + "WHERE D.[Estatus] = 1 "
                        + "AND MI.[Idioma] = '" + Idioma.Replace("'", "''") + "' "
                        + "AND EXISTS (SELECT 1 FROM Permiso C WHERE C.[CodRol] = B.[CodRol] AND C.[CodMenu] = D.[CodMenu] AND C.[CodTipoPermiso] = 12) "
                        + "ORDER BY D.[Padre], D.[Orden]"

                        : "SELECT D.[CodMenu], D.[Descripcion], "
                        + "D.[Link], D.[Accion], D.[Icono], D.[Padre], D.[Orden], D.[Estatus] "
                        + "FROM Menu D "
                        + "INNER JOIN UsuarioConfiguracion B ON B.[CodUsuario] = '" + CodUsuario.Replace("'", "''") + "' "
                        + "WHERE D.[Estatus] = 1 "
                        + "AND EXISTS (SELECT 1 FROM Permiso C WHERE C.[CodRol] = B.[CodRol] AND C.[CodMenu] = D.[CodMenu] AND C.[CodTipoPermiso] = 12) "
                        + "ORDER BY D.[Padre], D.[Orden]";
            }
        }

        private string Sql(string? value)
        {
            return (value ?? "").Replace("'", "''");
        }

        private string QueryListado(PaginacionParametros paginacion)
        {
            Dictionary<string, string> sortColumns = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["codMenu"] = "A.[CodMenu]",
                ["descripcion"] = "A.[Descripcion]",
                ["link"] = "A.[Link]",
                ["accion"] = "A.[Accion]",
                ["icono"] = "A.[Icono]",
                ["padre"] = "A.[Padre]",
                ["orden"] = "A.[Orden]",
                ["estatus"] = "A.[Estatus]"
            };
            string where = "WHERE 1 = 1 "
                + PaginacionSql.WhereBusqueda(paginacion.Search, new[]
                {
                    "CONVERT(VARCHAR(20), A.[CodMenu])",
                    "A.[Descripcion]",
                    "A.[Link]",
                    "A.[Accion]",
                    "A.[Icono]",
                    "CONVERT(VARCHAR(20), A.[Padre])",
                    "CONVERT(VARCHAR(20), A.[Orden])",
                    "CONVERT(VARCHAR(5), A.[Estatus])"
                });
            string orderBy = PaginacionSql.OrderBy(paginacion.Sort, sortColumns, "A.[Padre] ASC, A.[Orden] ASC");

            return "SELECT A.[CodMenu], A.[Descripcion], A.[Link], A.[Accion], "
                + "A.[Icono], A.[Padre], A.[Orden], A.[Estatus], "
                + "COUNT(1) OVER() AS [" + PaginacionSql.TotalRegistrosAlias + "] "
                + "FROM Menu A "
                + where
                + "ORDER BY " + orderBy
                + PaginacionSql.OffsetFetch(paginacion);
        }

        private MenuDTO MapMenu(Microsoft.Data.SqlClient.SqlDataReader reader)
        {
            return new MenuDTO
            {
                CodMenu = Convert.ToInt32(reader["CodMenu"]),
                Descripcion = reader["Descripcion"].ToString(),
                Link = reader["Link"].ToString(),
                Accion = reader["Accion"].ToString(),
                Icono = reader["Icono"].ToString(),
                Padre = Convert.ToInt32(reader["Padre"]),
                Orden = Convert.ToInt32(reader["Orden"]),
                Estatus = Convert.ToBoolean(reader["Estatus"])
            };
        }
        private MenuDTO MapMenuAdmin(Microsoft.Data.SqlClient.SqlDataReader reader)
        {
            MenuDTO Obj = MapMenu(reader);
            Obj.IdMenu = ObjEncriptacion.Encriptar(Obj.CodMenu.ToString());
            return Obj;
        }

        private MenuDTO MapMenuLog(Microsoft.Data.SqlClient.SqlDataReader reader)
        {
            MenuDTO Obj = MapMenuAdmin(reader);
            Obj.Version = Convert.ToInt32(reader["Version"]);
            Obj.CodUsuarioCreacion = reader["CodUsuarioCreacion"].ToString();

            if (!string.IsNullOrEmpty(Obj.CodUsuarioCreacion))
                Obj.IdUsuarioCreacion = ObjEncriptacion.Encriptar(Obj.CodUsuarioCreacion);

            if (reader["FechaCreacion"] != DBNull.Value &&
                DateTime.TryParse(reader["FechaCreacion"].ToString(), out DateTime fechaCreacion))
                Obj.FechaCreacion = fechaCreacion;

            Obj.CodUsuarioActualizacion = reader["CodUsuarioActualizacion"].ToString();

            if (!string.IsNullOrEmpty(Obj.CodUsuarioActualizacion))
                Obj.IdUsuarioActualizacion = ObjEncriptacion.Encriptar(Obj.CodUsuarioActualizacion);

            if (reader["FechaActualizacion"] != DBNull.Value &&
                DateTime.TryParse(reader["FechaActualizacion"].ToString(), out DateTime fechaActualizacion))
                Obj.FechaActualizacion = fechaActualizacion;
            ControlCambioMapper.Mapear(Obj, reader, ObjEncriptacion);

            return Obj;
        }
    }
}




