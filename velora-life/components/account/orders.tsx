'use client';

import type { Session, RefreshSession } from '@/types/commerce';
import { SignIn } from '@/components/account/sign-in';
import { useState, useEffect } from 'react';
import { ArrowRight, Package } from 'lucide-react';
import { api } from '@/lib/api-client';
import { money } from '@/lib/products';
export function Orders({ session }: { session: Session | null }) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  async function load() {
    setLoading(true);
    setError('');
    try {
      const result = await api('/api/orders');
      setOrders(result.orders);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    if (session?.profile) load();
    else setLoading(false);
  }, [session?.profile?.id]);
  if (!session?.identity) return <SignIn />;
  if (!session.profile)
    return (
      <div className="empty-state">
        <h2>Üyelik profilini tamamla.</h2>
        <a href="/account" className="button">
          Hesabıma git
        </a>
      </div>
    );
  return (
    <div className="content-page">
      <div className="admin-head">
        <div>
          <span className="eyebrow">BENİM VELORAM</span>
          <h1 className="page-title">Siparişlerim</h1>
        </div>
        <button className="button outline" disabled={loading} onClick={load}>
          Yenile
        </button>
      </div>
      {error && (
        <div className="error" role="alert">
          {error}
        </div>
      )}
      {loading ? (
        <div className="loading">Siparişlerin yükleniyor…</div>
      ) : orders.length ? (
        orders.map((order) => (
          <article className="order-card" key={order.id}>
            <div className="order-head">
              <div>
                <strong>{order.number}</strong>
                <p>
                  {new Date(order.created).toLocaleDateString('tr-TR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>
              <span className="status">{order.status}</span>
            </div>
            {order.items.map((x: any) => (
              <div className="cart-line" key={x.id}>
                <img src={x.image} alt={x.name} />
                <div className="grow">
                  <strong>{x.name}</strong>
                  <p>
                    {x.quantity} adet × {money(x.price)}
                  </p>
                </div>
                <strong>{money(x.quantity * x.price)}</strong>
              </div>
            ))}
            <div className="summary-line">
              <span>Kargo: {order.shipping ? money(order.shipping) : 'Ücretsiz'}</span>
              <strong>Toplam {money(order.total)}</strong>
            </div>
            <p>
              <strong>Teslimat:</strong> {order.name} · {order.address}, {order.city}
            </p>
            <p>
              <strong>Ödeme:</strong> Kapıda ödeme
            </p>
            {order.tracking && (
              <div
                className="success"
                style={{
                  marginTop: 15,
                  fontSize: 14,
                }}
              >
                <strong>Kargo bilgisi:</strong>
                {order.tracking}
              </div>
            )}
            {order.note && (
              <p>
                <strong>Not:</strong>
                {order.note}
              </p>
            )}
          </article>
        ))
      ) : (
        !error && (
          <div className="empty-state">
            <Package size={40} strokeWidth={1.2} />
            <h2>İlk ritüelin seni bekliyor.</h2>
            <p>Henüz bir siparişin yok.</p>
            <a href="/products" className="button">
              Ürünleri keşfet <ArrowRight size={17} />
            </a>
          </div>
        )
      )}
    </div>
  );
}
