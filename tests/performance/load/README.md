# Pruebas de carga — Practice Software Testing (Toolshop)

Tres pruebas de carga con **10, 20 y 50 usuarios concurrentes**, según el requisito de la Etapa 4.

## Objetivo

- **Sitio:** <https://practicesoftwaretesting.com/>
- **Motivo del cambio:** el demo de PrestaShop presentó inestabilidad/caídas; se usa Toolshop como alternativa funcional para la ejecución práctica.

## Planes

| Plan | Usuarios | Ramp-up | Reporte |
| --- | --- | --- | --- |
| `plans/load-10-users.jmx` | 10 | 10 s | `results/performance/load-10/` |
| `plans/load-20-users.jmx` | 20 | 20 s | `results/performance/load-20/` |
| `plans/load-50-users.jmx` | 50 | 50 s | `results/performance/load-50/` |

Cada plan hace una petición `GET https://practicesoftwaretesting.com/` con un `HTTP Cookie Manager`, un `Header Manager` y un `Summary Report`.

> **Limitación conocida:** Practice Software Testing es una SPA. JMeter no ejecuta JavaScript, por lo que estas pruebas miden la carga HTTP de la página inicial/respuesta del frontend. Para un escenario más profundo se deben identificar los endpoints HTTP/API que consume la tienda y añadirlos como samplers.

## Ejecución

Requiere **Apache JMeter 5.x** instalado y disponible en el `PATH`. Ejecutar desde la raíz del repositorio:

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
