# Análisis técnico y funcional — Sistema de Inventario

**Fecha de análisis:** 16 de septiembre de 2026  
**Alcance:** revisión estática del repositorio, verificación de compilación del API, lint del frontend y auditoría de dependencias de producción. No se ejecutaron flujos contra una base de datos, no se usaron credenciales ni se modificaron datos.

## 1. Resumen ejecutivo

La solución es un sistema web para administrar el inventario y la operación de una terminal de combustibles. Cubre catálogos operativos, tanques, barcos, tuberías, calibraciones, movimientos de combustible, etanol, aditivos y colorantes, autorizaciones, reportes, ventas y MOVCOM. También incorpora gestión de usuarios, roles, permisos, menús, preferencias, auditoría y traducciones.

La arquitectura es una SPA React que consume una API ASP.NET Core y esta consulta directamente una base de datos SQL Server. El sistema es funcionalmente amplio y tiene controles valiosos: rutas protegidas, permisos por pantalla y acción, auditoría, límite de solicitudes, cabeceras HTTP, validación de adjuntos y soporte bilingüe. Sin embargo, antes de ampliar o publicar el sistema se deben atender riesgos críticos de secretos, credenciales de correo, cifrado de contraseñas, consultas SQL construidas como texto y dependencias vulnerables.

| Indicador | Resultado verificado |
| --- | --- |
| Frontend | React 19, Vite 8, React Router 7, Tailwind 4, Radix/shadcn |
| Backend | ASP.NET Core sobre .NET 10, C#, ADO.NET y Microsoft.Data.SqlClient |
| Persistencia | SQL Server; 54 DAO y 82 DTO |
| Superficie API | 56 controladores y 395 acciones HTTP declaradas |
| Interfaz | 49 módulos de rutas, 301 rutas JSX y 284 páginas JSX/TSX |
| Autorización | 294 rutas protegidas por permiso de pantalla; 295 usos de `RequierePermiso` en API |
| Tamaño aproximado | 36,942 líneas C# y 79,585 líneas JS/TS/JSX/TSX fuente |
| Pruebas automatizadas propias | No se encontraron archivos de pruebas unitarias, integración o E2E |
| Estado de calidad | Lint web correcto; API compila con 0 errores y 146 advertencias |

## 2. Hechos, límites y método

Los apartados marcados como **Hecho** salen de archivos presentes en el repositorio. Los marcados como **Recomendación** son acciones futuras y no describen una funcionalidad ya implementada.

Se revisaron la configuración de los dos proyectos, rutas, servicios web, controladores, DTO/DAO, middleware, autenticación, permisos, scripts de publicación, migraciones SQL y documentación existente. Las conclusiones sobre seguridad son hallazgos de código; no sustituyen una prueba de penetración ni una revisión del esquema y datos reales de SQL Server.

La carpeta `database` contiene solo tres scripts fechados de sincronización de permisos, rutas y traducciones. No incluye el esquema DDL, procedimientos, índices, respaldos ni una historia completa de migraciones; por ello no es posible documentar con certeza todo el modelo físico de la base de datos.

## 3. Arquitectura y flujo principal

```text
Usuario
  │ HTTPS + cookie de sesión
  ▼
SPA React/Vite (`app.web`)
  ├─ Router, rutas privadas y permiso de pantalla
  ├─ Formularios Zod/React Hook Form, i18n, tablas y exportaciones
  └─ Servicios `fetch` con `credentials: include`
  │ HTTPS /api/*
  ▼
API ASP.NET Core (`app.api`)
  ├─ Rate limit, CORS, sesión, cabeceras y manejo global de errores
  ├─ Controladores, auditoría y atributo `RequierePermiso`
  └─ DTO/DAO y ADO.NET
  │ SQL
  ▼
SQL Server (`sysInventario` según la configuración y scripts)
```

### 3.1 Frontend

**Hecho.** La aplicación inicia en `app.web/src/main.jsx` con `HashRouter`; por tanto, las rutas se sirven tras `/#/` y no requieren una regla de reescritura de URLs para navegación interna. `App.jsx` centraliza tema, idioma, usuario actual y carga diferida de servicios. `AppRouter` separa el login (`/`) del árbol privado.

