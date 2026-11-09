// Notizbuch: Akte, Hinweise, Personen, Kombinieren – dazu Beweisauswahl, Tagebuchseiten und Abschlussbericht
import { portraitSVG } from './portraits.js';
import { fmt } from './ui.js';

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const clock = (min) => `${Math.floor(min / 60) % 24}:${String(Math.floor(min) % 60).padStart(2, '0')} Uhr`;
const KIND = { spur: 'Spur', aussage: 'Aussage', dokument: 'Dokument' };
const KIND_PL = { spur: 'Spuren', aussage: 'Aussagen', dokument: 'Dokumente' };
const ICON = {
  spur: '<svg viewBox="0 0 24 24"><circle cx="10" cy="10" r="6.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M15 15l6 6" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg>',
  aussage: '<svg viewBox="0 0 24 24"><path d="M4 5h16v10H10l-5 4v-4H4z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
  dokument: '<svg viewBox="0 0 24 24"><path d="M6 3h9l4 4v14H6z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M9 11h7M9 15h7M9 7h4" stroke="currentColor" stroke-width="1.6"/></svg>',
};

function el(tag, cls, html) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html != null) e.innerHTML = html;
  return e;
}

export class Notebook {
  constructor(g) {
    this.g = g;
    this.tab = 'fall';
    this.isOpen = false;
  }

  get C() { return this.g.C; }

  open(tab = null) {
    const g = this.g;
    if (tab) this.tab = tab;
    else if (this.C.deductions.some((d) => !g.solved(d.id) && g.dedAvailable(d))) this.tab = 'kombinieren';
    else if (Object.keys(g.state.fresh).length) this.tab = 'hinweise';
    this.root = el('div', 'nb');
    this.root.innerHTML = `
      <div class="nb-head">
        <div class="nb-tabs" role="tablist">
          <button data-tab="fall">Akte</button>
          <button data-tab="hinweise">Hinweise<i></i></button>
          <button data-tab="personen">Personen</button>
          <button data-tab="kombinieren">Kombinieren<i></i></button>
        </div>
        <button class="nb-close" aria-label="Notizbuch schließen">✕</button>
      </div>
      <div class="nb-body"></div>`;
    this.body = this.root.querySelector('.nb-body');
    this.root.querySelectorAll('.nb-tabs button').forEach((b) => b.addEventListener('click', () => { g.sfx('page'); this.show(b.dataset.tab); }));
    this.root.querySelector('.nb-close').addEventListener('click', () => this.close());
    g.ui.openPanel(this.root);
    this.isOpen = true;
    g.sfx('page');
    this.show(this.tab);
  }

  close() {
    if (!this.isOpen) return;
    this.isOpen = false;
    this.g.state.fresh = {};
    this.g.ui.closePanel();
    this.g.updateBadge();
    this.g.refreshObjective();
    this.g.save();
  }

  toggle() { if (this.isOpen) this.close(); else this.open(); }

  badges() {
    const g = this.g;
    const fresh = Object.keys(g.state.fresh).length;
    const ded = this.C.deductions.filter((d) => !g.solved(d.id) && g.dedAvailable(d)).length;
    const [, hi, , ki] = this.root.querySelectorAll('.nb-tabs button');
    hi.querySelector('i').textContent = fresh ? String(fresh) : '';
    ki.querySelector('i').textContent = ded ? '!' : '';
  }

  show(tab) {
    this.tab = tab;
    this.root.querySelectorAll('.nb-tabs button').forEach((b) => b.classList.toggle('on', b.dataset.tab === tab));
    this.body.scrollTop = 0;
    this.body.innerHTML = '';
    this.badges();
    if (tab === 'fall') this.renderCase();
    if (tab === 'hinweise') this.renderClues();
    if (tab === 'personen') this.renderPersons();
    if (tab === 'kombinieren') this.renderDeductions();
  }

