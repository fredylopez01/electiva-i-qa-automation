#!/usr/bin/env node
/**
 * Crea (si no existe) y arranca el AVD usado por las pruebas de Appium.
 *
 * Equivalente a "abrir Genymotion y encender el dispositivo", pero con el emulador
 * del SDK de Android, que no exige cuenta ni licencia y es reproducible en CI.
 *
 * Uso:
 *   node scripts/start-emulator.js                 # crea si falta y arranca
 *   node scripts/start-emulator.js --headless       # sin ventana (para la noche)
 *   node scripts/start-emulator.js --wipe-data      # estado limpio
 *   node scripts/start-emulator.js --avd=Otro --port=5556
 */
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const args = process.argv.slice(2);
const getArg = (name, fallback) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.split('=').slice(1).join('=') : fallback;
};
const has = (name) => args.includes(`--${name}`);

const AVD = getArg('avd', process.env.AVD_NAME || 'RetoElectivaI_API34');
const PORT = getArg('port', process.env.AVD_PORT || '5554');
const API = process.env.AVD_API || '34';
const IMAGE = process.env.AVD_IMAGE || `system-images;android-${API};google_apis;x86_64`;
const headless = has('headless') || process.env.HEADLESS === '1';
const wipe = has('wipe-data');

const isWin = process.platform === 'win32';
const SDK = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT ||
  (isWin ? path.join(os.homedir(), 'AppData', 'Local', 'Android', 'Sdk') : path.join(os.homedir(), 'Library', 'Android', 'sdk'));

const exe = (name) => {
  const candidates = isWin
    ? [path.join(SDK, 'emulator', `${name}.exe`), path.join(SDK, 'cmdline-tools', 'latest', 'bin', `${name}.bat`)]
    : [path.join(SDK, 'emulator', name), path.join(SDK, 'cmdline-tools', 'latest', 'bin', name)];
  const found = candidates.find((c) => fs.existsSync(c));
  if (!found) throw new Error(`No se encontró ${name}. Revisar ANDROID_HOME (${SDK}).`);
  return found;
};

const EMULATOR = exe('emulator');
const ADB = path.join(SDK, 'platform-tools', isWin ? 'adb.exe' : 'adb');
const AVDMANAGER = exe('avdmanager');

const run = (cmd, a, opts = {}) =>
  spawnSync(cmd, a, { encoding: 'utf8', shell: isWin, ...opts });

function listAvds() {
  const r = run(EMULATOR, ['-list-avds']);
  return (r.stdout || '').split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
}

function createAvd() {
  console.log(`No existe el AVD "${AVD}". Creándolo con la imagen ${IMAGE} ...`);
  const installed = run(exe('sdkmanager'), ['--list_installed']);
  if (!(installed.stdout || '').includes(IMAGE)) {
    console.log(`Instalando ${IMAGE} (puede tardar varios minutos)...`);
    const sdkmanager = exe('sdkmanager');
    const r = spawnSync(sdkmanager, ['--install', IMAGE], {
      input: 'y\n'.repeat(20), encoding: 'utf8', shell: isWin, stdio: ['pipe', 'inherit', 'inherit'],
    });
    if (r.status !== 0) console.warn('sdkmanager devolvió un código distinto de cero; se intenta crear el AVD igual.');
  }
  const r = spawnSync(AVDMANAGER, ['create', 'avd', '-n', AVD, '-k', IMAGE, '-d', 'pixel_6', '--force'], {
    input: 'no\n', encoding: 'utf8', shell: isWin, stdio: ['pipe', 'inherit', 'inherit'],
  });
  if (r.status !== 0) throw new Error('No se pudo crear el AVD.');
  console.log(`AVD ${AVD} creado.`);
}

function adb(args) {
  return (run(ADB, args).stdout || '').trim();
}

function deviceReady(serial) {
  const state = adb(['-s', serial, 'get-state']);
  if (state !== 'device') return false;
  const boot = adb(['-s', serial, 'shell', 'getprop', 'sys.boot_completed']);
  return boot === '1';
}

function waitBoot(serial, timeoutMs = 300000) {
  const start = Date.now();
  process.stdout.write('Esperando el arranque del emulador');
  while (Date.now() - start < timeoutMs) {
    if (deviceReady(serial)) {
      console.log(`\nEmulador listo: ${serial}`);
      adb(['-s', serial, 'shell', 'settings', 'put', 'global', 'window_animation_scale', '0']);
      adb(['-s', serial, 'shell', 'settings', 'put', 'global', 'transition_animation_scale', '0']);
      adb(['-s', serial, 'shell', 'settings', 'put', 'global', 'animator_duration_scale', '0']);
      return true;
    }
    process.stdout.write('.');
    spawnSync(isWin ? 'powershell' : 'sleep', isWin ? ['-NoProfile', '-Command', 'Start-Sleep -Seconds 5'] : ['5']);
  }
  console.log('\nTiempo de espera agotado.');
  return false;
}

function main() {
  const serial = `emulator-${PORT}`;
  if (deviceReady(serial)) {
    console.log(`El emulador ya está en marcha: ${serial}`);
    return;
  }
  if (!listAvds().includes(AVD)) createAvd();

  const flags = [
    '-avd', AVD,
    '-port', PORT,
    '-no-snapshot-save',
    '-no-boot-anim',
    '-gpu', process.env.AVD_GPU || 'swiftshader_indirect',
    ...(wipe ? ['-wipe-data'] : []),
    ...(headless ? ['-no-window', '-no-audio'] : []),
  ];
  console.log(`Arrancando ${AVD} en el puerto ${PORT}${headless ? ' (sin ventana)' : ''}...`);
  const child = spawn(EMULATOR, flags, { detached: true, stdio: 'ignore', shell: isWin });
  child.unref();

  if (!waitBoot(serial)) process.exit(1);
  console.log(`Exportar para las pruebas:  AVD_PORT=${PORT} UDID=${serial} DEVICE_NAME=${AVD}`);
}

main();
