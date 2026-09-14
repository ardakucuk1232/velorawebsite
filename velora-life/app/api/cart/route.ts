import { database, requireMember, ApiError, fail, checkOrigin } from '@/lib/server';
import { products } from '@/lib/products';
export async function PATCH(request: Request) {
  try {
    checkOrigin(request);
    const member = await requireMember();
    const payload = await request.json();
    if (
      !products.some((x) => x.id === payload.productId) ||
      !Number.isInteger(payload.delta) ||
      ![1, -1].includes(payload.delta)
    )
      throw new ApiError('Geçersiz sepet işlemi.');
    const path = '$.' + JSON.stringify(payload.productId);
    const result = await database()
      .prepare(
        'UPDATE profiles SET cart = json_set(cart, ?, MIN(20, MAX(0, COALESCE(json_extract(cart, ?), 0) + ?))) WHERE id = ? AND (? < 0 OR (COALESCE(json_extract(cart, ?),0) + ? <= COALESCE((SELECT stock FROM inventory WHERE product_id = ?),0) AND COALESCE(json_extract(cart, ?),0) < 20))',
      )
      .bind(
        path,
        path,
        payload.delta,
        member.id,
        payload.delta,
        path,
        payload.delta,
        payload.productId,
        path,
      )
      .run();
    if (!result.meta.changes)
      throw new ApiError('Bu ürün için yeterli stok yok veya 20 adet sınırına ulaştınız.', 409);
    const updated = await database()
      .prepare('SELECT cart FROM profiles WHERE id = ?')
      .bind(member.id)
      .first<any>();
    return Response.json({
      cart: JSON.parse(updated.cart),
    });
  } catch (e) {
    return fail(e);
  }
}
