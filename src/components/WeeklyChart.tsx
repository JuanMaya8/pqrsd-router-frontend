import { fmtDay } from '@/lib/format';

/** Plain SVG (no chart library): received vs answered per week. Each bar has a text alternative in <title>. */
export function WeeklyChart({ weeks }: { weeks: Array<{ weekStart: string; received: number; answered: number }> }) {
  const W = 640;
  const H = 180;
  const pad = { l: 28, r: 6, t: 8, b: 26 };
  const max = Math.max(1, ...weeks.flatMap((w) => [w.received, w.answered]));
  const slot = (W - pad.l - pad.r) / Math.max(1, weeks.length);
  const bw = Math.max(3, slot / 2 - 3);
  const y = (v: number): number => pad.t + (H - pad.t - pad.b) * (1 - v / max);
  return (
    <figure style={{ margin: 0 }}>
      <svg className="weekly" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Solicitudes recibidas y respondidas por semana">
        <line x1={pad.l} x2={W - pad.r} y1={y(0)} y2={y(0)} stroke="currentColor" opacity="0.25" />
        <text x={2} y={y(max) + 4}>{max}</text>
        <text x={2} y={y(0) + 4}>0</text>
        {weeks.map((w, i) => {
          const x = pad.l + i * slot;
          return (
            <g key={w.weekStart}>
              <title>{`Semana del ${fmtDay(w.weekStart)}: ${w.received} recibidas, ${w.answered} respondidas`}</title>
              <rect className="rcv" x={x + 2} y={y(w.received)} width={bw} height={y(0) - y(w.received)} rx="2" />
              <rect className="ans" x={x + 2 + bw + 2} y={y(w.answered)} width={bw} height={y(0) - y(w.answered)} rx="2" />
              {(i % 2 === 0 || weeks.length < 8) && <text x={x + 2} y={H - 8}>{fmtDay(w.weekStart).replace(/ \d{4}$/, '')}</text>}
            </g>
          );
        })}
      </svg>
      <figcaption className="legend"><span><i style={{ background: 'var(--accent)' }} />Recibidas</span><span><i style={{ background: 'var(--ok)' }} />Respondidas</span></figcaption>
    </figure>
  );
}
