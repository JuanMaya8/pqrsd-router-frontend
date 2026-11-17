import Link from 'next/link';
import { Icon, type IconName } from '@/components/Icon';
import { LEGAL_DISCLAIMER, LEGAL_TERMS } from '@/lib/legal';

// SSG: fully static content (rights, deadlines, how it works). Served from the CDN, no server work per visit.
export const dynamic = 'force-static';

const TYPES: Array<[string, string, IconName]> = [
  ['Petición', 'Pides información, un documento o una actuación de la entidad.', 'file'],
  ['Queja', 'Te inconformas con la conducta de un servidor público.', 'user'],
  ['Reclamo', 'Un servicio no se prestó o se prestó mal y pides solución.', 'alert'],
  ['Sugerencia', 'Propones una mejora a un trámite o servicio.', 'sparkles'],
  ['Denuncia', 'Informas hechos presuntamente irregulares o ilegales.', 'scale'],
];

const STEPS: Array<[string, string]> = [
  ['Escribes', 'Con tus palabras, sin formularios largos.'],
  ['Entendemos', 'Reconocemos el tipo, la dependencia y la urgencia en segundos.'],
  ['Recibes un número', 'Un radicado y un código para seguir tu caso.'],
  ['La entidad responde', 'Con un plazo legal visible para ti y para todos.'],
];

export default function HomePage() {
  return (
    <div className="stack lg">
      <section className="hero">
        <div>
          <p className="eyebrow"><Icon name="sparkles" size={14} />Peticiones, quejas, reclamos, sugerencias y denuncias</p>
          <h1>Cuéntanos tu caso. Nosotros lo llevamos a quien debe responderte.</h1>
          <p className="lead">Escribe con tus palabras. El sistema entiende de qué se trata, lo envía a la dependencia competente, marca si es urgente y te dice hasta qué día la entidad está obligada a responder.</p>
          <div className="actions">
            <Link className="btn primary lg btn-tile" href="/radicar">
              <Icon name="pen" size={22} />
              <span>Radicar una solicitud<small>Escribe con tus palabras</small></span>
              <Icon name="arrowRight" />
            </Link>
            <Link className="btn lg btn-tile" href="/consulta">
              <Icon name="search" size={22} />
              <span>Consultar mi solicitud<small>Con tu número de radicado y código</small></span>
              <Icon name="arrowRight" />
            </Link>
          </div>
        </div>

        <section className="card soft" aria-labelledby="como-funciona">
          <div className="section-head" style={{ marginBottom: 16 }}>
            <h2 id="como-funciona" style={{ fontSize: '1.1rem' }}>Cómo funciona</h2>
            <span className="pill-note">{STEPS.length} pasos</span>
          </div>
          <ol className="steps">
            {STEPS.map(([t, d]) => (
              <li key={t}><div><b>{t}</b><span>{d}</span></div></li>
            ))}
          </ol>
        </section>
      </section>

      <section aria-labelledby="tipos">
        <div className="section-head">
          <div>
            <p className="eyebrow">Tipos de solicitud</p>
            <h2 id="tipos">¿Qué tipo de solicitud es la mía?</h2>
          </div>
        </div>
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          {TYPES.map(([t, d, icon]) => (
            <div key={t} className="card type-card">
              <h3><span className="icon-badge"><Icon name={icon} size={20} /></span>{t}</h3>
              <p className="small muted" style={{ margin: 0 }}>{d}</p>
            </div>
          ))}
        </div>
        <p className="small muted" style={{ marginTop: 12, marginBottom: 0 }}>No te preocupes por elegir bien: el sistema lo detecta y un funcionario lo confirma.</p>
      </section>

      <section className="card" aria-labelledby="plazos">
        <div className="section-head">
          <div>
            <p className="eyebrow"><Icon name="clock" size={14} />Plazos legales</p>
            <h2 id="plazos">¿Cuánto tiempo tiene la entidad para responder?</h2>
          </div>
          <span className="pill-note"><Icon name="calendar" size={14} />Días hábiles</span>
        </div>
        <div className="table-frame table-scroll">
          <table className="plain">
            <thead><tr><th>Solicitud</th><th>Plazo</th></tr></thead>
            <tbody>
              {LEGAL_TERMS.map((t) => (
                <tr key={t.label}>
                  <td><b>{t.label}</b><div className="small muted">{t.note}</div></td>
                  <td><span className="days"><b>{t.days}</b><small>días hábiles</small></span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="small muted" style={{ marginTop: 12, marginBottom: 0 }}><Icon name="info" size={14} /> {LEGAL_DISCLAIMER}</p>
      </section>

      <section className="cta-band" aria-labelledby="transparencia">
        <div>
          <h2 id="transparencia">Transparencia</h2>
          <p>Mira en cualquier momento cuántas solicitudes ha recibido la entidad y qué porcentaje responde dentro del plazo legal.</p>
        </div>
        <div className="row">
          <Link className="btn inverse" href="/transparencia"><Icon name="chart" />Ver indicadores públicos</Link>
          <Link className="btn" href="/radicar"><Icon name="pen" />Radicar una solicitud</Link>
        </div>
      </section>
    </div>
  );
}
