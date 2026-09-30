# Reglas básicas para Codex

- NO crear archivos SQL ni CSV.
- Replicar las tablas principales en sus tablas LOG.
- Los campos nuevos deben ir físicamente antes de Estatus y de los campos de control, si aplica.
- Las tablas que lleven el campo Estatus deben colocarlo antes de los campos de control.
- Los campos de control deben ser físicamente los últimos de la tabla y en este orden:
  `[CodUsuarioCreacion], [FechaCreacion], [CodUsuarioActualizacion], [FechaActualizacion], [CodUsuarioEliminacion], [FechaEliminacion], [AccionLog]
- No revisar git status la aplicacion no tiene GIT
- NO dejar la aplicación ejecutándose.
