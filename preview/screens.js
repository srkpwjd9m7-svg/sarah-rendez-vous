/* ============================================================
   screens.js — rendus d'écrans (chaînes HTML)
   ============================================================ */

function statusbarHTML(){
  return `
    <div class="notch"></div>
    <div class="statusbar">
      <span>9:41</span>
      <span class="sb-right">
        <svg width="17" height="12" viewBox="0 0 17 12" fill="currentColor"><rect x="0" y="7" width="3" height="5" rx="1"/><rect x="4.5" y="5" width="3" height="7" rx="1"/><rect x="9" y="2.5" width="3" height="9.5" rx="1"/><rect x="13.5" y="0" width="3" height="12" rx="1"/></svg>
        <svg width="22" height="12" viewBox="0 0 24 12" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="1" y="1.5" width="19" height="9" rx="2.4"/><rect x="2.6" y="3" width="13" height="6" rx="1.2" fill="currentColor" stroke="none"/><rect x="21" y="4" width="2" height="4" rx="1" fill="currentColor" stroke="none"/></svg>
      </span>
    </div>`;
}

function starsHTML(rating, size){
  let s = '<span class="stars">';
  for (let i = 1; i <= 5; i++){
    s += `<span class="${i <= rating ? 'star-on' : 'star-off'}">${ICON.star}</span>`;
  }
  return s + '</span>';
}

function photoTiles(n){
  const cls = n === 2 ? 'mem-photos two' : 'mem-photos';
  let html = `<div class="${cls}">`;
  const tints = ['linear-gradient(135deg,#ffd9c9,#f7a98e)','linear-gradient(135deg,#ffd2dc,#e88aa0)','linear-gradient(135deg,#fde6b8,#e9c178)','linear-gradient(135deg,#ffe0d0,#f0b59a)'];
  for (let i = 0; i < n; i++){
    html += `<div class="ph" style="background:${tints[i % tints.length]}"><span class="ph-glyph">${ICON.cam}</span></div>`;
  }
  return html + '</div>';
}

function navbarHTML(active){
  const item = (id, icon, label) =>
    `<div class="nav-item ${active === id ? 'active' : ''}" data-nav="${id}">${icon}<span>${label}</span></div>`;
  return `
    <div class="navbar">
      <div class="navbar-inner">
        ${item('dash', ICON.home, 'Accueil')}
        ${item('cal', ICON.cal, 'Calendrier')}
        <div class="nav-fab" data-nav="new">${ICON.plus}</div>
        ${item('archive', ICON.archive, 'Souvenirs')}
        ${item('inv', ICON.gift, 'Invitation')}
      </div>
    </div>`;
}

