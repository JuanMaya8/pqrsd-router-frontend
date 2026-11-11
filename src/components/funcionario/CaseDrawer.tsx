'use client';

import { useCallback, useEffect, useState } from 'react';
import { SlaChip, StatusChip, UrgencyChip } from '../Chips';
import { Timeline } from '../Timeline';
import { errorMessage, type StaffApi } from '@/lib/api';
import { dueText, fmtDay, fmtDateTime } from '@/lib/format';
import { SUBTYPE_LABELS } from '@/lib/labels';
import { segmentText } from '@/lib/segments';
import { PQRSD_TYPES, SUBTYPES, URGENCIES, type Detail, type Taxonomy } from '@/lib/types';

const pct = (c: number): string => `${Math.round(c * 100)} %`;
const EVENT_ES: Record<string, string> = { received: 'Recibida', classified: 'Clasificada', confirmed: 'Confirmada por funcionario', reclassified: 'Reclasificada por funcionario', assigned: 'Responsable asignado', extended: 'Plazo ampliado', transferred: 'Trasladada por competencia', answered: 'Respondida', closed: 'Cerrada' };
const BY_ES: Record<string, string> = { citizen: 'ciudadano', ai: 'IA', fallback: 'respaldo', staff: 'funcionario', system: 'sistema' };

