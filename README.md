# PQRSD Inteligente · Portal web

Portal ciudadano y bandeja de funcionarios del proyecto **Clasificador y Enrutador Inteligente de PQRSD para Entidades Públicas**.

Hoy un funcionario lee cada PQRSD (Petición, Queja, Reclamo, Sugerencia o Denuncia) una por una para decidir a qué dependencia va y
qué tan urgente es: eso crea cuellos de botella y plazos legales incumplidos. Con este sistema el ciudadano escribe su caso con sus
palabras y **la IA lo clasifica al recibirlo**: tipo, dependencia competente, urgencia y plazo legal. El funcionario recibe una bandeja
**ordenada por riesgo de vencimiento**, en tiempo real, y cada corrección que hace enseña a la IA.

| Repositorio | Rol |
|---|---|
| **`pqrsd-router-frontend`** (este) | Portal ciudadano y bandeja de funcionarios (Next.js) |
| [`pqrsd-router-backend`](https://github.com/JuanMaya8/pqrsd-router-backend) | Radicación, plazos legales, flujo y tiempo real (NestJS) |
| [`pqrsd-router-ai`](https://github.com/JuanMaya8/pqrsd-router-ai) | Clasificación híbrida, entidades y aprendizaje continuo (FastAPI + scikit-learn) |

```
Ciudadano ──▶ Next.js (Vercel) ──▶ NestJS (Render) ──▶ IA FastAPI (Render)
                                       │
Funcionario ◀── Socket.IO ─────────────┤
                                       └──▶ PostgreSQL (Neon)
```

> **Para revisar el proyecto:** la [Guía de demostración](docs/GUIA_DEMO.md) explica cómo levantar todo con una orden, las claves de
> prueba y un recorrido de 10 minutos.

---

## Pantallas

### Ciudadano
| Ruta | Qué hace |
|---|---|
| `/` | Cómo funciona, los 5 tipos de solicitud y la tabla de plazos legales |
| `/radicar` | Formulario en texto libre con **vista previa en vivo** de lo que entendió la IA (tipo y confianza, dependencia, urgencia, plazo y datos detectados). Permite radicar de forma anónima. Entrega radicado y código de seguimiento |
| `/consulta` | Consulta del estado con radicado + código: semáforo, dependencia, plazo, historial y respuesta. Sin datos personales |
| `/transparencia` | Indicadores públicos: totales, por tipo y dependencia, vencidas, porcentaje a tiempo y evolución semanal |

### Funcionario (`/funcionario`, con clave)
* Bandeja **en vivo**: las solicitudes nuevas aparecen sin recargar.
* Indicadores: abiertas, por confirmar, en riesgo, vencidas, porcentaje a tiempo, días promedio y acuerdo con la IA.
* Filtros por tipo, dependencia, urgencia, estado y semáforo, más búsqueda.
* Panel de detalle: texto con entidades resaltadas, justificación de la IA, **confirmar o corregir** la clasificación, asignarse el caso,
  ampliar el plazo, trasladar por competencia, responder y cerrar.
* Exportación CSV sin datos personales, reentrenamiento de la IA y datos de demostración.

## Un patrón de renderizado por ruta

| Ruta | Patrón | Por qué |
|---|---|---|
| `/` | **SSG** | Contenido fijo: se sirve desde el CDN y se indexa bien |
| `/radicar` | **CSR** en página estática | Formulario interactivo con vista previa (espera 700 ms y descarta respuestas viejas) |
| `/consulta/[radicado]` | **SSR** (`noindex`) | Estado siempre al día, depende de un código privado y nunca se guarda en caché |
| `/transparencia` | **ISR** (60 s) | Cifras agregadas muy consultadas que cambian despacio |
| `/funcionario` | **CSR** + Socket.IO | Privada, interactiva y en tiempo real (`noindex`) |

## Diseño y accesibilidad

* Sistema visual propio con **variables CSS** (tema claro y oscuro), tipografía **Inter** e iconos SVG propios: sin librerías de UI ni de gráficos.
* Pensado primero para móvil.
* Orientado a **WCAG 2.1 AA**: controles de 44–48 px, foco visible de alto contraste, etiquetas en todos los campos, avisos con
  `aria-live`, panel de detalle que se cierra con Escape, enlace «Saltar al contenido».
* El **semáforo nunca depende solo del color**: siempre lleva color, icono y texto.

## Privacidad y seguridad

* La consulta pública no muestra el texto, los datos del ciudadano ni el nombre del funcionario, y responde igual si falla el radicado o el código.
* La clave del funcionario no está en el código: se escribe al entrar y vive solo en la pestaña (`sessionStorage`).
* La interfaz no calcula plazos: muestra lo que decide el backend.
* Si la IA no está disponible, la vista previa lo dice claramente.

## Tecnologías

Next.js 14 (App Router) · React 18 · TypeScript · CSS propio · Socket.IO client · pruebas con `tsx --test` · Playwright + axe-core para
verificación en navegador y accesibilidad.

## Estructura

```
src/
├── app/                 Rutas: inicio, radicar, consulta, transparencia, funcionario
├── components/          Formulario, vista previa, recibo, seguimiento, transparencia, gráficos SVG, iconos
│   └── funcionario/     Bandeja, indicadores, panel de detalle y tiempo real
└── lib/                 Cliente del backend (único lugar con fetch), tipos, formato y textos
docs/                    Contrato entre repos, despliegue y guía de demostración
tests/                   Pruebas de utilidades y de render de componentes
scripts/                 Verificación en navegador y pruebas de punta a punta
```

## Ejecutar en local

Requisitos: **Node 18.18+** y el backend en `:3001`.

```bash
npm install
cp .env.example .env.local
npm run dev                # http://localhost:3000
```

Todo el sistema con Docker (con los tres repos clonados en la misma carpeta):

```bash
docker compose up --build  # http://localhost:3000
```

Pruebas:

```bash
npm run typecheck
npm test                   # utilidades y render de componentes
npm run build
npm run verify:browser     # Chromium + API simulada (requiere npx playwright install chromium)
npm run e2e:fullstack      # Chromium contra la pila real, incluye auditoría axe
```

## Variables de entorno

| Variable | Para qué |
|---|---|
| `NEXT_PUBLIC_API_URL` | Dirección pública del backend (`…/api/v1`) |
| `API_URL_INTERNAL` | Dirección que usa el servidor de Next (SSR/ISR); por defecto la misma |
| `NEXT_PUBLIC_SOCKET_URL` | Solo si Socket.IO está en otro origen |
| `NEXT_PUBLIC_SITE_URL` | Dominio para `sitemap.xml` y `robots.txt` |

## Despliegue

Desplegado en **Vercel**; el backend y la IA en **Render** y la base de datos en **Neon**. Paso a paso en [`docs/DEPLOY.md`](docs/DEPLOY.md).

## Documentación

* [Guía de demostración](docs/GUIA_DEMO.md)
* [Contrato entre los 3 repositorios](docs/CONTRACT.md)
* [Despliegue en Vercel](docs/DEPLOY.md)

## Limitaciones y trabajo futuro

* Usuarios con roles por dependencia (hoy las cuentas de funcionario tienen los mismos permisos).
* Adjuntos y verificación anti-bots en la radicación.
* Pruebas con lector de pantalla y en Firefox/Safari.
* Paginación y virtualización para bandejas de miles de casos.
