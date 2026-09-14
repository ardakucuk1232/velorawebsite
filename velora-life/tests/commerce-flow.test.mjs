import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, readdirSync, mkdirSync } from 'node:fs';
import { build } from 'esbuild';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after } from 'node:test';
import { openDatabase } from '../scripts/database.mjs';
const directory = mkdtempSync(join(tmpdir(), 'velora-commerce-'));
process.env.DATABASE_PATH = join(directory, 'test.sqlite');
const sql = openDatabase();
let current = null;
globalThis.__identity = () => current;
mkdirSync(new URL('../work', import.meta.url), {
  recursive: true,
});
await build({
  stdin: {
    contents: `export * as me from './app/api/me/route.ts';export * as cart from './app/api/cart/route.ts';export * as orders from './app/api/orders/route.ts';export * as admin from './app/api/admin/route.ts';export * as catalog from './app/api/catalog/route.ts';`,
    resolveDir: new URL('..', import.meta.url).pathname,
  },
  outfile: new URL('../work/api-test.mjs', import.meta.url).pathname,
  bundle: true,
  platform: 'node',
  format: 'esm',
  plugins: [
    {
      name: 'test-identity',
      setup(b) {
        b.onResolve(
          {
            filter: /^\.\/auth$/,
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
          () => ({
            contents:
              "export const identity=async()=>globalThis.__identity(); export const appOrigin=()=> 'https://velora.test';",
          }),
        );
      },
    },
  ],
});
after(() => {
  sql.close();
  globalThis.veloraDatabase?.close();
  delete globalThis.veloraDatabase;
  rmSync(directory, {
    recursive: true,
    force: true,
  });
});
const routes = await import('../work/api-test.mjs');
const owner = {
  id: 'owner',
  email: 'owner@example.test',
};
const customer = {
  id: 'customer',
  email: 'customer@example.test',
};
const staff = {
  id: 'staff',
  email: 'staff@example.test',
};
function request(path, body, origin = 'https://velora.test') {
  return new Request('https://velora.test/api/' + path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: origin,
    },
    body: JSON.stringify(body),
  });
}
async function post(route, body) {
  const res = await routes[route].POST(request(route, body));
  return {
    status: res.status,
    body: await res.json(),
  };
}
const registration = {
  name: 'Test Kullanıcı',
  phone: '05551234567',
  city: 'Ankara / Çankaya',
  address: 'Test Mahallesi 10/2',
  partner: true,
};
const mutate = async (body) => {
  const r = await routes.admin.PATCH(request('admin', body));
  return {
    status: r.status,
    body: await r.json(),
  };
};
const dashboard = async () => await (await routes.admin.GET()).json();
const inventoryStock = () =>
  Object.fromEntries(
    sql
      .prepare('SELECT product_id,stock FROM inventory')
      .all()
      .map((r) => [r.product_id, r.stock]),
  );
const cartAdd = async (id) =>
  await routes.cart.PATCH(
    request('cart', {
      productId: id,
      delta: 1,
    }),
  );
