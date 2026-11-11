#!/usr/bin/env node
/**
 * Real-browser verification (Chromium via Playwright) of the interactive UI against an in-memory mock of the backend.
 *   npm run verify:browser
 * Env: CHROMIUM_PATH (use a system chromium), TOOLS_DIR (folder whose node_modules has esbuild/playwright/react), SHOTS_DIR (save screenshots).
 * Verifies: live preview (debounce, stale responses discarded), receipt, validation, staff login (wrong key / right key / 401 mid-session),
 * inbox filters/search, case drawer (entities, PII, confirm / reclassify / answer / close), realtime refresh and demo data buttons.
 * It does NOT verify Next.js server rendering (SSG/SSR/ISR pages): that needs `next build` (see README).
 */
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const toolsDir = process.env.TOOLS_DIR;
const reqs = [createRequire(join(root, 'package.json')), ...(toolsDir ? [createRequire(join(toolsDir, 'package.json'))] : [])];
function dep(name) {
  for (const r of reqs) {
    try { return r(name); } catch { /* next */ }
  }
  throw new Error(`No se encontró «${name}». Ejecuta npm install (o define TOOLS_DIR).`);
}
const esbuild = dep('esbuild');
const { chromium } = dep('playwright');
const nodeModulesDirs = [join(root, 'node_modules'), ...(toolsDir ? [join(toolsDir, 'node_modules')] : [])].filter(existsSync);

// The harness injects a fake socket, so the real socket.io client is never loaded; if it is not installed, leave the import unresolved.
const hasSocketIo = nodeModulesDirs.some((d) => existsSync(join(d, 'socket.io-client')));
const outDir = join(root, '.verify-dist');
rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });
const shots = process.env.SHOTS_DIR;
if (shots) mkdirSync(shots, { recursive: true });

// ---- 1) mock backend
console.log('› Empaquetando la API simulada…');
await esbuild.build({ entryPoints: [join(root, 'scripts/verify/mock-server.ts')], outfile: join(outDir, 'mock-server.mjs'), bundle: true, platform: 'node', format: 'esm', target: 'node18', logLevel: 'warning' });
const { startMock } = await import(join(outDir, 'mock-server.mjs'));
const mock = await startMock();
const api = `http://127.0.0.1:${mock.port}/api/v1`;

