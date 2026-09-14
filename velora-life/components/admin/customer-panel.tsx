'use client';

import { Empty } from '@/components/admin/empty-state';
import { Badge } from '@/components/admin/status-badge';
import { Choice } from '@/components/admin/choice';
import { date } from '@/components/admin/config';
import { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { api } from '@/lib/api-client';
import { money } from '@/lib/products';
export function CustomerPanel({
  member,
  onClose,
  members,
  busy,
  save,
}: {
  member: any;
  onClose: () => void;
  orders: any[];
  members: any[];
  busy: boolean;
  save: (b: any) => Promise<void>;
}) {
  const [note, setNote] = useState('');
  const [segment, setSegment] = useState('Standart');
  const [history, setHistory] = useState<any[]>([]);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!member) return;
    setNote(member.admin_note || '');
    setSegment(member.segment);
    setHistory([]);
    setError('');
    let alive = true;
    api('/api/admin?customer=' + encodeURIComponent(member.id))
      .then((d) => {
        if (alive) setHistory(d.orders);
      })
      .catch((e) => {
        if (alive) setError(e.message);
      });
    return () => {
      alive = false;
    };
  }, [member]);
  return (
    <Sheet open={!!member} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="erp-detail-sheet w-full sm:max-w-[620px] overflow-y-auto">
        <SheetHeader className="erp-detail-header">
          <span className="erp-kicker">MÜŞTERİ KARTI</span>
          <SheetTitle className="text-2xl">{member?.name}</SheetTitle>
          <SheetDescription>{member?.email}</SheetDescription>
        </SheetHeader>
        {member && (
          <>
            <div className="erp-detail-status">
              <Badge value={member.segment} />
              <span>
                {member.partner ? 'Topluluk üyesi' : 'Müşteri'} · {date(member.created)}
              </span>
            </div>
            <div className="erp-detail-stats">
              <div>
                <span>Toplam sipariş</span>
                <strong>{member.order_count}</strong>
              </div>
              <div>
                <span>Sipariş tutarı</span>
                <strong>{money(member.order_value)}</strong>
              </div>
            </div>
            <Tabs defaultValue="profile">
              <TabsList className="erp-detail-tabs">
                <TabsTrigger value="profile">Profil & notlar</TabsTrigger>
                <TabsTrigger value="orders">Sipariş geçmişi</TabsTrigger>
                <TabsTrigger value="network">Davet ilişkileri</TabsTrigger>
              </TabsList>
              <TabsContent value="profile">
                <div className="erp-detail-box">
                  <span>İLETİŞİM BİLGİLERİ</span>
                  <p>
                    {member.phone}
                    <br />
                    {member.email}
                    <br />
                    {member.address || 'Adres belirtilmedi'}
                    <br />
                    {member.city}
                  </p>
                </div>
                <form
                  className="erp-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    save({
                      action: 'customer',
                      id: member.id,
                      note,
                      segment,
                    });
                  }}
                >
                  <label>
                    Müşteri segmenti
                    <Choice
                      label="Müşteri segmenti"
                      value={segment}
                      onChange={setSegment}
                      values={['Standart', 'VIP', 'Kurumsal']}
                    />
                  </label>
                  <label>
                    Şirket içi müşteri notu
                    <textarea
                      className="field"
                      rows={5}
                      maxLength={2000}
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="İletişim tercihleri, görüşme notları…"
                    />
                    <small>Müşteri hesabında gösterilmez.</small>
                  </label>
                  <button className="erp-btn" disabled={busy}>
                    {busy ? 'Kaydediliyor…' : 'Müşteri kaydını güncelle'}
                  </button>
                </form>
              </TabsContent>
              <TabsContent value="orders">
                {error && <div className="error">{error}</div>}
                <p className="erp-subtext">Tüm dönemlerdeki son 100 sipariş</p>
                {history.length ? (
                  history.map((o) => (
                    <div className="erp-customer-order" key={o.id}>
                      <div>
                        <strong>{o.number}</strong>
                        <small>{date(o.created)}</small>
                      </div>
                      <Badge value={o.status} />
                      <b>{money(o.total)}</b>
                    </div>
                  ))
                ) : (
                  <Empty title="Sipariş kaydı yok." />
                )}
              </TabsContent>
              <TabsContent value="network">
                <div className="erp-detail-box">
                  <span>DAVET İLİŞKİSİ</span>
                  <p>
                    Davet eden:{' '}
                    {members.find((m) => m.referral === member.sponsor)?.name || 'Doğrudan katılım'}
                    <br />
                    Kendi davet kodu: {member.partner ? member.referral : 'Topluluk üyeliği yok'}
                  </p>
                </div>
                <h3
                  style={{
                    margin: '22px 0 12px',
                  }}
                >
                  Doğrudan davet edilen üyeler
                </h3>
                {members
                  .filter((m) => m.sponsor === member.referral)
                  .map((m) => (
                    <div className="erp-customer-order" key={m.id}>
                      <div>
                        <strong>{m.name}</strong>
                        <small>{date(m.created)}</small>
                      </div>
                      <Badge value={m.partner ? 'Topluluk üyesi' : 'Müşteri'} />
                    </div>
                  ))}
                {!members.some((m) => m.sponsor === member.referral) && (
                  <Empty title="Henüz davet kaydı yok." />
                )}
              </TabsContent>
            </Tabs>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
