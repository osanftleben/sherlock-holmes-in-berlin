// Einstieg: Renderer, Ton, Oberfläche und Spiel verbinden – Titelbild, Menü, Einstellungen, Tastatur, Spielschleife
import { Renderer, QUALITY } from './engine/renderer.js';
import { AudioEngine } from './engine/audio.js';
import { UI } from './game/ui.js';
import { Game } from './game/game.js';
import caseDef from './cases/case1/case.js';

const $ = (id) => document.getElementById(id);
const SETTINGS_KEY = 'shib.settings';
const coarse = matchMedia('(pointer: coarse)').matches;

// ---------- Einstellungen ----------
const DEFAULTS = {
  quality: coarse ? 'mittel' : 'hoch',
  volume: 0.8,
  music: true,
  textSpeed: 'normal',
  markers: true,
};
function loadSettings() {
  try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}') }; } catch (_) { return { ...DEFAULTS }; }
}
function saveSettings(s) { try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); } catch (_) { /* privater Modus */ } }

function showError(title, text) {
  const e = $('error');
  e.innerHTML = `<div class="err-card"><h2>${title}</h2><p>${text}</p><button class="btn gold" onclick="location.reload()">Neu laden</button></div>`;
  e.classList.remove('hidden');
  const f = $('fade');
  f.classList.remove('loading');
}

