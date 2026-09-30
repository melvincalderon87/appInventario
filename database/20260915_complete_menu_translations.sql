/*
  Completa las traducciones de todos los menus activos para es-GT y en-US.
  Es idempotente: no modifica traducciones que ya existen.
*/
SET XACT_ABORT ON;
BEGIN TRANSACTION;

DECLARE @Translations TABLE (
    CodMenu INT NOT NULL,
    Idioma VARCHAR(10) NOT NULL,
    Descripcion VARCHAR(150) NOT NULL,
    PRIMARY KEY (CodMenu, Idioma)
);

INSERT INTO @Translations (CodMenu, Idioma, Descripcion) VALUES
  (1,   'es-GT', 'Archivo'),
  (101, 'es-GT', 'Cambiar contraseña'),
  (102, 'es-GT', 'Registro de modificaciones'),
  (103, 'es-GT', 'Auditoría'),
  (104, 'es-GT', 'Tipo de usuario'), (104, 'en-US', 'User type'),
  (105, 'es-GT', 'Usuarios'),
  (106, 'es-GT', 'Rol'), (106, 'en-US', 'Role'),
  (107, 'es-GT', 'Configuración de usuario'), (107, 'en-US', 'User configuration'),
  (108, 'es-GT', 'Idioma'), (108, 'en-US', 'Language'),
  (109, 'es-GT', 'Menú'), (109, 'en-US', 'Menu'),
  (110, 'es-GT', 'Traducciones de menú'), (110, 'en-US', 'Menu translations'),
  (111, 'es-GT', 'Tipo de permiso'), (111, 'en-US', 'Permission type'),
  (112, 'es-GT', 'Preferencia de usuario'), (112, 'en-US', 'User preference'),
  (113, 'es-GT', 'Permisos'), (113, 'en-US', 'Permissions'),
  (114, 'es-GT', 'Rutas de menú'),
  (122, 'es-GT', 'Personal'), (122, 'en-US', 'Personnel'),
  (132, 'es-GT', 'Calibración de aditivo'), (132, 'en-US', 'Additive calibration'),
  (140, 'es-GT', 'Configuración de correo'),
  (141, 'es-GT', 'Tareas'),
  (142, 'es-GT', 'Notificaciones'),
  (148, 'es-GT', 'Salida de aditivo'), (148, 'en-US', 'Additive exit'),
  (149, 'es-GT', 'Salida de colorante'), (149, 'en-US', 'Dye exit'),
  (154, 'es-GT', 'MOVCOM'), (154, 'en-US', 'MOVCOM'),
  (155, 'es-GT', 'Reportes'), (155, 'en-US', 'Reports'),
  (161, 'es-GT', 'Autorizadores de documentos'), (161, 'en-US', 'Document authorizers'),
  (162, 'es-GT', 'Autorizaciones pendientes'), (162, 'en-US', 'Pending authorizations'),
  (173, 'es-GT', 'Reporte de carga'), (173, 'en-US', 'Load report'),
  (174, 'es-GT', 'Reporte de ingresos de barcos'), (174, 'en-US', 'Ship entry report');

INSERT INTO dbo.MenuIdioma
  (CodMenu, Idioma, Descripcion, Estatus, Version, CodUsuarioCreacion, FechaCreacion)
SELECT t.CodMenu, t.Idioma, t.Descripcion, 1, 1, 'Codex', GETDATE()
FROM @Translations t
JOIN dbo.Menu m ON m.CodMenu = t.CodMenu AND m.Estatus = 1
LEFT JOIN dbo.MenuIdioma mi ON mi.CodMenu = t.CodMenu AND mi.Idioma = t.Idioma
WHERE mi.CodMenu IS NULL;

COMMIT TRANSACTION;
