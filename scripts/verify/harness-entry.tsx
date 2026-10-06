/** Browser entry for `npm run verify:browser`: mounts the real components (next/link and next/navigation are aliased to stubs). */
import { createRoot, type Root } from 'react-dom/client';
import { ConsultaForm } from '../../src/components/ConsultaForm';
import { RadicarForm } from '../../src/components/RadicarForm';
import { TrackingView } from '../../src/components/TrackingView';
import { TransparencyView } from '../../src/components/TransparencyView';
import { FuncionarioApp } from '../../src/components/funcionario/FuncionarioApp';
import type { SocketFactory, SocketLike } from '../../src/components/funcionario/useRealtime';
import { publicStats, trackingOpen } from '../../tests/fixtures/data';
import '../../src/app/globals.css';

type Handler = (payload: unknown) => void;
const handlers = new Map<string, Handler[]>();
let socketsOpened = 0;
let socketsClosed = 0;
const factory: SocketFactory = async (_origin, staffKey) => {
  socketsOpened++;
  (window as unknown as { __socketKey?: string }).__socketKey = staffKey;
  const s: SocketLike = {
    on: (e, cb) => { handlers.set(e, [...(handlers.get(e) ?? []), cb]); },
    close: () => { socketsClosed++; handlers.clear(); },
  };
  return s;
};

let root: Root | null = null;
const el = (): HTMLElement => document.getElementById('app')!;

const Harness = {
  mount(name: 'radicar' | 'consulta' | 'funcionario' | 'tracking' | 'transparencia') {
    root?.unmount();
    el().innerHTML = '';
    root = createRoot(el());
    const node = { radicar: <RadicarForm />, consulta: <ConsultaForm />, funcionario: <FuncionarioApp socketFactory={factory} />, tracking: <TrackingView t={trackingOpen} />, transparencia: <TransparencyView s={publicStats} /> }[name];
    root.render(node);
  },
  unmount() { root?.unmount(); root = null; },
  emit(event: string) { (handlers.get(event) ?? []).forEach((h) => h({})); },
  sockets: () => ({ opened: socketsOpened, closed: socketsClosed }),
};
(window as unknown as { Harness: typeof Harness }).Harness = Harness;
