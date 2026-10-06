import type { Entity } from './types';

export interface Segment { text: string; entity?: Entity }

/** Splits `text` into plain and highlighted parts. Out-of-range, empty and overlapping entities are ignored. */
export function segmentText(text: string, entities: Entity[]): Segment[] {
  const sorted = [...entities].filter((e) => e.start >= 0 && e.end <= text.length && e.end > e.start).sort((a, b) => a.start - b.start || b.end - a.end);
  const out: Segment[] = [];
  let pos = 0;
  for (const e of sorted) {
    if (e.start < pos) continue;
    if (e.start > pos) out.push({ text: text.slice(pos, e.start) });
    out.push({ text: text.slice(e.start, e.end), entity: e });
    pos = e.end;
  }
  if (pos < text.length) out.push({ text: text.slice(pos) });
  return out;
}
