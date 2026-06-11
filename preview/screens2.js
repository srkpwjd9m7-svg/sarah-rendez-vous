/* ============================================================
   screens2.js — variations de Dashboard (B, C)
   Retournent uniquement le bloc .scr (la navbar est ajoutée par le shell)
   ============================================================ */

/* ---- Variation B : "Pellicule" — orientée photo, défilement horizontal ---- */
function renderDashboardB(state){
  const events = state.events;
  const next = events.filter(e => e.status === 'confirmed').sort((a, b) => a.date.localeCompare(b.date))[0];
  const upcoming = events.filter(e => ['confirmed', 'toValidate'].includes(e.status)).sort((a, b) => a.date.localeCompare(b.date));
  const pendings = events.filter(e => e.status === 'pending');
  const cp = next ? countdownParts(next.date, next.time) : { d: 0 };

  return `
    <div class="scr">
      <div class="topline">
        <div class="greet"><div class="hi">Notre histoire continue</div><h1>Bonjour</h1></div>
        <div class="avatar-pair"><div class="avatar">S</div><div class="avatar">V</div></div>
      </div>

      <div style="position:relative;border-radius:var(--r-lg);overflow:hidden;box-shadow:var(--shadow-card);height:280px">
        <div style="position:absolute;inset:0;background:linear-gradient(135deg,#f6997f,#e8657f 55%,#c44862)"></div>
        <div style="position:absolute;inset:0;background:
          radial-gradient(120% 80% at 80% 10%, rgba(255,255,255,0.28), transparent 50%),
          repeating-linear-gradient(0deg, rgba(0,0,0,0.05) 0 2px, transparent 2px 5px)"></div>
        <span class="ph-glyph" style="position:absolute;top:18px;left:18px;color:rgba(255,255,255,0.7)">${ICON.cam}</span>
        <div style="position:absolute;left:0;right:0;bottom:0;padding:22px 20px;color:#fff;
          background:linear-gradient(0deg, rgba(70,25,40,0.6), transparent)">
          <div style="font-size:11px;font-weight:800;letter-spacing:0.16em;text-transform:uppercase;opacity:0.9">Dans ${cp.d} jours</div>
          <div style="font-family:var(--font-display);font-size:30px;line-height:1.04;margin-top:4px">${next ? next.title : 'Aucun RDV'}</div>
          <div style="font-size:13px;opacity:0.95;margin-top:6px;display:flex;align-items:center;gap:6px">${ICON.pin} ${next ? next.location : ''}</div>
        </div>
      </div>

      <div class="app-sec"><h3>Bientôt</h3><a data-nav="cal">Calendrier</a></div>
      <div style="display:flex;gap:13px;overflow-x:auto;padding:2px 2px 8px;margin:0 -2px;scrollbar-width:none">
        ${upcoming.map(e => `
          <div class="card" style="flex:0 0 160px;padding:0;overflow:hidden">
            <div style="height:96px;background:linear-gradient(135deg,#ffd9c9,#f3a98e);display:grid;place-items:center;color:rgba(196,72,98,0.55)">${ICON.heart}</div>
            <div style="padding:12px 13px">
              <div style="font-family:var(--font-display);font-size:15px;color:var(--ink);line-height:1.1">${e.title}</div>
              <div class="tiny" style="margin-top:5px;font-weight:700">${fmtLong(e.date)}</div>
            </div>
          </div>`).join('')}
      </div>

      ${pendings.length ? `
        <div class="app-sec"><h3>Invitations</h3><a data-nav="inv">Voir</a></div>
        <div class="inv-strip">
          ${pendings.map(e => `
            <div class="inv-pill" data-open-inv="${e.id}">
              <div class="inv-seal">${ICON.gift}</div>
              <div class="ip-body"><div class="ip-t">${e.title}</div><div class="ip-s">${fmtLong(e.date)}</div></div>
              <div class="ip-go">→</div>
            </div>`).join('')}
        </div>` : ''}
    </div>`;
}

/* ---- Variation C : "Tendre minimal" — éditorial, calendrier en vedette ---- */
function renderDashboardC(state){
  const events = state.events;
  const now = new Date();
  const next = events.filter(e => e.status === 'confirmed').sort((a, b) => a.date.localeCompare(b.date))[0];
  const cp = next ? countdownParts(next.date, next.time) : null;
  const agenda = events.filter(e => ['confirmed', 'pending', 'toValidate'].includes(e.status)).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 4);

  const dot = (st) => st === 'pending'
    ? '<span style="width:8px;height:8px;border-radius:50%;background:var(--blush-deep);box-shadow:inset 0 0 0 1.5px var(--rose)"></span>'
    : '<span style="width:8px;height:8px;border-radius:50%;background:var(--grad-rose)"></span>';

  return `
    <div class="scr">
      <div style="margin:14px 2px 22px">
        <div class="eyebrow">Mardi 11 juin</div>
        <h1 style="font-family:var(--font-display);font-size:32px;color:var(--ink);margin:8px 0 0;line-height:1.06">
          Bonjour Sarah,<br>il vous reste<br>
          <span style="color:var(--rose-deep)">${cp ? cp.d + ' jours' : 'à planifier'}</span> à attendre.
        </h1>
        ${next ? `<p style="color:var(--ink-soft);font-size:14px;margin:12px 0 0">avant <b style="color:var(--ink)">${next.title}</b> · ${next.location}</p>` : ''}
      </div>

      ${miniCalHTML(now.getFullYear(), now.getMonth(), events)}

      <div class="app-sec"><h3>Votre agenda</h3><a data-nav="new">+ Ajouter</a></div>
      <div class="card" style="padding:6px 4px">
        ${agenda.map((e, i) => `
          <div data-ev="${e.id}" style="display:flex;align-items:center;gap:13px;padding:13px 14px;${i < agenda.length - 1 ? 'border-bottom:1px solid var(--line-soft)' : ''}">
            ${dot(e.status)}
            <div style="flex:1;min-width:0">
              <div style="font-weight:800;font-size:14px;color:var(--ink)">${e.title}</div>
              <div class="tiny" style="margin-top:1px">${fmtLong(e.date)} · ${e.time}</div>
            </div>
            <div class="tiny" style="font-weight:800;text-transform:uppercase;color:${e.status === 'pending' ? 'var(--rose-deep)' : e.status === 'toValidate' ? '#946e2d' : 'var(--muted)'}">
              ${e.status === 'pending' ? 'attente' : e.status === 'toValidate' ? 'à valider' : 'ok'}
            </div>
          </div>`).join('')}
      </div>

      <button class="btn btn-primary btn-block" data-nav="new" style="margin-top:18px">${ICON.plus} Proposer un rendez-vous</button>
    </div>`;
}
