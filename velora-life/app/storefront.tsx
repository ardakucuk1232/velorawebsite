'use client';
import type { Session } from '@/types/commerce';

import { ShoppingInfoContent } from '@/components/storefront/shopping-info-content';
import { CommunityContent } from '@/components/storefront/community-content';
import { AboutContent } from '@/components/storefront/about-content';
import { api } from '@/lib/api-client';
import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import {
  ArrowUpRight,
  ArrowRight,
  Leaf,
  ShoppingBag,
  UserRound,
  Plus,
  Minus,
  Truck,
  ShieldCheck,
  HeartHandshake,
  Sprout,
  Users,
} from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import { products, money } from '@/lib/products';
import { Account, Checkout, Orders } from './commerce';
import MobileMenu from './mobile-menu';
const Admin = lazy(() => import('./admin-panel'));
export type Page =
  | 'home'
  | 'products'
  | 'about'
  | 'community'
  | 'account'
  | 'checkout'
  | 'orders'
  | 'admin'
  | 'info';
export default function Storefront({ page }: { page: Page }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cartOpen, setCartOpen] = useState(false);
  const [selected, setSelected] = useState<(typeof products)[number] | null>(null);
  const [gate, setGate] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [category, setCategory] = useState('Tümü');
  const refresh = useCallback(async () => {
    try {
      const [me, catalog] = await Promise.all([api('/api/me'), api('/api/catalog')]);
      const d = {
        ...me,
        availability: catalog.availability,
      };
      setSession(d);
      setError('');
      return d;
    } catch (e) {
      setError((e as Error).message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    refresh();
  }, [refresh]);
  const cart = session?.profile?.cart || {};
  const count = Object.values(cart).reduce<number>((a, b) => a + Number(b), 0);
  const subtotal = products.reduce((s, p) => s + p.price * (cart[p.id] || 0), 0);
  async function changeCart(id: string, delta: number) {
    if (!session?.profile) {
      setGate(id);
      return;
    }
    setBusy(true);
    try {
      const d = await api('/api/cart', {
        method: 'PATCH',
        body: JSON.stringify({
          productId: id,
          delta,
        }),
      });
      setSession((s: Session | null) =>
        s?.profile
          ? {
              ...s,
              profile: {
                ...s.profile,
                cart: d.cart,
              },
            }
          : s,
      );
      if (delta > 0)
        toast.success('Ürün sepetinize eklendi', {
          action: {
            label: 'Sepeti aç',
            onClick: () => setCartOpen(true),
          },
        });
    } catch (e) {
      toast.error((e as Error).message);
      await refresh();
    } finally {
      setBusy(false);
    }
  }
  const links = [
    ['home', '/', 'Ana sayfa'],
    ['products', '/products', 'Ürünler'],
    ['about', '/about', 'Hikâyemiz'],
    ['community', '/community', 'Velora topluluğu'],
  ];
  function ProductGrid() {
    return (
      <div className="product-grid">
        {products
          .filter((p) => category === 'Tümü' || p.category === category)
          .slice(0, page === 'home' ? 3 : products.length)
          .map((p) => (
            <article key={p.id}>
              <button
                className="product-photo"
                onClick={() => setSelected(p)}
                aria-label={p.name + ' ürününü incele'}
              >
                <img
                  src={p.image}
                  alt={'Velora ' + p.name + ' ürün ambalajı'}
                  loading="lazy"
                  width="800"
                  height="800"
                />
                <span className="product-label">{p.tag}</span>
              </button>
              <div className="product-info">
                <span className="product-category">{p.category}</span>
                <h3>
                  <button onClick={() => setSelected(p)}>{p.name}</button>
                </h3>
                <p>{p.size}</p>
                <p className="product-stock">
                  {loading
                    ? 'Stok kontrol ediliyor…'
                    : session?.availability?.[p.id]
                      ? 'Stokta'
                      : 'Tükendi'}
                </p>
                <div className="product-bottom">
                  <span className="product-price">{money(p.price)}</span>
                  <button
                    className="add-button"
                    disabled={busy || loading || !session?.availability?.[p.id]}
                    onClick={() => changeCart(p.id, 1)}
                  >
                    {!loading && !session?.availability?.[p.id] ? 'Tükendi' : 'Sepete ekle'}
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            </article>
          ))}
      </div>
    );
  }
  if (page === 'admin')
    return (
      <>
        <Toaster position="bottom-center" richColors theme="light" />
        {loading ? (
          <div className="loading">Yönetim alanı yükleniyor…</div>
        ) : error ? (
          <div className="error" role="alert">
            {error}
            <button onClick={refresh}>Yeniden dene</button>
          </div>
        ) : (
          <Suspense fallback={<div className="loading">Yönetim paneli yükleniyor…</div>}>
            <Admin session={session} />
          </Suspense>
        )}
      </>
    );
  return (
    <>
      <Toaster position="bottom-center" richColors theme="light" />
      <div className="announcement">
        Küçük ritüeller, iyi bir yaşam. <span>1.200 TL ve üzeri siparişlerde kargo bizden.</span>
      </div>
      <header className="wrap header">
        <a href="/" className="brand" aria-label="Velora Life ana sayfa">
          velora<sup>✳</sup>
          <small>L I F E</small>
        </a>
        <nav className="nav" aria-label="Ana gezinme">
          {links.map(([key, href, label]) => (
            <a key={key} href={href} className={page === key ? 'active' : ''}>
              {label}
            </a>
          ))}
        </nav>
        <div className="head-actions">
          <a href="/account" className="text-link">
            <UserRound size={19} />
            <span className="login-label">{session?.profile ? 'Hesabım' : 'Giriş / Kayıt'}</span>
          </a>
          <button
            className="icon-button"
            onClick={() => setCartOpen(true)}
            aria-label={'Sepetim, ' + count + ' ürün'}
          >
            <ShoppingBag size={21} />
            <span className="cart-count">{count}</span>
          </button>
          <MobileMenu page={page} session={session} />
        </div>
      </header>
      <main className="wrap">
        {error && (
          <div role="alert" className="error">
            Stok ve hesap bilgileri yüklenemedi. <button onClick={refresh}>Yeniden dene</button>
          </div>
        )}
        {page === 'home' && (
          <>
            <section className="hero">
              <img
                className="hero-image"
                src="/images/hero.webp"
                width="1536"
                height="1024"
                alt="Doğal ışıkta Velora Daily Greens, Glow Serum ve Botanic Tea koleksiyonu"
                fetchPriority="high"
              />
              <div className="hero-content">
                <div className="eyebrow">
                  <span
                    style={{
                      width: 20,
                      height: 1,
                      background: 'currentColor',
                    }}
                  />
                  DOĞADAN İLHAM. YAŞAMA DEĞER.
                </div>
                <h1>
                  Kendine iyi bak.
                  <br />
                  Birlikte <em>çiçek aç.</em>
                </h1>
                <p>
                  İyi hissettiren ürünler, ilham veren bir topluluk.
                  <br />
                  Daha iyi bir yaşam, seninle başlar.
                </p>
                <div className="hero-buttons">
                  <a className="button lime" href="/products">
                    Ürünleri keşfet <ArrowUpRight size={18} />
                  </a>
                  <a className="text-link" href="/community">
                    Bize katıl <ArrowRight size={16} />
                  </a>
                </div>
                <div className="hero-foot">
                  <Leaf size={15} /> Kendin için küçük, yaşamın için güzel bir adım.
                </div>
              </div>
              <div className="hero-tag">
                <Sprout size={29} strokeWidth={1.3} />
                <div>
                  <strong>Günlük hayatına iyi gelir.</strong>Özenle tasarlanmış ritüeller.
                </div>
              </div>
            </section>
            <div className="benefits">
              {[
                [Leaf, 'Özenli içerikler', 'Sade ve anlaşılır formüller'],
                [ShieldCheck, 'Güvenli alışveriş', 'Kapıda ödeme kolaylığı'],
                [Truck, 'Ücretsiz kargo', '1.200 TL ve üzeri siparişlerde'],
                [HeartHandshake, 'Birlikte büyüyoruz', 'Paylaşan bir topluluk'],
              ].map(([Icon, title, desc]: any) => (
                <div className="benefit" key={title}>
                  <Icon />
                  <div>
                    <strong>{title}</strong>
                    <small>{desc}</small>
                  </div>
                </div>
              ))}
            </div>
            <section className="section">
              <div className="section-head">
                <div>
                  <div className="eyebrow">SANA İYİ GELENİ KEŞFET</div>
                  <h2>İyi yaşamın küçük ritüelleri.</h2>
                  <p>Kendine ayırdığın zaman, en güzel yatırımın.</p>
                </div>
                <a className="text-link" href="/products">
                  Tüm ürünler <ArrowUpRight size={17} />
                </a>
              </div>
              <ProductGrid />
            </section>
            <section className="join-banner">
              <div className="join-icon">
                <Users size={31} strokeWidth={1.2} />
              </div>
              <div className="join-copy">
                <div
                  className="eyebrow"
                  style={{
                    fontSize: 11,
                    color: '#7c8e68',
                  }}
                >
                  VELORA TOPLULUĞU
                </div>
                <h2>Güzel şeyler paylaştıkça büyür.</h2>
                <p>
                  Sevdiğin ürünleri paylaş. Kendi çevrenle bağ kur.
                  <br />
                  Velora yolculuğunda birlikte yeni adımlar atalım.
                </p>
              </div>
              <a className="button" href="/community">
                Topluluğu tanı <ArrowUpRight size={18} />
              </a>
            </section>
          </>
        )}
        {page === 'products' && (
          <div className="content-page">
            <div className="page-intro">
              <span className="eyebrow">VELORA KOLEKSİYONU</span>
              <h1 className="page-title">Senin ritüelin. Senin iyi yaşamın.</h1>
              <p>
                Günlük yaşamdan cilt bakımına, kendine ayırdığın her an için özenle hazırlanan
                ürünler.
              </p>
            </div>
            <div className="filter-row" aria-label="Ürün kategorileri">
              {['Tümü', ...Array.from(new Set(products.map((p) => p.category)))].map((c) => (
                <button
                  key={c}
                  className={c === category ? 'active' : ''}
                  onClick={() => setCategory(c)}
                  aria-pressed={c === category}
                >
                  {c}
                </button>
              ))}
            </div>
            <ProductGrid />
          </div>
        )}
        {page === 'about' && <AboutContent />}
        {page === 'community' && <CommunityContent />}
        {['account', 'checkout', 'orders', 'admin'].includes(page) && error && (
          <div className="error" role="alert">
            {error}
            <button
              onClick={refresh}
              style={{
                textDecoration: 'underline',
              }}
            >
              Yeniden dene
            </button>
          </div>
        )}
        {['account', 'checkout', 'orders', 'admin'].includes(page) && loading && (
          <div className="loading" role="status">
            Bilgilerin yükleniyor…
          </div>
        )}
        {!loading && page === 'account' && <Account session={session} refresh={refresh} />}
        {!loading && page === 'checkout' && (
          <Checkout session={session} refresh={refresh} changeCart={changeCart} busy={busy} />
        )}
        {!loading && page === 'orders' && <Orders session={session} />}
        {page === 'info' && <ShoppingInfoContent />}
      </main>
      <footer className="footer">
        <div className="wrap">
          <div className="footer-grid">
            <div className="footer-brand">
              <a href="/" className="brand">
                velora<sup>✳</sup>
              </a>
              <p
                style={{
                  marginTop: 19,
                }}
              >
                Kendine iyi bak. Birlikte çiçek aç.
                <br />
                Doğadan ilham alan ürünler ve paylaşan bir topluluk.
              </p>
            </div>
            <div>
              <h4>Velora'yı keşfet</h4>
              <a href="/products">Ürünlerimiz</a>
              <a href="/about">Hikâyemiz</a>
              <a href="/community">Topluluğumuz</a>
            </div>
            <div>
              <h4>Her adımda yanındayız</h4>
              <a href="/account">Hesabım</a>
              <a href="/orders">Siparişlerim</a>
              <a href="/info">Alışveriş & hesap bilgileri</a>
            </div>
          </div>
          <div className="footer-bottom">
            <span>© {new Date().getFullYear()} Velora Life. Birlikte daha güzel.</span>
            <span>Konsept mağaza · Gerçek tahsilat ve gönderim yapılmaz.</span>
            <span>TR / ₺ TRY</span>
          </div>
        </div>
      </footer>
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogTitle className="sr-only">{selected?.name} ürün bilgileri</DialogTitle>
          <DialogDescription className="sr-only">
            İçerik, kullanım ve fiyat bilgileri
          </DialogDescription>
          {selected && (
            <div className="detail-grid">
              <img src={selected.image} alt={selected.name} />
              <div>
                <span className="product-category">{selected.category}</span>
                <h2>{selected.name}</h2>
                <p>{selected.description}</p>
                <p
                  style={{
                    marginTop: 15,
                  }}
                >
                  <strong>İçindekiler</strong>
                  <br />
                  {selected.ingredients}
                </p>
                <p
                  style={{
                    marginTop: 15,
                  }}
                >
                  <strong>Kullanım</strong>
                  <br />
                  {selected.usage}
                </p>
                <p
                  style={{
                    marginTop: 15,
                  }}
                >
                  {selected.size} · {session?.availability?.[selected.id] ? 'Stokta' : 'Tükendi'}
                </p>
                <div className="summary-line total">
                  <strong>{money(selected.price)}</strong>
                  <button
                    className="button"
                    disabled={busy || !session?.availability?.[selected.id]}
                    onClick={() => {
                      changeCart(selected.id, 1);
                      setSelected(null);
                    }}
                  >
                    Sepete ekle <Plus size={16} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <Dialog open={gate !== null} onOpenChange={(o) => !o && setGate(null)}>
        <DialogContent>
          <DialogTitle>Velora'ya hoş geldin.</DialogTitle>
          <DialogDescription>
            Sepetini kaydetmek ve sipariş vermek için üyelik profilini tamamla.
          </DialogDescription>
          <a className="button" href={'/account?add=' + encodeURIComponent(gate || '')}>
            Giriş yap / Üye ol <ArrowRight size={16} />
          </a>
        </DialogContent>
      </Dialog>
      <Sheet open={cartOpen} onOpenChange={setCartOpen}>
        <SheetContent className="w-full sm:max-w-[450px] overflow-y-auto p-6">
          <SheetHeader className="p-0">
            <SheetTitle className="text-2xl">
              Sepetim <span className="muted">({count})</span>
            </SheetTitle>
            <SheetDescription>İyi yaşam ritüellerin bir arada.</SheetDescription>
          </SheetHeader>
          {count > 0 ? (
            <>
              <div>
                {products
                  .filter((p) => cart[p.id] > 0)
                  .map((p) => (
                    <div className="cart-line" key={p.id}>
                      <img src={p.image} alt={p.name} />
                      <div className="grow">
                        <strong>{p.name}</strong>
                        <div className="quantity">
                          <button
                            aria-label={p.name + ' azalt'}
                            disabled={busy}
                            onClick={() => changeCart(p.id, -1)}
                          >
                            <Minus size={14} />
                          </button>
                          <span>{cart[p.id]}</span>
                          <button
                            aria-label={p.name + ' artır'}
                            disabled={busy || cart[p.id] >= 20 || !session?.availability?.[p.id]}
                            onClick={() => changeCart(p.id, 1)}
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>
                      <span>{money(p.price * cart[p.id])}</span>
                    </div>
                  ))}
              </div>
              <div className="summary-line total">
                <span>Ara toplam</span>
                <strong>{money(subtotal)}</strong>
              </div>
              <p className="muted">
                {subtotal >= 1200
                  ? 'Bu siparişte kargo bizden.'
                  : money(1200 - subtotal) + ' daha ekle, kargon ücretsiz olsun.'}
              </p>
              <a className="button full-width" href="/checkout">
                Siparişi tamamla <ArrowRight size={18} />
              </a>
              <button
                className="text-link"
                style={{
                  justifyContent: 'center',
                }}
                onClick={() => setCartOpen(false)}
              >
                Alışverişe devam et
              </button>
            </>
          ) : (
            <div className="empty-state">
              <ShoppingBag size={40} strokeWidth={1.2} />
              <h2>Yeni ritüellere yer aç.</h2>
              <p>Sepetin henüz boş. Kendine iyi gelecek ürünleri keşfet.</p>
              <a href="/products" className="button">
                Ürünleri keşfet <ArrowRight size={16} />
              </a>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
