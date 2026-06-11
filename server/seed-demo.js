// seed-demo.js — wipes data.db + photos in DATA_DIR and reseeds dummy content.
// Designed to run as systemd ExecStartPre for the demo instance, so each
// service restart yields a fresh, clean demo database.
//
// Safety: refuses to run unless DEMO_SEED=1, to make it impossible to
// accidentally wipe the production DB by pointing this script at the wrong dir.

import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';

if (process.env.DEMO_SEED !== '1') {
  console.error('[seed-demo] refusing to run: DEMO_SEED env var must be set to 1');
  process.exit(2);
}

const DATA_DIR = process.env.DATA_DIR;
if (!DATA_DIR) {
  console.error('[seed-demo] DATA_DIR env var is required');
  process.exit(2);
}
if (!/sarah-rdv-demo/.test(DATA_DIR)) {
  console.error(`[seed-demo] DATA_DIR "${DATA_DIR}" does not look like a demo dir (must contain "sarah-rdv-demo"). Refusing.`);
  process.exit(2);
}

const PHOTOS_DIR = path.join(DATA_DIR, 'photos');
const DB_PATH = path.join(DATA_DIR, 'data.db');

// 1. Wipe
fs.mkdirSync(DATA_DIR, { recursive: true });
for (const f of fs.readdirSync(DATA_DIR)) {
  const full = path.join(DATA_DIR, f);
  if (f === 'photos') {
    if (fs.existsSync(PHOTOS_DIR)) fs.rmSync(PHOTOS_DIR, { recursive: true, force: true });
    continue;
  }
  // data.db, data.db-wal, data.db-shm
  fs.rmSync(full, { recursive: true, force: true });
}
fs.mkdirSync(PHOTOS_DIR, { recursive: true });

// 2. Re-init schema (mirrors server/index.js)
const db = new Database(DB_PATH);
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
    event_time TEXT DEFAULT '',
    rating INTEGER NOT NULL DEFAULT 0,
    accepted INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

