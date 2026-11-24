# Informe final — Reto Final Electiva I

> Plantilla para consignar los resultados de las 4 etapas. Se entrega el día anterior a la sustentación final.

## Datos generales

- Equipo:
- Integrantes: 
  - Juan Esteban Moreno Gamboa
  - Bryan Nicolas Sanchez Vargas
  - Fredy Oswaldo López Daza
- Fecha de entrega: ______________________
- Sitio web evaluado: https://practicesoftwaretesting.com/ (Practice Software Testing / Toolshop). Alternativa usada por inestabilidad del demo de PrestaShop; la suite PrestaShop se conserva en el repositorio.
- API(s) evaluadas: JSONPlaceholder, restful-api.dev, httpbin, FakerAPI, Open-Meteo y Practice Software Testing (Toolshop)


## 1. Etapa 1 — Pruebas E2E (Cypress)

- Herramienta y versión: Cypress 13.17.0 (Electron 118, Node.js 22.22.0).
- Sitio evaluado: <https://practicesoftwaretesting.com/> (Toolshop). La suite PrestaShop se conserva como alternativa en `tests/e2e-web/cypress/e2e/checkout/` y `tests/e2e-web/cypress/e2e/negative/`.
- Casos happy path ejecutados (crear cuenta, login, agregar 2 productos, checkout): 5 pasos en `tests/e2e-web/cypress/e2e/toolshop/checkout-happy-path.cy.js` — crear cuenta, iniciar sesión, agregar `Combination Pliers`, agregar `Pliers`, completar checkout con dirección y pago Cash on Delivery.
- Pruebas negativas ejecutadas (mínimo 3): 3 casos en `tests/e2e-web/cypress/e2e/toolshop/negative/negative-checkout.cy.js` — credenciales incorrectas, checkout con carrito vacío, tarjeta inválida.
- Resultados (ejecutadas / pasadas / fallidas): 8 ejecutadas / 8 pasadas / 0 fallidas.
- Reporte: `results/e2e-web/toolshop-e2e-report.md`
- Evidencias: `tests/e2e-web/cypress/videos/checkout-happy-path.cy.js.mp4`, `tests/e2e-web/cypress/videos/negative-checkout.cy.js.mp4`
- Hallazgos:
  - El demo renovó IDs de productos; se actualizaron a los IDs vigentes del catálogo.
  - La UI puede aparecer en español; las pruebas usan `data-test` y aceptan mensajes en ambos idiomas.
  - El checkout de Toolshop no expone un selector separado de método de envío; se documentó la adaptación en el reporte.

## 2. Etapa 2 — Pruebas móviles (Appium)

- Herramienta, emulador y versión:
- Happy path de checkout ejecutado:
- Resultados (ejecutadas / pasadas / fallidas):
- Reporte: `results/mobile/`
- Evidencias: `evidences/mobile/`
- Hallazgos:

## 3. Etapa 3 — API Testing (Postman/Newman)

> Responsable: Integrante 2. Detalle técnico y comandos en [`tests/api/README.md`](../tests/api/README.md).

- **Herramientas y versiones:** Postman (colección v2.1), Newman 6.2.3, newman-reporter-htmlextra 1.23.1, Node.js 20.20.2.
- **APIs evaluadas:** JSONPlaceholder, restful-api.dev, httpbin, FakerAPI, Open-Meteo y Practice Software Testing (Toolshop): 6 de las 6 sugeridas por el enunciado.
- **Número de pruebas automatizadas (mínimo 20):** **34 requests distintos**, cada uno con entre 2 y 6 aserciones (128 aserciones por iteración), organizados en 6 carpetas:

| API | Requests | Métodos | Tiempo prom. / máx. (ms) |
| --- | ---: | --- | ---: |
| JSONPlaceholder | 9 | GET, POST, PUT, PATCH, DELETE | 120 / 288 |
| restful-api.dev (CRUD encadenado) | 7 | POST, GET, PUT, PATCH, DELETE | 446 / 733 |
| httpbin | 7 | GET, POST, PUT, DELETE, HEAD, OPTIONS | 123 / 326 |
| FakerAPI | 3 | GET | 1403 / **5816** |
| Open-Meteo | 2 | GET | 158 / 320 |
| Practice Software Testing | 6 | GET, POST | 661 / 1690 |

