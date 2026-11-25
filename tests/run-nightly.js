#!/usr/bin/env node
/**
 * Orquestador de la corrida nocturna del Integrante 3.
 *
 * Encadena, sin intervención humana y en el orden correcto:
 *   1. Verifica/levanta el entorno (Docker Desktop + PrestaShop local, emulador Android, Appium).
 *   2. Ejecuta las pruebas móviles (smoke del entorno + checkout happy path).
 *   3. Ejecuta la prueba de desempeño de 2 horas.
 *   4. Deja un resumen único en results/integrante-3/resumen-nocturno.md y una bitácora completa.
 *
 * Si un paso falla, se registra y se continúa con el siguiente: las 2 horas son el paso largo,
 * y no tiene sentido perderlas porque el móvil falló. El resultado final dice qué se logró.
 *
 * Uso:
 *   node tests/run-nightly.js
 *   node tests/run-nightly.js --skip-mobile        # solo las 2 h
 *   node tests/run-nightly.js --skip-endurance     # solo el móvil
 *   node tests/run-nightly.js --users=20 --duration=7200
 */
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, '..');
const isWin = process.platform === 'win32';

const argv = process.argv.slice(2);
const has = (f) => argv.includes(`--${f}`);
const getArg = (name, fallback) => {
  const hit = argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.split('=').slice(1).join('=') : fallback;
};

const skipMobile = has('skip-mobile');
const skipEndurance = has('skip-endurance');
const users = getArg('users', '30');
const duration = getArg('duration', '7200');

const LOG_DIR = path.join(REPO, 'results', 'integrante-3');
const NIGHT_LOG = path.join(LOG_DIR, 'bitacora-nocturna.log');
fs.mkdirSync(LOG_DIR, { recursive: true });

const stamp = () => new Date().toISOString().replace('T', ' ').slice(0, 19);
function log(...m) {
  const line = `[${stamp()}] ${m.join(' ')}`;
  console.log(line);
  fs.appendFileSync(NIGHT_LOG, `${line}\n`);
}

const run = (cmd, args, opts = {}) =>
  spawnSync(cmd, args, { encoding: 'utf8', shell: isWin, ...opts });

function runStreaming(label, cmd, args, opts = {}) {
  log(`▶ ${label}: ${cmd} ${args.join(' ')}`);
  const r = spawnSync(cmd, args, { stdio: 'inherit', shell: isWin, ...opts });
  log(`${r.status === 0 ? '✔' : '✖'} ${label} terminó con código ${r.status}`);
  return r.status === 0;
}

const steps = [];

function record(name, ok, detail) {
  steps.push({ name, ok, detail, at: stamp() });
  fs.appendFileSync(NIGHT_LOG, `${ok ? 'OK' : 'FALLO'} :: ${name} :: ${detail}\n`);
}

/** Docker Desktop tarda en exponer el named pipe; se espera en vez de fallar. */
function ensureDocker(timeoutMs = 300000) {
  const probe = () => {
    const r = run('docker', ['version', '--format', '{{.Server.Version}}']);
    return r.status === 0 ? (r.stdout || '').trim() : null;
  };
  if (probe()) return probe();

  log('Docker no responde. Intentando iniciar Docker Desktop...');
  const candidates = isWin
    ? [
        path.join(process.env.LOCALAPPDATA || '', 'Programs', 'DockerDesktop', 'Docker Desktop.exe'),
        'C:\\Program Files\\Docker\\Docker\\Docker Desktop.exe',
      ]
    : ['/Applications/Docker.app'];
  const exe = candidates.find((c) => fs.existsSync(c));
  if (exe) {
    if (isWin) spawnSync('powershell', ['-NoProfile', '-Command', `Start-Process "${exe}"`], { shell: true });
    else spawn('open', ['-a', 'Docker'], { detached: true, stdio: 'ignore' }).unref();
  }

  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const v = probe();
    if (v) return v;
    spawnSync(isWin ? 'powershell' : 'sleep', isWin ? ['-NoProfile', '-Command', 'Start-Sleep -Seconds 10'] : ['10']);
  }
  return null;
}

