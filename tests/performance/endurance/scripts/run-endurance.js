#!/usr/bin/env node
/**
 * Ejecuta la prueba de desempeño (2 h) con JMeter y recoge todo lo necesario para el informe.
 *
 * Funciona igual en Windows (donde vive este equipo) y en macOS/Linux (donde trabajan los
 * compañeros), a diferencia de un script .sh. No asume JMeter en el PATH: acepta JMETER_HOME
 * o la variable de entorno JMETER_BIN.
 *
 * Uso:
 *   node tests/performance/endurance/scripts/run-endurance.js
 *   node tests/performance/endurance/scripts/run-endurance.js --users=20 --duration=7200
 *   RUN_NAME=endurance-01-dos-horas-20u node .../run-endurance.js --users=20
 *
 * Salidas:
 *   tests/performance/endurance/reports/<corrida>/        JTL, dashboard, logs, recursos (ignorado por Git)
 *   results/performance/endurance/<corrida>/              dashboard + resumen.md + métricas (versionado)
 *   evidences/performance/endurance/<corrida>-consola.txt salida de consola de JMeter
 *
 * La corrida es reanudable en el sentido de que no borra resultados anteriores: cada RUN_NAME
 * escribe en su propia carpeta. Si se omite RUN_NAME, se usa el nombre del plan.
 */
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ENDURANCE_DIR = path.resolve(__dirname, '..');
const REPO = path.resolve(ENDURANCE_DIR, '..', '..', '..');
const PLAN = 'endurance-01-dos-horas';
const JMX = path.join(ENDURANCE_DIR, 'plans', `${PLAN}.jmx`);
const COMPOSE = path.join(REPO, 'tests', 'performance', 'stress', 'docker-compose.yml');
const BASE_URL = process.env.ENDURANCE_BASE_URL || 'http://localhost:8090/es/';

const RUN = process.env.RUN_NAME || PLAN;
const OUT = path.join(ENDURANCE_DIR, 'reports', RUN);
const RESULTS = path.join(REPO, 'results', 'performance', 'endurance', RUN);
const EVIDENCES = path.join(REPO, 'evidences', 'performance', 'endurance');

const cliArgs = process.argv.slice(2);
// Acepta tanto -Jusers=20 (JMeter) como --users=20 (más legible en la línea de comandos).
const asProp = (a) => {
  const m = a.match(/^--(users|duration|rampup|think_min|think_range)=(.*)$/);
  return m ? `-J${m[1]}=${m[2]}` : null;
};
const jmArgs = cliArgs.map((a) => asProp(a) || a).filter((a) => a.startsWith('-J') || a.startsWith('-G'));
const jmProps = Object.fromEntries(
  jmArgs
    .filter((a) => a.startsWith('-J'))
    .map((a) => {
      const [k, ...v] = a.slice(2).split('=');
      return [k, v.join('=')];
    }),
);
const users = jmProps.users || '30';
const duration = Number(jmProps.duration || 7200);
const rampup = jmProps.rampup || '120';

const log = (...m) => console.log(`[${new Date().toISOString().slice(11, 19)}]`, ...m);

/**
 * Ejecuta un comando.
 *
 * En Windows los .bat y `docker` necesitan shell, pero con `shell: true` Node concatena
 * los argumentos sin comillas, y todas las rutas de este repo llevan espacios
 * ("electiva pruebas"). Por eso se citan explícitamente comando y argumentos.
 */
