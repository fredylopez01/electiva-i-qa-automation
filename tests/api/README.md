# Etapa 3 — API Testing (Postman + Newman)

Automatización de **34 pruebas de API diferentes** (el enunciado pide mínimo 20) con Postman y ejecución por CLI con Newman.
Responsable: **Integrante 2** (ver [`docs/distribucion-trabajo.md`](../../docs/distribucion-trabajo.md)).

## Cobertura

| Carpeta de la colección | API | Requests | Qué se valida |
| --- | --- | ---: | --- |
| 01 - JSONPlaceholder | <https://jsonplaceholder.typicode.com/> | 9 | CRUD completo de `/posts` (GET, POST, PUT, PATCH, DELETE), recurso anidado `/comments`, filtro data-driven por `userId`, esquema JSON, 404 |
| 02 - restful-api.dev | <https://restful-api.dev/> | 7 | Ciclo de vida **real y encadenado** de un objeto: POST → GET → PUT → PATCH → DELETE → GET 404, y 405 sobre id reservado |
| 03 - httpbin | <https://httpbin.org/> | 7 | Eco de query params, cabeceras, JSON y formulario urlencoded; métodos HEAD y OPTIONS (CORS); código 418 |
| 04 - FakerAPI | <https://fakerapi.it/> | 3 | Cantidad y *locale* solicitados, esquema de cada persona, EAN de productos, 404 |
| 05 - Open-Meteo | <https://open-meteo.com/> | 2 | Pronóstico de Tunja/Bogotá: esquema, coordenadas, zona horaria, rangos físicos; 400 por latitud inválida |
| 06 - Practice Software Testing | <https://api.practicesoftwaretesting.com/> | 6 | Catálogo paginado, detalle encadenado con esquema, búsqueda data-driven, marcas, login inválido 401, 404 |

- **Métodos HTTP:** GET, POST, PUT, PATCH, DELETE, HEAD y OPTIONS. (El "FETCH" del enunciado no es un método HTTP estándar; se cubren todos los métodos estándar que ofrecen las APIs.)
- **Pruebas negativas:** 8 (404, 405, 400, 401 y 418).
- **Aserción global:** cada request verifica además un tiempo de respuesta menor a `maxResponseTimeMs` (5000 ms).
- **Data-driven:** `data/iterations.json` tiene 2 filas (Tunja y Bogotá); Newman ejecuta la colección completa una vez por fila → 68 requests y 256 aserciones por corrida.
- **Esquemas JSON:** `schemas/*.json` (draft-07), validados con `pm.response.to.have.jsonSchema` / `tv4`.

## Estructura

```
collections/   reto-final-api.postman_collection.json   # Importable en Postman (v2.1)
environments/  public-apis.postman_environment.json     # URLs base de las 6 APIs + umbral de tiempo
data/          iterations.json                          # Datos de las iteraciones de Newman
schemas/       *.schema.json                            # Esquemas para validar las respuestas
scripts/       build-collection.js                      # Fuente de la colección (genera el JSON)
               run-newman.js                            # Ejecuta Newman y publica reportes/evidencias
reports/       (generado, ignorado por Git)
```

> La colección es un archivo **generado**: los esquemas de `schemas/` se incrustan como variables de colección para que
> funcionen igual en Postman y en Newman. Para cambiar una prueba, edita `scripts/build-collection.js` y ejecuta `npm run build`.
> Si se edita en Postman, exporta la colección (v2.1) sobre el mismo archivo.

## Ejecución

Requisitos: Node.js 18+ (probado con Node 20.20.2) y conexión a Internet.

```bash
cd tests/api
npm install
npm run build          # (opcional) regenera la colección desde scripts/build-collection.js
npm test               # ejecución rápida, solo salida por consola
npm run test:report    # ejecución completa con reportes HTML, JUnit y JSON
```

`npm run test:report` equivale a:

```bash
newman run collections/reto-final-api.postman_collection.json \
  -e environments/public-apis.postman_environment.json \
  -d data/iterations.json \
  -r cli,htmlextra,junit,json \
  --reporter-htmlextra-export reports/newman-report.html \
  --reporter-junit-export reports/newman-junit.xml \
  --reporter-json-export reports/newman-summary.json
```

y además copia los reportes a `results/api/` y guarda la salida de consola en `evidences/api/newman-cli-output.txt`.

Para usarla en Postman: *Import* → `collections/reto-final-api.postman_collection.json` y `environments/public-apis.postman_environment.json`,
seleccionar el environment y ejecutar con el *Collection Runner* (opcionalmente con `data/iterations.json`).

## Resultados y evidencias

- Reportes: [`results/api/`](../../results/api/) — `newman-report.html` (htmlextra), `newman-junit.xml`, `newman-summary.json`
- Evidencias: [`evidences/api/`](../../evidences/api/) — captura del reporte y salida de consola
- Análisis: [`docs/informe-final.md`](../../docs/informe-final.md), sección 3
