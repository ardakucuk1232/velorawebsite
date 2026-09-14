'use client';

import { Inbox } from 'lucide-react';
export function Empty({
  title = 'Henüz kayıt yok.',
  description = 'Yeni kayıtlar burada görünecek.',
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="erp-empty">
      <Inbox size={30} strokeWidth={1.3} />
      <strong>{title}</strong>
      <p>{description}</p>
    </div>
  );
}
