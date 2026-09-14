import { database, requireStaff, ApiError, fail, textField, checkOrigin } from '@/lib/server';
import { products, statuses, statusChoices } from '@/lib/products';
function createActivityLog(
  member: any,
  entity: string,
  id: string,
  action: string,
  detail: string,
  token = crypto.randomUUID(),
) {
  return database()
    .prepare(
      'INSERT INTO activity (id,actor_id,actor_name,entity,entity_id,action,detail,created) VALUES (?,?,?,?,?,?,?,?)',
    )
    .bind(token, member.id, member.name, entity, id, action, detail, Date.now());
}
function integerField(value: unknown, label: string, min: number, max: number) {
  if (!Number.isInteger(value) || Number(value) < min || Number(value) > max)
    throw new ApiError(label + ' alanını kontrol edin.');
  return Number(value);
}
export async function GET(request: Request) {
  try {
    const staff = await requireStaff();
    const connection = database();
    const url = new URL(request?.url || 'https://velora.test/api/admin');
    if (url.searchParams.has('customer')) {
      const rows = await connection
        .prepare(
          'SELECT id,number,total,status,created FROM orders WHERE user_id = ? ORDER BY created DESC LIMIT 100',
        )
        .bind(url.searchParams.get('customer'))
        .all();
      return Response.json(
        {
          orders: rows.results,
        },
        {
          headers: {
            'Cache-Control': 'no-store',
          },
        },
      );
    }
    if (url.searchParams.has('order')) {
      const id = url.searchParams.get('order');
      const result = await connection
        .prepare(
          'SELECT * FROM activity WHERE entity = ? AND entity_id = ? ORDER BY created DESC LIMIT 100',
        )
        .bind('order', id)
        .all();
      return Response.json(
        {
          activity: result.results,
        },
        {
          headers: {
            'Cache-Control': 'no-store',
          },
        },
      );
    }
    const from = Number(url.searchParams.get('from') || 0);
    const to = Number(url.searchParams.get('to') || Date.now() + 86400000);
    if (!Number.isFinite(from) || !Number.isFinite(to) || from < 0 || to < from)
      throw new ApiError('Tarih aralığı geçersiz.');
    const [rows, members, stocks, events, summary, daily, ranking, owner] = await Promise.all([
      connection
        .prepare(
          'SELECT orders.*, profiles.email, assigned.name AS assigned_name FROM orders JOIN profiles ON profiles.id = orders.user_id LEFT JOIN profiles assigned ON assigned.id = orders.assigned_to WHERE orders.created >= ? AND orders.created <= ? ORDER BY orders.created DESC LIMIT 500',
        )
        .bind(from, to)
        .all<any>(),
      connection
        .prepare(
          "SELECT p.id,p.name,p.email,p.phone,p.address,p.city,p.role,p.partner,p.referral,p.sponsor,p.created,p.department,p.title,p.admin_note,p.segment,COUNT(o.id) AS order_count,COALESCE(SUM(CASE WHEN o.status != 'İptal edildi' THEN o.total ELSE 0 END),0) AS order_value FROM profiles p LEFT JOIN orders o ON o.user_id = p.id GROUP BY p.id ORDER BY p.created DESC",
        )
        .all<any>(),
      connection.prepare('SELECT * FROM inventory').all<any>(),
      connection.prepare('SELECT * FROM activity ORDER BY created DESC LIMIT 100').all<any>(),
      connection
        .prepare(
          "SELECT COUNT(*) AS total,COALESCE(SUM(CASE WHEN status != 'İptal edildi' THEN total ELSE 0 END),0) AS value,COALESCE(SUM(CASE WHEN status IN ('Alındı','Hazırlanıyor') THEN 1 ELSE 0 END),0) AS pending,COALESCE(SUM(CASE WHEN status = 'Kargoya verildi' THEN 1 ELSE 0 END),0) AS shipped,COALESCE(SUM(CASE WHEN status = 'Teslim edildi' THEN 1 ELSE 0 END),0) AS delivered,COALESCE(SUM(CASE WHEN status = 'İptal edildi' THEN 1 ELSE 0 END),0) AS cancelled,COALESCE(SUM(CASE WHEN payment_status = 'Tahsil edildi' THEN total ELSE 0 END),0) AS collected FROM orders WHERE created >= ? AND created <= ?",
        )
        .bind(from, to)
        .first<any>(),
      connection
        .prepare(
          "SELECT strftime('%Y-%m-%d',created/1000,'unixepoch','+3 hours') AS date,COUNT(*) AS count,SUM(CASE WHEN status != 'İptal edildi' THEN total ELSE 0 END) AS value FROM orders WHERE created >= ? AND created <= ? GROUP BY date ORDER BY date",
        )
        .bind(from, to)
        .all<any>(),
      connection
        .prepare(
          "SELECT json_extract(j.value,'$.id') AS id,json_extract(j.value,'$.name') AS name,SUM(json_extract(j.value,'$.quantity')) AS quantity,SUM(json_extract(j.value,'$.quantity')*json_extract(j.value,'$.price')) AS value FROM orders o, json_each(o.items) j WHERE o.status != 'İptal edildi' AND o.created >= ? AND o.created <= ? GROUP BY json_extract(j.value,'$.id'),json_extract(j.value,'$.name') ORDER BY SUM(json_extract(j.value,'$.quantity')*json_extract(j.value,'$.price')) DESC",
        )
        .bind(from, to)
        .all<any>(),
      connection.prepare("SELECT value FROM settings WHERE key = 'owner'").first<any>(),
    ]);
    const inventory = products.map((x) => ({
      ...x,
      ...(stocks.results.find((s) => s.product_id === x.id) || {
        stock: null,
        reorder: 10,
        location: '',
        version: -1,
      }),
      sku: 'VL-' + x.id.toUpperCase(),
    }));
    return Response.json(
      {
        orders: rows.results.map((o) => ({
          ...o,
          items: JSON.parse(o.items),
        })),
        members: members.results.map((m) => ({
          ...m,
          isOwner: m.id === owner?.value,
        })),
        inventory,
        activity: events.results,
        summary,
        daily: daily.results,
        ranking: ranking.results,
        isOwner: staff.owner,
        from,
        to,
      },
      {
        headers: {
          'Cache-Control': 'no-store',
        },
      },
    );
  } catch (e) {
    return fail(e);
  }
}
export async function PATCH(request: Request) {
  try {
    checkOrigin(request);
    const staff = await requireStaff();
    const payload = await request.json();
    const connection = database();
    if (payload.action === 'role' || payload.action === 'employee') {
      if (!staff.owner)
        throw new ApiError('Çalışan yetkilerini yalnızca site yöneticisi değiştirebilir.', 403);
      const id = textField(payload.id, 'Üye', 1, 200);
      const member = await connection
        .prepare('SELECT * FROM profiles WHERE id = ?')
        .bind(id)
        .first<any>();
      if (!member) throw new ApiError('Üye bulunamadı.', 404);
      if (id === staff.id)
        throw new ApiError('Site yöneticisinin yetkisi bu alandan değiştirilemez.');
      if (!['staff', 'customer'].includes(payload.role)) throw new ApiError('Geçersiz rol.');
      const department = textField(payload.department ?? member.department, 'Departman', 0, 100);
      const title = textField(payload.title ?? member.title, 'Unvan', 0, 100);
      await connection.batch([
        connection
          .prepare('UPDATE profiles SET role = ?,department = ?,title = ? WHERE id = ?')
          .bind(payload.role, department, title, id),
        createActivityLog(
          staff,
          'member',
          id,
          'Çalışan yetkisi güncellendi',
          member.name +
            ' · ' +
            (payload.role === 'staff' ? 'Çalışan' : 'Müşteri') +
            (department ? ' · ' + department : ''),
        ),
      ]);
      return Response.json({
        ok: true,
      });
    }
    if (payload.action === 'customer') {
      const id = textField(payload.id, 'Müşteri', 1, 200);
      const note = textField(payload.note ?? '', 'İç not', 0, 2000);
      const segment = textField(payload.segment, 'Segment', 1, 30);
      if (!['Standart', 'VIP', 'Kurumsal'].includes(segment))
        throw new ApiError('Geçersiz segment.');
      const member = await connection
        .prepare('SELECT name FROM profiles WHERE id = ?')
        .bind(id)
        .first<any>();
      if (!member) throw new ApiError('Müşteri bulunamadı.', 404);
      await connection.batch([
        connection
          .prepare('UPDATE profiles SET admin_note = ?,segment = ? WHERE id = ?')
          .bind(note, segment, id),
        createActivityLog(
          staff,
          'member',
          id,
          'Müşteri kaydı güncellendi',
          member.name + ' · ' + segment,
        ),
      ]);
      return Response.json({
        ok: true,
      });
    }
    if (payload.action === 'inventory') {
      if (!products.some((x) => x.id === payload.id)) throw new ApiError('Ürün bulunamadı.', 404);
      const delta = integerField(payload.delta, 'Stok hareketi', -100000, 100000);
      const reorder = integerField(payload.reorder, 'Kritik stok', 0, 100000);
      const version = integerField(payload.version, 'Kayıt sürümü', -1, 100000000);
      const location = textField(payload.location ?? '', 'Depo konumu', 0, 100);
      const reason = textField(payload.reason, 'İşlem açıklaması', 3, 300);
      const token = crypto.randomUUID();
      const now = Date.now();
      const mutation =
        version === -1
          ? connection
              .prepare(
                'INSERT INTO inventory (product_id,stock,reorder,location,version,change_token,updated) SELECT ?,?,?,?,?,?,? WHERE ? >= 0 ON CONFLICT(product_id) DO NOTHING',
              )
              .bind(payload.id, delta, reorder, location, 0, token, now, delta)
          : connection
              .prepare(
                'UPDATE inventory SET stock = stock + ?,reorder = ?,location = ?,version = version + 1,change_token = ?,updated = ? WHERE product_id = ? AND version = ? AND stock + ? >= 0',
              )
              .bind(delta, reorder, location, token, now, payload.id, version, delta);
      const detail = (delta >= 0 ? '+' : '') + delta + ' adet · ' + reason;
      const results = await connection.batch([
        mutation,
        connection
          .prepare(
            'INSERT INTO activity (id,actor_id,actor_name,entity,entity_id,action,detail,created) SELECT ?,?,?,?,?,?,?,? FROM inventory WHERE product_id = ? AND change_token = ?',
          )
          .bind(
            token,
            staff.id,
            staff.name,
            'inventory',
            payload.id,
            'Stok hareketi',
            detail,
            now,
            payload.id,
            token,
          ),
      ]);
      if (!results[0].meta.changes)
        throw new ApiError(
          'Stok değişti veya işlem negatif stok oluşturuyor. Listeyi yenileyin.',
          409,
        );
      return Response.json({
        ok: true,
      });
    }
    const id = textField(payload.id, 'Sipariş', 36, 36);
    const currentOrder = await connection
      .prepare('SELECT * FROM orders WHERE id = ?')
      .bind(id)
      .first<any>();
    if (!currentOrder) throw new ApiError('Sipariş bulunamadı.', 404);
    if (!statuses.includes(payload.status)) throw new ApiError('Geçersiz durum.');
    if (!statusChoices(currentOrder.status).includes(payload.status))
      throw new ApiError(
        'Bu sipariş için seçilen durum geçişi kullanılamaz. İptal edilen sipariş yeniden açılmaz.',
        409,
      );
    if (
      (payload.version !== undefined && payload.version !== currentOrder.version) ||
      payload.previousStatus !== currentOrder.status
    )
      throw new ApiError(
        'Bu sipariş başka bir çalışan tarafından değiştirildi. Listeyi yenileyin.',
        409,
      );
    const tracking = textField(payload.tracking ?? '', 'Kargo bilgisi', 0, 200);
    const priority = textField(payload.priority ?? currentOrder.priority, 'Öncelik', 1, 20);
    const note = textField(payload.internalNote ?? currentOrder.internal_note, 'İç not', 0, 2000);
    const assigned = textField(payload.assignedTo ?? currentOrder.assigned_to, 'Sorumlu', 0, 200);
    const payment = textField(
      payload.paymentStatus ?? currentOrder.payment_status,
      'Ödeme durumu',
      1,
      30,
    );
    if (
      !['Normal', 'Yüksek', 'Acil'].includes(priority) ||
      !['Bekliyor', 'Tahsil edildi', 'İade edildi'].includes(payment)
    )
      throw new ApiError('Geçersiz seçim.');
    if (assigned) {
      const employee = await connection
        .prepare(
          "SELECT id FROM profiles WHERE id = ? AND (role = 'staff' OR id = (SELECT value FROM settings WHERE key = 'owner'))",
        )
        .bind(assigned)
        .first();
      if (!employee) throw new ApiError('Sorumlu çalışan bulunamadı.');
    }
    const firstShipment =
      ['Kargoya verildi', 'Teslim edildi'].includes(payload.status) &&
      !currentOrder.stock_booked &&
      !['Kargoya verildi', 'Teslim edildi'].includes(currentOrder.status);
    const items = JSON.parse(currentOrder.items);
    const token = crypto.randomUUID();
    const now = Date.now();
    const releaseStock =
      payload.status === 'İptal edildi' &&
      ['Alındı', 'Hazırlanıyor'].includes(currentOrder.status) &&
      currentOrder.stock_booked === 1 &&
      !currentOrder.stock_released;
    let condition = '';
    let stockParameters: any[] = [];
    if (firstShipment) {
      for (const item of items) {
        condition += ' AND EXISTS (SELECT 1 FROM inventory WHERE product_id = ? AND stock >= ?)';
        stockParameters.push(item.id, item.quantity);
      }
    }
    const mutations = [
      connection
        .prepare(
          'UPDATE orders SET status = ?,tracking = ?,priority = ?,internal_note = ?,assigned_to = ?,payment_status = ?,stock_booked = ?,stock_released = ?,version = version + 1,change_token = ? WHERE id = ? AND version = ?' +
            condition,
        )
        .bind(
          payload.status,
          tracking,
          priority,
          note,
          assigned,
          payment,
          firstShipment ? 1 : currentOrder.stock_booked,
          releaseStock ? 1 : currentOrder.stock_released,
          token,
          id,
          currentOrder.version,
          ...stockParameters,
        ),
    ];
    if (firstShipment) {
      for (const item of items) {
        mutations.push(
          connection
            .prepare(
              'UPDATE inventory SET stock = stock - ?,version = version + 1,updated = ? WHERE product_id = ? AND EXISTS (SELECT 1 FROM orders WHERE id = ? AND change_token = ?)',
            )
            .bind(item.quantity, now, item.id, id, token),
        );
      }
    }
    if (releaseStock) {
      for (const item of items) {
        mutations.push(
          connection
            .prepare(
              'UPDATE inventory SET stock = stock + ?,version = version + 1,updated = ? WHERE product_id = ? AND EXISTS (SELECT 1 FROM orders WHERE id = ? AND change_token = ?)',
            )
            .bind(item.quantity, now, item.id, id, token),
        );
      }
    }
    const detail = JSON.stringify({
      number: currentOrder.number,
      from: currentOrder.status,
      to: payload.status,
      priority,
      payment,
      assignedTo: assigned,
      tracking,
      internalNote: note,
      stockBooked: firstShipment,
      stockReleased: releaseStock,
    });
    mutations.push(
      connection
        .prepare(
          'INSERT INTO activity (id,actor_id,actor_name,entity,entity_id,action,detail,created) SELECT ?,?,?,?,?,?,?,? FROM orders WHERE id = ? AND change_token = ?',
        )
        .bind(
          token,
          staff.id,
          staff.name,
          'order',
          id,
          'Sipariş güncellendi',
          detail,
          now,
          id,
          token,
        ),
    );
    if (firstShipment)
      for (const item of items) {
        mutations.push(
          connection
            .prepare(
              'INSERT INTO activity (id,actor_id,actor_name,entity,entity_id,action,detail,created) SELECT ?,?,?,?,?,?,?,? FROM orders WHERE id = ? AND change_token = ?',
            )
            .bind(
              crypto.randomUUID(),
              staff.id,
              staff.name,
              'inventory',
              item.id,
              'Sevkiyat çıkışı',
              '-' + item.quantity + ' adet · ' + currentOrder.number,
              now,
              id,
              token,
            ),
        );
      }
    if (releaseStock)
      for (const item of items) {
        mutations.push(
          connection
            .prepare(
              'INSERT INTO activity (id,actor_id,actor_name,entity,entity_id,action,detail,created) SELECT ?,?,?,?,?,?,?,? FROM orders WHERE id = ? AND change_token = ?',
            )
            .bind(
              crypto.randomUUID(),
              staff.id,
              staff.name,
              'inventory',
              item.id,
              'İptal stok iadesi',
              '+' + item.quantity + ' adet · ' + currentOrder.number,
              now,
              id,
              token,
            ),
        );
      }
    const results = await connection.batch(mutations);
    if (!results[0].meta.changes)
      throw new ApiError(
        firstShipment
          ? 'Sevkiyat için yeterli depo stoku bulunmuyor veya sipariş değişti. Stokları ve listeyi kontrol edin.'
          : 'Sipariş başka bir çalışan tarafından değiştirildi. Listeyi yenileyin.',
        409,
      );
    return Response.json({
      ok: true,
    });
  } catch (e) {
    return fail(e);
  }
}
