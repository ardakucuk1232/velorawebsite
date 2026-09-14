'use client';

import { date, time } from '@/components/admin/config';
export function EventText({ event }: { event: any }) {
  let text = event.detail;
  try {
    const d = JSON.parse(text);
    text =
      d.number +
      ' · ' +
      d.from +
      ' → ' +
      d.to +
      (d.stockBooked ? ' · Stok çıkışı yapıldı' : '') +
      (d.stockReleased ? ' · Stok iade edildi' : '');
  } catch {}
  return (
    <>
      <strong>{event.action}</strong>
      <p>{text}</p>
      <small>
        {event.actor_name} · {date(event.created)} {time(event.created)}
      </small>
    </>
  );
}
