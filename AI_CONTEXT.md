# AI_CONTEXT.md — contexto para la IA generadora de código

> Léeme completo antes de tocar nada. Este repo es **3 de 3** del proyecto *pqrsd-router* (Clasificador y Enrutador
> Inteligente de PQRSD para Entidades Públicas). Idioma: **código, nombres de archivo, commits y pruebas en inglés;
> textos que ve el usuario (etiquetas, mensajes) en español**.

## 1. Objetivo del proyecto (caso de estudio original)
Hoy los funcionarios leen cada PQRSD una por una para decidir a qué dependencia pertenece y qué tan urgente es: hay cuellos
de botella y respuestas tardías, con incumplimiento de plazos legales. Propuesta: el ciudadano escribe en texto libre y el
sistema **clasifica al recibirla** por tipo (petición/queja/reclamo/sugerencia/denuncia), **dependencia competente** y **nivel de
urgencia**; para pruebas de volumen puede usarse un dataset público real (p. ej. issues de GitHub vía API, adaptado). IA: clasificación
de texto + extracción de entidades (fechas, lugares, nombres de trámites). Diferencial: resuelve un cuello de botella burocrático medible
y no necesita datos inventados.

## 2. Los 3 repos y el rol de ESTE repo
| Repo | Stack | Rol |
|------|-------|-----|
| **`pqrsd-router-frontend`** (este) | Next.js 14 + TS | Portal ciudadano (SSG/CSR/SSR/ISR) y bandeja del funcionario en vivo |
| `pqrsd-router-backend` | NestJS + TS | Radicación, plazos legales en días hábiles, SLA, flujo, estadísticas, tiempo real, proxy a la IA |
| `pqrsd-router-ai` | FastAPI + scikit-learn | Clasificación híbrida (modelo + reglas), entidades, retroalimentación y reentrenamiento |

Contrato exacto: `docs/CONTRACT.md` (idéntico en los 3 repos). **El frontend solo habla con el backend** (§4 del contrato), nunca con la IA.
No rompas el contrato sin cambiarlo en los otros dos repos.

## 3. Arquitectura de este repo
Lee primero `README.md` (rutas, patrón de renderizado por ruta, árbol de carpetas). Resumen:
* `src/lib/api.ts` es el **único** lugar con `fetch`. `api` = endpoints públicos; `staffApi(key)` = endpoints de funcionario (siempre con `X-Staff-Key`).
  Los tipos de respuesta están en `src/lib/types.ts` y deben seguir `docs/CONTRACT.md` §4.
* Las páginas de `src/app/**` son finas; la lógica de interfaz está en `src/components/**`. `TrackingView` y `TransparencyView` son **puras (sin hooks)** para poder
  renderizarse en el servidor; no les añadas estado.
* Tiempo real: `useRealtime(staffKey, onEvent, factory)`; la fábrica de sockets es inyectable (`SocketFactory`) y la bandeja agrupa ráfagas con un temporizador de 400 ms.

Invariantes que NO se deben romper:
* **La clave de funcionario nunca se incrusta** en el JavaScript ni va en `NEXT_PUBLIC_*`: se escribe en `/funcionario` y vive en `sessionStorage` (`lib/staffKey.ts`, con `try/catch`).
* **La interfaz no calcula plazos ni días hábiles**: muestra `dueDate`, `businessDaysLeft`, `slaStatus` del backend. `lib/legal.ts` es solo texto de referencia de la portada.
* **Privacidad**: `/consulta/[radicado]` es SSR, `force-dynamic` y `noindex`; no muestra texto ni datos personales; ante 404 no dice si falló el radicado o el código. `/funcionario` es `noindex` y está
  fuera de `robots`. El CSV no lleva textos. No agregues datos personales a vistas públicas ni a `console.log`.
* **La vista previa debe descartar respuestas viejas** (`AbortController` + contador `seq` en `RadicarForm`) y esperar 700 ms (`useDebounced`); si la IA cae, el backend responde `source: "fallback"` y la interfaz lo dice.
* Las fechas `YYYY-MM-DD` son **fechas civiles de Bogotá**: se formatean con `fmtDay` (UTC, sin desplazar). No las pases por `new Date(...)` local.
* **Ids de formulario únicos** en la pantalla (el panel de detalle usa `d-f-*` porque los filtros usan `f-*`).
* Textos para el usuario en español, de tú, con tono claro y sin jerga jurídica.

