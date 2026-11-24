# Resumen — stress-01-rampa-incremental

- Inicio: 2026-11-22 23:11:09 -0500  ·  Fin: 2026-11-22 23:23:20 -0500  ·  Duración medida: 12.1 min
- Parámetros JMeter adicionales: `(valores por defecto del plan)`
- Usuarios concurrentes máximos alcanzados: **600**
- Muestras: **34,422** · Errores: **2,030 (5.90 %)** · Throughput medio: **47.3 req/s**
- Tiempo de respuesta: promedio 6761 ms · p90 26467 ms · p95 30001 ms · p99 30002 ms · máx 30014 ms

## Por transacción

| Transacción | Muestras | % error | Prom. (ms) | p90 | p95 | p99 | Máx. |
|---|---:|---:|---:|---:|---:|---:|---:|
| 01 Home | 6,056 | 20.28 | 19546 | 30001 | 30002 | 30002 | 30014 |
| 02 Categoría Clothes | 5,901 | 8.83 | 7463 | 28195 | 30001 | 30002 | 30003 |
| 03 Búsqueda | 5,798 | 3.40 | 4716 | 6355 | 25800 | 30002 | 30004 |
| 04 Detalle de producto | 5,649 | 1.12 | 2923 | 3639 | 4650 | 30001 | 30002 |
| 05 Agregar al carrito (AJAX) | 5,546 | 0.20 | 2658 | 3761 | 4320 | 20492 | 30002 |
| 06 Ver carrito | 5,472 | 0.18 | 2143 | 3321 | 3847 | 5279 | 30002 |

## Evolución en ventanas de 30 s

| Min. | Usuarios activos | req/s | % error | Prom. (ms) | p95 (ms) | CPU PrestaShop % | Mem PrestaShop MiB | CPU MySQL % | CPU JMeter % |
|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 0.0 | 31 | 23.2 | 0.0 | 32 | 54 | 37 | 253 | 27 | 5 |
| 0.5 | 63 | 57.4 | 0.0 | 159 | 606 | 114 | 561 | 75 | 6 |
| 1.0 | 94 | 45.5 | 0.0 | 1060 | 2256 | 155 | 864 | 99 | 5 |
| 1.5 | 126 | 34.3 | 0.0 | 2564 | 3856 | 162 | 1170 | 102 | 4 |
| 2.0 | 159 | 34.4 | 0.0 | 3316 | 4740 | 170 | 1465 | 101 | 7 |
| 2.5 | 189 | 34.5 | 0.0 | 4350 | 6862 | 166 | 1566 | 103 | 3 |
| 3.0 | 227 | 41.5 | 0.0 | 4418 | 12455 | 160 | 1569 | 101 | 2 |
| 3.5 | 253 | 36.9 | 0.0 | 5321 | 13964 | 166 | 1567 | 101 | 2 |
| 4.0 | 287 | 52.3 | 0.0 | 4648 | 16130 | 153 | 1571 | 101 | 2 |
| 4.5 | 323 | 53.5 | 0.0 | 5027 | 18202 | 153 | 1570 | 100 | 1 |
| 5.0 | 360 | 48.0 | 0.6 | 6791 | 27708 | 155 | 1569 | 101 | 1 |
| 5.5 | 387 | 40.9 | 5.1 | 8370 | 30000 | 164 | 1556 | 101 | 2 |
| 6.0 | 420 | 41.0 | 3.2 | 8940 | 29611 | 172 | 1544 | 101 | 2 |
| 6.5 | 450 | 50.1 | 0.1 | 7666 | 28213 | 161 | 1542 | 101 | 3 |
| 7.0 | 481 | 59.7 | 5.6 | 6987 | 30001 | 157 | 1536 | 100 | 1 |
| 7.5 | 511 | 58.0 | 5.3 | 7603 | 30001 | 159 | 1540 | 100 | 2 |
| 8.0 | 535 | 59.1 | 6.4 | 6859 | 30001 | 158 | 1533 | 100 | 1 |
| 8.5 | 565 | 56.9 | 12.1 | 8385 | 30001 | 156 | 1544 | 101 | 2 |
| 9.0 | 598 | 58.7 | 14.7 | 9409 | 30002 | 159 | 1545 | 100 | 1 |
| 9.5 | 600 | 56.8 | 17.3 | 10689 | 30002 | 153 | 1557 | 100 | 1 |
| 10.0 | 600 | 57.3 | 12.3 | 9745 | 30001 | 161 | 1528 | 101 | 2 |
| 10.5 | 600 | 52.6 | 19.2 | 9880 | 30002 | 161 | 1543 | 100 | 2 |
| 11.0 | 600 | 47.0 | 22.4 | 13590 | 30002 | 169 | 1537 | 101 | 1 |
| 11.5 | 600 | 47.7 | 1.4 | 8784 | 26286 | 164 | 1543 | 101 | 2 |

## Degradación y punto de quiebre

- **Degradación** (primera ventana con p95 > 5000 ms): minuto **2.5** con **~189 usuarios activos** (error 0.0 %, p95 6862 ms, promedio 4350 ms, 34.5 req/s).
- **Quiebre** (primera ventana con error > 5 %): minuto **5.5** con **~387 usuarios activos** (error 5.1 %, p95 30000 ms, promedio 8370 ms, 40.9 req/s).

## Picos de recursos

| Proceso | CPU máx. % | Memoria máx. MiB | Mem. máx. % del límite | PIDs máx. |
|---|---:|---:|---:|---:|
| jmeter-host | 31 | 748 | 0.0 | – |
| mysql | 107 | 1024 | 100.0 | 245 |
| prestashop | 208 | 1601 | 78.2 | 151 |

> CPU % de los contenedores es relativo a 1 núcleo (límites: PrestaShop 2 CPU = 200 %, MySQL 1 CPU = 100 %). CPU % de JMeter es el del proceso java en el host (10 núcleos = 1000 %).

## Errores más frecuentes

| Código — mensaje | Cantidad |
|---|---:|
| Sin respuesta HTTP — java.net.SocketTimeoutException | 1,990 |
| Sin respuesta HTTP — java.net.SocketException | 31 |
| 200 — Test failed: text expected to contain /cart-products-count">(1)/ | 9 |
