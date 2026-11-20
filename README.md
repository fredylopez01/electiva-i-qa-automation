# Electiva I — Ingeniería de Pruebas · Reto Final

Repositorio del equipo para diseñar e implementar una suite completa de **pruebas automatizadas** sobre una plataforma de e-commerce que cuenta con API backend, interfaz web y aplicación móvil.

El objetivo es garantizar la estabilidad de los flujos críticos de negocio (checkout) y evaluar el comportamiento del sistema ante condiciones de alta demanda de infraestructura.

## Requisitos del reto

El enunciado oficial está en [`Reto_ElectivaI_13112026.pdf`](./Reto_ElectivaI_13112026.pdf). Resumen de las 4 etapas:

| Etapa | Tipo de prueba | Herramienta | Carpeta |
| --- | --- | --- | --- |
| 1 | E2E web: checkout + al menos 3 pruebas negativas | Cypress (JavaScript) | [`tests/e2e-web/`](./tests/e2e-web/) |
| 2 | Funcional móvil: checkout *happy path* | Appium + emulador | [`tests/mobile/`](./tests/mobile/) |
| 3 | API Testing: al menos 20 pruebas | Postman + Newman | [`tests/api/`](./tests/api/) |
| 4 | Rendimiento: carga (10/20/50), estrés (2 pruebas) y desempeño (2 horas) | JMeter / Gatling | [`tests/performance/`](./tests/performance/) |

## Estructura del repositorio

```
.
├── docs/                      # Plan de pruebas, arquitectura, distribución e informe final
│   ├── plan-de-pruebas.md
│   ├── arquitectura-del-proyecto.md
│   ├── distribucion-trabajo.md
│   └── informe-final.md
├── tests/
│   ├── e2e-web/               # Etapa 1 — Cypress
│   ├── mobile/                # Etapa 2 — Appium
│   ├── api/                   # Etapa 3 — Postman / Newman
│   └── performance/           # Etapa 4 — load / stress / endurance
│       ├── load/              # 10, 20 y 50 usuarios concurrentes
│       ├── stress/            # 2 pruebas con recursos máximos
│       └── endurance/         # 2 horas continuas con 20–50 usuarios
├── results/                   # Reportes consolidados por tipo de prueba
├── evidences/                 # Capturas, videos y logs para la sustentación
└── Reto_ElectivaI_13112026.pdf
```

> La organización es **por tipo de prueba**, no por integrante. La distribución de responsabilidades se documenta en [`docs/distribucion-trabajo.md`](./docs/distribucion-trabajo.md).

## Cómo trabajar

1. Cada integrante crea una rama desde `main` (por ejemplo `feature/e2e-web`, `feature/api`, `feature/load`).
2. Todo el código de pruebas vive en `tests/<tipo-de-prueba>/`.
3. Los reportes se guardan en `results/<tipo-de-prueba>/` y las evidencias en `evidences/<tipo-de-prueba>/`.
4. Los avances y resultados se consolidan en `docs/`, especialmente en `docs/informe-final.md`.
5. Se abre un *pull request* a `main` describiendo los casos añadidos y adjuntando las evidencias.

## Entregables

- Suite automatizada de las 4 etapas.
- Informe con los resultados de cada etapa ([`docs/informe-final.md`](./docs/informe-final.md)).
- Demo o video breve de la ejecución para la sustentación ([`evidences/`](./evidences/)).
