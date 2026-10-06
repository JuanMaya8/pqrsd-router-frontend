import type { Metadata } from 'next';
import Link from 'next/link';
import { TrackingView } from '@/components/TrackingView';
import { ApiError, api, errorMessage } from '@/lib/api';
import type { TrackingView as Tracking } from '@/lib/types';

// SSR on every request: the status must always be fresh and the private code must never be cached by a CDN.
export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Estado de mi solicitud', robots: { index: false, follow: false } };

export default async function TrackingPage({ params, searchParams }: { params: { radicado: string }; searchParams: { code?: string | string[] } }) {
  const code = Array.isArray(searchParams.code) ? searchParams.code[0] : searchParams.code;
  let data: Tracking | null = null;
  let error: string | null = null;
  let notFound = false;
  try {
    data = await api.tracking(params.radicado, code ?? '');
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound = true;
    else error = errorMessage(e);
  }

  if (data) return <TrackingView t={data} />;
  return (
    <div className="stack">
      <h1 style={{ fontSize: '1.8rem' }}>{notFound ? 'No encontramos esa solicitud' : 'No pudimos consultar tu solicitud'}</h1>
      <p className={`alert ${notFound ? 'warn' : 'error'}`} role="alert">
        {notFound ? 'Revisa que el número de radicado y el código de seguimiento estén bien escritos. Por seguridad no indicamos cuál de los dos falló.' : error}
      </p>
      <div className="row">
        <Link className="btn primary" href="/consulta">Intentar de nuevo</Link>
        <Link className="btn" href="/">Ir al inicio</Link>
      </div>
    </div>
  );
}
