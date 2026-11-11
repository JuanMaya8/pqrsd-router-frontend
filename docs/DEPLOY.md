# Despliegue del frontend en Vercel

Primero despliega el backend y la IA en Render (`pqrsd-router-backend/docs/DEPLOY.md`): necesitas la URL pública del backend.

## Pasos
1. Vercel → **Add New → Project** → importa el repo `pqrsd-router-frontend`. Vercel detecta Next.js (no cambies los comandos).
2. **Environment Variables** (Production y Preview):

   | Variable | Valor | Para qué |
   |----------|-------|----------|
   | `NEXT_PUBLIC_API_URL` | `https://pqrsd-router-backend.onrender.com/api/v1` | Navegador y servidor de Next → backend (se incrusta en el JS al compilar) |
   | `NEXT_PUBLIC_SITE_URL` | opcional, p. ej. `https://pqrsd.tu-dominio.gov.co` | `sitemap.xml` / `robots.txt`. Sin ella se usa el dominio de producción de Vercel |

   No hace falta `API_URL_INTERNAL` (solo para Docker) ni `NEXT_PUBLIC_SOCKET_URL` (se deduce de la URL de la API).
   **Nunca** pongas la clave de funcionario en una variable: se escribe en `/funcionario` y vive en `sessionStorage`.
3. **Deploy**. Luego copia el dominio (`https://<proyecto>.vercel.app`) en `CORS_ORIGINS` y `PUBLIC_APP_URL` del backend en Render.
   Sin eso el navegador bloquea las llamadas (CORS) y el tiempo real no conecta.
4. Comprueba: `/` (estático), `/radicar` (vista previa en vivo), `/transparencia` (ISR, 60 s), `/funcionario` con la `STAFF_API_KEY` de Render
   (debe decir «En vivo»), `/sitemap.xml` y `/robots.txt`.

## Detalles que ya están resueltos en el código
* `/consulta/[radicado]` y `/transparencia` declaran `maxDuration = 30` y `src/lib/api.ts` corta las peticiones del servidor a los 25 s:
  si el backend de Render está dormido, la página muestra «el servidor está tardando» en lugar de que Vercel corte la función.
* Durante el *build* Vercel prerenderiza `/transparencia`; si el backend no responde, queda el aviso de error y se regenera sola en la
  primera visita pasados 60 s.
* `next.config.mjs` añade cabeceras de seguridad; `output: 'standalone'` solo se activa en Docker (`NEXT_OUTPUT`), Vercel lo ignora.
* *Preview deployments*: cada uno tiene su propio dominio; agrégalo a `CORS_ORIGINS` si quieres probarlo contra el backend real.
