# Guía de demostración (entrega del proyecto final)

**Clasificador y Enrutador Inteligente de PQRSD para Entidades Públicas.** Son tres repositorios que trabajan juntos:

| Repo | Qué hace | Tecnología |
|------|----------|------------|
| `pqrsd-router-ai` | Clasifica el texto del ciudadano: tipo (petición, queja, reclamo, sugerencia, denuncia), dependencia, urgencia, entidades y datos personales. Aprende de las correcciones de los funcionarios | Python · FastAPI · scikit-learn |
| `pqrsd-router-backend` | Radica, calcula el plazo legal en días hábiles (festivos de Colombia), gestiona el flujo del caso, avisa en tiempo real y envía correos | NestJS · PostgreSQL · socket.io |
| `pqrsd-router-frontend` | Portal del ciudadano (radicar, consultar, transparencia) y bandeja del funcionario | Next.js 14 (SSG, SSR, ISR y CSR) |

```
Ciudadano ─▶ Next.js ─▶ NestJS ─▶ IA (FastAPI)          si la IA no responde, el backend clasifica
                 ▲         │  └─▶ PostgreSQL              por palabras clave y marca el caso para revisión
Funcionario ◀── socket.io ─┘
```

## 1. Ponerlo a funcionar (una sola orden)

Requisito: Docker Desktop. Clona los tres repos **en la misma carpeta** y, desde `pqrsd-router-frontend`:

```bash
docker compose up --build        # primera vez ~3-5 min. Luego abre http://localhost:3000
```

Claves de funcionario de la demo local (solo para esta demo; en Render se usan otras):

| Clave | Entra como |
|-------|-----------|
| `ana-demo-2026` | Ana Pérez |
| `luis-demo-2026` | Luis Ruiz |
| `demo-funcionario-2026` | Funcionario (clave compartida) |

Sin Docker: tres terminales (`uvicorn app.main:app --port 8000` en la IA, `npm run start:dev` en el backend y `npm run dev` en el
frontend). Sin `DATABASE_URL`, el backend guarda los casos en archivos JSON, y sin clave entra en modo desarrollo.

## 2. Recorrido sugerido (≈10 minutos)

1. **Inicio `/`**: página estática (SSG) con los derechos del ciudadano y los plazos de ley.
2. **Funcionario `/funcionario`**: entra con `ana-demo-2026`. Arriba debe decir «En vivo» y «Sesión: Ana Pérez».
   En «IA y datos de demostración» pulsa **Crear 60 casos de demostración**. Así la bandeja y las estadísticas tienen datos.
3. **Radicar `/radicar`**, en otra pestaña: escribe, por ejemplo, *«Hace tres semanas no llega el agua a mi barrio y tengo un bebé»*.
   Mientras escribes, la IA muestra tipo, dependencia, urgencia y plazo. Radica y guarda el número y el código.
4. Vuelve a la bandeja: **el caso aparece solo, sin recargar** (socket.io). Ábrelo y muestra:
   * la justificación de la IA y los datos personales resaltados;
   * **Corregir** la dependencia: la corrección se envía a la IA, sin datos personales, para reentrenarla;
   * **Asignarme**: el historial registra «Ana Pérez»;
   * **Ampliar el plazo** (Art. 14 parágrafo): solo una vez y como máximo el doble del plazo inicial;
   * **Trasladar por competencia** (Art. 21) o **Responder**.
5. **Consulta `/consulta`** con el número y el código: página SSR, siempre al día y no indexable. El ciudadano ve el estado y el
   historial, pero **no** el nombre del funcionario ni el motivo interno de la ampliación.
6. **Transparencia `/transparencia`**: página ISR que se regenera cada 60 s. Muestra respondidas a tiempo, vencidas y días promedio, sin datos personales.
7. Opcional: apaga la IA (`docker compose stop ai`) y radica otro caso. La radicación sigue funcionando y el caso queda marcado «sin IA».

## 3. Qué demuestra cada parte

| Tema | Dónde verlo |
|------|-------------|
| Patrones de renderizado de Next.js | `/` SSG · `/consulta/[radicado]` SSR · `/transparencia` ISR · `/funcionario` CSR (tabla en el README del frontend) |
| Inteligencia artificial | `pqrsd-router-ai`: TF-IDF + regresión logística, reglas de urgencia, detección de entidades, reentrenamiento con las correcciones |
| Tiempo real | socket.io: casos nuevos y cambios aparecen en la bandeja sin recargar |
| Reglas de negocio | Plazos en días hábiles con festivos de Colombia (Ley 1755 de 2015), ampliación (Art. 14) y traslado (Art. 21 de la Ley 1437 de 2011) |
| Datos personales (Ley 1581) | Consentimiento obligatorio, opción anónima y vistas públicas sin datos personales; a la IA no le llega el nombre ni el correo del ciudadano |
| Calidad | Pruebas automáticas en los tres repos, auditoría de accesibilidad WCAG 2.1 AA (axe) y contrato común `docs/CONTRACT.md` |
| Despliegue | Render (backend + IA, `render.yaml`), Neon (PostgreSQL) y Vercel (frontend): ver `docs/DEPLOY.md` |

## 4. Pruebas rápidas

```bash
# pqrsd-router-ai
pip install -r requirements-dev.txt && pytest -q
# pqrsd-router-backend
npm ci && npm run typecheck && npm test && npm run test:http
# pqrsd-router-frontend
npm ci && npm run typecheck && npm test
```

## 5. Alcance y límites (dicho con honestidad)

* La IA se entrenó con un **corpus sintético** en español colombiano, no con PQRSD reales de una entidad.
  Mejora con las correcciones de los funcionarios.
* El acceso de funcionarios usa **claves con nombre** (`STAFF_USERS`), no un sistema completo de usuarios y roles.
* La bandeja filtra en memoria. Sobra para los volúmenes de una entidad mediana o de la demo, pero no para millones de casos.
* En el plan gratuito de Render los servicios se duermen tras unos 15 minutos sin uso y la primera visita tarda cerca de un minuto.
  La base de datos gratuita vence a los 30 días.
