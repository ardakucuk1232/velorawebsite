'use client';

import { useEffect, useState } from 'react';
import {
  Menu,
  X,
  House,
  Leaf,
  BookOpen,
  Users,
  ArrowUpRight,
  ChevronRight,
  UserRound,
  Package,
  LayoutDashboard,
} from 'lucide-react';
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetClose,
} from '@/components/ui/sheet';
const entries = [
  {
    id: 'home',
    href: '/',
    label: 'Ana sayfa',
    description: 'Velora dünyasına hoş geldin',
    icon: House,
  },
  {
    id: 'products',
    href: '/products',
    label: 'Ürünler',
    description: 'Sana iyi gelen ritüeller',
    icon: Leaf,
  },
  {
    id: 'about',
    href: '/about',
    label: 'Hikâyemiz',
    description: 'Bizi bir araya getiren değerler',
    icon: BookOpen,
  },
  {
    id: 'community',
    href: '/community',
    label: 'Velora topluluğu',
    description: 'Birlikte büyüyen bir yolculuk',
    icon: Users,
  },
];
export default function MobileMenu({ page, session }: { page: string; session: any }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const media = window.matchMedia('(min-width: 761px)');
    const close = () => {
      if (media.matches) setOpen(false);
    };
    media.addEventListener('change', close);
    return () => media.removeEventListener('change', close);
  }, []);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          className="icon-button menu-button mobile-menu-trigger"
          aria-label="Gezinme menüsünü aç"
        >
          <Menu size={21} />
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="mobile-menu-panel" showCloseButton={false}>
        <SheetHeader className="mobile-menu-header">
          <SheetTitle className="sr-only">Velora gezinme menüsü</SheetTitle>
          <SheetDescription className="sr-only">
            Ürünler, hikâyemiz, topluluk ve hesabına hızlı erişim.
          </SheetDescription>
          <div className="mobile-menu-top">
            <a href="/" className="brand" aria-label="Velora Life ana sayfa">
              velora<sup>✳</sup>
              <small>L I F E</small>
            </a>
            <SheetClose asChild>
              <button className="mobile-menu-close" aria-label="Menüyü kapat">
                <X size={20} />
              </button>
            </SheetClose>
          </div>
          <p>
            Kendine iyi bak.
            <br />
            <em>Birlikte çiçek aç.</em>
          </p>
        </SheetHeader>
        <div className="mobile-menu-body">
          <span className="mobile-menu-label">VELORA'YI KEŞFET</span>
          <nav aria-label="Mobil ana gezinme" className="mobile-menu-links">
            {entries.map(({ id, href, label, description, icon: Icon }) => (
              <a
                key={id}
                href={href}
                className={page === id ? 'is-active' : ''}
                aria-current={page === id ? 'page' : undefined}
              >
                <span className="mobile-menu-link-icon">
                  <Icon size={21} strokeWidth={1.5} />
                </span>
                <span>
                  <strong>{label}</strong>
                  <small>{description}</small>
                </span>
                <ChevronRight size={17} />
              </a>
            ))}
          </nav>
          <div className="mobile-menu-account">
            <div className="mobile-menu-account-heading">
              <span>
                <UserRound size={19} />
              </span>
              <div>
                <strong>
                  {session?.profile
                    ? 'Merhaba, ' + session.profile.name.split(' ')[0]
                    : 'Sana ait bir Velora deneyimi'}
                </strong>
                <small>Hesabın ve siparişlerin bir arada.</small>
              </div>
            </div>
            <div className="mobile-menu-shortcuts">
              <a href="/account">
                {session?.profile ? 'Hesabım' : 'Giriş / Kayıt'}
                <ArrowUpRight size={16} />
              </a>
              <a href="/orders">
                <Package size={16} />
                Siparişlerim
              </a>
            </div>
          </div>
          {(session?.isOwner || session?.profile?.role === 'staff') && (
            <a className="mobile-menu-admin" href="/admin">
              <LayoutDashboard size={17} />
              Yönetim paneli
              <ArrowUpRight size={15} />
            </a>
          )}
        </div>
        <div className="mobile-menu-footer">
          <span>VELORA LIFE</span>
          <span>
            TR <span aria-hidden="true">/</span> ₺ TRY
          </span>
        </div>
      </SheetContent>
    </Sheet>
  );
}
