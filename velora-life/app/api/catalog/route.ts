import { database, fail } from '@/lib/server';
import { products } from '@/lib/products';
export async function GET() {
  try {
    const rows = await database()
      .prepare('SELECT product_id, stock > 0 AS available FROM inventory')
      .all<any>();
    return Response.json(
      {
        availability: Object.fromEntries(
          products.map((member) => [
            member.id,
            !!rows.results.find((request) => request.product_id === member.id)?.available,
          ]),
        ),
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
