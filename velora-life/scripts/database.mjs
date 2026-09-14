import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
export function openDatabase() {
  const path = resolve(process.env.DATABASE_PATH || './data/velora.sqlite');
  mkdirSync(dirname(path), {
    recursive: true,
  });
  const db = new DatabaseSync(path);
  db.exec('PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=10000;');
  db.exec(
    'CREATE TABLE IF NOT EXISTS migrations (name TEXT PRIMARY KEY, applied INTEGER NOT NULL)',
  );
  db.exec('BEGIN IMMEDIATE');
  try {
    for (const name of readdirSync(resolve('drizzle'))
      .filter((n) => n.endsWith('.sql'))
      .sort()) {
      if (db.prepare('SELECT name FROM migrations WHERE name = ?').get(name)) continue;
      db.exec(readFileSync(resolve('drizzle', name), 'utf8'));
      db.prepare('INSERT INTO migrations VALUES (?,?)').run(name, Date.now());
    }
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    db.close();
    throw error;
  }
  return db;
}
