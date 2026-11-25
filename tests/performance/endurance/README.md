# Etapa 4 — Prueba de desempeño (2 horas)

Carga sostenida durante **al menos 2 horas** con un número fijo de compradores concurrentes,
para detectar lo que una prueba corta no muestra: degradación progresiva, fugas de memoria,
acumulación de conexiones y crecimiento de la base de datos.

Responsable: **Integrante 3**. Herramienta: **Apache JMeter** (ADR-002).

## Requisito del enunciado

> Prueba de desempeño: realizar pruebas continuas por al menos 2 horas con un número de usuarios
> concurrente (entre 20 y 50) que considere puede impactar el rendimiento del sistema.

## Configuración

| Parámetro | Valor por defecto | Por qué |
| --- | --- | --- |
| Usuarios concurrentes | **30** | Dentro del rango 20–50 y por debajo del quiebre medido en la Etapa 4.2 (~390 usuarios), pero por encima de la zona cómoda (~60), de modo que la corrida ejerza presión real sin terminar en error. |
| Duración | **7200 s (2 h)** | Mínimo exigido. |
| Ramp-up | 120 s | Evita un pico artificial al inicio; la prueba mide estado estacionario. |
| Tiempo de pensamiento | 300–1000 ms | Simula lectura de página, no un bucle cerrado sin pausa. |

Escenario idéntico al de las pruebas de estrés para que los resultados sean comparables
(ver [`../stress/README.md`](../stress/README.md)):

| # | Transacción | Request | Validación |
| --- | --- | --- | --- |
| 01 | Home | `GET /es/` | HTTP 200 + portada (`id="index"`) |
| 02 | Categoría | `GET /es/3-clothes` | HTTP 200 + listado de productos |
| 03 | Búsqueda | `GET /es/busqueda?s=<término>` | HTTP 200 + página de búsqueda |
| 04 | Producto | `GET <ruta>` | HTTP 200 + formulario; extrae el `token` del carrito |
| 05 | Agregar al carrito | `POST /es/carrito` (AJAX) | HTTP 200 + `"success":true` (escribe en BD) |
| 06 | Ver carrito | `GET /es/carrito?action=show` | HTTP 200 + carrito con 1 producto |

El paso 05 es el que hace que la prueba de 2 h tenga sentido: escribe en la base de datos, así que
durante 2 horas el carrito y las sesiones crecen de verdad.

## Requisitos

| Componente | Nota |
| --- | --- |
| Apache JMeter | 5.6+ (`brew install jmeter` en macOS, o descomprimir el zip oficial en Windows) |
| Java | 17+ |
| Python | 3.8+ (`python` en Windows, `python3` en macOS/Linux) |
| Docker | Para el PrestaShop local del ADR-003 |

JMeter se localiza en este orden: `JMETER_BIN` → `JMETER_HOME` → el `PATH`. No hay rutas
fijas en el código:

```bash
# Windows (PowerShell)
$env:JMETER_HOME = "C:\apache-jmeter-5.6.3"

# macOS / Linux
export JMETER_HOME=/opt/homebrew/opt/jmeter/libexec   # o donde esté instalado
```

## Ejecución

### Todo de una vez (recomendado)

```bash
node tests/performance/endurance/scripts/run-endurance.js
```

El script verifica la tienda, ejecuta JMeter, muestrea recursos y genera los reportes.

### Por partes

```bash
# 1. Levantar PrestaShop local (ver ADR-003)
docker compose -f tests/performance/stress/docker-compose.yml up -d
# La primera vez instala la tienda; esperar a que /es/ responda 200
curl -I http://localhost:8090/es/

# 2. Correr las 2 horas
node tests/performance/endurance/scripts/run-endurance.js --users=30 --duration=7200
```

Variantes útiles:

```bash
# Corrida corta de validación (10 min) antes de comprometer la noche
node .../run-endurance.js --users=10 --duration=600 --skip-compose

# 20 usuarios, nombre propio para no sobrescribir resultados
RUN_NAME=endurance-20u node .../run-endurance.js --users=20

# Contra otra instancia (p. ej. la demo pública, si está disponible)
ENDURANCE_BASE_URL=https://demo.prestashop.com/ node .../run-endurance.js
```

`run-endurance.js` acepta cualquier `-J<propiedad>=<valor>` de JMeter y lo reenvía al plan.
Variables de entorno: `JMETER_HOME` o `JMETER_BIN` (ruta a JMeter), `HEAP` (heap de la JVM),
`ENDURANCE_SKIP_COMPOSE=1` (no reiniciar el contenedor).

## Salidas

| Ruta | Contenido |
| --- | --- |
| `tests/performance/endurance/reports/<corrida>/` | JTL completo, dashboard, logs, `recursos.csv` (ignorado por Git) |
| `results/performance/endurance/<corrida>/dashboard/` | Dashboard HTML de JMeter |
| `results/performance/endurance/<corrida>/resumen.md` | Análisis con serie temporal, deriva y quiebre |
| `results/performance/endurance/<corrida>/recursos.csv` | CPU/memoria del SUT y de JMeter cada 15 s |
| `evidences/performance/endurance/<corrida>-consola.txt` | Salida de consola de JMeter |

## Qué analiza `scripts/analyze_endurance.py`

Una prueba de 2 horas no se evalúa con un promedio global: eso escondería una degradación al final.
El analizador reporta:

1. **Serie temporal en ventanas de 5 min** — usuarios, req/s, % error, promedio, p95, p99 y CPU/memoria.
2. **Deriva temporal** — compara la primera mitad con la segunda y calcula la pendiente (regresión
   lineal) del p95 y del throughput. Si el p95 sube con la misma carga, el sistema se degrada solo.
3. **Continuidad** — ventanas sin muestras indican que la tienda dejó de responder.
4. **Quiebre** — primera ventana con error > 5 % o p95 > 5 s.
5. **Fugas** — memoria de cada contenedor al inicio vs. al final; avisa si creció más de 25 %.

## Resultados

Ver la sección 4.3 de [`docs/informe-final.md`](../../../docs/informe-final.md) y
[`results/performance/endurance/`](../../../results/performance/endurance/).
