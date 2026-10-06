import Link from 'next/link';
import { CopyButton } from './CopyButton';
import { fmtDayLong } from '@/lib/format';
import type { Receipt } from '@/lib/types';

export function ReceiptCard({ r, onNew }: { r: Receipt; onNew: () => void }) {
  return (
    <section className="card receipt stack" aria-live="polite" aria-label="Solicitud radicada">
      <div>
        <p className="eyebrow">Solicitud radicada</p>
        <p className="big" data-testid="radicado" style={{ margin: '4px 0' }}>{r.radicado}</p>
      </div>
      <div>
        <p className="small muted" style={{ marginBottom: 6 }}>Tu código de seguimiento (guárdalo: lo necesitas para consultar)</p>
        <div className="row">
          <span className="codebox" data-testid="tracking-code">{r.trackingCode}</span>
          <CopyButton value={r.trackingCode} label="Copiar código" />
          <CopyButton value={r.radicado} label="Copiar número" />
        </div>
      </div>
      <table className="kvtable">
        <tbody>
          <tr><td>Clasificada como</td><td><b>{r.type.label}</b></td></tr>
          <tr><td>Enviada a</td><td><b>{r.dependency.name}</b></td></tr>
          <tr><td>La entidad debe responder antes del</td><td><b>{fmtDayLong(r.dueDate)}</b> ({r.legalDays} días hábiles)</td></tr>
        </tbody>
      </table>
      <p className="small">{r.message}</p>
      <div className="row">
        <Link className="btn primary" href={`/consulta/${r.radicado}?code=${r.trackingCode}`}>Ver el estado de mi solicitud</Link>
        <button type="button" className="btn" onClick={onNew}>Radicar otra solicitud</button>
      </div>
    </section>
  );
}
