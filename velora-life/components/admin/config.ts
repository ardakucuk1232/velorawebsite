'use client';

import {
  LayoutDashboard,
  ShoppingBag,
  Users,
  Network,
  Boxes,
  ChartNoAxesCombined,
  ShieldCheck,
  History,
} from 'lucide-react';
import '@/app/admin.css';
export const sections = [
  {
    id: 'overview',
    label: 'Genel bakış',
    icon: LayoutDashboard,
  },
  {
    id: 'orders',
    label: 'Sipariş yönetimi',
    icon: ShoppingBag,
  },
  {
    id: 'customers',
    label: 'Müşteriler',
    icon: Users,
  },
  {
    id: 'community',
    label: 'Bayi & topluluk ağı',
    icon: Network,
  },
  {
    id: 'inventory',
    label: 'Ürünler & stok',
    icon: Boxes,
  },
  {
    id: 'reports',
    label: 'Satış raporları',
    icon: ChartNoAxesCombined,
  },
  {
    id: 'team',
    label: 'Çalışanlar & yetkiler',
    icon: ShieldCheck,
  },
  {
    id: 'activity',
    label: 'İşlem geçmişi',
    icon: History,
  },
];
export const date = (v: number) =>
  new Intl.DateTimeFormat('tr-TR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'Europe/Istanbul',
  }).format(v);
export const time = (v: number) =>
  new Intl.DateTimeFormat('tr-TR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Istanbul',
  }).format(v);
