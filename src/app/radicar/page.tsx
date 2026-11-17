import type { Metadata } from 'next';
import { Icon } from '@/components/Icon';
import { RadicarForm } from '@/components/RadicarForm';

export const metadata: Metadata = { title: 'Radicar una solicitud' };

// The page shell is static; the form itself is a client component (live preview, submit).
export default function RadicarPage() {
  return (
    <div className="stack lg">
      <header className="page-head">
        <p className="eyebrow"><Icon name="pen" size={14} />Radicar</p>
        <h1>Radicar una solicitud</h1>
        <p className="lead">Mientras escribes te mostramos cómo la clasificaremos y cuál es el plazo legal de respuesta.</p>
      </header>
      <RadicarForm />
    </div>
  );
}
