import type { SlaStatus, Status, Subtype, Urgency } from './types';

export const STATUS_LABELS: Record<Status, string> = {
  pending_review: 'En revisión',
  assigned: 'Asignada',
  answered: 'Respondida',
  closed: 'Cerrada',
};

export const SLA_LABELS: Record<SlaStatus, string> = {
  on_time: 'En términos',
  at_risk: 'En riesgo',
  overdue: 'Vencida',
  done: 'Respondida',
};

export const URGENCY_LABELS: Record<Urgency, string> = { critical: 'Crítica', high: 'Alta', medium: 'Media', low: 'Baja' };
export const SUBTYPE_LABELS: Record<Subtype, string> = { general: 'Petición general', information: 'Información o documentos', consultation: 'Consulta' };

export const TYPE_HINTS: Record<string, string> = {
  peticion: 'Solicitas información, un documento o una actuación de la entidad.',
  queja: 'Te inconformas con la conducta de un servidor público.',
  reclamo: 'Un servicio no se prestó o se prestó mal y pides solución.',
  sugerencia: 'Propones una mejora.',
  denuncia: 'Informas hechos presuntamente irregulares o ilegales.',
};
