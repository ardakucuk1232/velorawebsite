import Storefront from '../storefront';
import { requireUser } from '@/lib/auth';
export const dynamic = 'force-dynamic';
export default async function Page() {
  await requireUser('/orders');
  return <Storefront page="orders" />;
}
