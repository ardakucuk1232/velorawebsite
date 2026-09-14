'use client';

import { Choice } from '@/components/admin/choice';
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
export function StockDialog({
  product,
  onClose,
  busy,
  save,
}: {
  product: any;
  onClose: () => void;
  busy: boolean;
  save: (b: any) => Promise<void>;
}) {
  const [type, setType] = useState('in');
  useEffect(() => setType('in'), [product]);
  return (
    <Dialog open={!!product} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="erp-modal sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogTitle>Stok işlemi · {product?.name}</DialogTitle>
        <DialogDescription>
          Mevcut stok: {product?.stock ?? 'Henüz tanımlanmadı'}. Her hareket açıklamasıyla
          kaydedilir.
        </DialogDescription>
        {product && (
          <form
            className="erp-form"
            key={product.id}
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              save({
                action: 'inventory',
                id: product.id,
                version: product.version,
                delta: Number(f.get('quantity')) * (type === 'out' ? -1 : 1),
                reorder: Number(f.get('reorder')),
                location: f.get('location'),
                reason: f.get('reason'),
              });
            }}
          >
            <label>
              İşlem türü
              <Choice
                label="Stok işlem türü"
                value={type}
                onChange={setType}
                values={[
                  ['in', 'Stok girişi / ilk sayım'],
                  ['out', 'Stok çıkışı / sayım düzeltmesi'],
                ]}
              />
            </label>
            <div className="form-row">
              <label>
                Adet
                <input
                  className="field"
                  name="quantity"
                  type="number"
                  required
                  min={0}
                  max={100000}
                  step={1}
                  defaultValue={0}
                />
              </label>
              <label>
                Kritik stok eşiği
                <input
                  className="field"
                  name="reorder"
                  type="number"
                  required
                  min={0}
                  max={100000}
                  step={1}
                  defaultValue={product.reorder}
                />
              </label>
            </div>
            <label>
              Depo / raf konumu
              <input
                className="field"
                name="location"
                maxLength={100}
                defaultValue={product.location}
                placeholder="Merkez depo · A-01"
              />
            </label>
            <label>
              İşlem açıklaması
              <textarea
                className="field"
                name="reason"
                required
                minLength={3}
                maxLength={300}
                rows={3}
                placeholder="Örn. İlk depo sayımı, tedarikçi girişi veya fiziksel iade…"
              />
            </label>
            <p className="erp-subtext">
              Adet 0 girerek yalnızca depo konumunu ve kritik stok eşiğini güncelleyebilirsin.
            </p>
            <button className="erp-btn" disabled={busy}>
              {busy ? 'Kaydediliyor…' : 'Stok hareketini kaydet'}
            </button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
