import { fmtInt } from '@/lib/format';

export function BarList({ title, rows }: { title: string; rows: Array<{ key: string; label: string; value: number }> }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <section aria-label={title}>
      <h2 style={{ fontSize: '1.1rem' }}>{title}</h2>
      <div className="bars">
        {rows.map((r) => (
          <div className="bar" key={r.key}>
            <span>{r.label}</span>
            <span className="track" aria-hidden="true"><i style={{ width: `${(r.value / max) * 100}%` }} /></span>
            <span>{fmtInt(r.value)}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
