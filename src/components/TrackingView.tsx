import { SlaChip, StatusChip, UrgencyChip } from './Chips';
import { Timeline } from './Timeline';
import { dueText, fmtDateTime, fmtDay } from '@/lib/format';
import type { TrackingView as Tracking } from '@/lib/types';

/** Public view of one request. Server-safe (no hooks); it only receives data the backend exposes publicly. */
export function TrackingView({ t }: { t: Tracking }) {
  return (
    <div className="stack">
      <header>
        <p className="eyebrow">Consulta de solicitud</p>
        <h1 style={{ fontSize: '2rem', marginBottom: 6 }}><span className="mono">{t.radicado}</span></h1>
        <div className="row">
          <StatusChip status={t.status} label={t.statusLabel} />
          <SlaChip status={t.slaStatus} label={t.slaLabel} />
          <UrgencyChip id={t.urgency.id} label={`Urgencia ${t.urgency.label.toLowerCase()}`} />
        </div>
      </header>

      <section className="card" aria-label="Resumen">
        <table className="kvtable">
          <tbody>
            <tr><td>Tipo</td><td>{t.type.label}</td></tr>
            <tr><td>Dependencia</td><td>{t.dependency.name}</td></tr>
            <tr><td>Recibida</td><td>{fmtDateTime(t.receivedAt)}</td></tr>
            <tr><td>Plazo legal para responder</td><td><b>{fmtDay(t.dueDate)}</b> · {dueText(t.businessDaysLeft, t.slaStatus)}</td></tr>
          </tbody>
        </table>
      </section>

      {t.response ? (
        <section className="card" aria-label="Respuesta de la entidad">
          <h2>Respuesta de la entidad</h2>
          <p className="small muted">Respondida el {fmtDateTime(t.response.answeredAt)}</p>
          <div className="text-block">{t.response.text}</div>
        </section>
      ) : (
        <p className="alert">La entidad aún no ha respondido. Debe hacerlo a más tardar el <b>{fmtDay(t.dueDate)}</b>.</p>
      )}

      <section className="card" aria-label="Historial">
        <h2>Historial</h2>
        <Timeline items={t.timeline} />
      </section>
    </div>
  );
}
