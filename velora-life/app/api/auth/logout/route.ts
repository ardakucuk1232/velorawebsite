import { destroySession, appOrigin } from '@/lib/auth';
import { checkOrigin, fail } from '@/lib/server';
export async function POST(request: Request) {
  try {
    checkOrigin(request);
    await destroySession();
    return Response.redirect(new URL('/account', appOrigin()), 303);
  } catch (error) {
    return fail(error);
  }
}
