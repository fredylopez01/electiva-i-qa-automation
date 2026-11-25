import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..', '..');

const MOBILE_DIR = path.resolve(REPO_ROOT, 'tests', 'mobile');
const REPORTS_DIR = path.join(MOBILE_DIR, 'reports');
const RESULTS_DIR = path.join(REPO_ROOT, 'results', 'mobile');
const EVIDENCES_DIR = path.join(REPO_ROOT, 'evidences', 'mobile');

const {
  APPIUM_HOST = '127.0.0.1',
  APPIUM_PORT = '4723',
  APPIUM_BASE_PATH = '/',
  PLATFORM_NAME = 'Android',
  PLATFORM_VERSION = '14',
  DEVICE_NAME = 'RetoElectivaI_API34',
  UDID = '',
  BROWSER_NAME = 'Chrome',
  APPIUM_APP_ID = 'com.android.chrome',
  BASE_URL = 'https://demo.prestashop.com/',
  HEADLESS = '',
  DEBUG = '',
} = process.env;

const headless = ['1', 'true', 'yes'].includes(String(HEADLESS).toLowerCase());

/**
 * Binario de chromedriver. El AVD de API 34 trae Chrome 113, y Appium solo
 * descarga automáticamente drivers para versiones recientes, así que se usa el
 * chromedriver de drivers/ (ver README). Se puede sobreescribir con CHROMEDRIVER.
 */
const CHROMEDRIVER_PATH =
  process.env.CHROMEDRIVER ||
  (fs.existsSync(path.join(MOBILE_DIR, 'drivers', process.platform === 'win32' ? 'chromedriver.exe' : 'chromedriver'))
    ? path.join(MOBILE_DIR, 'drivers', process.platform === 'win32' ? 'chromedriver.exe' : 'chromedriver')
    : '');

/**
 * Binario de Appium. Se usa el Appium instalado en el proyecto (`npm i -D appium`)
 * porque Appium resuelve sus drivers por directorio de instalación (APPIUM_HOME):
 * uiautomator2 debe estar junto a este package.json.
 *
 * En Windows se lanza con `node <main.js>` en vez del shim .cmd: la ruta del repo
 * contiene espacios ("electiva pruebas") y el shim rompe el comando.
 */
const APPIUM_COMMAND =
  process.env.APPIUM_COMMAND ||
  (process.platform === 'win32'
    ? `${process.execPath} ${path.join(MOBILE_DIR, 'node_modules', 'appium', 'build', 'lib', 'main.js')}`
    : path.join(MOBILE_DIR, 'node_modules', '.bin', 'appium'));

export const config = {
  runner: 'local',
  specs: [path.join(MOBILE_DIR, 'tests', '**', '*.e2e.js')],
  suites: {
    checkout: [path.join(MOBILE_DIR, 'tests', 'checkout', '*.e2e.js')],
    smoke: [path.join(MOBILE_DIR, 'tests', 'smoke', '*.e2e.js')],
  },

  maxInstances: 1,
  logLevel: DEBUG ? 'debug' : 'info',
  bail: 0,
  waitforTimeout: 20000,
  connectionRetryTimeout: 180000,
  connectionRetryCount: 2,

  hostname: APPIUM_HOST,
  port: Number(APPIUM_PORT),
  path: APPIUM_BASE_PATH === '/' ? '/' : APPIUM_BASE_PATH,

  // Appium se levanta desde scripts/with-appium.js (npm test) y no con el servicio
  // de WDIO: el service lo lanza con `cmd /c` y la ruta de este repo contiene
  // espacios ("electiva pruebas"), lo que rompe el comando en Windows.
  services: [],

  framework: 'mocha',
  mochaOpts: {
    ui: 'bdd',
    timeout: 180000,
    retries: 0,
  },

  reporters: [
    'spec',
    [
      'allure',
      {
        outputDir: path.join(REPORTS_DIR, 'allure-results'),
        disableWebdriverStepsReporting: true,
        disableWebdriverScreenshotsReporting: false,
        useCucumberStepReporter: false,
      },
    ],
  ],

  reportersDir: REPORTS_DIR,

  capabilities: [
    {
      platformName: PLATFORM_NAME,
      'appium:automationName': 'UiAutomator2',
      // WDIO 9 usa BiDi por defecto, pero el driver uiautomator2 no implementa
      // browsingContext.navigate. Se fuerza el protocolo WebDriver clásico.
      'wdio:enforceWebDriverClassic': true,
      'appium:deviceName': DEVICE_NAME,
      ...(UDID ? { 'appium:udid': UDID } : {}),
      'appium:platformVersion': PLATFORM_VERSION,
      // Chrome para Android: Appium exige browserName sin appPackage/appActivity.
      'browserName': BROWSER_NAME,
      'appium:noReset': true,
      'appium:newCommandTimeout': 300,
      // El AVD trae Chrome 113, que no está en la lista que Appium descarga solo.
      // Se apunta al binario de drivers/ (ver README) y se desactiva la descarga.
      'appium:chromedriverAutodownload': false,
      ...(CHROMEDRIVER_PATH ? { 'appium:chromedriverExecutable': CHROMEDRIVER_PATH } : {}),
      'appium:chromedriverArgs': headless ? ['--headless=new', '--disable-gpu'] : [],
      'appium:chromeOptions': {
        args: [
          '--disable-notifications',
          '--disable-popup-blocking',
          '--ignore-certificate-errors',
          ...(headless ? ['--headless=new', '--disable-gpu'] : []),
        ],
        w3c: false,
      },
      ...(headless
        ? {
            'appium:isHeadless': true,
            'appium:settings[ignoreUnimportantViews]': true,
          }
        : {}),
    },
  ],

  beforeSession() {
    process.env.BASE_URL = BASE_URL;
  },

  async afterTest(test, context, { error, result, duration, passed }) {
    if (!passed) {
      const stamp = String(test.title).replace(/[^\w-]+/g, '-').slice(0, 60);
      const shotsDir = path.join(REPORTS_DIR, 'screenshots');
      fs.mkdirSync(shotsDir, { recursive: true });
      try {
        await browser.saveScreenshot(path.join(shotsDir, `${stamp}-${Date.now()}.png`));
      } catch (e) {
        console.warn(`No se pudo capturar la pantalla: ${e.message}`);
      }
    }
  },
};

export { REPORTS_DIR, RESULTS_DIR, EVIDENCES_DIR, REPO_ROOT };