function waitHttp(url, timeoutMs = 300000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const r = run('curl', ['-s', '-o', isWin ? 'NUL' : '/dev/null', '-w', '%{http_code}', '--max-time', '20', url]);
    if ((r.stdout || '').trim() === '200') return true;
    spawnSync(isWin ? 'powershell' : 'sleep', isWin ? ['-NoProfile', '-Command', 'Start-Sleep -Seconds 5'] : ['5']);
  }
  return false;
}

function mobileEnv() {
  const sdk = process.env.ANDROID_HOME ||
    (isWin ? path.join(os.homedir(), 'AppData', 'Local', 'Android', 'Sdk') : path.join(os.homedir(), 'Library', 'Android', 'sdk'));
  // JAVA_HOME es obligatorio para el emulador y Appium; se toma del entorno o de la
  // instalación por defecto de cada sistema, sin rutas fijas de una máquina concreta.
  const jdk = process.env.JAVA_HOME || '';
  return { ...process.env, ANDROID_HOME: sdk, ANDROID_SDK_ROOT: sdk, ...(jdk ? { JAVA_HOME: jdk } : {}) };
}

async function main() {
  log('==================== CORRIDA NOCTURNA · Integrante 3 ====================');
  log(`Equipo: ${os.hostname()} · ${os.cpus().length} hilos · ${(os.totalmem() / 1024 ** 3).toFixed(1)} GB RAM`);
  log(`Pasos: ${skipMobile ? '' : 'móvil '}${skipEndurance ? '' : 'desempeño 2 h'}`);

  // ---------- 1. Entorno de desempeño
  let shopUrl = null;
  if (!skipEndurance) {
    const dv = ensureDocker();
    if (!dv) {
      record('Docker', false, 'No fue posible iniciar el daemon de Docker.');
    } else {
      record('Docker', true, `daemon ${dv}`);
      const compose = path.join(REPO, 'tests', 'performance', 'stress', 'docker-compose.yml');
      log('Levantando PrestaShop local...');
      const up = runStreaming('PrestaShop local (docker compose up -d)', 'docker',
        ['compose', '-f', compose, 'up', '-d'], { timeout: 0 });
      if (up) {
        const cfg = run('docker', ['compose', '-f', compose, 'port', 'prestashop', '80']).stdout.trim();
        const port = (cfg.split(':').pop() || '8090').trim();
        shopUrl = `http://localhost:${port}/es/`;
        const ready = waitHttp(shopUrl, 600000);
        record('Tienda bajo prueba', ready, ready ? shopUrl : `No respondió en ${shopUrl}`);
        log(`Tienda: ${shopUrl} (${ready ? 'lista' : 'no responde'})`);
      } else {
        record('Tienda bajo prueba', false, 'docker compose up falló.');
      }
    }
  }

  // ---------- 2. Pruebas móviles
  if (!skipMobile) {
    // El emulador y Chrome consumen CPU. Si además corre la prueba de desempeño,
    // conviene lanzar el móvil al terminar para que no se estorben (ver
    // scripts/run-after-endurance.js).
    if (!skipEndurance) {
      log('El móvil se ejecutará cuando termine la prueba de desempeño (evita competir por CPU).');
      runStreaming('Móvil diferido', 'node',
        [path.join(REPO, 'tests', 'mobile', 'scripts', 'run-after-endurance.js'), '--max-wait-min=200'],
        { env: mobileEnv(), timeout: 0 });
    } else {
      const env = mobileEnv();
      const boot = runStreaming('Emulador Android', 'node',
        [path.join(REPO, 'tests', 'mobile', 'scripts', 'start-emulator.js')], { env, timeout: 0 });
      record('Emulador Android', boot, boot ? 'AVD en marcha' : 'No se pudo arrancar el AVD');

      const devId = (run('adb', ['devices'], { env }).stdout || '').split(/\r?\n/).find((l) => l.includes('emulator-'));
      const udid = devId ? devId.split(/\s+/)[0] : '';
      record('Dispositivo ADB', Boolean(udid), udid || 'sin dispositivo');

      if (boot && udid) {
        // El emulador no alcanza de forma fiable el host del PC. Se publica el puerto
        // de la tienda dentro del dispositivo con `adb reverse`.
        let mobileBase = shopUrl || process.env.MOBILE_BASE_URL || 'https://demo.prestashop.com/';
        const shopPort = (mobileBase.match(/:(\d+)\//) || [])[1];
        if (shopPort) {
          const rev = run('adb', ['-s', udid, 'reverse', `tcp:${shopPort}`, `tcp:${shopPort}`]);
          record('Túnel adb reverse', rev.status === 0, `tcp:${shopPort} -> tcp:${shopPort}`);
          mobileBase = `http://localhost:${shopPort}/`;
        }
        log(`BASE_URL para las pruebas móviles: ${mobileBase}`);
        const ok = runStreaming('Pruebas móviles (Appium + WDIO)', isWin ? 'npm.cmd' : 'npm',
          ['test'], {
            cwd: path.join(REPO, 'tests', 'mobile'),
            env: { ...env, UDID: udid, BASE_URL: mobileBase, DEVICE_NAME: 'RetoElectivaI_API34' },
            timeout: 0,
          });
        record('Pruebas móviles', ok, ok ? 'suite ejecutada' : 'la suite falló o quedó incompleta');
      }
    }
  }

  // ---------- 3. Desempeño 2 h
  if (!skipEndurance) {
    // JMeter se localiza por JMETER_HOME/JMETER_BIN o por el PATH (ver run-endurance.js).
    const jmeter = process.env.JMETER_HOME || '';
    const ok = runStreaming('Desempeño 2 horas', 'node',
      [path.join(REPO, 'tests', 'performance', 'endurance', 'scripts', 'run-endurance.js'),
        `-Jusers=${users}`, `-Jduration=${duration}`],
      { env: { ...process.env, ...(jmeter ? { JMETER_HOME: jmeter } : {}) }, timeout: 0 });
    record('Desempeño 2 horas', ok, ok ? `${users} usuarios durante ${duration} s` : 'la corrida falló');
  }

  // ---------- 4. Resumen
  const okCount = steps.filter((s) => s.ok).length;
  const lines = [
    '# Resumen de la corrida nocturna — Integrante 3',
    '',
    `- Inicio: ${fs.existsSync(NIGHT_LOG) ? fs.readFileSync(NIGHT_LOG, 'utf8').split('\n')[0].replace(/^\[|\] /g, '') : stamp()}`,
    `- Fin: ${stamp()}`,
    `- Equipo: ${os.hostname()} · ${os.cpus().length} hilos · ${(os.totalmem() / 1024 ** 3).toFixed(1)} GB RAM`,
    '',
    '| Paso | Resultado | Detalle |',
    '| --- | --- | --- |',
    ...steps.map((s) => `| ${s.name} | ${s.ok ? '✅ OK' : '❌ Falló'} | ${s.detail} |`),
    '',
    `**${okCount}/${steps.length} pasos completados.**`,
    '',
    'Bitácora completa: `results/integrante-3/bitacora-nocturna.log`',
    '',
    'Artefactos esperados:',
    '- `results/mobile/` y `evidences/mobile/` — reporte Allure, capturas y logs de Appium.',
    '- `results/performance/endurance/endurance-01-dos-horas/` — dashboard, `resumen.md`, `recursos.csv`.',
  ];
  fs.writeFileSync(path.join(LOG_DIR, 'resumen-nocturno.md'), lines.join('\n'));
  log(`Resumen escrito en ${path.relative(REPO, path.join(LOG_DIR, 'resumen-nocturno.md'))}`);
  log(`${okCount}/${steps.length} pasos completados.`);
}

main().catch((e) => {
  log('Error inesperado en el orquestador:', e.stack || e.message);
  process.exit(1);
});
