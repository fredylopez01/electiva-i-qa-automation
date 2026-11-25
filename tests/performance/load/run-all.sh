#!/usr/bin/env bash
# Ejecuta las tres pruebas de carga (10, 20 y 50 usuarios) en secuencia.
# Debe ejecutarse desde la raíz del repositorio.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
cd "$ROOT"

for users in 10 20 50; do
  echo "==> Prueba de carga con ${users} usuarios"
  report_dir="results/performance/load-${users}"
  mkdir -p "$report_dir"
  rm -rf "${report_dir}/html"

  jmeter -n \
    -t "tests/performance/load/plans/load-${users}-users.jmx" \
    -l "${report_dir}/results.jtl" \
    -e -o "${report_dir}/html"
done

echo "Reportes generados en results/performance/"