export function CaseDrawer({ id, api, taxonomy, me = null, onClose, onChanged }: { id: string; api: StaffApi; taxonomy: Taxonomy; me?: string | null; onClose: () => void; onChanged: () => void }) {
  const [d, setD] = useState<Detail | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ type: '', subtype: '', dependency: '', urgency: '' });
  const [response, setResponse] = useState('');
  const [assignee, setAssignee] = useState('');
  const [ext, setExt] = useState({ days: '', reason: '' });
  const [tr, setTr] = useState({ entity: '', reason: '' });

  const load = useCallback(async () => {
    try {
      const detail = await api.get(id);
      setD(detail);
      setAssignee(detail.assignee ?? '');
      setForm({ type: detail.effective.type, subtype: detail.effective.subtype ?? '', dependency: detail.effective.dependency, urgency: detail.effective.urgency });
      setError('');
    } catch (e) {
      setError(errorMessage(e));
    }
  }, [api, id]);
  useEffect(() => { setD(null); void load(); }, [load]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const run = async (fn: () => Promise<Detail>): Promise<void> => {
    setBusy(true);
    setError('');
    try {
      const next = await fn();
      setD(next);
      setAssignee(next.assignee ?? '');
      setExt({ days: '', reason: '' });
      setForm({ type: next.effective.type, subtype: next.effective.subtype ?? '', dependency: next.effective.dependency, urgency: next.effective.urgency });
      setResponse('');
      onChanged();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const changed = d && (form.type !== d.effective.type || form.dependency !== d.effective.dependency || form.urgency !== d.effective.urgency || (form.type === 'peticion' && form.subtype !== (d.effective.subtype ?? '')));
  const open = d && (d.status === 'pending_review' || d.status === 'assigned');
  const extDays = Number(ext.days);
  const canExtend = open && !d.extension && d.slaStatus !== 'overdue';
  const extValid = Number.isInteger(extDays) && extDays >= 1 && d !== null && extDays <= d.deadline.legalDays && ext.reason.trim().length >= 20;

  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} aria-hidden="true" />
      <aside className="drawer" role="dialog" aria-modal="true" aria-label="Detalle de la solicitud" data-testid="drawer">
        <div className="row spread" style={{ marginBottom: 12 }}>
          <h2 style={{ margin: 0 }} className="mono">{d?.radicado ?? '…'}</h2>
          <button className="btn sm" onClick={onClose}>Cerrar ✕</button>
        </div>
        {error && <p className="alert error" role="alert">{error}</p>}
        {!d && !error && <div className="skeleton" style={{ height: 200 }} />}
        {d && (
          <div className="stack">
            <div className="row">
              <StatusChip status={d.status} /><SlaChip status={d.slaStatus} /><UrgencyChip id={d.urgency.id} label={`Urgencia ${d.urgency.label.toLowerCase()}`} />
              {d.isDemo && <span className="chip">demo</span>}
            </div>

            <section>
              <h3>Texto del ciudadano</h3>
              <div className="text-block" data-testid="case-text">
                {segmentText(d.text, d.classification.entities).map((s, i) =>
                  s.entity ? <mark key={i} className={`ent ${s.entity.pii ? 'pii' : ''}`} title={`${s.entity.label}${s.entity.pii ? ' · dato personal' : ''}`}>{s.text}</mark> : <span key={i}>{s.text}</span>,
                )}
              </div>
              <p className="small muted">Subrayado: entidades detectadas por la IA; en rojo, datos personales.</p>
            </section>

            <section>
              <h3>Lo que dijo la IA {d.classification.source === 'fallback' && <span className="chip crit">respaldo por palabras clave</span>}</h3>
              <table className="kvtable">
                <tbody>
                  <tr><td>Tipo</td><td><b>{d.type.label}</b> <span className="muted small">({pct(d.classification.type.confidence)})</span><Reasons items={d.classification.type.reasons} /></td></tr>
                  <tr><td>Dependencia</td><td><b>{d.dependency.name}</b> <span className="muted small">({pct(d.classification.dependency.confidence)})</span><Reasons items={d.classification.dependency.reasons} /></td></tr>
                  <tr><td>Urgencia</td><td><b>{d.urgency.label}</b> <span className="muted small">(prioridad {Math.round(d.priorityScore)})</span><Reasons items={d.classification.urgency.reasons} /></td></tr>
                  {d.classification.reviewReasons.length > 0 && <tr><td>Alertas</td><td><Reasons items={d.classification.reviewReasons} /></td></tr>}
                  <tr><td>Modelo</td><td className="small muted">{d.classification.modelVersion}</td></tr>
                </tbody>
              </table>
            </section>

            <section>
              <h3>Plazo legal</h3>
              <p style={{ marginBottom: 4 }}><b>{d.deadline.legalDays} días hábiles</b> → vence <b>{fmtDay(d.dueDate)}</b> · {dueText(d.businessDaysLeft, d.slaStatus)}</p>
              <p className="small muted">{d.deadline.basis}{d.deadline.verify && <b> Verificar con el área jurídica.</b>}</p>
              {d.extension && (
                <p className="alert" data-testid="extension">
                  Plazo ampliado {d.extension.days} días hábiles (antes vencía el {fmtDay(d.extension.originalDueDate)}). Motivo: {d.extension.reason}
                </p>
              )}
            </section>

            {open && (
              <section className="card flat stack" aria-label="Responsable">
                <h3 style={{ margin: 0 }}>Responsable</h3>
                <div className="row">
                  <div className="field" style={{ flex: 1, minWidth: 200 }}><label htmlFor="d-f-assignee">Funcionario a cargo</label>
                    <input id="d-f-assignee" className="input" value={assignee} maxLength={120} placeholder="Nombre y apellido" onChange={(e) => setAssignee(e.target.value)} /></div>
                  <button className="btn" disabled={busy || assignee.trim() === (d.assignee ?? '') || (assignee.trim().length > 0 && assignee.trim().length < 3)} onClick={() => run(() => api.assign(d.id, assignee.trim() || null))}>
                    {assignee.trim() ? 'Asignar' : 'Quitar responsable'}
                  </button>
                </div>
              </section>
            )}

            {canExtend && (
              <details className="card flat" aria-label="Ampliar plazo">
                <summary style={{ cursor: 'pointer', fontWeight: 650 }}>Ampliar el plazo (Art. 14, parágrafo, Ley 1437 de 2011)</summary>
                <div className="stack" style={{ marginTop: 10 }}>
                  <p className="small muted" style={{ margin: 0 }}>Solo una vez y antes del vencimiento. El nuevo plazo no puede superar el doble del inicial (máximo {d.deadline.legalDays} días hábiles más). Si el ciudadano dejó correo, se le informa el motivo y la nueva fecha.</p>
                  <div className="field" style={{ maxWidth: 200 }}><label htmlFor="d-f-days">Días hábiles adicionales</label>
                    <input id="d-f-days" className="input" type="number" min={1} max={d.deadline.legalDays} value={ext.days} onChange={(e) => setExt({ ...ext, days: e.target.value })} /></div>
                  <div className="field"><label htmlFor="d-f-reason">Motivo (se informa al ciudadano)</label>
                    <textarea id="d-f-reason" className="input" style={{ minHeight: 80 }} maxLength={1000} value={ext.reason} placeholder="Explica por qué no es posible responder a tiempo (mínimo 20 caracteres)…" onChange={(e) => setExt({ ...ext, reason: e.target.value })} /></div>
                  <div><button className="btn" disabled={busy || !extValid} onClick={() => run(() => api.extend(d.id, extDays, ext.reason.trim()))}>Ampliar plazo</button></div>
                </div>
              </details>
            )}

            {d.citizen && (
              <section>
                <h3>Ciudadano <span className="chip crit">dato personal</span></h3>
                <table className="kvtable"><tbody>
                  {d.citizen.name && <tr><td>Nombre</td><td>{d.citizen.name}</td></tr>}
                  {d.citizen.email && <tr><td>Correo</td><td>{d.citizen.email}</td></tr>}
                  {d.citizen.phone && <tr><td>Teléfono</td><td>{d.citizen.phone}</td></tr>}
                  {d.citizen.documentId && <tr><td>Documento</td><td>{d.citizen.documentId}</td></tr>}
                </tbody></table>
              </section>
            )}

            {open && (
              <section className="card flat stack" aria-label="Revisar clasificación">
                <h3 style={{ margin: 0 }}>Revisar y asignar</h3>
                <div className="grid cols-2">
                  <div className="field"><label htmlFor="d-f-type">Tipo</label>
                    <select id="d-f-type" className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value, subtype: e.target.value === 'peticion' ? form.subtype || 'general' : '' })}>
                      {PQRSD_TYPES.map((t) => <option key={t} value={t}>{taxonomy.types.find((x) => x.id === t)?.label ?? t}</option>)}
                    </select></div>
                  <div className="field"><label htmlFor="d-f-sub">Subtipo (peticiones)</label>
                    <select id="d-f-sub" className="input" disabled={form.type !== 'peticion'} value={form.type === 'peticion' ? form.subtype : ''} onChange={(e) => setForm({ ...form, subtype: e.target.value })}>
                      <option value="">—</option>{SUBTYPES.map((t) => <option key={t} value={t}>{SUBTYPE_LABELS[t]}</option>)}
                    </select></div>
                  <div className="field"><label htmlFor="d-f-dep">Dependencia</label>
                    <select id="d-f-dep" className="input" value={form.dependency} onChange={(e) => setForm({ ...form, dependency: e.target.value })}>
                      {taxonomy.dependencies.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
                    </select></div>
                  <div className="field"><label htmlFor="d-f-urg">Urgencia</label>
                    <select id="d-f-urg" className="input" value={form.urgency} onChange={(e) => setForm({ ...form, urgency: e.target.value })}>
                      {URGENCIES.map((u) => <option key={u} value={u}>{taxonomy.urgency.find((x) => x.id === u)?.label ?? u}</option>)}
                    </select></div>
                </div>
                <div className="row">
                  {changed ? (
                    <button className="btn primary" disabled={busy} onClick={() => run(() => api.reclassify(d.id, { type: form.type, dependency: form.dependency, urgency: form.urgency, ...(form.type === 'peticion' ? { subtype: form.subtype || 'general' } : {}) }))}>Guardar corrección</button>
                  ) : (
                    d.status === 'pending_review' && <button className="btn primary" disabled={busy} onClick={() => run(() => api.confirm(d.id))}>Confirmar clasificación de la IA</button>
                  )}
                  {changed && <span className="small muted">Tu corrección también entrena a la IA (sin datos personales).</span>}
                </div>
              </section>
            )}

            {open && (
              <section className="stack" aria-label="Responder">
                <h3 style={{ margin: 0 }}>Responder al ciudadano</h3>
                <div className="field"><label htmlFor="resp" className="sr-only">Respuesta</label>
                  <textarea id="resp" className="input" style={{ minHeight: 110 }} value={response} onChange={(e) => setResponse(e.target.value)} placeholder="Escribe la respuesta oficial (mínimo 10 caracteres)…" /></div>
                <div><button className="btn primary" disabled={busy || response.trim().length < 10} onClick={() => run(() => api.answer(d.id, response.trim()))}>Enviar respuesta</button></div>
              </section>
            )}

            {d.response && (
              <section>
                <h3>Respuesta enviada</h3>
                <p className="small muted">{fmtDateTime(d.response.answeredAt)}</p>
                <div className="text-block">{d.response.text}</div>
                {d.status === 'answered' && <div style={{ marginTop: 10 }}><button className="btn" disabled={busy} onClick={() => run(() => api.close(d.id))}>Cerrar solicitud</button></div>}
              </section>
            )}

            <section>
              <h3>Historial</h3>
              <Timeline items={d.timeline.map((t) => ({ at: t.at, label: `${EVENT_ES[t.event] ?? t.event} · ${BY_ES[t.by] ?? t.by}`, detail: t.detail }))} />
            </section>
          </div>
        )}
      </aside>
    </>
  );
}

function Reasons({ items }: { items: string[] }) {
  if (!items.length) return null;
  return <ul className="small muted" style={{ margin: '4px 0 0', paddingLeft: 18 }}>{items.map((r) => <li key={r}>{r}</li>)}</ul>;
}
