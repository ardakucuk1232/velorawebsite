'use client';

export function Badge({ value }: { value: string }) {
  const tone = ['Teslim edildi', 'Tahsil edildi', 'Aktif', 'Yeterli', 'VIP'].includes(value)
    ? 'green'
    : ['İptal edildi', 'Acil', 'Tükendi'].includes(value)
      ? 'red'
      : ['Hazırlanıyor', 'Bekliyor', 'Yüksek', 'Kritik'].includes(value)
        ? 'amber'
        : value === 'Kargoya verildi'
          ? 'blue'
          : 'gray';
  return <span className={'erp-badge ' + tone}>{value}</span>;
}
