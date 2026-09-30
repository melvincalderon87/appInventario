/* Repara el flujo de acceso entre las rutas React y MenuRuta. */
SET XACT_ABORT ON;
BEGIN TRANSACTION;

/* El listado requiere Listar; crear y editar requieren sus permisos propios. */
UPDATE dbo.MenuRuta
SET CodTipoPermiso = 1, Version = Version + 1, CodUsuarioActualizacion = 'Codex', FechaActualizacion = GETDATE()
WHERE Ruta = '/barco/ingresobarco' AND Estatus = 1 AND CodMenu = 135;

DECLARE @Rutas TABLE (Ruta VARCHAR(250) PRIMARY KEY, CodMenu INT NOT NULL, CodTipoPermiso INT NOT NULL);
INSERT INTO @Rutas (Ruta, CodMenu, CodTipoPermiso) VALUES
  ('/barco/ingresobarco/agregar', 135, 2),
  ('/barco/ingresobarco/editar', 135, 3),
  ('/autorizaciones/ingreso-barco', 162, 1),
  ('/capacidadvolumetricatanque/agregar/directa', 129, 2),
  ('/etanol/entradas/editar', 164, 3), ('/etanol/entradas/visualizar', 164, 5),
  ('/etanol/salidas/editar', 165, 3), ('/etanol/salidas/visualizar', 165, 5),
  ('/etanol/compraventasuplidores/editar', 166, 3), ('/etanol/compraventasuplidores/visualizar', 166, 5),
  ('/etanol/ingresotuberias/editar', 167, 3), ('/etanol/ingresotuberias/visualizar', 167, 5),
  ('/etanol/unidad-entrada/editar', 168, 3), ('/etanol/unidad-entrada/visualizar', 168, 5),
  ('/etanol/unidad-salida/editar', 169, 3), ('/etanol/unidad-salida/visualizar', 169, 5),
  ('/etanol/ajuste-entrada/editar', 170, 3), ('/etanol/ajuste-entrada/visualizar', 170, 5),
  ('/etanol/ajuste-salida/editar', 171, 3), ('/etanol/ajuste-salida/visualizar', 171, 5);

INSERT INTO dbo.MenuRuta (Ruta, CodMenu, CodTipoPermiso, Estatus, Version, CodUsuarioCreacion, FechaCreacion)
SELECT r.Ruta, r.CodMenu, r.CodTipoPermiso, 1, 1, 'Codex', GETDATE()
FROM @Rutas r
WHERE NOT EXISTS (SELECT 1 FROM dbo.MenuRuta actual WHERE actual.Ruta = r.Ruta);

/* No hay pantallas React para estas rutas y no deben seguir autorizándose. */
UPDATE dbo.MenuRuta
SET Estatus = 0, Version = Version + 1, CodUsuarioEliminacion = 'Codex', FechaEliminacion = GETDATE()
WHERE Ruta IN (
  '/colorante/cierre-fin-mes', '/colorante/salidabarco', '/entradasproducto/ajuste',
  '/salidas/ajuste', '/suplidor/distribucion'
) AND Estatus = 1;

COMMIT TRANSACTION;
