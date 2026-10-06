import { UrgencyChip } from './Chips';
import { fmtDayLong, plural } from '@/lib/format';
import type { PreviewResult } from '@/lib/types';

const pct = (c: number): string => `${Math.round(c * 100)} %`;

/** Live preview of what the system understood. Honest about confidence and about the keyword fallback. */
export function ClassificationPreview({ p }: { p: PreviewResult }) {
  const c = p.classification;
  return (
    <div>
      {c.source === 'fallback' && (
        <p className="alert warn small">El asistente inteligente no está disponible ahora. Esta es una clasificación básica; un funcionario la revisará de todos modos.</p>
      )}
      <dl>
        <dt>Tipo</dt>
        <dd><b>{c.type.label}</b><span className="conf" title={`Confianza ${pct(c.type.confidence)}`}><i style={{ width: pct(c.type.confidence) }} /></span></dd>
        <dt>Dependencia</dt>
        <dd><b>{c.dependency.name}</b>{c.source === 'ai' && <span className="conf" title={`Confianza ${pct(c.dependency.confidence)}`}><i style={{ width: pct(c.dependency.confidence) }} /></span>}</dd>
        <dt>Urgencia</dt>
        <dd><UrgencyChip id={c.urgency.id} label={c.urgency.label} /></dd>
        {c.subtype && (<><dt>Subtipo</dt><dd>{c.subtype.label}</dd></>)}
      </dl>
      <p className="small" style={{ marginBottom: 6 }}>
        Plazo de respuesta: <b>{plural(p.deadline.legalDays, 'día hábil', 'días hábiles')}</b>, hasta el <b>{fmtDayLong(p.deadline.dueDate)}</b> si la radicas hoy.
      </p>
      {c.urgency.id === 'critical' && (
        <p className="alert error small" role="alert"><b>Esto parece una emergencia.</b> Si hay peligro inmediato para alguien, llama a la línea de emergencias 123.</p>
      )}
      {c.entities.length > 0 && (
        <p className="small muted" style={{ marginBottom: 6 }}>
          Detectamos: {c.entities.slice(0, 6).map((e) => `${e.label.toLowerCase()} «${e.text}»`).join(', ')}.
        </p>
      )}
      {c.dependency.reasons.length > 0 && (
        <ul>{c.dependency.reasons.slice(0, 2).map((r) => <li key={r}>{r}</li>)}</ul>
      )}
      {c.needsReview && <p className="small muted" style={{ marginTop: 8 }}>Un funcionario confirmará esta clasificación antes de asignarla.</p>}
    </div>
  );
}
