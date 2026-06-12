/* ============================================================
   Nos Rendez-vous — app de production
   Design : prototype Claude Design (canvas → app full-screen)
   Backend : /rdv/api/* (Node + Express + better-sqlite3)
   Fallback : localStorage si API down
   ============================================================ */
(function () {
  'use strict';

  // ----- Config -----
  // API_BASE is derived from the URL by the inline script in index.html
  // (window.__rdvConfig) so that the same bundle serves both the production
  // instance (/rdv/) and the public demo (/rdv-demo/).
  const API_BASE = (window.__rdvConfig && window.__rdvConfig.apiBase) || '/rdv/api';
  const STORAGE_KEY = 'nos-rendez-vous-events';
  const PENDING_ORDER_KEY = 'nos-rendez-vous-pending-order';
  const ACCESS_CODE_KEY = 'nos-rendez-vous-access-code';
  const DEFAULT_ACCESS_CODE = '01052021';
  const NOMINATIM = 'https://nominatim.openstreetmap.org';

  // Seed default access code so the app boots without a lock screen.
  try {
    if (!localStorage.getItem(ACCESS_CODE_KEY)){
      localStorage.setItem(ACCESS_CODE_KEY, DEFAULT_ACCESS_CODE);
    }
  } catch {}

  // ----- Icons -----
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
    chevL: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6l-6 6 6 6"/></svg>',
    chevR: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>',
    back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>',
    gift: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="8" width="18" height="13" rx="1.5"/><path d="M3 12h18M12 8v13M12 8S10 3 7.5 4 9 8 12 8zM12 8s2-5 4.5-4S15 8 12 8z"/></svg>',
    spark: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.6 6.4L20 10l-6.4 1.6L12 18l-1.6-6.4L4 10l6.4-1.6z"/></svg>',
    heart: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 21s-6.5-4.8-9.2-9C1 9 2.5 5 6.2 5 9 5 10.5 7 12 9c1.5-2 3-4 5.8-4C21.5 5 23 9 21.2 12c-2.7 4.2-9.2 9-9.2 9z"/></svg>',
    logout: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5M21 12H9"/></svg>',
    share: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7"/><path d="M16 6l-4-4-4 4"/><path d="M12 2v14"/></svg>',
    utensils: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 3v7a2 2 0 0 0 4 0V3M7 11v10M17 3c-1.5 0-3 1.5-3 5s1.5 4 3 4v9"/></svg>',
    cup: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8h13v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z"/><path d="M17 9h2.5a2.5 2.5 0 0 1 0 5H17"/><path d="M7 3v2M11 3v2"/></svg>',
    film: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 9h18M8 5v14M16 5v14"/></svg>',
    walk: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="13" cy="4.4" r="1.8"/><path d="M11 9l3 2 1.5 3.5M11 9l-1.6 4-2 1.2M14.3 11.2l-1 4 2 5M9.4 13l-2 7"/></svg>',
    basket: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 10h14l-1.4 9H6.4z"/><path d="M9 10l3-5 3 5"/><path d="M9 13.5v3M15 13.5v3"/></svg>',
    museum: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-5 9 5"/><path d="M5 9v8M10 9v8M14 9v8M19 9v8M3 20h18"/></svg>',
    music: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/></svg>',
    palette: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a9 9 0 1 0 0 18c1.4 0 2-1 2-2 0-1.4 1-2 2-2h1a4 4 0 0 0 4-4c0-4.4-4-8-9-8z"/><circle cx="8" cy="11" r="1" fill="currentColor"/><circle cx="12" cy="8" r="1" fill="currentColor"/><circle cx="16" cy="11" r="1" fill="currentColor"/></svg>',
    leaf: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 19s-1-9 6-13c5 0 8 3 8 8-4 7-13 6-14 5z"/><path d="M9 15c2-3 5-4 5-4"/></svg>',
    bike: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="17" r="3"/><circle cx="18" cy="17" r="3"/><path d="M6 17l4-7h5l-3 7M10 10l-1-3H7M15 10l2-3"/></svg>',
    locate: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/><circle cx="12" cy="12" r="8"/></svg>',
  };

  const WD = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  const MONTHS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
  const MONTHS_SHORT = ['Janv','Févr','Mars','Avr','Mai','Juin','Juil','Août','Sept','Oct','Nov','Déc'];

  // ----- Date helpers -----
  function iso(d){
    const y = d.getFullYear();
    const m = String(d.getMonth()+1).padStart(2,'0');
    const day = String(d.getDate()).padStart(2,'0');
    return `${y}-${m}-${day}`;
  }
  function parseISO(s){ return new Date(s + 'T12:00:00'); }
  function hasPlannedDate(value){ return !!(value && /^\d{4}-\d{2}-\d{2}$/.test(value)); }
  function fmtLong(s){
    if (!hasPlannedDate(s)) return 'Date à choisir ensemble';
    return parseISO(s).toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long' });
  }
  function fmtDay(s){ return String(parseISO(s).getDate()); }
  function fmtMon(s){ return MONTHS_SHORT[parseISO(s).getMonth()]; }
  function escapeHTML(s){
    if (s == null) return '';
    return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  // ----- API client -----
  class ApiError extends Error { constructor(m,s){ super(m); this.status=s; } }

  function getCode(){
    try { return localStorage.getItem(ACCESS_CODE_KEY) || ''; }
    catch { return ''; }
  }

  async function api(path, opts = {}){
    const headers = Object.assign({}, opts.headers || {});
    const code = getCode();
    if (code) headers['X-Access-Code'] = code;
    const isForm = (typeof FormData !== 'undefined') && opts.body instanceof FormData;
    if (opts.body && !isForm && !headers['Content-Type']) headers['Content-Type'] = 'application/json';
    const res = await fetch(API_BASE + path, Object.assign({}, opts, { headers }));
    if (!res.ok){
      let msg = 'HTTP ' + res.status;
      try { const j = await res.json(); if (j && j.error) msg = j.error; } catch {}
      throw new ApiError(msg, res.status);
    }
    if (res.status === 204) return null;
    const ct = res.headers.get('Content-Type') || '';
    return ct.includes('application/json') ? res.json() : res.text();
  }

  // ----- Storage fallback -----
  function lsLoad(){
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
    catch { return []; }
  }
  function lsSave(list){
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); } catch {}
  }

  // ----- API → state model -----
  // status: 'pending' | 'matched' | 'confirmed' | 'toValidate' | 'done'
  function apiToState(e){
    const d = e.event_date;
    const t = e.event_time || '20:00';
    const hasDate = hasPlannedDate(d);
    const eventDate = hasDate ? new Date(d + 'T' + t + ':00') : null;
    const isFuture = hasDate ? eventDate >= new Date(Date.now() - 3*3600*1000) : false; // tolerance 3h
    let status;
    if (e.completed) status = 'done';
    else if (e.accepted === false && (e.approval_count || 0) >= 2) status = 'matched';
    else if (e.accepted === false) status = 'pending';
    else if (!hasDate) status = 'matched';
    else if (!isFuture) status = 'toValidate';
    else status = 'confirmed';
    return {
      id: e.id,
      title: e.title,
      date: d,
      time: t,
      location: e.location,
      coordinates: e.coordinates || null,
      mapLink: e.map_link || '',
      note: e.note || '',
      status,
      approvalCount: Math.max(0, Math.min(2, e.approval_count || 0)),
      rating: e.rating || 0,
      memory: e.completion_note || '',
      photos: Array.isArray(e.completion_photos) ? e.completion_photos : [],
      intentPhotos: Array.isArray(e.photos) ? e.photos : [],
    };
  }

  function stateToApi(s){
    return {
      title: s.title,
      event_date: s.date,
      event_time: s.time || '',
      location: s.location,
      coordinates: s.coordinates || null,
      map_link: s.mapLink || '',
      note: s.note || '',
      photos: s.intentPhotos || [],
      accepted: (s.status === 'pending' || s.status === 'matched') ? 0 : 1,
      approval_count: s.status === 'matched' ? 2 : Math.max(0, Math.min(2, s.approvalCount || 0)),
    };
  }

  // ============================================================
  // STATE
  // ============================================================
  const state = {
    events: [],
    screen: 'dash',
    apiOnline: false,
    calOffset: 0, // month offset from current
    pendingOrder: [],
  };

  function loadPendingOrder(){
    try {
      const raw = JSON.parse(localStorage.getItem(PENDING_ORDER_KEY) || '[]');
      return Array.isArray(raw) ? raw.filter(id => typeof id === 'string') : [];
    } catch {
      return [];
    }
  }

  function savePendingOrder(order){
    state.pendingOrder = Array.isArray(order) ? order.slice() : [];
    try { localStorage.setItem(PENDING_ORDER_KEY, JSON.stringify(state.pendingOrder)); } catch {}
  }

  function getPendingEvents(){
    return state.events
      .filter(e => e.status === 'pending' || e.status === 'matched')
      .sort((a,b) => {
        const left = (a.date || '9999-99-99') + (a.time || '');
        const right = (b.date || '9999-99-99') + (b.time || '');
        return left.localeCompare(right);
      });
  }

  function syncPendingOrder(){
    const ids = new Set(getPendingEvents().map(e => e.id));
    const kept = state.pendingOrder.filter(id => ids.has(id));
    const missing = Array.from(ids).filter(id => !kept.includes(id));
    savePendingOrder([...kept, ...missing]);
  }

  function pendingQueue(preferredId){
    syncPendingOrder();
    const queue = state.pendingOrder.slice();
    if (preferredId && queue.includes(preferredId)) {
      while (queue[0] !== preferredId) queue.push(queue.shift());
    }
    return queue;
  }

  // ============================================================
  // DATA OPS
  // ============================================================
  async function loadEvents(){
    if (state.apiOnline){
      try {
        const list = await api('/events');
        const mapped = list.map(apiToState);
        lsSave(mapped); // mirror to local for offline
        state.events = mapped;
        syncPendingOrder();
        return mapped;
      } catch (e) {
        state.apiOnline = false;
        showOffline(true);
      }
    }
    const local = lsLoad();
    state.events = local;
    syncPendingOrder();
    return local;
  }

  async function createEvent(data){
    if (state.apiOnline){
      try {
        const created = await api('/events', { method:'POST', body: JSON.stringify(stateToApi(data)) });
        return apiToState(created);
      } catch (e) {
        state.apiOnline = false; showOffline(true);
      }
    }
    const local = Object.assign({ id: 'local-' + Date.now() }, data);
    return local;
  }

  async function updateEvent(id, patch){
    if (state.apiOnline){
      try {
        // build API patch
        const body = {};
        if ('title' in patch) body.title = patch.title;
        if ('date' in patch) body.event_date = patch.date;
        if ('time' in patch) body.event_time = patch.time;
        if ('location' in patch) body.location = patch.location;
        if ('coordinates' in patch) body.coordinates = patch.coordinates;
        if ('mapLink' in patch) body.map_link = patch.mapLink;
        if ('note' in patch) body.note = patch.note;
        if ('memory' in patch) body.completion_note = patch.memory;
        if ('approvalCount' in patch) body.approval_count = patch.approvalCount;
        if ('rating' in patch) body.rating = patch.rating;
        if ('photos' in patch) body.completion_photos = patch.photos;
        if ('intentPhotos' in patch) body.photos = patch.intentPhotos;
        if ('status' in patch){
          if (patch.status === 'done'){ body.completed = true; }
          else if (patch.status === 'confirmed'){ body.completed = false; body.accepted = true; }
          else if (patch.status === 'matched'){ body.completed = false; body.accepted = false; }
          else if (patch.status === 'pending'){ body.completed = false; body.accepted = false; }
        }
        const updated = await api('/events/' + encodeURIComponent(id), { method:'PATCH', body: JSON.stringify(body) });
        return apiToState(updated);
      } catch (e) {
        state.apiOnline = false; showOffline(true);
      }
    }
    // local merge
    const idx = state.events.findIndex(e => e.id === id);
    if (idx >= 0){
      Object.assign(state.events[idx], patch);
      return state.events[idx];
    }
    return null;
  }

  async function deleteEvent(id){
    if (state.apiOnline){
      try { await api('/events/' + encodeURIComponent(id), { method:'DELETE' }); }
      catch { state.apiOnline = false; showOffline(true); }
    }
  }

  async function uploadPhoto(file){
    if (!state.apiOnline){
      // local : data-URL
      return new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(r.result);
        r.onerror = reject;
        r.readAsDataURL(file);
      });
    }
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await api('/photos', { method:'POST', body: fd });
      return res.url;
    } catch (e) {
      state.apiOnline = false; showOffline(true);
      return new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(r.result);
        r.onerror = reject;
        r.readAsDataURL(file);
      });
    }
  }

  // ============================================================
  // SHELL & UI
  // ============================================================
  const shell = document.getElementById('shell');
  const shellInner = document.getElementById('shell-inner');
  const appEl = document.getElementById('app');
  const offlineBanner = document.getElementById('offline-banner');

  function showOffline(on){
    if (offlineBanner){
      offlineBanner.classList.toggle('show', !!on);
    }
  }

  function toast(msg){
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = msg;
    shellInner.appendChild(t);
    requestAnimationFrame(() => t.classList.add('show'));
    setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, 1800);
  }

  // ============================================================
  // SCREEN RENDERERS
  // ============================================================
  function starsHTML(rating){
    let s = '<span class="stars">';
    for (let i=1; i<=5; i++) s += `<span class="${i<=rating?'star-on':'star-off'}">${ICON.star}</span>`;
    return s + '</span>';
  }

  function photoTilesHTML(urls){
    if (!urls || !urls.length) return '';
    const cls = urls.length === 1 ? 'mem-photos one' : urls.length === 2 ? 'mem-photos two' : 'mem-photos';
    return `<div class="${cls}">${urls.slice(0,9).map(u =>
      `<div class="ph"><img src="${escapeHTML(u)}" alt=""></div>`
    ).join('')}</div>`;
  }

  function miniCalHTML(year, month){
    const evMap = {};
    state.events.forEach(e => { evMap[e.date] = e.status; });
    const todayISO = iso(new Date());
    const head = `
      <div class="mc-head">
        <div class="mc-month">${MONTHS[month]} ${year}</div>
        <div class="mc-nav">
          <button type="button" data-cal-prev>${ICON.chevL}</button>
          <button type="button" data-cal-next>${ICON.chevR}</button>
        </div>
      </div>`;
    let grid = '<div class="mc-grid">';
    WD.forEach(w => grid += `<div class="mc-wd">${w[0]}</div>`);
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const lead = (first.getDay() + 6) % 7;
    const cells = Math.ceil((lead + last.getDate()) / 7) * 7;
    for (let i = 0; i < cells; i++){
      const dnum = i - lead + 1;
      const date = new Date(year, month, dnum);
      const ds = iso(date);
      const out = date.getMonth() !== month;
      const st = evMap[ds];
      let cls = 'mc-day';
      if (out) cls += ' out';
      if (ds === todayISO) cls += ' today';
      if (st === 'confirmed' || st === 'toValidate') cls += ' ev';
      else if (st === 'pending') cls += ' ev pend';
      else if (st === 'done') cls += ' ev done';
      grid += `<div class="${cls}">${date.getDate()}</div>`;
    }
    grid += '</div>';
    return `<div class="card mini-cal">${head}${grid}</div>`;
  }

  function countdownParts(dateStr, time){
    if (!hasPlannedDate(dateStr)) return { d: 0, h: 0, m: 0 };
    const target = new Date(dateStr + 'T' + (time || '12:00') + ':00');
    let diff = Math.max(0, target - new Date());
    const d = Math.floor(diff/86400000); diff -= d*86400000;
    const h = Math.floor(diff/3600000); diff -= h*3600000;
    const m = Math.floor(diff/60000);
    return { d, h, m };
  }

  // ----- Dashboard -----
  function renderDashboard(){
    const events = state.events;
    const next = events
      .filter(e => e.status === 'confirmed' && hasPlannedDate(e.date))
      .sort((a,b) => (a.date+a.time).localeCompare(b.date+b.time))[0];
    const pendings = events.filter(e => e.status === 'pending');
    const matched = events.filter(e => e.status === 'matched');
    const toValidate = events.filter(e => e.status === 'toValidate');
    const doneCount = events.filter(e => e.status === 'done').length;
    const now = new Date();
    const targetMonth = now.getMonth() + state.calOffset;
    const calDate = new Date(now.getFullYear(), targetMonth, 1);

    let nextCard;
    if (next){
      const cp = countdownParts(next.date, next.time);
      nextCard = `
        <div class="next-card" data-countdown="${next.date}T${next.time || '12:00'}">
          <div class="nc-eyebrow">Notre prochain rendez-vous</div>
          <h2>${escapeHTML(next.title)}</h2>
          <div class="nc-meta">
            <span>${ICON.cal} ${fmtLong(next.date)} · ${escapeHTML(next.time)}</span>
            <span>${ICON.pin} ${escapeHTML(next.location)}</span>
          </div>
          <div class="countdown">
            <div class="cd-cell"><b data-cd="d">${cp.d}</b><small>jours</small></div>
            <div class="cd-cell"><b data-cd="h">${cp.h}</b><small>heures</small></div>
            <div class="cd-cell"><b data-cd="m">${cp.m}</b><small>min</small></div>
          </div>
        </div>`;
    } else {
      nextCard = `
        <div class="next-card empty">
          <div class="nc-eyebrow">Pas encore de rendez-vous</div>
          <h2>Et si on en planifiait un ?</h2>
          <p>Un dîner, une balade, une surprise…</p>
          <button class="btn btn-primary" data-nav="new">${ICON.plus} Nouveau RDV</button>
        </div>`;
    }

    const invSection = (pendings.length || matched.length) ? `
      <div class="app-sec">
        <h3>Invitations en attente</h3>
        <button class="btn btn-soft btn-sm" type="button" data-open-pending-deck>Tout afficher</button>
      </div>
      <div class="inv-strip">
        ${[...matched, ...pendings].map(e => `
          <div class="inv-pill" data-open-inv="${e.id}">
            <div class="inv-seal">${ICON.heart}</div>
            <div class="ip-body">
              <div class="ip-t">${escapeHTML(e.title)}</div>
              <div class="ip-s">${e.status === 'matched' ? '2/2 oui · date à choisir' : `${Math.max(0, Math.min(2, e.approvalCount || 0))}/2 oui · en attente`}</div>
            </div>
            <div class="ip-go">${e.status === 'matched' ? 'Choisir →' : 'Ouvrir →'}</div>
          </div>`).join('')}
      </div>` : '';

    const validateSection = toValidate.length ? `
      <div class="app-sec"><h3>À valider</h3></div>
      <div class="inv-strip">
        ${toValidate.map(e => `
          <div class="inv-pill" data-validate="${e.id}">
            <div class="inv-seal" style="background:linear-gradient(135deg,var(--gold),var(--gold-deep))">${ICON.check}</div>
            <div class="ip-body">
              <div class="ip-t">${escapeHTML(e.title)}</div>
              <div class="ip-s">${fmtLong(e.date)} · raconte-moi</div>
            </div>
            <div class="ip-go">Valider →</div>
          </div>`).join('')}
      </div>` : '';

    return `
      <div class="scr">
        <div class="topline">
          <div class="greet">
            <div class="hi">Bonjour vous deux ❤</div>
            <h1>Nos rendez-vous</h1>
          </div>
          <div class="avatar-pair">
            <div class="avatar">S</div>
            <div class="avatar">V</div>
          </div>
        </div>

        ${nextCard}

        <div class="quick-row">
          <button class="quick" data-nav="new" type="button">
            <div class="qi">${ICON.plus}</div>
            <div><div class="qt">Nouveau RDV</div><div class="qs">Proposer une date</div></div>
          </button>
          <button class="quick" data-nav="archive" type="button">
            <div class="qi">${ICON.archive}</div>
            <div><div class="qt">Nos souvenirs</div><div class="qs">${doneCount} moment${doneCount>1?'s':''}</div></div>
          </button>
        </div>

        ${invSection}
        ${validateSection}

        <div class="app-sec"><h3>Ce mois-ci</h3><a data-nav="cal">Calendrier</a></div>
        ${miniCalHTML(calDate.getFullYear(), calDate.getMonth())}
      </div>`;
  }

  // ----- Calendrier -----
  function renderCalendar(){
    const events = state.events;
    const upcoming = events
      .filter(e => ['confirmed','toValidate'].includes(e.status) && hasPlannedDate(e.date))
      .sort((a,b) => (a.date+a.time).localeCompare(b.date+b.time));

    const now = new Date();
    const targetMonth = now.getMonth() + state.calOffset;
    const calDate = new Date(now.getFullYear(), targetMonth, 1);

    const tag = (st) => {
      if (st === 'confirmed') return '<span class="ev-tag confirmed">Confirmé</span>';
      if (st === 'pending') return '<span class="ev-tag pending">En attente</span>';
      if (st === 'matched') return '<span class="ev-tag pending">2/2 oui</span>';
      if (st === 'toValidate') return '<span class="ev-tag validate">À valider</span>';
      return '';
    };

    const card = (e) => `
      <div class="ev-card" data-ev="${e.id}">
        <div class="ev-top">
          <div style="display:flex;gap:12px;">
            <div class="ev-date-chip"><b>${fmtDay(e.date)}</b><small>${fmtMon(e.date)}</small></div>
            <div class="ev-main">
              <h4>${escapeHTML(e.title)}</h4>
              <div class="ev-loc">${ICON.pin} ${escapeHTML(e.location)}</div>
              <div class="ev-loc" style="margin-top:3px">${ICON.clock} ${escapeHTML(e.time)}</div>
            </div>
          </div>
          ${tag(e.status)}
        </div>
        ${e.note ? `<p class="ev-note">« ${escapeHTML(e.note)} »</p>` : ''}
        <div class="ev-actions">
          ${e.status === 'toValidate'
            ? `<button class="btn btn-primary btn-sm" data-validate="${e.id}">${ICON.check} Valider le RDV</button>`
            : e.status === 'pending'
            ? `<button class="btn btn-soft btn-sm" data-open-inv="${e.id}">${ICON.gift} Voir l'invitation</button>
               <button class="btn btn-primary btn-sm" data-share-inv="${e.id}">${ICON.share} Partager</button>`
            : `<button class="btn btn-ghost btn-sm" data-edit="${e.id}">${ICON.edit} Modifier</button>`}
          <button class="btn btn-icon btn-sm" data-delete="${e.id}" title="Supprimer">${ICON.trash}</button>
        </div>
      </div>`;

    return `
      <div class="scr">
        <div class="topline">
          <div class="greet"><div class="hi">Notre agenda à deux</div><h1>Calendrier</h1></div>
          <button class="btn btn-primary btn-sm" data-nav="new" type="button">${ICON.plus} RDV</button>
        </div>

        ${miniCalHTML(calDate.getFullYear(), calDate.getMonth())}

        <div class="app-sec"><h3>À venir</h3><span class="tiny">${upcoming.length} prévu${upcoming.length>1?'s':''}</span></div>
        ${upcoming.length ? upcoming.map(card).join('') : '<div class="card" style="padding:24px;text-align:center;color:var(--muted)">Aucun rendez-vous à venir.</div>'}
      </div>`;
  }

  // ----- Archive -----
  function renderArchive(){
    const done = state.events
      .filter(e => e.status === 'done')
      .sort((a,b) => b.date.localeCompare(a.date));

    const card = (e) => `
      <div class="ev-card">
        <div class="ev-top">
          <div style="display:flex;gap:12px;">
            <div class="ev-date-chip"><b>${fmtDay(e.date)}</b><small>${fmtMon(e.date)}</small></div>
            <div class="ev-main">
              <h4>${escapeHTML(e.title)}</h4>
              <div class="ev-loc">${ICON.pin} ${escapeHTML(e.location)}</div>
            </div>
          </div>
          ${starsHTML(e.rating)}
        </div>
        ${e.memory ? `<p class="ev-note">« ${escapeHTML(e.memory)} »</p>` : ''}
        ${photoTilesHTML(e.photos)}
        <div class="ev-actions" style="margin-top:10px">
          <button class="btn btn-icon btn-sm" data-delete="${e.id}" title="Supprimer">${ICON.trash}</button>
        </div>
      </div>`;

    const totalPhotos = done.reduce((a,e) => a + (e.photos?.length || 0), 0);

    return `
      <div class="scr">
        <div class="topline">
          <div class="greet"><div class="hi">Tout ce qu'on a vécu</div><h1>Nos souvenirs</h1></div>
        </div>

        <div class="quick-row" style="margin-top:4px">
          <div class="card" style="padding:15px 16px">
            <div style="font-family:var(--font-display);font-size:28px;color:var(--rose-deep)">${done.length}</div>
            <div class="tiny" style="font-weight:700">rendez-vous vécus</div>
          </div>
          <div class="card" style="padding:15px 16px">
            <div style="font-family:var(--font-display);font-size:28px;color:var(--gold-deep)">${totalPhotos}</div>
            <div class="tiny" style="font-weight:700">photos gardées</div>
          </div>
        </div>

        <div class="app-sec"><h3>Carnet de moments</h3></div>
        ${done.length ? done.map(card).join('') : '<div class="card" style="padding:24px;text-align:center;color:var(--muted)">Pas encore de souvenir. Le premier arrive bientôt ❤</div>'}
      </div>`;
  }

  function navbarHTML(active){
    const it = (id, icon, label) =>
      `<button class="nav-item ${active===id?'active':''}" data-nav="${id}" type="button">${icon}<span>${label}</span></button>`;
    return `
      <div class="navbar">
        <div class="navbar-inner">
          ${it('dash', ICON.home, 'Accueil')}
          ${it('cal', ICON.cal, 'Calendrier')}
          <button class="nav-fab" data-nav="new" type="button">${ICON.plus}</button>
          ${it('archive', ICON.archive, 'Souvenirs')}
          <button class="nav-item ${active==='inv'?'active':''}" data-nav="inv" type="button">${ICON.gift}<span>Invitation</span></button>
        </div>
      </div>`;
  }

  // ============================================================
  // RENDER
  // ============================================================
  function render(){
    let html = '';
    if (state.screen === 'cal') html = renderCalendar();
    else if (state.screen === 'archive') html = renderArchive();
    else html = renderDashboard();
    appEl.innerHTML = html;
    setNavbar(state.screen);
    appEl.scrollTop = 0;
    updateCountdowns();
  }

  function setNavbar(active){
    const old = shellInner.querySelector('.navbar');
    if (old) old.remove();
    const tmp = document.createElement('div');
    tmp.innerHTML = navbarHTML(active);
    shellInner.appendChild(tmp.firstElementChild);
  }

  // ============================================================
  // COMPOSER — propositions d'activités + suggestions par lieu
  // ============================================================
  const CAT_ICON = {
    resto: ICON.utensils, cafe: ICON.cup, cine: ICON.film, balade: ICON.walk,
    picnic: ICON.basket, culture: ICON.museum, concert: ICON.music,
    atelier: ICON.palette, spa: ICON.leaf, sport: ICON.bike, surprise: ICON.spark,
  };

  const ACTIVITY_IDEAS = [
    { id: 'resto', label: 'Restaurant', title: 'Dîner aux chandelles' },
    { id: 'cafe', label: 'Café · Brunch', title: 'Brunch gourmand' },
    { id: 'cine', label: 'Cinéma', title: 'Séance ciné & popcorn' },
    { id: 'balade', label: 'Balade', title: 'Balade main dans la main' },
    { id: 'picnic', label: 'Pique-nique', title: 'Pique-nique au parc' },
    { id: 'culture', label: 'Musée · Expo', title: "Visite d'une expo" },
    { id: 'concert', label: 'Concert', title: 'Concert en amoureux' },
    { id: 'atelier', label: 'Atelier', title: 'Atelier créatif à deux' },
    { id: 'spa', label: 'Spa · Détente', title: 'Moment cocooning au spa' },
    { id: 'sport', label: 'Sport', title: 'Sortie vélo à deux' },
    { id: 'surprise', label: 'Surprise', title: 'Surprise mystère' },
  ];

  // Zones lyonnaises + suggestions concrètes. Les coordonnées permettent
  // de poser le marker Leaflet sans aller-retour Nominatim.
  const ZONES = [
    { id: 'presquile', area: "Presqu'île", spots: [
      { title: 'Dîner rue Mercière', place: 'Rue Mercière, Lyon', cat: 'resto', d: '5 min', coords: { lat: 45.7625, lng: 4.8331 } },
      { title: 'Ciné à Bellecour', place: 'Pathé Bellecour, Lyon', cat: 'cine', d: '8 min', coords: { lat: 45.7572, lng: 4.8323 } },
      { title: 'Café cosy', place: 'Place des Jacobins, Lyon', cat: 'cafe', d: '3 min', coords: { lat: 45.7607, lng: 4.8333 } },
    ]},
    { id: 'vieuxlyon', area: 'Vieux Lyon', spots: [
      { title: 'Flânerie dans les traboules', place: 'Vieux Lyon, Lyon', cat: 'balade', d: 'sur place', coords: { lat: 45.7621, lng: 4.8270 } },
      { title: 'Bouchon traditionnel', place: 'Rue Saint-Jean, Lyon', cat: 'resto', d: '4 min', coords: { lat: 45.7621, lng: 4.8278 } },
      { title: 'Montée à Fourvière', place: 'Basilique Notre-Dame de Fourvière, Lyon', cat: 'balade', d: '12 min', coords: { lat: 45.7622, lng: 4.8222 } },
    ]},
    { id: 'tetedor', area: "Tête d'Or", spots: [
      { title: 'Pique-nique au lac', place: "Parc de la Tête d'Or, Lyon", cat: 'picnic', d: 'sur place', coords: { lat: 45.7772, lng: 4.8527 } },
      { title: 'Balade à vélo', place: "Allées du Parc de la Tête d'Or, Lyon", cat: 'sport', d: '2 min', coords: { lat: 45.7783, lng: 4.8540 } },
      { title: 'Roseraie en amoureux', place: "Roseraie du Parc de la Tête d'Or, Lyon", cat: 'balade', d: '6 min', coords: { lat: 45.7802, lng: 4.8520 } },
    ]},
    { id: 'croixrousse', area: 'Croix-Rousse', spots: [
      { title: 'Atelier poterie', place: 'Croix-Rousse, Lyon', cat: 'atelier', d: '5 min', coords: { lat: 45.7770, lng: 4.8290 } },
      { title: 'Apéro sur les pentes', place: 'Pentes de la Croix-Rousse, Lyon', cat: 'cafe', d: '7 min', coords: { lat: 45.7723, lng: 4.8341 } },
      { title: 'Marché du matin', place: 'Boulevard de la Croix-Rousse, Lyon', cat: 'balade', d: '4 min', coords: { lat: 45.7779, lng: 4.8311 } },
    ]},
    { id: 'confluence', area: 'Confluence', spots: [
      { title: 'Expo au musée', place: 'Musée des Confluences, Lyon', cat: 'culture', d: '6 min', coords: { lat: 45.7333, lng: 4.8181 } },
      { title: 'Ciné & resto', place: 'Pôle de loisirs Confluence, Lyon', cat: 'cine', d: '5 min', coords: { lat: 45.7437, lng: 4.8155 } },
      { title: "Balade au bord de l'eau", place: 'Quais de Saône, Lyon', cat: 'balade', d: '3 min', coords: { lat: 45.7472, lng: 4.8170 } },
    ]},
  ];

  function composerHTML(){
    const ideas = ACTIVITY_IDEAS.map(a => `
      <button type="button" class="idea-card" data-idea="${a.id}" data-title="${escapeHTML(a.title)}">
        <span class="idea-ic">${CAT_ICON[a.id] || ICON.heart}</span>
        <span class="idea-lb">${escapeHTML(a.label)}</span>
      </button>`).join('');
    const zones = ZONES.map(z => `<button type="button" class="zone-chip" data-zone="${z.id}">${escapeHTML(z.area)}</button>`).join('');
    return `
      <div class="composer-sec">
        <div class="cs-label">Une idée ? Pioche <span class="hint">${ACTIVITY_IDEAS.length} activités</span></div>
        <div class="idea-scroll">${ideas}</div>
      </div>
      <div class="composer-sec">
        <div class="cs-label">Autour de vous <span class="hint">selon le lieu</span></div>
        <div class="zone-row">
          <button type="button" class="zone-chip locate" data-locate>${ICON.locate} Ma position</button>
          ${zones}
        </div>
        <div class="zone-suggest" data-zone-suggest></div>
      </div>
      <div class="cs-divider"><span>ou compose à la main</span></div>`;
  }

  function zoneSuggestionsHTML(zone){
    return zone.spots.map((s, i) => `
      <button type="button" class="sugg-card" data-sugg data-idx="${i}" data-title="${escapeHTML(s.title)}" data-place="${escapeHTML(s.place)}">
        <span class="sugg-ic">${CAT_ICON[s.cat] || ICON.heart}</span>
        <span class="sugg-body">
          <span class="sugg-t">${escapeHTML(s.title)}</span>
          <span class="sugg-p">${ICON.pin} ${escapeHTML(s.place)} · à ${escapeHTML(s.d)}</span>
        </span>
        <span class="sugg-add">${ICON.plus}</span>
      </button>`).join('');
  }

  // ============================================================
  // SHEET — Nouveau / Modifier RDV
  // ============================================================
  function formSheetHTML(initial, options){
    const i = initial || {};
    const opts = options || {};
    const isNew = !i.id;
    const isSchedulingMatch = !!opts.forceDateStep;
    const showDateTimeField = !isNew || isSchedulingMatch;
    const showSendMode = !isNew && !isSchedulingMatch;
    return `
      <div class="sheet-scrim" id="sheet-scrim">
        <div class="sheet">
          <div class="sheet-grip"></div>
          <h2>${isSchedulingMatch ? 'Choisir la date' : (isNew ? 'Nouveau' : 'Modifier') + ' rendez-vous'}</h2>
          <p class="sub">${isSchedulingMatch ? 'Vous avez tous les deux dit oui. Il ne reste plus qu’à fixer la date.' : (isNew ? "Crée d'abord l'invitation, la date pourra venir après." : 'Ajuste comme tu veux.')}</p>

          ${(isNew && !isSchedulingMatch) ? composerHTML() : ''}

          <div class="field">
            <label>Titre</label>
            <input type="text" id="f-title" placeholder="Ex : Dîner au bord de l'eau" value="${escapeHTML(i.title||'')}">
          </div>
          <div class="field" id="date-time-field" style="display:${showDateTimeField ? 'flex' : 'none'};gap:11px">
            <div style="flex:1.4"><label>Date</label><input type="date" id="f-date" value="${escapeHTML(i.date||iso(new Date(Date.now()+86400000*3)))}"></div>
            <div style="flex:1"><label>Heure</label><input type="time" id="f-time" value="${escapeHTML(i.time||'20:00')}"></div>
          </div>
          <div class="field">
            <label>Lieu</label>
            <input type="text" id="f-location" placeholder="Cherche un endroit…" value="${escapeHTML(i.location||'')}">
            <div class="map-real" id="f-map"></div>
            <p class="tiny" style="margin:7px 2px 0">Touche la carte pour poser le lieu, l'adresse se remplit toute seule.</p>
          </div>
          <div class="field">
            <label>Petit mot</label>
            <textarea id="f-note" placeholder="Un mot doux, une intention, une surprise…">${escapeHTML(i.note||'')}</textarea>
          </div>
          <div class="field" style="display:${showSendMode ? 'block' : 'none'}">
            <label>Comment l'envoyer ?</label>
            <div class="seg" id="send-seg">
              <button type="button" class="${(i.status==='pending'||!i.id||i.status==='matched')?'on':''}" data-seg="invite">${ICON.gift} Invitation surprise</button>
              <button type="button" class="${i.status==='confirmed'?'on':''}" data-seg="direct">Ajouter direct</button>
            </div>
          </div>

          <div style="display:flex;gap:10px;margin-top:6px">
            <button class="btn btn-ghost" id="sheet-cancel" type="button">Annuler</button>
            <button class="btn btn-primary btn-block" id="sheet-save" type="button">${isSchedulingMatch ? ICON.check + ' Valider la date' : (i.id ? 'Enregistrer' : ICON.heart + " Envoyer l'invitation")}</button>
          </div>
        </div>
      </div>`;
  }

  function openSheet(initial, options){
    const wrap = document.createElement('div');
    wrap.innerHTML = formSheetHTML(initial, options);
    const scrim = wrap.firstElementChild;
    shellInner.appendChild(scrim);
    requestAnimationFrame(() => scrim.classList.add('open'));

    let map = null, marker = null;
    let coords = (initial && initial.coordinates) || null;
    let mapLink = (initial && initial.mapLink) || '';

    const locInput = scrim.querySelector('#f-location');
    const mapEl = scrim.querySelector('#f-map');

    function setMarker(lat, lng){
      coords = { lat, lng };
      mapLink = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
      if (!marker){
        marker = L.marker([lat, lng]).addTo(map);
      } else {
        marker.setLatLng([lat, lng]);
      }
      map.setView([lat, lng], Math.max(map.getZoom(), 14));
    }

    async function reverseLookup(lat, lng){
      try {
        const r = await fetch(`${NOMINATIM}/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=fr`);
        const j = await r.json();
        if (j && j.display_name) locInput.value = j.display_name;
      } catch {}
    }

    async function geocode(q){
      try {
        const r = await fetch(`${NOMINATIM}/search?format=json&q=${encodeURIComponent(q)}&limit=1&accept-language=fr`);
        const arr = await r.json();
        if (arr && arr[0]){
          setMarker(parseFloat(arr[0].lat), parseFloat(arr[0].lon));
          locInput.value = arr[0].display_name;
        }
      } catch {}
    }

    setTimeout(() => {
      if (typeof L === 'undefined'){
        mapEl.innerHTML = '<div style="height:100%;display:grid;place-items:center;color:var(--muted);font-size:12px">Carte indisponible</div>';
        return;
      }
      const start = coords || { lat: 45.764, lng: 4.8357 }; // Lyon
      map = L.map(mapEl, { zoomControl: true }).setView([start.lat, start.lng], coords ? 14 : 12);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19, attribution: '© OSM'
      }).addTo(map);
      if (coords) setMarker(coords.lat, coords.lng);
      map.on('click', (e) => {
        setMarker(e.latlng.lat, e.latlng.lng);
        reverseLookup(e.latlng.lat, e.latlng.lng);
      });
      setTimeout(() => map.invalidateSize(), 350);
    }, 50);

    // Search on blur of location field
    let searchTimer;
    locInput.addEventListener('change', () => {
      const v = locInput.value.trim();
      if (v && !coords) geocode(v);
    });

    // Composer — propositions d'activités + suggestions par lieu (créa. seulement)
    const titleInput = scrim.querySelector('#f-title');
    const ideaCards = scrim.querySelectorAll('.idea-card');
    ideaCards.forEach(card => {
      card.addEventListener('click', () => {
        const wasActive = card.classList.contains('active');
        ideaCards.forEach(x => x.classList.remove('active'));
        if (!wasActive){
          card.classList.add('active');
          if (titleInput && !titleInput.value.trim()) titleInput.value = card.dataset.title;
        }
      });
    });

    const suggestWrap = scrim.querySelector('[data-zone-suggest]');
    function showZone(zone, chip){
      scrim.querySelectorAll('.zone-chip').forEach(x => x.classList.remove('active'));
      if (chip) chip.classList.add('active');
      if (suggestWrap) suggestWrap.innerHTML = zoneSuggestionsHTML(zone);
    }
    scrim.querySelectorAll('.zone-chip[data-zone]').forEach(ch => {
      ch.addEventListener('click', () => {
        const z = ZONES.find(z => z.id === ch.dataset.zone);
        if (z) showZone(z, ch);
      });
    });

    const locateBtn = scrim.querySelector('[data-locate]');
    if (locateBtn){
      locateBtn.addEventListener('click', () => {
        locateBtn.innerHTML = 'Localisation…';
        locateBtn.classList.add('active');
        setTimeout(() => {
          locateBtn.innerHTML = ICON.locate + ' Près de vous';
          const z = ZONES[2]; // Tête d'Or (simulé)
          showZone(z, locateBtn);
        }, 650);
      });
    }

    if (suggestWrap){
      suggestWrap.addEventListener('click', (e) => {
        const card = e.target.closest('[data-sugg]');
        if (!card) return;
        suggestWrap.querySelectorAll('.sugg-card').forEach(x => x.classList.remove('active'));
        card.classList.add('active');
        if (titleInput) titleInput.value = card.dataset.title;
        const place = card.dataset.place;
        locInput.value = place;
        // Trouve la zone active + le spot pour récupérer ses coordonnées (sinon Nominatim)
        const activeZone = scrim.querySelector('.zone-chip.active');
        const zoneId = activeZone && activeZone.dataset.zone;
        const idx = +card.dataset.idx;
        const zone = zoneId ? ZONES.find(z => z.id === zoneId) : ZONES[2];
        const spot = zone && zone.spots[idx];
        if (spot && spot.coords && map){
          setMarker(spot.coords.lat, spot.coords.lng);
        } else {
          geocode(place);
        }
      });
    }

    // Segmented control
    let sendMode = isNewEvent(initial, options) ? 'invite' : ((options && options.forceDateStep) ? 'direct' : ((initial && initial.status === 'confirmed') ? 'direct' : 'invite'));
    const dateTimeField = scrim.querySelector('#date-time-field');
    scrim.querySelectorAll('#send-seg button').forEach(b => {
      b.addEventListener('click', () => {
        scrim.querySelectorAll('#send-seg button').forEach(x => x.classList.remove('on'));
        b.classList.add('on');
        sendMode = b.dataset.seg;
        if (dateTimeField) dateTimeField.style.display = sendMode === 'invite' ? 'none' : 'flex';
        scrim.querySelector('#sheet-save').innerHTML =
          sendMode === 'invite' ? ICON.heart + " Envoyer l'invitation" : ICON.check + ' Ajouter au calendrier';
      });
    });

    const close = () => { scrim.classList.remove('open'); setTimeout(() => scrim.remove(), 320); };
    scrim.querySelector('#sheet-cancel').addEventListener('click', close);
    scrim.addEventListener('click', e => { if (e.target === scrim) close(); });

    scrim.querySelector('#sheet-save').addEventListener('click', async () => {
      const data = {
        title: scrim.querySelector('#f-title').value.trim() || 'Surprise',
        date: sendMode === 'invite' ? '' : scrim.querySelector('#f-date').value,
        time: sendMode === 'invite' ? '' : (scrim.querySelector('#f-time').value || '20:00'),
        location: scrim.querySelector('#f-location').value.trim() || 'À définir',
        note: scrim.querySelector('#f-note').value.trim(),
        coordinates: coords,
        mapLink: mapLink,
        status: sendMode === 'invite' ? 'pending' : 'confirmed',
        approvalCount: (options && options.forceDateStep) ? 2 : (sendMode === 'invite' ? 0 : 2),
      };
      if (sendMode !== 'invite' && !data.date) {
        toast('Choisis une date pour finaliser');
        return;
      }
      try {
        if (initial && initial.id){
          await updateEvent(initial.id, data);
        } else {
          await createEvent(data);
        }
      } catch (e) {
        toast('Erreur de sauvegarde');
      }
      close();
      state.events = await loadEvents();
      if (sendMode === 'invite') state.screen = 'dash';
      else state.screen = 'cal';
      setTimeout(render, 220);
      setTimeout(() => toast((options && options.forceDateStep) ? 'Date fixée ❤' : (sendMode === 'invite' ? 'Invitation envoyée ❤' : 'Rendez-vous ajouté')), 260);
    });
  }

  function isNewEvent(initial, options){
    return !(initial && initial.id) && !(options && options.forceDateStep);
  }

  // ============================================================
  // SHEET — Validation
  // ============================================================
  function openValidate(id){
    const ev = state.events.find(e => e.id === id);
    if (!ev) return;
    const html = `
      <div class="sheet-scrim" id="sheet-scrim">
        <div class="sheet">
          <div class="sheet-grip"></div>
          <h2>C'était comment ?</h2>
          <p class="sub">${escapeHTML(ev.title)} · ${fmtLong(ev.date)}</p>

          <div class="field">
            <label>Votre coup de cœur</label>
            <div class="rate-input" id="rate-input">
              ${[1,2,3,4,5].map(i => `<span data-rate="${i}">${ICON.star}</span>`).join('')}
            </div>
          </div>
          <div class="field">
            <label>Mot souvenir</label>
            <textarea id="v-memory" placeholder="Ce qu'on a ressenti, un détail à garder…"></textarea>
          </div>
          <div class="field">
            <label>Photos souvenir <span style="color:var(--rose-deep)">· obligatoire</span></label>
            <div class="upload-row" id="v-photos">
              <label class="upload-tile">${ICON.plus}<input type="file" accept="image/*" multiple></label>
            </div>
          </div>
          <div style="display:flex;gap:10px;margin-top:6px">
            <button class="btn btn-ghost" id="sheet-cancel" type="button">Plus tard</button>
            <button class="btn btn-primary btn-block" id="validate-save" type="button">${ICON.check} Ranger ce souvenir</button>
          </div>
        </div>
      </div>`;
    const wrap = document.createElement('div');
    wrap.innerHTML = html;
    const scrim = wrap.firstElementChild;
    shellInner.appendChild(scrim);
    requestAnimationFrame(() => scrim.classList.add('open'));

    let rating = 0;
    const photoUrls = [];

    const stars = scrim.querySelectorAll('#rate-input span');
    stars.forEach(s => s.addEventListener('click', () => {
      rating = +s.dataset.rate;
      stars.forEach(x => x.classList.toggle('on', +x.dataset.rate <= rating));
    }));

    const photosRow = scrim.querySelector('#v-photos');
    const fileInput = photosRow.querySelector('input[type=file]');

    function renderTiles(){
      photosRow.innerHTML = '';
      photoUrls.forEach((url, idx) => {
        const tile = document.createElement('div');
        tile.className = 'upload-tile filled';
        tile.innerHTML = `<img src="${escapeHTML(url)}" alt=""><span class="remove" data-rm="${idx}">×</span>`;
        photosRow.appendChild(tile);
      });
      const add = document.createElement('label');
      add.className = 'upload-tile';
      add.innerHTML = `${ICON.plus}<input type="file" accept="image/*" multiple>`;
      add.querySelector('input').addEventListener('change', handleFiles);
      photosRow.appendChild(add);
    }
    async function handleFiles(e){
      const files = Array.from(e.target.files || []);
      for (const f of files){
        try {
          const url = await uploadPhoto(f);
          photoUrls.push(url);
        } catch { toast('Upload échoué'); }
      }
      renderTiles();
    }
    fileInput.addEventListener('change', handleFiles);
    photosRow.addEventListener('click', (e) => {
      const rm = e.target.closest('[data-rm]');
      if (rm){
        photoUrls.splice(+rm.dataset.rm, 1);
        renderTiles();
      }
    });

    const close = () => { scrim.classList.remove('open'); setTimeout(() => scrim.remove(), 320); };
    scrim.querySelector('#sheet-cancel').addEventListener('click', close);

    scrim.querySelector('#validate-save').addEventListener('click', async () => {
      if (!photoUrls.length){ toast('Au moins une photo souvenir 📸'); return; }
      const memory = scrim.querySelector('#v-memory').value.trim() || 'Un joli moment de plus, gardé précieusement.';
      try {
        await updateEvent(id, {
          status: 'done',
          rating: rating || 5,
          memory,
          photos: photoUrls,
        });
      } catch { toast('Erreur de sauvegarde'); }
      close();
      state.events = await loadEvents();
      state.screen = 'archive';
      setTimeout(render, 220);
      setTimeout(() => toast('Souvenir rangé ✨'), 260);
    });
  }

  // ============================================================
  // INVITATIONS EN PILE
  // ============================================================
  function pendingDeckHTML(ev, count, hasNext){
    return `
      <div class="pending-deck-screen">
        <div class="pending-deck-top">
          <button class="inv-back" type="button" data-pending-close>${ICON.back}</button>
          <div class="pending-deck-copy">
            <div class="eyebrow">Toutes les invitations</div>
            <h2>${count} en attente</h2>
            <p>Swipe à droite pour activer. Swipe à gauche pour passer sans supprimer.</p>
          </div>
        </div>

        <div class="swipe-deck-wrap">
          ${hasNext ? '<div class="swipe-deck-shadow"></div>' : ''}
          <article class="swipe-deck-card" data-swipe-card data-event-id="${escapeHTML(ev.id)}">
            <div class="swipe-stamp">En attente</div>
            <div class="swipe-card-head">
              <div class="swipe-heart">${ICON.heart}</div>
              <div>
                <div class="swipe-kicker">Invitation surprise</div>
                <h1>${escapeHTML(ev.title)}</h1>
              </div>
            </div>
            <div class="swipe-detail-list">
              <div class="row">${ICON.cal} ${ev.status === 'matched' ? 'Vous avez matché, il reste à fixer la date' : `${Math.max(0, Math.min(2, ev.approvalCount || 0))}/2 oui pour le moment`}</div>
              ${hasPlannedDate(ev.date) ? `<div class="row">${ICON.clock} ${escapeHTML(ev.time || '20:00')}</div>` : ''}
              <div class="row">${ICON.pin} ${escapeHTML(ev.location)}</div>
            </div>
            ${ev.note ? `<p class="swipe-note">« ${escapeHTML(ev.note)} »</p>` : ''}
            ${photoTilesHTML(ev.intentPhotos)}
            <div class="swipe-hints">
              <span>← Passer</span>
              <span>Accepter →</span>
            </div>
          </article>
        </div>

        <div class="swipe-actions-bar">
          <button class="btn btn-ghost" type="button" data-pending-skip>Passer pour l'instant</button>
          <button class="btn btn-primary" type="button" data-pending-accept>${ev.status === 'matched' ? 'Choisir la date' : 'Dire oui'}</button>
        </div>
      </div>`;
  }

  function movePendingToEnd(id){
    const queue = pendingQueue();
    const filtered = queue.filter(x => x !== id);
    filtered.push(id);
    savePendingOrder(filtered);
  }

  async function acceptPendingInvitation(id){
    const current = state.events.find(event => event.id === id);
    if (!current) return { matched: false };
    const nextApprovalCount = Math.max(0, Math.min(2, (current.approvalCount || 0) + 1));
    try {
      await updateEvent(id, {
        status: nextApprovalCount >= 2 ? 'matched' : 'pending',
        approvalCount: nextApprovalCount,
      });
    } catch {}
    state.events = await loadEvents();
    if (nextApprovalCount >= 2) {
      savePendingOrder(state.pendingOrder);
      return { matched: true };
    }
    movePendingToEnd(id);
    return { matched: false };
  }

  function openMatchedScheduling(ev){
    closePendingDeck();
    toast('Activite matchee, proposez une date ❤');
    openSheet({
      id: ev.id,
      title: ev.title,
      date: ev.date,
      time: ev.time,
      location: ev.location,
      coordinates: ev.coordinates,
      mapLink: ev.mapLink,
      note: ev.note,
      status: 'matched',
      approvalCount: 2,
    }, { forceDateStep: true });
  }

  function closePendingDeck(){
    const overlay = shellInner.querySelector('.pending-deck-overlay');
    if (overlay) overlay.remove();
    render();
  }

  function mountPendingDeck(host, preferredId){
    const queue = pendingQueue(preferredId);
    const currentId = queue[0];
    const ev = state.events.find(item => item.id === currentId && (item.status === 'pending' || item.status === 'matched'));

    if (!ev){
      toast('Vous avez deja fait votre choix sur les activites proposees');
      closePendingDeck();
      return;
    }

    host.innerHTML = pendingDeckHTML(ev, queue.length, queue.length > 1);

    const card = host.querySelector('[data-swipe-card]');
    const closeBtn = host.querySelector('[data-pending-close]');
    const skipBtn = host.querySelector('[data-pending-skip]');
    const acceptBtn = host.querySelector('[data-pending-accept]');

    const finishSwipe = async (direction) => {
      if (!card || card.dataset.busy === '1') return;
      card.dataset.busy = '1';
      card.classList.remove('dragging');
      card.style.transform = '';
      card.classList.add(direction === 'right' ? 'leave-right' : 'leave-left');
      await new Promise(resolve => setTimeout(resolve, 220));
      if (direction === 'right') {
        if (ev.status === 'matched') {
          openMatchedScheduling(ev);
          return;
        }
        const result = await acceptPendingInvitation(ev.id);
        if (result.matched) {
          const updated = state.events.find(item => item.id === ev.id);
          if (updated) {
            toast('Vous avez tous les deux dit oui ❤');
            openMatchedScheduling(updated);
            return;
          }
        }
        toast('Premier oui enregistré ❤');
      } else {
        movePendingToEnd(ev.id);
      }
      mountPendingDeck(host);
    };

    let startX = 0;
    let dx = 0;
    let pointerId = null;

    const resetCard = () => {
      dx = 0;
      card.classList.remove('dragging');
      card.style.transform = '';
    };

    const release = async () => {
      if (!card.classList.contains('dragging')) return;
      card.classList.remove('dragging');
      if (pointerId !== null && card.hasPointerCapture(pointerId)) card.releasePointerCapture(pointerId);
      if (dx > 120) return finishSwipe('right');
      if (dx < -120) return finishSwipe('left');
      resetCard();
    };

    card.addEventListener('pointerdown', (event) => {
      if (card.dataset.busy === '1') return;
      pointerId = event.pointerId;
      startX = event.clientX;
      dx = 0;
      card.classList.add('dragging');
      card.setPointerCapture(pointerId);
    });

    card.addEventListener('pointermove', (event) => {
      if (!card.classList.contains('dragging')) return;
      dx = event.clientX - startX;
      const rotate = dx / 18;
      card.style.transform = `translateX(${dx}px) rotate(${rotate}deg)`;
    });

    card.addEventListener('pointerup', release);
    card.addEventListener('pointercancel', release);

    if (closeBtn) closeBtn.addEventListener('click', closePendingDeck);
    if (skipBtn) skipBtn.addEventListener('click', () => finishSwipe('left'));
    if (acceptBtn) acceptBtn.addEventListener('click', () => finishSwipe('right'));
  }

  function openPendingDeck(preferredId){
    const overlay = document.createElement('div');
    overlay.className = 'pending-deck-overlay';
    overlay.style.cssText = 'position:absolute;inset:0;z-index:76;background:var(--bg)';
    shellInner.appendChild(overlay);
    mountPendingDeck(overlay, preferredId);
  }

  // ============================================================
  // INVITATION JOUEUSE
  // ============================================================
  const NO_MORPH = ['Non','Tu es sûr·e ?','Vraiment ?','Réfléchis bien…',"Allez, dis oui",'Dernière chance','Non ? 🥺','…s\'il te plaît ?'];
  const SWEET_LINES = ['Mon amour,','Coucou toi,','Pour la plus jolie,','Hey, c\'est moi…','Petite question importante :','J\'ose te demander…'];
  const ASK_LINES = ['Tu viens avec moi ?','On se voit ce jour-là ?','Tu me dis oui ?','Ça te dit, nous deux ?','Tu acceptes ce rendez-vous ?'];
  const ALL_MODES = ['runaway','shrink','morph','multiply','fall','swap','convert'];

  function invDetailHTML(ev){
    return `
      <div class="inv-detail">
        <div class="row">${ICON.cal} ${fmtLong(ev.date)}</div>
        <div class="row">${ICON.clock} ${escapeHTML(ev.time)}</div>
        <div class="row">${ICON.pin} ${escapeHTML(ev.location)}</div>
        ${ev.note ? `<div class="row" style="align-items:flex-start"><span style="font-family:var(--font-hand);font-size:18px;color:var(--plum)">« ${escapeHTML(ev.note)} »</span></div>` : ''}
      </div>`;
  }

  function invitationHTML(ev){
    const sweet = SWEET_LINES[Math.floor(Math.random()*SWEET_LINES.length)];
    const ask = ASK_LINES[Math.floor(Math.random()*ASK_LINES.length)];
    return `
      <div class="inv-screen">
        <div class="confetti-layer"></div>
        <button class="inv-back" type="button" data-inv-back>${ICON.back}</button>

        <div class="inv-eyebrow">${ICON.spark} Une invitation pour toi</div>

        <div class="envelope">
          <div class="env-letter"></div>
          <div class="env-flap"></div>
          <div class="env-body"></div>
          <div class="env-seal">❤</div>
          <div class="env-tap">Touche pour ouvrir</div>
        </div>

        <div class="inv-reveal">
          <div class="inv-hand">${sweet}</div>
          <h1 class="inv-title">${escapeHTML(ev.title)}</h1>
          <div class="inv-hand" style="font-size:18px;margin-top:6px">${ask}</div>
          ${invDetailHTML(ev)}
          <div class="inv-cta">
            <button class="btn-yes" type="button">Oui, avec joie</button>
            <button class="btn-no" type="button">Non</button>
          </div>
          <p class="tiny" style="margin-top:18px" data-gag-hint></p>
        </div>

        <div class="inv-success">
          <div class="big-heart">❤</div>
          <h2>Rendez-vous pris !</h2>
          <p>Il est ajouté à votre calendrier. Préparez-vous à passer un beau moment.</p>
          <button class="btn btn-primary" type="button" data-inv-close>Revenir à l'accueil</button>
        </div>
      </div>`;
  }

  function confettiBurst(layer){
    const colors = ['#e8657f','#f08a6e','#f0c987','#ffd2dc','#c44862'];
    const shapes = ['heart','dot','rect'];
    for (let i=0; i<64; i++){
      const c = document.createElement('div');
      c.className = 'confetti';
      const color = colors[Math.floor(Math.random()*colors.length)];
      const shape = shapes[Math.floor(Math.random()*shapes.length)];
      const size = 7 + Math.random()*9;
      c.style.left = Math.random()*100 + '%';
      if (shape === 'heart'){
        c.style.width = c.style.height = size + 'px';
        c.style.background = color;
        c.style.borderRadius = '50% 50% 0 50%';
        c.style.transform = `rotate(45deg) scale(${size/9})`;
      } else if (shape === 'rect'){
        c.style.width = size + 'px'; c.style.height = (size*0.6) + 'px';
        c.style.background = color; c.style.borderRadius = '1px';
      } else {
        c.style.width = c.style.height = size*0.7 + 'px';
        c.style.background = color; c.style.borderRadius = '50%';
      }
      const dur = 1.6 + Math.random()*1.6;
      const delay = Math.random()*0.5;
      c.style.animation = `fall ${dur}s linear ${delay}s forwards`;
      layer.appendChild(c);
      setTimeout(() => c.remove(), (dur+delay)*1000 + 200);
    }
  }

  function mountInvitation(host, ev){
    host.innerHTML = invitationHTML(ev);
    const screen = host.querySelector('.inv-screen');
    const envelope = host.querySelector('.envelope');
    const layer = host.querySelector('.confetti-layer');
    const yes = host.querySelector('.btn-yes');
    const no = host.querySelector('.btn-no');
    const cta = host.querySelector('.inv-cta');
    const success = host.querySelector('.inv-success');
    const hint = host.querySelector('[data-gag-hint]');

    function open(){
      if (envelope.classList.contains('open')) return;
      envelope.classList.add('open');
      setTimeout(() => screen.classList.add('opened'), 480);
    }
    envelope.addEventListener('click', open);

    const mode = ALL_MODES[Math.floor(Math.random()*ALL_MODES.length)];
    let noClicks = 0, yesScale = 1;

    const hints = {
      runaway: "(essaie d'attraper le « Non »…)",
      shrink: "(le « Non » rapetisse à chaque essai)",
      morph: "(le « Non » a du mal à se décider)",
      multiply: "(chaque « Non » fait pousser un « Oui »…)",
      fall: "(le « Non » ne tient pas bien debout…)",
      swap: "(ils n'arrêtent pas de changer de place)",
      convert: "(insiste un peu sur le « Non »…)",
    };
    if (hint) hint.textContent = hints[mode] || '';

    async function triggerYes(){
      confettiBurst(layer);
      setTimeout(() => success.classList.add('show'), 260);
      const nextApprovalCount = Math.max(0, Math.min(2, (ev.approvalCount || 0) + 1));
      try {
        await updateEvent(ev.id, {
          status: nextApprovalCount >= 2 ? 'matched' : 'pending',
          approvalCount: nextApprovalCount,
        });
      } catch {}
      state.events = await loadEvents();
    }

    function moveNoAway(){
      const area = cta.getBoundingClientRect();
      const b = no.getBoundingClientRect();
      no.classList.add('runaway');
      const maxX = Math.max(20, area.width - b.width - 8);
      const padY = 46;
      const x = Math.random()*maxX;
      const y = (Math.random()*padY*2) - padY;
      no.style.left = x + 'px';
      no.style.top = (area.height/2 - b.height/2 + y) + 'px';
      no.style.transform = `rotate(${(Math.random()*24 - 12)}deg)`;
    }

    if (mode === 'runaway'){
      const dodge = (e) => { if (e) e.preventDefault(); moveNoAway(); };
      no.addEventListener('mouseenter', dodge);
      no.addEventListener('pointerdown', dodge);
      no.addEventListener('click', dodge);
    } else if (mode === 'shrink'){
      no.addEventListener('click', (e) => {
        e.preventDefault(); noClicks++;
        const s = Math.max(0, 1 - noClicks*0.22);
        yesScale = Math.min(1.4, 1 + noClicks*0.12);
        yes.style.transform = `scale(${yesScale})`;
        if (s <= 0.16){
          no.style.opacity = '0'; no.style.pointerEvents = 'none';
          if (hint) hint.textContent = "(il n'y a vraiment pas de « non » possible 💕)";
        } else {
          no.style.transform = `scale(${s})`;
          no.style.opacity = String(Math.max(0.3, s));
        }
      });
    } else if (mode === 'morph'){
      no.addEventListener('click', (e) => {
        e.preventDefault(); noClicks++;
        if (noClicks >= NO_MORPH.length){
          no.style.transform = `scale(${Math.max(0.4, 1 - (noClicks - NO_MORPH.length + 1)*0.2)})`;
          no.textContent = NO_MORPH[NO_MORPH.length - 1];
          if (noClicks > NO_MORPH.length + 1){
            no.style.opacity = '0'; no.style.pointerEvents = 'none';
            if (hint) hint.textContent = "(d'accord, on dit oui alors 💕)";
          }
        } else {
          no.textContent = NO_MORPH[noClicks];
        }
        yesScale = Math.min(1.35, 1 + noClicks*0.05);
        yes.style.transform = `scale(${yesScale})`;
      });
    } else if (mode === 'multiply'){
      const tempting = ['Oui !','Carrément','Évidemment','Oui oui','Allez, oui','Mille fois oui'];
      no.addEventListener('click', (e) => {
        e.preventDefault(); noClicks++;
        moveNoAway();
        no.style.transform += ` scale(${Math.max(0.4, 1 - noClicks*0.14)})`;
        const clone = document.createElement('button');
        clone.className = 'btn-yes';
        clone.type = 'button';
        clone.textContent = tempting[noClicks % tempting.length];
        clone.style.position = 'absolute';
        const area = cta.getBoundingClientRect();
        clone.style.left = Math.random()*Math.max(10, area.width - 130) + 'px';
        clone.style.top = (Math.random()*80 - 12) + 'px';
        clone.style.transform = `scale(${0.7 + Math.random()*0.35}) rotate(${Math.random()*16 - 8}deg)`;
        clone.style.zIndex = '3';
        clone.addEventListener('click', triggerYes);
        cta.appendChild(clone);
        if (noClicks >= 4){
          no.style.opacity = '0'; no.style.pointerEvents = 'none';
          if (hint) hint.textContent = "(des « oui » partout, plus aucun « non » 💕)";
        }
      });
    } else if (mode === 'fall'){
      no.style.transition = 'transform .85s cubic-bezier(.5,0,.9,.5), opacity .85s ease';
      no.addEventListener('click', (e) => {
        e.preventDefault();
        no.style.transform = 'translateY(440px) rotate(78deg)';
        no.style.opacity = '0'; no.style.pointerEvents = 'none';
        if (hint) hint.textContent = "(oups… le « non » est tombé 🙈)";
      });
    } else if (mode === 'swap'){
      let swapped = false, baseDx = 0;
      no.style.transition = 'transform .32s ease';
      yes.style.transition = 'transform .32s ease';
      const doSwap = (e) => {
        if (e) e.preventDefault();
        if (!baseDx) baseDx = yes.offsetLeft - no.offsetLeft;
        swapped = !swapped;
        no.style.transform = swapped ? `translateX(${baseDx}px)` : 'translateX(0)';
        yes.style.transform = swapped ? `translateX(${-baseDx}px) scale(1.06)` : 'translateX(0)';
      };
      no.addEventListener('mouseenter', doSwap);
      no.addEventListener('pointerdown', doSwap);
    } else if (mode === 'convert'){
      const steps = ['Bon… peut-être','Oh, et puis—','Allez, d\'accord'];
      let converted = false;
      no.addEventListener('click', (e) => {
        if (converted) return;
        e.preventDefault();
        if (noClicks < steps.length){
          no.textContent = steps[noClicks];
          noClicks++;
          yes.style.transform = `scale(${Math.min(1.25, 1 + noClicks*0.07)})`;
          if (noClicks >= steps.length){
            converted = true;
            no.textContent = 'Oui, finalement !';
            no.className = 'btn-yes';
            no.style.transform = 'scale(1.04)';
            no.addEventListener('click', triggerYes);
            if (hint) hint.textContent = "(le « non » a craqué 💕)";
          }
        }
      });
    }

    yes.addEventListener('click', triggerYes);

    const back = host.querySelector('[data-inv-back]');
    if (back) back.addEventListener('click', () => closeInvitation());

    const close = host.querySelector('[data-inv-close]');
    if (close) close.addEventListener('click', () => closeInvitation());
  }

  function closeInvitation(){
    const overlay = shellInner.querySelector('.inv-overlay');
    if (overlay) overlay.remove();
    state.screen = 'dash';
    render();
  }

  function openInvitationOverlay(id){
    const ev = id
      ? state.events.find(e => e.id === id)
      : state.events.find(e => e.status === 'pending');
    if (!ev){ toast('Aucune invitation en attente'); return; }
    const overlay = document.createElement('div');
    overlay.className = 'inv-overlay';
    overlay.style.cssText = 'position:absolute;inset:0;z-index:75;background:var(--bg)';
    shellInner.appendChild(overlay);
    mountInvitation(overlay, ev);
  }

  // Build a public URL that opens directly on this invitation.
  function invitationUrl(ev){
    const cfg = window.__rdvConfig || {};
    const base = cfg.basePath || '/rdv';
    return location.origin + base + '/?inv=' + encodeURIComponent(ev.id);
  }

  function invitationShareText(ev){
    const sweet = SWEET_LINES[Math.floor(Math.random() * SWEET_LINES.length)];
    const when = fmtLong(ev.date) + (ev.time ? ' à ' + ev.time : '');
    return `${sweet} j'ai une invitation pour toi ❤\n${ev.title} — ${when}\n📍 ${ev.location}`;
  }

  async function shareInvitation(id){
    const ev = state.events.find(e => e.id === id);
    if (!ev){ toast('Invitation introuvable'); return; }
    const url = invitationUrl(ev);
    const text = invitationShareText(ev);
    const title = `Invitation : ${ev.title}`;

    // Web Share API — mobile native sheet (WhatsApp, Insta DM, SMS, etc.)
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch (err) {
        // AbortError = user dismissed the sheet, nothing to do.
        if (err && err.name === 'AbortError') return;
        // Otherwise fall through to clipboard.
      }
    }

    // Desktop fallback : copy link.
    try {
      await navigator.clipboard.writeText(`${text}\n${url}`);
      toast('Lien copié — colle-le dans ta messagerie ❤');
    } catch {
      // Final fallback : prompt with the URL.
      window.prompt('Copie ce lien pour partager l’invitation :', url);
    }
  }

  // ============================================================
  // EVENTS / NAV
  // ============================================================
  shellInner.addEventListener('click', (e) => {
    const nav = e.target.closest('[data-nav]');
    if (nav){
      const t = nav.dataset.nav;
      if (t === 'new') return openSheet(null);
      if (t === 'inv') return openPendingDeck(null);
      state.screen = t; render(); return;
    }
    if (e.target.closest('[data-open-pending-deck]')) return openPendingDeck(null);
    const inv = e.target.closest('[data-open-inv]');
    if (inv) return openPendingDeck(inv.dataset.openInv);

    const share = e.target.closest('[data-share-inv]');
    if (share) return shareInvitation(share.dataset.shareInv);

    const val = e.target.closest('[data-validate]');
    if (val) return openValidate(val.dataset.validate);

    const ed = e.target.closest('[data-edit]');
    if (ed){
      const ev = state.events.find(x => x.id === ed.dataset.edit);
      if (ev) return openSheet(ev);
    }

    const del = e.target.closest('[data-delete]');
    if (del){
      if (!confirm('Supprimer ce rendez-vous ?')) return;
      const id = del.dataset.delete;
      (async () => {
        await deleteEvent(id);
        state.events = state.events.filter(x => x.id !== id);
        render();
        toast('Rendez-vous supprimé');
      })();
      return;
    }

    if (e.target.closest('[data-cal-prev]')){ state.calOffset--; render(); return; }
    if (e.target.closest('[data-cal-next]')){ state.calOffset++; render(); return; }
  });

  // ============================================================
  // COUNTDOWN
  // ============================================================
  function updateCountdowns(){
    document.querySelectorAll('[data-countdown]').forEach(el => {
      const target = new Date(el.getAttribute('data-countdown'));
      let diff = Math.max(0, target - new Date());
      const d = Math.floor(diff/86400000); diff -= d*86400000;
      const h = Math.floor(diff/3600000); diff -= h*3600000;
      const m = Math.floor(diff/60000);
      const set = (k,v) => { const t = el.querySelector(`[data-cd="${k}"]`); if (t) t.textContent = v; };
      set('d', d); set('h', h); set('m', m);
    });
  }
  setInterval(updateCountdowns, 20000);

  // ============================================================
  // BOOT
  // ============================================================
  async function start(){
    // health probe
    try { await api('/health'); state.apiOnline = true; showOffline(false); }
    catch { state.apiOnline = false; showOffline(true); }

    state.pendingOrder = loadPendingOrder();
    state.events = await loadEvents();
    render();

    // Deep link : ?inv=<id> opens the invitation overlay directly.
    // Used by shared links (Web Share API → WhatsApp/Insta/etc.).
    try {
      const params = new URLSearchParams(location.search);
      const invId = params.get('inv');
      if (invId && state.events.some(e => e.id === invId)) {
        openPendingDeck(invId);
        // Strip the query so a refresh doesn't re-open the modal.
        params.delete('inv');
        const qs = params.toString();
        history.replaceState(null, '', location.pathname + (qs ? '?' + qs : '') + location.hash);
      }
    } catch {}
  }

  start();
})();
