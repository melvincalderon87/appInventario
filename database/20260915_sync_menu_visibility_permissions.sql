/*
  Un rol que puede operar un menú navegable también debe tener el permiso Menu
  (12), requisito que usa MenuDAO para mostrarlo en la navegación.
  La operación es idempotente y no modifica permisos existentes.
*/
SET XACT_ABORT ON;
BEGIN TRANSACTION;

INSERT INTO dbo.Permiso
  (CodRol, CodMenu, CodTipoPermiso, Estatus, Version, CodUsuarioCreacion, FechaCreacion)
SELECT DISTINCT p.CodRol, p.CodMenu, 12, 1, 1, 'Codex', GETDATE()
FROM dbo.Permiso p
JOIN dbo.Menu m
  ON m.CodMenu = p.CodMenu
 AND m.Estatus = 1
WHERE p.Estatus = 1
  AND NULLIF(LTRIM(RTRIM(m.Link)), '') IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM dbo.Permiso menuPermiso
    WHERE menuPermiso.CodRol = p.CodRol
      AND menuPermiso.CodMenu = p.CodMenu
      AND menuPermiso.CodTipoPermiso = 12
      AND menuPermiso.Estatus = 1
  );

COMMIT TRANSACTION;
