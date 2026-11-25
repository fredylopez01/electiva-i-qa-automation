# Etapa 2 — Pruebas móviles (Appium)

Validación funcional del **happy path de checkout** sobre la tienda en un dispositivo Android
controlado por **Appium**, replicando la secuencia de la Etapa 1.

Responsable: **Integrante 3**.

## Requisito del enunciado

> Las páginas para las pruebas E2E son parte de apps PWA. En su dispositivo móvil instale la
> "app" desde la página. Una vez instalada va a crear los mismos casos de prueba en Appium para
> ejecutar todo el proceso de checkout (solo el happy path) como se vio en la etapa anterior.

Como PrestaShop Demo es una PWA, "instalarla" significa abrirla en Chrome y añadirla a la pantalla
de inicio. Automatizar ese flujo de instalación no aporta cobertura: el objeto de prueba es el
checkout. Por eso la suite abre la tienda en Chrome para Android (el mismo motor de la PWA
instalada) y ejecuta el checkout completo. La decisión queda registrada en
[ADR-004](../../../docs/decisiones.md#adr-004--emulador-y-enfoque-de-la-etapa-2).

## Caso automatizado

`tests/checkout/checkout-happy-path.e2e.js` — cinco pasos, uno por cada requisito del enunciado:

1. **Crear una cuenta de usuario** nueva.
2. **Login** con esas credenciales.
3. **Agregar el primer producto** al carrito.
4. **Agregar un segundo producto diferente** y verificar que ambos están en el carrito.
5. **Checkout**: dirección, método de envío, método de pago y confirmación de la orden.

Además, `tests/smoke/environment.e2e.js` comprueba que Appium controla el dispositivo y que la
tienda carga; sirve para diagnosticar el entorno antes de una corrida larga.

## Requisitos

| Componente | Versión / nota |
| --- | --- |
| Node.js | 20+ (probado con 24) |
| Appium | `^3.9` instalado en el proyecto (`npm i -D appium`) |
| Driver | `appium-uiautomator2-driver@8.7.3` (en el proyecto, no global) |
| SDK de Android | `platform-tools`, `emulator`, `system-images;android-34;google_apis;x86_64` |
| Dispositivo | AVD `RetoElectivaI_API34` (Pixel 6, API 34, Chrome 113) |
| chromedriver | 113.0.5672.63 en `drivers/` (ver nota abajo) |
| Java | JDK 17+ |

> **Por qué el driver y el chromedriver van en el proyecto:** Appium resuelve sus
> drivers por directorio de instalación (`APPIUM_HOME`), así que `appium driver install`
> sobre el Appium global no sirve si se lanza el Appium local. Y el AVD de API 34 trae
> Chrome 113, que ya no está en la lista que Appium descarga automáticamente.

Para obtener el chromedriver (no se versiona por ser un binario):

```bash
curl -L -o /tmp/chromedriver113.zip \
  https://chromedriver.storage.googleapis.com/113.0.5672.63/chromedriver_win32.zip
unzip -o /tmp/chromedriver113.zip -d /tmp/cd113
cp /tmp/cd113/chromedriver.exe tests/mobile/drivers/
```

## Puesta en marcha

```bash
cd tests/mobile
npm install

# 1. Crear y arrancar el emulador (crea el AVD si no existe)
node scripts/start-emulator.js --headless

# 2. Publicar la tienda local dentro del emulador (si corre en Docker)
adb -s emulator-5554 reverse tcp:8090 tcp:8090

# 3. Verificar que el dispositivo está conectado
adb devices

# 4. Ejecutar la suite (el wrapper levanta y apaga Appium)
npm test
```

`npm test` usa `scripts/with-appium.js`, que lanza Appium con `node main.js` en vez
del shim `.cmd`: el shim rompe cuando la ruta del repositorio contiene espacios
(este repo vive en `electiva pruebas`).

## Variables de entorno

| Variable | Por defecto | Uso |
| --- | --- | --- |
| `BASE_URL` | `https://demo.prestashop.com/` | Tienda bajo prueba |
| `UDID` | *(auto)* | `emulator-5554`; se toma de `adb devices` |
| `DEVICE_NAME` | `RetoElectivaI_API34` | Nombre del AVD |
| `PLATFORM_VERSION` | `14` | API del AVD |
| `HEADLESS` | – | `1` ejecuta Chrome sin ventana |
| `APPIUM_HOST` / `APPIUM_PORT` | `127.0.0.1` / `4723` | Servidor Appium |
| `CHROMEDRIVER` | `drivers/chromedriver(.exe)` | Binario de chromedriver |

> **`localhost` dentro del emulador es el propio Android.** Para alcanzar la tienda
> del PC usa `adb reverse tcp:8090 tcp:8090` y luego `BASE_URL=http://localhost:8090/`.
> Ni `10.0.2.2` ni la IP de la LAN funcionan con el firewall de Windows activo.

## Ejecución desatendida junto a las pruebas de rendimiento

El emulador y Chrome consumen CPU, y competir con 30 usuarios de JMeter produce
timeouts que no son defectos de la suite. Para encadenarlas sin intervención:

```bash
# Espera a que termine el endurance y luego corre el móvil
node tests/mobile/scripts/run-after-endurance.js --max-wait-min=200
```

## Estructura

```
capabilities/     # Configuración de dispositivo/app (referencia)
page-objects/     # Localizadores y acciones por pantalla (index.js)
tests/checkout/   # Happy path completo
tests/smoke/      # Verificación del entorno
scripts/          # Arranque del AVD, wrapper de Appium, corrida diferida
drivers/          # chromedriver versionado para Chrome 113
reports/          # Salida local (ignorada por Git)
```

## Decisiones de automatización que conviene conocer

Cada una responde a un comportamiento real de PrestaShop observado al ejecutar:

- **Los checkboxes de registro no tienen `id`** y su `<label>` es un ancestro, no un
  `label[for]`. `BasePage.check()` intenta la etiqueta, luego el toggle por DOM.
- **El botón de agregar al carrito se intercepta con AJAX**: `form.submit()` **no**
  agrega el producto; hay que pulsar el botón para que corra el handler.
- **El radio del transportista se llama `delivery_option[<id_address>]`**, por eso se
  busca por prefijo (`name^="delivery_option"`).
- **Guardar la dirección y avanzar son dos pasos**: primero el POST del formulario,
  luego "Continuar". Si se pulsan juntos, el carrito queda con `id_address_delivery = 0`.
- **El código postal debe cumplir el formato del país** (`NNNNN` para Estados Unidos).
- **Los módulos de pago se filtran por país en SQL.** `Module::getHookModuleExecList()` usa
  `LEFT JOIN module_country … AND mc.id_country = <país de facturación>`: si un módulo **no
  tiene ninguna fila** en `ps_module_country`, queda fuera y el checkout muestra
  *"there is no payment method available"*. Para habilitarlo hay que **insertar** la fila del
  país deseado, nunca borrar las existentes.
- **El radio de la dirección debe quedar marcado.** Si el carrito no lo tiene, el POST viaja
  como `id_address=0`, el carrito pierde la dirección de entrega y el bloque de pago no se
  renderiza aunque el producto sí esté en el carrito. Se detecta en el access log de Apache.
- **El CLI de PrestaShop no reproduce el pago.** `ps_checkpayment` llama a `formatPrice()` sobre
  `getCurrentLocale()`, que es `null` fuera de un controlador de front y lanza un fatal que
  aborta el hook. Ese error solo aparece al diagnosticar por consola.

## Reportes y evidencias

| Ruta | Contenido |
| --- | --- |
| `tests/mobile/reports/allure-results/` | Resultados crudos de Allure |
| `tests/mobile/reports/appium.log` | Log del servidor Appium |
| `tests/mobile/reports/screenshots/` | Captura automática de cada paso fallido |
| `results/mobile/` | Reporte HTML de Allure (versionado) |
| `evidences/mobile/` | Videos, capturas y salida de consola |

Ver reporte: `npx allure open results/mobile/allure-report` (o el `index.html` incluido).

## Notas de mantenimiento

- Los localizadores siguen el tema Classic de PrestaShop 8/9. Si cambia el tema, se ajustan en
  `page-objects/index.js` — ahí y solo ahí.
- El registro usa un correo con marca de tiempo, así que la suite se puede repetir sin limpiar datos.
- El paso 5 elige el **primer** método de pago disponible; en la tienda local el módulo de
  chequeo (`ps_checkpayment`) siempre está presente, lo que hace la corrida determinista.
