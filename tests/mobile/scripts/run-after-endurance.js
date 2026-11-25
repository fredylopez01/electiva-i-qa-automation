#!/usr/bin/env node
/**
 * Deja lista la corrida móvil para cuando termine la prueba de desempeño.
 *
 * Por qué: el emulador y Chrome para Android consumen CPU. Ejecutar Appium mientras
 * JMeter sostiene 30 usuarios provoca timeouts que no son defectos de la suite.
 * Este script espera a que el proceso de endurance termine y solo entonces lanza
 * las pruebas móviles, de modo que la corrida nocturna no se estorbe a sí misma.
 *
 * Uso: node tests/mobile/scripts/run-after-endurance.js [--max-wait-min=240]
 */
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MOBILE = path.resolve(__dirname, '..');
const REPO = path.resolve(MOBILE, '..', '..');
const LOG_DIR = path.join(REPO, 'results', 'integrante-3');
fs.mkdirSync(LOG_DIR, { recursive: true });

const LOG = path.join(LOG_DIR, 'mobile-despues-de-endurance.log');
const maxWaitArg = process.argv.find((a) => a.startsWith('--max-wait-min='));
const MAX_WAIT_MIN = Number(maxWaitArg ? maxWaitArg.split('=')[1] : 240);

const log = (...m) => {
  const line = `[${new Date().toISOString().slice(11, 19)}] ${m.join(' ')}`;
  console.log(line);
  fs.appendFileSync(LOG, `${line}\n`);
};

const isWin = process.platform === 'win32';
const run = (cmd, args, opts = {}) => spawnSync(cmd, args, { encoding: 'utf8', shell: isWin, ...opts });

/** ¿Sigue corriendo la prueba de desempeño? */
function enduranceRunning() {
  if (isWin) {
    // Se escribe la consulta en un .ps1 temporal: pasar el filtro con comillas por
    // la línea de comandos de cmd.exe rompe el parseo en Windows.
    const scriptPath = path.join(LOG_DIR, '.check-endurance.ps1');
    fs.writeFileSync(scriptPath, [
      "$p = Get-CimInstance Win32_Process -Filter \"Name='node.exe'\" |",
      "  Where-Object { $_.CommandLine -like '*run-endurance.js*' }",
      "if ($p) { 'yes' } else { 'no' }",
    ].join('\n'), 'utf8');
    const r = spawnSync('powershell', ['-NoProfile', '-NonInteractive', '-File', scriptPath], { encoding: 'utf8' });
    return (r.stdout || '').trim() === 'yes';
  }
  const r = spawnSync('pgrep', ['-f', 'run-endurance.js'], { encoding: 'utf8' });
  return r.status === 0;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const startedAt = Date.now();
const elapsedMs = () => Date.now() - startedAt;

async function waitForEndurance() {
  const limit = MAX_WAIT_MIN * 60 * 1000;
  let announced = false;
  while (elapsedMs() < limit) {
    if (!enduranceRunning()) {
      log('La prueba de desempeño terminó; se inicia la corrida móvil.');
      return true;
    }
    if (!announced) {
      log('Esperando a que termine la prueba de desempeño para no competir por CPU…');
      announced = true;
    }
    await sleep(60000);
  }
  log(`Se agotó la espera de ${MAX_WAIT_MIN} min; se ejecuta la corrida móvil igualmente.`);
  return false;
}

async function main() {
  log('==================== MÓVIL DIFERIDO ====================');
  await waitForEndurance();

  // Asegurar que el emulador y la tienda estén disponibles.
  const docker = run('docker', ['ps', '--format', '{{.Names}}']);
  const shopUp = (docker.stdout || '').includes('prestashop');
  log(`PrestaShop en Docker: ${shopUp ? 'arriba' : 'NO detectado'}`);

  const adb = path.join(process.env.ANDROID_HOME || path.join(process.env.LOCALAPPDATA || '', 'Android', 'Sdk'), 'platform-tools', isWin ? 'adb.exe' : 'adb');
  const devices = run(adb, ['devices']).stdout || '';
  const emulator = (devices.split(/\r?\n/).find((l) => l.includes('emulator-'))) || '';
  if (!emulator) {
    log('No hay emulador en línea; se arranca uno.');
    run('node', [path.join(MOBILE, 'scripts', 'start-emulator.js')], { stdio: 'inherit' });
  }
  const udid = ((run(adb, ['devices']).stdout || '').split(/\r?\n/).find((l) => l.includes('emulator-')) || '').split(/\s+/)[0];
  log(`Dispositivo: ${udid || 'no encontrado'}`);

  if (udid) {
    // Publicar el puerto de la tienda dentro del emulador.
    run(adb, ['-s', udid, 'reverse', 'tcp:8090', 'tcp:8090']);
  }

  const env = {
    ...process.env,
    BASE_URL: process.env.MOBILE_BASE_URL || 'http://localhost:8090/',
    UDID: udid,
    DEVICE_NAME: 'RetoElectivaI_API34',
    NODE_ENV: 'development',
  };

  log('Ejecutando la suite móvil completa…');
  const child = spawn(process.execPath, [path.join(MOBILE, 'scripts', 'with-appium.js')], {
    cwd: MOBILE, env, stdio: ['ignore', 'pipe', 'pipe'],
  });
  let out = '';
  child.stdout.on('data', (d) => { out += d; process.stdout.write(d); });
  child.stderr.on('data', (d) => { out += d; process.stderr.write(d); });

  const code = await new Promise((resolve) => child.on('close', resolve));
  fs.writeFileSync(path.join(LOG_DIR, 'mobile-salida-completa.txt'), out);
  log(`Suite móvil terminó con código ${code}. Salida completa en results/integrante-3/mobile-salida-completa.txt`);
}

main().catch((e) => {
  log('Error:', e.message);
  process.exit(1);
});
