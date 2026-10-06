import type { Metadata } from 'next';
import { RadicarForm } from '@/components/RadicarForm';

export const metadata: Metadata = { title: 'Radicar una solicitud' };

// The page shell is static; the form itself is a client component (live preview, submit).
export default function RadicarPage() {
  return (
    <div className="stack">
      <header>
        <p className="eyebrow">Radicar</p>
        <h1 style={{ fontSize: '2rem', marginBottom: 4 }}>Radicar una solicitud</h1>
        <p className="muted">Mientras escribes te mostramos cómo la clasificaremos y cuál es el plazo legal de respuesta.</p>
      </header>
      <RadicarForm />
    </div>
  );
}
