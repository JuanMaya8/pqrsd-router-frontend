import { UrgencyChip } from './Chips';
import { Icon } from './Icon';
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
      <div className="preview-block">
        <div className="k"><span>Tipo</span><span>Confianza {pct(c.type.confidence)}</span></div>
        <div className="v">{c.type.label}{c.subtype && <span className="small muted" style={{ fontWeight: 500 }}> · {c.subtype.label}</span>}</div>
        <span className="conf" aria-hidden="true"><i style={{ width: pct(c.type.confidence) }} /></span>
      </div>
      <div className="preview-block">
        <div className="k"><span>Dependencia</span>{c.source === 'ai' && <span>Confianza {pct(c.dependency.confidence)}</span>}</div>
        <div className="row" style={{ gap: 10, flexWrap: 'nowrap', alignItems: 'flex-start' }}>
          <span className="icon-badge" style={{ width: 36, height: 36 }}><Icon name="building" /></span>
          <div className="v">{c.dependency.name}</div>
        </div>
        {c.dependency.reasons.length > 0 && (
          <ul>{c.dependency.reasons.slice(0, 2).map((r) => <li key={r}>{r}</li>)}</ul>
        )}
      </div>
      <div className="preview-block">
        <div className="k"><span>Urgencia y plazo</span></div>
        <div className="row spread">
          <UrgencyChip id={c.urgency.id} label={`Urgencia ${c.urgency.label.toLowerCase()}`} />
          <span className="v">{plural(p.deadline.legalDays, 'día hábil', 'días hábiles')}</span>
        </div>
        <p className="small" style={{ margin: '8px 0 0' }}>
          Plazo de respuesta: <b>{plural(p.deadline.legalDays, 'día hábil', 'días hábiles')}</b>, hasta el <b>{fmtDayLong(p.deadline.dueDate)}</b> si la radicas hoy.
        </p>
      </div>
      {c.urgency.id === 'critical' && (
        <p className="alert error small" role="alert" style={{ marginTop: 12 }}><b>Esto parece una emergencia.</b> Si hay peligro inmediato para alguien, llama a la línea de emergencias 123.</p>
      )}
      {c.entities.length > 0 && (
        <div style={{ marginTop: 14 }}>
          <p className="small muted" style={{ marginBottom: 6, fontWeight: 600 }}>Detectamos:</p>
          <div className="signals">
            {c.entities.slice(0, 6).map((e, i) => <span key={`${e.text}-${i}`} className="chip info">{e.label.toLowerCase()} «{e.text}»</span>)}
          </div>
        </div>
      )}
      {c.needsReview && <p className="small muted" style={{ marginTop: 10, marginBottom: 0 }}>Un funcionario confirmará esta clasificación antes de asignarla.</p>}
    </div>
  );
}
