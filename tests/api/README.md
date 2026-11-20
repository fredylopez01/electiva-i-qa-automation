# Etapa 3 — API Testing (Postman + Newman)

Automatización de **al menos 20 pruebas de API diferentes** con Postman y ejecución por CLI con Newman.

## APIs sugeridas por el enunciado

- <https://fakerapi.it/>
- <https://open-meteo.com/>
- <https://restful-api.dev/>
- <https://httpbin.org/>
- <https://jsonplaceholder.typicode.com/>
- <https://api.practicesoftwaretesting.com/api/documentation>

## Estructura

```
collections/    # Colecciones Postman (mínimo 20 pruebas)
environments/   # Variables por entorno (baseUrl, tokens, etc.)
data/           # Datos para las iteraciones de Newman
schemas/        # Esquemas para validar las respuestas
reports/        # Reportes generados por Newman
```

## Ejecución

```bash
npm install
newman run collections/<coleccion>.json \
  -e environments/<entorno>.json \
  -d data/<datos>.json \
  -r cli,html \
  --reporter-html-export reports/newman-report.html
```

## Resultados y evidencias

- Reportes: `results/api/`
- Evidencias: `evidences/api/`
