import { Icon, type IconName } from './Icon';
import { SLA_LABELS, STATUS_LABELS } from '@/lib/labels';
import type { SlaStatus, Status } from '@/lib/types';

const urgencyClass: Record<string, string> = { critical: 'crit', high: 'high', medium: 'warn', low: 'ok' };

/** Color is never the only signal: every chip carries its text (and the semaphore an icon too). */
export function UrgencyChip({ id, label }: { id: string; label: string }) {
  return <span className={`chip ${urgencyClass[id] ?? ''}`}>{id === 'critical' && <Icon name="alert" />}{label}</span>;
}

const slaClass: Record<SlaStatus, string> = { on_time: 'ok', at_risk: 'warn', overdue: 'crit', done: 'done' };
const slaIcon: Record<SlaStatus, IconName> = { on_time: 'shieldCheck', at_risk: 'hourglass', overdue: 'alert', done: 'checkCircle' };
export function SlaChip({ status, label }: { status: SlaStatus; label?: string }) {
  return <span className={`chip ${slaClass[status]}`}><Icon name={slaIcon[status]} />{label ?? SLA_LABELS[status]}</span>;
}

const statusClass: Record<Status, string> = { pending_review: 'warn', assigned: 'info', answered: 'ok', closed: 'done' };
export function StatusChip({ status, label }: { status: Status; label?: string }) {
  return <span className={`chip ${statusClass[status]}`}>{label ?? STATUS_LABELS[status]}</span>;
}
