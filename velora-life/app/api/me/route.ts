import {
  database,
  identity,
  profile,
  safeProfile,
  ApiError,
  fail,
  textField,
  checkOrigin,
} from '@/lib/server';
import { isValidName } from '@/lib/field-validation';

export async function GET() {
  try {
    const user = await identity();
    if (!user)
      return Response.json({
        identity: null,
        profile: null,
      });
    const memberProfile = await profile(user.id);
    const owner = await database()
      .prepare("SELECT value FROM settings WHERE key = 'owner'")
      .first<any>();
    return Response.json(
      {
        identity: user,
        profile: safeProfile(memberProfile),
        isOwner: owner?.value === user.id,
      },
      {
        headers: {
          'Cache-Control': 'no-store',
        },
      },
    );
  } catch (e) {
    return fail(e);
  }
}
export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const user = await identity();
    if (!user) throw new ApiError('Lütfen giriş yapın.', 401);
    const payload = await request.json();
    const name = textField(payload.name, 'Ad soyad', 3, 100);
    if (!isValidName(name)) {
      throw new ApiError('Ad soyad alanına geçerli bir isim giriniz.');
    }
    const phone = textField(payload.phone, 'Telefon', 10, 25);
    const address = textField(payload.address ?? '', 'Adres', 0, 500);
    const city = textField(payload.city ?? '', 'İl / ilçe', 0, 100);
    const sponsor = textField(payload.sponsor ?? '', 'Davet kodu', 0, 30).toUpperCase();
    if (!/^[+\d\s()-]+$/.test(phone)) throw new ApiError('Geçerli bir telefon numarası girin.');
    const existing = await profile(user.id);
    if (!existing && sponsor) {
      const sponsorProfile = await database()
        .prepare('SELECT id FROM profiles WHERE referral = ? AND partner = 1')
        .bind(sponsor)
        .first();
      if (!sponsorProfile)
        throw new ApiError('Davet kodu bulunamadı. Kodu kontrol edin veya boş bırakın.');
    }
    if (existing) {
      await database()
        .prepare(
          'UPDATE profiles SET name = ?, phone = ?, address = ?, city = ?, partner = ? WHERE id = ?',
        )
        .bind(name, phone, address, city, payload.partner ? 1 : 0, user.id)
        .run();
    } else {
      const code = 'VL-' + crypto.randomUUID().slice(0, 8).toUpperCase();
      await database().batch([
        database()
          .prepare(
            'INSERT INTO profiles (id,email,name,phone,address,city,role,partner,referral,sponsor,cart,created) VALUES (?,?,?,?,?,?,?, ?,?,?,?,?)',
          )
          .bind(
            user.id,
            user.email,
            name,
            phone,
            address,
            city,
            'customer',
            payload.partner ? 1 : 0,
            code,
            sponsor,
            '{}',
            Date.now(),
          ),
      ]);
    }
    return Response.json({
      profile: safeProfile(await profile(user.id)),
    });
  } catch (e) {
    return fail(e);
  }
}