  renderCase() {
    const g = this.g, C = this.C;
    const qs = C.questions.map((q) => {
      const done = q.done(g);
      return `<li class="${done ? 'done' : ''}"><span class="chk">${done ? '✓' : ''}</span>${esc(q.text)}</li>`;
    }).join('');
    const found = Object.keys(g.state.clues).length;
    this.body.innerHTML = `
      <div class="nb-case">
        <div class="nb-kicker">Fall Nr. 1 · Berlin, Dienstag, den 15. November 1892</div>
        <h2>${esc(C.title)}</h2>
        <p class="nb-lead">${fmt(C.summary(g))}</p>
        <div class="nb-goal"><small>Nächster Schritt</small><b>${esc(C.objective(g))}</b></div>
        <h3>Offene Fragen</h3>
        <ul class="nb-questions">${qs}</ul>
        <p class="nb-meta">${found} Hinweise gesammelt · Uhrzeit: ${clock(g.state.minutes)}</p>
      </div>`;
  }

  clueCard(id, opts = {}) {
    const c = this.C.clues[id];
    const fresh = this.g.state.fresh[id];
    const card = el(opts.button ? 'button' : 'div', 'clue ' + c.kind + (fresh ? ' fresh' : ''));
    card.innerHTML = `<span class="ic">${ICON[c.kind] || ''}</span>
      <span class="ct"><small>${KIND[c.kind] || ''}${c.from ? ' · ' + esc(c.from) : ''}${opts.time !== false && this.g.state.clues[id] ? ' · ' + clock(this.g.state.clues[id]) : ''}</small>
      <b>${esc(c.title)}</b>${opts.short ? '' : `<span class="tx">${fmt(c.text)}</span>`}</span>`;
    return card;
  }

  renderClues() {
    const g = this.g;
    const ids = Object.keys(g.state.clues).sort((a, b) => g.state.clues[b] - g.state.clues[a]);
    if (!ids.length) { this.body.innerHTML = '<p class="nb-empty">Noch keine Hinweise. Untersuche die Umgebung und befrage die Leute.</p>'; return; }
    for (const kind of ['spur', 'dokument', 'aussage']) {
      const list = ids.filter((id) => this.C.clues[id].kind === kind);
      if (!list.length) continue;
      this.body.appendChild(el('h3', 'nb-h', KIND_PL[kind]));
      for (const id of list) this.body.appendChild(this.clueCard(id));
    }
  }

  renderPersons() {
    const g = this.g;
    for (const p of this.C.persons) {
      if (p.known && !p.known(g)) continue;
      const sp = this.C.speakers[p.id];
      const card = el('div', 'person');
      const notes = (p.notes || []).filter((n) => n.when(g)).map((n) => `<li>${fmt(n.text)}</li>`).join('');
      card.innerHTML = `<div class="pp">${portraitSVG((sp && sp.portrait) || p.portrait || {})}</div>
        <div class="pt"><b>${esc(p.name)}</b><small>${esc(p.role)}</small><p>${fmt(p.text)}</p>${notes ? `<ul>${notes}</ul>` : ''}</div>`;
      this.body.appendChild(card);
    }
  }

  renderDeductions() {
    const g = this.g, C = this.C;
    const intro = el('p', 'nb-hint', 'Hast du alle nötigen Hinweise beisammen, kannst du hier Schlüsse ziehen. Falsche Schlüsse kosten Ansehen – aber keinen Fall.');
    this.body.appendChild(intro);
    for (const d of C.deductions) {
      const solved = g.solved(d.id);
      const avail = !solved && g.dedAvailable(d);
      const blockedBy = (d.needsDed || []).filter((x) => !g.solved(x));
      const card = el('div', 'ded' + (solved ? ' solved' : avail ? ' avail' : ' locked'));
      let inner = `<div class="dh"><span class="chk">${solved ? '✓' : avail ? '!' : ''}</span><b>${esc(d.title)}</b></div><p class="dq">${esc(d.question)}</p>`;
      if (solved) inner += `<p class="dr">${fmt(d.result)}</p>`;
      else {
        const have = d.needs.filter((c) => g.has(c));
        const chips = d.needs.map((c) => (g.has(c) ? `<span class="chip ok">${esc(C.clues[c].title)}</span>` : '<span class="chip">? ? ?</span>')).join('');
        inner += `<div class="chips">${chips}</div>`;
        if (blockedBy.length) inner += `<p class="dl">Zuerst klären: ${blockedBy.map((x) => esc(C.deductions.find((y) => y.id === x).title)).join(', ')}</p>`;
        else if (!avail) inner += `<p class="dl">${have.length} von ${d.needs.length} Hinweisen gefunden.</p>`;
      }
      card.innerHTML = inner;
      if (avail) {
        const b = el('button', 'btn gold', 'Kombinieren');
        b.addEventListener('click', () => { g.sfx('page'); this.renderDeduction(d); });
        card.appendChild(b);
      }
      this.body.appendChild(card);
    }
    const acc = el('div', 'ded final' + (g.flag('geloest') ? ' solved' : C.canAccuse(g) ? ' avail' : ' locked'));
    acc.innerHTML = `<div class="dh"><span class="chk">${g.flag('geloest') ? '✓' : C.canAccuse(g) ? '!' : ''}</span><b>Den Täter überführen</b></div>
      <p class="dq">${C.canAccuse(g) ? 'Du weißt genug. Sprich mit Kommissar Wenzel in der Werkstatt.' : 'Erst wenn alle Fragen geklärt sind und ein letzter Beweis gefunden ist, kannst du Anklage erheben.'}</p>`;
    this.body.appendChild(acc);
  }

