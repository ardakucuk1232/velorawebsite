import { authenticate } from '@/lib/auth-actions';
export async function POST(request: Request) {
  return authenticate(request, false);
}
