# Resumen — stress-02-pico-subito-variante-300u

- Inicio: 2026-11-22 23:53:45 -0500  ·  Fin: 2026-11-22 23:58:49 -0500  ·  Duración medida: 5.0 min
- Parámetros JMeter adicionales: `-Jsummariser.interval=10 -Jusers=300`
- Usuarios concurrentes máximos alcanzados: **300**
- Muestras: **15,498** · Errores: **0 (0.00 %)** · Throughput medio: **51.2 req/s**
- Tiempo de respuesta: promedio 5444 ms · p90 19075 ms · p95 20174 ms · p99 21541 ms · máx 23576 ms

## Por transacción

| Transacción | Muestras | % error | Prom. (ms) | p90 | p95 | p99 | Máx. |
|---|---:|---:|---:|---:|---:|---:|---:|
| 01 Home | 2,763 | 0.00 | 17539 | 21171 | 21567 | 22428 | 23576 |
| 02 Categoría Clothes | 2,601 | 0.00 | 2838 | 3776 | 4046 | 4605 | 5127 |
| 03 Búsqueda | 2,576 | 0.00 | 3135 | 4157 | 4420 | 5068 | 6010 |
| 04 Detalle de producto | 2,546 | 0.00 | 2567 | 3403 | 3669 | 4114 | 5254 |
| 05 Agregar al carrito (AJAX) | 2,523 | 0.00 | 2974 | 3767 | 3987 | 4406 | 5353 |
| 06 Ver carrito | 2,489 | 0.00 | 2576 | 3397 | 3673 | 4096 | 5217 |

## Evolución en ventanas de 30 s

| Min. | Usuarios activos | req/s | % error | Prom. (ms) | p95 (ms) | CPU PrestaShop % | Mem PrestaShop MiB | CPU MySQL % | CPU JMeter % |
|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 0.0 | 300 | 60.1 | 0.0 | 4174 | 18042 | 153 | 1300 | 100 | 8 |
| 0.5 | 300 | 53.1 | 0.0 | 5404 | 19017 | 155 | 1566 | 101 | 4 |
| 1.0 | 300 | 54.9 | 0.0 | 5138 | 19143 | 152 | 1567 | 100 | 2 |
| 1.5 | 300 | 50.8 | 0.0 | 5880 | 21358 | 152 | 1569 | 100 | 2 |
| 2.0 | 300 | 47.6 | 0.0 | 6291 | 21456 | 156 | 1570 | 101 | 2 |
| 2.5 | 300 | 51.8 | 0.0 | 5335 | 19593 | 155 | 1580 | 101 | 1 |
| 3.0 | 300 | 49.4 | 0.0 | 5830 | 20643 | 157 | 1574 | 100 | 1 |
| 3.5 | 300 | 50.1 | 0.0 | 5990 | 20731 | 154 | 1572 | 100 | 1 |
| 4.0 | 300 | 50.4 | 0.0 | 5680 | 20269 | 153 | 1573 | 100 | 1 |
| 4.5 | 300 | 48.5 | 0.0 | 5031 | 19464 | 153 | 1571 | 101 | 1 |

## Degradación y punto de quiebre

- **Degradación** (primera ventana con p95 > 5000 ms): minuto **0.0** con **~300 usuarios activos** (error 0.0 %, p95 18042 ms, promedio 4174 ms, 60.1 req/s).
- **Quiebre**: ninguna ventana con error > 5 %.

## Picos de recursos

| Proceso | CPU máx. % | Memoria máx. MiB | Mem. máx. % del límite | PIDs máx. |
|---|---:|---:|---:|---:|
| jmeter-host | 88 | 718 | 0.0 | – |
| mysql | 103 | 1024 | 100.0 | 235 |
| prestashop | 202 | 1593 | 77.8 | 151 |

> CPU % de los contenedores es relativo a 1 núcleo (límites: PrestaShop 2 CPU = 200 %, MySQL 1 CPU = 100 %). CPU % de JMeter es el del proceso java en el host (10 núcleos = 1000 %).