function quoteWin(value) {
  const s = String(value);
  return /[\s"&|<>^]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

const run = (cmd, args, opts = {}) => {
  if (process.platform === 'win32') {
    return spawnSync(quoteWin(cmd), args.map(quoteWin), {
      encoding: 'utf8', shell: true, ...opts, windowsVerbatimArguments: true,
    });
  }
  return spawnSync(cmd, args, { encoding: 'utf8', ...opts });
};

function findJmeter() {
  if (process.env.JMETER_BIN && fs.existsSync(process.env.JMETER_BIN)) return process.env.JMETER_BIN;
  const home = process.env.JMETER_HOME;
  const isWin = process.platform === 'win32';
  if (home) {
    const candidate = path.join(home, 'bin', isWin ? 'jmeter.bat' : 'jmeter');
    if (fs.existsSync(candidate)) return candidate;
  }
  const candidates = isWin
    ? ['C:\\apache-jmeter\\bin\\jmeter.bat']
    : ['/opt/homebrew/bin/jmeter', '/usr/local/bin/jmeter', '/usr/bin/jmeter'];
  for (const c of candidates) if (fs.existsSync(c)) return c;
  const which = spawnSync(isWin ? 'where' : 'which', ['jmeter'], { encoding: 'utf8' });
  if (which.status === 0 && which.stdout.trim()) return which.stdout.trim().split(/\r?\n/)[0];
  throw new Error(
    'No se encontró JMeter. Instálelo y defina JMETER_HOME (carpeta de instalación) ' +
    'o JMETER_BIN (ruta al ejecutable). Ver tests/performance/endurance/README.md.',
  );
}

const JMETER = findJmeter();
const py = process.platform === 'win32' ? 'python' : 'python3';

function waitForShop(timeoutMs = 240000) {
  log(`Esperando que la tienda responda en ${BASE_URL} ...`);
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const r = run('curl', ['-s', '-o', process.platform === 'win32' ? 'NUL' : '/dev/null',
      '-w', '%{http_code}', '--max-time', '20', BASE_URL]);
    const code = (r.stdout || '').trim();
    if (code === '200') {
      log(`Tienda lista (${code}) tras ${Math.round((Date.now() - started) / 1000)} s.`);
      return true;
    }
    spawnSync(process.platform === 'win32' ? 'powershell' : 'sleep',
      process.platform === 'win32' ? ['-NoProfile', '-Command', 'Start-Sleep -Seconds 5'] : ['5']);
  }
  log('La tienda no respondió a tiempo; la corrida medirá esos fallos.');
  return false;
}

/** Muestrea CPU/memoria de los contenedores del SUT y del proceso de JMeter. */
function startSampler(csvPath) {
  fs.writeFileSync(csvPath, 'timestamp,contenedor,cpu_pct,mem_uso,mem_pct,pids\n');
  const containers = run('docker', ['ps', '--format', '{{.Names}}'])
    .stdout.split(/\r?\n/)
    .filter((n) => n.includes('prestashop') || n.includes('mysql'));

  if (containers.length === 0) {
    log('Aviso: no hay contenedores PrestaShop/MySQL activos; solo se muestreará JMeter.');
  }

  let stopped = false;
  let jmeterPid = null;

  const timer = setInterval(() => {
    if (stopped) return;
    const ts = Math.floor(Date.now() / 1000);
    for (const name of containers) {
      const st = run('docker', ['stats', '--no-stream', '--format',
        '{{.CPUPerc}},{{.MemUsage}},{{.MemPerc}},{{.PIDs}}', name]);
      const line = (st.stdout || '').trim();
      if (line) {
        const cleaned = line.replace(/%/g, '');
        fs.appendFileSync(csvPath, `${ts},${name},${cleaned}\n`);
      }
    }
    if (jmeterPid) {
      const ps = spawnSync(process.platform === 'win32' ? 'powershell' : 'ps',
        process.platform === 'win32'
          ? ['-NoProfile', '-Command',
             `$p=Get-Process -Id ${jmeterPid} -ErrorAction SilentlyContinue; if($p){'{0},{1}' -f [math]::Round($p.CPU,0),[math]::Round($p.WorkingSet64/1MB,0)}`]
          : ['-o', 'rss=', '-p', String(jmeterPid)], { encoding: 'utf8' });
      const raw = (ps.stdout || '').trim();
      if (raw) {
        const parts = raw.split(',');
        const memMib = process.platform === 'win32' ? parts[1] : String(Math.round(Number(raw) / 1024));
        fs.appendFileSync(csvPath, `${ts},jmeter-host,,${memMib}MiB,,\n`);
      }
    }
  }, 15000);

  return {
    setPid: (pid) => { jmeterPid = pid; },
    stop: () => { stopped = true; clearInterval(timer); },
  };
}

async function main() {
  if (!fs.existsSync(JMX)) throw new Error(`No existe el plan: ${JMX}`);

  // Cada corrida debe partir de cero: si se reutiliza el JTL de una corrida anterior,
  // el análisis mezcla muestras de cargas distintas (y reporta huecos y promedios falsos).
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });
  fs.mkdirSync(RESULTS, { recursive: true });
  fs.mkdirSync(EVIDENCES, { recursive: true });

  log(`Corrida: ${RUN} · usuarios=${users} · rampa=${rampup}s · duración=${duration}s (${(duration / 3600).toFixed(2)} h)`);
  log(`JMeter: ${JMETER}`);

  if (process.env.ENDURANCE_SKIP_COMPOSE !== '1' && fs.existsSync(COMPOSE)) {
    log('Reiniciando PrestaShop para partir de un estado limpio...');
    run('docker', ['compose', '-f', COMPOSE, 'restart', 'prestashop'], { stdio: 'inherit' });
  }
  waitForShop();

  const recursos = path.join(OUT, 'recursos.csv');
  const sampler = startSampler(recursos);

  const jtl = path.join(OUT, 'results.jtl');
  const jmeterLog = path.join(OUT, 'jmeter.log');
  const consola = path.join(OUT, 'consola.txt');

  const inicio = new Date().toISOString().replace('T', ' ').slice(0, 19);
  log('Lanzando JMeter en modo no-GUI...');

  const heap = process.env.HEAP || '-Xms2g -Xmx4g -XX:MaxMetaspaceSize=512m';
  const jmeterArgs = [
    '-n', '-t', JMX, '-l', jtl, '-j', jmeterLog,
    '-Jjmeter.save.saveservice.thread_counts=true',
    `-Jusers=${users}`, `-Jduration=${duration}`, `-Jrampup=${rampup}`,
    ...jmArgs,
  ];

  const child = process.platform === 'win32'
    ? spawn(quoteWin(JMETER), jmeterArgs.map(quoteWin), {
        cwd: path.dirname(JMX),
        env: { ...process.env, HEAP: heap },
        shell: true,
        windowsVerbatimArguments: true,
        stdio: ['ignore', 'pipe', 'pipe'],
      })
    : spawn(JMETER, jmeterArgs, {
        cwd: path.dirname(JMX),
        env: { ...process.env, HEAP: heap },
        stdio: ['ignore', 'pipe', 'pipe'],
      });

  const stream = fs.createWriteStream(consola);
  child.stdout.pipe(stream);
  child.stderr.pipe(stream);
  child.stdout.on('data', (d) => process.stdout.write(d));

  if (child.pid) sampler.setPid(child.pid);

  const heartbeat = setInterval(() => {
    const size = fs.existsSync(jtl) ? fs.statSync(jtl).size : 0;
    log(`en curso... JTL ${(size / 1024 / 1024).toFixed(1)} MB`);
  }, 15 * 60 * 1000);

  const exitCode = await new Promise((resolve) => child.on('close', resolve));
  clearInterval(heartbeat);
  sampler.stop();

  const fin = new Date().toISOString().replace('T', ' ').slice(0, 19);
  log(`JMeter terminó con código ${exitCode}.`);

  if (!fs.existsSync(jtl)) {
    log('No se generó el JTL; no hay nada que analizar.');
    process.exit(exitCode || 1);
  }

  log('Generando dashboard HTML...');
  run(JMETER, ['-g', jtl, '-o', path.join(OUT, 'html'), '-j', path.join(OUT, 'jmeter-report.log')],
    { stdio: 'inherit' });

  log('Analizando resultados...');
  const analysis = run(py, ['-I', path.join(ENDURANCE_DIR, 'scripts', 'analyze_endurance.py'),
    jtl, recursos, RUN, inicio, fin, jmArgs.join(' ')]);
  const resumen = analysis.stdout || '';
  fs.writeFileSync(path.join(OUT, 'resumen.md'), resumen);
  console.log(resumen);

  log('Copiando reportes versionables...');
  fs.rmSync(RESULTS, { recursive: true, force: true });
  fs.mkdirSync(RESULTS, { recursive: true });
  if (fs.existsSync(path.join(OUT, 'html'))) {
    fs.cpSync(path.join(OUT, 'html'), path.join(RESULTS, 'dashboard'), { recursive: true });
  }
  for (const f of ['resumen.md', 'recursos.csv']) {
    const src = path.join(OUT, f);
    if (fs.existsSync(src)) fs.copyFileSync(src, path.join(RESULTS, f));
  }

  const { gzipSync } = await import('node:zlib');
  fs.writeFileSync(path.join(RESULTS, 'results.jtl.gz'), gzipSync(fs.readFileSync(jtl)));
  fs.copyFileSync(consola, path.join(EVIDENCES, `${RUN}-consola.txt`));

  log(`Listo. Reporte: ${path.relative(REPO, RESULTS)}`);
}

main().catch((e) => {
  console.error('Error en la corrida:', e.message);
  process.exit(1);
});
