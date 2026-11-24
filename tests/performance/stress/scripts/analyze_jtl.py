#!/usr/bin/env python3
"""Resume un JTL de JMeter (CSV) en Markdown para el informe de estrés.

Uso: analyze_jtl.py results.jtl recursos.csv <prueba> <inicio> <fin> "<args JMeter>"

- Tabla general y por transacción (muestras, % error, promedio, p90, p95, p99, máx, throughput).
- Evolución en ventanas de 30 s con los usuarios activos y el uso de CPU/memoria de los contenedores.
- Punto de quiebre: primera ventana con error > 5 % o p95 > 5 s.
- Tipos de error más frecuentes.
"""
import csv
import collections
import statistics
import sys

BUCKET_S = 30
ERR_THRESHOLD = 5.0      # % de error que se considera quiebre
P95_THRESHOLD_MS = 5000  # p95 que se considera quiebre


def pct(values, p):
    if not values:
        return 0
    values = sorted(values)
    k = max(0, min(len(values) - 1, int(round(p / 100 * len(values) + 0.5)) - 1))
    return values[k]


def parse_mem_mib(text):
    """'1.2GiB / 2GiB' -> 1228.8 ; '850MiB' -> 850."""
    used = text.split('/')[0].strip()
    for unit, factor in (('GiB', 1024), ('MiB', 1), ('KiB', 1 / 1024), ('B', 1 / 1024 / 1024)):
        if used.endswith(unit):
            try:
                return float(used[: -len(unit)]) * factor
            except ValueError:
                return None
    return None


