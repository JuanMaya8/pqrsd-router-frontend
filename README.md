# pqrsd-router-frontend

Portal ciudadano y bandeja de funcionarios del **Clasificador y Enrutador Inteligente de PQRSD para Entidades Públicas**
(repo 3 de 3; los otros dos son `pqrsd-router-backend` y `pqrsd-router-ai`).

El ciudadano escribe su caso con sus palabras; mientras escribe ve **qué entendió el sistema** (tipo, dependencia, urgencia, plazo legal,
fechas y lugares detectados). Al radicar recibe un número y un código para consultar el estado. El funcionario ve una **bandeja ordenada por
riesgo de incumplir el plazo**, con la justificación de la IA, y corrige o confirma la clasificación (cada corrección alimenta a la IA).
La pantalla de **transparencia** publica el cuello de botella medido (respondidas a tiempo, vencidas, días promedio), sin datos personales.

Next.js 14 (App Router) · TypeScript · CSS propio (sin Tailwind) · socket.io-client. Interfaz en español; código en inglés.

## Cómo ejecutarlo

Requisitos: **Node 18.18+**. Para ver datos reales hace falta el backend en `:3001` (que a su vez usa la IA en `:8000`, o su respaldo por palabras clave).

```bash
npm install
cp .env.example .env.local        # ajusta NEXT_PUBLIC_API_URL si el backend no está en localhost:3001
npm run dev                       # http://localhost:3000

npm run typecheck                 # tsc (app) + tsc (pruebas y scripts de verificación)
npm test                          # 16 pruebas: utilidades, URLs del backend, segmentación de entidades y render de componentes
npm run verify:browser            # Chromium real + API simulada: 48 comprobaciones (necesita `npx playwright install chromium`)
E2E_STAFF_KEY=... npm run e2e:fullstack   # Chromium contra next start + backend + IA reales: 8 comprobaciones
npm run build && npm start        # producción
```

Todo el sistema con Docker (espera `../pqrsd-router-ai` y `../pqrsd-router-backend`):
```bash
STAFF_API_KEY=cambia-esto docker compose up --build     # → http://localhost:3000   (clave de funcionario: la que pusiste)
```

Primer recorrido sugerido: en `/funcionario` entra con la clave → «IA y datos de demostración» → **Crear 60 casos de demostración**;
luego abre `/radicar`, escribe un caso y mira cómo aparece en la bandeja sin recargar (tiempo real).

### Variables de entorno (`.env.example`)
| Variable | Por defecto | Para qué |
|----------|-------------|----------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:3001/api/v1` | Dirección **pública** del backend, usada por el navegador. Se incrusta en el JavaScript al compilar |
| `API_URL_INTERNAL` | `NEXT_PUBLIC_API_URL` | Dirección que usa el **servidor de Next** (SSR/ISR). En Docker: `http://backend:3001/api/v1` |
| `NEXT_PUBLIC_SOCKET_URL` | origen de `NEXT_PUBLIC_API_URL` | Solo si socket.io vive en otro origen |

La **clave de funcionario no es una variable de entorno**: la escribe el funcionario en `/funcionario` y vive solo en `sessionStorage`
(se borra al cerrar la pestaña). Así no queda incrustada en el JavaScript público.

## Patrón de renderizado: uno por ruta, según el contenido

| Ruta | Patrón | Por qué |
|------|--------|---------|
| `/` | **SSG** (`dynamic = 'force-static'`) | Contenido fijo (cómo funciona, derechos, plazos). Sale del CDN sin trabajo del servidor y se indexa bien |
| `/radicar` | **CSR** dentro de una página estática | Formulario interactivo con vista previa en vivo (espera 700 ms, cancela la petición anterior con `AbortController` y descarta respuestas viejas) |
| `/consulta` | SSG + formulario cliente | Solo valida el formato y navega |
| `/consulta/[radicado]?code=` | **SSR** (`force-dynamic`, `noindex`) | El estado debe estar siempre al día, depende de un código privado y **nunca** debe quedar en caché de un CDN |
| `/transparencia` | **ISR** (`revalidate = 60`) | Cifras agregadas que cambian despacio y las pide mucha gente: se sirve de caché y se regenera como máximo una vez por minuto |
| `/funcionario` | **CSR** + socket.io | Privada, interactiva y en vivo: no hay nada útil que renderizar en el servidor. `noindex` y fuera de `robots` |

