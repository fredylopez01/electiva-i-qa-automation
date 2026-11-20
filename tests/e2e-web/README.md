# Etapa 1 — Pruebas E2E web (Cypress)

Pruebas de extremo a extremo sobre la interfaz web, usando **Cypress con JavaScript**.

## Sitio a evaluar

Elegir uno de los dos sitios del enunciado:

- <https://venia.magento.com/default/>
- <https://demo.prestashop.com/>

Registrar la URL elegida en `cypress.config.js` (o como variable de entorno).

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
npm install
npx cypress open     # modo interactivo
npx cypress run      # modo headless (CI)
```

## Resultados y evidencias

- Reportes: `results/e2e-web/`
- Evidencias: `evidences/e2e-web/`
