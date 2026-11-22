# Etapa 1 — Pruebas E2E web (Cypress)

Pruebas de extremo a extremo sobre la interfaz web, usando **Cypress con JavaScript**.

## Sitio evaluado

**Sitio seleccionado:** <https://demo.prestashop.com/> (PrestaShop Demo).

La URL se configura en `cypress.config.js` como `baseUrl` y puede sobrescribirse con la variable de entorno `CYPRESS_baseUrl`. El sitio carga la tienda dentro de un iframe; los comandos de soporte esperan a que termine el loader, leen el `src` del iframe y visitan la tienda directamente para interactuar como en una página normal.

## Casos requeridos

### Happy path — `cypress/e2e/checkout/`

Ejecutar en este orden:

1. Crear una cuenta de usuario.
2. Hacer login con usuario y contraseña correctos.
3. Añadir un producto al carrito.
4. Añadir otro producto diferente al carrito.
5. Hacer checkout: digitar información de envío, seleccionar método de envío y seleccionar método de pago. Para generar tarjetas de crédito de prueba: <https://www.betterbugs.io/development-tools/credit-card-generator>.

### Pruebas negativas — `cypress/e2e/negative/`

Al menos 3 casos, por ejemplo:

- Login con usuario/contraseña errados.
- Checkout sin productos en el carrito.
- Tarjetas de crédito inválidas.

## Estructura

```
cypress/
├── e2e/
│   ├── checkout/     # Happy path
│   └── negative/     # Pruebas negativas
├── fixtures/         # Usuarios, productos y tarjetas de prueba
├── support/          # Comandos personalizados y hooks
└── screenshots/      # Capturas generadas automáticamente
reports/              # Reportes de ejecución
```

## Ejecución

```bash
cd tests/e2e-web
npm install
npm run cy:open              # modo interactivo
npm run cy:run               # todas las pruebas en modo headless
npm run cy:run:checkout      # solo happy path
npm run cy:run:negative      # solo pruebas negativas
```

La URL se puede sobrescribir con `CYPRESS_baseUrl=https://demo.prestashop.com/`.

## Notas técnicas

- La tienda se renderiza dentro de `iframe[title="Frame of demo shop"]`, pero `openDemoShop()` lee su `src` y visita la tienda directamente (`https://<subdominio>.demo.prestashop.com/en/`). Esto evita los errores de "element detached from DOM" al navegar dentro del iframe.
- El demo muestra `#loadingMessage` mientras crea una tienda temporal; `openDemoShop()` espera a que desaparezca.
- Los botones "Add to cart" se registran vía JavaScript asíncrono. `addProductToCart()` usa `cypress-network-idle` para esperar a que terminen los recursos `*.js` y evitar clics prematuros.
- El correo de registro se genera con `Date.now()` porque cada ejecución usa una tienda nueva.
- PrestaShop 8 usa ids `field-*` y botones con `data-link-action` (por ejemplo `field-birthday` y `save-customer`). En el registro se llena la fecha de nacimiento y no hay campo `confirmation`. Se marcan todos los checkboxes con `required` (`psgdpr` y `customer_privacy`); `optin` y `newsletter` se dejan sin marcar. Los selectores antiguos se mantienen como fallback.
- El menú de usuario es un dropdown: `logout()` abre `#userMenuButton` si "Sign out" no está visible y después clica el enlace. El mismo botón (`aria-label="View my account (...)"`) se usa para verificar el login.
- Los selectores pueden necesitar ajuste si el demo cambia de idioma o de versión de PrestaShop.

## Resultados y evidencias

- Reportes: `results/e2e-web/`
- Evidencias: `evidences/e2e-web/`
