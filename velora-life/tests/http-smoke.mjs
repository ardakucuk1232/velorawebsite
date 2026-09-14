import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomBytes } from 'node:crypto';
const directory = mkdtempSync(join(tmpdir(), 'velora-http-'));
const port = String(20000 + Math.floor(Math.random() * 20000));
const origin = 'http://localhost:' + port;
const env = {
  ...process.env,
  APP_URL: origin,
  DATABASE_PATH: join(directory, 'test.sqlite'),
  NODE_ENV: 'production',
};
const password = randomBytes(24).toString('hex');
const admin = spawnSync(process.execPath, ['scripts/create-admin.mjs'], {
  env: {
    ...env,
    ADMIN_EMAIL: 'owner@example.test',
    ADMIN_NAME: 'Test Yönetici',
    ADMIN_PASSWORD: password,
  },
  encoding: 'utf8',
});
assert.equal(admin.status, 0, admin.stderr);
const server = spawn(
  process.execPath,
  ['node_modules/next/dist/bin/next', 'start', '-H', '127.0.0.1', '-p', port],
  {
    env,
    stdio: ['ignore', 'pipe', 'pipe'],
  },
);
let logs = '';
server.stdout.on('data', (b) => (logs += b));
server.stderr.on('data', (b) => {
  logs += b;
  process.stderr.write(b);
});
let cookie = '';
async function call(path, body, method = 'POST') {
  const response = await fetch(origin + path, {
    signal: AbortSignal.timeout(10000),
    method,
    headers: {
      'content-type': 'application/json',
      origin,
      cookie,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    redirect: 'manual',
  });
  const set = response.headers.get('set-cookie');
  if (set) cookie = set.split(';')[0];
  return response;
}
try {
  let ready = false;
  for (let n = 0; n < 15; n++) {
    try {
      if (
        (
          await fetch(origin, {
            signal: AbortSignal.timeout(2000),
          })
        ).ok
      ) {
        ready = true;
        break;
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 250));
  }
  assert.ok(ready, logs);
  for (const path of [
    '/',
    '/products',
    '/about',
    '/community',
    '/account',
    '/info',
    '/images/hero.webp',
  ])
    assert.equal((await fetch(origin + path)).status, 200, path);
  assert.equal((await fetch(origin + '/api/admin')).status, 401);
  const spoof = await fetch(origin + '/api/me', {
    headers: {
      'oai-authenticated-user-id': 'owner',
      'oai-authenticated-user-email': 'owner@example.test',
    },
  });
  assert.equal((await spoof.json()).identity, null);
  assert.equal(
    (
      await call('/api/auth/login', {
        email: 'owner@example.test',
        password,
      })
    ).status,
    200,
  );
  assert.ok(cookie.startsWith('velora_session='));
  assert.equal((await (await call('/api/me', undefined, 'GET')).json()).isOwner, true);
  assert.equal((await call('/admin', undefined, 'GET')).status, 200);
  assert.equal(
    (
      await call(
        '/api/admin',
        {
          action: 'inventory',
          id: 'daily-greens',
          version: -1,
          delta: 5,
          reorder: 1,
          location: 'A-01',
          reason: 'HTTP test stok girişi',
        },
        'PATCH',
      )
    ).status,
    200,
  );
  await call('/api/auth/logout', {});
  const customer = {
    email: 'customer@example.test',
    password,
    name: 'Deneme Müşteri',
  };
  assert.equal((await call('/api/auth/register', customer)).status, 201);
  const profile = {
    name: customer.name,
    phone: '05551234567',
    address: 'Test Mahallesi 10/2',
    city: 'Ankara',
  };
  assert.equal((await call('/api/me', profile)).status, 200);
  assert.equal((await call('/api/admin', undefined, 'GET')).status, 403);
  const catalog = await (await call('/api/catalog', undefined, 'GET')).json();
  assert.deepEqual(Object.keys(catalog), ['availability']);
  assert.equal(catalog.availability['daily-greens'], true);
  assert.equal(
    (
      await call(
        '/api/cart',
        {
          productId: 'daily-greens',
          delta: 1,
        },
        'PATCH',
      )
    ).status,
    200,
  );
  assert.equal(
    (
      await call('/api/orders', {
        ...profile,
        id: crypto.randomUUID(),
      })
    ).status,
    201,
  );
  const orders = await (await call('/api/orders', undefined, 'GET')).json();
  assert.equal(orders.orders.length, 1);
  assert.equal(orders.orders[0].total, 949);
  await call('/api/auth/logout', {});
  assert.equal(
    (
      await call('/api/auth/login', {
        email: 'owner@example.test',
        password,
      })
    ).status,
    200,
  );
  const dashboard = await (await call('/api/admin', undefined, 'GET')).json();
  assert.equal(dashboard.inventory.find((x) => x.id === 'daily-greens').stock, 4);
  console.log(
    'HTTP doğrulaması başarılı: sayfalar, gerçek giriş/çıkış çerezleri, yetkiler, stok girişi ve sipariş stok düşümü.',
  );
} finally {
  if (server.exitCode === null) {
    server.kill('SIGTERM');
    await new Promise((r) => server.once('exit', r));
  }
  rmSync(directory, {
    recursive: true,
    force: true,
  });
}
