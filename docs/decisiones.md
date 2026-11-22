# Decisiones del proyecto

Registro de decisiones acordadas por el equipo. Estas decisiones aplican a todas las ramas y deben respetarse al desarrollar cada etapa.

## ADR-001 — Sitio web objetivo

- **Estado:** Aceptado.
- **Decisión:** Usar [PrestaShop Demo](https://demo.prestashop.com/) como plataforma de pruebas.
- **Contexto:** El enunciado permite elegir entre `https://venia.magento.com/default/` y `https://demo.prestashop.com/` para la Etapa 1 (E2E web).
- **Consecuencias:**
  - La Etapa 1 (Cypress) y la Etapa 4 (rendimiento) apuntan a PrestaShop Demo.
  - La Etapa 2 (Appium) reproduce el mismo *happy path* de checkout sobre la PWA/app móvil.
  - Toda la configuración de `baseUrl` y los planes de carga usan esta URL.

## ADR-002 — Herramienta de pruebas de carga

- **Estado:** Aceptado.
- **Decisión:** Usar **Apache JMeter** para las pruebas de carga de la Etapa 4.
- **Contexto:** El enunciado permite elegir herramienta de desempeño (Gatling, Apache JMeter, etc.).
- **Consecuencias:**
  - Los planes de carga se versionan como archivos `.jmx` en `tests/performance/load/plans/`.
  - Se ejecutan 3 pruebas: 10, 20 y 50 usuarios concurrentes.
  - Los reportes se guardan en `results/performance/` y las evidencias en `evidences/performance/`.
  - La selección de JMeter para carga no impide que los otros subtipos (estrés y desempeño) usen la misma herramienta, pero se documentará por separado.