## Arquitectura

```
src/
├─ app/                      Rutas (App Router). Páginas finas: piden datos y componen componentes
│  ├─ layout.tsx · globals.css · error.tsx · not-found.tsx · robots.ts
│  ├─ page.tsx               SSG
│  ├─ radicar/               CSR
│  ├─ consulta/[radicado]/   SSR
│  ├─ transparencia/         ISR
│  └─ funcionario/           CSR
├─ components/
│  ├─ RadicarForm · ClassificationPreview · ReceiptCard · ConsultaForm        (ciudadano)
│  ├─ TrackingView · TransparencyView · BarList · WeeklyChart (SVG) · Timeline (vistas puras, sin hooks: sirven en servidor)
│  └─ funcionario/           FuncionarioApp (sesión, filtros, paginación) · StatsPanel · Inbox · CaseDrawer · useRealtime
└─ lib/
   ├─ api.ts                 Cliente tipado del backend (público y de funcionario). Único lugar con `fetch`
   ├─ types.ts               Formas de las respuestas (docs/CONTRACT.md §4)
   ├─ format.ts · labels.ts · legal.ts · segments.ts · staffKey.ts · useDebounced.ts
docs/CONTRACT.md             Contrato entre los 3 repos (idéntico en todos)
tests/                       Pruebas con `tsx --test` + stubs de next/link y next/navigation + datos de ejemplo
scripts/browser-verify.mjs   Verificación en Chromium; scripts/verify/ = harness (esbuild) y API simulada
```

Flujo de datos: `navegador → api.ts → backend (/api/v1) → IA`. El servidor de Next solo llama al backend en `/consulta/[radicado]` y `/transparencia`.

### Decisiones de diseño
* **La vista previa es honesta**: muestra la confianza, las razones en español y avisa si la IA no estaba disponible (clasificación básica por palabras clave). Dice que la clasificación es automática y que un funcionario la confirma.
* **Privacidad**: la consulta pública no muestra datos personales ni texto; no revela si falló el radicado o el código; esas páginas y la de funcionarios son `noindex`. La clave de funcionario vive en `sessionStorage` (con `try/catch`: puede estar bloqueado). La exportación CSV no trae textos.
* **Tiempo real sin tormentas**: la bandeja se recarga por eventos de socket.io, agrupados (una ráfaga de eventos = una recarga a los 400 ms). Si el socket cae, la interfaz sigue funcionando y muestra «Sin conexión en vivo».
* **El servidor manda en la lógica de plazos**: el frontend no calcula días hábiles; muestra lo que dice el backend (`dueDate`, `businessDaysLeft`, `slaStatus`). Los plazos de la portada (`lib/legal.ts`) son texto de referencia y la tabla viva sale de `/public/transparency`.
* **Sin librerías de UI/gráficos**: CSS propio con variables (claro/oscuro) y gráficos en SVG, para que pese poco y sea fácil de cambiar por la identidad de la entidad.
* **Accesibilidad básica**: enlace «Saltar al contenido», etiquetas en todos los campos, `role="alert"` en errores, `aria-live` en la vista previa, panel de detalle como `dialog` que se cierra con Escape, semáforo con texto (no solo color).
* **Probado sin servidor**: `useRealtime` recibe una fábrica de sockets inyectable; así se prueba sin servidor socket.io.

## Qué está hecho y qué no

