import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ClassificationPreview } from '../src/components/ClassificationPreview';
import { Inbox } from '../src/components/funcionario/Inbox';
import { StatsPanel } from '../src/components/funcionario/StatsPanel';
import { ReceiptCard } from '../src/components/ReceiptCard';
import { TrackingView } from '../src/components/TrackingView';
import { TransparencyView } from '../src/components/TransparencyView';
import { preview, publicStats, publicStatsEmpty, receipt, staffStats, summaries, tracking, trackingOpen } from './fixtures/data';

const html = (el: ReactElement): string => renderToStaticMarkup(el);
const text = (h: string): string => h.replace(/<[^>]+>/g, ' ').replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, ' ');

test('TrackingView: respondida muestra la respuesta, el radicado y el historial', () => {
  const t = text(html(<TrackingView t={tracking} />));
  assert.match(t, /PQRSD-2025-000042/);
  assert.match(t, /Se reprogramó la revisión del semáforo/);
  assert.match(t, /Solicitud recibida/);
  assert.doesNotMatch(t, /aún no ha respondido/);
});

test('TrackingView: sin respuesta avisa el plazo y no muestra datos personales', () => {
  const h = html(<TrackingView t={trackingOpen} />);
  const t = text(h);
  assert.match(t, /aún no ha respondido/);
  assert.match(t, /Vence en 2 días hábiles/);
  assert.doesNotMatch(h, /@|cédula|documentId/);
});

test('TrackingView: un caso trasladado (Art. 21) dice a qué autoridad se remitió', () => {
  const t = text(html(<TrackingView t={{ ...tracking, status: 'closed', statusLabel: 'Cerrada', transfer: { entity: 'Superintendencia de Salud', at: '2025-03-06T15:00:00.000Z' } }} />));
  assert.match(t, /trasladada a Superintendencia de Salud/);
  assert.match(t, /Art\. 21/);
  assert.doesNotMatch(text(html(<TrackingView t={tracking} />)), /trasladada/);
});

test('TransparencyView: con demo avisa que son datos simulados; sin datos no divide por cero', () => {
  assert.match(text(html(<TransparencyView s={publicStats} />)), /Datos de demostración/);
  assert.match(text(html(<TransparencyView s={publicStats} />)), /87,5 %/);
  const empty = text(html(<TransparencyView s={publicStatsEmpty} />));
  assert.doesNotMatch(empty, /NaN|Infinity|undefined/);
  assert.doesNotMatch(empty, /Datos de demostración/);
});

test('ClassificationPreview muestra tipo, dependencia, plazo y las entidades', () => {
  const t = text(html(<ClassificationPreview p={preview} />));
  assert.match(t, /Reclamo/);
  assert.match(t, /Secretaría de Movilidad/);
  assert.match(t, /15 días hábiles/);
  assert.match(t, /5 de marzo/);
});

test('ClassificationPreview avisa cuando se usó el respaldo sin IA', () => {
  const p = { ...preview, classification: { ...preview.classification, source: 'fallback' as const } };
  assert.match(text(html(<ClassificationPreview p={p} />)), /no está disponible/);
});

test('ReceiptCard muestra radicado y código de seguimiento', () => {
  const t = text(html(<ReceiptCard r={receipt} onNew={() => undefined} />));
  assert.match(t, /PQRSD-2025-000042/);
  assert.match(t, /K7M2QX/);
});

test('Inbox: fila por caso, marcas de demo / por confirmar / sin IA y estado vacío', () => {
  const h = html(<Inbox items={summaries} total={4} selectedId={null} onOpen={() => undefined} loading={false} />);
  assert.equal((h.match(/<tr/g) ?? []).length, 1 + summaries.length);
  assert.match(text(h), /Por confirmar/);
  assert.match(text(h), /demo/);
  assert.match(text(h), /Sin IA/);
  assert.match(text(html(<Inbox items={[]} total={0} selectedId={null} onOpen={() => undefined} loading={false} />)), /No hay solicitudes/);
});

test('StatsPanel muestra los indicadores y la IA activa', () => {
  const t = text(html(<StatsPanel s={staffStats} onFilter={() => undefined} />));
  assert.match(t, /Vencidas/);
  assert.match(t, /Activa/);
  assert.match(t, /87,5 %/);
  const down = text(html(<StatsPanel s={{ ...staffStats, aiAvailable: false, aiAgreementRate: null }} onFilter={() => undefined} />));
  assert.match(down, /Caída/);
});