Las rutas privadas verifican primero sesión y, para las pantallas de negocio, comprueban la ruta contra la API. `PrivateRoute` redirige al login si no hay sesión y a inicio si no hay autorización. `ValidarPermiso` envuelve 294 rutas de pantalla con esta comprobación.

El frontend usa carga diferida (`lazy`) para páginas y módulos; React Query para caché de consultas; React Hook Form con Zod para formularios; TanStack Table para listados; i18next para `es-GT` y `en-US`; Chart.js para gráficas; ExcelJS y jsPDF para exportaciones. Tailwind, Radix/shadcn y temas propios componen la interfaz.

### 3.2 Backend

**Hecho.** `app.api` es una API MVC en .NET 10. `Program.cs` configura Swagger/OpenAPI, compresión Brotli/Gzip, CORS con orígenes permitidos, sesión basada en cookie, límite global de solicitudes, middleware de excepciones, cabeceras de seguridad y controladores con JSON en camelCase.

La capa de presentación usa controladores. Cada dominio dispone normalmente de DTO, DAO, operaciones de lista/obtener/agregar/editar/eliminar y log. La capa de datos (`DAL`, `DB` y los DAO) usa `Microsoft.Data.SqlClient` directamente; no se usa Entity Framework ni se identificó una capa de servicios de negocio activa.

### 3.3 Datos, archivos y despliegue

**Hecho.** Las conexiones se construyen desde `webconfig.json` mediante una clase `DB`. La aplicación usa SQL Server y agrega el usuario de sesión a `sp_set_session_context` antes de ejecutar consultas. Hay soporte para transacciones y variantes asíncronas en el DAL.

Los adjuntos permiten JPEG, PNG y PDF. `ArchivoPermitido` revisa extensión, tipo de contenido y firma binaria, una defensa mejor que confiar solo en el nombre del archivo.

El script `compilar-iis.ps1` construye el frontend y publica la API para IIS bajo `iis/sysInventario` e `iis/sysInventarioAPI`, además de generar ZIP. El frontend utiliza variables `VITE_APP_URL`, `VITE_API_URL`, `OPENAPI_SPEC_URL`, `VITE_DATABASE_NAME` y, en producción, `VITE_BASE_PATH`.

## 4. Estructura del repositorio

| Ruta | Responsabilidad |
| --- | --- |
| `app.web/` | SPA React, configuración Vite, estilos, páginas, servicios y validaciones |
| `app.web/src/routes/` | Router público/privado y 49 módulos de rutas |
| `app.web/src/pages/` | Vistas de listas, formularios, detalle, eliminación, logs y procesos especiales |
| `app.web/src/services/` | 56 clientes de la API y servicios de autenticación, idioma y tema |
| `app.api/Controllers/` | 56 controladores HTTP |
| `app.api/Models/` | DTO, DAO, paginación y modelos de cada dominio |
| `app.api/Classes/` | Sesión, autorización, cifrado, auditoría, archivos y middleware |
| `app.api/DAL/` | Conexión y ejecución ADO.NET contra SQL Server |
| `database/` | Tres scripts SQL de mantenimiento de permisos/rutas/traducciones |
| `iis/` | Artefactos de publicación para IIS presentes en el repositorio |
| `documentation/` | Plan de documentación y este análisis |

## 5. Cobertura funcional

La siguiente clasificación expresa funciones encontradas en rutas, páginas, controladores, servicios y traducciones. Que un módulo aparezca no implica que todos los roles puedan usarlo: el acceso depende de los permisos configurados en base de datos.

