import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createHash, randomBytes } from 'node:crypto';
import { database } from './database';
export const SESSION_COOKIE = 'velora_session';
export const digest = (value: string) => createHash('sha256').update(value).digest('hex');
export function appOrigin() {
  const configured = process.env.APP_URL;
  if (!configured && process.env.NODE_ENV === 'production')
    throw new Error('APP_URL must be configured');
  return new URL(configured || 'http://localhost:3000').origin;
}
export async function identity(): Promise<{
  id: string;
  email: string;
  name: string;
} | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  return database()
    .prepare(
      'SELECT u.id,u.email,u.name FROM auth_users u JOIN auth_sessions s ON s.user_id=u.id WHERE s.token_hash=? AND s.expires>?',
    )
    .bind(digest(token), Date.now())
    .first();
}
export async function createSession(userId: string) {
  const jar = await cookies();
  const oldToken = jar.get(SESSION_COOKIE)?.value;
  const token = randomBytes(32).toString('hex');
  const db = database();
  await db.batch([
    db
      .prepare('DELETE FROM auth_sessions WHERE expires <= ? OR token_hash = ?')
      .bind(Date.now(), digest(oldToken || '')),
    db
      .prepare('INSERT INTO auth_sessions VALUES (?,?,?)')
      .bind(digest(token), userId, Date.now() + 7 * 86400000),
  ]);
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: appOrigin().startsWith('https:'),
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 86400,
  });
}
export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token)
    await database()
      .prepare('DELETE FROM auth_sessions WHERE token_hash=?')
      .bind(digest(token))
      .run();
  jar.set(SESSION_COOKIE, '', {
    httpOnly: true,
    secure: appOrigin().startsWith('https:'),
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}
export async function requireUser(returnTo: string) {
  const user = await identity();
  if (!user) redirect('/account?return_to=' + encodeURIComponent(returnTo));
  return user;
}
