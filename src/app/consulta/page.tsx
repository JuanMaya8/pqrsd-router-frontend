import type { Metadata } from 'next';
import { ConsultaForm } from '@/components/ConsultaForm';

export const metadata: Metadata = { title: 'Consultar mi solicitud' };

export default function ConsultaPage() {
  return (
    <div className="stack">
      <header>
        <p className="eyebrow">Consultar</p>
        <h1 style={{ fontSize: '2rem', marginBottom: 4 }}>Consultar mi solicitud</h1>
        <p className="muted">Usa el número de radicado y el código de seguimiento que recibiste al radicar.</p>
      </header>
      <ConsultaForm />
    </div>
  );
}
