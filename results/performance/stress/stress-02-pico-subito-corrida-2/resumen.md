# Resumen — stress-02-pico-subito-corrida-2

- Inicio: 2026-11-22 23:48:10 -0500  ·  Fin: 2026-11-22 23:53:24 -0500  ·  Duración medida: 5.2 min
- Parámetros JMeter adicionales: `-Jsummariser.interval=10`
- Usuarios concurrentes máximos alcanzados: **800**
- Muestras: **18,010** · Errores: **6,466 (35.90 %)** · Throughput medio: **57.8 req/s**
- Tiempo de respuesta: promedio 12960 ms · p90 30001 ms · p95 30002 ms · p99 30002 ms · máx 30030 ms

## Por transacción

| Transacción | Muestras | % error | Prom. (ms) | p90 | p95 | p99 | Máx. |
|---|---:|---:|---:|---:|---:|---:|---:|
| 01 Home | 3,360 | 45.21 | 23696 | 30002 | 30002 | 30002 | 30030 |
| 02 Categoría Clothes | 3,187 | 40.26 | 12393 | 30002 | 30002 | 30002 | 30017 |
| 03 Búsqueda | 3,044 | 37.32 | 11123 | 30001 | 30002 | 30002 | 30005 |
| 04 Detalle de producto | 2,903 | 33.38 | 10514 | 30001 | 30002 | 30002 | 30020 |
| 05 Agregar al carrito (AJAX) | 2,809 | 28.02 | 9744 | 30001 | 30002 | 30002 | 30004 |
| 06 Ver carrito | 2,707 | 28.52 | 8329 | 29070 | 30001 | 30002 | 30003 |

## Evolución en ventanas de 30 s

| Min. | Usuarios activos | req/s | % error | Prom. (ms) | p95 (ms) | CPU PrestaShop % | Mem PrestaShop MiB | CPU MySQL % | CPU JMeter % |
|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 0.0 | 800 | 73.7 | 22.8 | 10708 | 30002 | 169 | 1351 | 100 | 10 |
| 0.5 | 800 | 65.4 | 36.6 | 11966 | 30002 | 163 | 1573 | 101 | 6 |
| 1.0 | 800 | 56.4 | 48.6 | 15524 | 30002 | 157 | 1595 | 100 | 7 |
| 1.5 | 800 | 55.3 | 40.2 | 13905 | 30002 | 153 | 1613 | 102 | 4 |
| 2.0 | 800 | 61.0 | 33.1 | 12616 | 30002 | 151 | 1595 | 101 | 5 |
| 2.5 | 800 | 60.5 | 34.8 | 12268 | 30002 | 156 | 1578 | 101 | 3 |
| 3.0 | 800 | 61.5 | 34.4 | 12054 | 30002 | 153 | 1586 | 101 | 2 |
| 3.5 | 800 | 56.8 | 40.8 | 14078 | 30002 | 159 | 1598 | 100 | 2 |
| 4.0 | 800 | 55.6 | 48.4 | 14572 | 30002 | 155 | 1606 | 100 | 2 |
| 4.5 | 800 | 54.2 | 23.4 | 12954 | 25831 | 160 | 1595 | 102 | 2 |

## Degradación y punto de quiebre

- **Degradación** (primera ventana con p95 > 5000 ms): minuto **0.0** con **~800 usuarios activos** (error 22.8 %, p95 30002 ms, promedio 10708 ms, 73.7 req/s).
- **Quiebre** (primera ventana con error > 5 %): minuto **0.0** con **~800 usuarios activos** (error 22.8 %, p95 30002 ms, promedio 10708 ms, 73.7 req/s).

## Picos de recursos

| Proceso | CPU máx. % | Memoria máx. MiB | Mem. máx. % del límite | PIDs máx. |
|---|---:|---:|---:|---:|
| jmeter-host | 32 | 514 | 0.0 | – |
| mysql | 110 | 1006 | 98.2 | 251 |
| prestashop | 205 | 1653 | 80.7 | 151 |

> CPU % de los contenedores es relativo a 1 núcleo (límites: PrestaShop 2 CPU = 200 %, MySQL 1 CPU = 100 %). CPU % de JMeter es el del proceso java en el host (10 núcleos = 1000 %).

## Errores más frecuentes

| Código — mensaje | Cantidad |
|---|---:|
| Sin respuesta HTTP — java.net.SocketTimeoutException | 3,324 |
| Sin respuesta HTTP — java.net.SocketException | 2,915 |
| 200 — Test failed: text expected to contain /cart-products-count">(1)/ | 227 |