- **Técnicas aplicadas:** 7 métodos HTTP (GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS); 26 casos positivos y 8 negativos (400, 401, 404 ×4, 405, 418); validación con esquemas JSON (`tests/api/schemas/`); encadenamiento de variables (id del objeto creado en restful-api.dev, producto del catálogo de Toolshop); ejecución *data-driven* con 2 iteraciones (`data/iterations.json`: Tunja y Bogotá); aserción global de tiempo de respuesta < 5000 ms.
- **Resultados (ejecución del 22/11/2026, 23:06):**

| Métrica | Ejecutadas | Fallidas |
| --- | ---: | ---: |
| Iteraciones | 2 | 0 |
| Requests | 68 | 0 |
| Aserciones | 256 | **1** |

  Duración total 28,6 s; tiempo de respuesta promedio 399 ms (mín. 75 ms, máx. 5816 ms). **255 de 256 aserciones pasaron (99,6 %).**
- **Reporte:** [`results/api/newman-report.html`](../results/api/newman-report.html) (htmlextra), `newman-junit.xml` (JUnit, para CI) y `newman-summary.json`.
- **Evidencias:** [`evidences/api/`](../evidences/api/) — `01-newman-htmlextra-resumen.png` y `newman-cli-output.txt` (salida completa de consola).
- **Hallazgos:**
  1. **FakerAPI incumple el umbral de 5 s.** `FK-01 GET personas` tardó 5816 ms en la iteración 2 (en una corrida previa de verificación tardó 9280 ms). Es la única aserción fallida y se reproduce entre corridas: la generación de datos con *locale* es la operación más lenta de las 6 APIs (promedio 1,4 s frente a 0,1–0,7 s del resto). No se relajó el umbral para ocultarlo; se reporta como riesgo de latencia de un servicio externo.
  2. restful-api.dev protege los objetos de ejemplo: un `PUT` sobre un id reservado responde **405** con un mensaje explicativo, en lugar de sobrescribirlos.
  3. JSONPlaceholder simula las escrituras: `POST` siempre devuelve `id = 101` y los cambios no persisten, así que el ciclo CRUD real y encadenado se hizo en restful-api.dev, donde el `GET` posterior al `DELETE` devuelve 404.
  4. Practice Software Testing responde `401 {"error":"Unauthorized"}` ante credenciales inválidas sin filtrar información adicional (no indica si el usuario existe).

## 4. Etapa 4 — Pruebas de rendimiento

### 4.1 Pruebas de carga (10, 20 y 50 usuarios concurrentes)

- Herramienta y configuración: Apache JMeter 5.x. Planes en `tests/performance/load/plans/` contra `https://practicesoftwaretesting.com/` (GET `/`, 1 iteración por usuario, ramp-up igual al número de usuarios, Cookie/Header Manager, Summary Report).
- Ejecución:

  ```bash
  bash tests/performance/load/run-all.sh
  ```

- Resultados por nivel de concurrencia (tiempo de respuesta, throughput, errores):

  | Usuarios | Ramp-up | Promedio (ms) | P95 (ms) | Mín (ms) | Máx (ms) | Throughput (req/s) | Error % | Duración (s) |
  | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
  | 10 | 10 s | 829.00 | 1141.75 | 679 | 1144 | 0.99 | 0.00% | 10.14 |
  | 20 | 20 s | 762.70 | 1131.25 | 680 | 1155 | 1.01 | 0.00% | 19.73 |
  | 50 | 50 s | 726.54 | 1124.10 | 671 | 1217 | 1.01 | 0.00% | 49.66 |

- Reporte: `results/performance/load-report.html` (resumen consolidado generado desde los JTL).
- Archivos JTL: `results/performance/load-10-users.jtl`, `results/performance/load-20-users.jtl`, `results/performance/load-50-users.jtl`.
- Informe de las 3 pruebas: las tres ejecuciones completaron sin errores. El throughput se mantuvo ~1 req/s, coherente con 1 iteración por usuario y ramp-up igual a la concurrencia. El P95 se mantuvo estable (~1124–1142 ms) al aumentar de 10 a 50 usuarios; no se observaron fallos HTTP en estas muestras. Nota: Toolshop es SPA, por lo que JMeter midió la respuesta HTTP inicial, no el render completo del navegador.

