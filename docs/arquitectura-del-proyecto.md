# Arquitectura del proyecto

## 1. Visión general

El sistema bajo prueba es una plataforma de e-commerce con tres capas:

- **API backend:** servicios REST consumidos por la web y la app móvil.
- **Interfaz web:** flujo de registro, login, carrito y checkout.
- **Aplicación móvil:** mismo flujo de checkout del *happy path*.

La suite automatizada ataca cada capa con la herramienta adecuada y genera reportes y evidencias que alimentan el informe final.

**Plataforma seleccionada:** [PrestaShop Demo](https://demo.prestashop.com/) para la interfaz web (Etapa 1) y las pruebas de rendimiento (Etapa 4). Las pruebas de carga se implementan con Apache JMeter. Ver [`docs/decisiones.md`](./decisiones.md).

## 2. Organización de carpetas

La estructura está agrupada **por tipo de prueba**, no por integrante:

```
tests/
├── e2e-web/                       # Etapa 1 — Cypress
│   ├── cypress/e2e/checkout/      # Flujo happy path (5 pasos)
│   ├── cypress/e2e/negative/      # Mínimo 3 pruebas negativas
│   ├── cypress/fixtures/          # Datos de prueba (usuarios, tarjetas)
│   ├── cypress/support/           # Comandos personalizados y hooks
│   └── reports/                   # Reportes de ejecución
├── mobile/                        # Etapa 2 — Appium
│   ├── capabilities/              # Configuración de dispositivo/emulador
│   ├── page-objects/              # Localizadores y pantallas
│   ├── tests/checkout/            # Happy path de checkout
│   ├── drivers/                   # Binarios de Appium (no versionar)
│   └── reports/
├── api/                           # Etapa 3 — Postman + Newman
│   ├── collections/               # Colecciones Postman (mín. 20 pruebas)
│   ├── environments/              # Variables por entorno
│   ├── data/                      # Datos para las iteraciones
│   ├── schemas/                   # Esquemas de validación
│   └── reports/
└── performance/                   # Etapa 4 — Rendimiento
    ├── load/plans/ + load/reports/        # 10, 20 y 50 usuarios
    ├── stress/plans/ + stress/reports/    # 2 pruebas, recursos máximos
    ├── endurance/plans/ + endurance/reports/ # 2 horas, 20–50 usuarios
    └── resources/                 # CSV y datos de prueba
```

## 3. Flujo de resultados

```
tests/<tipo>/  ── ejecución ──>  results/<tipo>/     (reportes)
                            └─>  evidences/<tipo>/   (capturas, videos, logs)
                                        │
                                        └─> docs/informe-final.md
```

## 4. Convenciones

- Nombres de carpetas en `kebab-case`.
- Un README por tipo de prueba con comandos de ejecución.
- Las carpetas vacías incluyen `.gitkeep` para que la estructura se pueda clonar completa.
- Los secretos y variables de entorno se maneja con `.env` (ignorado por Git).
- La responsabilidad de cada integrante se documenta en `docs/distribucion-trabajo.md`, sin crear carpetas por persona.
