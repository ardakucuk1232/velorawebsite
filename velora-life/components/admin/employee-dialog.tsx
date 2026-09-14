'use client';

import { Choice } from '@/components/admin/choice';
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
export function EmployeeDialog({
  employee,
  members,
  onClose,
  busy,
  save,
}: {
  employee: any;
  members: any[];
  onClose: () => void;
  busy: boolean;
  save: (b: any) => Promise<void>;
}) {
  const [id, setId] = useState('');
  const [role, setRole] = useState('staff');
  useEffect(() => {
    setId(employee?.id || '');
    setRole(employee?.role || 'staff');
  }, [employee]);
  return (
    <Dialog open={!!employee} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="erp-modal sm:max-w-lg">
        <DialogTitle>
          {employee?.id ? 'Çalışan kaydını düzenle' : 'Çalışan yetkilendir'}
        </DialogTitle>
        <DialogDescription>
          Çalışan önce mağazada üyelik profili oluşturmalıdır. Erişim değişiklikleri işlem geçmişine
          kaydedilir.
        </DialogDescription>
        {employee && (
          <form
            className="erp-form"
            key={employee.id || 'new'}
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              if (!id) {
                toast.error('Bir üye seçin.');
                return;
              }
              save({
                action: 'employee',
                id,
                role,
                department: f.get('department'),
                title: f.get('title'),
              });
            }}
          >
            {employee.id ? (
              <div className="erp-detail-box">
                <strong>{employee.name}</strong>
                <p>{employee.email}</p>
              </div>
            ) : (
              <label>
                Kayıtlı üye
                <Choice
                  label="Yetkilendirilecek üye"
                  value={id || 'choose'}
                  onChange={setId}
                  values={[
                    ['choose', 'Üye seçin'],
                    ...members
                      .filter((m) => !m.isOwner && m.role !== 'staff')
                      .map((m) => [m.id, m.name + ' · ' + m.email] as [string, string]),
                  ]}
                />
              </label>
            )}
            <label>
              Departman
              <input
                name="department"
                className="field"
                defaultValue={employee.department}
                maxLength={100}
                placeholder="Örn. Sipariş operasyonları"
              />
            </label>
            <label>
              Unvan
              <input
                name="title"
                className="field"
                defaultValue={employee.title}
                maxLength={100}
                placeholder="Örn. Operasyon uzmanı"
              />
            </label>
            <label>
              Erişim yetkisi
              <Choice
                label="Çalışan erişimi"
                value={role}
                onChange={setRole}
                values={[
                  ['staff', 'Çalışan — yönetim paneline erişebilir'],
                  ['customer', 'Müşteri — çalışan erişimini kaldır'],
                ]}
              />
            </label>
            <button className="erp-btn" disabled={busy || !id || id === 'choose'}>
              {busy ? 'Kaydediliyor…' : 'Yetkiyi ve bilgileri kaydet'}
            </button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
