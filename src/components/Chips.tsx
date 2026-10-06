import { SLA_LABELS, STATUS_LABELS } from '@/lib/labels';
import type { SlaStatus, Status } from '@/lib/types';

const urgencyClass: Record<string, string> = { critical: 'crit', high: 'high', medium: 'warn', low: 'ok' };

/** Color is never the only signal: every chip carries its text. */
export function UrgencyChip({ id, label }: { id: string; label: string }) {
  return <span className={`chip ${urgencyClass[id] ?? ''}`}>{id === 'critical' ? '⚠ ' : ''}{label}</span>;
}

const slaClass: Record<SlaStatus, string> = { on_time: 'ok', at_risk: 'warn', overdue: 'crit', done: 'info' };
export function SlaChip({ status, label }: { status: SlaStatus; label?: string }) {
  return <span className={`chip ${slaClass[status]}`}><span className="dot" aria-hidden="true" />{label ?? SLA_LABELS[status]}</span>;
}

const statusClass: Record<Status, string> = { pending_review: 'warn', assigned: 'info', answered: 'ok', closed: '' };
export function StatusChip({ status, label }: { status: Status; label?: string }) {
  return <span className={`chip ${statusClass[status]}`}>{label ?? STATUS_LABELS[status]}</span>;
}
