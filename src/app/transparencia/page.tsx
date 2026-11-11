import type { Metadata } from 'next';
import { TransparencyView } from '@/components/TransparencyView';
import { api, errorMessage } from '@/lib/api';
import type { PublicStats } from '@/lib/types';

export const metadata: Metadata = { title: 'Transparencia' };
// ISR: public aggregates change slowly. Served from cache and regenerated in the background at most once a minute.
export const revalidate = 60;
export const maxDuration = 30;

export default async function TransparencyPage() {
  let stats: PublicStats | null = null;
  let error: string | null = null;
  try {
    stats = await api.transparency();
  } catch (e) {
    error = errorMessage(e);
  }
  if (!stats) {
    return (
      <div className="stack">
        <h1 style={{ fontSize: '2rem' }}>Transparencia</h1>
        <p className="alert error" role="alert">No pudimos cargar los indicadores en este momento. {error}</p>
      </div>
    );
  }
  return <TransparencyView s={stats} />;
}