// 3. Seed: anchor relative dates to today so the demo always shows a sensible mix.
function isoFromOffset(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

// External placeholder photos for completed events. picsum.photos serves
// the same image for a given seed so the demo looks identical on each
// rebuild. CSP on lab.bourdat.fr allows `img-src https:` so these load
// without issue.
const pic = (seed) => `https://picsum.photos/seed/${seed}/640/480`;

const events = [
  // ─── Upcoming ──────────────────────────────────────────────────────────
  {
    id: 'demo-evt-1',
    title: 'Brunch au Café des Fédérations',
    event_date: isoFromOffset(2),
    event_time: '11:30',
    location: 'Café des Fédérations, Lyon',
    coordinates: { lat: 45.7674, lng: 4.8333 },
    map_link: 'https://www.openstreetmap.org/?mlat=45.7674&mlon=4.8333',
    note: "Réservation à mon nom, j'arrive un peu en avance ❤",
    accepted: 1,
  },
  {
    id: 'demo-evt-2',
    title: 'Soirée théâtre — La Cantatrice chauve',
    event_date: isoFromOffset(5),
    event_time: '20:00',
    location: 'Théâtre des Célestins, Lyon',
    coordinates: { lat: 45.7600, lng: 4.8338 },
    map_link: 'https://www.openstreetmap.org/?mlat=45.7600&mlon=4.8338',
    note: 'Places au balcon. Apéro au bar du théâtre avant ?',
    accepted: 1,
  },
  {
    id: 'demo-evt-3',
    title: 'Balade au parc de la Tête d\'Or',
    event_date: isoFromOffset(7),
    event_time: '15:00',
    location: 'Parc de la Tête d\'Or, Lyon',
    coordinates: { lat: 45.7748, lng: 4.8527 },
    map_link: 'https://www.openstreetmap.org/?mlat=45.7748&mlon=4.8527',
    note: 'Glace puis tour en barque si le temps le permet',
    accepted: 1,
  },
  {
    id: 'demo-evt-4',
    title: 'Surprise du week-end',
    event_date: isoFromOffset(10),
    event_time: '11:00',
    location: 'Vieux Lyon',
    coordinates: { lat: 45.7621, lng: 4.8270 },
    map_link: '',
    note: '',
    accepted: 0, // pending invitation — feature "Partager" testable
  },
  {
    id: 'demo-evt-5',
    title: 'Week-end à Annecy',
    event_date: isoFromOffset(21),
    event_time: '09:30',
    location: 'Lac d\'Annecy',
    coordinates: { lat: 45.8992, lng: 6.1294 },
    map_link: 'https://www.openstreetmap.org/?mlat=45.8992&mlon=6.1294',
    note: "Airbnb réservé. Pédalo, fromages, sieste. Programme parfait.",
    accepted: 1,
  },
  {
    id: 'demo-evt-6',
    title: 'Concert jazz — Caveau de la Huchette',
    event_date: isoFromOffset(30),
    event_time: '21:30',
    location: 'Caveau de la Huchette, Paris',
    coordinates: { lat: 48.8528, lng: 2.3469 },
    map_link: 'https://www.openstreetmap.org/?mlat=48.8528&mlon=2.3469',
    note: '',
    accepted: 0, // pending — deuxième invitation à partager
  },
  {
    id: 'demo-evt-7',
    title: "Dîner d'anniversaire chez maman",
    event_date: isoFromOffset(45),
    event_time: '19:30',
    location: 'Villeurbanne',
    coordinates: { lat: 45.7665, lng: 4.8795 },
    map_link: '',
    note: 'Apporter le dessert. Pas oublier le cadeau cette fois.',
    accepted: 1,
  },

  // ─── Past / archived ──────────────────────────────────────────────────
  {
    id: 'demo-evt-8',
    title: 'Cinéma — séance du dimanche',
    event_date: isoFromOffset(-3),
    event_time: '20:15',
    location: 'Cinéma Pathé Bellecour, Lyon',
    coordinates: { lat: 45.7578, lng: 4.8320 },
    map_link: '',
    note: '',
    completed: 1,
    completion_note: 'Le film était long mais on a adoré la fin.',
    rating: 4,
    accepted: 1,
  },
  {
    id: 'demo-evt-9',
    title: 'Pique-nique aux berges du Rhône',
    event_date: isoFromOffset(-12),
    event_time: '13:00',
    location: 'Berges du Rhône, Lyon',
    coordinates: { lat: 45.7600, lng: 4.8434 },
    map_link: '',
    note: 'On apporte tout, à toi le rosé',
    completed: 1,
    completion_note: 'Coup de soleil mais belle journée. À refaire.',
    completion_photos: [pic('rhone-1'), pic('rhone-2')],
    rating: 5,
    accepted: 1,
  },
  {
    id: 'demo-evt-10',
    title: 'Restaurant italien — tentative #2',
    event_date: isoFromOffset(-25),
    event_time: '20:30',
    location: 'Trattoria Da Pasquale, Lyon',
    coordinates: { lat: 45.7589, lng: 4.8351 },
    map_link: '',
    note: '',
    completed: 1,
    completion_note: 'Service un peu lent mais les pâtes étaient parfaites.',
    rating: 3,
    accepted: 1,
  },
  {
    id: 'demo-evt-11',
    title: 'Marché de Noël de Strasbourg',
    event_date: isoFromOffset(-40),
    event_time: '17:00',
    location: 'Place Broglie, Strasbourg',
    coordinates: { lat: 48.5847, lng: 7.7507 },
    map_link: 'https://www.openstreetmap.org/?mlat=48.5847&mlon=7.7507',
    note: 'Train de nuit retour. Vin chaud obligatoire.',
    completed: 1,
    completion_note: "Trois vins chauds et un bredele. Magique.",
    completion_photos: [pic('strasbourg-1'), pic('strasbourg-2'), pic('strasbourg-3')],
    rating: 5,
    accepted: 1,
  },
  {
    id: 'demo-evt-12',
    title: 'Randonnée au Mont Mézenc',
    event_date: isoFromOffset(-55),
    event_time: '08:00',
    location: 'Mont Mézenc, Ardèche',
    coordinates: { lat: 44.9133, lng: 4.2186 },
    map_link: 'https://www.openstreetmap.org/?mlat=44.9133&mlon=4.2186',
    note: 'Sandwich + thermos. Lever tôt mais ça vaut le coup.',
    completed: 1,
    completion_note: "Vue à 360°, on voyait jusqu'au Mont Blanc. Inoubliable.",
    completion_photos: [pic('mezenc-1'), pic('mezenc-2')],
    rating: 5,
    accepted: 1,
  },
  {
    id: 'demo-evt-13',
    title: 'Soirée bowling avec les amis',
    event_date: isoFromOffset(-70),
    event_time: '21:00',
    location: 'Bowling Astrobowl, Vénissieux',
    coordinates: { lat: 45.6968, lng: 4.8853 },
    map_link: '',
    note: '',
    completed: 1,
    completion_note: 'Dernière. Mais on a bien ri.',
    rating: 3,
    accepted: 1,
  },
  {
    id: 'demo-evt-14',
    title: 'Atelier poterie à deux',
    event_date: isoFromOffset(-90),
    event_time: '14:00',
    location: 'Atelier Terre & Mains, Lyon 4',
    coordinates: { lat: 45.7775, lng: 4.8270 },
    map_link: '',
    note: '',
    completed: 1,
    completion_note: "Mon vase ressemble à une chaussette. Le tien est sublime.",
    completion_photos: [pic('poterie-1')],
    rating: 4,
    accepted: 1,
  },
  {
    id: 'demo-evt-15',
    title: 'Spa week-end à Évian',
    event_date: isoFromOffset(-120),
    event_time: '15:00',
    location: 'Hôtel Royal, Évian-les-Bains',
    coordinates: { lat: 46.4017, lng: 6.5897 },
    map_link: 'https://www.openstreetmap.org/?mlat=46.4017&mlon=6.5897',
    note: 'Anniversaire de rencontre. Surprise totale.',
    completed: 1,
    completion_note: 'Le meilleur week-end de l\'année. Merci ❤',
    completion_photos: [pic('evian-1'), pic('evian-2'), pic('evian-3'), pic('evian-4')],
    rating: 5,
    accepted: 1,
  },
];

const insert = db.prepare(`
  INSERT INTO date_events (
    id, title, event_date, event_time, location, coordinates, map_link,
    note, photos, completed, completion_note, completion_photos, rating, accepted
  ) VALUES (
    @id, @title, @event_date, @event_time, @location, @coordinates, @map_link,
    @note, @photos, @completed, @completion_note, @completion_photos, @rating, @accepted
  )
`);

const tx = db.transaction((rows) => {
  for (const e of rows) {
    insert.run({
      id: e.id,
      title: e.title,
      event_date: e.event_date,
      event_time: e.event_time || '',
      location: e.location,
      coordinates: e.coordinates ? JSON.stringify(e.coordinates) : null,
      map_link: e.map_link || '',
      note: e.note || '',
      photos: JSON.stringify(e.photos || []),
      completed: e.completed ? 1 : 0,
      completion_note: e.completion_note || '',
      completion_photos: JSON.stringify(e.completion_photos || []),
      rating: e.rating || 0,
      accepted: e.accepted == null ? 1 : (e.accepted ? 1 : 0),
    });
  }
});
tx(events);

console.log(JSON.stringify({
  ts: new Date().toISOString(),
  msg: 'demo seed complete',
  data_dir: DATA_DIR,
  events: events.length,
}));
db.close();
