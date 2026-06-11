// migrate.js — import d'un dump Supabase (JSON array) vers SQLite.
// Usage: DATA_DIR=... ACCESS_CODE=x node migrate.js /chemin/vers/dump.json
//
// - Conserve les ids UUID Supabase (TEXT PRIMARY KEY).
// - Si des URLs de photos non vides sont présentes, télécharge le fichier
//   et remplace l'URL par /rdv/media/<newid>.<ext>.
// - Idempotent : skip si l'id existe déjà.

import Database from 'better-sqlite3';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const DATA_DIR = process.env.DATA_DIR || '/var/lib/sarah-rdv';
const PHOTOS_DIR = path.join(DATA_DIR, 'photos');
fs.mkdirSync(PHOTOS_DIR, { recursive: true });

const dumpPath = process.argv[2];
if (!dumpPath) {
  console.error('Usage: node migrate.js <dump.json>');
  process.exit(1);
}

const raw = fs.readFileSync(dumpPath, 'utf8');
const rows = JSON.parse(raw);
if (!Array.isArray(rows)) {
  console.error('Dump must be a JSON array.');
  process.exit(1);
}

const db = new Database(path.join(DATA_DIR, 'data.db'));
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS date_events (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    event_date TEXT NOT NULL,
    location TEXT NOT NULL,
    coordinates TEXT,
    map_link TEXT,
    note TEXT DEFAULT '',
    photos TEXT NOT NULL DEFAULT '[]',
    completed INTEGER NOT NULL DEFAULT 0,
    completion_note TEXT DEFAULT '',
    completion_photos TEXT NOT NULL DEFAULT '[]',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

const MIME_EXT = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

function extFromUrlOrMime(url, mime) {
  if (mime && MIME_EXT[mime]) return MIME_EXT[mime];
  const m = url.match(/\.(jpg|jpeg|png|webp|gif)(?:\?|$)/i);
  if (m) return '.' + m[1].toLowerCase().replace('jpeg', 'jpg');
  return '.bin';
}

async function downloadPhoto(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`download_failed ${res.status} ${url}`);
  const mime = res.headers.get('content-type') || '';
  const buf = Buffer.from(await res.arrayBuffer());
  const ext = extFromUrlOrMime(url, mime.split(';')[0].trim());
  const filename = `${crypto.randomUUID()}${ext}`;
  fs.writeFileSync(path.join(PHOTOS_DIR, filename), buf);
  return `/rdv/media/${filename}`;
}

async function rewritePhotos(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return [];
  const out = [];
  for (const u of arr) {
    if (typeof u !== 'string' || u.length === 0) continue;
    if (u.startsWith('/rdv/media/')) { out.push(u); continue; } // déjà migré
    try {
      const newUrl = await downloadPhoto(u);
      out.push(newUrl);
    } catch (err) {
      console.error(`[WARN] failed to download ${u}: ${err.message}`);
      // on garde l'URL d'origine pour ne pas perdre l'info
      out.push(u);
    }
  }
  return out;
}

const existsStmt = db.prepare('SELECT 1 FROM date_events WHERE id = ?');
const insertStmt = db.prepare(`
  INSERT INTO date_events
    (id, title, event_date, location, coordinates, map_link, note,
     photos, completed, completion_note, completion_photos,
     created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

let inserted = 0, skipped = 0;

for (const row of rows) {
  if (!row || !row.id) { skipped++; continue; }
  if (existsStmt.get(row.id)) { skipped++; continue; }

  const photos = await rewritePhotos(row.photos || []);
  const completionPhotos = await rewritePhotos(row.completion_photos || []);

  insertStmt.run(
    row.id,
    row.title || '',
    row.event_date || '',
    row.location || '',
    row.coordinates == null ? null : (typeof row.coordinates === 'string' ? row.coordinates : JSON.stringify(row.coordinates)),
    row.map_link || null,
    row.note || '',
    JSON.stringify(photos),
    row.completed ? 1 : 0,
    row.completion_note || '',
    JSON.stringify(completionPhotos),
    row.created_at || new Date().toISOString().slice(0, 19).replace('T', ' '),
    row.updated_at || new Date().toISOString().slice(0, 19).replace('T', ' '),
  );
  inserted++;
}

console.log(JSON.stringify({ inserted, skipped, total: rows.length }));
