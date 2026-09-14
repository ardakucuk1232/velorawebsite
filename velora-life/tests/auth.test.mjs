import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { build } from 'esbuild';
import { openDatabase } from '../scripts/database.mjs';
const directory = mkdtempSync(join(tmpdir(), 'velora-auth-'));
process.env.DATABASE_PATH = join(directory, 'auth.sqlite');
process.env.APP_URL = 'https://velora.test';
const sql = openDatabase();
const jar = new Map();
const options = new Map();
globalThis.__cookies = {
  get: (key) =>
    jar.has(key)
      ? {
          value: jar.get(key),
        }
      : undefined,
  set(key, value, config) {
    jar.set(key, value);
    options.set(key, config);
  },
};
mkdirSync('work', {
  recursive: true,
});
await build({
  stdin: {
    contents: `export * as register from './app/api/auth/register/route.ts';export * as login from './app/api/auth/login/route.ts';export * as logout from './app/api/auth/logout/route.ts';export * as me from './app/api/me/route.ts';export {identity} from './lib/auth.ts';`,
    resolveDir: process.cwd(),
  },
  outfile: 'work/auth-test.mjs',
  bundle: true,
  platform: 'node',
  format: 'esm',
  plugins: [
    {
      name: 'request-cookies',
      setup(b) {
        b.onResolve(
          {
            filter: /^next\/(headers|navigation)$/,
          },
          (a) => ({
            path: a.path,
            namespace: 'runtime',
          }),
        );
        b.onLoad(
          {
            filter: /.*/,
            namespace: 'runtime',
          },
          (a) => ({
            contents:
              a.path === 'next/headers'
                ? 'export const cookies=async()=>globalThis.__cookies'
                : 'export function redirect(path){throw new Error(path)}',
          }),
        );
      },
    },
  ],
});
const routes = await import('../work/auth-test.mjs');
const request = (route, body, origin = 'https://velora.test') =>
  new Request('https://velora.test/api/' + route, {
    method: 'POST',
    headers: {
      origin,
      'content-type': 'application/json',
      'oai-authenticated-user-id': 'forged',
      'oai-authenticated-user-email': 'owner@example.test',
    },
    body: JSON.stringify(body),
  });
const post = (route, body, origin) => routes[route].POST(request(route, body, origin));
after(() => {
  sql.close();
  globalThis.veloraDatabase?.close();
  delete globalThis.veloraDatabase;
  rmSync(directory, {
    recursive: true,
    force: true,
  });
});
test('registration, sessions, passwords, CSRF, throttling and no public owner bootstrap', async () => {
  const user = {
    name: 'Deneme Müşteri',
    email: 'customer@example.test',
    password: 'Strong-test-password-123',
  };
  assert.equal(await routes.identity(), null);
  assert.equal((await post('register', user, 'https://evil.test')).status, 403);
  assert.equal(
    (
      await post('register', {
        ...user,
        password: 'short',
      })
    ).status,
    400,
  );
  assert.equal((await post('register', user)).status, 201);
  const originalToken = jar.get('velora_session');
  assert.equal(options.get('velora_session').httpOnly, true);
  assert.equal(options.get('velora_session').secure, true);
  assert.equal(options.get('velora_session').sameSite, 'lax');
  const auth = sql.prepare('SELECT * FROM auth_users').get();
  assert.notEqual(auth.password_hash, user.password);
  assert.ok(auth.password_hash.startsWith('scrypt:'));
  assert.notEqual(
    sql.prepare('SELECT token_hash FROM auth_sessions').get().token_hash,
    originalToken,
  );
  assert.equal((await routes.identity()).email, user.email);
  const profile = {
    name: user.name,
    phone: '05551234567',
    address: 'Test Mahallesi 1',
    city: 'Ankara',
    role: 'staff',
  };
  assert.equal((await post('me', profile)).status, 200);
  const me = await (await routes.me.GET()).json();
  assert.equal(me.isOwner, false);
  assert.equal(me.profile.role, 'customer');
  assert.equal(sql.prepare("SELECT * FROM settings WHERE key='owner'").get(), undefined);
  assert.equal((await post('register', user)).status, 409);
  assert.equal((await post('logout', {})).status, 303);
  assert.equal(await routes.identity(), null);
  jar.set('velora_session', originalToken);
  assert.equal(await routes.identity(), null);
  jar.clear();
  assert.equal(
    (
      await post('login', {
        ...user,
        password: 'wrong',
      })
    ).status,
    401,
  );
  assert.equal((await post('login', user)).status, 200);
  assert.notEqual(jar.get('velora_session'), originalToken);
  sql.prepare('UPDATE auth_sessions SET expires=0').run();
  assert.equal(await routes.identity(), null);
  for (let i = 0; i < 11; i++)
    await post('login', {
      email: 'limit@example.test',
      password: 'incorrect-password',
    });
  assert.equal(
    (
      await post('login', {
        email: 'limit@example.test',
        password: 'incorrect-password',
      })
    ).status,
    429,
  );
});
