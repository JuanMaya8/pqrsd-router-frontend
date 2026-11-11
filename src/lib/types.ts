/** Shapes of pqrsd-router-backend responses (docs/CONTRACT.md §4). */
export type PqrsdType = 'peticion' | 'queja' | 'reclamo' | 'sugerencia' | 'denuncia';
export type Urgency = 'critical' | 'high' | 'medium' | 'low';
export type Subtype = 'general' | 'information' | 'consultation';
export type Status = 'pending_review' | 'assigned' | 'answered' | 'closed';
export type SlaStatus = 'on_time' | 'at_risk' | 'overdue' | 'done';

export const PQRSD_TYPES: PqrsdType[] = ['peticion', 'queja', 'reclamo', 'sugerencia', 'denuncia'];
export const URGENCIES: Urgency[] = ['critical', 'high', 'medium', 'low'];
export const SUBTYPES: Subtype[] = ['general', 'information', 'consultation'];
export const STATUSES: Status[] = ['pending_review', 'assigned', 'answered', 'closed'];
export const SLA_STATUSES: SlaStatus[] = ['overdue', 'at_risk', 'on_time', 'done'];

export interface NamedId { id: string; label: string }
export interface NamedDep { id: string; name: string }

export interface PreviewResult {
  classification: {
    source: 'ai' | 'fallback';
    type: { id: string; label: string; confidence: number; reasons: string[] };
    dependency: { id: string; name: string; confidence: number; reasons: string[] };
    urgency: { id: string; label: string; confidence: number; reasons: string[] };
    subtype: NamedId | null;
    needsReview: boolean;
    entities: Array<{ type: string; label: string; text: string; value: string | null }>;
  };
  deadline: { legalDays: number; dueDate: string; basis: string };
}

export interface CreateBody {
  text: string;
  channel?: 'web';
  citizen?: { name?: string; email?: string; phone?: string; documentId?: string };
  anonymous?: boolean;
  consent: boolean;
}

export interface Receipt {
  radicado: string;
  trackingCode: string;
  receivedAt: string;
  type: NamedId;
  dependency: NamedDep;
  dueDate: string;
  legalDays: number;
  message: string;
}

export interface TrackingView {
  radicado: string;
  status: Status;
  statusLabel: string;
  type: NamedId;
  dependency: NamedDep;
  urgency: NamedId;
  receivedAt: string;
  dueDate: string;
  slaStatus: SlaStatus;
  slaLabel: string;
  businessDaysLeft: number;
  timeline: Array<{ at: string; event: string; label: string }>;
  response: { text: string; answeredAt: string } | null;
}

export interface PublicStats {
  generatedAt: string;
  includesDemo: boolean;
  totals: { received: number; answered: number; open: number; overdue: number };
  onTimeRate: number | null;
  avgBusinessDaysToAnswer: number | null;
  byType: Array<NamedId & { count: number }>;
  byDependency: Array<NamedDep & { count: number; openCount: number; overdueCount: number }>;
  weekly: Array<{ weekStart: string; received: number; answered: number }>;
  deadlines: Array<{ type: string; subtype?: string; legalDays: number; basis: string }>;
}

export interface Taxonomy {
  types: Array<NamedId & { description: string }>;
  urgency: Array<NamedId & { description: string }>;
  subtypes: Array<NamedId & { description: string }>;
  dependencies: Array<NamedDep & { description: string }>;
  fallbackDependency: string;
}

export interface Summary {
  id: string;
  radicado: string;
  receivedAt: string;
  excerpt: string;
  status: Status;
  type: NamedId;
  dependency: NamedDep;
  urgency: NamedId;
  priorityScore: number;
  needsReview: boolean;
  dueDate: string;
  businessDaysLeft: number;
  slaStatus: SlaStatus;
  source: 'ai' | 'fallback';
  isDemo: boolean;
  /** staff member in charge, or null */
  assignee: string | null;
  /** the legal term was extended (Art. 14 parágrafo) */
  extended: boolean;
}

export interface Entity { type: string; label: string; text: string; start: number; end: number; value: string | null; pii: boolean; approx: boolean }

export interface Detail extends Summary {
  text: string;
  channel: string;
  citizen: { name?: string; email?: string; phone?: string; documentId?: string } | null;
  classification: {
    source: 'ai' | 'fallback';
    type: { id: string; confidence: number; reasons: string[] };
    dependency: { id: string; confidence: number; routedToFallback: boolean; reasons: string[] };
    urgency: { id: string; confidence: number; priorityScore: number; reasons: string[] };
    subtype: { id: string; confidence: number } | null;
    entities: Entity[];
    reviewReasons: string[];
    modelVersion: string;
  };
  effective: { type: PqrsdType; subtype: Subtype | null; dependency: string; urgency: Urgency };
  deadline: { legalDays: number; basis: string; verify: boolean; countFrom: string; dueDate: string };
  extension: { days: number; reason: string; at: string; originalDueDate: string } | null;
  timeline: Array<{ at: string; event: string; by: string; detail?: string }>;
  response: { text: string; answeredAt: string } | null;
}

export interface Page<T> { items: T[]; total: number }

export interface StaffStats {
  totals: { all: number; open: number; pending_review: number; overdue: number; atRisk: number; needsReview: number };
  byType: Array<NamedId & { count: number }>;
  byDependency: Array<NamedDep & { count: number; openCount: number; overdueCount: number }>;
  byUrgency: Array<NamedId & { count: number }>;
  avgPriority: number | null;
  avgBusinessDaysToAnswer: number | null;
  onTimeRate: number | null;
  aiAgreementRate: number | null;
  aiAvailable: boolean;
}

export interface AiStatus {
  available: boolean;
  modelVersion: string | null;
  model?: { syntheticSamples: number; feedbackSamples: number; trainedAt: number | null; note: string };
  feedback?: { total: number; sinceLastTraining: number };
}

export interface ListQuery {
  status?: Status | '';
  type?: PqrsdType | '';
  dependency?: string;
  urgency?: Urgency | '';
  sla?: SlaStatus | '';
  needsReview?: boolean;
  q?: string;
  sort?: 'priority:desc' | 'dueDate:asc' | 'receivedAt:desc';
  limit?: number;
  offset?: number;
}
