#!/usr/bin/env node
/**
 * Levanta Appium, ejecuta WDIO y apaga Appium al terminar.
 *
 * Por qué existe: el servicio `@wdio/appium-service` lanza Appium con `cmd /c`,
 * y como la ruta de este repositorio contiene espacios ("electiva pruebas"), el
 * comando se corta en el primer espacio. Aquí se usa spawn con array de
 * argumentos, sin shell, así que la ruta se respeta.
 *
 * Uso: node scripts/with-appium.js [args de wdio...]
 *   npm test                     -> suite completa (checkout + smoke)
 *   npm test -- --suite smoke    -> solo el smoke
 */
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MOBILE_DIR = path.resolve(__dirname, '..');
const REPORTS = path.join(MOBILE_DIR, 'reports');
fs.mkdirSync(REPORTS, { recursive: true });

const HOST = process.env.APPIUM_HOST || '127.0.0.1';
const PORT = Number(process.env.APPIUM_PORT || 4723);
const wdioArgs = process.argv.slice(2);

const appiumMain = path.join(MOBILE_DIR, 'node_modules', 'appium', 'build', 'lib', 'main.js');
const wdioBin = path.join(MOBILE_DIR, 'node_modules', '@wdio', 'cli', 'bin', 'wdio.js');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Cita un valor para pasarlo a cmd.exe cuando shell:true concatena sin comillas. */
function quoteWin(value) {
  const s = String(value);
  return /[\s"&|<>^]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

async function isUp() {
  try {
    const res = await fetch(`http://${HOST}:${PORT}/status`);
    const body = await res.json();
    return Boolean(body?.value?.ready ?? true);
  } catch {
    return false;
  }
}

async function waitUp(timeoutMs = 180000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await isUp()) return true;
    await sleep(500);
  }
  return false;
}

async function main() {
  let appium = null;

  if (await isUp()) {
    console.log(`Appium ya está escuchando en ${HOST}:${PORT}; se reutiliza.`);
  } else {
    console.log(`Levantando Appium en ${HOST}:${PORT} ...`);
    appium = spawn(process.execPath, [
      appiumMain,
      '--address', HOST,
      '--port', String(PORT),
      '--log', path.join(REPORTS, 'appium.log'),
    ], { cwd: MOBILE_DIR, stdio: ['ignore', 'pipe', 'pipe'] });

    let log = '';
    appium.stdout.on('data', (d) => { log += d; });
    appium.stderr.on('data', (d) => { log += d; });
    appium.on('exit', (code) => {
      if (code !== 0 && code !== null) {
        console.error(`Appium terminó con código ${code}`);
        const tail = log.split(/\r?\n/).slice(-20).join('\n');
        if (tail.trim()) console.error(tail);
      }
    });

    const up = await waitUp();
    if (!up) {
      console.error('Appium no respondió a tiempo. Log:');
      console.error(log.split(/\r?\n/).slice(-30).join('\n'));
      appium.kill();
      process.exit(1);
    }
    console.log('Appium listo.');
  }

  const wdio = spawn(process.execPath, [wdioBin, 'run', 'wdio.conf.js', ...wdioArgs], {
    cwd: MOBILE_DIR,
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'development' },
  });

  const code = await new Promise((resolve) => wdio.on('close', resolve));
  if (appium) {
    appium.kill();
    const { execPath } = process;
    // En Windows kill() no siempre termina el árbol; se refuerza con taskkill.
    if (process.platform === 'win32' && appium.pid) {
      spawnSync('taskkill', ['/PID', String(appium.pid), '/T', '/F'], { stdio: 'ignore' });
    }
  }

  // Publicar los artefactos donde el informe los busca: reporte Allure en results/
  // y evidencias en evidences/. Sin este paso, la corrida deja datos en tests/mobile/
  // (ignorado por Git) y el informe queda sin respaldo.
  const RESULTS = path.join(MOBILE_DIR, '..', '..', 'results', 'mobile');
  const EVIDENCES = path.join(MOBILE_DIR, '..', '..', 'evidences', 'mobile');
  const allureResults = path.join(REPORTS, 'allure-results');

  try {
    fs.mkdirSync(RESULTS, { recursive: true });
    fs.mkdirSync(EVIDENCES, { recursive: true });

    if (fs.existsSync(allureResults) && fs.readdirSync(allureResults).length > 0) {
      console.log('Generando reporte Allure…');
      const allureBin = path.join(MOBILE_DIR, 'node_modules', '.bin', process.platform === 'win32' ? 'allure.cmd' : 'allure');
      if (fs.existsSync(allureBin)) {
        // Sin `shell` y con array de argumentos: las rutas de este repo llevan espacios
        // ("electiva pruebas") y cmd.exe las parte si se concatenan.
        spawnSync(allureBin, ['generate', allureResults, '-o', path.join(RESULTS, 'allure-report'), '--clean'], {
          stdio: 'inherit',
        });
      }
      fs.cpSync(allureResults, path.join(RESULTS, 'allure-results'), { recursive: true });
    }

    const shots = path.join(REPORTS, 'screenshots');
    if (fs.existsSync(shots)) {
      fs.cpSync(shots, path.join(EVIDENCES, 'screenshots'), { recursive: true });
    }
    const appiumLog = path.join(REPORTS, 'appium.log');
    if (fs.existsSync(appiumLog)) {
      fs.copyFileSync(appiumLog, path.join(EVIDENCES, 'appium.log'));
    }
    console.log(`Artefactos copiados a results/mobile/ y evidences/mobile/`);
  } catch (e) {
    console.warn(`No se pudieron copiar los artefactos: ${e.message}`);
  }

  process.exit(code ?? 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
