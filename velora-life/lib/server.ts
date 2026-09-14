import type { ProfileRecord } from '@/types/commerce';
import { database } from './database';
import { identity, appOrigin } from './auth';
export { database, identity };
export async function profile(id: string) {
  return database().prepare('SELECT * FROM profiles WHERE id = ?').bind(id).first<ProfileRecord>();
}
export function safeProfile(member: ProfileRecord | null) {
  if (!member) return null;
  const { admin_note, segment, department, title, ...visible } = member;
  return {
    ...visible,
    cart: JSON.parse(member.cart),
    partner: !!member.partner,
  };
}
export class ApiError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
export function fail(error: unknown) {
  if (error instanceof ApiError)
    return Response.json(
      {
        error: error.message,
      },
      {
        status: error.status,
      },
    );
  console.error('Velora API error', error);
  return Response.json(
    {
      error: 'Şu anda işlem tamamlanamadı. Bilgileriniz korunuyor, lütfen yeniden deneyin.',
    },
    {
      status: 503,
    },
  );
}
export function textField(value: unknown, label: string, min = 0, max = 500) {
  if (typeof value !== 'string' || value.trim().length < min || value.trim().length > max)
    throw new ApiError(label + ' alanını kontrol edin.');
  return value.trim();
}
export function checkOrigin(request: Request) {
  const origin = request.headers.get('origin');
  if (!origin || origin !== appOrigin()) throw new ApiError('İstek doğrulanamadı.', 403);
}
export async function requireMember() {
  const user = await identity();
  if (!user) throw new ApiError('Devam etmek için giriş yapın.', 401);
  const member = await profile(user.id);
  if (!member) throw new ApiError('Önce üyelik profilinizi tamamlayın.', 409);
  return member;
}
export async function requireStaff() {
  const member = await requireMember();
  const owner = await database()
    .prepare("SELECT value FROM settings WHERE key = 'owner'")
    .first<any>();
  if (member.role !== 'staff' && owner?.value !== member.id)
    throw new ApiError('Bu alan yalnızca yetkili çalışanlara açıktır.', 403);
  return {
    ...member,
    owner: owner?.value === member.id,
  };
}
