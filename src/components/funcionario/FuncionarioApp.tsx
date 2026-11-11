'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CaseDrawer } from './CaseDrawer';
import { Inbox } from './Inbox';
import { StatsPanel } from './StatsPanel';
import { defaultSocketFactory, useRealtime, type SocketFactory } from './useRealtime';
import { ApiError, api, errorMessage, staffApi } from '@/lib/api';
import { downloadBlob, fmtInt } from '@/lib/format';
import { loadStaffKey, saveStaffKey } from '@/lib/staffKey';
import { useDebounced } from '@/lib/useDebounced';
import { PQRSD_TYPES, SLA_STATUSES, STATUSES, URGENCIES, type AiStatus, type ListQuery, type StaffStats, type Summary, type Taxonomy } from '@/lib/types';
import { SLA_LABELS, STATUS_LABELS } from '@/lib/labels';

const PAGE = 50;

export function FuncionarioApp({ socketFactory = defaultSocketFactory }: { socketFactory?: SocketFactory }) {
  const [key, setKey] = useState<string | null>(null); // null = still reading sessionStorage
  const [draft, setDraft] = useState('');
  const [authError, setAuthError] = useState('');
  const [checking, setChecking] = useState(false);

  useEffect(() => { setKey(loadStaffKey()); }, []);

  const login = async (ev: { preventDefault(): void }): Promise<void> => {
    ev.preventDefault();
    setChecking(true);
    setAuthError('');
    try {
      await staffApi(draft.trim()).stats(); // any staff route validates the key
      saveStaffKey(draft.trim());
      setKey(draft.trim());
    } catch (e) {
      setAuthError(e instanceof ApiError && e.status === 401 ? 'La clave no es correcta.' : errorMessage(e));
    } finally {
      setChecking(false);
    }
  };

  const logout = useCallback(() => { saveStaffKey(''); setKey(''); setDraft(''); }, []);

  if (key === null) return <div className="skeleton" style={{ height: 160 }} aria-label="Cargando" />;
  if (key === '') {
    return (
      <form className="card stack" onSubmit={login} style={{ maxWidth: 460 }} aria-label="Ingreso de funcionarios">
        <div>
          <p className="eyebrow">Funcionarios</p>
          <h1 style={{ fontSize: '1.7rem' }}>Bandeja de solicitudes</h1>
          <p className="muted small">Acceso solo para personal autorizado. Aquí se ven datos personales de los ciudadanos.</p>
        </div>
        <div className="field"><label htmlFor="staff-key">Clave de funcionario</label>
          <input id="staff-key" type="password" className="input" autoComplete="current-password" value={draft} onChange={(e) => setDraft(e.target.value)} /></div>
        {authError && <p className="alert error" role="alert">{authError}</p>}
        <button className="btn primary" type="submit" disabled={checking}>{checking ? 'Verificando…' : 'Entrar'}</button>
        <p className="small muted" style={{ margin: 0 }}>Si el backend está en modo desarrollo sin clave, déjala vacía y pulsa «Entrar».</p>
      </form>
    );
  }
  return <Dashboard staffKey={key} onLogout={logout} socketFactory={socketFactory} />;
}

