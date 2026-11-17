import { BarList } from './BarList';
import { Icon, type IconName } from './Icon';
import { WeeklyChart } from './WeeklyChart';
import { fmtDateTime, fmtInt, fmtNum1, fmtPct, plural } from '@/lib/format';
import { LEGAL_DISCLAIMER } from '@/lib/legal';
import type { PublicStats } from '@/lib/types';

const SUBTYPE_ES: Record<string, string> = { general: 'general', information: 'información o documentos', consultation: 'consulta' };
const TYPE_ES: Record<string, string> = { peticion: 'Petición', queja: 'Queja', reclamo: 'Reclamo', sugerencia: 'Sugerencia', denuncia: 'Denuncia' };

function Kpi({ value, label, icon, tone = '' }: { value: string; label: string; icon: IconName; tone?: string }) {
  return (
    <div className={`card stat ${tone}`}>
      <div className="stat-top"><span className="small" style={{ fontWeight: 600 }}>{label}</span><Icon name={icon} /></div>
      <b>{value}</b>
    </div>
  );
}

/** Aggregates only: the backend never sends text or personal data to this view. Server-safe. */
export function TransparencyView({ s }: { s: PublicStats }) {
  const hasData = s.totals.received > 0;
  const deps = s.byDependency.filter((d) => d.count > 0).sort((a, b) => b.count - a.count);
  return (
    <div className="stack lg">
      <header className="page-head">
        <p className="eyebrow"><Icon name="chart" size={14} />Transparencia</p>
        <h1>Así responde la entidad</h1>
        <p className="lead" style={{ marginBottom: 8 }}>Cifras agregadas, sin datos personales.</p>
        <p className="small muted"><Icon name="refresh" size={14} /> Actualizado {fmtDateTime(s.generatedAt)} (se regenera cada minuto).</p>
      </header>

      {s.includesDemo && (
        <p className="alert warn" role="note"><b>Datos de demostración.</b> Estas cifras incluyen casos simulados para mostrar cómo funciona el sistema; no son de la entidad.</p>
      )}

      <section className="grid cols-3" aria-label="Indicadores">
        <Kpi value={fmtInt(s.totals.received)} label="Solicitudes recibidas" icon="inbox" />
        <Kpi value={fmtInt(s.totals.answered)} label="Respondidas" icon="checkCircle" tone="ok" />
        <Kpi value={fmtInt(s.totals.open)} label="En trámite" icon="hourglass" />
        <Kpi value={fmtInt(s.totals.overdue)} label="Vencidas sin respuesta" icon="alert" tone={s.totals.overdue > 0 ? 'crit' : ''} />
        <Kpi value={fmtPct(s.onTimeRate)} label="Respondidas dentro del plazo legal" icon="shieldCheck" />
        <Kpi value={fmtNum1(s.avgBusinessDaysToAnswer)} label="Días hábiles promedio para responder" icon="clock" />
      </section>

      {hasData ? (
        <>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))' }}>
            <section className="card"><BarList title="Por tipo" rows={s.byType.map((t) => ({ key: t.id, label: t.label, value: t.count }))} /></section>
            <section className="card" aria-labelledby="semanal">
              <h2 id="semanal" style={{ fontSize: '1.1rem' }}>Solicitudes por semana</h2>
              <WeeklyChart weeks={s.weekly} />
            </section>
          </div>

          <section aria-labelledby="por-dependencia">
            <div className="section-head"><h2 id="por-dependencia">Por dependencia</h2></div>
            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 260px), 1fr))' }}>
              {deps.map((d) => (
                <div key={d.id} className="card dep-card">
                  <div className="head"><h3>{d.name}</h3><span className="chip info">{plural(d.count, 'caso', 'casos')}</span></div>
                  <dl>
                    <div><dt>Recibidas</dt><dd>{fmtInt(d.count)}</dd></div>
                    <div><dt>En trámite</dt><dd>{fmtInt(d.openCount)}</dd></div>
                    <div><dt>Vencidas</dt><dd className={d.overdueCount > 0 ? 'crit' : ''}>{fmtInt(d.overdueCount)}</dd></div>
                  </dl>
                </div>
              ))}
            </div>
          </section>

          <section className="card" aria-label="Vencimientos por dependencia">
            <h2>Trámites abiertos y vencidos por dependencia</h2>
            <div className="table-frame table-scroll">
              <table className="plain">
                <thead><tr><th>Dependencia</th><th>Recibidas</th><th>En trámite</th><th>Vencidas</th></tr></thead>
                <tbody>
                  {[...deps].sort((a, b) => b.overdueCount - a.overdueCount || b.openCount - a.openCount).map((d) => (
                    <tr key={d.id}>
                      <td>{d.name}</td><td>{fmtInt(d.count)}</td><td>{fmtInt(d.openCount)}</td>
                      <td>{d.overdueCount > 0 ? <span className="chip crit"><Icon name="alert" />{fmtInt(d.overdueCount)}</span> : '0'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : (
        <p className="alert">Todavía no hay solicitudes registradas.</p>
      )}

      <section className="card" aria-label="Plazos legales">
        <h2>Plazos legales de respuesta</h2>
        <div className="table-frame table-scroll">
          <table className="plain">
            <thead><tr><th>Solicitud</th><th>Plazo</th><th>Fundamento</th></tr></thead>
            <tbody>
              {s.deadlines.map((d) => (
                <tr key={`${d.type}-${d.subtype ?? ''}`}>
                  <td><b>{TYPE_ES[d.type] ?? d.type}{d.subtype ? ` · ${SUBTYPE_ES[d.subtype] ?? d.subtype}` : ''}</b></td>
                  <td><span className="days"><b>{d.legalDays}</b><small>{d.legalDays === 1 ? 'día hábil' : 'días hábiles'}</small></span></td>
                  <td className="small muted">{d.basis}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="small muted" style={{ marginTop: 12, marginBottom: 0 }}>{LEGAL_DISCLAIMER}</p>
      </section>
    </div>
  );
}