| Área | Módulos y procesos observados |
| --- | --- |
| Administración y seguridad | Login, usuarios, tipo de usuario, roles, permisos, configuración y preferencias de usuario, cambio de contraseña, idiomas, menú, menú-ruta, traducciones de menú, tareas, notificaciones, log de modificaciones y auditoría. |
| Catálogos operativos | Socios, suplidores, productos y sus tipos, personal interno/externo, compañías de inspección, bahías, brazos, metros, tanques y tuberías. |
| Operación de tanques | Capacidad volumétrica, importación o reemplazo de plantillas, detalle/resumen de capacidad, volumen de tanque, medición de tanque en tierra y calibraciones de combustible, etanol y aditivo. |
| Movimientos de combustible | Saldos iniciales, entradas de producto, salidas, compra/venta entre suplidores, ingresos por tuberías, ingresos de barcos, consumo propio, unidades y ajustes. |
| Etanol | Entradas, salidas, compra/venta, ingresos por tuberías, unidad de entrada/salida y ajustes específicos de etanol. |
| Aditivos y colorantes | Altas, movimientos de ingreso y salida; la salida de colorante puede asociarse a barco. |
| Aprobaciones | Asignación de autorizadores, documentos pendientes, consulta de documento y resolución aprobada/rechazada. |
| Consulta y salida de información | MOVCOM estándar, ventas, reporte de carga, reportes de ingreso de barco, exportaciones Excel/PDF y visualizaciones. |
| Configuración | Información de empresa, logo/fondo y una configuración de correo que admite SMTP, Office 365, Gmail u OAuth2. |

Los patrones de interfaz predominantes son: listado paginado con búsqueda/ordenamiento, alta, edición, visualización, eliminación/desactivación y bitácora. Existen excepciones orientadas al proceso operativo: movimientos, documentos sujetos a autorización, plantillas volumétricas, reportes y carga/descarga.

## 6. API y comunicación con la SPA

**Hecho.** Las rutas de API tienen la forma `api/[controller]`. Se localizaron 395 atributos `HttpGet`, `HttpPost`, `HttpPut`, `HttpDelete` o `HttpPatch`. Predominan GET para listas, opciones, lectura de archivos y logs, y POST para altas, ediciones, eliminaciones, importaciones y aprobación de documentos.

La SPA no usa un cliente HTTP común externo: los servicios construyen llamadas `fetch` a `VITE_API_URL`, con `credentials: "include"`. `apiResponse.js` normaliza errores, especialmente respuestas 401. Esto hace que la API y la configuración de cookies/CORS sean parte crítica del funcionamiento del frontend.

**Hecho.** Swagger se registra en la API, pero el middleware de Swagger y Swagger UI se expone solo cuando el entorno es `Development`. Las variables del frontend incluyen una URL de la especificación OpenAPI, pero no se identificó un portal de documentación ni un uso activo de esa especificación en el código. En producción, la disponibilidad de Swagger dependería de un cambio explícito de configuración o código.

## 7. Sesión, roles y permisos

1. El usuario inicia sesión mediante `POST /api/login/login`.
2. La API verifica usuario y contraseña, guarda identificador de usuario, nombre, rol, idioma y tema en sesión.
3. La cookie de sesión es `HttpOnly`, `Secure` y `SameSite=None`; el tiempo de inactividad configurado es un día.
4. El cliente consulta `validarsesion`, usuario, idioma y tema al entrar al área privada.
5. El cliente valida la ruta actual con `ValidacionAccesosController` para obtener la autorización de pantalla.
6. La API protege operaciones principalmente con `[RequierePermiso(menu, permiso)]`, que valida sesión y consulta la relación rol-menú-permiso.
7. `AuditoriaSistema` registra usuario, sesión, IP, URL, controlador, acción y método de las operaciones decoradas.

**Hecho.** Hay 295 usos del atributo `RequierePermiso` y 360 de `AuditoriaSistema` en controladores. La diferencia con las 395 acciones no prueba por sí sola un fallo: hay acciones de login, sesión, navegación, opciones y algunas verificaciones manuales. Aun así, los controladores con muchas acciones sin el atributo deben revisarse individualmente para confirmar que no exponen datos u operaciones fuera de la política de permisos.

## 8. Integraciones identificadas