function Dashboard({ staffKey, onLogout, socketFactory }: { staffKey: string; onLogout: () => void; socketFactory: SocketFactory }) {
  const client = useMemo(() => staffApi(staffKey), [staffKey]);
  const [filters, setFilters] = useState<ListQuery>({ sort: 'priority:desc' });
  const [search, setSearch] = useState('');
  const q = useDebounced(search.trim(), 350);
  const [page, setPage] = useState(0);
  const [data, setData] = useState<{ items: Summary[]; total: number }>({ items: [], total: 0 });
  const [stats, setStats] = useState<StaffStats | null>(null);
  const [taxonomy, setTaxonomy] = useState<Taxonomy | null>(null);
  const [ai, setAi] = useState<AiStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  const bump = useCallback(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setTick((t) => t + 1), 400);
  }, []);
  const live = useRealtime(staffKey, bump, socketFactory);

  const query: ListQuery = useMemo(() => ({ ...filters, q: q || undefined, limit: PAGE, offset: page * PAGE }), [filters, q, page]);

  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    Promise.all([client.list(query, ctrl.signal), client.stats()])
      .then(([list, st]) => { setData(list); setStats(st); setError(''); })
      .catch((e) => {
        if (e instanceof DOMException && e.name === 'AbortError') return;
        if (e instanceof ApiError && e.status === 401) return onLogout();
        setError(errorMessage(e));
      })
      .finally(() => setLoading(false));
    return () => ctrl.abort();
  }, [client, query, tick, onLogout]);

  useEffect(() => { api.taxonomy().then((t) => Array.isArray(t?.types) && Array.isArray(t.urgency) && Array.isArray(t.dependencies) && setTaxonomy(t)).catch(() => undefined); }, []);
  useEffect(() => { client.aiStatus().then(setAi).catch(() => undefined); }, [client, tick]);

  const setFilter = (patch: Partial<ListQuery>): void => { setFilters((f) => ({ ...f, ...patch })); setPage(0); };
  const pages = Math.max(1, Math.ceil(data.total / PAGE));

  /** Runs an action; the note shown afterwards is the string `fn` returns, or `ok` when it returns nothing. */
  const act = async (fn: () => Promise<unknown>, ok = ''): Promise<void> => {
    setBusy(true);
    setNote('');
    try { const r = await fn(); setNote(typeof r === 'string' ? r : ok); setTick((t) => t + 1); } catch (e) { setNote(errorMessage(e)); } finally { setBusy(false); }
  };

  return (
    <div className="stack">
      <header className="row spread">
        <div>
          <p className="eyebrow">Funcionarios</p>
          <h1 style={{ fontSize: '2rem', margin: 0 }}>Bandeja de solicitudes</h1>
        </div>
        <div className="row">
          <span className="chip" title="Conexión en tiempo real con el backend" aria-live="polite" data-testid="live">
            <span className="dot" style={{ color: live ? 'var(--ok)' : 'var(--muted)' }} aria-hidden="true" />{live ? 'En vivo' : 'Sin conexión en vivo'}
          </span>
          <button className="btn sm" onClick={() => act(async () => downloadBlob('pqrsd.csv', await client.exportCsv(query)), 'CSV descargado (sin textos ni datos personales).')} disabled={busy}>Exportar CSV</button>
          <button className="btn sm" onClick={onLogout}>Salir</button>
        </div>
      </header>

      {error && <p className="alert error" role="alert">{error}</p>}
      {stats && <StatsPanel s={stats} onFilter={(f) => setFilter({ sla: f.sla, needsReview: f.needsReview, status: f.status })} />}

      <section className="card stack" aria-label="Filtros">
        <div className="filters">
          <div className="field"><label htmlFor="q">Buscar</label><input id="q" className="input" placeholder="Texto o radicado" value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} /></div>
          <div className="field"><label htmlFor="f-status">Estado</label>
            <select id="f-status" className="input" value={filters.status ?? ''} onChange={(e) => setFilter({ status: e.target.value as ListQuery['status'] })}>
              <option value="">Todos</option>{STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}</select></div>
          <div className="field"><label htmlFor="f-sla">Semáforo</label>
            <select id="f-sla" className="input" value={filters.sla ?? ''} onChange={(e) => setFilter({ sla: e.target.value as ListQuery['sla'] })}>
              <option value="">Todos</option>{SLA_STATUSES.map((s) => <option key={s} value={s}>{SLA_LABELS[s]}</option>)}</select></div>
          <div className="field"><label htmlFor="f-urg">Urgencia</label>
            <select id="f-urg" className="input" value={filters.urgency ?? ''} onChange={(e) => setFilter({ urgency: e.target.value as ListQuery['urgency'] })}>
              <option value="">Todas</option>{URGENCIES.map((u) => <option key={u} value={u}>{taxonomy?.urgency.find((x) => x.id === u)?.label ?? u}</option>)}</select></div>
          <div className="field"><label htmlFor="f-type">Tipo</label>
            <select id="f-type" className="input" value={filters.type ?? ''} onChange={(e) => setFilter({ type: e.target.value as ListQuery['type'] })}>
              <option value="">Todos</option>{PQRSD_TYPES.map((t) => <option key={t} value={t}>{taxonomy?.types.find((x) => x.id === t)?.label ?? t}</option>)}</select></div>
          <div className="field"><label htmlFor="f-dep">Dependencia</label>
            <select id="f-dep" className="input" value={filters.dependency ?? ''} onChange={(e) => setFilter({ dependency: e.target.value })}>
              <option value="">Todas</option>{taxonomy?.dependencies.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select></div>
          <div className="field"><label htmlFor="f-sort">Orden</label>
            <select id="f-sort" className="input" value={filters.sort} onChange={(e) => setFilter({ sort: e.target.value as ListQuery['sort'] })}>
              <option value="priority:desc">Prioridad (riesgo de vencer primero)</option><option value="dueDate:asc">Vencimiento más próximo</option><option value="receivedAt:desc">Más recientes</option></select></div>
        </div>
        <div className="row">
          <label className="check"><input type="checkbox" checked={!!filters.needsReview} onChange={(e) => setFilter({ needsReview: e.target.checked || undefined })} /><span>Solo las que la IA no está segura de clasificar</span></label>
          <label className="check"><input type="checkbox" data-testid="f-unassigned" checked={!!filters.unassigned} onChange={(e) => setFilter({ unassigned: e.target.checked || undefined })} /><span>Solo sin responsable</span></label>
          <button className="btn sm" onClick={() => { setFilters({ sort: 'priority:desc' }); setSearch(''); setPage(0); }}>Limpiar filtros</button>
        </div>
      </section>

      <section className="card stack" aria-label="Bandeja">
        <div className="row spread">
          <h2 style={{ margin: 0 }}>{fmtInt(data.total)} solicitudes</h2>
          <div className="row">
            <button className="btn sm" disabled={page === 0} onClick={() => setPage(page - 1)}>← Anterior</button>
            <span className="small muted" data-testid="pager">Página {page + 1} de {pages}</span>
            <button className="btn sm" disabled={page + 1 >= pages} onClick={() => setPage(page + 1)}>Siguiente →</button>
          </div>
        </div>
        <Inbox items={data.items} total={data.total} selectedId={selected} onOpen={setSelected} loading={loading} />
      </section>

      <details className="card" aria-label="Administración">
        <summary style={{ cursor: 'pointer', fontWeight: 650 }}>IA y datos de demostración</summary>
        <div className="grid cols-2" style={{ marginTop: 14 }}>
          <div className="stack">
            <h3>Inteligencia artificial</h3>
            {ai ? (
              <>
                <p className="small" style={{ margin: 0 }}>Estado: <b>{ai.available ? 'activa' : 'no disponible'}</b>{ai.modelVersion && <> · modelo <span className="mono">{ai.modelVersion}</span></>}</p>
                {ai.model && <p className="small muted" style={{ margin: 0 }}>Entrenado con {fmtInt(ai.model.syntheticSamples)} ejemplos sintéticos y {fmtInt(ai.model.feedbackSamples)} correcciones reales. {ai.feedback && <>Correcciones pendientes de usar: <b>{ai.feedback.sinceLastTraining}</b>.</>}</p>}
                {ai.model && <p className="small muted" style={{ margin: 0 }}>{ai.model.note}</p>}
              </>
            ) : <p className="small muted">Consultando…</p>}
            <div><button className="btn" disabled={busy || !ai?.available} onClick={() => window.confirm('El reentrenamiento tarda unos segundos y reemplaza el modelo. ¿Continuar?') && act(() => client.retrain(), 'IA reentrenada con las correcciones de los funcionarios.')}>Reentrenar con correcciones</button></div>
          </div>
          <div className="stack">
            <h3>Datos de demostración</h3>
            <p className="small muted" style={{ margin: 0 }}>Crea casos simulados (marcados «demo») para mostrar el sistema. Se pueden borrar sin tocar los casos reales.</p>
            <div className="row">
              <button className="btn" disabled={busy} onClick={() => act(async () => `${(await client.seed(60)).created} casos de demostración creados.`)} data-testid="seed">Crear 60 casos de demostración</button>
              <button className="btn danger" disabled={busy} onClick={() => window.confirm('¿Borrar todos los casos de demostración?') && act(async () => `${(await client.deleteDemo()).deleted} casos de demostración borrados.`)}>Borrar demostración</button>
            </div>
          </div>
        </div>
      </details>
      {note && <p className="alert" role="status" data-testid="note">{note}</p>}

      {selected && taxonomy && (
        <CaseDrawer id={selected} api={client} taxonomy={taxonomy} onClose={() => setSelected(null)} onChanged={() => setTick((t) => t + 1)} />
      )}
    </div>
  );
}