// ---- 2) UI bundle (real components; next/* aliased to stubs)
console.log('› Empaquetando los componentes con esbuild…');
await esbuild.build({
  entryPoints: [join(root, 'scripts/verify/harness-entry.tsx')],
  outdir: outDir,
  bundle: true,
  format: 'esm',
  platform: 'browser',
  target: 'es2022',
  jsx: 'automatic',
  loader: { '.svg': 'dataurl' },
  alias: { '@': join(root, 'src'), 'next/link': join(root, 'tests/stubs/next-link.tsx'), 'next/navigation': join(root, 'tests/stubs/next-navigation.ts') },
  nodePaths: nodeModulesDirs,
  external: hasSocketIo ? [] : ['socket.io-client'],
  define: { 'process.env.NODE_ENV': '"production"', 'process.env.NEXT_PUBLIC_API_URL': JSON.stringify(api), 'process.env.NEXT_PUBLIC_SOCKET_URL': JSON.stringify(`http://127.0.0.1:${mock.port}`), 'process.env.API_URL_INTERNAL': JSON.stringify(api) },
  logLevel: 'warning',
});
const MIME = { '.js': 'text/javascript', '.css': 'text/css' };
const web = createServer((rq, rs) => {
  const u = (rq.url ?? '/').split('?')[0];
  if (u === '/') {
    rs.writeHead(200, { 'content-type': 'text/html' });
    rs.end('<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>harness</title><link rel="stylesheet" href="/harness-entry.css"><body><main id="contenido"><div class="wrap"><div id="app"></div></div></main><script type="module" src="/harness-entry.js"></script></body></html>');
    return;
  }
  const f = join(outDir, u);
  if (!existsSync(f) || u.includes('..')) { rs.writeHead(404); rs.end(); return; }
  rs.writeHead(200, { 'content-type': MIME[extname(f)] ?? 'application/octet-stream' });
  rs.end(readFileSync(f));
});
await new Promise((r) => web.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${web.address().port}`;

// ---- 3) drive Chromium
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_PATH || undefined, args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, locale: 'es-CO' });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
// 401/404/409/422/429 are asserted on purpose below; only unexpected console errors count
page.on('console', (m) => m.type() === 'error' && !/Failed to load resource|favicon/.test(m.text()) && errors.push(m.text()));

const checks = [];
const check = (name, ok, detail = '') => {
  checks.push({ name, ok: !!ok });
  console.log(`${ok ? '✔' : '✖'} ${name}${!ok && detail ? ' — ' + detail : ''}`);
};
const snap = async (name) => { if (shots) await page.screenshot({ path: join(shots, `${name}.png`), fullPage: true }); };
const mount = async (name) => {
  await page.evaluate((n) => window.Harness.mount(n), name);
  await page.waitForFunction(() => (document.getElementById('app')?.childElementCount ?? 0) > 0); // React renders asynchronously
};
const calls = (method, pathRe) => mock.log.filter((l) => l.method === method && pathRe.test(l.path));
const textOf = (sel) => page.locator(sel).first().innerText();

await page.goto(base);
await page.waitForFunction(() => window.Harness);

// ================= Citizen: /radicar =================
await mount('radicar');
check('Radicar: antes de escribir se explica la vista previa', await page.getByTestId('preview-idle').isVisible());

await page.locator('#text').pressSequentially('Corto', { delay: 20 });
await page.waitForTimeout(900);
check('Radicar: con menos de 25 caracteres no se llama a la vista previa', calls('POST', /preview$/).length === 0);

// stale-response race: slow answer for «semáforo», then the user rewrites the text about water
await page.locator('#text').fill('El semáforo de la calle 80 lleva dos semanas dañado y hay accidentes');
await page.waitForTimeout(800); // debounce fires → slow request in flight (1.2 s)
await page.locator('#text').fill('Hace tres semanas no llega el agua al barrio Santa Lucía y tengo un bebé');
await page.getByTestId('preview-ready').waitFor({ timeout: 5000 });
await page.waitForTimeout(1500); // the slow request has now finished: it must NOT replace the newer preview
const depText = await textOf('[data-testid=preview-ready]');
check('Radicar: la vista previa corresponde al texto más reciente (se descartan respuestas viejas)', /Secretaría de Salud/.test(depText) && !/Movilidad/.test(depText), depText.replace(/\s+/g, ' ').slice(0, 200));
check('Radicar: la vista previa muestra plazo legal y entidades detectadas', /15 días hábiles/.test(depText) && /5 de marzo/.test(depText));
check('Radicar: no se dispara una consulta por cada tecla (debounce)', calls('POST', /preview$/).length <= 3, `${calls('POST', /preview$/).length} llamadas`);
await snap('radicar-preview');

await page.getByRole('button', { name: 'Radicar solicitud' }).click();
const err1 = await page.getByRole('alert').innerText();
check('Radicar: sin autorización de datos no se envía y se explica por qué', /autorizar|aceptar el tratamiento/i.test(err1) && calls('POST', /\/pqrsd$/).length === 0, err1);

await page.getByLabel('Nombre', { exact: true }).fill('Ana Pérez');
await page.getByLabel('Correo electrónico').fill('ana@example.com');
await page.getByLabel(/Autorizo el tratamiento/).check();
await page.locator('#text').fill('FORCE429 ' + 'x'.repeat(30));
await page.getByRole('button', { name: 'Radicar solicitud' }).click();
await page.getByRole('alert').waitFor();
check('Radicar: un error 429 del servidor se muestra y el formulario no se pierde', /Demasiadas|espera/i.test(await page.getByRole('alert').innerText()) && (await page.locator('#text').inputValue()).startsWith('FORCE429'));

await page.locator('#text').fill('  Hace tres semanas no llega el agua al barrio Santa Lucía y tengo un bebé  ');
await page.getByRole('button', { name: 'Radicar solicitud' }).click();
await page.getByLabel('Solicitud radicada').waitFor();
const post = calls('POST', /\/pqrsd$/).at(-1).body;
check('Radicar: se muestra el radicado y el código de seguimiento', /PQRSD-2025-000042/.test(await textOf('.receipt')) && /K7M2QX/.test(await textOf('.receipt')));
check('Radicar: el cuerpo enviado lleva texto recortado, consentimiento y contacto', post.text === post.text.trim() && post.consent === true && post.citizen?.name === 'Ana Pérez' && post.anonymous === false, JSON.stringify(post));
await snap('radicar-recibo');
await page.getByRole('button', { name: /otra|nueva/i }).click();
check('Radicar: «radicar otra» limpia el formulario', (await page.locator('#text').inputValue()) === '');

await page.getByLabel(/anónima/).check();
check('Radicar: en modo anónimo desaparecen los campos de contacto', (await page.locator('#email').count()) === 0);
await page.locator('#text').fill('Denuncio que en la obra de la calle 10 se está botando escombro al río');
await page.getByLabel(/Autorizo el tratamiento/).check();
await page.getByRole('button', { name: 'Radicar solicitud' }).click();
await page.getByLabel('Solicitud radicada').waitFor();
const post2 = calls('POST', /\/pqrsd$/).at(-1).body;
check('Radicar: anónimo no envía datos personales', post2.anonymous === true && !post2.citizen, JSON.stringify(post2));

// ================= Citizen: /consulta =================
await mount('consulta');
await page.getByLabel('Número de radicado').fill('PQRSD-25-1');
await page.getByLabel('Código de seguimiento').fill('K7M2QX');
await page.getByRole('button', { name: 'Consultar' }).click();
check('Consulta: formato de radicado inválido se explica', /formato PQRSD-2025-000123/.test(await page.getByRole('alert').innerText()));
await page.getByLabel('Número de radicado').fill('pqrsd-2025-000042');
await page.getByLabel('Código de seguimiento').fill('k7m2qx');
await page.getByRole('button', { name: 'Consultar' }).click();
const pushes = await page.evaluate(() => window.__pushes);
check('Consulta: navega a la URL en mayúsculas con el código', JSON.stringify(pushes) === JSON.stringify(['/consulta/PQRSD-2025-000042?code=K7M2QX']), JSON.stringify(pushes));

// ================= Public read-only views (rendered client-side here, server-side in Next) =================
await mount('tracking');
await snap('seguimiento');
check('Seguimiento: sin respuesta se informa el plazo', /aún no ha respondido/.test(await textOf('#app')));
await mount('transparencia');
await snap('transparencia');
check('Transparencia: muestra el aviso de datos de demostración', /Datos de demostración/.test(await textOf('#app')));

// ================= Staff: /funcionario =================
await page.evaluate(() => window.sessionStorage.clear());
await mount('funcionario');
await page.getByLabel('Clave de funcionario').waitFor();
await page.getByLabel('Clave de funcionario').fill('incorrecta');
await page.getByRole('button', { name: 'Entrar' }).click();
await page.getByRole('alert').waitFor();
check('Funcionario: una clave incorrecta se rechaza con un mensaje claro', /clave no es correcta/i.test(await page.getByRole('alert').innerText()));
check('Funcionario: la clave incorrecta no se guarda', (await page.evaluate(() => window.sessionStorage.getItem('pqrsd.staffKey'))) === null);
await snap('funcionario-login');

await page.getByLabel('Clave de funcionario').fill('secreta');
await page.getByRole('button', { name: 'Entrar' }).click();
await page.getByTestId('inbox').waitFor();
const rows = () => page.locator('[data-testid=inbox] tbody tr');
await page.waitForFunction(() => document.querySelectorAll('[data-testid=inbox] tbody tr').length === 4, null, { timeout: 5000 }).catch(() => undefined);
check('Funcionario: tras entrar se listan los 4 casos', (await rows().count()) === 4);
const firstRad = await rows().first().innerText();
check('Funcionario: el caso crítico y vencido va primero (prioridad)', /PQRSD-2025-000001/.test(firstRad) && /Vencida/.test(firstRad) && /Por confirmar/.test(firstRad));
check('Funcionario: se marcan los casos demo y los clasificados sin IA', /demo/.test(await textOf('[data-testid=inbox]')) && /Sin IA/.test(await textOf('[data-testid=inbox]')));
check('Funcionario: todas las llamadas llevan X-Staff-Key', mock.log.filter((l) => l.path.startsWith('/staff') && l.staffKey !== 'incorrecta').every((l) => l.staffKey === 'secreta'));
check('Funcionario: la clave solo vive en sessionStorage', (await page.evaluate(() => window.sessionStorage.getItem('pqrsd.staffKey'))) === 'secreta' && (await page.evaluate(() => window.localStorage.length)) === 0);
check('Funcionario: sin conexión en vivo hasta que el socket conecta', /Sin conexión en vivo/.test(await textOf('[data-testid=live]')));
await page.evaluate(() => window.Harness.emit('connect'));
await page.waitForFunction(() => /En vivo/.test(document.querySelector('[data-testid=live]')?.textContent ?? '') && !/Sin conexión/.test(document.querySelector('[data-testid=live]')?.textContent ?? ''));
check('Funcionario: al conectar el socket aparece «En vivo» (con la clave en el handshake)', (await page.evaluate(() => window.__socketKey)) === 'secreta');
await snap('funcionario-bandeja');

await page.getByTestId('kpi-risk').click();
await page.waitForFunction(() => document.querySelectorAll('[data-testid=inbox] tbody tr').length === 1);
check('Funcionario: el indicador «en riesgo» filtra la bandeja por semáforo', calls('GET', /\/staff\/pqrsd$/).some((c) => c.query.sla === 'at_risk') && /PQRSD-2025-000002/.test(await rows().first().innerText()));
await page.getByRole('button', { name: 'Limpiar filtros' }).click();
await page.waitForFunction(() => document.querySelectorAll('[data-testid=inbox] tbody tr').length === 4);
await page.getByLabel('Buscar').pressSequentially('semáforo', { delay: 30 });
await page.waitForFunction(() => document.querySelectorAll('[data-testid=inbox] tbody tr').length === 1);
const searches = calls('GET', /\/staff\/pqrsd$/).filter((c) => c.query.q);
check('Funcionario: la búsqueda espera a que termines de escribir (debounce)', searches.length === 1 && searches[0].query.q === 'semáforo', JSON.stringify(searches.map((s) => s.query.q)));
await page.getByRole('button', { name: 'Limpiar filtros' }).click();
await page.waitForFunction(() => document.querySelectorAll('[data-testid=inbox] tbody tr').length === 4);

// ---- case drawer
await page.getByRole('button', { name: 'Abrir PQRSD-2025-000001' }).click();
await page.getByTestId('drawer').getByText('Texto del ciudadano').waitFor();
const marks = await page.locator('[data-testid=case-text] mark').allInnerTexts();
check('Detalle: se resaltan las entidades detectadas en el texto', marks.join('|') === '5 de marzo|Ana Pérez', marks.join('|'));
check('Detalle: los datos personales se marcan como tales', (await page.locator('[data-testid=case-text] mark.pii').count()) === 1 && /dato personal/.test(await textOf('[data-testid=drawer]')));
check('Detalle: se explican las razones de la IA', /EPS/.test(await textOf('[data-testid=drawer]')) && /no está segura de la dependencia/.test(await textOf('[data-testid=drawer]')));
await snap('funcionario-detalle');
await page.getByRole('button', { name: 'Confirmar clasificación de la IA' }).click();
await page.getByTestId('drawer').getByText(/Confirmada por funcionario/).waitFor();
check('Detalle: confirmar cambia el estado y deja huella en el historial', calls('POST', /confirm$/).length === 1 && /Asignada/.test(await textOf('[data-testid=drawer]')));

await page.locator('#d-f-dep').selectOption('movilidad');
check('Detalle: al cambiar la dependencia aparece «Guardar corrección» y se avisa que entrena a la IA', await page.getByRole('button', { name: 'Guardar corrección' }).isVisible() && /entrena a la IA/.test(await textOf('[data-testid=drawer]')));
await page.getByRole('button', { name: 'Guardar corrección' }).click();
await page.getByTestId('drawer').getByText(/Reclasificada por funcionario/).waitFor();
const rc = calls('POST', /reclassify$/).at(-1).body;
check('Detalle: la corrección envía solo los campos esperados', rc.dependency === 'movilidad' && rc.type === 'peticion' && rc.subtype === 'general', JSON.stringify(rc));

const send = page.getByRole('button', { name: 'Enviar respuesta' });
await page.locator('#resp').fill('corta');
check('Detalle: una respuesta de menos de 10 caracteres no se puede enviar', await send.isDisabled());
await page.locator('#resp').fill('Estimada Ana, ya reprogramamos la intervención.');
await send.click();
await page.getByTestId('drawer').getByText('Respuesta enviada').waitFor();
check('Detalle: al responder aparece la respuesta y el botón «Cerrar solicitud»', await page.getByRole('button', { name: 'Cerrar solicitud' }).isVisible() && (await page.getByRole('button', { name: 'Enviar respuesta' }).count()) === 0);
await page.getByRole('button', { name: 'Cerrar solicitud' }).click();
await page.getByTestId('drawer').getByText(/Cerrada/).first().waitFor();
check('Detalle: cerrar deja la solicitud en estado «Cerrada»', calls('POST', /close$/).length === 1);
await page.keyboard.press('Escape');
await page.getByTestId('drawer').waitFor({ state: 'detached' });
check('Detalle: Escape cierra el panel', true);

// ---- realtime
await page.evaluate(([u]) => fetch(`${u}/__control/add`, { method: 'POST' }), [api]);
check('Tiempo real: antes del evento la bandeja no cambia', (await rows().count()) === 4);
await page.evaluate(() => window.Harness.emit('pqrsd.created'));
await page.waitForFunction(() => document.querySelectorAll('[data-testid=inbox] tbody tr').length === 5, null, { timeout: 4000 });
check('Tiempo real: el evento recarga la bandeja sola (5 casos)', /5 solicitudes/.test(await textOf('[aria-label=Bandeja] h2')));
const before = calls('GET', /\/staff\/pqrsd$/).length;
await page.evaluate(() => { for (let i = 0; i < 6; i++) window.Harness.emit('stats.changed'); });
await page.waitForTimeout(1200);
check('Tiempo real: una ráfaga de 6 eventos produce una sola recarga', calls('GET', /\/staff\/pqrsd$/).length - before === 1, `${calls('GET', /\/staff\/pqrsd$/).length - before} recargas`);

// ---- export + admin
const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Exportar CSV' }).click()]);
check('Exportar: el CSV se descarga con nombre .csv', download.suggestedFilename().endsWith('.csv') && calls('GET', /export\.csv$/).length === 1);
page.once('dialog', (d) => d.accept());
await page.getByText('IA y datos de demostración').click();
await page.getByTestId('seed').click();
await page.getByTestId('note').filter({ hasText: '60 casos de demostración creados' }).waitFor();
await page.getByRole('button', { name: 'Reentrenar con correcciones' }).click();
await page.getByTestId('note').filter({ hasText: 'IA reentrenada' }).waitFor();
check('Administración: reentrenar pide confirmación y avisa el resultado', calls('POST', /ai\/retrain$/).length === 1);
check('Administración: crear datos de demostración informa el resultado', calls('POST', /demo\/seed$/).length === 1);
check('Administración: se informa el estado de la IA y las correcciones pendientes', /activa/.test(await textOf('details')) && /sintéticos/.test(await textOf('details')));

// ---- 401 in the middle of a session sends the user back to the login
await page.evaluate(([u]) => fetch(`${u}/__control/key`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ key: 'otra' }) }), [api]);
await page.evaluate(() => window.Harness.emit('stats.changed'));
await page.getByLabel('Clave de funcionario').waitFor({ timeout: 4000 });
check('Sesión: si la clave deja de ser válida se vuelve al ingreso', (await page.evaluate(() => window.sessionStorage.getItem('pqrsd.staffKey'))) === null);

await page.evaluate(([u]) => fetch(`${u}/__control/key`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ key: 'secreta' }) }), [api]);
await page.getByLabel('Clave de funcionario').fill('secreta');
await page.getByRole('button', { name: 'Entrar' }).click();
await page.getByTestId('inbox').waitFor();
await page.getByRole('button', { name: 'Salir' }).click();
await page.getByLabel('Clave de funcionario').waitFor();
check('Sesión: «Salir» borra la clave y cierra el socket', (await page.evaluate(() => window.sessionStorage.getItem('pqrsd.staffKey'))) === null && (await page.evaluate(() => window.Harness.sockets())).closed >= 1);

// ---- mobile layout: no horizontal scroll on the citizen form
await page.setViewportSize({ width: 375, height: 800 });
await mount('radicar');
await page.waitForTimeout(200);
const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
check('Móvil (375 px): el formulario de radicar no desborda horizontalmente', overflow <= 1, `${overflow} px`);
await snap('radicar-movil');

check('Sin errores de página ni de consola inesperados', errors.length === 0, errors.slice(0, 3).join(' | '));

await browser.close();
web.close();
await mock.close();
rmSync(outDir, { recursive: true, force: true });
const failed = checks.filter((c) => !c.ok);
console.log(`\n${checks.length - failed.length}/${checks.length} comprobaciones correctas`);
process.exit(failed.length ? 1 : 0);