| Integración | Evidencia y estado |
| --- | --- |
| SQL Server | Integración central y activa mediante `Microsoft.Data.SqlClient`. |
| IIS | Publicación prevista por `compilar-iis.ps1` y carpetas de artefactos. |
| SMTP/OAuth de correo | El modelo y formularios soportan SMTP, Office 365, Gmail y OAuth2. No se encontró código de envío de correo ni un cliente HTTP/SDK que ejecute la autenticación OAuth. La configuración parece preparatoria o administrable, no una integración de envío demostrada. |
| Exportación local | ExcelJS, jsPDF y utilidades de PDF/Excel en el navegador. |
| Servicios externos de negocio | No se detectaron clientes HTTP activos, colas, almacenamiento cloud, pagos ni APIs de terceros en la fuente revisada. |

## 9. Aspectos positivos encontrados

- La navegación combina verificación de sesión y autorización por ruta; no depende solo de ocultar elementos del menú.
- Las acciones sensibles suelen tener permiso específico y auditoría.
- El backend tiene rate limiting: 10 intentos de login por IP/minuto y 300 solicitudes generales por IP/minuto.
- CORS no es abierto: mantiene una lista de orígenes permitidos y habilita credenciales solo para ellos.
- La API agrega CSP restrictiva, `nosniff`, `DENY` contra framing, política de referencias y de permisos a las respuestas `/api`.
- Se implementan trazas de correlación (`X-Trace-Id`) y un manejador global de excepciones con respuesta consistente.
- Los formularios usan esquemas Zod y existen validaciones de lado servidor en varios controladores.
- Se valida firma y tipo de adjuntos; se usa DOMPurify como dependencia del frontend para contenido HTML.
- La carga diferida, caché de React Query, compresión y división de paquetes de Vite favorecen la experiencia de uso.
- El sistema tiene i18n español Guatemala/inglés Estados Unidos y preferencias persistentes de tema e idioma.

## 10. Riesgos y deuda técnica priorizados

Las prioridades expresan impacto potencial y evidencia de código. No se alteró ningún archivo de aplicación como parte de este análisis.