/* ---- mini calendar ---- */
function miniCalHTML(year, month, events, opts = {}){
  const evMap = {};
  events.forEach(e => { evMap[e.date] = e.status; });
  const todayISO = iso(new Date());

  let head = `
    <div class="mc-head">
      <div class="mc-month">${MONTHS[month]} ${year}</div>
      <div class="mc-nav">
        <button data-cal-prev>${ICON.chevL}</button>
        <button data-cal-next>${ICON.chevR}</button>
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
    if (st === 'confirmed' || st === 'done' || st === 'toValidate') cls += ' ev';
    else if (st === 'pending') cls += ' ev pend';
    grid += `<div class="${cls}">${date.getDate()}</div>`;
  }
  grid += '</div>';

  return `<div class="card mini-cal">${head}${grid}</div>`;
}

/* ---- countdown ---- */
function countdownParts(dateStr, time){
  const target = new Date(dateStr + "T" + (time || "12:00") + ":00");
  let diff = Math.max(0, target - new Date());
  const d = Math.floor(diff / 86400000); diff -= d * 86400000;
  const h = Math.floor(diff / 3600000); diff -= h * 3600000;
  const m = Math.floor(diff / 60000);
  return { d, h, m };
}

/* ============================================================
   DASHBOARD
   ============================================================ */
function renderDashboard(state){
  const events = state.events;
  const next = events
    .filter(e => e.status === 'confirmed')
    .sort((a, b) => a.date.localeCompare(b.date))[0];
  const pendings = events.filter(e => e.status === 'pending');
  const now = new Date();

  let nextCard = '';
  if (next){
    const cp = countdownParts(next.date, next.time);
    nextCard = `
      <div class="next-card" data-countdown="${next.date}T${next.time || '12:00'}">
        <div class="nc-eyebrow">Notre prochain rendez-vous</div>
        <h2>${next.title}</h2>
        <div class="nc-meta">
          <span>${ICON.cal} ${fmtLong(next.date)}</span>
          <span>${ICON.pin} ${next.location}</span>
        </div>
        <div class="countdown">
          <div class="cd-cell"><b data-cd="d">${cp.d}</b><small>jours</small></div>
          <div class="cd-cell"><b data-cd="h">${cp.h}</b><small>heures</small></div>
          <div class="cd-cell"><b data-cd="m">${cp.m}</b><small>min</small></div>
        </div>
      </div>`;
  }

  let invSection = '';
  if (pendings.length){
    invSection = `
      <div class="app-sec">
        <h3>Invitations en attente</h3>
        <a data-nav="inv">Tout voir</a>
      </div>
      <div class="inv-strip">
        ${pendings.map(e => `
          <div class="inv-pill" data-open-inv="${e.id}">
            <div class="inv-seal">${ICON.heart}</div>
            <div class="ip-body">
              <div class="ip-t">${e.title}</div>
              <div class="ip-s">${fmtLong(e.date)} · à confirmer</div>
            </div>
            <div class="ip-go">Ouvrir →</div>
          </div>`).join('')}
      </div>`;
  }

  return `
    <div class="scr">
      <div class="topline">
        <div class="greet">
          <div class="hi">Bonjour vous deux ❤</div>
          <h1>Sarah &amp; Valentin</h1>
        </div>
        <div class="avatar-pair">
          <div class="avatar">S</div>
          <div class="avatar">V</div>
        </div>
      </div>

      ${nextCard}

      <div class="quick-row">
        <div class="quick" data-nav="new">
          <div class="qi">${ICON.plus}</div>
          <div><div class="qt">Nouveau RDV</div><div class="qs">Proposer une date</div></div>
        </div>
        <div class="quick" data-nav="archive">
          <div class="qi">${ICON.archive}</div>
          <div><div class="qt">Nos souvenirs</div><div class="qs">${events.filter(e=>e.status==='done').length} moments</div></div>
        </div>
      </div>

      ${invSection}

      <div class="app-sec"><h3>Ce mois-ci</h3><a data-nav="cal">Calendrier</a></div>
      ${miniCalHTML(now.getFullYear(), now.getMonth(), events)}
    </div>`;
}

/* ============================================================
   CALENDRIER / GESTION
   ============================================================ */
function renderCalendar(state){
  const events = state.events;
  const now = new Date();
  const upcoming = events
    .filter(e => ['confirmed', 'pending', 'toValidate'].includes(e.status))
    .sort((a, b) => a.date.localeCompare(b.date));

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
            <h4>${e.title}</h4>
            <div class="ev-loc">${ICON.pin} ${e.location}</div>
            <div class="ev-loc" style="margin-top:3px">${ICON.clock} ${e.time}</div>
          </div>
        </div>
        ${tag(e.status)}
      </div>
      ${e.note ? `<p class="ev-note">« ${e.note} »</p>` : ''}
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
        <button class="btn btn-primary btn-sm" data-nav="new">${ICON.plus} RDV</button>
      </div>

      ${miniCalHTML(now.getFullYear(), now.getMonth(), events)}

      <div class="app-sec"><h3>À venir</h3><span class="tiny">${upcoming.length} prévus</span></div>
      ${upcoming.length ? upcoming.map(card).join('') : '<div class="card" style="padding:24px;text-align:center;color:var(--muted)">Aucun rendez-vous à venir.</div>'}
    </div>`;
}

/* ============================================================
   ARCHIVE / SOUVENIRS
   ============================================================ */