test('complete commerce and corporate inventory workflow', async () => {
  current = null;
  assert.equal((await routes.orders.GET()).status, 401);
  sql.prepare("INSERT INTO settings VALUES ('owner',?)").run(owner.id);
  current = owner;
  assert.equal((await post('me', registration)).status, 200);
  assert.equal((await (await routes.me.GET()).json()).isOwner, true);
  for (const id of ['daily-greens', 'glow-serum', 'botanic-tea'])
    assert.equal(
      (
        await mutate({
          action: 'inventory',
          id,
          version: -1,
          delta: 5,
          reorder: 1,
          location: 'A-01',
          reason: 'Test açılış sayımı',
        })
      ).status,
      200,
    );
  const catalog = await (await routes.catalog.GET()).json();
  assert.equal(Object.keys(catalog.availability).length, 9);
  assert.equal(catalog.stock, undefined);
  assert.ok(Object.values(catalog.availability).every((value) => typeof value === 'boolean'));
  assert.equal(catalog.availability['daily-greens'], true);
  assert.equal(catalog.availability['pure-cleanse'], false);
  current = customer;
  const publicCatalog = await (await routes.catalog.GET()).json();
  assert.deepEqual(Object.keys(publicCatalog), ['availability']);
  assert.ok(Object.values(publicCatalog.availability).every((v) => typeof v === 'boolean'));
  assert.equal(
    (
      await post('me', {
        ...registration,
        role: 'staff',
        name: 'Müşteri Test',
      })
    ).status,
    200,
  );
  assert.equal((await routes.admin.GET()).status, 403);
  assert.equal((await cartAdd('pure-cleanse')).status, 409);
  assert.equal((await cartAdd('daily-greens')).status, 200);
  assert.equal((await cartAdd('glow-serum')).status, 200);
  const firstId = crypto.randomUUID();
  assert.equal(
    (
      await post('orders', {
        ...registration,
        id: firstId,
        total: 1,
      })
    ).status,
    201,
  );
  assert.equal(
    (
      await post('orders', {
        ...registration,
        id: firstId,
      })
    ).status,
    200,
  );
  let own = await (await routes.orders.GET()).json();
  assert.equal(own.orders.length, 1);
  assert.equal(own.orders[0].total, 1580);
  assert.equal(own.orders[0].shipping, 0);
  let stocks = inventoryStock();
  assert.equal(stocks['daily-greens'], 4);
  assert.equal(stocks['glow-serum'], 4);
  assert.deepEqual((await (await routes.me.GET()).json()).profile.cart, {});
  await cartAdd('botanic-tea');
  current = owner;
  assert.equal(
    (
      await mutate({
        action: 'inventory',
        id: 'botanic-tea',
        version: 0,
        delta: -5,
        reorder: 1,
        location: 'A-01',
        reason: 'Test sayım düzeltmesi',
      })
    ).status,
    200,
  );
  const secondId = crypto.randomUUID();
  current = customer;
  assert.equal(
    (
      await post('orders', {
        ...registration,
        id: secondId,
      })
    ).status,
    409,
  );
  assert.equal((await (await routes.orders.GET()).json()).orders.length, 1);
  current = owner;
  assert.equal(
    (
      await mutate({
        action: 'inventory',
        id: 'botanic-tea',
        version: 1,
        delta: 2,
        reorder: 1,
        location: 'A-01',
        reason: 'Test yeni stok girişi',
      })
    ).status,
    200,
  );
  assert.equal(
    (
      await mutate({
        action: 'inventory',
        id: 'botanic-tea',
        version: 1,
        delta: 2,
        reorder: 1,
        location: 'A-01',
        reason: 'Eski sürüm denemesi',
      })
    ).status,
    409,
  );
  current = customer;
  assert.equal(
    (
      await post('orders', {
        ...registration,
        id: secondId,
      })
    ).status,
    201,
  );
  stocks = inventoryStock();
  assert.equal(stocks['botanic-tea'], 1);
  current = staff;
  assert.equal(
    (
      await post('me', {
        ...registration,
        name: 'Çalışan Test',
      })
    ).status,
    200,
  );
  assert.equal((await routes.admin.GET()).status, 403);
  current = owner;
  assert.equal((await (await routes.orders.GET()).json()).orders.length, 0);
  assert.equal(
    (
      await mutate({
        action: 'employee',
        id: 'staff',
        role: 'staff',
        department: 'Operasyon',
        title: 'Uzman',
      })
    ).status,
    200,
  );
  current = staff;
  assert.equal((await routes.admin.GET()).status, 200);
  let d = await dashboard();
  let first = d.orders.find((o) => o.id === firstId);
  assert.equal(
    (
      await mutate({
        id: first.id,
        version: first.version,
        previousStatus: first.status,
        status: 'Hazırlanıyor',
        internalNote: 'Müşteriye görünmeyen not',
        priority: 'Acil',
        assignedTo: staff.id,
        paymentStatus: 'Tahsil edildi',
      })
    ).status,
    200,
  );
  assert.equal(
    (
      await mutate({
        id: first.id,
        version: first.version,
        previousStatus: first.status,
        status: 'Teslim edildi',
      })
    ).status,
    409,
  );
  assert.equal(
    (
      await mutate({
        action: 'role',
        id: 'customer',
        role: 'staff',
      })
    ).status,
    403,
  );
  assert.equal(
    (
      await mutate({
        action: 'customer',
        id: customer.id,
        segment: 'VIP',
        note: 'Gizli CRM notu',
      })
    ).status,
    200,
  );
  current = customer;
  own = await (await routes.orders.GET()).json();
  const visible = own.orders.find((o) => o.id === firstId);
  assert.equal(visible.internal_note, undefined);
  assert.equal(visible.priority, undefined);
  assert.equal(visible.assigned_to, undefined);
  const profile = await (await routes.me.GET()).json();
  assert.equal(profile.profile.admin_note, undefined);
  assert.equal(profile.profile.segment, undefined);
  assert.equal(
    (
      await routes.cart.PATCH(
        request(
          'cart',
          {
            productId: 'botanic-tea',
            delta: 1,
          },
          'https://malicious.test',
        ),
      )
    ).status,
    403,
  );
  current = owner;
  d = await dashboard();
  let second = d.orders.find((o) => o.id === secondId);
  assert.equal(
    (
      await mutate({
        id: second.id,
        version: second.version,
        previousStatus: second.status,
        status: 'İptal edildi',
      })
    ).status,
    200,
  );
  d = await dashboard();
  second = d.orders.find((o) => o.id === secondId);
  assert.equal(second.stock_released, 1);
  assert.equal(d.inventory.find((p) => p.id === 'botanic-tea').stock, 2);
  assert.equal(
    (
      await mutate({
        id: second.id,
        version: second.version,
        previousStatus: second.status,
        status: 'İptal edildi',
        internalNote: 'İptal notu güncellemesi',
      })
    ).status,
    200,
  );
  assert.equal(inventoryStock()['botanic-tea'], 2);
  assert.equal(
    (
      await mutate({
        id: second.id,
        previousStatus: 'İptal edildi',
        status: 'Alındı',
      })
    ).status,
    409,
  );
  d = await dashboard();
  first = d.orders.find((o) => o.id === firstId);
  assert.equal(
    (
      await mutate({
        id: first.id,
        version: first.version,
        previousStatus: first.status,
        status: 'Kargoya verildi',
        tracking: 'Test Kargo 123',
      })
    ).status,
    200,
  );
  stocks = inventoryStock();
  assert.equal(stocks['daily-greens'], 4);
  assert.equal(stocks['glow-serum'], 4);
  d = await dashboard();
  assert.equal(d.summary.total, 2);
  assert.equal(d.summary.value, 1580);
  assert.equal(d.summary.collected, 1580);
  assert.ok(d.activity.some((e) => e.action === 'İptal stok iadesi'));
  const empty = await (
    await routes.admin.GET(new Request('https://velora.test/api/admin?from=1&to=2'))
  ).json();
  assert.equal(empty.summary.total, 0);
  assert.equal(
    (
      await mutate({
        action: 'role',
        id: 'staff',
        role: 'customer',
      })
    ).status,
    200,
  );
  current = staff;
  assert.equal((await routes.admin.GET()).status, 403);
  current = customer;
  await cartAdd('botanic-tea');
  const attempts = await Promise.all([
    post('orders', {
      ...registration,
      id: crypto.randomUUID(),
    }),
    post('orders', {
      ...registration,
      id: crypto.randomUUID(),
    }),
  ]);
  assert.deepEqual(attempts.map((a) => a.status).sort(), [201, 409]);
  assert.equal(inventoryStock()['botanic-tea'], 1);
  await cartAdd('daily-greens');
  await cartAdd('glow-serum');
  current = owner;
  d = await dashboard();
  const serum = d.inventory.find((p) => p.id === 'glow-serum');
  await mutate({
    action: 'inventory',
    id: 'glow-serum',
    version: serum.version,
    delta: -serum.stock,
    reorder: 1,
    location: 'A-02',
    reason: 'Test stok sayımı',
  });
  current = customer;
  assert.equal(
    (
      await post('orders', {
        ...registration,
        id: crypto.randomUUID(),
      })
    ).status,
    409,
  );
  assert.equal(inventoryStock()['daily-greens'], 4);
});
