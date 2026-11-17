import { Icon, type IconName } from '../Icon';
import { fmtInt, fmtNum1, fmtPct } from '@/lib/format';
import type { SlaStatus, StaffStats } from '@/lib/types';

export function StatsPanel({ s, onFilter }: { s: StaffStats; onFilter: (f: { sla?: SlaStatus; needsReview?: boolean; status?: 'pending_review' }) => void }) {
  const card = (cls: string, value: string, label: string, onClick?: () => void, testId?: string, icon: IconName = 'chart') => {
    const inner = (<><span className="stat-top"><b>{value}</b><Icon name={icon} size={20} /></span><span>{label}</span></>);
    return onClick ? (
      <button type="button" className={`card stat ${cls}`} style={{ textAlign: 'left', cursor: 'pointer' }} onClick={onClick} data-testid={testId}>{inner}</button>
    ) : (
      <div className={`card stat ${cls}`} data-testid={testId}>{inner}</div>
    );
  };
  return (
    <section className="kpis" aria-label="Indicadores de la bandeja">
      {card('', fmtInt(s.totals.open), 'Abiertas', undefined, undefined, 'inbox')}
      {card(s.totals.needsReview ? 'warn' : '', fmtInt(s.totals.needsReview), 'Por confirmar (IA con dudas)', () => onFilter({ needsReview: true }), 'kpi-review', 'sparkles')}
      {card(s.totals.atRisk ? 'warn' : '', fmtInt(s.totals.atRisk), 'En riesgo de vencer', () => onFilter({ sla: 'at_risk' }), 'kpi-risk', 'hourglass')}
      {card(s.totals.overdue ? 'crit' : '', fmtInt(s.totals.overdue), 'Vencidas', () => onFilter({ sla: 'overdue' }), 'kpi-overdue', 'alert')}
      {card('ok', fmtPct(s.onTimeRate), 'Respondidas a tiempo', undefined, 'kpi-ontime', 'shieldCheck')}
      {card('', fmtNum1(s.avgBusinessDaysToAnswer), 'Días hábiles promedio de respuesta', undefined, undefined, 'clock')}
      {card('', fmtNum1(s.avgPriority), 'Prioridad media de lo abierto (0–100)', undefined, undefined, 'chart')}
      {card('', fmtPct(s.aiAgreementRate), 'Acuerdo de los funcionarios con la IA', undefined, 'kpi-agreement', 'checkCircle')}
      {card('', fmtInt(s.totals.all), 'Total de solicitudes', undefined, undefined, 'database')}
      {card(s.aiAvailable ? 'ok' : 'crit', s.aiAvailable ? 'Activa' : 'Caída', s.aiAvailable ? 'IA clasificando' : 'IA no disponible: se usa respaldo', undefined, 'kpi-ai', s.aiAvailable ? 'sparkles' : 'alert')}
    </section>
  );
}
