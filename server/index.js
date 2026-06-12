// sarah-rdv-api — mini-backend qui remplace Supabase pour le projet sarah-rendez-vous.
// Express + better-sqlite3 + multer. Pas d'ORM. Auth par code partagé via header X-Access-Code.

import express from 'express';
import Database from 'better-sqlite3';
import multer from 'multer';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

// ---------- Config ----------
const ACCESS_CODE = process.env.ACCESS_CODE;
const DATA_DIR = process.env.DATA_DIR || '/var/lib/sarah-rdv';
const PORT = parseInt(process.env.PORT || '9092', 10);
const HOST = process.env.HOST || '127.0.0.1';
// Public URL prefix for served photos. Defaults to the production mount.
// The demo instance sets this to '/rdv-demo/media' so uploads return URLs
// that resolve under the demo's Caddy route.
const MEDIA_URL_PREFIX = (process.env.MEDIA_URL_PREFIX || '/rdv/media').replace(/\/+$/, '');
const MEDIA_URL_REGEX = new RegExp('^' + MEDIA_URL_PREFIX.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '/([A-Za-z0-9._-]+)$');

if (!ACCESS_CODE || typeof ACCESS_CODE !== 'string' || ACCESS_CODE.length === 0) {
  console.error('[FATAL] ACCESS_CODE env var is required and must be non-empty.');
  process.exit(1);
}

const PHOTOS_DIR = path.join(DATA_DIR, 'photos');
fs.mkdirSync(PHOTOS_DIR, { recursive: true });

