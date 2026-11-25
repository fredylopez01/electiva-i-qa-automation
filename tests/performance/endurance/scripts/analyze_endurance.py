#!/usr/bin/env python3
"""Analiza un JTL de una prueba de desempeño prolongada y genera resumen.md.

Uso:
    analyze_endurance.py <results.jtl> <recursos.csv> <nombre> <inicio> <fin> "<args JMeter>"

Qué calcula, y por qué:
  * Serie temporal por ventana (5 min por defecto) de usuarios, throughput, % error,
    promedio y percentiles. Es la vista que revela degradación progresiva.
  * Comparación primera hora vs. última hora: si el sistema se degrada con el tiempo,
    el p95 sube y/o el throughput baja aunque la carga sea idéntica.
  * Tendencia (regresión lineal) del p95 y del throughput sobre las ventanas: la
    pendiente distingue una meseta estable de una fuga lenta.
  * Memoria de los contenedores: crecimiento sostenido = posible fuga.
  * Punto de quiebre: primera ventana con error > 5 % o p95 > 5 s.
  * Estabilidad de la muestra: huecos donde JMeter dejó de registrar (sistema caído).
"""
import csv
import collections
import os
import statistics
import sys

# En Windows la consola usa cp1252 y el resumen incluye ≥, → y acentos.
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

BUCKET_S = 300           # 5 minutos: suficiente resolución para 2 h y pocas filas
ERR_THRESHOLD = 5.0
P95_THRESHOLD_MS = 5000


def pct(values, p):
    if not values:
        return 0
    values = sorted(values)
    k = max(0, min(len(values) - 1, int(round(p / 100 * len(values) + 0.5)) - 1))
    return values[k]


def parse_mem_mib(text):
    """'1.2GiB / 2GiB' -> 1228.8 ; '850MiB' -> 850."""
    if not text:
        return None
    used = text.split('/')[0].strip()
    for unit, factor in (('GiB', 1024), ('MiB', 1), ('KiB', 1 / 1024), ('B', 1 / 1024 / 1024)):
        if used.endswith(unit):
            try:
                return float(used[: -len(unit)]) * factor
            except ValueError:
                return None
    return None


def slope(points):
    """Pendiente por ventana de una regresión lineal simple (x = índice)."""
    n = len(points)
    if n < 2:
        return 0.0
    xs = list(range(n))
    mx = statistics.mean(xs)
    my = statistics.mean(points)
    denom = sum((x - mx) ** 2 for x in xs)
    if denom == 0:
        return 0.0
    return sum((x - mx) * (y - my) for x, y in zip(xs, points)) / denom


def read_jmeter_start(jtl_path):
    """Hora de inicio real de la corrida, leída de jmeter.log.

    JMeter AÑADE muestras al JTL cuando el archivo ya existe, así que una corrida
    posterior puede arrastrar datos de una prueba anterior. El log deja la línea
    "Starting standalone test @ ..." con la hora exacta de arranque; todo lo anterior
    a esa marca se descarta para que el informe describa solo la corrida analizada.
    """
    import datetime
    import re

    log_path = os.path.join(os.path.dirname(jtl_path), 'jmeter.log')
    if not os.path.exists(log_path):
        return None

    # El log de JMeter 5.6 no incluye la línea "Starting standalone test"; la primera
    # marca fiable del arranque del plan es la creación del ThreadGroup.
    pattern = re.compile(
        r'^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2}),\d+ .*(?:Starting ThreadGroup|Starting standalone test)')
    months = {m: i for i, m in enumerate(
        ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
         'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'], start=1)}

    with open(log_path, encoding='utf-8', errors='replace') as fh:
        found = None
        for line in fh:
            hit = pattern.search(line)
            if hit:
                y, mo, d, hh, mm, ss = hit.groups()
                found = datetime.datetime(int(y), int(mo), int(d), int(hh), int(mm), int(ss))
        # Se usa el ÚLTIMO arranque: si el log acumuló corridas, la vigente es la última.
        return int(found.timestamp() * 1000) if found else None