**Verificado** (sandbox: Node 22, Chromium 141 de Playwright):
* `npm test` → 14 pruebas (formato colombiano, fechas civiles sin desfase de zona horaria, segmentación de entidades con casos límite, render de `TrackingView`, `TransparencyView` —con y sin datos—, `Inbox`, `StatsPanel`, `ClassificationPreview`, `ReceiptCard`).
* `tsc` estricto sobre `src/`, `tests/` y `scripts/verify/` (con declaraciones mínimas de React/Next hechas a mano, ver «No verificado»).
* **`verify:browser` → 48 de 48** en Chromium real con los componentes reales: vista previa con *debounce* y descarte de respuestas viejas (carrera provocada a propósito), validación, error 429 sin perder el texto, recibo, modo anónimo sin datos personales, formato de radicado, ingreso de funcionario (clave mala / buena / clave revocada a mitad de sesión), filtros, búsqueda con *debounce*, panel de detalle (entidades resaltadas, datos personales marcados, confirmar → reclasificar → responder → cerrar), exportación CSV, tiempo real (una ráfaga = una recarga), datos de demostración, reentrenar, cierre de sesión y ausencia de desbordamiento horizontal a 375 px.
* **Contra el servicio real del backend** (no el simulado): se levantó el dominio real de `pqrsd-router-backend` (con una IA falsa) detrás de HTTP y se recorrió radicar → vista previa → recibo → consulta → bandeja → detalle → confirmar → responder → cerrar → demo. Pasó, y destapó dos defectos reales que ya están corregidos (el backend ordenaba arriba las solicitudes ya respondidas; y un selector del panel de detalle duplicaba ids con los filtros). Ese adaptador es un script temporal y **no** está en este repo.
* Compatibilidad estática de tipos: las respuestas de los 10 endpoints que usa la interfaz (`preview`, `create`, `tracking`, `transparency`, `taxonomy`, `list`, `get`, `stats`, `aiStatus`, `seed`) son asignables a los tipos de `lib/types.ts`.

**No verificado (escrito pero nunca ejecutado):**
* **`next dev`, `next build` y `next start`**: en el sandbox no se pudo instalar `next` (npm bloqueado). Las páginas de `src/app/**` (SSG/SSR/ISR, `metadata`, `robots.ts`, `error.tsx`) y `next.config.mjs` están revisados a mano contra la API de Next 14 pero **nunca se compilaron**. Es el primer paso al retomar: `npm install && npm run build`.
* Que `/transparencia` se regenere de verdad cada 60 s, que `/consulta/...` no se cachee y el comportamiento con el backend caído durante `next build` (la página tiene un estado de error, pero hay que mirarlo).
* **`socket.io-client` real** (`defaultSocketFactory`) contra el gateway real: en las pruebas se inyecta un socket falso. Tampoco se probó el reintento ni el cambio de `polling` a `websocket`.
* React 18 (lo que declara `package.json`): las pruebas y el navegador se ejecutaron con React 19, lo único instalable en el sandbox. Los tipos de React/Next se simularon con declaraciones mínimas (`any` en JSX y eventos), así que `npm run typecheck` con los `@types` reales puede encontrar errores nuevos.
* `Dockerfile`, `docker-compose.yml` y el workflow de CI no se ejecutaron.
* Firefox/Safari, lectores de pantalla y una auditoría de accesibilidad (axe/Lighthouse): no se hicieron.
* Rendimiento con miles de casos en la bandeja (pagina de 50 en 50; no se midió).

## Limitaciones conocidas
* Una sola clave compartida para funcionarios (sin usuarios ni roles); el backend la valida con `X-Staff-Key`.
* La bandeja no asigna casos a un funcionario concreto ni gestiona prórrogas ni notificaciones al ciudadano (el backend tampoco).
* Textos legales de la portada: referencia, no asesoría jurídica; **validar con el área jurídica** (sobre todo el plazo de las denuncias).
* Un solo idioma (español) y una sola entidad.

## Despliegue (más adelante)
Vercel/Netlify (poner `NEXT_PUBLIC_API_URL` apuntando al backend público) o contenedor (`Dockerfile`, salida `standalone`). El backend debe tener
`CORS_ORIGINS` con el dominio del frontend. Detrás de HTTPS, porque la clave de funcionario viaja en una cabecera.

## Nombre de repositorio sugerido
`pqrsd-router-frontend`
