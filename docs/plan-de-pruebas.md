# Plan de pruebas — Reto Final Electiva I

## 1. Objetivo

Diseñar e implementar una suite completa de pruebas automatizadas que valide los flujos críticos de una plataforma de e-commerce (API backend, interfaz web y aplicación móvil) y evalúe su comportamiento ante alta demanda.

## 2. Alcance

| Etapa | Tipo de prueba | Herramienta | Carpeta |
| --- | --- | --- | --- |
| 1 | E2E web | Cypress (JavaScript) | `tests/e2e-web/` |
| 2 | Pruebas móviles | Appium + emulador (Genymotion o BrowserStack) | `tests/mobile/` |
| 3 | API Testing | Postman + Newman | `tests/api/` |
| 4 | Pruebas de rendimiento | JMeter / Gatling | `tests/performance/` |

**Fuera de alcance:** pruebas manuales exploratorias, automatización de la app de administración y pruebas de seguridad.

## 3. Estrategia por etapa

### Etapa 1 — E2E web (Cypress)

**Sitio seleccionado:** <https://demo.prestashop.com/> (PrestaShop Demo). Esta decisión aplica a la Etapa 1 y a la Etapa 4; la Etapa 2 usa el mismo flujo sobre la PWA/app móvil.

Flujo *happy path*, ejecutado en este orden:

1. Crear una cuenta de usuario.
2. Hacer login con usuario y contraseña correctos.
3. Añadir un producto al carrito.
4. Añadir otro producto diferente al carrito.
5. Hacer checkout: digitar información de envío, seleccionar método de envío y seleccionar método de pago. Para el pago se pueden generar tarjetas en <https://www.betterbugs.io/development-tools/credit-card-generator>.

Además, se crean **al menos 3 pruebas negativas**, por ejemplo:

- Login con usuario/contraseña errados.
- Checkout sin productos en el carrito.
- Tarjetas de crédito inválidas.

### Etapa 2 — Pruebas móviles (Appium)

Ejecutar todo el proceso de checkout del *happy path* de la etapa 1 sobre la app móvil, usando Appium con emulador Genymotion o BrowserStack.

### Etapa 3 — API Testing (Postman/Newman)

Automatizar **al menos 20 pruebas de API diferentes**. APIs sugeridas por el enunciado:

- <https://fakerapi.it/>
- <https://open-meteo.com/>
- <https://restful-api.dev/>
- <https://httpbin.org/>
- <https://jsonplaceholder.typicode.com/>
- <https://api.practicesoftwaretesting.com/api/documentation>

### Etapa 4 — Pruebas de rendimiento

| Subtipo | Requisito | Carpeta |
| --- | --- | --- |
| Carga | Al menos 3 pruebas con 10, 20 y 50 usuarios concurrentes. Generar informe con las 3 pruebas. | `tests/performance/load/` |
| Estrés | 2 pruebas configurando los recursos máximos de la máquina de prueba. | `tests/performance/stress/` |
| Desempeño | Pruebas continuas por al menos 2 horas con 20–50 usuarios concurrentes. | `tests/performance/endurance/` |

**Objetivo de las pruebas de rendimiento:** <https://demo.prestashop.com/>. **Herramienta elegida:** Apache JMeter.

## 4. Criterios de aceptación

- Cada caso automatizado tiene un nombre descriptivo y está en la carpeta correspondiente a su tipo de prueba.
- Las pruebas se ejecutan de forma repetible desde un comando documentado en el README de cada carpeta.
- Los reportes se guardan en `results/<tipo-de-prueba>/`.
- Las evidencias (capturas, videos, logs) se guardan en `evidences/<tipo-de-prueba>/`.
- El informe final consigna los resultados de las 4 etapas.

## 5. Entregables

- Código de las pruebas en `tests/`.
- Reportes en `results/`.
- Evidencias en `evidences/`.
- Informe en `docs/informe-final.md`.
- Demo o video breve para la sustentación.