def main():
    if len(sys.argv) < 6:
        print(__doc__)
        return 1
    jtl, recursos, prueba, inicio, fin = sys.argv[1:6]
    jargs = sys.argv[6] if len(sys.argv) > 6 else ''

    rows = list(csv.DictReader(open(jtl, encoding='utf-8')))

    # Descartar muestras anteriores al arranque de esta corrida (ver read_jmeter_start).
    start_ms = read_jmeter_start(jtl)
    discarded = 0
    if start_ms:
        before = len(rows)
        rows = [r for r in rows if int(r['timeStamp']) >= start_ms]
        discarded = before - len(rows)

    if not rows:
        print('Sin muestras de esta corrida en el JTL')
        return 1

    t0 = min(int(r['timeStamp']) for r in rows)
    t_end = max(int(r['timeStamp']) + int(r['elapsed']) for r in rows)
    dur_s = max(1, (t_end - t0) / 1000)

    def summary(rs):
        el = [int(r['elapsed']) for r in rs]
        errs = sum(r['success'] != 'true' for r in rs)
        return {
            'n': len(rs),
            'err': errs,
            'err_pct': 100 * errs / len(rs),
            'avg': statistics.mean(el),
            'p50': pct(el, 50),
            'p90': pct(el, 90),
            'p95': pct(el, 95),
            'p99': pct(el, 99),
            'max': max(el),
        }

    # ---------- recursos
    res = collections.defaultdict(lambda: collections.defaultdict(list))
    res_max = collections.defaultdict(lambda: {'cpu': 0.0, 'mem': 0.0, 'mem_pct': 0.0, 'pids': 0})
    first_mem, last_mem = {}, {}
    try:
        for r in csv.DictReader(open(recursos, encoding='utf-8')):
            try:
                ts = int(r['timestamp']) * 1000
            except (ValueError, TypeError):
                continue
            name = r['contenedor'].replace('prestashop-stress-', '').replace('-1', '')
            mem = parse_mem_mib(r.get('mem_uso') or '')
            if mem:
                first_mem.setdefault(name, mem)
                last_mem[name] = mem
            b = (ts - t0) // (BUCKET_S * 1000)
            if b < 0:
                continue
            cpu = float(r['cpu_pct'] or 0)
            res[b][name + '_cpu'].append(cpu)
            if mem:
                res[b][name + '_mem'].append(mem)
            m = res_max[name]
            m['cpu'] = max(m['cpu'], cpu)
            if mem:
                m['mem'] = max(m['mem'], mem)
            if r.get('mem_pct'):
                m['mem_pct'] = max(m['mem_pct'], float(r['mem_pct']))
            if r.get('pids'):
                m['pids'] = max(m['pids'], int(float(r['pids'])))
    except FileNotFoundError:
        pass

    out = []
    w = out.append
    g = summary(rows)
    max_threads = max(int(r.get('allThreads') or 0) for r in rows)

    w(f'# Resumen de desempeño — {prueba}\n')
    w(f'- Inicio: {inicio}  ·  Fin: {fin}  ·  Duración medida: **{dur_s/3600:.2f} h** ({dur_s/60:.0f} min)')
    w(f'- Parámetros JMeter adicionales: `{jargs or "(valores por defecto del plan)"}`')
    w(f'- Usuarios concurrentes máximos: **{max_threads}**')
    if discarded:
        w(f'- Muestras descartadas por ser de una corrida anterior: **{discarded:,}** '
          '(JMeter añade al JTL en vez de sobrescribirlo).')
    w(f'- Muestras: **{g["n"]:,}** · Errores: **{g["err"]:,} ({g["err_pct"]:.2f} %)** · '
      f'Throughput medio: **{g["n"]/dur_s:.1f} req/s**')
    w(f'- Tiempo de respuesta global: promedio {g["avg"]:.0f} ms · p50 {g["p50"]} · p90 {g["p90"]} · '
      f'p95 {g["p95"]} · p99 {g["p99"]} · máx {g["max"]} ms\n')

    # ---------- ventanas
    buckets = collections.defaultdict(list)
    for r in rows:
        buckets[(int(r['timeStamp']) - t0) // (BUCKET_S * 1000)].append(r)
    order = sorted(buckets)

    w(f'## Serie temporal (ventanas de {BUCKET_S // 60} min)\n')
    w('| Hora | Usuarios | req/s | % error | Prom. (ms) | p95 (ms) | p99 (ms) | CPU SUT % | Mem SUT MiB | CPU MySQL % |')
    w('|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|')
    timeline = []
    for b in order:
        rs = buckets[b]
        s = summary(rs)
        users = max(int(r.get('allThreads') or 0) for r in rs)
        rb = res.get(b, {})

        def avg(key):
            v = rb.get(key, [])
            return f'{statistics.mean(v):.0f}' if v else '–'

        req_s = len(rs) / BUCKET_S
        label = f'{b * BUCKET_S / 3600:.2f} h'
        timeline.append({'min': b * BUCKET_S / 60, 'users': users, 'req_s': req_s, 's': s})
        w(f'| {label} | {users} | {req_s:.1f} | {s["err_pct"]:.1f} | {s["avg"]:.0f} | {s["p95"]} | '
          f'{s["p99"]} | {avg("prestashop_cpu")} | {avg("prestashop_mem")} | {avg("mysql_cpu")} |')

    # ---------- huecos
    # El último bucket suele estar incompleto porque la corrida termina a mitad de
    # ventana; se cuenta solo hasta el último bucket con muestras.
    expected = max(buckets) + 1 if buckets else 0
    missing = [b for b in range(expected) if b not in buckets]
    w('\n## Continuidad de la corrida\n')
    if missing:
        w(f'- **{len(missing)} ventana(s) sin muestras** de {expected} esperadas '
          f'(primeras: {", ".join(str(m) for m in missing[:8])}{"…" if len(missing) > 8 else ""}). '
          'Una ventana vacía indica que la tienda dejó de responder o que JMeter se detuvo.')
    else:
        w(f'- Sin huecos: las {expected} ventanas esperadas tienen muestras. La prueba se sostuvo completa.')

    # ---------- tendencia
    w('\n## Deriva temporal (¿se degrada con el tiempo?)\n')
    if len(timeline) >= 4:
        p95s = [t['s']['p95'] for t in timeline]
        rps = [t['req_s'] for t in timeline]
        p95_slope = slope(p95s)
        rps_slope = slope(rps)

        # Mitades con la misma carga: solo comparables si el nº de usuarios es estable.
        mid = len(timeline) // 2
        first, last = timeline[:mid], timeline[mid:]
        f_p95 = statistics.median([t['s']['p95'] for t in first])
        l_p95 = statistics.median([t['s']['p95'] for t in last])
        f_rps = statistics.median([t['req_s'] for t in first])
        l_rps = statistics.median([t['req_s'] for t in last])
        f_err = statistics.mean([t['s']['err_pct'] for t in first])
        l_err = statistics.mean([t['s']['err_pct'] for t in last])
        f_users = statistics.median([t['users'] for t in first])
        l_users = statistics.median([t['users'] for t in last])

        w(f'- Usuarios concurrentes: mediana {f_users:.0f} en la primera mitad vs. {l_users:.0f} en la segunda.')
        w(f'- **p95**: {f_p95:.0f} ms → {l_p95:.0f} ms '
          f'({"+ " if l_p95 >= f_p95 else ""}{(l_p95 - f_p95) / max(1, f_p95) * 100:.1f} %). '
          f'Pendiente: {p95_slope:+.1f} ms por ventana de {BUCKET_S // 60} min.')
        w(f'- **Throughput**: {f_rps:.1f} → {l_rps:.1f} req/s '
          f'({(l_rps - f_rps) / max(0.01, f_rps) * 100:+.1f} %). '
          f'Pendiente: {rps_slope:+.3f} req/s por ventana.')
        w(f'- **% error**: {f_err:.2f} % → {l_err:.2f} %.')

        # La comparación por mitades es la que decide: una pendiente calculada sobre
        # todas las ventanas se deja arrastrar por un pico puntual (por ejemplo, otra
        # prueba corriendo en la misma máquina), aunque el resto sea plano.
        delta_p95 = (l_p95 - f_p95) / max(1, f_p95) * 100
        delta_rps = (l_rps - f_rps) / max(0.01, f_rps) * 100

        estable = abs(delta_p95) < 25 and abs(delta_rps) < 15 and l_err < ERR_THRESHOLD
        if estable:
            w('\n> **Veredicto: comportamiento estable.** El p95 y el throughput de la segunda mitad son '
              'comparables a los de la primera, y el error se mantiene por debajo del umbral: la carga '
              'constante no produjo degradación.')
        else:
            w('\n> **Veredicto: hay degradación progresiva.** El p95 subió o el throughput cayó entre la '
              'primera y la segunda mitad con la misma carga, así que el cambio se atribuye al sistema.')
    else:
        w('- La corrida fue demasiado corta para analizar tendencia (se necesitan ≥ 4 ventanas).')

    # ---------- quiebre
    degradation = next((t for t in timeline if t['s']['p95'] > P95_THRESHOLD_MS), None)
    breakpoint_ = next((t for t in timeline if t['s']['err_pct'] > ERR_THRESHOLD), None)
    w('\n## Degradación y quiebre\n')
    if degradation:
        w(f'- **Degradación** (p95 > {P95_THRESHOLD_MS} ms por primera vez): minuto '
          f'**{degradation["min"]:.0f}**, con ~{degradation["users"]} usuarios (p95 {degradation["s"]["p95"]} ms).')
    else:
        w(f'- **Degradación**: ninguna ventana superó p95 de {P95_THRESHOLD_MS} ms en toda la corrida.')
    if breakpoint_:
        w(f'- **Quiebre** (error > {ERR_THRESHOLD:.0f} % por primera vez): minuto '
          f'**{breakpoint_["min"]:.0f}**, con ~{breakpoint_["users"]} usuarios ({breakpoint_["s"]["err_pct"]:.1f} % de error).')
    else:
        w(f'- **Quiebre**: ninguna ventana superó {ERR_THRESHOLD:.0f} % de error en toda la corrida.')

    # ---------- memoria
    w('\n## Recursos\n')
    if res_max:
        w('| Proceso | CPU máx. % | Memoria máx. MiB | Mem. máx. % del límite | PIDs máx. |')
        w('|---|---:|---:|---:|---:|')
        for name, m in sorted(res_max.items()):
            w(f'| {name} | {m["cpu"]:.0f} | {m["mem"]:.0f} | {m["mem_pct"]:.1f} | {m["pids"] or "–"} |')

        w('')
        for name in sorted(first_mem):
            delta = last_mem.get(name, 0) - first_mem[name]
            if first_mem[name] > 0:
                growth_pct = delta / first_mem[name] * 100
                aviso = ' ⚠️ **posible fuga**' if growth_pct > 25 else ''
                w(f'- Memoria de `{name}`: {first_mem[name]:.0f} MiB al inicio → '
                  f'{last_mem[name]:.0f} MiB al final ({growth_pct:+.1f} %).{aviso}')

        w('\n> CPU % de los contenedores es relativo a 1 núcleo (PrestaShop 2 CPU = 200 %, MySQL 1 CPU = 100 %). '
          'CPU % de JMeter es el del proceso java en el host (12 hilos = 1200 %).')
    else:
        w('- No se registraron métricas de recursos.')

    # ---------- por transacción
    w('\n## Por transacción\n')
    w('| Transacción | Muestras | % error | Prom. (ms) | p95 | Máx. |')
    w('|---|---:|---:|---:|---:|---:|')
    by_label = collections.defaultdict(list)
    for r in rows:
        by_label[r['label']].append(r)
    for label in sorted(by_label):
        s = summary(by_label[label])
        w(f'| {label} | {s["n"]:,} | {s["err_pct"]:.2f} | {s["avg"]:.0f} | {s["p95"]} | {s["max"]} |')

    # ---------- errores
    def error_key(r):
        code = r['responseCode']
        if code.isdigit():
            detail = r['failureMessage'] or r['responseMessage'] or ''
        else:
            code, detail = 'Sin respuesta HTTP', code.replace('Non HTTP response code: ', '')
        return f'{code} — {" ".join(detail.split())[:110]}'

    errors = collections.Counter(error_key(r) for r in rows if r['success'] != 'true')
    if errors:
        w('\n## Errores más frecuentes\n')
        w('| Código — mensaje | Cantidad |')
        w('|---|---:|')
        for msg, n in errors.most_common(10):
            w(f'| {msg.replace("|", "/")} | {n:,} |')
    else:
        w('\n## Errores\n\nSin errores registrados en toda la corrida.')

    print('\n'.join(out))
    return 0


if __name__ == '__main__':
    sys.exit(main())
