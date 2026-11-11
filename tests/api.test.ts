import assert from 'node:assert/strict';
import { test } from 'node:test';
import { apiBaseUrl, socketOrigin } from '../src/lib/api';

const KEYS = ['NEXT_PUBLIC_API_URL', 'NEXT_PUBLIC_SOCKET_URL', 'API_URL_INTERNAL'] as const;

function withEnv(env: Partial<Record<(typeof KEYS)[number], string>>, fn: () => void): void {
  const saved = KEYS.map((k) => [k, process.env[k]] as const);
  for (const k of KEYS) delete process.env[k];
  Object.assign(process.env, env);
  try {
    fn();
  } finally {
    for (const [k, v] of saved) if (v === undefined) delete process.env[k]; else process.env[k] = v;
  }
}

test('socketOrigin quita el sufijo /api/v1 de la URL del backend', () => {
  withEnv({ NEXT_PUBLIC_API_URL: 'https://api.entidad.gov.co/api/v1/' }, () => assert.equal(socketOrigin(), 'https://api.entidad.gov.co'));
  withEnv({}, () => assert.equal(socketOrigin(), 'http://localhost:3001'));
});

test('una variable vacía (como la deja el Dockerfile) no anula la URL del backend', () => {
  withEnv({ NEXT_PUBLIC_SOCKET_URL: '', NEXT_PUBLIC_API_URL: 'http://localhost:3001/api/v1' }, () => assert.equal(socketOrigin(), 'http://localhost:3001'));
  withEnv({ NEXT_PUBLIC_SOCKET_URL: 'wss://rt.entidad.gov.co', NEXT_PUBLIC_API_URL: 'http://x/api/v1' }, () => assert.equal(socketOrigin(), 'wss://rt.entidad.gov.co'));
  withEnv({ API_URL_INTERNAL: '', NEXT_PUBLIC_API_URL: 'http://backend:3001/api/v1/' }, () => assert.equal(apiBaseUrl(), 'http://backend:3001/api/v1'));
});

test('siteUrl: explícita, dominio de producción de Vercel o localhost', async () => {
  const { siteUrl } = await import('../src/lib/site');
  assert.equal(siteUrl({ NEXT_PUBLIC_SITE_URL: 'https://pqrsd.gov.co/' }), 'https://pqrsd.gov.co');
  assert.equal(siteUrl({ VERCEL_PROJECT_PRODUCTION_URL: 'pqrsd-router.vercel.app' }), 'https://pqrsd-router.vercel.app');
  assert.equal(siteUrl({}), 'http://localhost:3000');
});
