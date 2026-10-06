/** Legal terms shown on the static home page. They MIRROR backend `deadlines.ts`; the live table comes from /public/transparency. Not legal advice. */
export const LEGAL_TERMS: Array<{ label: string; days: number; note: string }> = [
  { label: 'Petición general', days: 15, note: 'Art. 14 Ley 1437 de 2011 (sustituido por la Ley 1755 de 2015)' },
  { label: 'Solicitud de información o de documentos', days: 10, note: 'Art. 14' },
  { label: 'Consulta a la autoridad', days: 30, note: 'Art. 14' },
  { label: 'Queja, reclamo o sugerencia', days: 15, note: 'Régimen general de peticiones' },
  { label: 'Denuncia', days: 15, note: 'Depende del procedimiento aplicable; la entidad debe confirmarlo' },
];

export const LEGAL_DISCLAIMER = 'Plazos de referencia en días hábiles contados desde el día siguiente a la radicación. No constituyen asesoría jurídica.';
