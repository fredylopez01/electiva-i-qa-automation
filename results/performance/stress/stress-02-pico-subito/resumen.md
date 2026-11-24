# Resumen — stress-02-pico-subito

- Inicio: 2026-11-22 23:24:06 -0500  ·  Fin: 2026-11-22 23:29:20 -0500  ·  Duración medida: 5.2 min
- Parámetros JMeter adicionales: `(valores por defecto del plan)`
- Usuarios concurrentes máximos alcanzados: **800**
- Muestras: **18,507** · Errores: **6,205 (33.53 %)** · Throughput medio: **59.5 req/s**
- Tiempo de respuesta: promedio 12601 ms · p90 30001 ms · p95 30002 ms · p99 30002 ms · máx 30053 ms

## Por transacción

| Transacción | Muestras | % error | Prom. (ms) | p90 | p95 | p99 | Máx. |
|---|---:|---:|---:|---:|---:|---:|---:|
| 01 Home | 3,468 | 44.43 | 23905 | 30002 | 30002 | 30002 | 30014 |
| 02 Categoría Clothes | 3,233 | 38.88 | 12487 | 30001 | 30002 | 30002 | 30027 |
| 03 Búsqueda | 3,129 | 35.70 | 10480 | 30001 | 30002 | 30002 | 30007 |
| 04 Detalle de producto | 3,024 | 30.49 | 9829 | 30001 | 30002 | 30002 | 30053 |
| 05 Agregar al carrito (AJAX) | 2,888 | 23.86 | 9260 | 30001 | 30002 | 30002 | 30003 |
| 06 Ver carrito | 2,765 | 24.56 | 7476 | 27117 | 30001 | 30002 | 30011 |

## Evolución en ventanas de 30 s

| Min. | Usuarios activos | req/s | % error | Prom. (ms) | p95 (ms) | CPU PrestaShop % | Mem PrestaShop MiB | CPU MySQL % | CPU JMeter % |
|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 0.0 | 800 | 73.0 | 24.9 | 10947 | 30002 | 172 | 1243 | 94 | 10 |
| 0.5 | 800 | 61.1 | 41.5 | 13678 | 30002 | 170 | 1514 | 101 | 6 |
| 1.0 | 800 | 65.0 | 35.0 | 12757 | 30002 | 162 | 1511 | 101 | 10 |
| 1.5 | 800 | 61.5 | 35.9 | 11942 | 30002 | 163 | 1527 | 101 | 13 |
| 2.0 | 800 | 58.1 | 34.3 | 13740 | 30002 | 170 | 1524 | 101 | 4 |
| 2.5 | 800 | 59.9 | 32.7 | 12256 | 30002 | 167 | 1525 | 101 | 2 |
| 3.0 | 800 | 61.3 | 34.3 | 12403 | 30002 | 163 | 1526 | 100 | 2 |
| 3.5 | 800 | 59.1 | 40.1 | 13006 | 30002 | 170 | 1531 | 102 | 7 |
| 4.0 | 800 | 59.3 | 38.4 | 13956 | 30002 | 165 | 1537 | 100 | 2 |
| 4.5 | 800 | 58.7 | 19.6 | 11706 | 27614 | 166 | 1533 | 101 | 1 |

## Degradación y punto de quiebre

- **Degradación** (primera ventana con p95 > 5000 ms): minuto **0.0** con **~800 usuarios activos** (error 24.9 %, p95 30002 ms, promedio 10947 ms, 73.0 req/s).
- **Quiebre** (primera ventana con error > 5 %): minuto **0.0** con **~800 usuarios activos** (error 24.9 %, p95 30002 ms, promedio 10947 ms, 73.0 req/s).

## Picos de recursos

| Proceso | CPU máx. % | Memoria máx. MiB | Mem. máx. % del límite | PIDs máx. |
|---|---:|---:|---:|---:|
| jmeter-host | 67 | 459 | 0.0 | – |
| mysql | 106 | 1024 | 100.0 | 246 |
| prestashop | 206 | 1567 | 76.5 | 151 |

> CPU % de los contenedores es relativo a 1 núcleo (límites: PrestaShop 2 CPU = 200 %, MySQL 1 CPU = 100 %). CPU % de JMeter es el del proceso java en el host (10 núcleos = 1000 %).

## Errores más frecuentes

| Código — mensaje | Cantidad |
|---|---:|
| Sin respuesta HTTP — java.net.SocketTimeoutException | 3,159 |
| Sin respuesta HTTP — java.net.SocketException | 2,868 |
| 200 — Test failed: text expected to contain /cart-products-count">(1)/ | 178 |
