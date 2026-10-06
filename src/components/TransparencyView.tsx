import { BarList } from './BarList';
import { WeeklyChart } from './WeeklyChart';
import { fmtDateTime, fmtInt, fmtNum1, fmtPct, plural } from '@/lib/format';
import { LEGAL_DISCLAIMER } from '@/lib/legal';
import type { PublicStats } from '@/lib/types';

const SUBTYPE_ES: Record<string, string> = { general: 'general', information: 'información o documentos', consultation: 'consulta' };
const TYPE_ES: Record<string, string> = { peticion: 'Petición', queja: 'Queja', reclamo: 'Reclamo', sugerencia: 'Sugerencia', denuncia: 'Denuncia' };

/** Aggregates only: the backend never sends text or personal data to this view. Server-safe. */
export function TransparencyView({ s }: { s: PublicStats }) {
  const hasData = s.totals.received > 0;
  return (
    <div className="stack">
      <header>
        <p className="eyebrow">Transparencia</p>
        <h1 style={{ fontSize: '2rem', marginBottom: 4 }}>Así responde la entidad</h1>
        <p className="muted small">Cifras agregadas, sin datos personales. Actualizado {fmtDateTime(s.generatedAt)} (se regenera cada minuto).</p>
      </header>

      {s.includesDemo && (
        <p className="alert warn" role="note"><b>Datos de demostración.</b> Estas cifras incluyen casos simulados para mostrar cómo funciona el sistema; no son de la entidad.</p>
      )}

      <section className="grid cols-4" aria-label="Indicadores">
        <div className="card stat"><b>{fmtInt(s.totals.received)}</b><span>Solicitudes recibidas</span></div>
        <div className="card stat ok"><b>{fmtInt(s.totals.answered)}</b><span>Respondidas</span></div>
        <div className="card stat"><b>{fmtInt(s.totals.open)}</b><span>En trámite</span></div>
        <div className={`card stat ${s.totals.overdue > 0 ? 'crit' : ''}`}><b>{fmtInt(s.totals.overdue)}</b><span>Vencidas sin respuesta</span></div>
        <div className="card stat"><b>{fmtPct(s.onTimeRate)}</b><span>Respondidas dentro del plazo legal</span></div>
        <div className="card stat"><b>{fmtNum1(s.avgBusinessDaysToAnswer)}</b><span>Días hábiles promedio para responder</span></div>
      </section>

      {hasData ? (
        <>
          <section className="card">
            <h2>Solicitudes por semana</h2>
            <WeeklyChart weeks={s.weekly} />
          </section>
          <div className="grid cols-2">
            <section className="card"><BarList title="Por tipo" rows={s.byType.map((t) => ({ key: t.id, label: t.label, value: t.count }))} /></section>
            <section className="card"><BarList title="Por dependencia" rows={s.byDependency.filter((d) => d.count > 0).sort((a, b) => b.count - a.count).map((d) => ({ key: d.id, label: d.name, value: d.count }))} /></section>
          </div>
          <section className="card table-scroll" aria-label="Vencimientos por dependencia">
            <h2>Trámites abiertos y vencidos por dependencia</h2>
            <table className="plain">
              <thead><tr><th>Dependencia</th><th>Recibidas</th><th>En trámite</th><th>Vencidas</th></tr></thead>
              <tbody>
                {s.byDependency.filter((d) => d.count > 0).sort((a, b) => b.overdueCount - a.overdueCount || b.openCount - a.openCount).map((d) => (
                  <tr key={d.id}><td>{d.name}</td><td>{fmtInt(d.count)}</td><td>{fmtInt(d.openCount)}</td><td>{d.overdueCount > 0 ? <b>{fmtInt(d.overdueCount)}</b> : '0'}</td></tr>
                ))}
              </tbody>
            </table>
          </section>
        </>
      ) : (
        <p className="alert">Todavía no hay solicitudes registradas.</p>
      )}

      <section className="card table-scroll" aria-label="Plazos legales">
        <h2>Plazos legales de respuesta</h2>
        <table className="plain">
          <thead><tr><th>Solicitud</th><th>Plazo</th><th>Fundamento</th></tr></thead>
          <tbody>
            {s.deadlines.map((d) => (
              <tr key={`${d.type}-${d.subtype ?? ''}`}>
                <td>{TYPE_ES[d.type] ?? d.type}{d.subtype ? ` · ${SUBTYPE_ES[d.subtype] ?? d.subtype}` : ''}</td>
                <td>{plural(d.legalDays, 'día hábil', 'días hábiles')}</td>
                <td className="small muted">{d.basis}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="small muted" style={{ marginTop: 10 }}>{LEGAL_DISCLAIMER}</p>
      </section>
    </div>
  );
}
