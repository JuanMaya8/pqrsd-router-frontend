'use client';

import { useEffect, useRef, useState } from 'react';
import { ClassificationPreview } from './ClassificationPreview';
import { ReceiptCard } from './ReceiptCard';
import { ApiError, api, errorMessage } from '@/lib/api';
import { fmtInt } from '@/lib/format';
import { useDebounced } from '@/lib/useDebounced';
import type { PreviewResult, Receipt } from '@/lib/types';

const MIN = 10;
const MAX = 10_000;
const PREVIEW_MIN = 25;

export function RadicarForm() {
  const [text, setText] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [documentId, setDocumentId] = useState('');
  const [anonymous, setAnonymous] = useState(false);
  const [consent, setConsent] = useState(false);
  const [preview, setPreview] = useState<{ state: 'idle' | 'loading' | 'ready' | 'error'; data?: PreviewResult; message?: string }>({ state: 'idle' });
  const [sending, setSending] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const debounced = useDebounced(text.trim(), 700);
  const seq = useRef(0);

  useEffect(() => {
    if (debounced.length < PREVIEW_MIN) {
      setPreview({ state: 'idle' });
      return;
    }
    const ctrl = new AbortController();
    const mine = ++seq.current;
    setPreview((p) => ({ ...p, state: 'loading' }));
    api
      .preview(debounced, ctrl.signal)
      .then((data) => mine === seq.current && setPreview({ state: 'ready', data }))
      .catch((e) => {
        if (mine !== seq.current || (e instanceof DOMException && e.name === 'AbortError')) return;
        setPreview({ state: 'error', message: e instanceof ApiError && e.status === 429 ? 'Hiciste muchas consultas seguidas; espera un momento.' : 'No pudimos mostrar la vista previa, pero igual puedes radicar.' });
      });
    return () => ctrl.abort();
  }, [debounced]);

  const reset = (): void => {
    setText(''); setName(''); setEmail(''); setPhone(''); setDocumentId(''); setAnonymous(false); setConsent(false);
    setReceipt(null); setErrors([]); setPreview({ state: 'idle' });
  };

  const submit = async (ev: { preventDefault(): void }): Promise<void> => {
    ev.preventDefault();
    const problems: string[] = [];
    if (text.trim().length < MIN) problems.push(`Cuéntanos tu caso con al menos ${MIN} caracteres.`);
    if (text.length > MAX) problems.push(`El texto no puede superar ${fmtInt(MAX)} caracteres.`);
    if (!consent) problems.push('Debes aceptar el tratamiento de tus datos personales para radicar.');
    setErrors(problems);
    if (problems.length) return;
    setSending(true);
    try {
      const citizen = anonymous ? undefined : { name: name.trim() || undefined, email: email.trim() || undefined, phone: phone.trim() || undefined, documentId: documentId.trim() || undefined };
      setReceipt(await api.create({ text: text.trim(), citizen, anonymous, consent }));
    } catch (e) {
      setErrors([errorMessage(e)]);
    } finally {
      setSending(false);
    }
  };

  if (receipt) return <ReceiptCard r={receipt} onNew={reset} />;

  const tooLong = text.length > MAX;
  return (
    <form className="grid" style={{ gridTemplateColumns: 'minmax(0, 3fr) minmax(0, 2fr)', alignItems: 'start' }} onSubmit={submit} noValidate>
      <div className="stack">
        <div className="field">
          <label htmlFor="text">Cuéntanos qué necesitas, con tus palabras</label>
          <textarea
            id="text"
            className="input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            aria-describedby="text-help text-count"
            placeholder="Ej.: Hace tres semanas no llega el agua a mi barrio Santa Lucía y tengo un bebé en casa…"
          />
          <div className="row spread">
            <span id="text-help" className="small muted">Incluye dónde y desde cuándo ocurre. No escribas contraseñas ni datos bancarios.</span>
            <span id="text-count" className={`counter ${tooLong ? 'bad' : ''}`}>{fmtInt(text.length)} / {fmtInt(MAX)}</span>
          </div>
        </div>

        <fieldset className="card flat" style={{ border: '1px solid var(--line)' }}>
          <legend className="small muted" style={{ padding: '0 6px' }}>Tus datos de contacto (opcionales)</legend>
          <label className="check" style={{ marginBottom: 12 }}>
            <input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} />
            <span>Radicar de forma anónima. <span className="muted">No podremos escribirte; consultarás la respuesta con tu número y tu código.</span></span>
          </label>
          {!anonymous && (
            <div className="grid cols-2">
              <div className="field"><label htmlFor="name">Nombre</label><input id="name" className="input" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} /></div>
              <div className="field"><label htmlFor="email">Correo electrónico</label><input id="email" type="email" className="input" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
              <div className="field"><label htmlFor="phone">Teléfono</label><input id="phone" type="tel" className="input" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
              <div className="field"><label htmlFor="doc">Documento de identidad</label><input id="doc" className="input" value={documentId} onChange={(e) => setDocumentId(e.target.value)} /></div>
            </div>
          )}
        </fieldset>

        <label className="check">
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
          <span>Autorizo el tratamiento de mis datos personales para gestionar esta solicitud (Ley 1581 de 2012).</span>
        </label>

        {errors.length > 0 && (
          <div className="alert error" role="alert">
            {errors.map((m) => <div key={m}>{m}</div>)}
          </div>
        )}
        <div className="row">
          <button className="btn primary lg" type="submit" disabled={sending}>{sending ? 'Radicando…' : 'Radicar solicitud'}</button>
        </div>
      </div>

      <aside className="card preview" aria-label="Vista previa de la clasificación" aria-live="polite">
        <p className="eyebrow">Vista previa</p>
        <h2 style={{ fontSize: '1.1rem' }}>Esto es lo que entendimos</h2>
        {preview.state === 'idle' && <p className="muted small" data-testid="preview-idle">Escribe tu caso (al menos {PREVIEW_MIN} caracteres) y verás aquí el tipo de solicitud, la dependencia a la que irá y el plazo legal de respuesta.</p>}
        {preview.state === 'loading' && !preview.data && <div className="skeleton" style={{ height: 120 }} aria-label="Analizando" />}
        {preview.state === 'error' && <p className="alert warn small">{preview.message}</p>}
        {preview.data && preview.state !== 'error' && <div data-testid="preview-ready" style={{ opacity: preview.state === 'loading' ? 0.55 : 1 }}><ClassificationPreview p={preview.data} /></div>}
        <p className="small muted" style={{ marginTop: 12, marginBottom: 0 }}>La clasificación es automática y un funcionario la confirma. No cambia tu derecho a recibir respuesta.</p>
      </aside>
    </form>
  );
}