| Prioridad | Hallazgo y evidencia | Riesgo | Recomendación |
| --- | --- | --- | --- |
| Crítica | `compilar-iis.ps1` contiene una contraseña de base de datos como valor por defecto y `Encriptacion.cs` contiene una clave criptográfica fija. | Cualquier copia del repositorio o paquete puede comprometer infraestructura y datos. La contraseña expuesta debe tratarse como comprometida. | Rotar de inmediato las credenciales y la clave. Retirar valores reales del código y artefactos; recibirlos por secretos de IIS, variables de entorno o un almacén de secretos. Añadir reglas de detección de secretos y exclusión de archivos sensibles. |
| Crítica | `ConfiguracionCorreoController.MapConfiguracionCorreo` devuelve contraseña SMTP, secreto de cliente, refresh token y access token al cliente. | Un usuario con acceso de lectura a esa pantalla puede extraer secretos reutilizables; aumenta el impacto de XSS, logs y cuentas administrativas comprometidas. | No devolver secretos al navegador. Guardarlos cifrados con una clave gestionada, exponer solo indicadores enmascarados y crear una operación explícita, auditada y restringida para actualizar cada secreto. Revocar/rotar los valores existentes. |
| Alta | Las contraseñas se comparan mediante cifrado reversible propio (`EncriptarHex`/`DesencriptarHex`), con clave fija, IV determinista y derivación débil. | Las contraseñas almacenadas pueden recuperarse si se obtiene la clave o se compromete el código/base de datos; no hay resistencia moderna al crackeo. | Migrar a hash adaptativo y salado (por ejemplo, ASP.NET Identity `PasswordHasher`, Argon2id, bcrypt o PBKDF2 con parámetros actuales). Implementar migración al siguiente login y obligar cambio de contraseña tras la rotación. |
| Alta | El DAL recibe SQL como texto; los DAO y controladores ensamblan consultas mediante concatenación. `AsignarParametro` solo aparece como infraestructura y no se encontró uso en DAO; la validación por lista negra `validateSQL` se usa solo en un archivo. | Hay superficie de inyección SQL y errores de escaping, aunque varios valores se conviertan a enteros o se limpien manualmente. Las listas negras no sustituyen parámetros. | Inventariar las 54 DAO y controladores que ejecutan SQL; reemplazar concatenaciones por `SqlParameter` tipados o procedimientos almacenados. Definir listas cerradas para ordenamiento/tablas y agregar pruebas de inyección. |
| Alta | `npm audit --omit=dev` reporta 1 vulnerabilidad crítica directa en `jspdf` y 2 moderadas asociadas a `exceljs`/`uuid`. | Los módulos de exportación pueden procesar entradas controladas por usuarios con librerías vulnerables. | Actualizar `jspdf` a una versión corregida compatible (el reporte ofrece 4.2.1), evaluar la actualización o sustitución de ExcelJS y ejecutar regresión de todas las exportaciones. Bloquear auditoría crítica en CI. |
| Alta | No se encontraron pruebas automatizadas propias ni configuración de CI/CD versionada. | Cambios de inventario, permisos o cálculos pueden llegar a producción sin detección repetible. | Crear pruebas unitarias de cálculos/validaciones, integración de API/DAO con BD de prueba y E2E de login, permisos y movimientos. Configurar una canalización que ejecute lint, build, pruebas, auditoría de dependencias y detección de secretos. |
| Media | La API compila con 146 advertencias, mayormente referencias anulables; hay advertencias en sesión, auditoría, cifrado, DTO y DAO. | Posibles errores de ejecución ante datos ausentes y mantenimiento más difícil. | Establecer `TreatWarningsAsErrors` gradualmente; corregir primero autenticación, sesión, auditoría y DTO de entrada. Usar tipos anulables coherentes, valores por defecto válidos y validación de modelo. |
| Media | La sesión está en memoria distribuida local y dura un día; no se identificó Redis/SQL State Server ni almacenamiento compartido. | Reinicios invalidan sesiones; una instalación con más de un nodo no compartirá estado. | Para alta disponibilidad, usar almacenamiento distribuido real y proteger claves de Data Protection. Acortar/renovar la sesión según política de riesgo. |
| Media | Se usa `SameSite=None` con credenciales cross-origin y no se identificó antiforgery/CSRF explícito. | La política CORS limita navegadores, pero no es una defensa completa contra toda solicitud forjada basada en cookies. | Evaluar misma procedencia en producción o tokens antiforgery para métodos de cambio; conservar CORS con lista estricta y validar `Origin`/`Referer` donde aplique. |
| Media | La conexión acepta `TrustServerCertificate` por configuración y la app depende de `webconfig.json`. | Puede debilitar la validación TLS hacia SQL Server y facilita que secretos residan en archivos desplegados. | Usar certificado válido de SQL Server, eliminar la confianza ciega en producción y desplazar la configuración sensible a secretos del host. |
| Media | Los binarios/publicaciones de IIS, además de dependencias compiladas, están presentes en el árbol de trabajo. | Se incrementa el tamaño, el ruido de cambios y el riesgo de distribuir configuración o artefactos obsoletos. | Versionar solo fuente y scripts de publicación. Publicar ZIP/artefactos desde CI y excluir `bin`, `obj`, `dist`, paquetes IIS y archivos de configuración con secretos. |
| Baja | Swagger UI solo se habilita en Development y no hay portal de documentación creado. | Operadores y consumidores no tienen una referencia visible y versionada en producción/no desarrollo. | Publicar el contrato OpenAPI en entorno protegido y crear el portal técnico propuesto en `PLAN_DOCUMENTACION.md`, sin exponer funciones administrativas al público. |

## 11. Verificación realizada

| Comprobación | Resultado |
| --- | --- |
| `npm run lint` en `app.web` | Correcto, sin salida de errores. |
| `dotnet build app.csproj --no-restore` en `app.api` | Correcto: 0 errores y 146 advertencias. |
| `npm audit --omit=dev` en `app.web` | 3 vulnerabilidades: 1 crítica (`jspdf`) y 2 moderadas (`exceljs`/`uuid`). |
| Pruebas propias | No se encontraron archivos `*.test.*`, `*.spec.*` o proyectos de prueba fuera de dependencias/artefactos. |
| Ejecución funcional | No realizada: requiere instancia SQL Server, configuración segura y cuenta de pruebas autorizada. |

## 12. Módulos prioritarios para el manual de usuario

La prioridad se basa en impacto operativo, dependencia entre procesos y sensibilidad de datos.

