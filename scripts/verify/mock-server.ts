/**
 * Tiny in-memory stand-in for pqrsd-router-backend, used ONLY by `npm run verify:browser`.
 * It follows docs/CONTRACT.md §4 for the endpoints the UI calls. It is NOT the real backend: the point is to drive the real UI
 * (real React components, real fetch calls, real Chromium) through the happy paths, error paths and races.
 */
import { createServer, type IncomingMessage, type Server } from 'node:http';
import { detail, preview, publicStats, receipt, staffStats, summaries, taxonomy, tracking } from '../../tests/fixtures/data';
import type { Detail, Summary } from '../../src/lib/types';

export interface MockHandle {
  port: number;
  server: Server;
  log: Array<{ method: string; path: string; query: Record<string, string>; body: unknown; staffKey: string | null }>;
  state: { key: string };
  close(): Promise<void>;
}

const readBody = (req: IncomingMessage): Promise<unknown> =>
  new Promise((resolve) => {
    let s = '';
    req.on('data', (c) => (s += c));
    req.on('end', () => {
      try { resolve(s ? JSON.parse(s) : undefined); } catch { resolve(undefined); }
    });
  });

export async function startMock(): Promise<MockHandle> {
  const cases = new Map<string, Detail>();
  for (const s of summaries) cases.set(s.id, detail(s));
  let nextN = 100;
  const state = { key: 'secreta' };
  const log: MockHandle['log'] = [];
  const asSummary = (d: Detail): Summary => {
    const { text: _t, channel: _c, citizen: _ci, classification: _cl, effective: _e, deadline: _d, timeline: _tl, response: _r, ...rest } = d;
    return rest;
  };
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  const server = createServer(async (req, res) => {
    const url = new URL(req.url ?? '/', 'http://x');
    const path = url.pathname.replace(/^\/api\/v1/, '');
    const query = Object.fromEntries(url.searchParams);
    const origin = req.headers.origin ?? '*';
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Headers', 'content-type, x-staff-key');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
    if (req.method === 'OPTIONS') { res.writeHead(204).end(); return; }
    const body = await readBody(req);
    const staffKey = (req.headers['x-staff-key'] as string | undefined) ?? null;
    log.push({ method: req.method ?? 'GET', path, query, body, staffKey });
    const json = (code: number, data: unknown) => { res.writeHead(code, { 'content-type': 'application/json' }); res.end(JSON.stringify(data)); };
    const fail = (code: number, c: string, message: string, details?: string[]) => json(code, { statusCode: code, code: c, message, ...(details ? { details } : {}) });

    // control channel for the verification script
    if (path === '/__control/key' && req.method === 'POST') { state.key = (body as { key: string }).key; return json(200, { ok: true }); }
    if (path === '/__control/add' && req.method === 'POST') {
      const n = nextN++;
      const s: Summary = { ...summaries[1], id: `id-${n}`, radicado: `PQRSD-2025-${String(n).padStart(6, '0')}`, excerpt: 'Caso nuevo llegado en vivo' };
      cases.set(s.id, detail(s));
      return json(200, { id: s.id });
    }

    // ---- public
    if (path === '/meta/taxonomy') return json(200, taxonomy);
    if (path === '/public/transparency') return json(200, publicStats);
    if (path.startsWith('/public/tracking/')) {
      if (query.code !== 'K7M2QX') return fail(404, 'NOT_FOUND', 'No encontramos una solicitud con ese número y código.');
      return json(200, tracking);
    }
    if (path === '/pqrsd/preview' && req.method === 'POST') {
      const text = String((body as { text?: string })?.text ?? '');
      // the first "semáforo" request is slow on purpose: it must not overwrite the answer for the newer text
      if (/sem[aá]foro/i.test(text)) await sleep(1200);
      const water = /agua/i.test(text);
      return json(200, water
        ? { ...preview, classification: { ...preview.classification, dependency: { ...preview.classification.dependency, id: 'salud', name: 'Secretaría de Salud', reasons: ['Menciona «agua», asuntos de Secretaría de Salud.'] } } }
        : preview);
    }
    if (path === '/pqrsd' && req.method === 'POST') {
      const b = body as { text?: string; consent?: boolean };
      if (!b?.consent) return fail(422, 'VALIDATION_ERROR', 'Datos inválidos', ['Debes aceptar el tratamiento de datos.']);
      if ((b.text ?? '').includes('FORCE429')) return fail(429, 'RATE_LIMITED', 'Demasiadas solicitudes; espera un minuto.');
      return json(201, receipt);
    }

    // ---- staff
    if (path.startsWith('/staff')) {
      if (staffKey !== state.key) return fail(401, 'UNAUTHORIZED', 'Clave de funcionario inválida.');
      if (path === '/staff/me') return json(200, { name: 'Funcionario de prueba' });
      if (path === '/staff/stats') return json(200, { ...staffStats, totals: { ...staffStats.totals, all: cases.size } });
      if (path === '/staff/ai/status') return json(200, { available: true, modelVersion: 'hybrid-1741000000', model: { syntheticSamples: 1200, feedbackSamples: 3, trainedAt: 1741000000, note: 'Entrenada con datos sintéticos de arranque.' }, feedback: { total: 3, sinceLastTraining: 1 } });
      if (path === '/staff/pqrsd' && req.method === 'GET') {
        let items = [...cases.values()].map(asSummary);
        if (query.sla) items = items.filter((i) => i.slaStatus === query.sla);
        if (query.status) items = items.filter((i) => i.status === query.status);
        if (query.needsReview) items = items.filter((i) => i.needsReview);
        if (query.q) items = items.filter((i) => (i.excerpt + i.radicado).toLowerCase().includes(query.q.toLowerCase()));
        items.sort((a, b) => b.priorityScore - a.priorityScore);
        const limit = Number(query.limit ?? 50);
        const offset = Number(query.offset ?? 0);
        return json(200, { items: items.slice(offset, offset + limit), total: items.length });
      }
      const m = /^\/staff\/pqrsd\/([^/]+)(?:\/(confirm|reclassify|assign|extend|answer|close))?$/.exec(path);
      if (m) {
        const d = cases.get(m[1]);
        if (!d) return fail(404, 'NOT_FOUND', 'No existe.');
        const action = m[2];
        const now = new Date().toISOString();
        if (action === 'confirm') { d.status = 'assigned'; d.timeline.push({ at: now, event: 'confirmed', by: 'staff' }); d.needsReview = false; }
        if (action === 'reclassify') {
          const b = body as { type?: string; dependency?: string; urgency?: string };
          if (b.dependency) { d.effective.dependency = b.dependency; d.dependency = { id: b.dependency, name: taxonomy.dependencies.find((x) => x.id === b.dependency)?.name ?? b.dependency }; }
          if (b.type) { d.effective.type = b.type as Detail['effective']['type']; d.type = { id: b.type, label: b.type }; }
          d.status = 'assigned';
          d.timeline.push({ at: now, event: 'reclassified', by: 'staff' });
        }
        if (action === 'assign') {
          d.assignee = (body as { assignee: string | null }).assignee;
          d.status = 'assigned';
          d.timeline.push({ at: now, event: 'assigned', by: 'staff', detail: d.assignee ? `a cargo de ${d.assignee}` : 'sin responsable' });
        }
        if (action === 'extend') {
          if (d.extension) return fail(409, 'EXTENSION_NOT_ALLOWED', 'El plazo ya fue ampliado una vez.');
          const b = body as { days: number; reason: string };
          d.extension = { days: b.days, reason: b.reason, at: now, originalDueDate: d.dueDate };
          d.extended = true;
          d.timeline.push({ at: now, event: 'extended', by: 'staff' });
        }
        if (action === 'answer') {
          if (d.status === 'answered') return fail(409, 'INVALID_TRANSITION', 'La solicitud ya fue respondida.');
          d.status = 'answered'; d.slaStatus = 'done';
          d.response = { text: (body as { response: string }).response, answeredAt: now };
          d.timeline.push({ at: now, event: 'answered', by: 'staff' });
        }
        if (action === 'close') { d.status = 'closed'; d.timeline.push({ at: now, event: 'closed', by: 'staff' }); }
        return json(200, d);
      }
      if (path === '/staff/ai/retrain' && req.method === 'POST') return json(200, { available: true, modelVersion: 'hybrid-1741999999' });
      if (path === '/staff/demo/seed') return json(201, { created: (body as { count: number }).count });
      if (path === '/staff/demo' && req.method === 'DELETE') return json(200, { deleted: 60 });
      if (path === '/staff/export.csv') { res.writeHead(200, { 'content-type': 'text/csv' }); res.end('radicado,estado\nPQRSD-2025-000001,pending_review\n'); return; }
    }
    return fail(404, 'NOT_FOUND', `Sin ruta ${path}`);
  });
  await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
  const port = (server.address() as { port: number }).port;
  return { port, server, log, state, close: () => new Promise((r) => { server.closeAllConnections?.(); server.close(() => r()); }) };
}
