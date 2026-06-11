/* ============================================================
   Nos Rendez-vous — app de production
   Design : prototype Claude Design (canvas → app full-screen)
   Backend : /rdv/api/* (Node + Express + better-sqlite3)
   Fallback : localStorage si API down
   ============================================================ */
(function () {
  'use strict';

  // ----- Config -----
  const API_BASE = '/rdv/api';
  const STORAGE_KEY = 'nos-rendez-vous-events';
  const ACCESS_CODE_KEY = 'nos-rendez-vous-access-code';
  const ACCESS_OK_KEY = 'nos-rendez-vous-access-ok';
  const NOMINATIM = 'https://nominatim.openstreetmap.org';

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
  function fmtLong(s){
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
  // status: 'pending' (invitation pas acceptée) | 'confirmed' | 'toValidate' (passé, pas validé) | 'done'
  function apiToState(e){
    const d = e.event_date;
    const t = e.event_time || '20:00';
    const eventDate = new Date(d + 'T' + t + ':00');
    const isFuture = eventDate >= new Date(Date.now() - 3*3600*1000); // tolerance 3h
    let status;
    if (e.completed) status = 'done';
    else if (!isFuture) status = 'toValidate';
    else if (e.accepted === false) status = 'pending';
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
      accepted: s.status === 'pending' ? 0 : 1,
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
  };

  // ============================================================
  // DATA OPS
  // ============================================================
  async function loadEvents(){
    if (state.apiOnline){
      try {
        const list = await api('/events');
        const mapped = list.map(apiToState);
        lsSave(mapped); // mirror to local for offline
        return mapped;
      } catch (e) {
        state.apiOnline = false;
        showOffline(true);
      }
    }
    return lsLoad();
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
        if ('rating' in patch) body.rating = patch.rating;
        if ('photos' in patch) body.completion_photos = patch.photos;
        if ('intentPhotos' in patch) body.photos = patch.intentPhotos;
        if ('status' in patch){
          if (patch.status === 'done'){ body.completed = true; }
          else if (patch.status === 'confirmed'){ body.completed = false; body.accepted = true; }
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
      .filter(e => e.status === 'confirmed')
      .sort((a,b) => (a.date+a.time).localeCompare(b.date+b.time))[0];
    const pendings = events.filter(e => e.status === 'pending');
    const toValidate = events.filter(e => e.status === 'toValidate');
    const doneCount = events.filter(e => e.status === 'done').length;
    const now = new Date();

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

    const invSection = pendings.length ? `
      <div class="app-sec">
        <h3>Invitations en attente</h3>
      </div>
      <div class="inv-strip">
        ${pendings.map(e => `
          <div class="inv-pill" data-open-inv="${e.id}">
            <div class="inv-seal">${ICON.heart}</div>
            <div class="ip-body">
              <div class="ip-t">${escapeHTML(e.title)}</div>
              <div class="ip-s">${fmtLong(e.date)} · à confirmer</div>
            </div>
            <div class="ip-go">Ouvrir →</div>
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
        ${miniCalHTML(now.getFullYear(), now.getMonth())}
      </div>`;
  }

  // ----- Calendrier -----
  function renderCalendar(){
    const events = state.events;
    const upcoming = events
      .filter(e => ['confirmed','pending','toValidate'].includes(e.status))
      .sort((a,b) => (a.date+a.time).localeCompare(b.date+b.time));

    const now = new Date();
    const targetMonth = now.getMonth() + state.calOffset;
    const calDate = new Date(now.getFullYear(), targetMonth, 1);

    const tag = (st) => {
      if (st === 'confirmed') return '<span class="ev-tag confirmed">Confirmé</span>';
      if (st === 'pending') return '<span class="ev-tag pending">En attente</span>';
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
            ? `<button class="btn btn-soft btn-sm" data-open-inv="${e.id}">${ICON.gift} Voir l'invitation</button>`
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
  // SHEET — Nouveau / Modifier RDV
  // ============================================================
  function formSheetHTML(initial){
    const i = initial || {};
    return `
      <div class="sheet-scrim" id="sheet-scrim">
        <div class="sheet">
          <div class="sheet-grip"></div>
          <h2>${i.id ? 'Modifier' : 'Nouveau'} rendez-vous</h2>
          <p class="sub">${i.id ? 'Ajuste comme tu veux.' : 'Propose une date à ton amour.'}</p>

          <div class="field">
            <label>Titre</label>
            <input type="text" id="f-title" placeholder="Ex : Dîner au bord de l'eau" value="${escapeHTML(i.title||'')}">
          </div>
          <div class="field" style="display:flex;gap:11px">
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
          <div class="field">
            <label>Comment l'envoyer ?</label>
            <div class="seg" id="send-seg">
              <button type="button" class="${(i.status==='pending'||!i.id)?'on':''}" data-seg="invite">${ICON.gift} Invitation surprise</button>
              <button type="button" class="${i.status==='confirmed'?'on':''}" data-seg="direct">Ajouter direct</button>
            </div>
          </div>

          <div style="display:flex;gap:10px;margin-top:6px">
            <button class="btn btn-ghost" id="sheet-cancel" type="button">Annuler</button>
            <button class="btn btn-primary btn-block" id="sheet-save" type="button">${ICON.heart} ${i.id?'Enregistrer':"Envoyer l'invitation"}</button>
          </div>
        </div>
      </div>`;
  }

  function openSheet(initial){
    const wrap = document.createElement('div');
    wrap.innerHTML = formSheetHTML(initial);
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

    // Segmented control
    let sendMode = (initial && initial.status === 'confirmed') ? 'direct' : 'invite';
    scrim.querySelectorAll('#send-seg button').forEach(b => {
      b.addEventListener('click', () => {
        scrim.querySelectorAll('#send-seg button').forEach(x => x.classList.remove('on'));
        b.classList.add('on');
        sendMode = b.dataset.seg;
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
        date: scrim.querySelector('#f-date').value,
        time: scrim.querySelector('#f-time').value || '20:00',
        location: scrim.querySelector('#f-location').value.trim() || 'À définir',
        note: scrim.querySelector('#f-note').value.trim(),
        coordinates: coords,
        mapLink: mapLink,
        status: sendMode === 'invite' ? 'pending' : 'confirmed',
      };
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
      setTimeout(() => toast(sendMode === 'invite' ? 'Invitation envoyée ❤' : 'Rendez-vous ajouté'), 260);
    });
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
      try { await updateEvent(ev.id, { status: 'confirmed' }); } catch {}
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

  // ============================================================
  // EVENTS / NAV
  // ============================================================
  shellInner.addEventListener('click', (e) => {
    const nav = e.target.closest('[data-nav]');
    if (nav){
      const t = nav.dataset.nav;
      if (t === 'new') return openSheet(null);
      if (t === 'inv') return openInvitationOverlay(null);
      state.screen = t; render(); return;
    }
    const inv = e.target.closest('[data-open-inv]');
    if (inv) return openInvitationOverlay(inv.dataset.openInv);

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

  // Logout
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn){
    logoutBtn.addEventListener('click', () => {
      try { sessionStorage.removeItem(ACCESS_OK_KEY); localStorage.removeItem(ACCESS_CODE_KEY); } catch {}
      window.location.reload();
    });
  }

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

    state.events = await loadEvents();
    render();
  }

  // Expose start so the lock screen can trigger it after auth
  window.__rdvStart = start;

  // If already logged in (session), boot now
  try {
    if (sessionStorage.getItem(ACCESS_OK_KEY) === 'ok' && getCode()){
      start();
    }
  } catch {}
})();