1. **Acceso, navegación y permisos:** login, recuperación/cambio de contraseña, lectura del menú y significado de permisos.
2. **Movimientos de inventario:** saldo inicial, entradas, salidas, compra/venta, consumo propio y ajustes; documentar qué acciones generan aprobación.
3. **Barcos, tuberías y autorizaciones:** ingreso de barco, detalle de productos/suplidores, documentos temporales y decisión de aprobación/rechazo.
4. **Tanques y calibraciones:** capacidad volumétrica, importación de plantilla, medición de tanque a tierra y efecto de las calibraciones.
5. **Etanol, aditivos y colorantes:** procedimientos por tipo de producto, con particular atención a unidades y salidas asociadas.
6. **Reportes y MOVCOM:** filtros, significado de cifras, exportación y controles previos a emitir un reporte.
7. **Administración:** usuarios, roles, permisos, catálogos, auditoría y configuración; debe dirigirse solo a personal administrador.

## 13. Propuesta definitiva para el portal de documentación

**Recomendación.** El plan existente es adecuado: crear un portal Docusaurus aislado dentro de `documentation`, sin añadir dependencias al frontend operativo. La estructura propuesta queda así:

```text
documentation/
  docs/
    introduccion.md
    manual/
      acceso-y-navegacion.md
      inventario-combustible.md
      barcos-y-autorizaciones.md
      tanques-y-calibracion.md
      etanol-aditivos-colorantes.md
      reportes-y-movcom.md
      administracion.md
    tecnico/
      arquitectura.md
      frontend.md
      api.md
      base-de-datos.md
      autenticacion-y-permisos.md
      configuracion-y-despliegue.md
      operacion-y-monitoreo.md
      seguridad-y-riesgos.md
    api/
      uso-de-swagger.md
  static/img/manual/
  docusaurus.config.js
  sidebars.js
  package.json
```

El manual debe describir las acciones observables por los usuarios y condicionarlas al permiso correspondiente. La documentación técnica debe separar la descripción actual de las recomendaciones de seguridad de este informe. Las capturas solo deben realizarse con entorno y cuentas de prueba autorizadas; no deben incluir nombres reales, datos de inventario, sesiones, tokens, contraseñas, cadenas de conexión ni la configuración de correo.

## 14. Hoja de ruta recomendada

### Inmediato: antes de una nueva publicación

1. Rotar la contraseña de base de datos, la clave criptográfica y todas las credenciales/tokens de correo presentes o derivados del repositorio.
2. Retirar secretos de scripts y respuestas API; impedir que la lectura de configuración de correo devuelva valores secretos.
3. Actualizar `jspdf` y revisar ExcelJS/uuid, validando la generación de Excel/PDF.
4. Probar los flujos de autenticación, autorización, movimientos y exportaciones con datos de prueba después de los cambios.

### Corto plazo: una o dos iteraciones

1. Cambiar el almacenamiento de contraseñas a hash adaptativo y planificar migración segura.
2. Parametrizar por completo las consultas SQL e introducir pruebas de inyección y autorización.
3. Corregir las advertencias de nulabilidad de mayor riesgo y normalizar validación de DTO de entrada.
4. Añadir suite mínima automatizada y canalización de calidad/seguridad.

### Mediano plazo

1. Definir migraciones versionadas, esquema de base de datos y estrategia de respaldo/restauración.
2. Preparar sesión distribuida y protección de claves para un despliegue escalable.
3. Crear el portal de documentación, iniciando por los siete módulos priorizados.
4. Formalizar monitoreo, retención de auditoría, procedimiento de incidentes y revisión periódica de permisos.

## 15. Conclusión

El proyecto tiene una cobertura operativa considerable y una base de controles de acceso/auditoría que es apropiada para un sistema de inventario sensible. Su principal necesidad no es añadir más módulos, sino cerrar brechas de seguridad y establecer una red de pruebas y despliegue repetible. Con la rotación de secretos, la protección de credenciales de correo, la migración de contraseñas, la parametrización de SQL y las actualizaciones de dependencias como prioridades, el sistema estará en una posición mucho más segura para documentarse, evolucionar y operar.
