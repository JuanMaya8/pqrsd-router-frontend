import type { Metadata } from 'next';
import { ConsultaForm } from '@/components/ConsultaForm';
import { Icon } from '@/components/Icon';

export const metadata: Metadata = { title: 'Consultar mi solicitud' };

export default function ConsultaPage() {
  return (
    <div className="stack lg">
      <header className="page-head">
        <p className="eyebrow"><Icon name="search" size={14} />Consultar</p>
        <h1>Consultar mi solicitud</h1>
        <p className="lead">Usa el número de radicado y el código de seguimiento que recibiste al radicar.</p>
      </header>
      <div className="consulta-grid">
        <ConsultaForm />
        <aside className="card soft" aria-labelledby="donde">
          <h2 id="donde" style={{ fontSize: '1.05rem', display: 'flex', gap: 8, alignItems: 'center' }}><Icon name="info" />¿Dónde encuentro estos datos?</h2>
          <p className="small">Al radicar, la pantalla de confirmación te muestra los dos datos y te deja copiarlos. Si dejaste tu correo y la entidad tiene activo el envío de correos, también te llegan por ese medio.</p>
          <div className="card" style={{ padding: 14 }}>
            <p className="small" style={{ margin: 0 }}><Icon name="hash" size={15} /> <b>Número de radicado:</b> <span className="mono">PQRSD-AAAA-NNNNNN</span></p>
            <p className="small" style={{ margin: '6px 0 0' }}><Icon name="key" size={15} /> <b>Código de seguimiento:</b> 6 letras o números</p>
          </div>
          <p className="small muted" style={{ margin: '12px 0 0' }}>Por seguridad, si alguno de los dos no coincide no indicamos cuál falló.</p>
        </aside>
      </div>
    </div>
  );
}
