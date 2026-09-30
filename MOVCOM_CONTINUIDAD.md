# Continuidad: reporte MOVCOM Ambiente y Standard

## Objetivo acordado

El mismo archivo Excel debe mostrar primero todos los bloques de **Ambiente** y después los bloques **Standard**, sin crear nuevas pestañas. Cada cálculo debe conservar su consulta, endpoint y llamada de frontend independiente, para que se pueda cambiar uno sin alterar el otro.

## Reglas de cálculo confirmadas

- Standard usa `Importe` / `ImporteComponente`.
- Ambiente usa `Cantidad` / `CantidadComponente`.
- Etanol: aplicar `CantidadComponente * (100 - PorcentajeAdictivo) / 100` para Ambiente. Se mantiene la deduplicación de folios por `(FolioAnio, FolioMes, Folio, NoOrden, IdRecord)`.
- Super y VPower se consolidan para el cálculo de MOGAS 95.
- El etanol de MOGAS 91 debe revisarse contra aproximadamente 10% cuando aplique.

## Cambios hechos

- Se agregaron bloques Ambiente y Standard para ingresos de barco, movimientos por unidad y compra/venta de suplidores en `Reportes`.
- Se agregaron detalle por suplidor y resumen final Ambiente antes de Standard.
- La pestaña existente `Tanques` ahora presenta Ambiente antes de Standard.
- Se crearon rutas Ambiente para los diarios:
  - `ConsumosBiDiariosCombustiblesAmbiente`
  - `ConsumosBiDiariosAditivosAmbiente`
  - `ConsumosBiDiariosEtanolAmbiente`
- El frontend ya consulta estas tres rutas y pasa sus arreglos al generador Excel.
- Combustible y etanol permiten seleccionar Ambiente reemplazando `ImporteComponente` por `CantidadComponente` en la misma consulta y con la misma deduplicación.

## Pendiente principal

Terminar las tablas diarias dentro de cada pestaña de suplidor:

1. Combustible diario Ambiente.
2. Aditivos diarios Ambiente.
3. Etanol diario Ambiente.
4. Debajo de las tres anteriores, conservar combustible, aditivos y etanol Standard.
5. Validar el Excel para comprobar posiciones, totales y ausencia de duplicados.

## Archivos a continuar

- `app.api/Models/MovComStandar/MovComStandarDAO.cs`
- `app.api/Controllers/MovComStandarController.cs`
- `app.web/src/services/movComStandarService.js`
- `app.web/src/pages/movComStandar/movComStandarPage.jsx`
- `app.web/src/utils/movComStandarExcel.js`

## Estado técnico importante

- `movComStandarExcel.js` contiene el ciclo diario de las pestañas de suplidor concentrado en una línea extensa, iniciando cerca de la línea 89. Debe refactorizarse en funciones separadas antes de insertar las tres llamadas Ambiente.
- Ya existe una función local `agregarTablaAmbiente` cerca de ese ciclo; debe reutilizarse para combustible, aditivos y etanol Ambiente.
- Las tres colecciones ya llegan al generador:
  - `consumosBiDiariosAmbiente`
  - `consumosBiDiariosEtanolAmbiente`
  - `consumosBiDiariosCombustiblesAmbiente`
- No se deben dejar bloques temporales ni código muerto al terminar el refactor.

## Validaciones ejecutadas

- `dotnet build app.sln --no-restore -clp:ErrorsOnly` desde `app.api`: sin errores.
- `npx eslint src/utils/movComStandarExcel.js src/pages/movComStandar/movComStandarPage.jsx src/services/movComStandarService.js`: sin errores en la última validación.
- `npm run build` desde `app.web`: exitoso.

## Instrucciones del proyecto

- No crear archivos SQL ni CSV.
- No dejar la aplicación ejecutándose.
- Usar `apply_patch` para editar archivos.
- No usar `git status`.
