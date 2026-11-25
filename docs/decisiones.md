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

## ADR-004 — Emulador y enfoque de la Etapa 2 (Integrante 3)

- **Estado:** Aceptado (Integrante 3).
- **Decisión:** Ejecutar las pruebas móviles con **Appium + driver `uiautomator2`** sobre un **AVD del SDK de Android** (Pixel 6, API 34), abriendo la tienda en **Chrome para Android** en lugar de instalar la PWA y automatizar su instalación.
- **Contexto:**
  - El enunciado sugiere Genymotion o BrowserStack. Ambos son emuladores Android: el objeto de prueba (la tienda en un navegador móvil) es idéntico, pero Genymotion exige cuenta y licencia personal, y BrowserStack exige cuenta y consume minutos de un plan limitado. El AVD del SDK no tiene esas dependencias, corre sin conexión y es reproducible en un pipeline.
  - El requisito real es "ejecutar todo el proceso de checkout (solo el happy path)". Automatizar el flujo de instalación de la PWA (añadir a pantalla de inicio) no aporta cobertura de negocio y es frágil entre versiones de Chrome.
  - Chrome para Android usa el mismo motor Chromium que la PWA instalada, así que el comportamiento del checkout es el mismo.
- **Consecuencias:**
  - `tests/mobile/` incluye `scripts/start-emulator.js`, que crea y arranca el AVD sin intervención manual.
  - Los localizadores son los del tema Classic en viewport móvil (`page-objects/index.js`).
  - Migrar a Genymotion o BrowserStack solo requiere cambiar los *capabilities* en `wdio.conf.js` (`platformName`, `appium:deviceName`, `appium:udid`), no los tests.

## ADR-005 — Entorno de las pruebas móviles y de desempeño (Integrante 3)

- **Estado:** Aceptado (Integrante 3).
- **Decisión:** Apuntar la Etapa 2 y la prueba de desempeño de 2 horas al **PrestaShop 8.2 local en Docker** del ADR-003, y no a <https://demo.prestashop.com/>.
- **Contexto — motivo principal, medido el 23/11/2026:**
  - La demo pública **no estaba operativa** durante la ventana de trabajo. Se verificó repetidamente: `demo.prestashop.com` responde 200 (es una SPA estática), pero al crear una tienda (`POST https://api.demo.prestashop.com/api/v1/machine`) el subdominio asignado devuelve **502** o agota el tiempo de espera de 20–30 s. El *fallback* oficial `fo.demo.prestashop.com` también respondió 502.
  - Aun si estuviera arriba, cada visitante recibe una tienda temporal distinta (`proud-grain`, `vestal-relation`, `noble-brick` en la misma sesión) y el redirect cambia de subdominio entre peticiones. Una prueba de 2 horas contra ese comportamiento mediría el aprovisionamiento de tiendas de PrestaShop, no el rendimiento del checkout.
  - La demo está detrás de Cloudflare; sostener 30 usuarios durante 2 horas enviaría tráfico agresivo a un servicio de terceros.
- **Consecuencias:**
  - Los tests móviles y la prueba de 2 h comparten el mismo sistema bajo prueba, lo que hace comparables sus resultados con los de estrés del Integrante 2.
  - Las mediciones de CPU/memoria tienen sentido porque los contenedores tienen límites conocidos (2 CPU / 2 GB y 1 CPU / 1 GB).
  - Ambos componentes están parametrizados (`BASE_URL`, `ENDURANCE_BASE_URL`), así que si la demo vuelve a estar disponible se puede repetir contra ella sin cambiar código.
  - La caída queda documentada como hallazgo en `docs/informe-final.md`, con la evidencia de las comprobaciones.
