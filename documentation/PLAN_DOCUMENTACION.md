# Plan de Documentacion del Sistema

## Proposito

Este documento establece la base para implementar un portal profesional de documentacion del sistema de inventario. El portal reunira manuales de usuario, documentacion tecnica y referencia de la API en espanol. Su objetivo es que la documentacion pueda mantenerse junto con el codigo, con capturas consistentes y sin modificar la funcionalidad de la aplicacion.

La implementacion posterior debe analizar primero el repositorio completo y confirmar la arquitectura, rutas, permisos y configuracion disponible antes de instalar o configurar herramientas.

## Alcance

La solucion propuesta utilizara las siguientes herramientas, cada una con una responsabilidad concreta:

| Herramienta | Uso previsto |
| --- | --- |
| Docusaurus | Portal web responsive para navegar los manuales y documentos tecnicos. |
| Markdown y MDX | Formato versionable del contenido y de las paginas del portal. |
| Playwright | Capturas controladas de pantallas para los manuales de usuario. |
| Swagger y OpenAPI | Referencia de la API existente, sin duplicar la informacion ya generada. |
| Codex | Analisis del codigo y actualizacion de documentos, enlaces y capturas afectadas. |

No se modificara la logica de negocio, la base de datos ni los datos productivos para documentar el sistema.

## Principios de seguridad

- No incluir contrasenas, tokens, claves API, cadenas de conexion ni credenciales en documentos, capturas o scripts.
- No crear, editar ni eliminar registros reales para obtener capturas.
- Usar cuentas, variables de entorno y datos de prueba cuando Playwright requiera inicio de sesion.
- Detener una captura automatica si el recorrido exige modificar informacion y registrar el dato de prueba requerido.
- Mantener los scripts de documentacion separados de las pruebas funcionales.

## Fase 1 Analisis del proyecto

Antes de agregar dependencias, elaborar `documentation/ANALISIS.md` con los resultados verificables del repositorio:

1. Tecnologias del frontend y backend.
2. Estructura de carpetas y proyectos.
3. Rutas, pantallas, menus y submenus existentes.
4. Componentes principales, formularios y procesos de negocio.
5. APIs consumidas por el frontend.
6. Inicio de sesion, sesion, roles y permisos.
7. Integraciones externas.
8. Configuracion real de Swagger u OpenAPI.
9. Modulos prioritarios para el manual.
10. Propuesta definitiva de estructura del portal.

El analisis debe distinguir hechos encontrados de recomendaciones futuras.

## Fase 2 Portal de documentacion

Crear el portal de manera aislada dentro de `documentation`. Sus dependencias no deben agregarse al `package.json` del frontend principal.

Estructura esperada:

```text
documentation/
  docs/
    manual/
    tecnico/
    api/
  static/
    img/
      manual/
  docusaurus.config.js
  sidebars.js
  package.json
```

El portal debe ofrecer pagina inicial, navegacion lateral, contenido en espanol, soporte Markdown y MDX, imagenes y busqueda local si la configuracion elegida lo permite sin un servicio de pago.

## Fase 3 Capturas para manuales

Ubicar los scripts de automatizacion en `playwright/documentation`. Las imagenes se guardaran en `documentation/static/img/manual`, separadas por modulo y con nombres descriptivos.

Ejemplo:

```text
documentation/static/img/manual/
  clientes/
    listado-clientes.png
    nuevo-cliente.png
    editar-cliente.png
    detalle-cliente.png
```

Las capturas deben usar un viewport fijo, esperar a que termine la carga y ocultar o evitar cualquier dato sensible. Cada recorrido debe abrir las pantallas y formularios sin guardar cambios.

Las variables de entorno para ejecutar recorridos se definiran en una plantilla como `.env.documentation.example`. Nunca se versionara un archivo que contenga valores reales. Como minimo se requerira confirmar URL de prueba, usuario de prueba y contrasena de prueba antes de ejecutar Playwright.

## Fase 4 Manual de usuario

Cada modulo tendra su propio archivo Markdown o MDX dentro de `documentation/docs/manual`. El lenguaje debe estar dirigido a usuarios finales, evitando terminos de implementacion como controller, endpoint, DTO, hook, state o SQL.

Plantilla recomendada para cada modulo:

```md
# Nombre del modulo

## Descripcion

## Acceso

## Pantalla principal

## Crear registro

## Editar registro

## Consultar registro

## Eliminar o desactivar

## Campos

## Mensajes y validaciones

## Recomendaciones
```

Las secciones de crear, editar o eliminar solo se incluiran cuando esa accion exista realmente y este permitida para el rol correspondiente.

## Fase 5 Documentacion tecnica

Crear documentos para desarrolladores y administradores dentro de `documentation/docs/tecnico`. Deben cubrir arquitectura, frontend, backend, base de datos, autenticacion, autorizacion, integraciones, configuracion, despliegue y operacion.

La referencia de API se ubicara en `documentation/docs/api`. Swagger seguira siendo la interfaz para explorar y probar endpoints; OpenAPI sera el contrato que describe esos endpoints. La documentacion tecnica debe enlazar o explicar el uso de Swagger sin duplicar automaticamente todos sus detalles.

## Fase 6 Automatizacion y mantenimiento

La implementacion debe habilitar comandos equivalentes a los siguientes, adaptados al gestor de paquetes y estructura final:

```text
npm run docs:capture
npm run docs:build
npm run docs:start
```

- `docs:capture`: ejecuta solo los recorridos y capturas seleccionados.
- `docs:build`: valida y construye el portal.
- `docs:start`: abre el portal local para revision.

Una modificacion visible para el usuario debera revisar el manual del modulo afectado, sus capturas y enlaces. No se regeneraran todas las capturas cuando el cambio se limite a un modulo.

Estas reglas se agregaran a `AGENTS.md` cuando se implemente el portal.

## Fase 7 Verificacion de entrega

Al terminar la implementacion se debera:

1. Construir Docusaurus correctamente.
2. Verificar enlaces internos, Markdown, MDX e imagenes.
3. Confirmar que no se publicaron secretos o datos sensibles.
4. Comprobar que frontend y API principales no fueron afectados.
5. Crear `documentation/RESULTADO.md` con archivos creados, modulos documentados, capturas generadas, limitaciones, configuracion manual requerida y comandos de uso.

## Informacion pendiente antes de las capturas

La fase de captura no debe comenzar hasta contar con:

- URL no productiva o entorno local autorizado.
- Usuario de prueba con permisos apropiados.
- Contrasena de prueba entregada mediante un medio seguro, sin guardarla en el repositorio.
- Confirmacion de los modulos que deben documentarse primero.
- Datos de prueba que puedan visualizarse sin exponer informacion confidencial.

## Siguiente paso

Realizar el analisis del proyecto definido en la Fase 1 y generar `documentation/ANALISIS.md`. Solo despues de revisar ese resultado se instalara y configurara el portal de documentacion.