def main():
    jtl, recursos, prueba, inicio, fin, jargs = sys.argv[1:7]
    rows = list(csv.DictReader(open(jtl, encoding='utf-8')))
    if not rows:
        print('Sin muestras en el JTL')
        return
    t0 = min(int(r['timeStamp']) for r in rows)
    t_end = max(int(r['timeStamp']) + int(r['elapsed']) for r in rows)
    dur_s = max(1, (t_end - t0) / 1000)

    def summary(rs):
        el = [int(r['elapsed']) for r in rs]
        errs = sum(r['success'] != 'true' for r in rs)
        return {
            'n': len(rs), 'err': errs, 'err_pct': 100 * errs / len(rs), 'avg': statistics.mean(el),
            'p90': pct(el, 90), 'p95': pct(el, 95), 'p99': pct(el, 99), 'max': max(el),
        }

    # ---------------- recursos por ventana
    res = collections.defaultdict(lambda: collections.defaultdict(list))
    res_max = collections.defaultdict(lambda: {'cpu': 0.0, 'mem': 0.0, 'mem_pct': 0.0, 'pids': 0})
    try:
        for r in csv.DictReader(open(recursos, encoding='utf-8')):
            try:
                ts = int(r['timestamp']) * 1000
            except (ValueError, TypeError):
                continue
            b = (ts - t0) // (BUCKET_S * 1000)
            name = r['contenedor'].replace('prestashop-stress-', '').replace('-1', '')
            cpu = float(r['cpu_pct'] or 0)
            mem = parse_mem_mib(r['mem_uso'] or '') or 0
            res[b][name + '_cpu'].append(cpu)
            res[b][name + '_mem'].append(mem)
            m = res_max[name]
            m['cpu'] = max(m['cpu'], cpu)
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
    w(f'# Resumen — {prueba}\n')
    w(f'- Inicio: {inicio}  ·  Fin: {fin}  ·  Duración medida: {dur_s/60:.1f} min')
    w(f'- Parámetros JMeter adicionales: `{jargs or "(valores por defecto del plan)"}`')
    w(f'- Usuarios concurrentes máximos alcanzados: **{max_threads}**')
    w(f'- Muestras: **{g["n"]:,}** · Errores: **{g["err"]:,} ({g["err_pct"]:.2f} %)** · '
      f'Throughput medio: **{g["n"]/dur_s:.1f} req/s**')
    w(f'- Tiempo de respuesta: promedio {g["avg"]:.0f} ms · p90 {g["p90"]} ms · p95 {g["p95"]} ms · '
      f'p99 {g["p99"]} ms · máx {g["max"]} ms\n')

    w('## Por transacción\n')
    w('| Transacción | Muestras | % error | Prom. (ms) | p90 | p95 | p99 | Máx. |')
    w('|---|---:|---:|---:|---:|---:|---:|---:|')
    by_label = collections.defaultdict(list)
    for r in rows:
        by_label[r['label']].append(r)
    for label in sorted(by_label):
        s = summary(by_label[label])
        w(f'| {label} | {s["n"]:,} | {s["err_pct"]:.2f} | {s["avg"]:.0f} | {s["p90"]} | {s["p95"]} | {s["p99"]} | {s["max"]} |')

    w(f'\n## Evolución en ventanas de {BUCKET_S} s\n')
    w('| Min. | Usuarios activos | req/s | % error | Prom. (ms) | p95 (ms) | CPU PrestaShop % | Mem PrestaShop MiB | CPU MySQL % | CPU JMeter % |')
    w('|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|')
    buckets = collections.defaultdict(list)
    for r in rows:
        buckets[(int(r['timeStamp']) - t0) // (BUCKET_S * 1000)].append(r)
    degradation = None
    break_point = None
    for b in sorted(buckets):
        rs = buckets[b]
        s = summary(rs)
        users = max(int(r.get('allThreads') or 0) for r in rs)
        rb = res.get(b, {})

        def avg(key):
            v = rb.get(key, [])
            return f'{statistics.mean(v):.0f}' if v else '–'
        w(f'| {b*BUCKET_S/60:.1f} | {users} | {len(rs)/BUCKET_S:.1f} | {s["err_pct"]:.1f} | {s["avg"]:.0f} | {s["p95"]} | '
          f'{avg("prestashop_cpu")} | {avg("prestashop_mem")} | {avg("mysql_cpu")} | {avg("jmeter-host_cpu")} |')
        if degradation is None and s['p95'] > P95_THRESHOLD_MS:
            degradation = (b, users, s)
        if break_point is None and s['err_pct'] > ERR_THRESHOLD:
            break_point = (b, users, s)

    w('\n## Degradación y punto de quiebre\n')
    for title, point, rule in (
        ('Degradación', degradation, f'p95 > {P95_THRESHOLD_MS} ms'),
        ('Quiebre', break_point, f'error > {ERR_THRESHOLD:.0f} %'),
    ):
        if point:
            b, users, s = point
            w(f'- **{title}** (primera ventana con {rule}): minuto **{b*BUCKET_S/60:.1f}** con **~{users} usuarios activos** '
              f'(error {s["err_pct"]:.1f} %, p95 {s["p95"]} ms, promedio {s["avg"]:.0f} ms, {len(buckets[b])/BUCKET_S:.1f} req/s).')
        else:
            w(f'- **{title}**: ninguna ventana con {rule}.')

    if res_max:
        w('\n## Picos de recursos\n')
        w('| Proceso | CPU máx. % | Memoria máx. MiB | Mem. máx. % del límite | PIDs máx. |')
        w('|---|---:|---:|---:|---:|')
        for name, m in sorted(res_max.items()):
            w(f'| {name} | {m["cpu"]:.0f} | {m["mem"]:.0f} | {m["mem_pct"]:.1f} | {m["pids"] or "–"} |')
        w('\n> CPU % de los contenedores es relativo a 1 núcleo (límites: PrestaShop 2 CPU = 200 %, MySQL 1 CPU = 100 %). '
          'CPU % de JMeter es el del proceso java en el host (10 núcleos = 1000 %).')

    def error_key(r):
        code = r['responseCode']
        if code.isdigit():  # respuesta HTTP recibida pero falló una aserción
            detail = r['failureMessage'] or r['responseMessage'] or ''
        else:               # error de red: timeout, conexión rechazada/reiniciada...
            code, detail = 'Sin respuesta HTTP', code.replace('Non HTTP response code: ', '')
        return f'{code} — {" ".join(detail.split())[:110]}'

    errors = collections.Counter(error_key(r) for r in rows if r['success'] != 'true')
    if errors:
        w('\n## Errores más frecuentes\n')
        w('| Código — mensaje | Cantidad |')
        w('|---|---:|')
        for msg, n in errors.most_common(10):
            w(f'| {msg.replace("|", "/")} | {n:,} |')

    print('\n'.join(out))


if __name__ == '__main__':
    main()
