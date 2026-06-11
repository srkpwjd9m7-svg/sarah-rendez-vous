/* ============================================================
   invitation.js — écran d'invitation joueuse (gags randomisés)
   mountInvitation(container, ev, opts)
     opts.mode : 'runaway' | 'shrink' | 'morph' | undefined (=> random)
     opts.autoOpen : bool (sauter l'enveloppe)
   ============================================================ */

const NO_MORPH = [
  "Non", "Tu es sûr·e ?", "Vraiment ?", "Réfléchis bien…",
  "Allez, dis oui", "Dernière chance", "Non ? 🥺", "…s'il te plaît ?"
];
const SWEET_LINES = [
  "Mon amour,", "Coucou toi,", "Pour la plus jolie,", "Hey, c'est moi…",
  "Petite question importante :", "J'ose te demander…"
];
const ASK_LINES = [
  "Tu viens avec moi ?", "On se voit ce jour-là ?", "Tu me dis oui ?",
  "Ça te dit, nous deux ?", "Tu acceptes ce rendez-vous ?"
];

function invDetailHTML(ev){
  return `
    <div class="inv-detail">
      <div class="row">${ICON.cal} ${fmtLong(ev.date)}</div>
      <div class="row">${ICON.clock} ${ev.time}</div>
      <div class="row">${ICON.pin} ${ev.location}</div>
    </div>`;
}

function invitationHTML(ev, opts = {}){
  const sweet = opts.sweet || SWEET_LINES[Math.floor(Math.random() * SWEET_LINES.length)];
  const ask = opts.ask || ASK_LINES[Math.floor(Math.random() * ASK_LINES.length)];
  return `
    <div class="inv-screen ${opts.autoOpen ? 'opened' : ''}">
      <div class="confetti-layer"></div>

      <div class="inv-eyebrow">${ICON.spark} Une invitation pour toi</div>

      <div class="envelope ${opts.autoOpen ? 'open' : ''}">
        <div class="env-letter"></div>
        <div class="env-flap"></div>
        <div class="env-body"></div>
        <div class="env-seal">${ev.sealGlyph || '❤'}</div>
        <div class="env-tap">Touche pour ouvrir</div>
      </div>

      <div class="inv-reveal">
        <div class="inv-hand">${sweet}</div>
        <h1 class="inv-title">${ev.title}</h1>
        <div class="inv-hand" style="font-size:18px;margin-top:6px">${ask}</div>
        ${invDetailHTML(ev)}
        <div class="inv-cta">
          <button class="btn-yes">Oui, avec joie</button>
          <button class="btn-no">Non</button>
        </div>
        <p class="tiny" style="margin-top:18px" data-gag-hint></p>
      </div>

      <div class="inv-success">
        <div class="big-heart">❤</div>
        <h2>Rendez-vous pris !</h2>
        <p>Il est ajouté à votre calendrier. Préparez-vous à passer un beau moment.</p>
        <button class="btn btn-primary" data-inv-close>Revenir à l'accueil</button>
      </div>
    </div>`;
}

function confettiBurst(layer, theme){
  const colors = theme === 'jp'
    ? ['#d8728c', '#c8463c', '#cbab6e', '#2e4a6b', '#e29bb0']
    : ['#e8657f', '#f08a6e', '#f0c987', '#ffd2dc', '#c44862'];
  const shapes = ['heart', 'dot', 'rect'];
  for (let i = 0; i < 64; i++){
    const c = document.createElement('div');
    c.className = 'confetti';
    const color = colors[Math.floor(Math.random() * colors.length)];
    const shape = shapes[Math.floor(Math.random() * shapes.length)];
    const size = 7 + Math.random() * 9;
    c.style.left = Math.random() * 100 + '%';
    if (shape === 'heart'){
      c.style.width = c.style.height = size + 'px';
      c.style.background = color;
      c.style.clipPath = "path('M5 9C-1 4 1 0 3.2 0 4.5 0 5 1 5 1S5.5 0 6.8 0C9 0 11 4 5 9Z')";
      c.style.transform = `scale(${size / 9})`;
    } else if (shape === 'rect'){
      c.style.width = size + 'px'; c.style.height = (size * 0.6) + 'px';
      c.style.background = color; c.style.borderRadius = '1px';
    } else {
      c.style.width = c.style.height = size * 0.7 + 'px';
      c.style.background = color; c.style.borderRadius = '50%';
    }
    const dur = 1.6 + Math.random() * 1.6;
    const delay = Math.random() * 0.5;
    c.style.animation = `fall ${dur}s linear ${delay}s forwards`;
    layer.appendChild(c);
    setTimeout(() => c.remove(), (dur + delay) * 1000 + 200);
  }
}

