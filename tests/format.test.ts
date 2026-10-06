import assert from 'node:assert/strict';
import { test } from 'node:test';
import { dueText, fmtDay, fmtInt, fmtPct, plural } from '../src/lib/format';
import { segmentText } from '../src/lib/segments';
import { LEGAL_TERMS } from '../src/lib/legal';
import type { Entity } from '../src/lib/types';

const ent = (start: number, end: number, type = 'date'): Entity => ({ type, label: type, text: 'x', start, end, value: null, pii: false, approx: false });

test('fmtPct y fmtInt usan formato colombiano y toleran null', () => {
  assert.equal(fmtPct(null), '—');
  assert.match(fmtPct(0.8333), /83,3\s%/);
  assert.equal(fmtInt(1234567).replace(/ /g, ' '), '1.234.567');
});

test('fmtDay no desplaza el día por zona horaria', () => {
  assert.match(fmtDay('2025-03-31'), /^31 (de )?mar/);
  assert.match(fmtDay('2025-01-01'), /^1 (de )?ene/);
  assert.equal(fmtDay('no-es-fecha'), 'no-es-fecha');
});

test('plural y dueText', () => {
  assert.equal(plural(1, 'día hábil', 'días hábiles'), '1 día hábil');
  assert.equal(plural(0, 'día hábil', 'días hábiles'), '0 días hábiles');
  assert.equal(dueText(0, 'at_risk'), 'Vence hoy');
  assert.equal(dueText(3, 'on_time'), 'Vence en 3 días hábiles');
  assert.equal(dueText(1, 'at_risk'), 'Vence en 1 día hábil');
  assert.equal(dueText(-2, 'overdue'), 'Venció hace 2 días hábiles');
  assert.equal(dueText(-5, 'done'), 'Respondida');
});

test('segmentText reconstruye el texto exacto y marca las entidades', () => {
  const text = 'Hola, el 5 de marzo en Bogotá no hubo agua.';
  const segs = segmentText(text, [ent(9, 19), ent(23, 29, 'place')]);
  assert.equal(segs.map((s) => s.text).join(''), text);
  assert.deepEqual(segs.filter((s) => s.entity).map((s) => s.text), ['5 de marzo', 'Bogotá']);
});

test('segmentText ignora entidades fuera de rango, vacías o solapadas', () => {
  const text = 'abcdefghij';
  const segs = segmentText(text, [ent(-1, 3), ent(2, 99), ent(4, 4), ent(2, 6), ent(4, 8)]);
  assert.equal(segs.map((s) => s.text).join(''), text);
  assert.deepEqual(segs.filter((s) => s.entity).map((s) => s.text), ['cdef']);
  assert.deepEqual(segmentText('', []), []);
});

test('los plazos legales de la portada son coherentes con el contrato', () => {
  const byLabel = Object.fromEntries(LEGAL_TERMS.map((t) => [t.label, t.days]));
  assert.equal(byLabel['Petición general'], 15);
  assert.equal(byLabel['Solicitud de información o de documentos'], 10);
  assert.equal(byLabel['Consulta a la autoridad'], 30);
});
