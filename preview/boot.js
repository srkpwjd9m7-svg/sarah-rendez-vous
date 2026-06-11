/* ============================================================
   boot.js — contrôleur interactif + assemblage du canvas
   ============================================================ */

function makePhone(themeClass){
  const phone = document.createElement('div');
  phone.className = 'phone' + (themeClass ? ' ' + themeClass : '');
  const screen = document.createElement('div');
  screen.className = 'phone-screen';
  screen.innerHTML = statusbarHTML();
  const app = document.createElement('div');
  app.className = 'app';
  screen.appendChild(app);
  phone.appendChild(screen);
  return { phone, screen, app };
}

function setNavbar(screen, active){
  const old = screen.querySelector('.navbar');
  if (old) old.remove();
  const tmp = document.createElement('div');
  tmp.innerHTML = navbarHTML(active);
  screen.appendChild(tmp.firstElementChild);
}

/* ---------- Interactive app ---------- */
function createInteractiveApp(themeClass){
  const { phone, screen, app } = makePhone(themeClass);
  const state = { events: JSON.parse(JSON.stringify(SEED_EVENTS)), screen: 'dash' };

  function toast(msg){
    const t = document.createElement('div');
    t.textContent = msg;
    t.style.cssText = 'position:absolute;left:50%;bottom:100px;transform:translateX(-50%) translateY(10px);background:var(--ink);color:#fff;padding:10px 18px;border-radius:999px;font-size:13px;font-weight:800;z-index:90;opacity:0;transition:all .3s;white-space:nowrap;box-shadow:var(--shadow-pop)';
    screen.appendChild(t);
    requestAnimationFrame(() => { t.style.opacity = '1'; t.style.transform = 'translateX(-50%) translateY(0)'; });
    setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 300); }, 1800);
  }

  function render(){
    let html = '';
    if (state.screen === 'cal') html = renderCalendar(state);
    else if (state.screen === 'archive') html = renderArchive(state);
    else html = renderDashboard(state);
    app.innerHTML = html;
    setNavbar(screen, state.screen);
    app.scrollTop = 0;
    updateCountdowns();
  }

  function openSheet(){
    const wrap = document.createElement('div');
    wrap.innerHTML = formSheetHTML();
    const scrim = wrap.firstElementChild;
    screen.appendChild(scrim);
    requestAnimationFrame(() => scrim.classList.add('open'));

    scrim.querySelectorAll('#send-seg button').forEach(b => {
      b.addEventListener('click', () => {
        scrim.querySelectorAll('#send-seg button').forEach(x => x.classList.remove('on'));
        b.classList.add('on');
        scrim.querySelector('#sheet-save').innerHTML =
          b.dataset.seg === 'invite' ? ICON.heart + " Envoyer l'invitation" : ICON.check + " Ajouter au calendrier";
      });
    });

    const close = () => { scrim.classList.remove('open'); setTimeout(() => scrim.remove(), 320); };
    scrim.querySelector('#sheet-cancel').addEventListener('click', close);
    scrim.addEventListener('click', e => { if (e.target === scrim) close(); });
    scrim.querySelector('#sheet-save').addEventListener('click', () => {
      const title = scrim.querySelector('input').value.trim() || 'Surprise en préparation';
      const note = scrim.querySelector('textarea').value.trim() || 'Un nouveau moment à deux.';
      const mode = scrim.querySelector('#send-seg button.on').dataset.seg;
      state.events.push({
        id: 'n' + Date.now(), title, note,
        date: iso(dayOffset(5 + Math.floor(Math.random() * 10))), time: '20:00',
        location: 'Lyon', status: mode === 'invite' ? 'pending' : 'confirmed'
      });
      close();
      state.screen = mode === 'invite' ? 'dash' : 'cal';
      setTimeout(render, 220);
      setTimeout(() => toast(mode === 'invite' ? "Invitation envoyée ❤" : "Rendez-vous ajouté"), 260);
    });
  }

  function openValidate(id){
    const ev = state.events.find(x => x.id === id);
    if (!ev) return;
    const wrap = document.createElement('div');
    wrap.innerHTML = validateSheetHTML(ev);
    const scrim = wrap.firstElementChild;
    screen.appendChild(scrim);
    requestAnimationFrame(() => scrim.classList.add('open'));

    let rating = 0;
    const stars = scrim.querySelectorAll('#rate-input span');
    stars.forEach(s => s.addEventListener('click', () => {
      rating = +s.dataset.rate;
      stars.forEach(x => x.classList.toggle('on', +x.dataset.rate <= rating));
    }));

    const close = () => { scrim.classList.remove('open'); setTimeout(() => scrim.remove(), 320); };
    scrim.querySelector('#sheet-cancel').addEventListener('click', close);
    scrim.querySelector('#validate-save').addEventListener('click', () => {
      ev.status = 'done'; ev.rating = rating || 5; ev.photos = 2;
      ev.memory = scrim.querySelector('textarea').value.trim() || 'Un joli moment de plus, gardé précieusement.';
      close(); state.screen = 'archive'; setTimeout(render, 220);
      setTimeout(() => toast('Souvenir rangé ✨'), 260);
    });
  }

  function openInvitationOverlay(id){
    const ev = state.events.find(x => x.id === id) || state.events.find(e => e.status === 'pending');
    if (!ev){ toast('Aucune invitation en attente'); return; }
    const host = document.createElement('div');
    host.style.cssText = 'position:absolute;inset:0;z-index:75;background:var(--bg)';
    screen.appendChild(host);
    mountInvitation(host, ev, {
      onYes: (e) => { e.status = 'confirmed'; },
      onClose: () => { host.remove(); state.screen = 'dash'; render(); setTimeout(() => toast('Rendez-vous confirmé ❤'), 200); }
    });
    const back = document.createElement('button');
    back.className = 'btn-icon';
    back.innerHTML = ICON.back;
    back.style.cssText = 'position:absolute;top:56px;left:16px;z-index:80;background:var(--surface);box-shadow:var(--shadow-soft)';
    back.addEventListener('click', () => host.remove());
    host.appendChild(back);
  }

  function handleNav(t){
    if (t === 'new') return openSheet();
    if (t === 'inv') return openInvitationOverlay(null);
    state.screen = t; render();
  }

  screen.addEventListener('click', e => {
    const nav = e.target.closest('[data-nav]'); if (nav) return handleNav(nav.dataset.nav);
    const inv = e.target.closest('[data-open-inv]'); if (inv) return openInvitationOverlay(inv.dataset.openInv);
    const val = e.target.closest('[data-validate]'); if (val) return openValidate(val.dataset.validate);
    const del = e.target.closest('[data-delete]');
    if (del){
      state.events = state.events.filter(x => x.id !== del.dataset.delete);
      render(); toast('Rendez-vous supprimé'); return;
    }
    const ed = e.target.closest('[data-edit]'); if (ed) return openSheet();
    // mini-cal month nav (decorative)
    if (e.target.closest('[data-cal-prev]') || e.target.closest('[data-cal-next]')) return;
  });

  render();
  return phone;
}