// ---------- DB ----------
const db = new Database(path.join(DATA_DIR, 'data.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

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

  CREATE TRIGGER IF NOT EXISTS trg_date_events_updated_at
  AFTER UPDATE ON date_events
  FOR EACH ROW
  BEGIN
    UPDATE date_events SET updated_at = datetime('now') WHERE id = OLD.id;
  END;
`);

// Migrations idempotentes : ajout des colonnes pour la maquette
// (heure, note, état d'acceptation d'une invitation)
function addColumnIfMissing(sql) {
  try { db.exec(sql); } catch (e) {
    if (!/duplicate column name/i.test(String(e && e.message))) throw e;
  }
}
addColumnIfMissing("ALTER TABLE date_events ADD COLUMN event_time TEXT DEFAULT ''");
addColumnIfMissing("ALTER TABLE date_events ADD COLUMN rating INTEGER NOT NULL DEFAULT 0");
addColumnIfMissing("ALTER TABLE date_events ADD COLUMN accepted INTEGER NOT NULL DEFAULT 1");
addColumnIfMissing("ALTER TABLE date_events ADD COLUMN approval_count INTEGER NOT NULL DEFAULT 0");

// ---------- Helpers ----------
const ACCESS_CODE_BUF = Buffer.from(ACCESS_CODE, 'utf8');

function codeMatches(input) {
  if (typeof input !== 'string') return false;
  const buf = Buffer.from(input, 'utf8');
  if (buf.length !== ACCESS_CODE_BUF.length) return false;
  return crypto.timingSafeEqual(buf, ACCESS_CODE_BUF);
}

const ALLOWED_MIMES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const MIME_EXT = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

function rowToEvent(row) {
  if (!row) return null;
  const parseJSON = (s, fallback) => {
    if (s == null || s === '') return fallback;
    try { return JSON.parse(s); } catch { return fallback; }
  };
  return {
    id: row.id,
    title: row.title,
    event_date: row.event_date,
    event_time: row.event_time ?? '',
    location: row.location,
    coordinates: parseJSON(row.coordinates, null),
    map_link: row.map_link,
    note: row.note ?? '',
    photos: parseJSON(row.photos, []),
    completed: !!row.completed,
    accepted: row.accepted == null ? true : !!row.accepted,
    approval_count: row.approval_count ?? 0,
    rating: row.rating ?? 0,
    completion_note: row.completion_note ?? '',
    completion_photos: parseJSON(row.completion_photos, []),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

// Champs autorisés pour create/patch
const WRITABLE_FIELDS = [
  'title', 'event_date', 'event_time', 'location', 'coordinates', 'map_link',
  'note', 'photos', 'completed', 'accepted', 'approval_count', 'rating',
  'completion_note', 'completion_photos',
];

function normalizeForDb(field, value) {
  if (field === 'coordinates') {
    if (value == null) return null;
    return typeof value === 'string' ? value : JSON.stringify(value);
  }
  if (field === 'photos' || field === 'completion_photos') {
    if (value == null) return '[]';
    return typeof value === 'string' ? value : JSON.stringify(value);
  }
  if (field === 'completed' || field === 'accepted') return value ? 1 : 0;
  if (field === 'approval_count') return Math.max(0, Math.min(2, parseInt(value, 10) || 0));
  if (field === 'rating') return Math.max(0, Math.min(5, parseInt(value, 10) || 0));
  return value;
}

// ---------- App ----------
const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '256kb' }));

// Logger JSON
app.use((req, res, next) => {
  const t0 = Date.now();
  res.on('finish', () => {
    const line = {
      ts: new Date().toISOString(),
      method: req.method,
      path: req.path,
      status: res.statusCode,
      ms: Date.now() - t0,
    };
    console.log(JSON.stringify(line));
  });
  next();
});

// ---------- Routes publiques ----------
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, now: new Date().toISOString() });
});

app.post('/api/auth/check', (req, res) => {
  const code = req.body && req.body.code;
  if (codeMatches(code)) return res.json({ ok: true });
  return res.status(401).json({ error: 'invalid_code' });
});

// ---------- Auth middleware (toutes les routes en-dessous) ----------
app.use('/api', (req, res, next) => {
  if (req.path === '/health' || req.path === '/auth/check') return next();
  const header = req.get('X-Access-Code');
  if (!codeMatches(header)) return res.status(401).json({ error: 'unauthorized' });
  next();
});

// ---------- Events ----------
app.get('/api/events', (_req, res) => {
  const rows = db.prepare('SELECT * FROM date_events ORDER BY event_date ASC').all();
  res.json(rows.map(rowToEvent));
});

app.post('/api/events', (req, res, next) => {
  try {
    const body = req.body || {};
    const needsPlannedDate = body.accepted !== false;
    if (!body.title || !body.location || (needsPlannedDate && !body.event_date)) {
      return res.status(400).json({
        error: 'missing_required_fields',
        fields: needsPlannedDate ? ['title', 'event_date', 'location'] : ['title', 'location']
      });
    }
    const id = body.id || crypto.randomUUID();

    const cols = ['id'];
    const placeholders = ['?'];
    const values = [id];
    for (const f of WRITABLE_FIELDS) {
      if (f in body) {
        cols.push(f);
        placeholders.push('?');
        values.push(normalizeForDb(f, body[f]));
      }
    }
    const sql = `INSERT INTO date_events (${cols.join(',')}) VALUES (${placeholders.join(',')})`;
    db.prepare(sql).run(...values);

    const row = db.prepare('SELECT * FROM date_events WHERE id = ?').get(id);
    res.status(201).json(rowToEvent(row));
  } catch (err) {
    next(err);
  }
});

app.patch('/api/events/:id', (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT id FROM date_events WHERE id = ?').get(id);
    if (!existing) return res.status(404).json({ error: 'not_found' });

    const body = req.body || {};
    const sets = [];
    const values = [];
    for (const f of WRITABLE_FIELDS) {
      if (f in body) {
        sets.push(`${f} = ?`);
        values.push(normalizeForDb(f, body[f]));
      }
    }
    if (sets.length > 0) {
      values.push(id);
      db.prepare(`UPDATE date_events SET ${sets.join(', ')} WHERE id = ?`).run(...values);
    }
    const row = db.prepare('SELECT * FROM date_events WHERE id = ?').get(id);
    res.json(rowToEvent(row));
  } catch (err) {
    next(err);
  }
});

app.delete('/api/events/:id', (req, res, next) => {
  try {
    const { id } = req.params;
    const row = db.prepare('SELECT * FROM date_events WHERE id = ?').get(id);
    if (!row) return res.status(404).json({ error: 'not_found' });

    // Collecte des photos servies par nous pour nettoyage disque.
    const collect = (s) => {
      try { return JSON.parse(s || '[]'); } catch { return []; }
    };
    const urls = [...collect(row.photos), ...collect(row.completion_photos)];
    db.prepare('DELETE FROM date_events WHERE id = ?').run(id);

    for (const u of urls) {
      if (typeof u !== 'string') continue;
      // n'efface que ce qui est servi par notre API (<MEDIA_URL_PREFIX>/<filename>)
      const m = u.match(MEDIA_URL_REGEX);
      if (!m) continue;
      const filename = m[1];
      const full = path.join(PHOTOS_DIR, filename);
      // sécurité path traversal
      if (!full.startsWith(PHOTOS_DIR + path.sep)) continue;
      fs.promises.unlink(full).catch(() => {});
    }

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// ---------- Photos (upload / delete) ----------
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIMES.has(file.mimetype)) {
      return cb(Object.assign(new Error('unsupported_media_type'), { status: 415 }));
    }
    cb(null, true);
  },
});

app.post('/api/photos', upload.single('file'), (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'missing_file' });
    const ext = MIME_EXT[req.file.mimetype] || '.bin';
    const filename = `${crypto.randomUUID()}${ext}`;
    const full = path.join(PHOTOS_DIR, filename);
    fs.writeFileSync(full, req.file.buffer);
    res.status(201).json({ url: `${MEDIA_URL_PREFIX}/${filename}` });
  } catch (err) {
    next(err);
  }
});

app.delete('/api/photos/:filename', (req, res, next) => {
  try {
    const { filename } = req.params;
    // Whitelist stricte pour bloquer toute path traversal.
    if (!/^[A-Za-z0-9._-]+$/.test(filename)) {
      return res.status(400).json({ error: 'invalid_filename' });
    }
    const full = path.join(PHOTOS_DIR, filename);
    if (!full.startsWith(PHOTOS_DIR + path.sep)) {
      return res.status(400).json({ error: 'invalid_filename' });
    }
    if (!fs.existsSync(full)) return res.status(404).json({ error: 'not_found' });
    fs.unlinkSync(full);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// ---------- 404 + erreurs ----------
app.use((_req, res) => res.status(404).json({ error: 'not_found' }));

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  const status = err.status || (err.code === 'LIMIT_FILE_SIZE' ? 413 : 500);
  const msg = err.expose === false
    ? 'internal_error'
    : (err.message || 'internal_error');
  // Pas de stack trace renvoyée au client.
  console.error(JSON.stringify({
    ts: new Date().toISOString(),
    level: 'error',
    status,
    msg: err.message,
  }));
  res.status(status).json({ error: msg });
});

// ---------- Start ----------
app.listen(PORT, HOST, () => {
  console.log(JSON.stringify({
    ts: new Date().toISOString(),
    level: 'info',
    msg: 'sarah-rdv-api listening',
    host: HOST,
    port: PORT,
    data_dir: DATA_DIR,
  }));
});
