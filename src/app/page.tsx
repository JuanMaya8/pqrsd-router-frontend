import Link from 'next/link';
import { LEGAL_DISCLAIMER, LEGAL_TERMS } from '@/lib/legal';

// SSG: fully static content (rights, deadlines, how it works). Served from the CDN, no server work per visit.
export const dynamic = 'force-static';

const TYPES = [
  ['Petición', 'Pides información, un documento o una actuación de la entidad.'],
  ['Queja', 'Te inconformas con la conducta de un servidor público.'],
  ['Reclamo', 'Un servicio no se prestó o se prestó mal y pides solución.'],
  ['Sugerencia', 'Propones una mejora a un trámite o servicio.'],
  ['Denuncia', 'Informas hechos presuntamente irregulares o ilegales.'],
];

export default function HomePage() {
  return (
    <div className="stack">
      <section className="hero">
        <p className="eyebrow">Peticiones, quejas, reclamos, sugerencias y denuncias</p>
        <h1>Cuéntanos tu caso. Nosotros lo llevamos a quien debe responderte.</h1>
        <p className="lead">Escribe con tus palabras. El sistema entiende de qué se trata, lo envía a la dependencia competente, marca si es urgente y te dice hasta qué día la entidad está obligada a responder.</p>
        <div className="row">
          <Link className="btn primary lg" href="/radicar">Radicar una solicitud</Link>
          <Link className="btn lg" href="/consulta">Consultar mi solicitud</Link>
        </div>
      </section>

      <section aria-label="Cómo funciona">
        <h2>Cómo funciona</h2>
        <ol className="steps">
          <li><b>Escribes</b><br />Con tus palabras, sin formularios largos.</li>
          <li><b>Entendemos</b><br />Reconocemos el tipo, la dependencia y la urgencia en segundos.</li>
          <li><b>Recibes un número</b><br />Un radicado y un código para seguir tu caso.</li>
          <li><b>La entidad responde</b><br />Con un plazo legal visible para ti y para todos.</li>
        </ol>
      </section>

      <div className="grid cols-2">
        <section className="card" aria-label="Tipos de solicitud">
          <h2>¿Qué tipo de solicitud es la mía?</h2>
          <dl style={{ margin: 0 }}>
            {TYPES.map(([t, d]) => (
              <div key={t} style={{ marginBottom: 10 }}><dt><b>{t}</b></dt><dd style={{ margin: 0 }} className="muted">{d}</dd></div>
            ))}
          </dl>
          <p className="small muted" style={{ marginBottom: 0 }}>No te preocupes por elegir bien: el sistema lo detecta y un funcionario lo confirma.</p>
        </section>

        <section className="card table-scroll" aria-label="Plazos de respuesta">
          <h2>¿Cuánto tiempo tiene la entidad para responder?</h2>
          <table className="plain">
            <thead><tr><th>Solicitud</th><th>Días hábiles</th></tr></thead>
            <tbody>
              {LEGAL_TERMS.map((t) => (
                <tr key={t.label}><td>{t.label}<div className="small muted">{t.note}</div></td><td><b>{t.days}</b></td></tr>
              ))}
            </tbody>
          </table>
          <p className="small muted" style={{ marginBottom: 0 }}>{LEGAL_DISCLAIMER}</p>
        </section>
      </div>

      <section className="card">
        <h2>Transparencia</h2>
        <p style={{ marginBottom: 12 }}>Mira en cualquier momento cuántas solicitudes ha recibido la entidad y qué porcentaje responde dentro del plazo legal.</p>
        <Link className="btn" href="/transparencia">Ver indicadores públicos</Link>
      </section>
    </div>
  );
}