  renderDeduction(d) {
    const g = this.g, C = this.C;
    this.body.innerHTML = '';
    this.body.scrollTop = 0;
    const back = el('button', 'btn small back', '← Zurück');
    back.addEventListener('click', () => this.show('kombinieren'));
    this.body.appendChild(back);
    const head = el('div', 'dview');
    head.innerHTML = `<div class="nb-kicker">Kombinieren</div><h2>${esc(d.title)}</h2><p class="dq big">${esc(d.question)}</p>`;
    this.body.appendChild(head);
    const clues = el('div', 'dclues');
    for (const c of d.needs) clues.appendChild(this.clueCard(c, { time: false }));
    this.body.appendChild(clues);
    const opts = el('div', 'dopts');
    const fb = el('div', 'dfeedback');
    d.options.forEach((o, i) => {
      const b = el('button', 'opt', `<span class="num">${String.fromCharCode(65 + i)}</span>${esc(o.t)}`);
      b.addEventListener('click', () => {
        if (o.ok) {
          g.solveDeduction(d.id);
          opts.querySelectorAll('button').forEach((x) => { x.disabled = true; });
          b.classList.add('right');
          fb.className = 'dfeedback right';
          fb.innerHTML = `<div class="pp">${portraitSVG(C.speakers.holmes.portrait)}</div><div><b>Schlussfolgerung</b><p>${fmt(d.result)}</p></div>`;
          const next = el('button', 'btn gold', 'Weiter');
          next.addEventListener('click', () => this.show('kombinieren'));
          fb.appendChild(next);
          g.ui.toast(`<small>Kombination gelungen</small><b>${esc(d.title)}</b>`, 'ded');
        } else {
          g.state.wrongDed++;
          g.sfx('fail');
          b.disabled = true;
          b.classList.add('wrong');
          fb.className = 'dfeedback wrong';
          fb.innerHTML = `<div class="pp">${portraitSVG(C.speakers.holmes.portrait)}</div><div><b>Nein …</b><p>${fmt(o.wrong || 'Das passt nicht zu den Tatsachen.')}</p></div>`;
        }
        fb.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      });
      opts.appendChild(b);
    });
    this.body.appendChild(opts);
    this.body.appendChild(fb);
  }

