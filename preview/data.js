/* ============================================================
   data.js — icônes, helpers de date, données fictives
   ============================================================ */

const ICON = {
  home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/></svg>',
  cal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18M8 3v4M16 3v4"/></svg>',
  archive: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-7-4.5-9.5-9A5 5 0 0 1 12 6a5 5 0 0 1 9.5 6c-2.5 4.5-9.5 9-9.5 9z"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-6-5.2-6-10a6 6 0 0 1 12 0c0 4.8-6 10-6 10z"/><circle cx="12" cy="11" r="2.2"/></svg>',
  clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>',
  trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12l5 5L20 6"/></svg>',
  star: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.9 6.2 6.6.7-4.9 4.6 1.3 6.6L12 17.8 6.1 20.7l1.3-6.6L2.5 8.9l6.6-.7z"/></svg>',
  cam: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13" r="3.2"/></svg>',
  bell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6z"/><path d="M10 20a2 2 0 0 0 4 0"/></svg>',
  chevL: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6l-6 6 6 6"/></svg>',
  chevR: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>',
  back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>',
  gift: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="8" width="18" height="13" rx="1.5"/><path d="M3 12h18M12 8v13M12 8S10 3 7.5 4 9 8 12 8zM12 8s2-5 4.5-4S15 8 12 8z"/></svg>',
  spark: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.6 6.4L20 10l-6.4 1.6L12 18l-1.6-6.4L4 10l6.4-1.6z"/></svg>',
  heart: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 21s-6.5-4.8-9.2-9C1 9 2.5 5 6.2 5 9 5 10.5 7 12 9c1.5-2 3-4 5.8-4C21.5 5 23 9 21.2 12c-2.7 4.2-9.2 9-9.2 9z"/></svg>',
  utensils: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 3v7a2 2 0 0 0 4 0V3M7 11v10M17 3c-1.5 0-3 1.5-3 5s1.5 4 3 4v9"/></svg>',
};

const WD = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const MONTHS = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
const MONTHS_SHORT = ["Janv", "Févr", "Mars", "Avr", "Mai", "Juin", "Juil", "Août", "Sept", "Oct", "Nov", "Déc"];

function dayOffset(n){
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + n);
  return d;
}
function iso(d){
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function parseISO(s){ return new Date(s + "T12:00:00"); }
function fmtLong(s){
  return parseISO(s).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
}
function fmtDay(s){ return String(parseISO(s).getDate()); }
function fmtMon(s){ return MONTHS_SHORT[parseISO(s).getMonth()]; }

/* ---- Données fictives (offsets relatifs à aujourd'hui) ---- */
const SEED_EVENTS = [
  {
    id: "e1", title: "Dîner au bord de l'eau", date: iso(dayOffset(4)),
    time: "20:00", location: "Quai Saint-Antoine, Lyon", status: "confirmed",
    note: "J'ai réservé la petite table près de la fenêtre, comme la première fois.",
  },
  {
    id: "e2", title: "Cinéma & glace", date: iso(dayOffset(9)),
    time: "18:30", location: "Pathé Bellecour", status: "confirmed",
    note: "Séance de 18h30 puis double boule pistache-vanille.",
  },
  {
    id: "p1", title: "Pique-nique surprise", date: iso(dayOffset(2)),
    time: "12:30", location: "Parc de la Tête d'Or", status: "pending",
    note: "Une surprise se prépare… dis oui ?",
  },
  {
    id: "p2", title: "Atelier poterie à deux", date: iso(dayOffset(13)),
    time: "15:00", location: "Croix-Rousse", status: "pending",
    note: "On se salit les mains et on rigole.",
  },
  {
    id: "v1", title: "Balade et café doux", date: iso(dayOffset(-1)),
    time: "10:00", location: "Vieux Lyon", status: "toValidate",
    note: "Chocolat chaud et flânerie dans les traboules.",
  },
  {
    id: "d1", title: "Concert acoustique", date: iso(dayOffset(-12)),
    time: "21:00", location: "Le Sucre", status: "done", rating: 5,
    note: "On a dansé jusqu'à la fin, tu te souviens ?",
    memory: "La plus belle soirée du mois. On y retourne c'est sûr.",
    photos: 3,
  },
  {
    id: "d2", title: "Brunch dominical", date: iso(dayOffset(-21)),
    time: "11:00", location: "Café Mokxa", status: "done", rating: 4,
    note: "Pancakes et grasse matinée prolongée.",
    memory: "Le serveur nous a pris en photo, trop mignon.",
    photos: 2,
  },
  {
    id: "d3", title: "Rando au Mont d'Or", date: iso(dayOffset(-34)),
    time: "09:00", location: "Mont d'Or", status: "done", rating: 5,
    note: "Lever tôt mais quelle vue au sommet.",
    memory: "On a vu tout Lyon dans la brume. Magique.",
    photos: 4,
  },
];