function mountInvitation(container, ev, opts = {}){
  container.innerHTML = invitationHTML(ev, opts);
  const theme = container.closest('.theme-jp') ? 'jp' : 'rose';
  const screen = container.querySelector('.inv-screen');
  const envelope = container.querySelector('.envelope');
  const layer = container.querySelector('.confetti-layer');
  const yes = container.querySelector('.btn-yes');
  const no = container.querySelector('.btn-no');
  const cta = container.querySelector('.inv-cta');
  const success = container.querySelector('.inv-success');
  const hint = container.querySelector('[data-gag-hint]');

  // open envelope
  function open(){
    if (envelope.classList.contains('open')) return;
    envelope.classList.add('open');
    setTimeout(() => screen.classList.add('opened'), 480);
  }
  if (!opts.autoOpen) envelope.addEventListener('click', open);

  // choose gag
  const mode = opts.mode || ['runaway', 'shrink', 'morph'][Math.floor(Math.random() * 3)];
  let noClicks = 0;
  let yesScale = 1;

  const hints = {
    runaway: "(essaie d'attraper le « Non »…)",
    shrink: "(le « Non » rapetisse à chaque essai)",
    morph: "(le « Non » a du mal à se décider)"
  };
  if (hint) hint.textContent = hints[mode] || '';

  function moveNoAway(){
    const area = cta.getBoundingClientRect();
    const b = no.getBoundingClientRect();
    no.classList.add('runaway');
    const maxX = Math.max(20, area.width - b.width - 8);
    const padY = 46;
    const x = Math.random() * maxX;
    const y = (Math.random() * padY * 2) - padY;
    no.style.left = x + 'px';
    no.style.top = (area.height / 2 - b.height / 2 + y) + 'px';
    no.style.transform = `rotate(${(Math.random() * 24 - 12)}deg)`;
  }

  if (mode === 'runaway'){
    const dodge = (e) => { if (e) e.preventDefault(); moveNoAway(); };
    no.addEventListener('mouseenter', dodge);
    no.addEventListener('pointerdown', dodge);
    no.addEventListener('click', dodge);
  } else if (mode === 'shrink'){
    no.addEventListener('click', (e) => {
      e.preventDefault();
      noClicks++;
      const s = Math.max(0, 1 - noClicks * 0.22);
      yesScale = Math.min(1.4, 1 + noClicks * 0.12);
      yes.style.transform = `scale(${yesScale})`;
      if (s <= 0.16){
        no.style.opacity = '0';
        no.style.pointerEvents = 'none';
        if (hint) hint.textContent = "(il n'y a vraiment pas de « non » possible 💕)";
      } else {
        no.style.transform = `scale(${s})`;
        no.style.opacity = String(Math.max(0.3, s));
      }
    });
  } else { // morph
    no.addEventListener('click', (e) => {
      e.preventDefault();
      noClicks++;
      if (noClicks >= NO_MORPH.length){
        no.style.transform = `scale(${Math.max(0.4, 1 - (noClicks - NO_MORPH.length + 1) * 0.2)})`;
        no.textContent = NO_MORPH[NO_MORPH.length - 1];
        if (noClicks > NO_MORPH.length + 1){
          no.style.opacity = '0'; no.style.pointerEvents = 'none';
          if (hint) hint.textContent = "(d'accord, on dit oui alors 💕)";
        }
      } else {
        no.textContent = NO_MORPH[noClicks];
      }
      yesScale = Math.min(1.35, 1 + noClicks * 0.05);
      yes.style.transform = `scale(${yesScale})`;
    });
  }

  // yes!
  yes.addEventListener('click', () => {
    confettiBurst(layer, theme);
    setTimeout(() => success.classList.add('show'), 260);
    if (opts.onYes) opts.onYes(ev);
  });

  // close success
  const closeBtn = container.querySelector('[data-inv-close]');
  if (closeBtn){
    closeBtn.addEventListener('click', () => {
      if (opts.onClose) opts.onClose(ev);
    });
  }

  return { mode };
}