function boot() {
  const canvas = $('gl');
  let R;
  try {
    R = new Renderer(canvas);
  } catch (e) {
    console.error(e);
    showError('WebGL 2 nicht verfügbar', 'Dieses Spiel braucht einen Browser mit WebGL 2 – etwa aktuelles Chrome, Edge, Firefox oder Safari (ab iOS 15). Bitte prüfe auch, ob die Hardwarebeschleunigung eingeschaltet ist.');
    return;
  }

  const settings = loadSettings();
  const audio = new AudioEngine();
  const ui = new UI();
  R.setQuality(settings.quality);
  audio.setVolume(settings.volume);
  audio.setMusic(settings.music);
  ui.textSpeed = settings.textSpeed;

  const titleEl = $('title');
  const menuEl = $('menu');
  let game;

  // ---------- Titelbild ----------
  function showTitleScreen() {
    closeMenu();
    game.showTitle();
    $('t-continue').classList.toggle('hidden', !Game.hasSave());
    titleEl.classList.remove('hidden');
    document.body.classList.add('at-title');
    if (audio.ctx) audio.startTheme();
    ui.fade(0, 900);
  }
  function hideTitle() {
    titleEl.classList.add('hidden');
    document.body.classList.remove('at-title');
    audio.stopTheme();
  }

  game = new Game({
    R, ui, audio, caseDef, canvas, settings,
    onQuit: () => { ui.fade(1, 600).then(showTitleScreen); },
  });

  // Erste Geste schaltet den Ton frei (Browser-Vorgabe)
  const unlock = () => {
    audio.init();
    if (game.mode === 'title') audio.startTheme();
    window.removeEventListener('pointerdown', unlock, true);
    window.removeEventListener('keydown', unlock, true);
  };
  window.addEventListener('pointerdown', unlock, true);
  window.addEventListener('keydown', unlock, true);

  $('t-new').addEventListener('click', async () => {
    audio.init();
    audio.sfx('click');
    if (Game.hasSave()) {
      const ok = await confirmBox('Neues Spiel beginnen?', 'Der bisherige Spielstand wird dabei überschrieben.', 'Neu beginnen', 'Abbrechen');
      if (!ok) return;
    }
    await ui.fade(1, 450);
    hideTitle();
    game.newGame();
  });
  $('t-continue').addEventListener('click', async () => {
    audio.init();
    audio.sfx('click');
    await ui.fade(1, 400);
    hideTitle();
    game.continueGame();
  });
  $('t-settings').addEventListener('click', () => { audio.init(); audio.sfx('click'); openSettings(); });
  $('t-about').addEventListener('click', () => { audio.init(); audio.sfx('click'); openAbout(); });

  // ---------- Kleine Dialogfenster ----------
  function modal(html, cls = '') {
    menuEl.innerHTML = `<div class="m-card ${cls}">${html}</div>`;
    menuEl.classList.remove('hidden');
    document.body.classList.add('menu-open');
    return menuEl.querySelector('.m-card');
  }
  function closeMenu() {
    menuEl.classList.add('hidden');
    menuEl.innerHTML = '';
    document.body.classList.remove('menu-open');
  }
  const menuOpen = () => !menuEl.classList.contains('hidden');

  function confirmBox(title, text, yes, no) {
    return new Promise((resolve) => {
      const c = modal(`<h2>${title}</h2><p>${text}</p><div class="m-row"><button class="btn gold yes">${yes}</button><button class="btn no">${no}</button></div>`, 'small');
      c.querySelector('.yes').addEventListener('click', () => { audio.sfx('click'); closeMenu(); resolve(true); });
      c.querySelector('.no').addEventListener('click', () => { audio.sfx('click'); closeMenu(); resolve(false); });
    });
  }

  // ---------- Spielmenü ----------
  function openMenu() {
    if (game.mode !== 'play') return;
    if (game.notebook.isOpen) game.notebook.close();
    audio.sfx('page');
    const c = modal(`
      <div class="m-kicker">${game.scene ? game.scene.name : ''} · ${game.timeLabel()}</div>
      <h2>Pause</h2>
      <div class="m-list">
        <button class="btn gold" data-a="resume">Weiterspielen</button>
        <button class="btn" data-a="book">Notizbuch</button>
        <button class="btn" data-a="help">Steuerung</button>
        <button class="btn" data-a="settings">Einstellungen</button>
        <button class="btn" data-a="title">Zum Titelbild</button>
      </div>
      <p class="m-note">Das Spiel speichert automatisch.</p>`);
    c.addEventListener('click', (e) => {
      const b = e.target.closest('button[data-a]');
      if (!b) return;
      audio.sfx('click');
      const a = b.dataset.a;
      if (a === 'resume') closeMenu();
      if (a === 'book') { closeMenu(); if (!game.busy) game.notebook.open(); }
      if (a === 'help') openHelp(openMenu);
      if (a === 'settings') openSettings(openMenu);
      if (a === 'title') { game.save(); closeMenu(); ui.fade(1, 500).then(showTitleScreen); }
    });
  }

  function openHelp(back) {
    const c = modal(`
      <h2>Steuerung</h2>
      <table class="keys">
        <tr><td>${coarse ? 'Tippen' : 'Klicken'} auf den Boden</td><td>Holmes geht dorthin</td></tr>
        <tr><td>${coarse ? 'Tippen' : 'Klicken'} auf Person / Ding</td><td>Ansprechen oder untersuchen</td></tr>
        <tr><td>${coarse ? 'Wischen' : 'Ziehen mit der Maus'}</td><td>Kamera drehen</td></tr>
        <tr><td>${coarse ? 'Zwei Finger' : 'Mausrad'}</td><td>Näher heran / weiter weg</td></tr>
        <tr><td>Lupe ${coarse ? '' : '<kbd>L</kbd>'}</td><td>Alles Wichtige hervorheben</td></tr>
        <tr><td>Paule ${coarse ? '' : '<kbd>H</kbd>'}</td><td>Einen Tipp erbitten</td></tr>
        <tr><td>Notizbuch ${coarse ? '' : '<kbd>N</kbd>'}</td><td>Hinweise, Personen, Kombinieren</td></tr>
        ${coarse ? '' : '<tr><td><kbd>Leertaste</kbd> / <kbd>Enter</kbd></td><td>Dialog weiter</td></tr><tr><td><kbd>1</kbd>–<kbd>9</kbd></td><td>Antwort wählen</td></tr><tr><td><kbd>Esc</kbd></td><td>Menü</td></tr>'}
      </table>
      <div class="m-row"><button class="btn gold back">Zurück</button></div>`);
    c.querySelector('.back').addEventListener('click', () => { audio.sfx('click'); if (back) back(); else closeMenu(); });
  }

  function openAbout() {
    const c = modal(`
      <div class="m-kicker">Über das Spiel</div>
      <h2>Sherlock Holmes in Berlin</h2>
      <p>Berlin im November 1892. Seit seinem angeblichen Tod an den Reichenbachfällen lebt Sherlock Holmes unter dem Namen <em>Sigerson</em> in einem möblierten Zimmer in der Rosenthaler Straße – über der Werkstatt des Uhrmachermeisters Tiedemann. Eines Morgens stehen alle Uhren still.</p>
      <p>Ein Detektivspiel zum Untersuchen, Befragen und Kombinieren. Gespielt wird mit Maus oder Finger. Die Grafik, die Klänge und die Musik entstehen vollständig im Browser.</p>
      <p class="m-note">Alle Personen und Ereignisse des Falls sind frei erfunden. Sherlock Holmes ist eine Figur von Sir Arthur Conan Doyle.</p>
      <div class="m-row"><button class="btn gold back">Schließen</button></div>`);
    c.querySelector('.back').addEventListener('click', () => { audio.sfx('click'); closeMenu(); });
  }

  function openSettings(back) {
    const opt = (name, val, label) => `<label class="seg"><input type="radio" name="${name}" value="${val}"${String(settings[name]) === String(val) ? ' checked' : ''}><span>${label}</span></label>`;
    const c = modal(`
      <h2>Einstellungen</h2>
      <div class="set">
        <div class="set-row"><span>Grafik</span><div class="segs">${Object.keys(QUALITY).map((q) => opt('quality', q, q[0].toUpperCase() + q.slice(1))).join('')}</div></div>
        <div class="set-row"><span>Lautstärke</span><input type="range" name="volume" min="0" max="1" step="0.05" value="${settings.volume}"></div>
        <div class="set-row"><span>Musik auf dem Titelbild</span><label class="tog"><input type="checkbox" name="music"${settings.music ? ' checked' : ''}><i></i></label></div>
        <div class="set-row"><span>Textgeschwindigkeit</span><div class="segs">${opt('textSpeed', 'langsam', 'Langsam')}${opt('textSpeed', 'normal', 'Normal')}${opt('textSpeed', 'schnell', 'Schnell')}${opt('textSpeed', 'sofort', 'Sofort')}</div></div>
        <div class="set-row"><span>Hinweis-Markierungen immer zeigen</span><label class="tog"><input type="checkbox" name="markers"${settings.markers ? ' checked' : ''}><i></i></label></div>
      </div>
      <div class="m-row"><button class="btn gold back">Fertig</button></div>`);
    c.addEventListener('input', (e) => {
      const t = e.target;
      if (!t.name) return;
      if (t.name === 'quality') { settings.quality = t.value; R.setQuality(t.value); }
      if (t.name === 'volume') { settings.volume = parseFloat(t.value); audio.setVolume(settings.volume); }
      if (t.name === 'music') { settings.music = t.checked; audio.setMusic(t.checked); }
      if (t.name === 'textSpeed') { settings.textSpeed = t.value; ui.textSpeed = t.value; }
      if (t.name === 'markers') settings.markers = t.checked;
      saveSettings(settings);
    });
    c.addEventListener('change', (e) => { if (e.target.name === 'volume') audio.sfx('click'); });
    c.querySelector('.back').addEventListener('click', () => { audio.sfx('click'); if (back) back(); else closeMenu(); });
  }

  // ---------- Werkzeugleiste ----------
  const canUseTools = () => game.mode === 'play' && !game.busy && !ui.dialogOpen && !menuOpen() && ui.overlay.classList.contains('hidden');
  $('btn-look').addEventListener('click', () => { audio.init(); if (game.mode === 'play') game.toggleLook(); });
  $('btn-hint').addEventListener('click', () => { audio.init(); if (canUseTools()) { if (game.notebook.isOpen) game.notebook.close(); game.askHint(); } });
  $('btn-book').addEventListener('click', () => { audio.init(); if (game.mode === 'play' && !game.busy && !menuOpen()) game.notebook.toggle(); });
  $('btn-menu').addEventListener('click', () => { audio.init(); if (menuOpen()) closeMenu(); else openMenu(); });

  // ---------- Tastatur ----------
  window.addEventListener('keydown', (e) => {
    if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName) && e.target.type !== 'radio' && e.target.type !== 'checkbox' && e.target.type !== 'range') return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const k = e.key;
    if (k === 'Escape') {
      e.preventDefault();
      if (menuOpen()) { if (game.mode === 'title') closeMenu(); else closeMenu(); return; }
      if (game.notebook.isOpen) { game.notebook.close(); return; }
      if (game.mode === 'play' && ui.overlay.classList.contains('hidden')) openMenu();
      return;
    }
    if (menuOpen() || game.mode !== 'play') return;
    if (ui.key(e)) { e.preventDefault(); return; }
    if (!ui.overlay.classList.contains('hidden')) return;
    const l = k.toLowerCase();
    if (l === 'l') { game.toggleLook(); e.preventDefault(); }
    else if (l === 'n' && !game.busy) { game.notebook.toggle(); e.preventDefault(); }
    else if (l === 'h' && canUseTools() && !game.notebook.isOpen) { game.askHint(); e.preventDefault(); }
  });

  // ---------- Größe, Sichtbarkeit ----------
  const setVH = () => document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
  setVH();
  window.addEventListener('resize', setVH);
  window.addEventListener('orientationchange', () => setTimeout(setVH, 250));
  window.addEventListener('pagehide', () => game.save());
  document.addEventListener('visibilitychange', () => { if (document.hidden) game.save(); });

  canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    game.save();
    showError('Grafik unterbrochen', 'Der Browser hat die 3D-Grafik zurückgesetzt. Der Spielstand ist gespeichert – bitte lade die Seite neu.');
  });

  // ---------- Spielschleife ----------
  let last = performance.now();
  let firstFrame = true;
  function frame(now) {
    const dt = Math.min(0.1, Math.max(0, (now - last) / 1000));
    last = now;
    const t = now / 1000;
    try {
      R.resize();
      game.update(dt, t);
      audio.update(dt);
      game.render(t);
    } catch (e) {
      console.error(e);
      showError('Ein Fehler ist aufgetreten', String(e && e.message ? e.message : e));
      return;
    }
    if (firstFrame) {
      firstFrame = false;
      $('fade').classList.remove('loading');
      showTitleScreen();
      // übrige Schauplätze im Hintergrund vorbereiten
      game.prebuild(Object.keys(caseDef.scenes));
    }
    requestAnimationFrame(frame);
  }

  // Titelszene bauen (kurz verzögert, damit der Ladebildschirm erst gezeichnet wird)
  setTimeout(() => {
    try {
      game.showTitle();
    } catch (e) {
      console.error(e);
      showError('Ein Fehler ist aufgetreten', String(e && e.message ? e.message : e));
      return;
    }
    requestAnimationFrame((n) => { last = n; frame(n); });
  }, 30);

  // Für Fehlersuche in der Konsole
  window.shib = { game, R, audio, ui };
}

window.addEventListener('error', (e) => console.error('Unbehandelter Fehler:', e.message));
window.addEventListener('unhandledrejection', (e) => console.error('Unbehandelte Zusage:', e.reason));
boot();
