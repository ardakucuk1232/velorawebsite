import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: 'Velora Life | İyi yaşam, birlikte büyür.',
  description:
    'Velora Life günlük yaşam, cilt bakımı ve bitki çayları. Ürünleri keşfedin, topluluğa katılın ve siparişlerinizi takip edin.',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
  },
};
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className="antialiased">{children}</body>
    </html>
  );
}
