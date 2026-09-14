import { database, requireMember, ApiError, fail, textField, checkOrigin } from '@/lib/server';
import { products } from '@/lib/products';
import { isValidName } from '@/lib/field-validation';

export async function GET() {
  try {
    const member = await requireMember();
    const rows = await database()
      .prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY created DESC')
      .bind(member.id)
      .all<any>();
    return Response.json(
      {
        orders: rows.results.map((o) => ({
          id: o.id,
          number: o.number,
          name: o.name,
          phone: o.phone,
          address: o.address,
          city: o.city,
          note: o.note,
          total: o.total,
          shipping: o.shipping,
          status: o.status,
          tracking: o.tracking,
          created: o.created,
          items: JSON.parse(o.items),
        })),
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
export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const member = await requireMember();
    const connection = database();
    const payload = await request.json();
    const id = textField(payload.id, 'Sipariş', 36, 36);
    if (!/^[a-f0-9-]{36}$/.test(id)) throw new ApiError('Sipariş kodu geçersiz.');
    const prior = await connection
      .prepare('SELECT id,number,user_id FROM orders WHERE id = ?')
      .bind(id)
      .first<any>();
    if (prior) {
      if (prior.user_id !== member.id) throw new ApiError('Sipariş kodu geçersiz.');
      return Response.json({
        order: prior,
      });
    }
    const name = textField(payload.name, 'Ad soyad', 3, 100);
    if (!isValidName(name)) {
      throw new ApiError('Ad soyad alanına geçerli bir isim giriniz.');
    }
    const phone = textField(payload.phone, 'Telefon', 10, 25);
    const address = textField(payload.address, 'Adres', 10, 500);
    const city = textField(payload.city, 'İl / ilçe', 3, 100);
    const note = textField(payload.note ?? '', 'Not', 0, 500);
    if (!/^[+\d\s()-]+$/.test(phone)) throw new ApiError('Telefon numarasını kontrol edin.');
    const cart = JSON.parse(member.cart);
    const items = products
      .filter((x) => cart[x.id] > 0)
      .map((x) => ({
        id: x.id,
        name: x.name,
        price: x.price,
        quantity: Math.min(20, Math.max(0, Math.floor(cart[x.id]))),
        image: x.image,
      }));
    if (!items.length) throw new ApiError('Sepetiniz boş.');
    const subtotal = items.reduce((s, x) => s + x.price * x.quantity, 0);
    const shipping = subtotal >= 1200 ? 0 : 59;
    const number = 'VL-' + id.slice(0, 8).toUpperCase();
    const token = crypto.randomUUID();
    const now = Date.now();
    let stockGuard = '';
    const stockArgs: any[] = [];
    for (const item of items) {
      stockGuard += ' AND EXISTS (SELECT 1 FROM inventory WHERE product_id = ? AND stock >= ?)';
      stockArgs.push(item.id, item.quantity);
    }
    const statements = [
      connection
        .prepare(
          'INSERT INTO orders (id,user_id,number,items,total,shipping,name,phone,address,city,note,status,tracking,created,stock_booked,change_token) SELECT ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,? FROM profiles WHERE id = ? AND cart = ?' +
            stockGuard +
            ' ON CONFLICT(id) DO NOTHING',
        )
        .bind(
          id,
          member.id,
          number,
          JSON.stringify(items),
          subtotal + shipping,
          shipping,
          name,
          phone,
          address,
          city,
          note,
          'Alındı',
          '',
          now,
          1,
          token,
          member.id,
          member.cart,
          ...stockArgs,
        ),
    ];
    for (const item of items) {
      statements.push(
        connection
          .prepare(
            'UPDATE inventory SET stock = stock - ?,version = version + 1,updated = ? WHERE product_id = ? AND EXISTS (SELECT 1 FROM orders WHERE id = ? AND change_token = ?)',
          )
          .bind(item.quantity, now, item.id, id, token),
      );
      statements.push(
        connection
          .prepare(
            'INSERT INTO activity (id,actor_id,actor_name,entity,entity_id,action,detail,created) SELECT ?,?,?,?,?,?,?,? FROM orders WHERE id = ? AND change_token = ?',
          )
          .bind(
            crypto.randomUUID(),
            member.id,
            member.name,
            'inventory',
            item.id,
            'Sipariş stok çıkışı',
            '-' + item.quantity + ' adet · ' + number,
            now,
            id,
            token,
          ),
      );
    }
    statements.push(
      connection
        .prepare(
          "UPDATE profiles SET cart = '{}' WHERE id = ? AND cart = ? AND EXISTS (SELECT 1 FROM orders WHERE id = ? AND change_token = ?)",
        )
        .bind(member.id, member.cart, id, token),
    );
    statements.push(
      connection
        .prepare(
          'INSERT INTO activity (id,actor_id,actor_name,entity,entity_id,action,detail,created) SELECT ?,?,?,?,?,?,?,? FROM orders WHERE id = ? AND change_token = ?',
        )
        .bind(
          token,
          member.id,
          member.name,
          'order',
          id,
          'Sipariş oluşturuldu',
          number + ' · ' + items.reduce((s, i) => s + i.quantity, 0) + ' adet ürün · Stok düşüldü',
          now,
          id,
          token,
        ),
    );
    await connection.batch(statements);
    const saved = await connection
      .prepare('SELECT user_id FROM orders WHERE id = ?')
      .bind(id)
      .first<any>();
    if (!saved || saved.user_id !== member.id)
      throw new ApiError(
        'Sepet veya stok miktarı değişti. Güncel stokları kontrol edip yeniden deneyin.',
        409,
      );
    return Response.json(
      {
        order: {
          id,
          number,
        },
      },
      {
        status: 201,
      },
    );
  } catch (e) {
    return fail(e);
  }
}
