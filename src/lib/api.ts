/**
 * Typed client for pqrsd-router-backend (docs/CONTRACT.md §4). Works in the browser and in server components.
 *  - browser: NEXT_PUBLIC_API_URL  (default http://localhost:3001/api/v1)
 *  - server:  API_URL_INTERNAL (falls back to NEXT_PUBLIC_API_URL) — inside Docker use http://backend:3001/api/v1
 */
import type { AiStatus, CreateBody, Detail, ListQuery, Page, PreviewResult, PublicStats, Receipt, StaffStats, Summary, Taxonomy, TrackingView } from './types';

export class ApiError extends Error {
  constructor(readonly status: number, readonly code: string, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

const DEFAULT_URL = 'http://localhost:3001/api/v1';
/** Server-side request budget (Vercel functions are capped by `maxDuration` in the pages that render on demand). */
const SERVER_TIMEOUT_MS = 25_000;

export function apiBaseUrl(): string {
  if (typeof window === 'undefined') return (process.env.API_URL_INTERNAL || process.env.NEXT_PUBLIC_API_URL || DEFAULT_URL).replace(/\/$/, '');
  return (process.env.NEXT_PUBLIC_API_URL || DEFAULT_URL).replace(/\/$/, '');
}

/** Origin for socket.io (the backend URL without the /api/v1 suffix). Browser only.
 *  `||`, not `??`: the Dockerfile defines NEXT_PUBLIC_SOCKET_URL as an empty string when no build arg is given. */
export function socketOrigin(): string {
  return (process.env.NEXT_PUBLIC_SOCKET_URL || process.env.NEXT_PUBLIC_API_URL || DEFAULT_URL).replace(/\/api\/v\d+\/?$/, '');
}

interface Options {
  method?: string;
  body?: unknown;
  staffKey?: string;
  signal?: AbortSignal;
  /** server components only: ISR window in seconds (omit = never cached) */
  revalidate?: number;
  raw?: 'blob';
}

async function send(path: string, o: Options): Promise<Response> {
  const headers: Record<string, string> = { Accept: o.raw === 'blob' ? 'text/csv' : 'application/json' };
  if (o.body !== undefined) headers['Content-Type'] = 'application/json';
  if (o.staffKey) headers['X-Staff-Key'] = o.staffKey;
  const init: RequestInit & { next?: { revalidate: number } } = {
    method: o.method ?? 'GET',
    headers,
    body: o.body === undefined ? undefined : JSON.stringify(o.body),
    signal: o.signal,
  };
  if (o.revalidate !== undefined && typeof window === 'undefined') init.next = { revalidate: o.revalidate };
  else init.cache = 'no-store';
  try {
    return await fetch(`${apiBaseUrl()}${path}`, init);
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') throw e;
    throw new ApiError(0, 'BACKEND_UNREACHABLE', 'No pudimos conectar con el servidor. Intenta de nuevo en unos minutos.');
  }
}

async function failure(res: Response): Promise<ApiError> {
  let code = `HTTP_${res.status}`;
  let message = `El servidor respondió ${res.status}.`;
  try {
    const body = (await res.json()) as { code?: string; message?: string | string[]; details?: string[] };
    if (body.code) code = body.code;
    if (body.details?.length) message = body.details.join(' ');
    else if (body.message) message = Array.isArray(body.message) ? body.message.join('; ') : body.message;
  } catch {
    /* not JSON */
  }
  return new ApiError(res.status, code, message);
}

async function request<T>(path: string, o: Options = {}): Promise<T> {
  const res = await send(path, o);
  if (!res.ok) throw await failure(res);
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const errorMessage = (e: unknown): string => (e instanceof ApiError ? e.message : e instanceof Error ? e.message : 'Ocurrió un error inesperado.');

const qs = (o: object): string => {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(o)) if (v !== undefined && v !== '' && v !== false) p.set(k, String(v));
  const s = p.toString();
  return s ? `?${s}` : '';
};

/** Citizen / public endpoints. */
export const api = {
  preview: (text: string, signal?: AbortSignal) => request<PreviewResult>('/pqrsd/preview', { method: 'POST', body: { text }, signal }),
  create: (body: CreateBody) => request<Receipt>('/pqrsd', { method: 'POST', body }),
  tracking: (radicado: string, code: string) => request<TrackingView>(`/public/tracking/${encodeURIComponent(radicado)}${qs({ code })}`),
  transparency: () => request<PublicStats>('/public/transparency', { revalidate: 60 }),
  taxonomy: () => request<Taxonomy>('/meta/taxonomy'),
};

/** Staff endpoints: every call carries X-Staff-Key. */
export function staffApi(staffKey: string) {
  const o = (extra: Options = {}): Options => ({ staffKey, ...extra });
  const post = <T>(path: string, body?: unknown) => request<T>(path, o({ method: 'POST', body: body ?? {} }));
  return {
    stats: () => request<StaffStats>('/staff/stats', o()),
    list: (q: ListQuery, signal?: AbortSignal) => request<Page<Summary>>(`/staff/pqrsd${qs(q)}`, o({ signal })),
    get: (id: string) => request<Detail>(`/staff/pqrsd/${id}`, o()),
    confirm: (id: string, note?: string) => post<Detail>(`/staff/pqrsd/${id}/confirm`, note ? { note } : {}),
    reclassify: (id: string, body: { type?: string; subtype?: string; dependency?: string; urgency?: string; note?: string }) => post<Detail>(`/staff/pqrsd/${id}/reclassify`, body),
    answer: (id: string, response: string) => post<Detail>(`/staff/pqrsd/${id}/answer`, { response }),
    close: (id: string) => post<Detail>(`/staff/pqrsd/${id}/close`),
    exportCsv: async (q: ListQuery): Promise<Blob> => {
      const res = await send(`/staff/export.csv${qs({ ...q, limit: undefined, offset: undefined })}`, o({ raw: 'blob' }));
      if (!res.ok) throw await failure(res);
      return res.blob();
    },
    seed: (count: number) => post<{ created: number }>('/staff/demo/seed', { count }),
    deleteDemo: () => request<{ deleted: number }>('/staff/demo', o({ method: 'DELETE' })),
    aiStatus: () => request<AiStatus>('/staff/ai/status', o()),
    retrain: () => post<AiStatus>('/staff/ai/retrain'),
  };
}
export type StaffApi = ReturnType<typeof staffApi>;
