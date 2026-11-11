import { SlaChip, StatusChip, UrgencyChip } from '../Chips';
import { dueText, fmtDay, fmtInt } from '@/lib/format';
import type { Summary } from '@/lib/types';

export function Inbox({ items, total, selectedId, onOpen, loading }: { items: Summary[]; total: number; selectedId: string | null; onOpen: (id: string) => void; loading: boolean }) {
  if (!loading && items.length === 0) return <p className="alert" data-testid="empty">No hay solicitudes con estos filtros.</p>;
  return (
    <div className="table-scroll" style={{ opacity: loading ? 0.6 : 1 }}>
      <table className="plain" data-testid="inbox">
        <caption className="sr-only">{fmtInt(total)} solicitudes, ordenadas por prioridad</caption>
        <thead>
          <tr><th>Semáforo</th><th>Radicado</th><th>Tipo y dependencia</th><th>Urgencia</th><th>Vence</th><th>Estado</th></tr>
        </thead>
        <tbody>
          {items.map((it) => (
            <tr key={it.id} className="clickable" aria-selected={it.id === selectedId} onClick={() => onOpen(it.id)}>
              <td><SlaChip status={it.slaStatus} /></td>
              <td>
                <button type="button" className="btn sm" onClick={(e) => { e.stopPropagation(); onOpen(it.id); }} aria-label={`Abrir ${it.radicado}`}>{it.radicado}</button>
                {it.isDemo && <span className="chip" style={{ marginLeft: 6 }}>demo</span>}
                <div className="small muted" style={{ maxWidth: 360, marginTop: 4 }}>{it.excerpt}</div>
              </td>
              <td>
                <b>{it.type.label}</b>
                <div className="small">{it.dependency.name}</div>
                {it.needsReview && <span className="chip warn" title="La IA tiene dudas: confirme tipo, dependencia y urgencia">⚑ Por confirmar</span>}
                {it.source === 'fallback' && <span className="chip crit" title="La IA no estaba disponible">Sin IA</span>}
              </td>
              <td><UrgencyChip id={it.urgency.id} label={it.urgency.label} /><div className="small muted mono">prioridad {Math.round(it.priorityScore)}</div></td>
              <td><b>{fmtDay(it.dueDate)}</b><div className="small muted">{dueText(it.businessDaysLeft, it.slaStatus)}</div>{it.extended && <span className="chip" title="Plazo ampliado (Art. 14, parágrafo)">ampliado</span>}</td>
              <td><StatusChip status={it.status} />{it.assignee && <div className="small muted" style={{ marginTop: 4 }}>{it.assignee}</div>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
