/**
 * End-to-end check of the REAL stack: `next start` + pqrsd-router-backend + pqrsd-router-ai (no mocks).
 *
 *   1. start the AI (:8000), the backend (:3001, STAFF_API_KEY set) and `npm run build && npm start` (:3000)
 *   2. E2E_STAFF_KEY=<the backend key> npm run e2e:fullstack
 *
 * Env: E2E_BASE_URL (default http://localhost:3000), E2E_STAFF_KEY (default empty = backend in dev mode), CHROMIUM_PATH.
 * It creates real cases in the backend: run it against a development data directory, never production.
 */
import { chromium } from 'playwright';

const BASE = (process.env.E2E_BASE_URL ?? 'http://localhost:3000').replace(/\/$/, '');
const KEY = process.env.E2E_STAFF_KEY ?? '';
const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok });
  console.log(`${ok ? '✔' : '✘'} ${name}${ok || !detail ? '' : `  → ${detail}`}`);
};

const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_PATH || undefined });
const errors = [];
try {
  const citizen = await browser.newPage();
  citizen.on('pageerror', (e) => errors.push(e.message));

  // --- citizen: write, see the live preview from the real AI, file the case
  await citizen.goto(`${BASE}/radicar`);
  await citizen.locator('textarea').fill('Hace tres semanas no llega el agua a mi barrio Santa Lucía y tengo un bebé en casa. Necesito una solución.');
  const preview = citizen.getByTestId('preview-ready');
  await preview.waitFor({ timeout: 20_000 });
  const previewText = await preview.innerText();
  check('Radicar: la vista previa usa la IA real y sugiere Servicios Públicos', /Servicios P[uú]blicos/i.test(previewText), previewText.slice(0, 160));

  // --- staff: log in first, so the live socket is open when the case arrives
  const staff = await browser.newPage();
  staff.on('pageerror', (e) => errors.push(e.message));
  await staff.goto(`${BASE}/funcionario`);
  await staff.locator('#staff-key').fill(KEY);
  await staff.getByRole('button', { name: 'Entrar' }).click();
  await staff.getByTestId('inbox').or(staff.getByTestId('empty')).first().waitFor({ timeout: 15_000 });
  await staff.getByText('En vivo', { exact: true }).waitFor({ timeout: 15_000 }).then(
    () => check('Funcionario: el socket real se conecta («En vivo»)', true),
    () => check('Funcionario: el socket real se conecta («En vivo»)', false, 'el indicador no cambió'),
  );

  await citizen.getByRole('checkbox').first().check(); // anonymous: no personal data in this run
  await citizen.getByRole('checkbox').last().check(); // consent (Ley 1581)
  await citizen.getByRole('button', { name: 'Radicar solicitud' }).click();
  const radicado = (await citizen.getByTestId('radicado').innerText({ timeout: 20_000 })).trim();
  const code = (await citizen.getByTestId('tracking-code').innerText()).trim();
  check('Radicar: se obtiene un radicado y un código de seguimiento', /^PQRSD-\d{4}-\d{6}$/.test(radicado) && code.length > 0, `${radicado} ${code}`);

  // --- staff: the new case appears without reloading (pqrsd.created over socket.io)
  await staff.getByRole('button', { name: `Abrir ${radicado}` }).waitFor({ timeout: 15_000 }).then(
    () => check('Funcionario: el caso nuevo aparece solo, en tiempo real', true),
    () => check('Funcionario: el caso nuevo aparece solo, en tiempo real', false, `${radicado} no apareció`),
  );

  // --- citizen tracking (SSR) with the code shown on the receipt
  if (radicado && code) {
    await citizen.goto(`${BASE}/consulta/${radicado}?code=${code}`);
    const body = await citizen.locator('body').innerText();
    check('Consulta: el estado público se muestra por SSR', body.includes(radicado) && /revisi[oó]n/i.test(body), body.slice(0, 160));
    const robots = await citizen.locator('meta[name="robots"]').getAttribute('content');
    check('Consulta: la página no se indexa', /noindex/.test(robots ?? ''), String(robots));
  } else check('Consulta: se encontró el código de seguimiento en el comprobante', false);

  await citizen.goto(`${BASE}/transparencia`);
  check('Transparencia: muestra indicadores públicos', /recibid/i.test(await citizen.locator('body').innerText()));
  check('Sin errores de página', errors.length === 0, errors.slice(0, 3).join(' | '));
} finally {
  await browser.close();
}

const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} comprobaciones correctas`);
process.exit(failed ? 1 : 0);
