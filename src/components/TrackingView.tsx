import { SlaChip, StatusChip, UrgencyChip } from './Chips';
import { Icon } from './Icon';
import { Timeline } from './Timeline';
import { dueText, fmtDateTime, fmtDay } from '@/lib/format';
import type { TrackingView as Tracking } from '@/lib/types';

/** Public view of one request. Server-safe (no hooks); it only receives data the backend exposes publicly. */
export function TrackingView({ t }: { t: Tracking }) {
  return (
    <div className="stack lg">
      <header className="case-head">
        <span className="icon-badge solid" style={{ width: 52, height: 52 }}><Icon name="file" size={24} /></span>
        <div style={{ minWidth: 0, flex: 1 }}>
          <p className="eyebrow" style={{ marginBottom: 4 }}>Consulta de solicitud</p>
          <h1>{t.radicado}</h1>
          <div className="row" style={{ gap: 8 }}>
            <StatusChip status={t.status} label={t.statusLabel} />
            <SlaChip status={t.slaStatus} label={t.slaLabel} />
            <UrgencyChip id={t.urgency.id} label={`Urgencia ${t.urgency.label.toLowerCase()}`} />
          </div>
        </div>
      </header>

      <section className="grid cols-3" aria-label="Resumen">
        <div className="info-tile">
          <div className="k"><Icon name="calendar" size={15} />Plazo legal para responder</div>
          <div className="v">{fmtDay(t.dueDate)}</div>
          <div className="small muted">{dueText(t.businessDaysLeft, t.slaStatus)}</div>
        </div>
        <div className="info-tile">
          <div className="k"><Icon name="building" size={15} />Dependencia</div>
          <div className="v">{t.dependency.name}</div>
        </div>
        <div className="info-tile">
          <div className="k"><Icon name="file" size={15} />Tipo</div>
          <div className="v">{t.type.label}</div>
          <div className="small muted">Recibida {fmtDateTime(t.receivedAt)}</div>
        </div>
      </section>

      {t.transfer && (
        <p className="alert info" data-testid="tracking-transfer">
          <Icon name="forward" size={16} /> Tu solicitud no es competencia de esta entidad y fue trasladada a <b>{t.transfer.entity}</b> (Art. 21, Ley 1437 de 2011). Esa autoridad debe responderte.
        </p>
      )}

      {t.response ? (
        <section className="card" aria-label="Respuesta de la entidad" style={{ borderTop: '4px solid var(--ok)' }}>
          <h2 style={{ display: 'flex', gap: 8, alignItems: 'center' }}><Icon name="message" />Respuesta de la entidad</h2>
          <p className="small muted">Respondida el {fmtDateTime(t.response.answeredAt)}</p>
          <div className="text-block">{t.response.text}</div>
        </section>
      ) : (
        <p className="alert"><Icon name="clock" size={16} /> La entidad aún no ha respondido. Debe hacerlo a más tardar el <b>{fmtDay(t.dueDate)}</b>.</p>
      )}

      <section className="card" aria-label="Historial">
        <h2 style={{ display: 'flex', gap: 8, alignItems: 'center' }}><Icon name="history" />Historial</h2>
        <Timeline items={t.timeline} />
      </section>
    </div>
  );
}
