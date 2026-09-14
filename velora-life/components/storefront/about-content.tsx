'use client';

import { ArrowUpRight, Leaf, HeartHandshake, Users } from 'lucide-react';
export function AboutContent() {
  return (
    <div className="content-page">
      <div className="page-intro">
        <span className="eyebrow">HİKÂYEMİZ</span>
        <h1 className="page-title">
          İyi yaşam bir varış noktası değil.
          <br />
          Birlikte çıktığımız bir yolculuk.
        </h1>
        <p>
          Velora Life, günlük hayattaki küçük ve özenli seçimlerin etrafında şekillenen bir yaşam
          markası. Ürünleri ve insanları aynı düşünce buluşturuyor: kendine zaman ayırmak, paylaşmak
          ve birlikte gelişmek.
        </p>
      </div>
      <div className="two-col">
        <div>
          <span className="eyebrow">NEDEN VELORA?</span>
          <h2 className="page-title">
            Doğadan ilham alıyoruz.
            <br />
            İnsanı merkeze koyuyoruz.
          </h2>
          <p className="muted">
            Karmaşık vaatler yerine anlaşılır ürünler sunuyoruz. Günlük içecek karışımından cilt
            bakımına, her ürünün yaşamında kendine ait küçük bir yeri olsun istiyoruz.
          </p>
          <p
            className="muted"
            style={{
              marginTop: 20,
            }}
          >
            Doğrudan satış modelimiz, ürün deneyimini kişiden kişiye taşıyan bir topluluğa dayanır.
            Ürünlerimizi müşteri olarak keşfedebilir veya topluluk üyesi olarak kendi davet kodunla
            paylaşabilirsin.
          </p>
          <a
            href="/community"
            className="button"
            style={{
              marginTop: 25,
            }}
          >
            Topluluğumuzla tanış <ArrowUpRight size={16} />
          </a>
        </div>
        <img
          src="/images/hero.webp"
          alt="Velora Life ürün ailesi"
          style={{
            width: '100%',
            borderRadius: 12,
          }}
        />
      </div>
      <div className="values">
        {[
          [
            Leaf,
            'Özen',
            'İçeriği ve kullanımı açıkça anlatılan, günlük yaşama uyum sağlayan ürünler.',
          ],
          [
            Users,
            'Paylaşım',
            'Ürün deneyimlerini ve yeni fikirleri paylaşabileceğin bir topluluk.',
          ],
          [
            HeartHandshake,
            'Şeffaflık',
            'Ürün odaklı bir yaklaşım. Zorunlu başlangıç paketi ya da kazanç garantisi yok.',
          ],
        ].map(([Icon, title, desc]: any) => (
          <article key={title}>
            <Icon size={27} strokeWidth={1.4} />
            <h3>{title}</h3>
            <p>{desc}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
