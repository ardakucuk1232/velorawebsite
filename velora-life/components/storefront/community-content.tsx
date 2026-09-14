'use client';

import { ArrowUpRight } from 'lucide-react';
export function CommunityContent() {
  return (
    <div className="content-page">
      <div className="page-intro">
        <span className="eyebrow">VELORA TOPLULUĞU</span>
        <h1 className="page-title">
          Kendi yolunu çiz.
          <br />
          Birlikte daha ileri git.
        </h1>
        <p>
          Sevdiğin ürünlerden başlayan bir bağ. Deneyimlerini paylaşmak ve Velora topluluğuna
          katılmak için ilk adımını at.
        </p>
        <a
          className="button"
          href="/account?join=1"
          style={{
            marginTop: 24,
          }}
        >
          Topluluğa katıl <ArrowUpRight size={18} />
        </a>
      </div>
      <div className="values">
        {[
          [
            '01',
            'Önce keşfet',
            'Koleksiyonumuzla tanış. Sana ve günlük rutinine uygun ürünleri seç.',
          ],
          [
            '02',
            'Topluluğa katıl',
            'Üyelik profilinde topluluk seçeneğini aç. Kendine özel davet kodunu al.',
          ],
          [
            '03',
            'Deneyimini paylaş',
            'Davet kodunu çevrenle paylaş. Yeni üyeler kayıt sırasında seni davet eden kişi olarak belirtebilir.',
          ],
        ].map(([n, t, d]) => (
          <article key={n}>
            <span className="eyebrow">{n}</span>
            <h3>{t}</h3>
            <p>{d}</p>
          </article>
        ))}
      </div>
      <div className="two-col">
        <div>
          <h2 className="page-title">
            Gerçek ürünler.
            <br />
            Anlamlı bağlantılar.
          </h2>
          <p className="muted">
            Velora'nın odağında ürün deneyimi bulunur. Topluluğa katılmak ücretsizdir; ürün satın
            alma ya da yeni üye getirme zorunluluğu yoktur.
          </p>
        </div>
        <div className="panel">
          <h2>Başlamadan önce</h2>
          <p className="muted">
            Bu sürümde üyelik, davet kodu ve sipariş takibi kullanılabilir. Komisyon ve kazanç planı
            henüz tanımlanmamıştır; üyelik veya davet üzerinden ödeme yapılmaz.
          </p>
          <p
            className="muted"
            style={{
              marginTop: 15,
            }}
          >
            Müşteri olarak alışveriş yapmak için topluluğa katılman gerekmez.
          </p>
        </div>
      </div>
    </div>
  );
}
