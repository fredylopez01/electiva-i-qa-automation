# Etapa 4 — Pruebas de rendimiento

Evaluación del comportamiento no funcional de **Practice Software Testing / Toolshop** (<https://practicesoftwaretesting.com/>), usada como alternativa práctica porque el demo de PrestaShop presentó inestabilidad/caídas. La herramienta elegida para las pruebas de carga es **Apache JMeter**.

> Los planes y reportes se organizan por subtipo de prueba, no por herramienta ni por integrante.

## Subtipos

| Subtipo | Requisito del enunciado | Carpeta |
| --- | --- | --- |
| Carga | Al menos 3 pruebas con 10, 20 y 50 usuarios concurrentes. Generar un informe con las 3 pruebas. | `load/` |
| Estrés | 2 pruebas en las que se considere que la aplicación agota los recursos; configurar con los máximos recursos posibles de la máquina. | `stress/` |
| Desempeño | Pruebas continuas por al menos 2 horas con 20–50 usuarios concurrentes. | `endurance/` |

Cada subtipo tiene:

```
<subtipo>/
├── plans/     # Planes de prueba (.jmx, .scala, etc.)
└── reports/   # Resultados de la ejecución
```

`resources/` contiene datos compartidos (por ejemplo, archivos CSV de usuarios).

## Ejecución

Comando general con JMeter:

```bash
jmeter -n -t load/plans/<plan>.jmx -l load/reports/results.jtl -e -o load/reports/html
```

Los planes de carga concretos (10, 20 y 50 usuarios) se documentan en `load/README.md`.

Las 2 pruebas de estrés (rampa incremental y pico súbito) se documentan en [`stress/README.md`](stress/README.md); se ejecutan contra un PrestaShop local en Docker (ver ADR-003 en `docs/decisiones.md`).

## Resultados y evidencias

- Reportes: `results/performance/`
- Evidencias: `evidences/performance/`
- Consolidación de las 3 pruebas de carga y de las 2 de estrés en `docs/informe-final.md`.
