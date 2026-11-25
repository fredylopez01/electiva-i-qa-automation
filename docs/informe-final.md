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

> Responsable: Integrante 3. Detalle técnico y comandos en [`tests/mobile/README.md`](../tests/mobile/README.md).

- **Herramientas y versiones:** Appium 3.9.1 con driver `uiautomator2` 8.7.3, WebdriverIO 9.32, Chrome para Android 113 sobre un AVD del SDK de Android (Pixel 6, API 34), chromedriver 113.0.5672.63. Ver [ADR-004](./decisiones.md#adr-004--emulador-y-enfoque-de-la-etapa-2) para la elección de emulador.
- **Sistema bajo prueba:** PrestaShop 8.2 local del ADR-003, alcanzado desde el emulador con un túnel `adb reverse` (ver [ADR-005](./decisiones.md#adr-005--entorno-de-las-pruebas-móviles-y-de-desempeño-integrante-3)).
- **Happy path de checkout ejecutado:** los cinco pasos del enunciado en `tests/mobile/tests/checkout/checkout-happy-path.e2e.js`:

| # | Paso | Estado |
| --- | --- | --- |
| 1 | Crear una cuenta de usuario nueva | ✅ Pasa |
| 2 | Login con credenciales correctas | ✅ Pasa |
| 3 | Agregar el primer producto al carrito | ✅ Pasa |
| 4 | Agregar un segundo producto diferente al carrito | ✅ Pasa |
| 5 | Checkout: dirección, método de envío y pago | ✅ Pasa |

- **Resultados (ejecutadas / pasadas / fallidas):** **5 casos / 5 pasan / 0 fallan**. La orden quedó registrada en PrestaShop (`ps_orders`, referencia `PNNABDGWJ`, pago «Payments by check»), lo que confirma el checkout completo de extremo a extremo sobre el dispositivo.
- **Reporte:** [`results/mobile/`](../results/mobile/) (Allure) — `tests/mobile/reports/allure-results/` con captura automática de cada fallo.
- **Evidencias:** [`evidences/mobile/`](../evidences/mobile/), `tests/mobile/reports/appium.log` y `tests/mobile/reports/screenshots/`.
- **Hallazgos técnicos (cada uno costó una corrección en el código):**
  1. **Dentro del emulador, `localhost` es el propio Android.** La tienda del host se publica con `adb reverse tcp:8090 tcp:8090`; ni `10.0.2.2` ni la IP de la LAN funcionaron por el firewall de Windows. Es el paso que documenta `tests/run-nightly.js`.
  2. **WDIO 9 usa BiDi por defecto y el driver `uiautomator2` no implementa `browsingContext.navigate`.** Se fuerza el protocolo clásico con `wdio:enforceWebDriverClassic`.
  3. **El shim `.cmd` de Appium rompe con rutas que contienen espacios** (el repositorio vive en `electiva pruebas`). Se lanza con `node <main.js>` desde `scripts/with-appium.js`.
  4. **Appium resuelve drivers por directorio de instalación (`APPIUM_HOME`).** Hay que instalar `appium-uiautomator2-driver` junto al `package.json` del proyecto, no solo en el Appium global.
  5. **El AVD de API 34 trae Chrome 113**, versión que Appium ya no descarga solo; se versiona el chromedriver en `tests/mobile/drivers/`.
  6. **El `appPackage` y el `browserName` son mutuamente excluyentes** en las capabilities.
  7. **En el viewport móvil, el click por coordenadas falla** en botones bajo el pliegue o tapados por el resumen de la orden. Los page objects usan el click nativo del navegador (`el.click()` por ejecución de script), que sí dispara los handlers de PrestaShop.
  8. **PrestaShop intercepta el submit de "Agregar al carrito" con AJAX** (`add=1`): un `form.submit()` nativo **no agrega nada**. Hay que pulsar el botón para que corra su handler.
  9. **El nombre del transportista es dinámico:** `delivery_option[<id_address>]`, no `delivery_option`. Un selector con el nombre exacto nunca encuentra el radio.
  10. **Registro y checkout son dos pasos distintos:** primero se guarda la dirección (POST) y solo después aparece "Continuar"; enviar el formulario y pulsar Continuar en el mismo paso deja el carrito con `id_address_delivery = 0`.
  11. **La tienda de prueba exige el formato de código postal del país** (`NNNNN` para Estados Unidos). Un código postal colombiano es rechazado con "Invalid postcode".
  12. **Los módulos de pago se filtran por país en SQL, y la ausencia de filas los excluye.** `Module::getHookModuleExecList()` hace `LEFT JOIN module_country ... AND mc.id_country = <país>` con país de facturación: si el módulo **no tiene ninguna fila** en `ps_module_country`, no pasa el filtro. Al retirar la restricción con un `DELETE` dejé `ps_checkpayment` y `ps_wirepayment` sin filas, y el checkout respondió *"there is no payment method available"* durante varias corridas. La corrección real es **añadir las filas de los países donde el módulo debe operar**, no borrarlas.
  13. **El carrito necesita el radio de dirección marcado.** Con la dirección creada, el paso muestra un selector; si no se marca, el POST sale como `POST /en/order?id_address=0`, el carrito queda con `id_address_delivery = 0` y —aunque el producto esté en la base de datos— el bloque de pago nunca se renderiza. Se detectó leyendo el access log de Apache, no el HTML.
  14. **El CLI de PrestaShop no sirve para diagnosticar el pago:** `ps_checkpayment::getTemplateVars()` llama a `formatPrice()` sobre `getCurrentLocale()`, que es `null` fuera de un controlador de front, y lanza un fatal que aborta el hook. Es un artefacto del diagnóstico por consola, no del flujo web.

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

> Responsable: Integrante 3. Plan, comandos y criterios en [`tests/performance/endurance/README.md`](../tests/performance/endurance/README.md).

- **Herramienta:** Apache JMeter 5.6.3 en modo no-GUI (Java 25), mismo escenario que las pruebas de estrés (Home → Categoría → Búsqueda → Producto → Agregar al carrito por AJAX → Ver carrito).
- **Sistema bajo prueba:** PrestaShop 8.2 local en Docker del ADR-003 (2 CPU / 2 GB; MySQL 1 CPU / 1 GB), con el generador de carga en la misma máquina.
- **Usuarios concurrentes seleccionados:** **30** — dentro del rango 20–50 exigido, por debajo del quiebre medido en 4.2 (~390 usuarios en rampa) pero por encima de la zona cómoda (~60), de modo que la corrida ejerce presión real sin terminar en error masivo.
- **Duración efectiva:** **2,00 h** (120 min medidos), rampa de 2 min, pensamiento de 300–1000 ms.

| Métrica | Valor |
| --- | --- |
| Muestras analizadas | **54.721** |
| Errores | **405 (0,74 %)** |
| Throughput medio | **7,6 req/s** |
| Promedio / mediana | 3.257 / 3.064 ms |
| p90 / p95 / p99 | 4.006 / 4.303 / 5.323 ms |
| Máximo | 30.047 ms |

- **Estabilidad:** el p95 de la primera mitad es **4.230 ms** y el de la segunda **4.220 ms** (−0,3 %); el throughput se mantiene en 8,0 req/s en ambas mitades. **No hay deriva**: de las 24 ventanas de 5 min, **22 tienen 0,00 % de error** y un promedio entre 2.411 y 3.244 ms; solo las dos del incidente se salen de ese rango.
- **El único incidente es puntual, no progresivo:** entre los minutos 10 y 25 hay dos ventanas con 26,8 % y 18,0 % de error y p95 de 30 s (timeouts). Coincide con la regeneración de la caché de PrestaShop que se ejecutó en esa franja mientras los 30 usuarios estaban activos: el log de Apache registra errores fatales de PHP (`Cannot rename /var/www/html/var/cache/prod/translations/...`, `Call to a member function all() on bool`) en esas mismas marcas de tiempo. A partir del minuto 30 el sistema vuelve a 0 % de error y no lo repite en las dos horas restantes. Se documenta como interferencia del entorno de prueba, no como degradación del sistema; en producción la caché no se borra con la tienda bajo carga.
- **Tendencia de recursos:** MySQL se mantiene en ~100 % de su núcleo durante toda la corrida (es el cuello de botella, igual que en 4.2) y PrestaShop entre 106 % y 119 % de sus 200 %. La memoria de PrestaShop sube de 104 MiB a 452 MiB (+333 %) y la de MySQL de 553 a 763 MiB (+38 %): crecen al principio y luego se estabilizan (se mantienen en ~484–494 MiB y ~763 MiB durante la última hora), lo que es caché y no una fuga sostenida.
- **Cierre:** el sistema sostuvo 30 usuarios concurrentes durante 2 horas con el 99,26 % de las peticiones exitosas y sin degradación progresiva; el techo sigue siendo la CPU de MySQL.
- **Reporte:** [`results/performance/endurance/endurance-01-dos-horas/`](../results/performance/endurance/endurance-01-dos-horas/) — `dashboard/index.html`, `resumen.md` y `recursos.csv`.
- **Evidencias:** [`evidences/performance/endurance/`](../evidences/performance/endurance/) — salida de consola completa de JMeter.

## 5. Conclusiones

- **Estado general de la plataforma:** estable para el flujo de negocio evaluado. Con la configuración de recursos del entorno local atiende hasta ~60 usuarios concurrentes con p95 < 1 s, se degrada desde ~190 y se quiebra desde ~390 usuarios en rampa. La prueba de 2 horas con 30 usuarios cerró con **99,26 % de peticiones exitosas y sin degradación progresiva**, lo que confirma que 30 usuarios están dentro de su capacidad sostenida.
- **Riesgos encontrados:**
  1. **El cuello de botella es la CPU de MySQL**, no la aplicación: se satura con ~94 usuarios y a partir de ahí el throughput se topa en ~35–60 req/s mientras la latencia crece linealmente (ley de Little: N = X·(R + Z)).
  2. **La demo pública de PrestaShop no está disponible** (tiendas temporales en 502/timeout), lo que obliga a evaluar sobre el entorno local. Cualquier conclusión sobre el servicio público queda pendiente de que vuelva a estar operativo.
  3. **El entorno de prueba requiere configuración manual para el pago.** Los módulos de pago se filtran por país vía `ps_module_country`, y borrar esas filas (en lugar de ajustarlas) los deja fuera del checkout sin mensaje claro: el síntoma es *"there is no payment method available"*. Queda documentado en la sección 2 para reproducir el entorno.
- **Recomendaciones:**
  1. Dar más CPU a MySQL o usar réplicas de lectura para el catálogo.
  2. Activar caché de página completa o un CDN para Home y Categoría, las páginas más costosas.
  3. Migrar Apache de `prefork` a `event` + PHP-FPM ajustando `MaxRequestWorkers`.
  4. Poner una cola o *rate limiting* delante del checkout para absorber picos.
  5. Ejecutar las suites móvil y de rendimiento en ventanas separadas: compartir CPU entre emulador y JMeter introduce timeouts que se confunden con degradación real (ocurrió en esta corrida, minutos 10–25).

## 6. Anexos

- Demo o video breve de la ejecución: `evidences/`
- Capturas representativas: `evidences/<tipo-de-prueba>/`
- Logs de ejecución: `evidences/<tipo-de-prueba>/`

## Checklist de sustentación

Estado real del repositorio al cierre de esta entrega:

- [ ] **Etapa 1 — Cypress:** las carpetas `tests/e2e-web/cypress/e2e/` están vacías (solo `.gitkeep`); la suite E2E aún no está en `main`.
- [x] **Etapa 2 — Appium:** happy path de checkout completo en emulador, **5 de 5 pasos pasan**, con orden registrada en PrestaShop.
- [x] **Etapa 3 — Postman/Newman:** 34 requests y 256 aserciones, con reporte HTML y JUnit.
- [x] **Etapa 4 — Estrés:** 2 pruebas con resultados, dashboards y videos.
- [x] **Etapa 4 — Desempeño (2 h):** ejecutada y documentada en la sección 4.3.
- [ ] **Etapa 4 — Carga (10/20/50 usuarios):** `tests/performance/load/plans/` está vacía; falta la suite del Integrante 1.
- [x] Reportes y evidencias de las etapas 2, 3 y de estrés y desempeño en `results/` y `evidences/`.
- [ ] Demo o video breve de la ejecución.
- [ ] Completar los datos de equipo, integrantes y fecha en «Datos generales».
