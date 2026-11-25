# Resumen de desempeño — endurance-01-dos-horas

- Inicio: 2026-11-23 22:56:35  ·  Fin: 2026-11-24 00:56:37  ·  Duración medida: **2.00 h** (120 min)
- Parámetros JMeter adicionales: `(valores por defecto del plan)`
- Usuarios concurrentes máximos: **30**
- Muestras descartadas por ser de una corrida anterior: **272** (JMeter añade al JTL en vez de sobrescribirlo).
- Muestras: **54,721** · Errores: **405 (0.74 %)** · Throughput medio: **7.6 req/s**
- Tiempo de respuesta global: promedio 3257 ms · p50 3064 · p90 4006 · p95 4303 · p99 5323 · máx 30047 ms

## Serie temporal (ventanas de 5 min)

| Hora | Usuarios | req/s | % error | Prom. (ms) | p95 (ms) | p99 (ms) | CPU SUT % | Mem SUT MiB | CPU MySQL % |
|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 0.00 h | 30 | 8.0 | 0.0 | 2411 | 4090 | 4691 | 115 | 350 | 98 |
| 0.08 h | 30 | 8.5 | 0.0 | 2862 | 4064 | 4668 | 119 | 421 | 103 |
| 0.17 h | 30 | 3.0 | 26.8 | 9991 | 30017 | 30025 | 186 | 1369 | 40 |
| 0.25 h | 30 | 3.1 | 18.0 | 8580 | 30015 | 30019 | 200 | 1779 | 55 |
| 0.33 h | 30 | 8.1 | 0.0 | 3032 | 4221 | 4783 | 112 | 479 | 101 |
| 0.42 h | 30 | 8.2 | 0.0 | 3027 | 4240 | 4757 | 115 | 492 | 102 |
| 0.50 h | 30 | 7.8 | 0.0 | 3169 | 4361 | 4907 | 112 | 484 | 101 |
| 0.58 h | 30 | 7.9 | 0.0 | 3118 | 4217 | 4759 | 107 | 483 | 100 |
| 0.67 h | 30 | 8.0 | 0.0 | 3074 | 4147 | 4676 | 109 | 484 | 101 |
| 0.75 h | 30 | 8.3 | 0.0 | 2975 | 4126 | 4705 | 113 | 485 | 100 |
| 0.83 h | 30 | 7.8 | 0.0 | 3193 | 4416 | 4927 | 111 | 486 | 100 |
| 0.92 h | 30 | 8.0 | 0.0 | 3070 | 4273 | 4806 | 112 | 487 | 100 |
| 1.00 h | 30 | 8.1 | 0.0 | 3046 | 4146 | 4569 | 108 | 488 | 100 |
| 1.08 h | 30 | 8.0 | 0.0 | 3092 | 4229 | 4744 | 106 | 490 | 101 |
| 1.17 h | 30 | 7.9 | 0.0 | 3153 | 4317 | 4774 | 110 | 490 | 100 |
| 1.25 h | 30 | 8.2 | 0.0 | 3012 | 4125 | 4600 | 114 | 492 | 100 |
| 1.33 h | 30 | 8.0 | 0.0 | 3074 | 4190 | 4561 | 110 | 493 | 100 |
| 1.42 h | 30 | 8.0 | 0.0 | 3100 | 4262 | 4754 | 112 | 493 | 100 |
| 1.50 h | 30 | 7.9 | 0.0 | 3171 | 4325 | 4895 | 111 | 494 | 100 |
| 1.58 h | 30 | 7.7 | 0.0 | 3244 | 4453 | 4935 | 109 | 494 | 101 |
| 1.67 h | 30 | 7.8 | 0.0 | 3170 | 4317 | 4750 | 109 | 494 | 100 |
| 1.75 h | 30 | 8.0 | 0.0 | 3074 | 4210 | 4697 | 114 | 485 | 100 |
| 1.83 h | 30 | 8.1 | 0.0 | 3037 | 4157 | 4681 | 108 | 484 | 100 |
| 1.92 h | 30 | 8.0 | 0.0 | 3060 | 4197 | 4726 | 106 | 484 | 95 |

## Continuidad de la corrida

- Sin huecos: las 24 ventanas esperadas tienen muestras. La prueba se sostuvo completa.

## Deriva temporal (¿se degrada con el tiempo?)

- Usuarios concurrentes: mediana 30 en la primera mitad vs. 30 en la segunda.
- **p95**: 4230 ms → 4220 ms (-0.3 %). Pendiente: -399.7 ms por ventana de 5 min.
- **Throughput**: 8.0 → 8.0 req/s (+0.1 %). Pendiente: +0.070 req/s por ventana.
- **% error**: 3.74 % → 0.00 %.

> **Veredicto: comportamiento estable.** El p95 y el throughput de la segunda mitad son comparables a los de la primera, y el error se mantiene por debajo del umbral: la carga constante no produjo degradación.

## Degradación y quiebre

- **Degradación** (p95 > 5000 ms por primera vez): minuto **10**, con ~30 usuarios (p95 30017 ms).
- **Quiebre** (error > 5 % por primera vez): minuto **10**, con ~30 usuarios (26.8 % de error).

## Recursos

| Proceso | CPU máx. % | Memoria máx. MiB | Mem. máx. % del límite | PIDs máx. |
|---|---:|---:|---:|---:|
| jmeter-host | 0 | 9 | 0.0 | – |
| mysql | 114 | 770 | 75.2 | 213 |
| prestashop | 886 | 2048 | 100.0 | 151 |

- Memoria de `jmeter-host`: 9 MiB al inicio → 8 MiB al final (-11.1 %).
- Memoria de `mysql`: 553 MiB al inicio → 763 MiB al final (+38.0 %). ⚠️ **posible fuga**
- Memoria de `prestashop`: 104 MiB al inicio → 452 MiB al final (+332.9 %). ⚠️ **posible fuga**

> CPU % de los contenedores es relativo a 1 núcleo (PrestaShop 2 CPU = 200 %, MySQL 1 CPU = 100 %). CPU % de JMeter es el del proceso java en el host (12 hilos = 1200 %).

## Por transacción

| Transacción | Muestras | % error | Prom. (ms) | p95 | Máx. |
|---|---:|---:|---:|---:|---:|
| 01 Home | 9,135 | 0.72 | 2480 | 3009 | 30026 |
| 02 Categoria Clothes | 9,130 | 0.76 | 3577 | 4390 | 30023 |
| 03 Busqueda | 9,124 | 0.72 | 3816 | 4817 | 30047 |
| 04 Detalle de producto | 9,114 | 0.75 | 3305 | 4080 | 30033 |
| 05 Agregar al carrito (AJAX) | 9,112 | 0.69 | 3279 | 4029 | 30032 |
| 06 Ver carrito | 9,106 | 0.80 | 3088 | 3800 | 30031 |

## Errores más frecuentes

| Código — mensaje | Cantidad |
|---|---:|
| Sin respuesta HTTP — java.net.SocketTimeoutException | 395 |
| 200 — Test failed: text expected to contain /cart-products-count">(1)/ | 7 |
| 500 — Test failed: code expected to equal / ****** received : [[[5]]]00 ****** comparison: [[[2]]]00 / | 3 |
