import { randomUUID } from 'node:crypto';
import { isValidName , isValidEmail } from './field-validation';
import { database, checkOrigin, ApiError, fail, textField } from './server';
import { createSession } from './auth';
import { hashPassword, verifyPassword } from '../scripts/password.mjs';
const dummyHash = 'scrypt:00000000000000000000000000000000:' + '00'.repeat(64);
async function throttle(email: string) {
  const db = database();
  const now = Date.now();
  await db.batch([
    db.prepare('DELETE FROM auth_attempts WHERE expires <= ?').bind(now),
    ...[
      ['email:' + email, 10],
      ['global', 300],
    ].map(([key]) =>
      db
        .prepare(
          'INSERT INTO auth_attempts VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET attempts=attempts+1',
        )
        .bind(key as string, now + 15 * 60000),
    ),
  ]);
  const rows = await db
    .prepare('SELECT key,attempts FROM auth_attempts WHERE key IN (?,?)')
    .bind('email:' + email, 'global')
    .all<{
      key: string;
      attempts: number;
    }>();
  if (rows.results.some((r) => r.attempts > (r.key === 'global' ? 300 : 10)))
    throw new ApiError('Çok fazla deneme yapıldı. 15 dakika sonra tekrar deneyin.', 429);
}
export async function authenticate(r: Request, register: boolean) {
  try {
    checkOrigin(r);
    const body = await r.json();
    const email = textField(body.email, 'E-posta', 5, 254).toLowerCase();
    if (!isValidEmail(email)) {
      throw new ApiError('Geçerli bir e-posta adresi giriniz.');
    }
    const password = body.password;
    if (
      typeof password !== 'string' ||
      password.length > 128 ||
      password.length < (register ? 12 : 1)
    )
      throw new ApiError('Şifreniz 12–128 karakter olmalıdır.');
    await throttle(email);
    const db = database();
    const existing = await db
      .prepare('SELECT id,password_hash FROM auth_users WHERE email=?')
      .bind(email)
      .first<{
        id: string;
        password_hash: string;
      }>();
    let id: string;
    if (register) {
      const name = textField(body.name, 'Ad soyad', 3, 100);
      if (!isValidName(name)) {
        throw new ApiError('Ad soyad alanına geçerli bir isim giriniz.');
      }
      const hash = await hashPassword(password);
      if (existing)
        throw new ApiError(
          'Bu e-posta ile kayıt oluşturulamadı. Hesabınız varsa giriş yapın.',
          409,
        );
      id = randomUUID();
      try {
        await db
          .prepare('INSERT INTO auth_users VALUES (?,?,?,?,?)')
          .bind(id, email, name, hash, Date.now())
          .run();
      } catch (error) {
        if (String(error).includes('UNIQUE'))
          throw new ApiError('Bu e-posta ile kayıt oluşturulamadı.', 409);
        throw error;
      }
    } else {
      const valid = await verifyPassword(password, existing?.password_hash || dummyHash);
      if (!existing || !valid) throw new ApiError('E-posta veya şifre hatalı.', 401);
      id = existing.id;
    }
    await createSession(id);
    return Response.json(
      {
        ok: true,
      },
      {
        status: register ? 201 : 200,
        headers: {
          'Cache-Control': 'no-store',
        },
      },
    );
  } catch (error) {
    return fail(error);
  }
}
