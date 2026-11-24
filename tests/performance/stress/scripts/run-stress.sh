#!/usr/bin/env bash
# Ejecuta una prueba de estrés de JMeter contra el PrestaShop local y recoge evidencias.
#
# Uso (desde la raíz del repo o desde cualquier carpeta):
#   tests/performance/stress/scripts/run-stress.sh stress-01-rampa-incremental [-Jusers=600 ...]
#   tests/performance/stress/scripts/run-stress.sh stress-02-pico-subito
#   RUN_NAME=stress-02-pico-subito-variante-300u tests/performance/stress/scripts/run-stress.sh stress-02-pico-subito -Jusers=300
#
# RUN_NAME (opcional) da un nombre propio a la corrida para no sobrescribir otras del mismo plan.
#
# Salidas:
#   tests/performance/stress/reports/<corrida>/          -> JTL, dashboard HTML, logs (ignorado por Git)
#   results/performance/stress/<corrida>/                -> dashboard HTML, resumen.md, métricas de recursos, JTL comprimido
#   evidences/performance/stress/<corrida>-consola.txt   -> salida de consola de JMeter
# (<corrida> = RUN_NAME o, si no se define, el nombre del plan)
set -euo pipefail

PLAN="${1:?Indica la prueba: stress-01-rampa-incremental | stress-02-pico-subito}"
shift || true
STRESS_DIR="$(cd "$(dirname "$0")/.." && pwd)"
REPO="$(cd "$STRESS_DIR/../../.." && pwd)"
JMX="$STRESS_DIR/plans/$PLAN.jmx"
[[ -f "$JMX" ]] || { echo "No existe $JMX" >&2; exit 1; }
RUN="${RUN_NAME:-$PLAN}"

OUT="$STRESS_DIR/reports/$RUN"
RESULTS="$REPO/results/performance/stress/$RUN"
EVID="$REPO/evidences/performance/stress"
COMPOSE="$STRESS_DIR/docker-compose.yml"
BASE_URL="${STRESS_BASE_URL:-http://localhost:8090/es/}"

rm -rf "$OUT" && mkdir -p "$OUT" "$RESULTS" "$EVID"

# Máximos recursos posibles para el generador de carga (JMeter): 6 GB de heap de 16 GB del equipo.
export HEAP="${HEAP:--Xms2g -Xmx6g -XX:MaxMetaspaceSize=512m}"

echo "== Reiniciando PrestaShop para partir de un estado limpio"
docker compose -f "$COMPOSE" restart prestashop >/dev/null
for i in $(seq 1 60); do
  code=$(curl -s -o /dev/null -w '%{http_code}' "$BASE_URL" || true)
  [[ "$code" == "200" ]] && break
  sleep 2
done
echo "   PrestaShop responde $code en $BASE_URL"

echo "== Muestreando recursos (contenedores + JMeter) cada 2 s -> $OUT/recursos.csv"
echo "timestamp,contenedor,cpu_pct,mem_uso,mem_pct,pids" > "$OUT/recursos.csv"
(
  while true; do
    ts=$(date +%s)
    docker stats --no-stream --format '{{.Name}},{{.CPUPerc}},{{.MemUsage}},{{.MemPerc}},{{.PIDs}}' \
      prestashop-stress-prestashop-1 prestashop-stress-mysql-1 2>/dev/null \
      | sed "s/^/$ts,/" | tr -d '%' >> "$OUT/recursos.csv" || true
    jpid=$(pgrep -f "ApacheJMeter.jar.*$PLAN" | head -1 || true)
    if [[ -n "$jpid" ]]; then
      ps -o %cpu=,rss= -p "$jpid" | awk -v ts="$ts" '{printf "%s,jmeter-host,%s,%.0fMiB,,\n", ts, $1, $2/1024}' >> "$OUT/recursos.csv"
    fi
    sleep 2
  done
) &
SAMPLER_PID=$!
trap 'kill $SAMPLER_PID 2>/dev/null || true' EXIT

echo "== Ejecutando JMeter: $PLAN (corrida $RUN) $*"
START=$(date '+%Y-%m-%d %H:%M:%S %z')
set +e
( cd "$STRESS_DIR/plans" && jmeter -n -t "$JMX" -l "$OUT/results.jtl" -j "$OUT/jmeter.log" \
    -Jjmeter.save.saveservice.thread_counts=true "$@" ) 2>&1 | tee "$OUT/consola.txt"
JM_EXIT=${PIPESTATUS[0]}
set -e
END=$(date '+%Y-%m-%d %H:%M:%S %z')
kill $SAMPLER_PID 2>/dev/null || true

echo "== Estado de los contenedores tras la prueba"
docker ps -a --filter name=prestashop-stress --format '{{.Names}} {{.Status}}' | tee "$OUT/contenedores-post.txt"
docker inspect -f '{{.Name}} OOMKilled={{.State.OOMKilled}} RestartCount={{.RestartCount}}' \
  prestashop-stress-prestashop-1 prestashop-stress-mysql-1 | tee -a "$OUT/contenedores-post.txt"
docker logs --since "$(date -j -f '%Y-%m-%d %H:%M:%S %z' "$START" +%s 2>/dev/null || echo 30m)" prestashop-stress-prestashop-1 2>&1 \
  | grep -viE '" (200|302) ' | tail -200 > "$OUT/prestashop-errores.txt" || true

echo "== Generando dashboard HTML de JMeter"
jmeter -g "$OUT/results.jtl" -o "$OUT/html" -j "$OUT/jmeter-report.log" >/dev/null

echo "== Analizando resultados"
python3 -I "$STRESS_DIR/scripts/analyze_jtl.py" "$OUT/results.jtl" "$OUT/recursos.csv" "$RUN" "$START" "$END" "$*" > "$OUT/resumen.md"
cat "$OUT/resumen.md"

echo "== Copiando reportes versionables"
rm -rf "$RESULTS" && mkdir -p "$RESULTS"
cp -R "$OUT/html" "$RESULTS/dashboard"
cp "$OUT/resumen.md" "$OUT/recursos.csv" "$OUT/contenedores-post.txt" "$OUT/prestashop-errores.txt" "$RESULTS/"
gzip -c "$OUT/results.jtl" > "$RESULTS/results.jtl.gz"
cp "$OUT/consola.txt" "$EVID/$RUN-consola.txt"
echo "Listo: $RESULTS (JMeter exit $JM_EXIT)"
