import Link from 'next/link';
import { CopyButton } from './CopyButton';
import { Icon } from './Icon';
import { fmtDayLong } from '@/lib/format';
import type { Receipt } from '@/lib/types';

export function ReceiptCard({ r, onNew }: { r: Receipt; onNew: () => void }) {
  return (
    <section className="card receipt stack" aria-live="polite" aria-label="Solicitud radicada" style={{ maxWidth: 760 }}>
      <div className="row" style={{ alignItems: 'flex-start', flexWrap: 'nowrap' }}>
        <span className="icon-badge solid"><Icon name="checkCircle" size={22} /></span>
        <div style={{ minWidth: 0 }}>
          <p className="eyebrow" style={{ marginBottom: 2 }}>Solicitud radicada</p>
          <p className="big" data-testid="radicado" style={{ margin: 0 }}>{r.radicado}</p>
        </div>
      </div>
      <div className="card soft" style={{ padding: 16 }}>
        <p className="small" style={{ marginBottom: 8, fontWeight: 600 }}>Tu código de seguimiento (guárdalo: lo necesitas para consultar)</p>
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
        <Link className="btn primary" href={`/consulta/${r.radicado}?code=${r.trackingCode}`}><Icon name="search" />Ver el estado de mi solicitud</Link>
        <button type="button" className="btn" onClick={onNew}>Radicar otra solicitud</button>
      </div>
    </section>
  );
}
