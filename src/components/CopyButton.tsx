'use client';

import { useState } from 'react';
import { Icon } from './Icon';

export function CopyButton({ value, label = 'Copiar' }: { value: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className="btn sm"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setDone(true);
          setTimeout(() => setDone(false), 1800);
        } catch {
          /* clipboard blocked: the value is on screen to copy by hand */
        }
      }}
    >
      <Icon name={done ? 'check' : 'copy'} size={16} />
      <span aria-live="polite">{done ? 'Copiado' : label}</span>
    </button>
  );
}