### 4.2 Pruebas de estrés (2 pruebas, recursos máximos)

> Responsable: Integrante 2. Planes, comandos y detalle en [`tests/performance/stress/README.md`](../tests/performance/stress/README.md).

- **Herramienta:** Apache JMeter 5.6.3 en modo no-GUI (Java 25).
- **Sistema bajo prueba:** PrestaShop 8.2 (Apache + PHP, catálogo de demostración) + MySQL 8.0, levantados en Docker en `http://localhost:8090`. Ver [ADR-003](./decisiones.md#adr-003--entorno-de-las-pruebas-de-estrés) para entender por qué no se estresó la demo pública: está protegida por Cloudflare y es un servicio de terceros.
- **Configuración de la máquina de prueba:**

| Componente | Recursos |
| --- | --- |
| Equipo | Mac Apple M5 (Mac17,3), 10 núcleos, 16 GB RAM, macOS 27.2.1 |
| Generador de carga (JMeter) | Heap `-Xms2g -Xmx6g`: el máximo asignable sin ahogar al SO ni a Docker. Uso real máximo: 67 % de un núcleo y 748 MiB, así que **el generador nunca fue el cuello de botella** |
| Docker Desktop 29.8.0 | 10 CPU / 8 GB para la VM |
| PrestaShop (contenedor) | límite 2 CPU / 2 GB |
| MySQL (contenedor) | límite 1 CPU / 1 GB, `max_connections=500` |

- **Escenario (ambas pruebas):** cada usuario virtual abre una sesión nueva y recorre Home → Categoría → Búsqueda → Producto → **Agregar al carrito (POST AJAX, escribe en BD)** → Ver carrito, con aserciones de contenido en cada paso y timeouts de 10 s (conexión) y 30 s (respuesta).
- **Criterios:** *degradación* = primera ventana de 30 s con p95 > 5 s; *quiebre* = primera ventana con más de 5 % de errores.

#### Prueba de estrés 01 — Rampa incremental (0 → 600 usuarios en 10 min, 12 min en total)

| Métrica | Valor |
| --- | --- |
| Muestras / errores | 34.422 / 2.030 (**5,90 %**) |
| Throughput medio / máximo sostenido | 47,3 req/s / ~60 req/s |
| Tiempo de respuesta | promedio 6.761 ms · p90 26.467 ms · p95 30.001 ms |
| APDEX (T = 500 ms) | 0,113 |
| **Degradación** | minuto 2,5 con **~189 usuarios**: p95 6,9 s, todavía sin errores |
| **Quiebre** | minuto 5,5 con **~387 usuarios**: 5,1 % de error, p95 30 s (timeout) |
| A 600 usuarios | entre 12 % y 22 % de error, promedio de 10–13 s |

Evolución (extracto de [`resumen.md`](../results/performance/stress/stress-01-rampa-incremental/resumen.md)):

| Usuarios | req/s | % error | p95 (ms) | CPU PrestaShop (de 200 %) | CPU MySQL (de 100 %) |
| ---: | ---: | ---: | ---: | ---: | ---: |
| 31 | 23,2 | 0,0 | 54 | 37 | 27 |
| 63 | 57,4 | 0,0 | 606 | 114 | 75 |
| 94 | 45,5 | 0,0 | 2.256 | 155 | **99** |
| 189 | 34,5 | 0,0 | 6.862 | 166 | 103 |
| 387 | 40,9 | 5,1 | 30.000 | 164 | 101 |
| 535 | 59,1 | 6,4 | 30.001 | 158 | 100 |
| 600 | 52,6 | 19,2 | 30.002 | 161 | 100 |

#### Prueba de estrés 02 — Pico súbito (800 usuarios en 20 s, sostenidos 5 min)

| Métrica | Valor |
| --- | --- |
| Muestras / errores | 18.507 / 6.205 (**33,53 %**) |
| Throughput medio | 59,5 req/s (no crece aunque haya 800 usuarios) |
| Tiempo de respuesta | promedio 12.601 ms · mediana 4.325 ms · p90 30.001 ms |
| APDEX (T = 500 ms) | 0,015 |
| Tipos de error | 3.159 *Read timed out* (51 %), 2.868 *Connection reset* (46 %), 178 carritos vacíos (3 %) |
| Quiebre | **inmediato**: desde la primera ventana de 30 s hubo 24,9 % de error, y Apache alcanzó `MaxRequestWorkers` **13 s** después de empezar |
| Recuperación | cuando terminó la carga, la tienda volvió a responder `200` en 20–40 ms en menos de 25 s, sin reinicios ni *OOM kill* |

#### Repetición de la prueba 02 y variante de 300 usuarios

Para confirmar los números se repitió la prueba 02 con el mismo plan (*corrida 2*, grabada en video). Para ver cómo cambia el quiebre se ejecutó además una **variante con 300 usuarios** que también entran en 20 s y se sostienen 5 min (`-Jusers=300`). Las tres corridas se hicieron el 22/11/2026 sobre el mismo entorno. Antes de la corrida 2, la base ya acumulaba 8.125 carritos de las pruebas anteriores.

| Métrica | 02 · 800 usuarios (corrida 1) | 02 · 800 usuarios (corrida 2) | Variante · 300 usuarios |
| --- | ---: | ---: | ---: |
| Horario | 23:24–23:29 | 23:48–23:53 | 23:53–23:58 |
| Muestras | 18.507 | 18.010 | 15.498 |
| **% error** | **33,53 %** | **35,90 %** | **0,00 %** |
| Throughput medio | 59,5 req/s | 57,8 req/s | 51,2 req/s |
| Promedio / mediana | 12.601 / 4.325 ms | 12.960 / 5.387 ms | 5.444 / 2.987 ms |
| p95 | 30.002 ms (timeout) | 30.002 ms (timeout) | 20.174 ms |
| APDEX (T = 500 ms) | 0,015 | 0,015 | 0,021 |
| `MaxRequestWorkers` alcanzado | a los 13 s | a los 13 s | a los 11 s |
| CPU MySQL / PrestaShop (máx.) | 106 % / 206 % | 110 % / 205 % | 103 % / 202 % |
| Errores | 3.159 timeouts, 2.868 resets, 178 carritos vacíos | 3.324 timeouts, 2.915 resets, 227 carritos vacíos | ninguno |
| Recuperación tras la carga | 200 en 20–40 ms | no medida aparte (la variante empezó enseguida) | 200 en 20–40 ms |

- **Reproducibilidad:** las dos corridas de 800 usuarios difieren en 2,4 puntos de error y 1,7 req/s, y en ambas el pool de Apache se agotó a los 13 s. El resultado es consistente; la diferencia es variación normal más el crecimiento de la base de datos entre corridas.
- **Cómo cambia el quiebre:** con 300 usuarios la tienda **se degrada pero no se quiebra**. Nadie recibe error, pero el usuario típico espera 3 s y el 5 % más lento unos 20 s, siempre por debajo del timeout de 30 s. Con 800 usuarios las esperas superan los 30 s y aparecen los timeouts y las conexiones reiniciadas. En los dos casos el throughput es casi el mismo (~51–60 req/s): **la capacidad del sistema es fija** y la carga adicional solo se convierte en cola.
- **Comprobación con la ley de Little** (N = X · (R + Z), con Z ≈ 0,2 s de pensamiento): para 300 usuarios predice R = 300 / 51,2 − 0,2 ≈ **5,7 s**, y se midieron 5,4 s; para 800 predice R ≈ 800 / 57,8 − 0,2 ≈ **13,6 s**, y se midieron 12,6–13,0 s. El tiempo de respuesta crece linealmente con los usuarios porque el throughput está topado por la CPU de MySQL. Esto ubica el quiebre por pico entre 300 y ~400 usuarios, igual que en la rampa (~387).

- **Comportamiento ante el agotamiento de recursos:**
  1. **El primer recurso en agotarse es la CPU de MySQL.** Con solo ~94 usuarios llegó al 99–100 % de su núcleo y ahí se quedó el resto de ambas pruebas. Desde ese momento el throughput deja de crecer (techo de ~35–60 req/s) y lo que crece es el tiempo de espera. PrestaShop hace muchas consultas por página (carrito, conexiones de invitado, estadísticas), así que la base de datos es el cuello de botella.
  2. **Después se agota el pool de procesos de Apache.** PrestaShop llegó a 151 procesos (150 workers de `mpm_prefork` + el padre) y el log registró `AH00161: server reached MaxRequestWorkers` en el minuto 2,5 de la prueba 01 y a los 13 s de la prueba 02. Las conexiones nuevas quedan en cola y terminan en **timeout de 30 s** o, cuando se desborda la cola, en **Connection reset**.
  3. **La memoria no fue el límite:** PrestaShop usó como máximo ~1,6 GB de 2 GB (78 %) y ningún contenedor fue terminado por falta de memoria (`OOMKilled=false`). MySQL ocupó su 1 GB completo, sobre todo como caché.
  4. **La primera página de cada sesión es la más castigada:** *Home*, donde cada usuario virtual abre una conexión y una sesión nuevas, tuvo 20 % de error en la prueba 01 y 44 % en la 02, mientras que *Ver carrito*, el último paso del recorrido, tuvo 0,2 % y 25 %. Esto encaja con conexiones nuevas esperando en la cola de Apache.
  5. **Hay fallos en cascada en el flujo de negocio:** 9 casos en la prueba 01 y 178 en la 02 muestran el carrito vacío porque el `POST` de agregar al carrito había expirado. Para el usuario, la compra se pierde aunque la página cargue.
  6. **El sistema falla de forma limpia y se recupera solo:** hubo **cero respuestas 5xx**, tanto en los JTL como en el access log de Apache. Todos los errores fueron timeouts o conexiones reiniciadas, y al retirar la carga la tienda volvió a la normalidad sin intervención.
- **Conclusión:** con estos recursos, la tienda atiende bien hasta **~60 usuarios concurrentes** (p95 < 1 s), se degrada desde **~190** y se quiebra desde **~390** usuarios en rampa. Un pico de 300 usuarios la degrada sin errores (p95 ≈ 20 s), y uno de 800 la quiebra de inmediato (34–36 % de error, confirmado en dos corridas). Recomendaciones: dar más CPU a MySQL o usar réplicas de lectura, activar caché de página completa o un CDN para Home y Categoría (las páginas más lentas), migrar Apache de `prefork` a `event` + PHP-FPM ajustando `MaxRequestWorkers`, y poner una cola o *rate limiting* delante del checkout para picos.
- **Reporte:** [`results/performance/stress/`](../results/performance/stress/). Cada prueba tiene su `dashboard/index.html` (dashboard HTML de JMeter), `resumen.md`, `recursos.csv` (CPU y memoria cada 2 s), `contenedores-post.txt`, `prestashop-errores.txt` y `results.jtl.gz` (muestras crudas).
  La corrida 2 y la variante están en `stress-02-pico-subito-corrida-2/` y `stress-02-pico-subito-variante-300u/`.
- **Evidencias:** [`evidences/performance/stress/`](../evidences/performance/stress/). Salida de consola de JMeter y capturas del dashboard de cada corrida.
- **Video para la sustentación:** [`stress-02-pico-subito-corrida-2.mp4`](../evidences/performance/stress/stress-02-pico-subito-corrida-2.mp4) (33 s) y [`stress-02-pico-subito-variante-300u.mp4`](../evidences/performance/stress/stress-02-pico-subito-variante-300u.mp4) (32 s). Son grabaciones reales de la terminal, aceleradas 5× y sin los tiempos muertos, con la configuración, el resumen de JMeter cada 10 s y el uso de recursos. Los `.cast` correspondientes se pueden reproducir a velocidad real con `asciinema play <archivo>.cast`.

### 4.3 Prueba de desempeño (2 horas, 20–50 usuarios)

- Usuarios concurrentes seleccionados:
- Duración efectiva:
- Tendencias de tiempo de respuesta y consumo de recursos:
- Reporte: `results/performance/`

## 5. Conclusiones

- Estado general de la plataforma:
- Riesgos encontrados:
- Recomendaciones:

## 6. Anexos

- Demo o video breve de la ejecución: `evidences/`
- Capturas representativas: `evidences/<tipo-de-prueba>/`
- Logs de ejecución: `evidences/<tipo-de-prueba>/`

## Checklist de sustentación

- [ ] Suite de las 4 etapas ejecutada sin errores de configuración.
- [ ] Informe con resultados de las 4 etapas.
- [ ] Reportes en `results/`.
- [ ] Evidencias en `evidences/`.
- [ ] Demo o video breve listo para la sustentación.
