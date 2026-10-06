'use client';

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="alert error" role="alert" style={{ marginTop: 24 }}>
      <b>Algo salió mal al cargar esta página.</b>
      <p className="small" style={{ margin: '6px 0 12px' }}>Puede ser un fallo temporal. Intenta de nuevo; si persiste, vuelve más tarde.</p>
      <button className="btn" onClick={reset}>Reintentar</button>
    </div>
  );
}