function renderArchive(state){
  const done = state.events
    .filter(e => e.status === 'done')
    .sort((a, b) => b.date.localeCompare(a.date));

  const card = (e) => `
    <div class="ev-card is-completed">
      <div class="ev-top">
        <div style="display:flex;gap:12px;">
          <div class="ev-date-chip"><b>${fmtDay(e.date)}</b><small>${fmtMon(e.date)}</small></div>
          <div class="ev-main">
            <h4>${e.title}</h4>
            <div class="ev-loc">${ICON.pin} ${e.location}</div>
          </div>
        </div>
        ${starsHTML(e.rating)}
      </div>
      ${e.memory ? `<p class="ev-note">« ${e.memory} »</p>` : ''}
      ${e.photos ? photoTiles(e.photos) : ''}
    </div>`;

  const totalPhotos = done.reduce((a, e) => a + (e.photos || 0), 0);

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
      ${done.map(card).join('')}
    </div>`;
}

/* ============================================================
   FORM SHEET — Nouveau RDV
   ============================================================ */
function formSheetHTML(){
  return `
    <div class="sheet-scrim" id="sheet-scrim">
      <div class="sheet" id="sheet">
        <div class="sheet-grip"></div>
        <h2>Nouveau rendez-vous</h2>
        <p class="sub">Propose une date à ton amour.</p>

        <div class="field">
          <label>Titre</label>
          <input type="text" placeholder="Ex : Dîner au bord de l'eau" value="">
        </div>
        <div class="field" style="display:flex;gap:11px">
          <div style="flex:1.4"><label>Date</label><input type="text" placeholder="Sam. 14 juin"></div>
          <div style="flex:1"><label>Heure</label><input type="text" placeholder="20:00"></div>
        </div>
        <div class="field">
          <label>Lieu</label>
          <input type="text" placeholder="Cherche un endroit…" value="" id="loc-input">
          <div class="map-stub" style="margin-top:9px">
            <div class="grid-lines"></div>
            <div class="pin">${ICON.pin}</div>
          </div>
          <p class="tiny" style="margin:7px 2px 0">Touche la carte pour poser le lieu et remplir l'adresse.</p>
        </div>
        <div class="field">
          <label>Petit mot</label>
          <textarea placeholder="Un mot doux, une intention, une surprise…"></textarea>
        </div>
        <div class="field">
          <label>Photos d'intention</label>
          <div class="upload-row">
            <div class="upload-tile filled">${ICON.heart}</div>
            <div class="upload-tile">${ICON.cam}</div>
            <div class="upload-tile">${ICON.plus}</div>
          </div>
        </div>
        <div class="field">
          <label>Comment l'envoyer ?</label>
          <div class="seg" id="send-seg">
            <button class="on" data-seg="invite">${ICON.gift}&nbsp; Invitation surprise</button>
            <button data-seg="direct">Ajouter direct</button>
          </div>
        </div>

        <div style="display:flex;gap:10px;margin-top:6px">
          <button class="btn btn-ghost" id="sheet-cancel" style="flex:0 0 auto">Annuler</button>
          <button class="btn btn-primary btn-block" id="sheet-save">${ICON.heart} Envoyer l'invitation</button>
        </div>
      </div>
    </div>`;
}

/* ---- Validation sheet ---- */
function validateSheetHTML(ev){
  return `
    <div class="sheet-scrim" id="sheet-scrim">
      <div class="sheet" id="sheet">
        <div class="sheet-grip"></div>
        <h2>C'était comment ?</h2>
        <p class="sub">${ev.title} · ${fmtLong(ev.date)}</p>

        <div class="field">
          <label>Votre coup de cœur</label>
          <div class="rate-input" id="rate-input">
            ${[1,2,3,4,5].map(i => `<span data-rate="${i}">${ICON.star}</span>`).join('')}
          </div>
        </div>
        <div class="field">
          <label>Mot souvenir</label>
          <textarea placeholder="Ce qu'on a ressenti, un détail à garder…"></textarea>
        </div>
        <div class="field">
          <label>Photos souvenir <span style="color:var(--rose-deep)">· obligatoire</span></label>
          <div class="upload-row">
            <div class="upload-tile filled">${ICON.cam}</div>
            <div class="upload-tile">${ICON.plus}</div>
          </div>
        </div>
        <div style="display:flex;gap:10px;margin-top:6px">
          <button class="btn btn-ghost" id="sheet-cancel" style="flex:0 0 auto">Plus tard</button>
          <button class="btn btn-primary btn-block" id="validate-save" data-ev="${ev.id}">${ICON.check} Ranger ce souvenir</button>
        </div>
      </div>
    </div>`;
}
