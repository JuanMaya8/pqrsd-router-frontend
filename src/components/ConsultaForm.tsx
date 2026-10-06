'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

const RADICADO = /^PQRSD-\d{4}-\d{6}$/;

export function ConsultaForm() {
  const router = useRouter();
  const [radicado, setRadicado] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const go = (ev: { preventDefault(): void }): void => {
    ev.preventDefault();
    const r = radicado.trim().toUpperCase();
    const c = code.trim().toUpperCase();
    if (!RADICADO.test(r)) return setError('El número de radicado tiene el formato PQRSD-2025-000123.');
    if (!/^[A-Z0-9]{6}$/.test(c)) return setError('El código de seguimiento tiene 6 letras o números.');
    setError('');
    router.push(`/consulta/${r}?code=${c}`);
  };

  return (
    <form className="card stack" onSubmit={go} noValidate style={{ maxWidth: 520 }}>
      <div className="field">
        <label htmlFor="radicado">Número de radicado</label>
        <input id="radicado" className="input mono" placeholder="PQRSD-2025-000123" value={radicado} onChange={(e) => setRadicado(e.target.value)} autoComplete="off" />
      </div>
      <div className="field">
        <label htmlFor="code">Código de seguimiento</label>
        <input id="code" className="input mono" placeholder="K7M2QX" maxLength={6} value={code} onChange={(e) => setCode(e.target.value)} autoComplete="off" />
      </div>
      {error && <p className="alert error" role="alert">{error}</p>}
      <button className="btn primary" type="submit">Consultar</button>
    </form>
  );
}
