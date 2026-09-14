import { openDatabase } from './database.mjs';
const db = openDatabase();
db.close();
console.log('Veritabanı ve şema hazır.');
