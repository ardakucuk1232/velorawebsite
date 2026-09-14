import { createInterface } from 'node:readline/promises';
import { Writable } from 'node:stream';
import { randomUUID } from 'node:crypto';
import { openDatabase } from './database.mjs';
import { hashPassword } from './password.mjs';
let hidden = false;
const output = new Writable({
  write(chunk, encoding, callback) {
    if (!hidden) process.stdout.write(chunk, encoding);
    callback();
  },
});
const rl = createInterface({
  input: process.stdin,
  output,
  terminal: !!process.stdin.isTTY,
});
let db;
try {
  const email = (process.env.ADMIN_EMAIL || (await rl.question('Yönetici e-postası: ')))
    .trim()
    .toLowerCase();
  const name = (process.env.ADMIN_NAME || (await rl.question('Ad soyad: '))).trim();
  process.stdout.write('Şifre (en az 12 karakter; yazarken görünmez): ');
  hidden = true;
  const password = process.env.ADMIN_PASSWORD || (await rl.question(''));
  hidden = false;
  process.stdout.write('\n');
  if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    email.length > 254 ||
    name.length < 3 ||
    name.length > 100 ||
    password.length < 12 ||
    password.length > 128
  )
    throw new Error('E-posta, ad veya şifre geçersiz.');
  const hash = await hashPassword(password);
  db = openDatabase();
  db.exec('BEGIN IMMEDIATE');
  try {
    if (db.prepare("SELECT value FROM settings WHERE key='owner'").get())
      throw new Error('Yönetici zaten var. Çalışan yetkilerini panelden yönetin.');
    if (db.prepare('SELECT id FROM auth_users WHERE email=?').get(email))
      throw new Error('Bu e-posta kayıtlı. Kurulum için farklı bir yönetici e-postası kullanın.');
    const id = randomUUID();
    const now = Date.now();
    db.prepare('INSERT INTO auth_users VALUES (?,?,?,?,?)').run(id, email, name, hash, now);
    db.prepare(
      'INSERT INTO profiles (id,email,name,phone,address,city,role,partner,referral,sponsor,cart,created) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
    ).run(
      id,
      email,
      name,
      '',
      '',
      '',
      'staff',
      0,
      'VL-' + randomUUID().slice(0, 8).toUpperCase(),
      '',
      '{}',
      now,
    );
    db.prepare("INSERT INTO settings (key,value) VALUES ('owner',?)").run(id);
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
  console.log('Yönetici hazır. /account üzerinden giriş yapıp /admin panelini açabilirsiniz.');
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  rl.close();
  db?.close();
}
