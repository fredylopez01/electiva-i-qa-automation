# Informe de ejecución E2E — Practice Software Testing

**Fecha:** 2026-11-23  
**Sitio:** <https://practicesoftwaretesting.com/>  
**Herramienta:** Cypress 13.17.0  
**Entorno:** Node.js 22.22.0, Electron 118, Windows

## Alcance

El [enunciado](../../Reto_ElectivaI_13112026.pdf) solicita un happy path E2E de cinco pasos y al menos tres pruebas negativas. Esta suite adicional usa Practice Software Testing porque el flujo de checkout fue validado allí; las pruebas existentes de PrestaShop se conservaron.

El checkout de este sitio no presenta un selector separado de método de envío. Se diligencia la dirección y se elige el método de pago disponible.

## Casos ejecutados

### Happy path

Cada etapa es un `it` separado para mostrar el avance en el runner de Cypress. Se conserva la sesión entre etapas para compartir la cuenta y el carrito.

| Paso | Caso | Resultado |
| --- | --- | --- |
| 1 | Crear una cuenta | Aprobado |
| 2 | Iniciar sesión con la cuenta creada | Aprobado |
| 3 | Agregar `Combination Pliers` | Aprobado |
| 4 | Agregar `Pliers`, un producto diferente | Aprobado |
| 5 | Completar checkout con dirección, pago Cash on Delivery y confirmar pedido | Aprobado |

**Resultado:** 5 aprobados, 0 fallidos.

### Casos negativos

| Caso | Validación | Resultado |
| --- | --- | --- |
| Credenciales incorrectas | Se muestra el error y no se inicia sesión | Aprobado |
| Checkout con carrito vacío | No aparecen controles para continuar el checkout | Aprobado |
| Tarjeta inválida | Se muestra el error de formato y el botón de verificación permanece deshabilitado | Aprobado |

**Resultado:** 3 aprobados, 0 fallidos.

## Resumen de ejecución

| Comando | Casos | Aprobados | Fallidos | Duración |
| --- | ---: | ---: | ---: | ---: |
| `npm run cy:run:toolshop` | 5 | 5 | 0 | 36 s |
| `npm run cy:run:toolshop:negative` | 3 | 3 | 0 | 37 s |
| **Total** | **8** | **8** | **0** | **73 s** |

## Hallazgos y mantenimiento

- La demo había renovado los identificadores de producto: los IDs anteriores llevaban a páginas sin el producto, aunque los nombres seguían en el catálogo. Se actualizaron los IDs usados por la suite y se verificó de nuevo el flujo completo.
- Los IDs actuales están definidos en `tests/e2e-web/cypress/e2e/toolshop/checkout-happy-path.cy.js` y en la prueba de tarjeta. Si el proveedor vuelve a renovar el catálogo, actualizarlos con los IDs vigentes para `Combination Pliers` y `Pliers`.
- La interfaz puede aparecer en español; las pruebas usan selectores `data-test` y admiten los mensajes de validación en ambos idiomas.

## Evidencias

Cypress grabó un video por spec:

- [Happy path](../../tests/e2e-web/cypress/videos/checkout-happy-path.cy.js.mp4)
- [Pruebas negativas](../../tests/e2e-web/cypress/videos/negative-checkout.cy.js.mp4)

No se generaron capturas en la ejecución final porque todos los casos pasaron.
