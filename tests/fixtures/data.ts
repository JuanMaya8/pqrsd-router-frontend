/** Hand-written sample responses that follow docs/CONTRACT.md §4. Shared by unit tests and the browser harness. */
import type { Detail, PreviewResult, PublicStats, Receipt, StaffStats, Summary, Taxonomy, TrackingView } from '../../src/lib/types';

export const taxonomy: Taxonomy = {
  types: [
    { id: 'peticion', label: 'Petición', description: 'Solicitud de información o actuación' },
    { id: 'queja', label: 'Queja', description: 'Inconformidad con un servidor' },
    { id: 'reclamo', label: 'Reclamo', description: 'Servicio mal prestado' },
    { id: 'sugerencia', label: 'Sugerencia', description: 'Propuesta de mejora' },
    { id: 'denuncia', label: 'Denuncia', description: 'Hechos irregulares' },
  ],
  urgency: [
    { id: 'critical', label: 'Crítica', description: 'Riesgo vital' },
    { id: 'high', label: 'Alta', description: 'Alta' },
    { id: 'medium', label: 'Media', description: 'Ordinaria' },
    { id: 'low', label: 'Baja', description: 'Baja' },
  ],
  subtypes: [
    { id: 'general', label: 'Petición general', description: '15 días' },
    { id: 'information', label: 'Información o documentos', description: '10 días' },
    { id: 'consultation', label: 'Consulta', description: '30 días' },
  ],
  dependencies: [
    { id: 'atencion', name: 'Atención al Ciudadano', description: 'Redirige' },
    { id: 'salud', name: 'Secretaría de Salud', description: 'Salud' },
    { id: 'movilidad', name: 'Secretaría de Movilidad', description: 'Tránsito' },
    { id: 'obras', name: 'Secretaría de Obras Públicas', description: 'Vías' },
  ],
  fallbackDependency: 'atencion',
};

export const preview: PreviewResult = {
  classification: {
    source: 'ai',
    type: { id: 'reclamo', label: 'Reclamo', confidence: 0.81, reasons: ['El texto contiene «no me han respondido», expresiones propias de un reclamo.'] },
    dependency: { id: 'movilidad', name: 'Secretaría de Movilidad', confidence: 0.74, reasons: ['Menciona «semáforo», asuntos de Secretaría de Movilidad.'] },
    urgency: { id: 'high', label: 'Alta', confidence: 0.55, reasons: ['Urgencia alta porque el texto menciona «accidente».'] },
    subtype: null,
    needsReview: false,
    entities: [{ type: 'date', label: 'Fecha', text: '5 de marzo', value: '2025-03-05' }, { type: 'place', label: 'Lugar', text: 'Bogotá', value: null }],
  },
  deadline: { legalDays: 15, dueDate: '2025-03-27', basis: 'Art. 14 Ley 1437 de 2011 (sustituido por Ley 1755 de 2015)' },
};

export const receipt: Receipt = {
  radicado: 'PQRSD-2025-000042',
  trackingCode: 'K7M2QX',
  receivedAt: '2025-03-05T15:00:00.000Z',
  type: { id: 'reclamo', label: 'Reclamo' },
  dependency: { id: 'movilidad', name: 'Secretaría de Movilidad' },
  dueDate: '2025-03-27',
  legalDays: 15,
  message: 'Tu solicitud quedó radicada. Guarda el radicado y el código de seguimiento.',
};

export const tracking: TrackingView = {
  radicado: 'PQRSD-2025-000042',
  status: 'answered',
  statusLabel: 'Respondida',
  type: { id: 'reclamo', label: 'Reclamo' },
  dependency: { id: 'movilidad', name: 'Secretaría de Movilidad' },
  urgency: { id: 'high', label: 'Alta' },
  receivedAt: '2025-03-05T15:00:00.000Z',
  dueDate: '2025-03-27',
  slaStatus: 'done',
  slaLabel: 'Respondida',
  businessDaysLeft: 0,
  timeline: [
    { at: '2025-03-05T15:00:00.000Z', event: 'received', label: 'Solicitud recibida' },
    { at: '2025-03-06T15:00:00.000Z', event: 'answered', label: 'Respondida por la entidad' },
  ],
  response: { text: 'Se reprogramó la revisión del semáforo.', answeredAt: '2025-03-06T15:00:00.000Z' },
};

export const trackingOpen: TrackingView = { ...tracking, status: 'assigned', statusLabel: 'Asignada', slaStatus: 'at_risk', slaLabel: 'En riesgo', businessDaysLeft: 2, response: null };

export const publicStats: PublicStats = {
  generatedAt: '2025-03-10T12:00:00.000Z',
  includesDemo: true,
  totals: { received: 120, answered: 80, open: 40, overdue: 6 },
  onTimeRate: 0.875,
  avgBusinessDaysToAnswer: 6.4,
  byType: [{ id: 'peticion', label: 'Petición', count: 70 }, { id: 'queja', label: 'Queja', count: 20 }, { id: 'reclamo', label: 'Reclamo', count: 30 }],
  byDependency: [{ id: 'salud', name: 'Secretaría de Salud', count: 50, openCount: 20, overdueCount: 4 }, { id: 'movilidad', name: 'Secretaría de Movilidad', count: 70, openCount: 20, overdueCount: 2 }],
  weekly: [{ weekStart: '2025-02-24', received: 30, answered: 20 }, { weekStart: '2025-03-03', received: 90, answered: 60 }],
  deadlines: [{ type: 'peticion', subtype: 'general', legalDays: 15, basis: 'Art. 14' }, { type: 'denuncia', legalDays: 15, basis: 'Configurable' }],
};

