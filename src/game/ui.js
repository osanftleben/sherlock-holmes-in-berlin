// DOM-Oberfläche: Dialogfenster, Auswahl, Hinweise, Markierungen, Überblendung, Ortsanzeige
import { portraitSVG } from './portraits.js';

const SPEEDS = { langsam: 22, normal: 48, schnell: 110, sofort: 100000 };

function esc(s) { return String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c])); }
// *kursiv* und Zeilenumbrüche
export function fmt(s) { return esc(s).replace(/\*([^*]+)\*/g, '<em>$1</em>').replace(/\n/g, '<br>'); }

export class UI {
  constructor() {
    const $ = (id) => document.getElementById(id);
    this.$ = $;
    this.hud = $('hud');
    this.dialog = $('dialog');
    this.panel = $('panel');
    this.overlay = $('overlay');
    this.fadeEl = $('fade');
    this.toasts = $('toasts');
    this.markers = $('markers');
    this.hover = $('hover-label');
    this.speakers = {};
    this.portraitCache = {};
    this.textSpeed = 'normal';
    this.waiting = null;
    this.typing = null;
    this.choiceResolve = null;
    this.onSpeaker = null;
    this.markerEls = new Map();
    this.dialog.innerHTML = `
      <div class="d-portrait"></div>
      <div class="d-body">
        <div class="d-speaker"></div>
        <div class="d-text"></div>
        <div class="d-choices"></div>
      </div>
      <div class="d-next" aria-hidden="true">▼</div>`;
    this.dPortrait = this.dialog.querySelector('.d-portrait');
    this.dSpeaker = this.dialog.querySelector('.d-speaker');
    this.dText = this.dialog.querySelector('.d-text');
    this.dChoices = this.dialog.querySelector('.d-choices');
    this.dialog.addEventListener('click', (e) => {
      if (e.target.closest('.choice')) return;
      this.advance();
    });
  }

  get dialogOpen() { return !this.dialog.classList.contains('hidden'); }
  get panelOpen() { return !this.panel.classList.contains('hidden') || !this.overlay.classList.contains('hidden'); }

  setSpeakers(map) { this.speakers = map; }
  portrait(id) {
    if (!this.portraitCache[id]) {
      const sp = this.speakers[id];
      this.portraitCache[id] = sp ? portraitSVG(sp.portrait || {}) : '';
    }
    return this.portraitCache[id];
  }

  showHUD(v) { this.hud.classList.toggle('hidden', !v); }
  setLocation(name, time) {
    this.$('loc-name').textContent = name;
    this.$('loc-time').textContent = time;
  }

  // ---------- Dialog ----------
  _header(who, thought) {
    const sp = this.speakers[who];
    this.dialog.classList.remove('hidden');
    this.dialog.classList.toggle('narration', !sp);
    this.dPortrait.innerHTML = sp ? this.portrait(who) : '';
    this.dPortrait.style.display = sp ? '' : 'none';
    this.dSpeaker.textContent = sp ? sp.name + (thought ? ' (denkt)' : '') : '';
    this.dText.classList.toggle('thought', !!thought || !sp);
    this.onSpeaker?.(sp ? who : null);
  }

  say(who, text, opts = {}) {
    return new Promise((resolve) => {
      this._header(who, opts.thought);
      this.dChoices.innerHTML = '';
      this.dialog.classList.add('can-advance');
      this._type(text, () => {
        this.waiting = () => { this.waiting = null; resolve(); };
      });
    });
  }

  _type(text, done) {
    const html = fmt(text);
    const speed = SPEEDS[this.textSpeed] || 48;
    if (this.typing) { clearInterval(this.typing.timer); this.typing = null; }
    if (speed > 5000) { this.dText.innerHTML = html; done(); return; }
    // Zeichenweise einblenden: Text in Spans zerlegen
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    const chars = [];
    const walk = (node, parent) => {
      for (const ch of [...node.childNodes]) {
        if (ch.nodeType === 3) {
          for (const c of ch.textContent) {
            const s = document.createElement('span');
            s.textContent = c;
            s.className = 'tc';
            parent.appendChild(s);
            chars.push(s);
          }
        } else {
          const el = ch.cloneNode(false);
          parent.appendChild(el);
          walk(ch, el);
        }
      }
    };
    this.dText.innerHTML = '';
    walk(tmp, this.dText);
    let i = 0;
    const step = Math.max(1, Math.round(speed / 60));
    const finish = () => {
      for (; i < chars.length; i++) chars[i].className = '';
      if (this.typing) clearInterval(this.typing.timer);
      this.typing = null;
      done();
    };
    const timer = setInterval(() => {
      for (let k = 0; k < step && i < chars.length; k++, i++) chars[i].className = '';
      if (i >= chars.length) finish();
    }, 1000 / 60);
    this.typing = { timer, finish };
  }

