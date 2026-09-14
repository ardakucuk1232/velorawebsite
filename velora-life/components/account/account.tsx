'use client';

import type { Session, RefreshSession } from '@/types/commerce';
import {handleNameInput } from '@/lib/field-validation';
import type { FormEvent } from 'react';
import { SignIn } from '@/components/account/sign-in';
import { useState, useEffect } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  Copy,
  LogOut,
  LayoutDashboard,
  Package,
  Users,
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { api } from '@/lib/api-client';
import { products } from '@/lib/products';
function SproutIcon() {
  return <Users size={35} strokeWidth={1.2} />;
}
export function Account({
  session,
  refresh,
}: {
  session: Session | null;
  refresh: RefreshSession;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [partner, setPartner] = useState(!!session?.profile?.partner);
  const [join, setJoin] = useState(false);
  const [pendingProductId, setPendingProductId] = useState('');
  const [referralCode, setReferralCode] = useState('');
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('join') === '1') {
      setPartner(true);
      setJoin(true);
    }
    setPendingProductId(params.get('add') || '');
    setReferralCode(params.get('ref') || '');
  }, []);
  if (!session?.identity) return <SignIn />;
  const profile = session.profile;
  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const values = Object.fromEntries(new FormData(e.currentTarget));
    try {
      await api('/api/me', {
        method: 'POST',
        body: JSON.stringify({
          ...values,
          partner,
        }),
      });
      if (pendingProductId && products.some((x) => x.id === pendingProductId)) {
        await api('/api/cart', {
          method: 'PATCH',
          body: JSON.stringify({
            productId: pendingProductId,
            delta: 1,
          }),
        });
        setPendingProductId('');
        history.replaceState(null, '', '/account');
        toast.success('Üyeliğin hazır, seçtiğin ürün sepetine eklendi.');
      } else toast.success(profile ? 'Profilin güncellendi.' : 'Velora ailesine hoş geldin!');
      setJoin(false);
      await refresh();
    } catch (e) {
      setError((e as Error).message);
      await refresh();
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="content-page">
      <div className="admin-head">
        <div>
          <span className="eyebrow">BENİM VELORAM</span>
          <h1 className="page-title">
            {profile ? 'Merhaba, ' + profile.name.split(' ')[0] + '.' : 'Velora’ya hoş geldin.'}
          </h1>
          <p className="muted">
            {profile
              ? 'Küçük ritüellerin, siparişlerin ve topluluğun burada.'
              : 'Seni tanıyalım. Üyeliğini birkaç bilgiyle tamamla.'}
          </p>
        </div>
        {profile && (
          <form action="/api/auth/logout" method="post" className="logout-form">
            <button className="text-link" type="submit">
              <LogOut size={16} />
              Çıkış yap
            </button>
          </form>
        )}
      </div>
      <div className="two-col">
        <div className="panel">
          <h2>{profile ? 'Üyelik bilgilerim' : 'Üyelik oluştur'}</h2>
          {error && (
            <div role="alert" className="error">
              {error}
            </div>
          )}
          <form onSubmit={save} className="form">
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
                defaultValue={profile?.name || session.identity.name}
              />
            </label>
            <label>
              E-posta
              <input className="field" value={session.identity.email} readOnly type="email" />
              <span
                className="muted"
                style={{
                  fontSize: 12,
                }}
              >
                Giriş yaptığın hesaba bağlı e-posta adresi.
              </span>
            </label>
            <label>
              Telefon
              <input
                name="phone"
                type="tel"
                autoComplete="tel"
                className="field"
                placeholder="05xx xxx xx xx"
                required
                minLength={10}
                maxLength={25}
                defaultValue={profile?.phone || ''}
              />
            </label>
            <label>
              İl / ilçe <span className="sr-only">isteğe bağlı</span>
              <input
                name="city"
                className="field"
                placeholder="Örn. Ankara / Çankaya"
                autoComplete="address-level2"
                maxLength={100}
                defaultValue={profile?.city || ''}
              />
            </label>
            <label>
              Adres
              <textarea
                name="address"
                className="field"
                autoComplete="street-address"
                placeholder="Mahalle, cadde, sokak, bina ve daire numarası"
                maxLength={500}
                defaultValue={profile?.address || ''}
              />
            </label>
            <div
              style={{
                display: 'flex',
                gap: 11,
                alignItems: 'flex-start',
              }}
            >
              <Checkbox
                id="partner"
                checked={partner}
                onCheckedChange={(v) => setPartner(v === true)}
              />
              <label
                htmlFor="partner"
                style={{
                  cursor: 'pointer',
                }}
              >
                <span>Velora topluluğuna katılmak istiyorum.</span>
                <span
                  className="muted"
                  style={{
                    fontSize: 12,
                  }}
                >
                  Ücretsiz katıl, kişisel davet kodunu al.
                </span>
              </label>
            </div>
            {!profile && (
              <label>
                Davet kodu (isteğe bağlı)
                <input
                  name="sponsor"
                  className="field"
                  placeholder="VL-XXXXXXXX"
                  maxLength={30}
                  defaultValue={referralCode}
                />
              </label>
            )}
            {!profile && (
              <div
                style={{
                  display: 'flex',
                  gap: 11,
                  alignItems: 'flex-start',
                }}
              >
                <Checkbox id="consent" required />
                <label
                  htmlFor="consent"
                  style={{
                    display: 'block',
                    lineHeight: 1.7,
                  }}
                >
                  Hesap ve sipariş bilgilerimin işlenmesine ilişkin{' '}
                  <a
                    href="/info"
                    target="_blank"
                    style={{
                      textDecoration: 'underline',
                    }}
                  >
                    alışveriş ve hesap açıklamasını
                  </a>{' '}
                  okudum.
                </label>
              </div>
            )}
            <button className="button" disabled={busy}>
              {busy ? 'Kaydediliyor…' : profile ? 'Bilgilerimi kaydet' : 'Üyeliğimi oluştur'}
              <ArrowRight size={16} />
            </button>
          </form>
        </div>
        <div>
          {profile ? (
            <>
              <div
                className="panel"
                style={{
                  marginBottom: 22,
                }}
              >
                <Package size={27} strokeWidth={1.3} />
                <h2
                  style={{
                    marginTop: 16,
                  }}
                >
                  Siparişlerin bir arada.
                </h2>
                <p className="muted">
                  Sipariş detaylarını ve kargo durumunu buradan takip edebilirsin.
                </p>
                <a
                  href="/orders"
                  className="button outline"
                  style={{
                    marginTop: 20,
                  }}
                >
                  Siparişlerim <ArrowUpRight size={16} />
                </a>
                <a
                  href="/checkout"
                  className="text-link"
                  style={{
                    display: 'flex',
                    marginTop: 20,
                  }}
                >
                  Sepetime git <ArrowRight size={15} />
                </a>
              </div>
              {profile.partner && (
                <div
                  className="panel"
                  style={{
                    marginBottom: 22,
                    background: '#f0f5e9',
                  }}
                >
                  <Users size={26} strokeWidth={1.3} />
                  <h2
                    style={{
                      marginTop: 15,
                    }}
                  >
                    Senin davet kodun
                  </h2>
                  <p className="muted">Arkadaşların üyelik oluştururken bu kodu kullanabilir.</p>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginTop: 20,
                      padding: 14,
                      background: 'white',
                      borderRadius: 6,
                    }}
                  >
                    <strong
                      style={{
                        letterSpacing: 2,
                      }}
                    >
                      {profile.referral}
                    </strong>
                    <button
                      className="icon-button"
                      aria-label="Davet kodunu kopyala"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(profile.referral);
                          toast.success('Davet kodu kopyalandı.');
                        } catch {
                          toast.error('Kopyalanamadı. Kodu seçerek kopyalayabilirsin.');
                        }
                      }}
                    >
                      <Copy size={17} />
                    </button>
                  </div>
                </div>
              )}
              {(session.isOwner || profile.role === 'staff') && (
                <div className="panel">
                  <LayoutDashboard size={25} strokeWidth={1.3} />
                  <h2
                    style={{
                      marginTop: 15,
                    }}
                  >
                    Çalışan alanı
                  </h2>
                  <p className="muted">Siparişleri ve teslimat süreçlerini yönet.</p>
                  <a
                    className="button"
                    href="/admin"
                    style={{
                      marginTop: 20,
                    }}
                  >
                    Yönetim paneline git <ArrowUpRight size={16} />
                  </a>
                </div>
              )}
            </>
          ) : (
            <div
              className="panel"
              style={{
                background: '#f1f6eb',
              }}
            >
              <SproutIcon />
              <h2
                style={{
                  marginTop: 18,
                }}
              >
                Güzel bir başlangıç.
              </h2>
              <p className="muted">
                Üyeliğinle sepetini kaydedebilir, sipariş verebilir ve tüm siparişlerini tek yerden
                takip edebilirsin.
              </p>
              {(join || partner) && (
                <p
                  className="muted"
                  style={{
                    marginTop: 18,
                  }}
                >
                  Topluluk üyeliğin tamamlandığında kişisel davet kodun burada görünecek.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