/* ---------- Static phone (variations) ---------- */
function createStaticPhone(themeClass, renderFn, active){
  const { phone, screen, app } = makePhone(themeClass);
  const state = { events: JSON.parse(JSON.stringify(SEED_EVENTS)) };
  app.innerHTML = renderFn(state);
  setNavbar(screen, active);
  updateCountdowns();
  return phone;
}

/* ---------- Invitation-only phone ---------- */
function createInvitationPhone(themeClass, opts){
  const { phone, screen, app } = makePhone(themeClass);
  app.style.padding = '0';
  app.style.paddingTop = '0';
  const host = document.createElement('div');
  host.style.cssText = 'position:absolute;inset:0;z-index:2';
  screen.appendChild(host);
  const ev = opts.ev;
  mountInvitation(host, ev, {
    mode: opts.mode, autoOpen: opts.autoOpen, sweet: opts.sweet, ask: opts.ask,
    onClose: () => { mountInvitation(host, ev, { mode: opts.mode, autoOpen: false }); }
  });
  return phone;
}

/* ---------- Countdown ticker ---------- */
function updateCountdowns(){
  document.querySelectorAll('[data-countdown]').forEach(el => {
    const target = new Date(el.getAttribute('data-countdown'));
    let diff = Math.max(0, target - new Date());
    const d = Math.floor(diff / 86400000); diff -= d * 86400000;
    const h = Math.floor(diff / 3600000); diff -= h * 3600000;
    const m = Math.floor(diff / 60000);
    const set = (k, v) => { const t = el.querySelector(`[data-cd="${k}"]`); if (t) t.textContent = v; };
    set('d', d); set('h', h); set('m', m);
  });
}
setInterval(updateCountdowns, 20000);

