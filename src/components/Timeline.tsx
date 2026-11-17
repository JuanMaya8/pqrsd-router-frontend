import { fmtDateTime } from '@/lib/format';

export function Timeline({ items }: { items: Array<{ at: string; label: string; detail?: string }> }) {
  return (
    <ol className="timeline" aria-label="Historial de la solicitud">
      {items.map((t, i) => (
        <li key={`${t.at}-${i}`}>
          <div className="ev">
            <b>{t.label}</b>
            {t.detail && <div className="small muted">{t.detail}</div>}
            <time dateTime={t.at}>{fmtDateTime(t.at)}</time>
          </div>
        </li>
      ))}
    </ol>
  );
}
