import { fmtInt, fmtNum1, fmtPct } from '@/lib/format';
import type { SlaStatus, StaffStats } from '@/lib/types';

export function StatsPanel({ s, onFilter }: { s: StaffStats; onFilter: (f: { sla?: SlaStatus; needsReview?: boolean; status?: 'pending_review' }) => void }) {
  const card = (cls: string, value: string, label: string, onClick?: () => void, testId?: string) => {
    const inner = (<><b>{value}</b><span>{label}</span></>);
    return onClick ? (
      <button type="button" className={`card stat ${cls}`} style={{ textAlign: 'left', cursor: 'pointer' }} onClick={onClick} data-testid={testId}>{inner}</button>
    ) : (
      <div className={`card stat ${cls}`} data-testid={testId}>{inner}</div>
    );
  };
  return (
    <section className="grid cols-5" aria-label="Indicadores de la bandeja">
      {card('', fmtInt(s.totals.open), 'Abiertas')}
      {card(s.totals.needsReview ? 'warn' : '', fmtInt(s.totals.needsReview), 'Por confirmar (IA con dudas)', () => onFilter({ needsReview: true }), 'kpi-review')}
      {card(s.totals.atRisk ? 'warn' : '', fmtInt(s.totals.atRisk), 'En riesgo de vencer', () => onFilter({ sla: 'at_risk' }), 'kpi-risk')}
      {card(s.totals.overdue ? 'crit' : '', fmtInt(s.totals.overdue), 'Vencidas', () => onFilter({ sla: 'overdue' }), 'kpi-overdue')}
      {card('ok', fmtPct(s.onTimeRate), 'Respondidas a tiempo', undefined, 'kpi-ontime')}
      {card('', fmtNum1(s.avgBusinessDaysToAnswer), 'Días hábiles promedio de respuesta')}
      {card('', fmtNum1(s.avgPriority), 'Prioridad media de lo abierto (0–100)')}
      {card('', fmtPct(s.aiAgreementRate), 'Acuerdo de los funcionarios con la IA', undefined, 'kpi-agreement')}
      {card('', fmtInt(s.totals.all), 'Total de solicitudes')}
      {card(s.aiAvailable ? 'ok' : 'crit', s.aiAvailable ? 'Activa' : 'Caída', s.aiAvailable ? 'IA clasificando' : 'IA no disponible: se usa respaldo', undefined, 'kpi-ai')}
    </section>
  );
}