  advance() {
    if (this.typing) { this.typing.finish(); return true; }
    if (this.waiting) { this.waiting(); return true; }
    return false;
  }

  // options: [{text, seen, isNew, end, disabled}] -> Index
  choose(options, opts = {}) {
    return new Promise((resolve) => {
      if (opts.speaker !== undefined || opts.prompt) {
        this._header(opts.speaker ?? null, false);
        this.dText.innerHTML = opts.prompt ? fmt(opts.prompt) : '';
      } else {
        this.dialog.classList.remove('hidden');
      }
      this.dialog.classList.remove('can-advance');
      this.dChoices.innerHTML = '';
      options.forEach((o, i) => {
        const b = document.createElement('button');
        b.className = 'choice' + (o.seen ? ' seen' : '') + (o.end ? ' end' : '');
        b.innerHTML = `<span class="num">${i + 1}</span>${fmt(o.text)}${o.isNew ? '<span class="new">neu</span>' : ''}`;
        b.disabled = !!o.disabled;
        b.addEventListener('click', (e) => {
          e.stopPropagation();
          this.choiceResolve = null;
          this.dChoices.innerHTML = '';
          resolve(i);
        });
        this.dChoices.appendChild(b);
      });
      this.choiceResolve = (i) => { if (i >= 0 && i < options.length && !options[i].disabled) { this.choiceResolve = null; this.dChoices.innerHTML = ''; resolve(i); } };
      const first = this.dChoices.querySelector('.choice');
      if (first && matchMedia('(hover: hover)').matches) first.focus({ preventScroll: true });
    });
  }

  hideDialog() {
    this.dialog.classList.add('hidden');
    this.dChoices.innerHTML = '';
    this.waiting = null;
    this.onSpeaker?.(null);
  }

  key(e) {
    if (this.choiceResolve && /^[1-9]$/.test(e.key)) { this.choiceResolve(parseInt(e.key, 10) - 1); return true; }
    if ((e.key === ' ' || e.key === 'Enter') && this.dialogOpen && !this.choiceResolve) { this.advance(); return true; }
    return false;
  }

  // ---------- Meldungen ----------
  toast(html, kind = '') {
    const el = document.createElement('div');
    el.className = 'toast ' + kind;
    el.innerHTML = html;
    this.toasts.appendChild(el);
    requestAnimationFrame(() => el.classList.add('show'));
    setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 600); }, 3400);
  }

  // ---------- Überblendung ----------
  fade(to, ms = 450) {
    return new Promise((res) => {
      this.fadeEl.style.transitionDuration = ms + 'ms';
      this.fadeEl.classList.toggle('on', to > 0.5);
      setTimeout(res, ms + 30);
    });
  }

  // ---------- Panels ----------
  openPanel(el) {
    this.panel.innerHTML = '';
    this.panel.appendChild(el);
    this.panel.classList.remove('hidden');
  }
  closePanel() { this.panel.classList.add('hidden'); this.panel.innerHTML = ''; }
  openOverlay(el) {
    this.overlay.innerHTML = '';
    this.overlay.appendChild(el);
    this.overlay.classList.remove('hidden');
  }
  closeOverlay() { this.overlay.classList.add('hidden'); this.overlay.innerHTML = ''; }

  // ---------- Markierungen / Hover ----------
  setMarkers(list, onClick) {
    const seen = new Set();
    for (const m of list) {
      seen.add(m.id);
      let el = this.markerEls.get(m.id);
      if (!el) {
        el = document.createElement('button');
        el.className = 'marker ' + (m.kind || '');
        el.innerHTML = `<span class="m-dot"></span><span class="m-label"></span>`;
        el.addEventListener('click', (e) => { e.stopPropagation(); onClick(el.dataset.id); });
        this.markers.appendChild(el);
        this.markerEls.set(m.id, el);
      }
      el.dataset.id = m.id;
      el.className = 'marker ' + (m.kind || '') + (m.done ? ' done' : '');
      el.querySelector('.m-label').textContent = m.label;
      el.style.transform = `translate(${m.x.toFixed(1)}px, ${m.y.toFixed(1)}px)`;
    }
    for (const [id, el] of this.markerEls) if (!seen.has(id)) { el.remove(); this.markerEls.delete(id); }
  }
  showMarkers(v) { this.markers.classList.toggle('hidden', !v); }
  hoverLabel(text, x, y) {
    if (!text) { this.hover.classList.add('hidden'); return; }
    this.hover.textContent = text;
    this.hover.style.transform = `translate(${Math.round(x + 16)}px, ${Math.round(y + 14)}px)`;
    this.hover.classList.remove('hidden');
  }
}
