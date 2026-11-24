#!/usr/bin/env bash
# Ejecución "presentable" de una prueba de estrés para grabarla (asciinema) y mostrarla en la sustentación.
# Muestra la configuración, ejecuta run-stress.sh con el resumen de JMeter cada 10 s e intercala el uso de
# recursos de los contenedores, y al final imprime el resumen con el punto de quiebre.
#
# Uso: RUN_NAME=<corrida> tests/performance/stress/scripts/demo-sustentacion.sh <plan> [-Jusers=... ...]
# Grabación: asciinema rec -c "<este comando>" evidences/performance/stress/<corrida>.cast
set -uo pipefail

PLAN="${1:?Indica el plan}"
shift || true
STRESS_DIR="$(cd "$(dirname "$0")/.." && pwd)"
RUN="${RUN_NAME:-$PLAN}"
B=$'\e[1m'; C=$'\e[36m'; Y=$'\e[33m'; G=$'\e[32m'; R=$'\e[0m'

clear
echo "${B}${C}══════════════════════════════════════════════════════════════════════${R}"
echo "${B}  Reto Final Electiva I — Etapa 4: Prueba de estrés (Integrante 2)${R}"
echo "${B}${C}══════════════════════════════════════════════════════════════════════${R}"
echo "  Plan:     ${B}$PLAN.jmx${R}   Corrida: ${B}$RUN${R}"
echo "  Overrides: ${*:-(valores por defecto del plan)}"
echo "  Fecha:    $(date '+%Y-%m-%d %H:%M:%S %Z')"
echo "  Máquina:  $(sysctl -n machdep.cpu.brand_string), $(sysctl -n hw.ncpu) núcleos, $(( $(sysctl -n hw.memsize) / 1073741824 )) GB RAM"
echo "  JMeter:   $(jmeter --version 2>/dev/null | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1)   Heap: -Xms2g -Xmx6g"
echo
echo "${Y}▶ Parámetros del plan${R}"
grep -oE 'Argument.name">[A-Z_]+<|__P\([a-z_]+,[^)]*\)' "$STRESS_DIR/plans/$PLAN.jmx" | paste - - \
  | sed -E 's/Argument.name">([A-Z_]+)<\t__P\(([a-z_]+),([^)]*)\)/    \1 = \3   (-J\2)/'
echo
echo "${Y}▶ Sistema bajo prueba (Docker)${R}"
docker ps --filter name=prestashop-stress --format '    {{.Names}}  {{.Image}}  {{.Status}}'
echo "    Límites: PrestaShop 2 CPU / 2 GB · MySQL 1 CPU / 1 GB"
echo
sleep 3

# Recursos intercalados cada 10 s (lee el CSV que va escribiendo run-stress.sh)
(
  CSV="$STRESS_DIR/reports/$RUN/recursos.csv"
  sleep 15
  while true; do
    if [[ -f "$CSV" ]]; then
      ps_line=$(grep 'prestashop-stress-prestashop' "$CSV" | tail -1 | awk -F, '{printf "PrestaShop CPU %s%% mem %s PIDs %s", $3, $4, $6}')
      my_line=$(grep 'prestashop-stress-mysql' "$CSV" | tail -1 | awk -F, '{printf "MySQL CPU %s%%", $3}')
      [[ -n "$ps_line" ]] && echo "${C}  [recursos $(date +%H:%M:%S)] $ps_line | $my_line${R}"
    fi
    sleep 10
  done
) &
MON=$!
trap 'kill $MON 2>/dev/null' EXIT

RUN_NAME="$RUN" "$STRESS_DIR/scripts/run-stress.sh" "$PLAN" -Jsummariser.interval=10 "$@" \
  | grep --line-buffered -vE '^\| |^## (Por transacción|Evolución)|^\|---|WARNING: package'
kill $MON 2>/dev/null

echo
echo "${G}${B}✔ Prueba terminada. Dashboard: results/performance/stress/$RUN/dashboard/index.html${R}"
sleep 3
