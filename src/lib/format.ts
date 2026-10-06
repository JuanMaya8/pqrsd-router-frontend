const nf = new Intl.NumberFormat('es-CO');
export const fmtInt = (n: number): string => nf.format(Math.round(n));
export const fmtPct = (r: number | null): string => (r === null ? '—' : `${nf.format(Math.round(r * 1000) / 10)} %`);
export const fmtNum1 = (n: number | null): string => (n === null ? '—' : new Intl.NumberFormat('es-CO', { maximumFractionDigits: 1 }).format(n));

export function fmtDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Bogota' });
}

/** `YYYY-MM-DD` civil date → «31 de mar. de 2025» (exact wording depends on the ICU data) (no timezone shifting: it is already a Bogotá civil date). */
export function fmtDay(day: string): string {
  const d = new Date(`${day}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return day;
  return d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
}

export function fmtDayLong(day: string): string {
  const d = new Date(`${day}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return day;
  return d.toLocaleDateString('es-CO', { dateStyle: 'full', timeZone: 'UTC' });
}

export function plural(n: number, one: string, many: string): string {
  return `${fmtInt(n)} ${Math.abs(n) === 1 ? one : many}`;
}

/** «vence en 3 días hábiles» / «venció hace 2 días hábiles» / «vence hoy». */
export function dueText(daysLeft: number, sla: string): string {
  if (sla === 'done') return 'Respondida';
  if (daysLeft === 0) return 'Vence hoy';
  if (daysLeft > 0) return `Vence en ${plural(daysLeft, 'día hábil', 'días hábiles')}`;
  return `Venció hace ${plural(-daysLeft, 'día hábil', 'días hábiles')}`;
}

export function downloadBlob(fileName: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