  // ---------- Beweisauswahl (Finale) ----------
  pick(prompt, o = {}) {
    const g = this.g, C = this.C;
    return new Promise((resolve) => {
      const root = el('div', 'pick');
      const pipes = o.pipes != null ? `<div class="pipes" title="Glaubwürdigkeit">${'<span class="pipe on"></span>'.repeat(o.pipes)}${'<span class="pipe"></span>'.repeat(Math.max(0, (o.maxPipes || 3) - o.pipes))}</div>` : '';
      root.innerHTML = `<div class="pick-head"><div><small>Beweis vorlegen</small><b>${fmt(prompt)}</b></div>${pipes}</div><div class="pick-tabs"></div><div class="pick-list"></div>`;
      const list = root.querySelector('.pick-list');
      const tabs = root.querySelector('.pick-tabs');
      const ids = Object.keys(g.state.clues);
      const kinds = ['alle', 'spur', 'dokument', 'aussage'];
      const render = (k) => {
        list.innerHTML = '';
        tabs.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.k === k));
        for (const id of ids) {
          if (k !== 'alle' && C.clues[id].kind !== k) continue;
          const card = this.clueCard(id, { button: true, time: false });
          card.addEventListener('click', () => { g.sfx('paper'); g.ui.closeOverlay(); resolve(id); });
          list.appendChild(card);
        }
      };
      for (const k of kinds) {
        const b = el('button', '', k === 'alle' ? 'Alle' : KIND_PL[k]);
        b.dataset.k = k;
        b.addEventListener('click', () => render(k));
        tabs.appendChild(b);
      }
      if (o.cancel) {
        const c = el('button', 'btn small', o.cancel);
        c.addEventListener('click', () => { g.ui.closeOverlay(); resolve(null); });
        root.querySelector('.pick-head').appendChild(c);
      }
      g.ui.openOverlay(root);
      render('alle');
    });
  }

  // ---------- Tagebuchseite ----------
  journal({ kicker = '', title = '', text = '', button = 'Weiter', sign = '' }) {
    const g = this.g;
    return new Promise((resolve) => {
      const root = el('div', 'journal');
      const paras = text.split(/\n\s*\n/).map((p) => `<p>${fmt(p.trim())}</p>`).join('');
      root.innerHTML = `<div class="page"><div class="j-kicker">${esc(kicker)}</div>${title ? `<h2>${esc(title)}</h2>` : ''}<div class="j-text">${paras}</div>${sign ? `<div class="j-sign">${esc(sign)}</div>` : ''}<button class="btn gold">${esc(button)}</button></div>`;
      const btn = root.querySelector('button');
      const done = () => { g.sfx('page'); window.removeEventListener('keydown', key, true); g.ui.closeOverlay(); resolve(); };
      const key = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); done(); } };
      btn.addEventListener('click', done);
      window.addEventListener('keydown', key, true);
      g.ui.openOverlay(root);
      g.sfx('page');
      root.querySelector('.page').scrollTop = 0;
    });
  }

  // ---------- Abschluss ----------
  endScreen(s) {
    const g = this.g;
    return new Promise((resolve) => {
      const faults = s.wrongDed + s.wrongAccuse + s.wrongPresent;
      const score = faults + s.hints * 0.5;
      const rank = score <= 1 ? ['Meisterdetektiv', 'Selbst Mycroft hätte nichts auszusetzen.']
        : score <= 4 ? ['Scharfer Beobachter', 'Die Berliner Kriminalpolizei hätte Sie gern in ihren Reihen.']
          : score <= 8 ? ['Fähiger Ermittler', 'Der Fall ist gelöst – und das ist, was zählt.']
            : ['Hoffnungsvoller Amateur', 'Dr. Watson wäre trotzdem stolz auf Sie.'];
      const root = el('div', 'endscreen');
      root.innerHTML = `<div class="page">
        <div class="j-kicker">Fall Nr. 1 · abgeschlossen</div>
        <h2>${esc(this.C.title)}</h2>
        <div class="rank"><small>Ihr Rang</small><b>${rank[0]}</b><span>${rank[1]}</span></div>
        <table class="stats">
          <tr><td>Gefundene Hinweise</td><td>${s.clues} von ${s.cluesTotal}</td></tr>
          <tr><td>Fehlschlüsse beim Kombinieren</td><td>${s.wrongDed}</td></tr>
          <tr><td>Falsche Anklagen</td><td>${s.wrongAccuse}</td></tr>
          <tr><td>Falsch vorgelegte Beweise</td><td>${s.wrongPresent}</td></tr>
          <tr><td>Tipps von Paule</td><td>${s.hints}</td></tr>
          <tr><td>Spielzeit</td><td>${s.minutes} Minuten</td></tr>
        </table>
        <p class="tease">Sherlock Holmes kehrt zurück – im zweiten Berliner Fall.</p>
        <button class="btn gold">Zum Titelbild</button></div>`;
      root.querySelector('button').addEventListener('click', () => { g.sfx('click'); g.ui.closeOverlay(); resolve(); });
      g.ui.openOverlay(root);
    });
  }
}
