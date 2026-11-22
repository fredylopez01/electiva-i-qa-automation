# Pruebas de carga — PrestaShop Demo

Tres pruebas de carga con **10, 20 y 50 usuarios concurrentes**, según el requisito de la Etapa 4.

## Planes

| Plan | Usuarios | Ramp-up | Reporte |
| --- | --- | --- | --- |
| `plans/load-10-users.jmx` | 10 | 10 s | `results/performance/load-10/` |
| `plans/load-20-users.jmx` | 20 | 20 s | `results/performance/load-20/` |
| `plans/load-50-users.jmx` | 50 | 50 s | `results/performance/load-50/` |

Cada plan hace una petición `GET https://demo.prestashop.com/` con un `HTTP Cookie Manager`, un `Header Manager` y un `Summary Report`.

> **Limitación conocida:** `demo.prestashop.com` es una SPA que monta la tienda dentro de un iframe y crea una instancia temporal. JMeter no ejecuta JavaScript, por lo que estas pruebas miden la carga HTTP de la página inicial. Para un escenario más profundo se deben identificar los endpoints HTTP que consume la tienda y añadirlos como samplers.

## Ejecución

Requiere Apache JMeter 5.x en el `PATH`. Ejecutar desde la raíz del repositorio:

```bash
# Una prueba individual
jmeter -n \
  -t tests/performance/load/plans/load-10-users.jmx \
  -l results/performance/load-10/results.jtl \
  -e -o results/performance/load-10/html

# Las tres pruebas en secuencia
bash tests/performance/load/run-all.sh
```

## Informe

Consolidar los tres `Summary Report` en `docs/informe-final.md`, sección 4.1, indicando para cada nivel de concurrencia: tiempo medio, percentil 95, throughput y tasa de error.

Las evidencias se guardan en `evidences/performance/`.
