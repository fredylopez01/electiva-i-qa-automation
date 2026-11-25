# Resumen de pruebas de carga — Toolshop

**Objetivo:** https://practicesoftwaretesting.com/  
**Herramienta:** Apache JMeter 5.x  
**Fuente:** JTL en `results/performance/load-*-users.jtl`

| Usuarios | Ramp-up | Muestras | Promedio (ms) | P95 (ms) | Mín (ms) | Máx (ms) | Throughput (req/s) | Error % | Duración (s) |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 10 | 10 s | 10 | 829.00 | 1141.75 | 679 | 1144 | 0.99 | 0.00% | 10.14 |
| 20 | 20 s | 20 | 762.70 | 1131.25 | 680 | 1155 | 1.01 | 0.00% | 19.73 |
| 50 | 50 s | 50 | 726.54 | 1124.10 | 671 | 1217 | 1.01 | 0.00% | 49.66 |

## Observaciones

- Las tres ejecuciones finalizaron sin errores HTTP.
- El throughput ~1 req/s es coherente con 1 iteración por usuario y ramp-up igual a la concurrencia.
- El P95 se mantuvo estable (~1124–1142 ms) al aumentar la concurrencia de 10 a 50 usuarios.
- Toolshop es una SPA; JMeter midió la respuesta HTTP inicial, no el render completo del navegador.

Reporte HTML consolidado: `results/performance/load-report.html`.
