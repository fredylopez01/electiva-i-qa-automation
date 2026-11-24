#!/usr/bin/env node
/**
 * Ejecuta la colección con Newman generando todos los reportes de la Etapa 3.
 *
 *   tests/api/reports/            -> salida local de Newman (ignorada por Git)
 *   results/api/                  -> copia versionada de los reportes (HTML, JUnit XML, JSON)
 *   evidences/api/                -> salida de consola (CLI) de la ejecución
 *
 * Uso: npm run test:report   (desde tests/api)
 */
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const API_DIR = path.resolve(__dirname, '..');
const REPO = path.resolve(API_DIR, '..', '..');
const REPORTS = path.join(API_DIR, 'reports');
const RESULTS = path.join(REPO, 'results', 'api');
const EVIDENCES = path.join(REPO, 'evidences', 'api');
[REPORTS, RESULTS, EVIDENCES].forEach((d) => fs.mkdirSync(d, { recursive: true }));

const files = {
  html: 'newman-report.html',
  junit: 'newman-junit.xml',
  json: 'newman-summary.json',
};

const args = [
  'run', 'collections/reto-final-api.postman_collection.json',
  '-e', 'environments/public-apis.postman_environment.json',
  '-d', 'data/iterations.json',
  '-r', 'cli,htmlextra,junit,json',
  '--reporter-htmlextra-export', path.join(REPORTS, files.html),
  '--reporter-htmlextra-title', 'Reto Final Electiva I - API Testing (Integrante 2)',
  '--reporter-htmlextra-browserTitle', 'Newman - Reto Final Electiva I',
  '--reporter-junit-export', path.join(REPORTS, files.junit),
  '--reporter-json-export', path.join(REPORTS, files.json),
  '--color', 'on',
];

const newmanBin = path.join(API_DIR, 'node_modules', '.bin', 'newman');
const child = spawn(newmanBin, args, { cwd: API_DIR });
let output = '';
const capture = (stream) => (chunk) => { output += chunk; stream.write(chunk); };
child.stdout.on('data', capture(process.stdout));
child.stderr.on('data', capture(process.stderr));

child.on('close', (code) => {
  const stamp = new Date().toISOString();
  // eslint-disable-next-line no-control-regex
  const plain = output.replace(/\x1b\[[0-9;]*m/g, '');
  fs.writeFileSync(
    path.join(EVIDENCES, 'newman-cli-output.txt'),
    `# Ejecución Newman — ${stamp}\n# Comando: newman ${args.join(' ')}\n# Código de salida: ${code}\n\n${plain}`,
  );
  Object.values(files).forEach((f) => {
    const src = path.join(REPORTS, f);
    if (fs.existsSync(src)) fs.copyFileSync(src, path.join(RESULTS, f));
  });
  console.log(`\nReportes copiados a ${path.relative(REPO, RESULTS)}/ y salida CLI en ${path.relative(REPO, EVIDENCES)}/newman-cli-output.txt`);
  process.exit(code);
});
