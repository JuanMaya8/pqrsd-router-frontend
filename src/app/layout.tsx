import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { Inter } from 'next/font/google';
import Link from 'next/link';
import './globals.css';
import { NavLinks } from '@/components/NavLinks';

// Self-hosted at build time by next/font: no request to Google from the browser and no render-blocking stylesheet.
const inter = Inter({ subsets: ['latin'], display: 'swap', variable: '--font-inter' });

export const metadata: Metadata = {
  title: { default: 'PQRSD Inteligente — Peticiones, quejas, reclamos, sugerencias y denuncias', template: '%s · PQRSD Inteligente' },
  description: 'Radica tu solicitud en texto libre: el sistema la clasifica, la envía a la dependencia competente y te dice hasta cuándo debe responderte la entidad.',
};
export const viewport: Viewport = { themeColor: '#003366', width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" className={inter.variable}>
      <body>
        <a className="skip" href="#contenido">Saltar al contenido</a>
        <header className="site-header">
          <div className="wrap">
            <Link href="/" className="brand" aria-label="PQRSD Inteligente, inicio">
              <svg width="36" height="36" viewBox="0 0 32 32" aria-hidden="true">
                <rect width="32" height="32" rx="8" fill="currentColor" />
                <path d="M8 11h16M8 16h16M8 21h9" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
                <circle cx="23" cy="21" r="3" fill="#80d5cb" />
              </svg>
              <span><b>PQRSD Inteligente</b><small>Atención al ciudadano</small></span>
            </Link>
            <NavLinks />
          </div>
        </header>
        <main id="contenido">
          <div className="wrap">{children}</div>
        </main>
        <footer className="site-footer">
          <div className="wrap foot">
            <div>
              <h2>PQRSD Inteligente</h2>
              <p style={{ margin: 0 }}>
                Prototipo de demostración. Los plazos son de referencia (Ley 1755 de 2015) y no constituyen asesoría jurídica. Tus datos personales solo los ve el personal autorizado de la entidad.
              </p>
            </div>
            <nav aria-label="Pie de página">
              <h2>Accesos</h2>
              <ul>
                <li><Link href="/radicar">Radicar una solicitud</Link></li>
                <li><Link href="/consulta">Consultar mi solicitud</Link></li>
                <li><Link href="/transparencia">Transparencia</Link></li>
              </ul>
            </nav>
          </div>
        </footer>
      </body>
    </html>
  );
}