## 4. Cómo ejecutar y probar
```bash
npm install
cp .env.example .env.local
npm run dev                  # :3000 (necesita el backend en :3001)
npm run typecheck            # app + pruebas/scripts
npm test                     # 17 pruebas (tsx --test con stubs de next/*)
E2E_STAFF_KEY=... npm run e2e:fullstack   # 12 comprobaciones (incluye axe) contra next start + backend + IA reales
npx playwright install chromium && npm run verify:browser     # 48 comprobaciones en Chromium contra una API simulada
npm run build && npm start
```
`scripts/verify/mock-server.ts` imita al backend **solo para esta verificación** (no es el backend real); `tests/fixtures/data.ts` son datos de ejemplo según el contrato.
Si cambias una pantalla, ajusta `scripts/browser-verify.mjs` (los textos y `data-testid` se usan como selectores).

## 5. Estado exacto (hasta dónde llegué)
**Hecho y VERIFICADO** (sandbox: Node 22, Chromium 141, React 19, esbuild):
* 14 pruebas unitarias/de render pasan; `tsc` estricto limpio sobre `src/`, `tests/` y `scripts/verify/` **con declaraciones de React/Next hechas a mano** (npm bloqueado).
* 48/48 comprobaciones en Chromium real con los componentes reales (radicar, vista previa y carrera de respuestas, validaciones, anónimo, consulta, ingreso de funcionario y clave revocada, filtros, detalle, confirmar/reclasificar/responder/cerrar, CSV, tiempo real, demo, reentrenar, móvil 375 px).
* Recorrido completo contra el **dominio real del backend** (IA falsa) servido por un adaptador temporal HTTP: sin errores. Compatibilidad estática de tipos backend → frontend en los 10 endpoints usados.

**Verificado al retomar (2026-11-11, Windows, Node 22, Next 14.2.35, React 18 y @types reales):**
* `npm run typecheck` limpio, `npm test` 16/16, `npm run build` OK, `npm run verify:browser` 48/48.
* `npm run e2e:fullstack` (nuevo, `scripts/e2e-fullstack.mjs`) 8/8 contra la pila real (procesos locales y `docker compose up --build` de los 3 repos).
* Corregido: `socketOrigin()`/`apiBaseUrl()` usaban `??`; el Dockerfile deja `NEXT_PUBLIC_SOCKET_URL=""` → el socket iba a :3000. Ahora `||` (`tests/api.test.ts`).
* Corregido: `scripts/browser-verify.mjs` hacía `import()` de una ruta absoluta (falla en Windows) → `pathToFileURL`.
* Comprobado: en Docker el build prerenderiza `/transparencia` sin backend y sirve el aviso de error hasta la primera regeneración ISR (≤ 60 s + 1 visita).
* `package-lock.json` versionado; la CI usa `npm ci`.

**Añadido y verificado (2026-11-11):** responsable y ampliación del plazo en `CaseDrawer` (ids `d-f-assignee`, `d-f-days`, `d-f-reason`), filtro «Solo sin responsable»,
axe-core en `e2e:fullstack` (12/12, claro y oscuro; se corrigió el contraste de `--warn`/`--high`), `sitemap.ts` + `lib/site.ts`, timeout de 25 s en las peticiones del servidor
y `maxDuration = 30` (Vercel + backend dormido en Render), `docs/DEPLOY.md` (Vercel). Invariante nuevo: **no muestres el responsable ni el motivo de la ampliación en vistas públicas**.

**No hecho:**
* Usuarios y roles (hoy una clave compartida; el responsable es texto libre); traslados por competencia en la interfaz.
* Firefox/Safari, revisión con lector de pantalla, i18n, identidad visual de la entidad.
* Paginación por cursor y virtualización para bandejas de miles de casos; gráficos históricos más allá de las 12 semanas de transparencia.
* Adjuntos en la radicación; verificación anti-bots (captcha) en `/radicar`.

## 6. Checklist para llegar al 100 % (en orden)
1. ~~`npm install`, `npm run typecheck`, `npm test`, `npm run build`.~~ ✅
2. ~~`npm run verify:browser` y `docker compose up --build` con los 3 repos; socket real y «En vivo».~~ ✅
3. ~~Patrones de renderizado en producción (`next start`).~~ ✅ (falta medir con el backend lento)
4. ~~Pruebas e2e sobre `next start` + backend real + IA real; auditoría axe.~~ ✅ — pendiente: revisión con lector de pantalla.
5. Autenticación por usuario y roles (reemplazar la clave compartida), vistas por dependencia. (~~Asignación a funcionarios~~ ✅)
6. Captcha o prueba de trabajo en `/radicar`, textos legales revisados por el área jurídica, identidad visual de la entidad.
7. Observabilidad (errores del navegador, métricas Web Vitals). Despliegue: listo para Vercel (`docs/DEPLOY.md`).