/* ============================================================
   Assemblage du canvas
   ============================================================ */
function frameBlock(title, desc, phoneEl, jp){
  const block = document.createElement('div');
  block.className = 'frame-block';
  const label = document.createElement('div');
  label.className = 'frame-label';
  label.innerHTML = `<span class="dot ${jp ? 'jp' : ''}"></span><div class="txt"><h4>${title}</h4><p>${desc}</p></div>`;
  block.appendChild(label);
  block.appendChild(phoneEl);
  return block;
}
function section(num, title, desc){
  const s = document.createElement('section');
  s.className = 'section';
  s.innerHTML = `
    <div class="section-head"><span class="section-num">${num}</span><h2 class="section-title">${title}</h2></div>
    <p class="section-desc">${desc}</p>
    <div class="frame-row"></div>`;
  return s;
}

function build(){
  const root = document.getElementById('root');

  // header + note
  const head = document.createElement('div');
  head.innerHTML = `
    <div class="canvas-head">
      <div class="canvas-kicker">Nos Rendez-vous · maquette mobile</div>
      <h1 class="canvas-title">Une app pour organiser vos<br>rendez-vous en couple.</h1>
      <p class="canvas-lede">Prototype cliquable mobile-first. Style romantique enrichi (rose · corail · doré),
      typographies tendres, et un écran d'invitation joueur dont les gags sont tirés au hasard à chaque ouverture.
      Le premier téléphone est entièrement navigable — touchez la barre du bas, ouvrez une invitation, validez un souvenir.</p>
    </div>
    <div class="note-card">
      <h3>Le système, en bref</h3>
      <ul>
        <li><b>Palette</b> — rose <b>#e8657f</b>, corail, doré <b>#f0c987</b>, blush crème ; ombres chaudes, coins arrondis 30px.</li>
        <li><b>Type</b> — DM Serif Display (titres &amp; dates), Nunito (interface), Caveat (mots manuscrits).</li>
        <li><b>4 écrans</b> — Accueil (compte à rebours + mini-calendrier + invitations), Calendrier (CRUD &amp; validation), Souvenirs (archive notée), Nouveau RDV (feuille glissante).</li>
        <li><b>Invitation joueuse</b> — enveloppe à ouvrir, puis « Non » qui <b>fuit</b>, <b>rétrécit</b> ou <b>change de texte</b> (aléatoire), confettis &amp; cœurs au « Oui ». D'autres gags à venir.</li>
      </ul>
    </div>`;
  root.appendChild(head);

  // 1. Prototype principal
  const s1 = section('1', 'Prototype principal', "Téléphone entièrement cliquable. Navigation par la barre du bas, bouton + pour proposer un RDV, ouverture des invitations en attente, et validation des rendez-vous passés.");
  s1.querySelector('.frame-row').appendChild(
    frameBlock('App complète — romantique', 'Accueil · Calendrier · Souvenirs · Nouveau RDV · Invitation', createInteractiveApp(''))
  );
  root.appendChild(s1);

  // 2. Invitation variations
  const s3 = section('2', 'Invitation joueuse — 3 gags', "L'écran que reçoit l'autre. Chaque version isole un gag ; dans l'app réelle ils sont tirés au sort. Cliquez « Oui » pour les confettis — et essayez le « Non »… (d'autres gags à venir)");
  const r3 = s3.querySelector('.frame-row');
  const invEv = { id: 'inv-demo', title: 'Pique-nique surprise', time: '12:30', location: 'Parc de la Tête d\'Or', date: iso(dayOffset(2)), sealGlyph: '❤' };
  r3.appendChild(frameBlock('1 · Le « Non » qui fuit', "Enveloppe à ouvrir, puis le Non esquive le doigt", createInvitationPhone('', { ev: invEv, mode: 'runaway', autoOpen: false })));
  r3.appendChild(frameBlock('2 · Oui grandit, Non rapetisse', 'À chaque essai le Oui gonfle', createInvitationPhone('', { ev: invEv, mode: 'shrink', autoOpen: true })));
  r3.appendChild(frameBlock('3 · Le « Non » hésitant', 'Le texte du Non change à chaque clic', createInvitationPhone('', { ev: invEv, mode: 'morph', autoOpen: true })));
  root.appendChild(s3);
}

build();
