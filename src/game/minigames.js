// Minispiele: Durchschrift abreiben, Gehzeit der Gewichtsuhr berechnen, Schlagwerk der Stutzuhr prüfen
import { drawDial, SERIF, SCRIPT } from './art.js';
import { fmt } from './ui.js';
import { portraitSVG } from './portraits.js';

function el(tag, cls, html) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html != null) e.innerHTML = html;
  return e;
}
const pad = (n) => String(n).padStart(2, '0');
const hm = (min) => `${Math.floor(min / 60) % 24}:${pad(((min % 60) + 60) % 60)}`;

export class Minigames {
  constructor(g) { this.g = g; }

  run(name, o) {
    if (name === 'durchschrift') return this.rubbing(o);
    if (name === 'gewicht') return this.weight(o);
    if (name === 'schlagwerk') return this.strike(o);
    return Promise.resolve(null);
  }

  holmesSays(box, text, kind = '') {
    box.className = 'mini-say ' + kind;
    box.innerHTML = `<div class="pp">${portraitSVG(this.g.C.speakers.holmes.portrait)}</div><p>${fmt(text)}</p>`;
  }

  // ---------------- Durchschrift ----------------
  rubbing() {
    const g = this.g;
    return new Promise((resolve) => {
      const W = 600, H = 400;
      const S = Math.min(2, window.devicePixelRatio || 1);
      const root = el('div', 'mini rub');
      root.innerHTML = `
        <div class="mini-head"><small>Durchschrift</small><b>Die Seite unter der herausgerissenen</b></div>
        <p class="mini-hint">Der Meister schrieb mit festem Druck. Reibe mit dem Bleistift über das Papier – mit gedrückter Maustaste oder dem Finger.</p>
        <div class="rub-wrap"><canvas width="${W * S}" height="${H * S}"></canvas></div>
        <div class="mini-bar"><div class="prog"><i></i></div><span class="pct">0 %</span><button class="btn small cancel">Später</button></div>
        <div class="rub-result hidden"></div>`;
      const cv = root.querySelector('canvas');
      const v = cv.getContext('2d');
      const mk = () => { const c = document.createElement('canvas'); c.width = W * S; c.height = H * S; const x = c.getContext('2d'); x.scale(S, S); return [c, x]; };
      const [paper, p] = mk();
      const [mask, m] = mk();
      const [cover, cc] = mk();
      const [tmp, t] = mk();
      const [graph, gr] = mk();

      // Papier mit Linien
      p.fillStyle = '#efe5cb';
      p.fillRect(0, 0, W, H);
      for (let i = 0; i < 2500; i++) {
        p.fillStyle = `rgba(120,90,40,${Math.random() * 0.05})`;
        p.fillRect(Math.random() * W, Math.random() * H, 1 + Math.random() * 2, 1 + Math.random() * 2);
      }
      p.strokeStyle = 'rgba(70,110,160,0.35)';
      p.lineWidth = 1;
      for (let y = 78; y < H - 10; y += 46) { p.beginPath(); p.moveTo(0, y + 10); p.lineTo(W, y + 10); p.stroke(); }
      p.strokeStyle = 'rgba(170,50,40,0.45)';
      p.beginPath(); p.moveTo(64, 0); p.lineTo(64, H); p.stroke();
      p.fillStyle = 'rgba(130,60,40,0.55)';
      p.font = `italic 15px ${SERIF}`;
      p.textAlign = 'right';
      p.fillText('Auftrags-Buch · C. F. Tiedemann · Seite 213', W - 18, 30);
      p.textAlign = 'left';

      // Eingedrückte Schrift (unsichtbar, bis darübergerieben wird)
      const lines = [
        ['Mo. 14. Nov. – 8 Uhr abds.:', 84, 34],
        ['H. V. kommt.', 84, 34],
        ['Zeichnungen v. 3. Juli bereitlegen', 84, 30],
        ['(Datum!)', 300, 32],
        ['Patentblatt No. 46', 84, 30],
      ];
      m.fillStyle = '#fff';
      m.strokeStyle = '#fff';
      m.lineWidth = 1.1;
      m.textBaseline = 'alphabetic';
      lines.forEach(([txt, x, size], i) => {
        m.font = `${size}px ${SCRIPT}`;
        const y = 82 + i * 46;
        m.fillText(txt, x, y);
        m.strokeText(txt, x, y);
      });
      m.lineWidth = 2;
      m.beginPath(); m.moveTo(300, 274); m.lineTo(410, 270); m.stroke();
      m.beginPath(); m.moveTo(84, 320); m.lineTo(330, 322); m.stroke();

      // Graphitstruktur
      gr.fillStyle = '#3d3c40';
      gr.fillRect(0, 0, W, H);
      for (let i = 0; i < 5000; i++) {
        gr.fillStyle = `rgba(${Math.random() < 0.5 ? '200,200,210' : '10,10,14'},${Math.random() * 0.15})`;
        gr.fillRect(Math.random() * W, Math.random() * H, 2 + Math.random() * 6, 1);
      }

      // Zellen mit Schrift für den Fortschritt
      const CELL = 12;
      const cols = Math.ceil(W / CELL), rows = Math.ceil(H / CELL);
      const md = mask.getContext('2d').getImageData(0, 0, mask.width, mask.height).data;
      const textCells = new Set();
      for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
        let hit = false;
        for (let yy = 0; yy < CELL && !hit; yy += 3) for (let xx = 0; xx < CELL && !hit; xx += 3) {
          const px = Math.floor((i * CELL + xx) * S), py = Math.floor((j * CELL + yy) * S);
          if (px < mask.width && py < mask.height && md[(py * mask.width + px) * 4 + 3] > 40) hit = true;
        }
        if (hit) textCells.add(j * cols + i);
      }
      const covered = new Set();
      const bar = root.querySelector('.prog i'), pct = root.querySelector('.pct');
      let done = false, lastRub = 0;

      const brush = document.createElement('canvas');
      brush.width = brush.height = 64;
      const bx = brush.getContext('2d');
      const grad = bx.createRadialGradient(32, 32, 2, 32, 32, 32);
      grad.addColorStop(0, 'rgba(0,0,0,0.30)');
      grad.addColorStop(0.6, 'rgba(0,0,0,0.16)');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      bx.fillStyle = grad;
      bx.fillRect(0, 0, 64, 64);

      const render = () => {
        v.setTransform(1, 0, 0, 1, 0, 0);
        v.drawImage(paper, 0, 0);
        t.save();
        t.setTransform(1, 0, 0, 1, 0, 0);
        t.globalCompositeOperation = 'source-over';
        t.clearRect(0, 0, tmp.width, tmp.height);
        t.drawImage(cover, 0, 0);
        t.globalCompositeOperation = 'source-in';
        t.drawImage(graph, 0, 0);
        t.globalCompositeOperation = 'destination-out';
        t.drawImage(mask, 0, 0);
        t.restore();
        v.drawImage(tmp, 0, 0);
      };
      const dab = (x, y) => {
        cc.drawImage(brush, x - 30, y - 30, 60, 60);
        const r = 22;
        for (let j = Math.floor((y - r) / CELL); j <= Math.floor((y + r) / CELL); j++) {
          for (let i = Math.floor((x - r) / CELL); i <= Math.floor((x + r) / CELL); i++) {
            const k = j * cols + i;
            if (textCells.has(k) && Math.hypot((i + 0.5) * CELL - x, (j + 0.5) * CELL - y) < r) covered.add(k);
          }
        }
      };
      const progress = () => {
        const f = covered.size / Math.max(1, textCells.size);
        const shown = Math.min(1, f / 0.65);
        bar.style.width = (shown * 100).toFixed(0) + '%';
        pct.textContent = Math.round(shown * 100) + ' %';
        if (f >= 0.65 && !done) finish();
      };
      const finish = () => {
        done = true;
        let n = 0;
        const fill = () => {
          for (let k = 0; k < 40; k++) dab(40 + Math.random() * (W - 60), 50 + Math.random() * (H - 70));
          render();
          if (++n < 14) requestAnimationFrame(fill);
        };
        fill();
        g.sfx('clue');
        const res = root.querySelector('.rub-result');
        res.classList.remove('hidden');
        res.innerHTML = `<div class="transcript">
          <span>Mo. 14. Nov. – 8 Uhr abds.:</span><span>H. V. kommt.</span>
          <span>Zeichnungen v. 3. Juli bereitlegen <u>(Datum!)</u></span><span><u>Patentblatt No. 46</u></span></div>`;
        const b = el('button', 'btn gold', 'Weiter');
        b.addEventListener('click', () => { cleanup(); resolve(true); });
        res.appendChild(b);
        root.querySelector('.cancel').classList.add('hidden');
        res.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      };
      let last = null;
      const pos = (e) => {
        const r = cv.getBoundingClientRect();
        return [((e.clientX - r.left) / r.width) * W, ((e.clientY - r.top) / r.height) * H];
      };
      const move = (e) => {
        if (!last || done) return;
        const q = pos(e);
        const d = Math.hypot(q[0] - last[0], q[1] - last[1]);
        const n = Math.max(1, Math.ceil(d / 5));
        for (let i = 1; i <= n; i++) dab(last[0] + ((q[0] - last[0]) * i) / n, last[1] + ((q[1] - last[1]) * i) / n);
        last = q;
        render();
        progress();
        const now = performance.now();
        if (now - lastRub > 85) { lastRub = now; g.sfx('rub'); }
      };
      cv.addEventListener('pointerdown', (e) => { e.preventDefault(); cv.setPointerCapture(e.pointerId); last = pos(e); dab(last[0], last[1]); render(); progress(); });
      cv.addEventListener('pointermove', move);
      const up = () => { last = null; };
      cv.addEventListener('pointerup', up);
      cv.addEventListener('pointercancel', up);
      const cleanup = () => { g.ui.closeOverlay(); };
      root.querySelector('.cancel').addEventListener('click', () => { cleanup(); resolve(false); });
      g.ui.openOverlay(root);
      render();
    });
  }

  // ---------------- Gewichtsuhr ----------------
  weight() {
    const g = this.g;
    return new Promise((resolve) => {
      const root = el('div', 'mini weight');
      const scaleTop = 120, px = 1.75, mark = 68;
      let ticks = '';
      for (let c = 0; c <= 150; c += 5) {
        const y = scaleTop + c * px;
        const big = c % 10 === 0;
        ticks += `<line x1="${big ? 52 : 58}" y1="${y}" x2="70" y2="${y}" stroke="#3a2a1a" stroke-width="${big ? 1.6 : 0.9}"/>`;
        if (c % 20 === 0) ticks += `<text x="46" y="${y + 4}" text-anchor="end" font-size="11" fill="#3a2a1a">${c}</text>`;
      }
      const wy = scaleTop + mark * px;
      const svg = `<svg viewBox="0 0 260 420" class="wsvg" aria-label="Schwarzwälder Uhr mit Gewicht und Skala">
        <rect x="0" y="0" width="260" height="420" fill="#c9b28a"/>
        <g opacity="0.18">${Array.from({ length: 14 }, (_, i) => `<rect x="${i * 20}" y="0" width="9" height="420" fill="#6a4a2a"/>`).join('')}</g>
        <path d="M84 14 L176 14 L196 40 L190 112 L70 112 L64 40 Z" fill="#5a3a20" stroke="#2a1a0c" stroke-width="2"/>
        <path d="M74 40 Q130 6 186 40" fill="none" stroke="#7a5a32" stroke-width="5"/>
        <circle cx="130" cy="66" r="30" fill="#efe6cf" stroke="#2a1a0c" stroke-width="2"/>
        ${Array.from({ length: 12 }, (_, i) => { const a = (i / 12) * Math.PI * 2; return `<line x1="${130 + Math.sin(a) * 24}" y1="${66 - Math.cos(a) * 24}" x2="${130 + Math.sin(a) * 28}" y2="${66 - Math.cos(a) * 28}" stroke="#2a1a0c" stroke-width="2"/>`; }).join('')}
        <line x1="130" y1="66" x2="${130 + Math.sin((11.25 / 12) * Math.PI * 2) * 15}" y2="${66 - Math.cos((11.25 / 12) * Math.PI * 2) * 15}" stroke="#1a120a" stroke-width="3" stroke-linecap="round"/>
        <line x1="130" y1="66" x2="${130 + 22}" y2="66" stroke="#1a120a" stroke-width="2" stroke-linecap="round"/>
        <line x1="70" y1="${scaleTop}" x2="70" y2="${scaleTop + 150 * px}" stroke="#3a2a1a" stroke-width="1.6"/>
        ${ticks}
        <text x="74" y="${scaleTop - 6}" font-size="10" font-style="italic" fill="#3a2a1a">aufgezogen</text>
        <line x1="112" y1="112" x2="112" y2="${wy}" stroke="#8a7a5a" stroke-width="2.4" stroke-dasharray="3 2"/>
        <line x1="150" y1="112" x2="150" y2="${scaleTop + 52 * px}" stroke="#8a7a5a" stroke-width="2.4" stroke-dasharray="3 2"/>
        <path d="M104 ${wy} L120 ${wy} L123 ${wy + 50} Q112 ${wy + 62} 101 ${wy + 50} Z" fill="#4a3a28" stroke="#1a120a"/>
        <path d="M142 ${scaleTop + 52 * px} L158 ${scaleTop + 52 * px} L161 ${scaleTop + 52 * px + 50} Q150 ${scaleTop + 52 * px + 62} 139 ${scaleTop + 52 * px + 50} Z" fill="#4a3a28" stroke="#1a120a"/>
        <line x1="72" y1="${wy}" x2="104" y2="${wy}" stroke="#b0302a" stroke-width="1.5" stroke-dasharray="4 3"/>
        <circle cx="112" cy="${wy}" r="3" fill="#b0302a"/>
        <g transform="translate(176 250) rotate(4)"><rect x="0" y="0" width="74" height="54" fill="#f1e8d2" stroke="#8a7a5a"/><circle cx="37" cy="6" r="2.5" fill="#7a2a20"/>
          <text x="37" y="26" text-anchor="middle" font-size="12" font-family='${SCRIPT}' fill="#2a2018">Gang:</text>
          <text x="37" y="44" text-anchor="middle" font-size="11" font-family='${SCRIPT}' fill="#2a2018">5 cm je Std.</text></g>
        <text x="112" y="${wy + 76}" text-anchor="middle" font-size="10" fill="#2a1a0c">Gehgewicht</text>
        <text x="150" y="${scaleTop + 52 * px + 76}" text-anchor="middle" font-size="10" fill="#2a1a0c">Schlag</text>
      </svg>`;
      root.innerHTML = `
        <div class="mini-head"><small>Die Schwarzwälder Uhr</small><b>Wann blieb sie stehen?</b></div>
        <div class="w-grid">
          <div class="w-pic">${svg}</div>
          <div class="w-side">
            <ul class="w-facts">
              <li>Gustav zieht die Uhr <b>jeden Morgen um 7:00 Uhr</b> auf. Dann hängt das Gewicht oben bei der Marke 0.</li>
              <li>Das Gehgewicht ist bis zur Marke <b>68</b> gesunken – dann stand das Pendel still.</li>
              <li>Die Karte des Meisters: <b>5 cm je Stunde</b>.</li>
            </ul>
            <div class="w-clock"><button data-d="-60">−1 Std</button><button data-d="-5">−5 Min</button><output>7:00</output><button data-d="5">+5 Min</button><button data-d="60">+1 Std</button></div>
            <button class="btn gold w-ok">Um diese Uhrzeit blieb sie stehen</button>
            <div class="mini-say"></div>
          </div>
        </div>
        <div class="mini-bar"><span></span><button class="btn small cancel">Später</button></div>`;
      let t = 7 * 60, fails = 0;
      const out = root.querySelector('output');
      const say = root.querySelector('.mini-say');
      root.querySelectorAll('.w-clock button').forEach((b) => b.addEventListener('click', () => {
        t = (t + parseInt(b.dataset.d, 10) + 1440) % 1440;
        out.textContent = hm(t);
        g.sfx('tick');
      }));
      const end = (ok, helped) => {
        root.querySelectorAll('button').forEach((b) => { b.disabled = true; });
        const nb = el('button', 'btn gold', 'Weiter');
        nb.addEventListener('click', () => { g.ui.closeOverlay(); resolve({ ok, helped }); });
        say.after(nb);
      };
      root.querySelector('.w-ok').addEventListener('click', () => {
        if (t >= 20 * 60 + 20 && t <= 20 * 60 + 50) {
          g.sfx('success');
          this.holmesSays(say, `${hm(t)} Uhr – ja! 68 Zentimeter, fünf je Stunde: dreizehn Stunden und sechsunddreißig Minuten nach sieben Uhr früh. Die Uhr blieb um *20:36 Uhr* stehen – nicht um 23:15.`, 'right');
          end(true, false);
          return;
        }
        fails++;
        g.sfx('fail');
        let msg = 'Nein. 68 Zentimeter bei fünf Zentimetern je Stunde – ich muss noch einmal rechnen.';
        if (t === 23 * 60 + 15) msg = 'Viertel nach elf ist die Zeit, die mir alle Uhren zeigen *sollen*. Das Gewicht aber lügt nicht.';
        else if (t >= 13 * 60 && t <= 14 * 60 + 20) msg = 'Dreizehn Stunden und ein wenig – das ist die *Laufzeit*. Ich muss sie zur Aufzugszeit hinzuzählen.';
        else if (t >= 19 * 60 + 30 && t <= 21 * 60 + 40) msg = 'Nahe daran, aber nicht genau genug. Ich muss sorgfältiger rechnen.';
        if (fails >= 3) {
          this.holmesSays(say, 'Genug geraten. Rechnen wir es sauber: 68 geteilt durch 5 ergibt 13,6 Stunden – dreizehn Stunden und sechsunddreißig Minuten. Sieben Uhr früh plus diese Zeit: *20:36 Uhr*. Da blieb das Pendel stehen.', 'right');
          t = 20 * 60 + 36;
          out.textContent = hm(t);
          end(true, true);
          return;
        }
        this.holmesSays(say, msg, 'wrong');
      });
      root.querySelector('.cancel').addEventListener('click', () => { g.ui.closeOverlay(); resolve({ ok: false }); });
      g.ui.openOverlay(root);
    });
  }

  // ---------------- Schlagwerk ----------------
  strike() {
    const g = this.g;
    return new Promise((resolve) => {
      const root = el('div', 'mini strike');
      root.innerHTML = `
        <div class="mini-head"><small>Die Stutzuhr auf dem Ladentisch</small><b>Stimmt das Schlagwerk mit den Zeigern?</b></div>
        <p class="mini-hint">Ich löse das Seidenpapier vom Pendel und stelle die Zeiger von Viertel nach elf auf zwölf. Wie oft schlägt die Uhr zur vollen Stunde?</p>
        <div class="st-wrap"><canvas width="640" height="640"></canvas></div>
        <div class="st-btns"><button class="btn gold go">Zeiger vorstellen</button></div>
        <div class="st-q hidden"><p>Wie oft schlug die Uhr um zwölf?</p>
          <div class="st-opts"><button data-n="11">Elfmal</button><button data-n="12">Zwölfmal</button><button data-n="13">Dreizehnmal</button><button data-n="0">Noch einmal hören</button></div></div>
        <div class="mini-say"></div>
        <div class="mini-bar"><span></span><button class="btn small cancel">Später</button></div>`;
      const cv = root.querySelector('canvas');
      const c = cv.getContext('2d');
      const face = document.createElement('canvas');
      face.width = face.height = 420;
      drawDial(face.getContext('2d'), 420, 420, { bg: '#f3ecd9', edge: '#d6c7a4', label: 'C. F. Tiedemann · Berlin' });
      let minutes = 11 * 60 + 15;
      let pulse = 0, running = false, raf = 0, alive = true;
      const draw = () => {
        const W = 640;
        c.clearRect(0, 0, W, W);
        // Gehäuse
        c.fillStyle = '#4a2c16';
        c.beginPath();
        c.moveTo(90, 610); c.lineTo(90, 230); c.quadraticCurveTo(90, 40, 320, 40); c.quadraticCurveTo(550, 40, 550, 230); c.lineTo(550, 610); c.closePath();
        c.fill();
        c.strokeStyle = '#2a170a'; c.lineWidth = 6; c.stroke();
        c.fillStyle = '#6b4424';
        c.fillRect(70, 600, 500, 30);
        c.save();
        c.beginPath(); c.arc(320, 300, 196, 0, Math.PI * 2); c.fillStyle = '#c9a45a'; c.fill();
        c.drawImage(face, 320 - 186, 300 - 186, 372, 372);
        c.restore();
        // Zeiger
        const hA = ((minutes / 60) % 12) / 12 * Math.PI * 2;
        const mA = (minutes % 60) / 60 * Math.PI * 2;
        const hand = (a, len, w) => {
          c.save(); c.translate(320, 300); c.rotate(a);
          c.fillStyle = '#16100a';
          c.beginPath(); c.moveTo(-w, 18); c.lineTo(w, 18); c.lineTo(w * 0.5, -len); c.lineTo(0, -len - 10); c.lineTo(-w * 0.5, -len); c.closePath(); c.fill();
          c.restore();
        };
        hand(hA, 100, 7);
        hand(mA, 150, 4.5);
        c.beginPath(); c.arc(320, 300, 9, 0, Math.PI * 2); c.fillStyle = '#c9a45a'; c.fill();
        // Schlagimpuls
        if (pulse > 0) {
          c.strokeStyle = `rgba(255,210,120,${pulse})`;
          c.lineWidth = 10 * pulse + 2;
          c.beginPath(); c.arc(320, 300, 205 + (1 - pulse) * 60, 0, Math.PI * 2); c.stroke();
        }
      };
      const loop = () => {
        if (!alive) return;
        pulse = Math.max(0, pulse - 0.035);
        draw();
        raf = requestAnimationFrame(loop);
      };
      loop();
      const strike = () => { pulse = 1; g.sfx('strike'); };
      const go = root.querySelector('.go');
      const q = root.querySelector('.st-q');
      const say = root.querySelector('.mini-say');
      const play = () => {
        if (running) return;
        running = true;
        go.disabled = true;
        q.classList.add('hidden');
        say.className = 'mini-say';
        say.innerHTML = '';
        minutes = 11 * 60 + 15;
        const t0 = performance.now();
        let halfDone = false;
        const step = () => {
          if (!alive) return;
          const k = Math.min(1, (performance.now() - t0) / 3200);
          minutes = 11 * 60 + 15 + 45 * k;
          if (!halfDone && minutes >= 11 * 60 + 30) { halfDone = true; strike(); }
          if (k < 1) { setTimeout(step, 16); return; }
          minutes = 12 * 60;
          let n = 0;
          const hit = () => {
            if (!alive) return;
            strike();
            if (++n < 12) setTimeout(hit, 820);
            else setTimeout(() => { running = false; go.disabled = false; go.textContent = 'Noch einmal'; q.classList.remove('hidden'); q.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, 1200);
          };
          setTimeout(hit, 1300);
        };
        setTimeout(step, 400);
      };
      go.addEventListener('click', play);
      root.querySelectorAll('.st-opts button').forEach((b) => b.addEventListener('click', () => {
        const n = parseInt(b.dataset.n, 10);
        if (n === 0) { play(); return; }
        if (n === 12) {
          g.sfx('success');
          this.holmesSays(say, 'Zwölf Schläge zur zwölften Stunde. Das Schlagwerk steht in vollkommener Übereinstimmung mit den Zeigern – obwohl jemand sie auf Viertel nach elf gedreht hat. Ein Laie hätte das Schlagwerk dabei unweigerlich durcheinandergebracht.', 'right');
          q.querySelectorAll('button').forEach((x) => { x.disabled = true; });
          go.classList.add('hidden');
          const nb = el('button', 'btn gold', 'Weiter');
          nb.addEventListener('click', () => { alive = false; cancelAnimationFrame(raf); g.ui.closeOverlay(); resolve(true); });
          say.after(nb);
          return;
        }
        g.sfx('fail');
        this.holmesSays(say, n === 13 ? 'Nein – der einzelne Schlag vorher war der Halbstundenschlag. Ich muss genauer hinhören.' : 'Nein, ich habe mich verzählt. Noch einmal, und diesmal aufmerksam.', 'wrong');
      }));
      root.querySelector('.cancel').addEventListener('click', () => { alive = false; cancelAnimationFrame(raf); g.ui.closeOverlay(); resolve(false); });
      g.ui.openOverlay(root);
    });
  }
}
