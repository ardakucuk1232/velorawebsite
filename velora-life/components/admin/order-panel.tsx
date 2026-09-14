'use client';

import { EventText } from '@/components/admin/activity-text';
import { Badge } from '@/components/admin/status-badge';
import { Choice } from '@/components/admin/choice';
import { date, time } from '@/components/admin/config';
import { useState, useEffect } from 'react';
import { Boxes } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { api } from '@/lib/api-client';
import { money, statusChoices } from '@/lib/products';
export function OrderPanel({
  order,
  onClose,
  team,
  busy,
  save,
}: {
  order: any;
  onClose: () => void;
  team: any[];
  busy: boolean;
  save: (b: any) => Promise<void>;
}) {
  const [form, setForm] = useState<any>({});
  const [events, setEvents] = useState<any[]>([]);
  const [historyError, setHistoryError] = useState('');
  useEffect(() => {
    if (!order) return;
    setForm({
      status: order.status,
      tracking: order.tracking,
      priority: order.priority,
      internalNote: order.internal_note,
      assignedTo: order.assigned_to || 'none',
      paymentStatus: order.payment_status,
    });
    setEvents([]);
    setHistoryError('');
    let alive = true;
    api('/api/admin?order=' + encodeURIComponent(order.id))
      .then((d) => {
        if (alive) setEvents(d.activity);
      })
      .catch((e) => {
        if (alive) setHistoryError(e.message);
      });
    return () => {
      alive = false;
    };
  }, [order]);
  const field = (k: string, v: string) =>
    setForm((f: any) => ({
      ...f,
      [k]: v,
    }));
  return (
    <Sheet open={!!order} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="erp-detail-sheet w-full sm:max-w-[680px] overflow-y-auto">
        <SheetHeader className="erp-detail-header">
          <span className="erp-kicker">SİPARİŞ DOSYASI</span>
          <SheetTitle className="text-2xl">{order?.number}</SheetTitle>
          <SheetDescription>
            {order && date(order.created) + ' · ' + time(order.created) + ' · Kapıda ödeme'}
          </SheetDescription>
        </SheetHeader>
        {order && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              save({
                id: order.id,
                version: order.version,
                previousStatus: order.status,
                ...form,
                assignedTo: form.assignedTo === 'none' ? '' : form.assignedTo,
              });
            }}
          >
            <div className="erp-detail-status">
              <Badge value={order.status} />
              <Badge value={order.priority} />
              <span>{order.items.reduce((n: number, p: any) => n + p.quantity, 0)} ürün</span>
            </div>
            <Tabs defaultValue="details">
              <TabsList className="erp-detail-tabs">
                <TabsTrigger value="details">Sipariş detayı</TabsTrigger>
                <TabsTrigger value="manage">İşlem & notlar</TabsTrigger>
                <TabsTrigger value="history">Geçmiş</TabsTrigger>
              </TabsList>
              <TabsContent value="details">
                <div className="erp-detail-grid">
                  <div className="erp-detail-box">
                    <span>MÜŞTERİ</span>
                    <strong>{order.name}</strong>
                    <p>
                      {order.email}
                      <br />
                      {order.phone}
                    </p>
                  </div>
                  <div className="erp-detail-box">
                    <span>TESLİMAT ADRESİ</span>
                    <strong>{order.city}</strong>
                    <p>{order.address}</p>
                  </div>
                </div>
                <div className="erp-detail-box">
                  <span>SİPARİŞ İÇERİĞİ</span>
                  {order.items.map((p: any) => (
                    <div className="erp-order-item" key={p.id}>
                      <img src={p.image} alt={p.name} />
                      <div>
                        <strong>{p.name}</strong>
                        <small>
                          {p.quantity} adet × {money(p.price)}
                        </small>
                      </div>
                      <b>{money(p.price * p.quantity)}</b>
                    </div>
                  ))}
                  <div className="summary-line">
                    <span>Ara toplam</span>
                    <strong>{money(order.total - order.shipping)}</strong>
                  </div>
                  <div className="summary-line">
                    <span>Kargo</span>
                    <strong>{money(order.shipping)}</strong>
                  </div>
                  <div className="summary-line total">
                    <span>Genel toplam</span>
                    <strong>{money(order.total)}</strong>
                  </div>
                </div>
                {order.note && (
                  <div className="erp-detail-box">
                    <span>MÜŞTERİ NOTU</span>
                    <p>{order.note}</p>
                  </div>
                )}
                <div className="erp-detail-box">
                  <span>ÖDEME & SEVKİYAT</span>
                  <p>
                    Ödeme kaydı: {order.payment_status}
                    <br />
                    Stok çıkışı:{' '}
                    {order.stock_released
                      ? 'İptal nedeniyle stoğa iade edildi'
                      : order.stock_booked
                        ? 'Sipariş için stok düşüldü'
                        : 'Önceki dönem siparişi; stok çıkışı kaydı yok'}
                    <br />
                    Kargo: {order.tracking || 'Bilgi girilmedi'}
                  </p>
                </div>
              </TabsContent>
              <TabsContent value="manage">
                <div className="erp-form">
                  <div className="form-row">
                    <label>
                      Sipariş durumu
                      <Choice
                        label="Sipariş durumu"
                        value={form.status || order.status}
                        onChange={(v) => field('status', v)}
                        values={statusChoices(order.status)}
                      />
                    </label>
                    <label>
                      Öncelik
                      <Choice
                        label="Sipariş önceliği"
                        value={form.priority || 'Normal'}
                        onChange={(v) => field('priority', v)}
                        values={['Normal', 'Yüksek', 'Acil']}
                      />
                    </label>
                  </div>
                  <label>
                    Sorumlu çalışan
                    <Choice
                      label="Sorumlu çalışan"
                      value={form.assignedTo || 'none'}
                      onChange={(v) => field('assignedTo', v)}
                      values={[
                        ['none', 'Henüz atanmadı'],
                        ...team.map((m) => [m.id, m.name] as [string, string]),
                      ]}
                    />
                  </label>
                  <label>
                    Kargo firması / takip numarası
                    <input
                      className="field"
                      value={form.tracking || ''}
                      onChange={(e) => field('tracking', e.target.value)}
                      placeholder="Firma adı · Takip numarası"
                      maxLength={200}
                    />
                  </label>
                  <label>
                    Ödeme kaydı
                    <Choice
                      label="Manuel ödeme durumu"
                      value={form.paymentStatus || 'Bekliyor'}
                      onChange={(v) => field('paymentStatus', v)}
                      values={['Bekliyor', 'Tahsil edildi', 'İade edildi']}
                    />
                    <small>Manuel operasyon kaydıdır; ödeme tahsilatı başlatmaz.</small>
                  </label>
                  <label>
                    Şirket içi not
                    <textarea
                      className="field"
                      rows={5}
                      maxLength={2000}
                      placeholder="Hazırlık, müşteri görüşmesi veya teslimat notu…"
                      value={form.internalNote || ''}
                      onChange={(e) => field('internalNote', e.target.value)}
                    />
                    <small>Yalnızca yetkili çalışanlar görebilir.</small>
                  </label>
                  <div className="erp-info-strip">
                    <Boxes size={18} />
                    <span>
                      Stok sipariş anında düşer. Kargoya verilmeden iptalde stok otomatik iade
                      edilir. İptal edilen sipariş yeniden açılamaz; kargo sonrası iadeler fiziksel
                      teslimle kaydedilir.
                    </span>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="history">
                {historyError && <div className="error">{historyError}</div>}
                <div className="erp-timeline">
                  {events.map((e) => (
                    <article key={e.id}>
                      <span />
                      <div>
                        <EventText event={e} />
                      </div>
                    </article>
                  ))}
                  <article>
                    <span />
                    <div>
                      <strong>Sipariş oluşturuldu</strong>
                      <p>{order.name}</p>
                      <small>
                        {date(order.created)}
                        {time(order.created)}
                      </small>
                    </div>
                  </article>
                </div>
              </TabsContent>
            </Tabs>
            <div className="erp-sheet-footer">
              <button type="button" className="erp-btn secondary" onClick={onClose}>
                Kapat
              </button>
              <button className="erp-btn" disabled={busy}>
                {busy ? 'Kaydediliyor…' : 'Değişiklikleri kaydet'}
              </button>
            </div>
          </form>
        )}
      </SheetContent>
    </Sheet>
  );
}
