# Etapa 2 — Pruebas móviles (Appium)

Validación funcional de la aplicación móvil mediante el servidor y las librerías cliente de **Appium**.

## Requisitos

- Servidor Appium en ejecución.
- Emulador o dispositivo: **Genymotion** o **BrowserStack** (según lo elegido por el equipo).
- La app debe tener disponible el mismo flujo de checkout de la etapa 1.

## Caso requerido

Ejecutar todo el proceso de checkout del **happy path** visto en la Etapa 1:

1. Crear cuenta / registrarse.
2. Login con credenciales correctas.
3. Añadir un producto al carrito.
4. Añadir otro producto diferente.
5. Checkout con información de envío, método de envío y método de pago.

## Estructura

```
capabilities/     # Configuración del dispositivo/emulador y de la app
page-objects/     # Localizadores y pantallas de la app
tests/checkout/   # Escenario happy path
drivers/          # Binarios del driver (no versionar)
reports/          # Reportes de ejecución
```

## Ejecución

```bash
npm install
# Iniciar Appium antes de ejecutar
npm test
```

## Resultados y evidencias

- Reportes: `results/mobile/`
- Evidencias: `evidences/mobile/`
