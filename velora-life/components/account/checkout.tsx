'use client';

import type { Session, RefreshSession } from '@/types/commerce';
import type { FormEvent } from 'react';
import {handleNameInput } from '@/lib/field-validation';
import { SignIn } from '@/components/account/sign-in';
import { useState, useEffect } from 'react';
import {
  ArrowRight,
  UserRound,
  ShoppingBag,
  Check,
  Plus,
  Minus,
  Truck,
  ShieldCheck,
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { api } from '@/lib/api-client';
import { products, money } from '@/lib/products';
export function Checkout({
  session,
  refresh,
  changeCart,
  busy: cartBusy,
}: {
  session: Session | null;
  refresh: RefreshSession;
  changeCart: (id: string, d: number) => Promise<void>;
  busy: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<any>(null);
  const [orderId, setOrderId] = useState('');
  useEffect(() => setOrderId(crypto.randomUUID()), []);
  if (!session?.identity) return <SignIn />;
  if (!session.profile)
    return (
      <div className="empty-state">
        <UserRound size={40} />
        <h2>Önce üyeliğini tamamla.</h2>
        <p>Sipariş oluşturabilmek için üyelik bilgilerine ihtiyacımız var.</p>
        <a className="button" href="/account">
          Üyelik profilini oluştur <ArrowRight size={16} />
        </a>
      </div>
    );
  const profile = session.profile;
  const cart = profile.cart;
  const items = products.filter((x) => cart[x.id] > 0);
  const subtotal = items.reduce((s, x) => s + x.price * cart[x.id], 0);
  const shipping = subtotal >= 1200 ? 0 : 59;
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const values = Object.fromEntries(new FormData(e.currentTarget));
    try {
      const result = await api('/api/orders', {
        method: 'POST',
        body: JSON.stringify({
          ...values,
          id: orderId,
        }),
      });
      setSuccess(result.order);
      await refresh();
    } catch (e) {
      setError((e as Error).message);
      await refresh();
    } finally {
      setBusy(false);
    }
  }
  if (success)
    return (
      <div className="content-page">
        <div className="empty-state">
          <div
            style={{
              borderRadius: 99,
              background: '#e9f3df',
              width: 76,
              height: 76,
              display: 'grid',
              placeItems: 'center',
              margin: '0 auto 23px',
            }}
          >
            <Check
              size={35}
              style={{
                margin: 0,
              }}
            />
          </div>
          <span className="eyebrow">GÜZEL BİR SEÇİM YAPTIN</span>
          <h1 className="page-title">Siparişin alındı.</h1>
          <p>
            Sipariş numaran: <strong>{success.number}</strong>
            <br />
            Hazırlık ve kargo durumunu hesabından takip edebilirsin.
          </p>
          <a href="/orders" className="button">
            Siparişimi görüntüle <ArrowRight size={16} />
          </a>
          <p
            style={{
              fontSize: 12,
              marginTop: 20,
            }}
          >
            Konsept mağaza: gerçek tahsilat ve gönderim yapılmaz.
          </p>
        </div>
      </div>
    );
  if (!items.length)
    return (
      <div className="content-page empty-state">
        <ShoppingBag size={40} strokeWidth={1.2} />
        <h1 className="page-title">Sepetin seni bekliyor.</h1>
        <p>Sipariş vermek için önce bir ürün ekle.</p>
        <a href="/products" className="button">
          Ürünleri keşfet <ArrowRight size={16} />
        </a>
      </div>
    );
  return (
    <div className="content-page">
      <span className="eyebrow">SON BİRKAÇ ADIM</span>
      <h1 className="page-title">İyi yaşam, kapına gelsin.</h1>
      <p className="muted">Teslimat bilgilerini kontrol et, siparişini tamamla.</p>
      {error && (
        <div
          className="error"
          role="alert"
          style={{
            marginTop: 20,
          }}
        >
          {error}
        </div>
      )}
      <div className="two-col">
        <div className="panel">
          <h2>Teslimat bilgileri</h2>
          <form id="checkout-form" onSubmit={submit} className="form">
            <div className="form-row">
              <label>
                Ad soyad
                <input
                  name="name"
                  className="field"
                  autoComplete="name"
                  required
                  minLength={3}
                  maxLength={100}
                  onInput={handleNameInput}
                  defaultValue={profile.name}
                />
              </label>
              <label>
                Telefon
                <input
                  name="phone"
                  className="field"
                  autoComplete="tel"
                  type="tel"
                  required
                  minLength={10}
                  maxLength={25}
                  defaultValue={profile.phone}
                />
              </label>
            </div>
            <label>
              İl / ilçe
              <input
                name="city"
                className="field"
                autoComplete="address-level2"
                required
                minLength={3}
                maxLength={100}
                placeholder="Ankara / Çankaya"
                defaultValue={profile.city}
              />
            </label>
            <label>
              Açık adres
              <textarea
                name="address"
                className="field"
                autoComplete="street-address"
                required
                minLength={10}
                maxLength={500}
                placeholder="Mahalle, cadde, bina ve daire numarası"
                defaultValue={profile.address}
              />
            </label>
            <label>
              Sipariş notu (isteğe bağlı)
              <textarea
                name="note"
                className="field"
                maxLength={500}
                placeholder="Teslimat için eklemek istediğin bir not varsa…"
              />
            </label>
            <div
              className="panel"
              style={{
                padding: 17,
                background: '#f3f7ed',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  gap: 10,
                  alignItems: 'center',
                }}
              >
                <ShieldCheck size={21} />
                <strong
                  style={{
                    fontSize: 15,
                  }}
                >
                  Kapıda ödeme
                </strong>
              </div>
              <p
                className="muted"
                style={{
                  fontSize: 13,
                  marginTop: 8,
                }}
              >
                Kart bilgisi paylaşmana gerek yok. Bu konsept mağazada gerçek ödeme alınmaz ve
                gönderim yapılmaz.
              </p>
            </div>
            <div
              style={{
                display: 'flex',
                gap: 10,
                alignItems: 'flex-start',
              }}
            >
              <Checkbox id="order-consent" required />
              <label
                htmlFor="order-consent"
                style={{
                  display: 'block',
                  lineHeight: 1.6,
                }}
              >
                Sipariş bilgilerimi ve{' '}
                <a
                  href="/info"
                  target="_blank"
                  style={{
                    textDecoration: 'underline',
                  }}
                >
                  alışveriş açıklamasını
                </a>{' '}
                kontrol ettim.
              </label>
            </div>
          </form>
        </div>
        <div className="panel">
          <h2>Sipariş özeti</h2>
          {items.map((x) => (
            <div className="cart-line" key={x.id}>
              <img src={x.image} alt={x.name} />
              <div className="grow">
                <strong>{x.name}</strong>
                <p
                  className="muted"
                  style={{
                    fontSize: 12,
                  }}
                >
                  {money(x.price)} / adet
                </p>
                <div className="quantity">
                  <button
                    aria-label={x.name + ' azalt'}
                    disabled={busy || cartBusy}
                    onClick={() => changeCart(x.id, -1)}
                  >
                    <Minus size={13} />
                  </button>
                  <span>{cart[x.id]}</span>
                  <button
                    aria-label={x.name + ' artır'}
                    disabled={
                      busy || cartBusy || cart[x.id] >= 20 || !session?.availability?.[x.id]
                    }
                    onClick={() => changeCart(x.id, 1)}
                  >
                    <Plus size={13} />
                  </button>
                </div>
              </div>
              <strong
                style={{
                  fontSize: 15,
                }}
              >
                {money(x.price * cart[x.id])}
              </strong>
            </div>
          ))}
          <div
            style={{
              marginTop: 17,
            }}
          >
            <div className="summary-line">
              <span>Ara toplam</span>
              <span>{money(subtotal)}</span>
            </div>
            <div className="summary-line">
              <span>Kargo</span>
              <span>{shipping ? money(shipping) : 'Bizden'}</span>
            </div>
            <div className="summary-line total">
              <span>Toplam</span>
              <strong>{money(subtotal + shipping)}</strong>
            </div>
          </div>
          <button
            className="button full-width"
            form="checkout-form"
            type="submit"
            disabled={busy || cartBusy || !orderId}
            style={{
              marginTop: 16,
            }}
          >
            {busy ? 'Sipariş oluşturuluyor…' : 'Siparişi onayla'}
            <ArrowRight size={17} />
          </button>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              justifyContent: 'center',
              marginTop: 15,
            }}
          >
            <Truck size={15} />
            <span
              className="muted"
              style={{
                fontSize: 12,
              }}
            >
              1.200 TL üzeri ürün toplamında ücretsiz kargo
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