export const publicStatsEmpty: PublicStats = { ...publicStats, includesDemo: false, totals: { received: 0, answered: 0, open: 0, overdue: 0 }, onTimeRate: null, avgBusinessDaysToAnswer: null, byType: [], byDependency: [], weekly: [], deadlines: [] };

export const staffStats: StaffStats = {
  totals: { all: 120, open: 40, pending_review: 12, overdue: 6, atRisk: 9, needsReview: 7 },
  byType: [{ id: 'peticion', label: 'Petición', count: 70 }],
  byDependency: [{ id: 'salud', name: 'Secretaría de Salud', count: 50, openCount: 20, overdueCount: 4 }],
  byUrgency: [{ id: 'high', label: 'Alta', count: 10 }],
  avgPriority: 47.3,
  avgBusinessDaysToAnswer: 6.4,
  onTimeRate: 0.875,
  aiAgreementRate: 0.9,
  aiAvailable: true,
};

const base = (n: number, over: Partial<Summary>): Summary => ({
  id: `id-${n}`,
  radicado: `PQRSD-2025-${String(n).padStart(6, '0')}`,
  receivedAt: '2025-03-05T15:00:00.000Z',
  excerpt: 'Texto de ejemplo del caso',
  status: 'pending_review',
  type: { id: 'peticion', label: 'Petición' },
  dependency: { id: 'salud', name: 'Secretaría de Salud' },
  urgency: { id: 'medium', label: 'Media' },
  priorityScore: 40,
  needsReview: false,
  dueDate: '2025-03-27',
  businessDaysLeft: 5,
  slaStatus: 'on_time',
  source: 'ai',
  isDemo: false,
  assignee: null,
  extended: false,
  ...over,
});

export const summaries: Summary[] = [
  base(1, { excerpt: 'Mi padre necesita la cirugía y la EPS no la autoriza', urgency: { id: 'critical', label: 'Crítica' }, priorityScore: 93, businessDaysLeft: -2, slaStatus: 'overdue', needsReview: true }),
  base(2, { excerpt: 'El semáforo de la calle 80 no funciona', type: { id: 'reclamo', label: 'Reclamo' }, dependency: { id: 'movilidad', name: 'Secretaría de Movilidad' }, urgency: { id: 'high', label: 'Alta' }, priorityScore: 70, businessDaysLeft: 1, slaStatus: 'at_risk' }),
  base(3, { excerpt: 'Solicito copia del acto administrativo 123', isDemo: true, source: 'fallback' }),
  base(4, { excerpt: 'Sugiero ampliar el horario del punto de atención', type: { id: 'sugerencia', label: 'Sugerencia' }, urgency: { id: 'low', label: 'Baja' }, priorityScore: 12, businessDaysLeft: 9 }),
];

export const detail = (s: Summary): Detail => {
  const text = `${s.excerpt}. Sucedió el 5 de marzo en Bogotá. Mi nombre es Ana Pérez y mi cédula es 52123456.`;
  const span = (t: string) => ({ start: text.indexOf(t), end: text.indexOf(t) + t.length });
  return {
  ...s,
  text,
  channel: 'web',
  extension: null,
  citizen: { name: 'Ana Pérez', email: 'ana@example.com', documentId: '52123456' },
  classification: {
    source: s.source,
    type: { id: s.type.id, confidence: 0.62, reasons: ['El texto contiene «solicito», expresiones propias de una petición.'] },
    dependency: { id: s.dependency.id, confidence: 0.58, routedToFallback: false, reasons: ['Menciona «EPS», asuntos de Secretaría de Salud.'] },
    urgency: { id: s.urgency.id, confidence: 0.6, priorityScore: s.priorityScore, reasons: ['Urgencia por «cirugía».'] },
    subtype: { id: 'general', confidence: 0.5 },
    entities: [
      { type: 'date', label: 'Fecha', text: '5 de marzo', ...span('5 de marzo'), value: '2025-03-05', pii: false, approx: false },
      { type: 'person', label: 'Nombre', text: 'Ana Pérez', ...span('Ana Pérez'), value: null, pii: true, approx: false },
    ],
    reviewReasons: s.needsReview ? ['La IA no está segura de la dependencia competente.'] : [],
    modelVersion: 'hybrid-1741000000',
  },
  effective: { type: s.type.id as Detail['effective']['type'], subtype: 'general', dependency: s.dependency.id, urgency: s.urgency.id as Detail['effective']['urgency'] },
  deadline: { legalDays: 15, basis: 'Art. 14 Ley 1437 de 2011', verify: false, countFrom: '2025-03-06', dueDate: s.dueDate },
  timeline: [{ at: s.receivedAt, event: 'received', by: 'citizen' }, { at: s.receivedAt, event: 'classified', by: 'ai', detail: 'Clasificada por IA' }],
  response: null,
};
};
