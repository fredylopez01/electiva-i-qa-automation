# Distribución del trabajo

La estructura del repositorio está organizada **por tipo de prueba**. A continuación se documenta quién lidera cada frente; esto es solo una guía de responsabilidades, no una división de carpetas.

## Responsabilidades

| Integrante | Responsabilidad principal | Carpetas donde trabaja | Responsabilidad secundaria | Carpetas donde trabaja |
| --- | --- | --- | --- | --- |
| Integrante 1 | E2E con Cypress | `tests/e2e-web/` | Pruebas de carga (10, 20 y 50 usuarios) | `tests/performance/load/` |
| Integrante 2 | API Testing con Postman/Newman | `tests/api/` | Pruebas de estrés (2 pruebas) | `tests/performance/stress/` |
| Integrante 3 | Pruebas móviles con Appium | `tests/mobile/` | Prueba de desempeño de 2 horas | `tests/performance/endurance/` |

## Matriz tipo de prueba → responsable

| Tipo de prueba | Etapa del PDF | Responsable |
| --- | --- | --- |
| E2E web (Cypress) | Etapa 1 | Integrante 1 |
| Móvil (Appium) | Etapa 2 | Integrante 3 |
| API (Postman/Newman) | Etapa 3 | Integrante 2 |
| Carga | Etapa 4 | Integrante 1 |
| Estrés | Etapa 4 | Integrante 2 |
| Desempeño (2 horas) | Etapa 4 | Integrante 3 |

## Notas de colaboración

- Aunque las pruebas de rendimiento se reparten entre los tres integrantes, comparten la carpeta `tests/performance/` con subcarpetas por subtipo (`load`, `stress`, `endurance`).
- Los reportes de todos los subtipos se consolidan en `results/performance/` y las evidencias en `evidences/performance/`.
- Cada integrante documenta sus resultados en `docs/informe-final.md` dentro de la sección de su etapa.
