# Etapa 4 — Pruebas de estrés (Apache JMeter)

Dos pruebas diseñadas para llevar **PrestaShop** hasta el punto en que "se quiebra".
Responsable: **Integrante 2**. Entorno y motivo de la decisión: [ADR-003](../../../docs/decisiones.md#adr-003--entorno-de-las-pruebas-de-estrés).

## Escenario simulado (ambas pruebas)

Cada usuario virtual repite, con sesión nueva (cookies limpias) en cada iteración, el recorrido de un comprador:

| # | Transacción | Request | Validación |
| --- | --- | --- | --- |
| 01 | Home | `GET /es/` | HTTP 200 + portada (`id="index"`) |
| 02 | Categoría | `GET /es/3-clothes` | HTTP 200 + listado de productos |
| 03 | Búsqueda | `GET /es/busqueda?s=<término>` | HTTP 200 + página de búsqueda |
| 04 | Producto | `GET <ruta del producto>` | HTTP 200 + formulario; extrae el `token` del carrito |
| 05 | Agregar al carrito | `POST /es/carrito` (AJAX) | HTTP 200 + `"success":true` (escribe en BD) |
| 06 | Ver carrito | `GET /es/carrito?action=show` | HTTP 200 + carrito con 1 producto |

Los productos y términos de búsqueda salen de [`../resources/stress-products.csv`](../resources/stress-products.csv).
Timeouts: conexión 10 s, respuesta 30 s (un request que se cuelga cuenta como error).

## Las 2 pruebas

| Prueba | Plan | Usuarios | Ramp-up | Duración | Pensamiento | Pregunta que responde |
| --- | --- | ---: | ---: | ---: | --- | --- |
| Estrés 01 — Rampa incremental | [`plans/stress-01-rampa-incremental.jmx`](plans/stress-01-rampa-incremental.jmx) | 0 → 600 | 600 s | 720 s | 300–1000 ms | ¿Con cuántos usuarios concurrentes se degrada y se quiebra? |
| Estrés 02 — Pico súbito | [`plans/stress-02-pico-subito.jmx`](plans/stress-02-pico-subito.jmx) | 800 | 20 s | 300 s | 100–300 ms | ¿Qué pasa ante una avalancha repentina (lanzamiento, Black Friday)? |

Todo es sobrescribible por línea de comandos: `-Jusers`, `-Jrampup`, `-Jduration`, `-Jthink_min`, `-Jthink_range`, `-Jprotocol`, `-Jhost`, `-Jport`.

**Criterio de quiebre** (usado por `scripts/analyze_jtl.py`): primera ventana de 30 s con más de 5 % de errores o p95 > 5 s.

## Recursos

| Componente | Recursos |
| --- | --- |
| Máquina de prueba | Mac Apple M5 (Mac17,3), 10 núcleos, 16 GB RAM, macOS 27.2.1, Docker 29.8.0 |
| JMeter 5.6.3 (generador) | `HEAP=-Xms2g -Xmx6g` (máximo razonable sin ahogar al SO y a Docker), Java 25 |
| Docker Desktop | 10 CPU, 8 GB para la VM |
| PrestaShop 8.2 (Apache + PHP) | límite 2 CPU / 2 GB |
| MySQL 8.0 | límite 1 CPU / 1 GB, `max_connections=500` |

## Ejecución

Requisitos: Docker y Apache JMeter 5.6+ (`brew install jmeter`).

```bash
# 1. Levantar PrestaShop local (la primera vez instala la tienda, ~2 min)
docker compose -f tests/performance/stress/docker-compose.yml up -d
curl -I http://localhost:8090/es/     # debe responder 200

# 2. Ejecutar cada prueba (reinicia PrestaShop, muestrea recursos, genera dashboard y resumen)
tests/performance/stress/scripts/run-stress.sh stress-01-rampa-incremental
tests/performance/stress/scripts/run-stress.sh stress-02-pico-subito

# 3. Apagar y borrar el entorno
docker compose -f tests/performance/stress/docker-compose.yml down -v
```

Corridas adicionales del mismo plan con nombre propio (para no sobrescribir resultados):

```bash
RUN_NAME=stress-02-pico-subito-corrida-2 tests/performance/stress/scripts/run-stress.sh stress-02-pico-subito
RUN_NAME=stress-02-pico-subito-variante-300u tests/performance/stress/scripts/run-stress.sh stress-02-pico-subito -Jusers=300
```

Ejecución grabada para la sustentación (requiere `brew install asciinema agg ffmpeg`):

```bash
asciinema rec --headless --window-size 140x42 \
  -c "RUN_NAME=stress-02-pico-subito-corrida-2 tests/performance/stress/scripts/demo-sustentacion.sh stress-02-pico-subito" \
  evidences/performance/stress/stress-02-pico-subito-corrida-2.cast
agg --speed 5 --idle-time-limit 2 --font-size 16 --theme monokai \
  evidences/performance/stress/stress-02-pico-subito-corrida-2.cast /tmp/demo.gif
ffmpeg -i /tmp/demo.gif -pix_fmt yuv420p -c:v libx264 -crf 23 -movflags faststart \
  -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" evidences/performance/stress/stress-02-pico-subito-corrida-2.mp4
```

`demo-sustentacion.sh` muestra la configuración, ejecuta `run-stress.sh` con el resumen de JMeter cada 10 s e intercala el uso de CPU y memoria de los contenedores.

El script `run-stress.sh` equivale a `jmeter -n -t plans/<prueba>.jmx -l reports/<prueba>/results.jtl` + `jmeter -g ... -o html`, y además:

- muestrea cada 2 s CPU/memoria de los contenedores y del proceso de JMeter (`recursos.csv`),
- registra si algún contenedor murió por falta de memoria (`contenedores-post.txt`) y los errores del servidor (`prestashop-errores.txt`),
- genera `resumen.md` con métricas por transacción, evolución cada 30 s y punto de quiebre.

## Corridas ejecutadas (22/11/2026)

| Corrida | Usuarios | % error | req/s | p95 | Resultado |
| --- | ---: | ---: | ---: | ---: | --- |
| `stress-01-rampa-incremental` | 0 → 600 | 5,90 % | 47,3 | 30,0 s | se degrada con ~189 usuarios y se quiebra con ~387 |
| `stress-02-pico-subito` | 800 | 33,53 % | 59,5 | 30,0 s | quiebre inmediato |
| `stress-02-pico-subito-corrida-2` (repetición, grabada) | 800 | 35,90 % | 57,8 | 30,0 s | confirma la corrida 1 |
| `stress-02-pico-subito-variante-300u` (grabada) | 300 | 0,00 % | 51,2 | 20,2 s | se degrada pero no se quiebra |

## Resultados y evidencias

- Reportes: [`results/performance/stress/`](../../../results/performance/stress/) — una carpeta por corrida con `dashboard/index.html`, `resumen.md`, `recursos.csv` y `results.jtl.gz`
- Evidencias: [`evidences/performance/stress/`](../../../evidences/performance/stress/) — salida de consola de JMeter, capturas del dashboard y **videos `.mp4` y grabaciones `.cast`** de la corrida 2 y de la variante
- Análisis: [`docs/informe-final.md`](../../../docs/informe-final.md), sección 4.2
