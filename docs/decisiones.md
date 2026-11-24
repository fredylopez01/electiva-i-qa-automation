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

## ADR-003 — Entorno de las pruebas de estrés

- **Estado:** Aceptado (Integrante 2).
- **Decisión:** Ejecutar las 2 pruebas de estrés con Apache JMeter contra una instancia **local de PrestaShop 8.2** levantada con Docker ([`tests/performance/stress/docker-compose.yml`](../tests/performance/stress/docker-compose.yml)), con el mismo catálogo de demostración que <https://demo.prestashop.com/>.
- **Contexto:**
  - El objetivo de una prueba de estrés es llevar la aplicación hasta el quiebre. <https://demo.prestashop.com/> es un servicio público de PrestaShop protegido por Cloudflare que crea una tienda temporal en un subdominio aleatorio por visitante; estresarlo desde un portátil mediría sobre todo el bloqueo/challenge de Cloudflare y no a PrestaShop, y además saturaría un servicio de terceros.
  - El enunciado pide configurar la prueba "con los máximos recursos posibles" de la máquina, lo que solo se puede controlar en un entorno propio.
- **Consecuencias:**
  - Los planes `.jmx` están parametrizados (`-Jprotocol`, `-Jhost`, `-Jport`, `-Jusers`, `-Jrampup`, `-Jduration`); por defecto apuntan a `http://localhost:8090`.
  - El sistema bajo prueba se limita a 2 CPU / 2 GB (PrestaShop) y 1 CPU / 1 GB (MySQL), mientras JMeter recibe hasta 6 GB de heap en una máquina de 10 núcleos y 16 GB, para que sea la aplicación (y no el generador) la que se agote.
  - Las pruebas de carga (Integrante 1) y de desempeño (Integrante 3) pueden seguir apuntando a la demo pública según ADR-001, o reutilizar este entorno local si se encuentran los mismos bloqueos.
