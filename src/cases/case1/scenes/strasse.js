// Schauplatz: Rosenthaler Straße vor Nr. 38 – Dienstagmorgen, Nebel und Nieselregen
import {
  Kit, MAT, mat, P, shade, orient, wall, windowFrame, doorway, streetLamp, setHands,
  mantelClock, regulator, clockHands, SERIF,
} from '../../../game/kit.js';
import { Figure } from '../../../game/figures.js';

const TAU = Math.PI * 2;
const RIGHT = { x: 7, yaw: -Math.PI / 2 }; // Nr. 38: lokale x = Welt-z
const LEFT = { x: -7, yaw: Math.PI / 2 }; // gegenüber: lokale x = −Welt-z
const onF = (b, F, fn) => orient(b, F.x, 0, 0, F.yaw, fn);
const rnd = (seed) => { let s = seed; return () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; };

const STOP = 23 * 60 + 15;

// ---------- Häuser (lokal: Blick +Z, Fassade bei z=0) ----------
function house(b, x0, x1, o) {
  const t = 0.3, gh = 4.2, H = o.h || 9.4;
  const base = o.base || '#857c6c', wc = o.color || '#a3987f', trim = o.trim || shade(wc, 1.15), frame = o.frame || '#3a2c1e';
  const holes = o.holes || [];
  wall(b, x0, x1, 0, gh, holes, base, mat(P.ASHLAR, 1, 0, 0.05), t);
  // Sockel vor der Wand
  const low = holes.filter((h) => h.y0 < 0.5).map((h) => ({ ...h, y0: 0, y1: 0.5 }));
  wall(b, x0, x1, 0, 0.5, low, shade(base, 0.62), MAT.stone, -0.05);
  // Gurtgesims
  b.box(x0, gh, -0.05, x1, gh + 0.22, 0.13, trim, MAT.plaster);
  b.box(x0, gh + 0.22, -0.05, x1, gh + 0.26, 0.09, shade(trim, 0.8), MAT.plaster);
  // Obergeschosse
  const step = o.step || 2.25;
  const n = Math.max(1, Math.floor((x1 - x0 - 0.6) / step));
  const m = (x1 - x0 - n * step) / 2;
  const wins = o.wins || Array.from({ length: n }, (_, i) => x0 + m + step * (i + 0.5));
  const floors = [[4.85, 6.6], [7.35, 9.0]];
  const up = [];
  for (const cx of wins) for (const [y0, y1] of floors) up.push({ x0: cx - 0.55, x1: cx + 0.55, y0, y1 });
  wall(b, x0, x1, gh + 0.22, H, up, wc, MAT.plaster, t);
  const R = rnd(o.seed || 7);
  for (const w of up) {
    const lit = R() < (o.litChance ?? 0.28);
    const curtain = R() < 0.6 ? (lit ? '#c8a878' : '#d8d0c0') : null;
    windowFrame(b, w.x0, w.x1, w.y0, w.y1, {
      frame, cols: 2, rows: 2, transom: 0.74, depth: 0.2,
      glass: lit ? '#f0b868' : '#56626a', lit: lit ? 0.55 + R() * 0.4 : 0, curtain, sill: trim,
    });
    b.box(w.x0 - 0.14, w.y1, -0.02, w.x1 + 0.14, w.y1 + 0.2, 0.08, trim, MAT.plaster);
    b.box(w.x0 - 0.1, w.y0 - 0.02, 0, w.x0, w.y1, 0.035, trim, MAT.plaster);
    b.box(w.x1, w.y0 - 0.02, 0, w.x1 + 0.1, w.y1, 0.035, trim, MAT.plaster);
    if (w.y0 < 6) b.box(w.x0 - 0.2, w.y1 + 0.2, -0.02, w.x1 + 0.2, w.y1 + 0.3, 0.12, shade(trim, 0.9), MAT.plaster);
  }
  // Lisenen, Hauptgesims, Schnittkante
  b.box(x0, gh + 0.26, 0, x0 + 0.28, H - 0.3, 0.05, trim, MAT.plaster);
  b.box(x1 - 0.28, gh + 0.26, 0, x1, H - 0.3, 0.05, trim, MAT.plaster);
  b.box(x0, H - 0.34, -0.05, x1, H - 0.12, 0.22, trim, MAT.plaster);
  b.box(x0, H - 0.12, -t, x1, H, 0.26, shade(trim, 0.85), MAT.plaster);
  b.box(x0, H, -t, x1, H + 0.04, 0.26, '#17120d', MAT.matte);
  return wins;
}

function step(b, x0, x1) { b.box(x0 - 0.12, 0, 0, x1 + 0.12, 0.13, 0.34, '#77736a', MAT.stone); }

function pocketWatch(k, b, x, y, z, tilt = 0.5, r = 0.055, gold = '#d2aa52') {
  b.push().translate(x, y, z).rotateX(-tilt);
  b.cylZ(0, 0, -0.016, r, 0.016, 14, gold, MAT.brass);
  b.disc(0, 0, 0.001, r * 0.84, 16, '#ffffff', MAT.paper, k.dial());
  clockHands(b, r * 0.84, STOP, 0.002);
  b.sphere(0, r + 0.012, -0.008, 0.012, 6, 4, gold, MAT.brass);
  b.pop();
}

// Schaufenster-Auslage hinter einer Öffnung (lokal)
function display(b, x0, x1, y0, y1, depth, o) {
  const d = -0.3 - depth;
  b.box(x0, y0 - 0.08, d, x1, y0, -0.3, o.floor, MAT.cloth);
  b.box(x0, y0, d - 0.05, x1, y1, d, o.back, o.backMat || MAT.wood);
  b.box(x0 - 0.05, y0, d, x0, y1, -0.3, o.back, MAT.wood);
  b.box(x1, y0, d, x1 + 0.05, y1, -0.3, o.back, MAT.wood);
  b.box(x0, y1, d, x1, y1 + 0.05, -0.3, shade(o.back, 0.7), MAT.wood);
  // Stufen für die Ware
  b.box(x0 + 0.1, y0, d + 0.05, x1 - 0.1, y0 + 0.22, d + 0.3, o.floor, MAT.cloth);
  b.box(x0 + 0.1, y0 + 0.22, d + 0.05, x1 - 0.1, y0 + 0.44, d + 0.15, o.floor, MAT.cloth);
}

function glassPane(k, F, x0, x1, y0, y1, lz, alpha = 0.22, c = '#a6bcc6') {
  const n = k.part('scheibe', (pb) => onF(pb, F, () => pb.quad([x0, y0, lz], [x1, y0, lz], [x1, y1, lz], [x0, y1, lz], c, MAT.glass)), { shadow: false });
  n.alpha = alpha;
  return n;
}

function signBoard(b, x0, x1, y0, y1, uv, frame) {
  b.box(x0 - 0.06, y0 - 0.06, 0, x1 + 0.06, y1 + 0.06, 0.07, frame, MAT.wood);
  b.quad([x0, y0, 0.072], [x1, y0, 0.072], [x1, y1, 0.072], [x0, y1, 0.072], '#ffffff', mat(P.PAPER, 1, 0.08, 0.3), uv);
}

// ---------- Pferd (lokal: Blick +Z, Boden y=0) ----------
function horse(b, c = '#5a3a24', o = {}) {
  const dark = shade(c, 0.55), hoof = '#1c1612';
  b.ellipsoid(0, 1.38, 0, 0.34, 0.4, 0.92, 14, 10, c, MAT.cloth);
  b.ellipsoid(0, 1.44, -0.62, 0.33, 0.36, 0.38, 12, 8, c, MAT.cloth);
  b.push().translate(0, 1.72, 0.78).rotateX(-0.75);
  b.ellipsoid(0, 0.2, 0, 0.17, 0.42, 0.2, 10, 8, c, MAT.cloth);
  b.box(-0.04, -0.05, -0.2, 0.04, 0.6, -0.12, dark, MAT.cloth);
  b.pop();
  b.push().translate(0, 2.08, 1.2).rotateX(0.55);
  b.ellipsoid(0, 0, 0, 0.13, 0.15, 0.32, 10, 8, c, MAT.cloth);
  b.ellipsoid(0, -0.03, 0.28, 0.1, 0.11, 0.1, 8, 6, shade(c, 0.8), MAT.cloth);
  for (const s of [-1, 1]) {
    b.box(s * 0.09 - 0.025, 0.12, -0.26, s * 0.09 + 0.025, 0.26, -0.2, c, MAT.cloth);
    b.sphere(s * 0.115, 0.05, 0.02, 0.022, 6, 4, '#0c0a08', MAT.gloss);
  }
  b.pop();
  for (const [lx, lz] of [[-0.19, 0.6], [0.19, 0.6], [-0.19, -0.66], [0.19, -0.66]]) {
    b.cyl(lx, 0.12, lz, 0.055, 0.085, 1.0, 8, c, MAT.cloth);
    b.cyl(lx, 0, lz, 0.075, 0.065, 0.13, 8, hoof, MAT.matte);
  }
  b.rod([0, 1.55, -0.95], [0, 0.75, -1.12], 0.07, dark, MAT.cloth, 6);
  // Geschirr
  b.box(-0.36, 1.05, 0.25, 0.36, 1.75, 0.38, '#1e1814', MAT.gloss);
  b.box(-0.355, 1.32, -0.75, 0.355, 1.4, 0.5, '#1e1814', MAT.gloss);
  if (o.blanket) b.box(-0.37, 1.1, -0.95, 0.37, 1.8, 0.2, o.blanket, MAT.tweed, 'b');
}

// ---------- Pferdebahn (lokal: Fahrtrichtung +Z) ----------
function tramParts(k, grp) {
  const cream = '#d6c08a', red = '#6a2e1e', dark = '#2a2622';
  k.part('wagen', (b) => {
    b.box(-1.0, 0.5, -2.4, 1.0, 1.25, 2.4, red, MAT.wood);
    b.box(-1.0, 1.25, -2.4, 1.0, 2.5, 2.4, cream, MAT.wood);
    for (const s of [-1, 1]) {
      for (let i = 0; i < 5; i++) {
        const z0 = -2.15 + i * 0.88, z1 = z0 + 0.7;
        b.box(s * 1.005, 1.45, z0, s * 1.012, 2.2, z1, '#3a464c', MAT.glass);
      }
      b.box(s * 1.0 - 0.01, 2.28, -2.4, s * 1.0 + 0.01, 2.42, 2.4, '#a8382a', MAT.wood);
    }
    for (const e of [-1, 1]) {
      b.box(-0.9, 0.44, e * 2.4, 0.9, 0.52, e * 3.2, dark, MAT.wood);
      b.box(-0.9, 0.52, e * 3.15, 0.9, 1.35, e * 3.2, red, MAT.wood);
      for (const s of [-0.85, 0.85]) b.rod([s, 0.52, e * 3.15], [s, 2.55, e * 3.1], 0.025, '#c9a45a', MAT.brass);
      b.box(-0.65, 1.5, e * 2.4, 0.65, 2.2, e * 2.405, '#3a464c', MAT.glass);
    }
    b.box(-1.1, 2.5, -3.25, 1.1, 2.62, 3.25, '#4a443e', MAT.wood);
    b.box(-0.52, 2.62, -2.3, 0.52, 2.8, 2.3, '#4a443e', MAT.wood);
    for (const [x, z] of [[-0.72, -1.25], [0.72, -1.25], [-0.72, 1.25], [0.72, 1.25]]) b.cylX(x - 0.04, 0.38, z, 0.36, 0.08, 14, '#2a2420', MAT.iron);
    b.box(-0.55, 0.22, -2.0, 0.55, 0.5, 2.0, '#1a1714', MAT.iron);
    // Deichsel
    b.box(-0.04, 0.85, 3.2, 0.04, 0.95, 5.2, '#3a2a1c', MAT.wood);
  }, { parent: grp });
  const uv = k.sign(320, 48, { bg: '#1a1a18', fg: '#efe2c0', border: '#8a7a50', lines: [{ t: 'ROSENTHALER PLATZ – ALEXANDERPLATZ', y: 0.54, size: 24 }] });
  k.part('ziel', (b) => {
    for (const e of [-1, 1]) {
      b.push().translate(0, 2.64, e * 2.3).rotateY(e > 0 ? 0 : Math.PI);
      b.box(-0.82, 0, -0.03, 0.82, 0.24, 0, '#2a2622', MAT.wood);
      b.quad([-0.8, 0.02, 0.002], [0.8, 0.02, 0.002], [0.8, 0.22, 0.002], [-0.8, 0.22, 0.002], '#ffffff', mat(P.PAPER, 1, 0.2, 0), uv);
      b.pop();
    }
  }, { parent: grp });
  const horses = [];
  for (const s of [-0.43, 0.43]) {
    horses.push(k.part('pferd', (b) => horse(b, s < 0 ? '#4e3424' : '#3a2a20'), { parent: grp, pos: [s, 0, 4.6] }));
  }
  const driver = new Figure(k.R, {
    id: 'kutscher', height: 0.98, girth: 1.12, skin: '#dca888', hair: '#4a3a2a', hat: 'coachman', hatColor: '#24221e',
    coat: 'long', coatColor: '#2e3436', pants: '#2a2826', mustache: 'walrus', facial: '#5a4a3a', pose: 'stand', props: ['whip'],
  });
  driver.root.pos = [0, 0.52, 2.8];
  grp.add(driver.root);
  return { horses, driver };
}

// ---------- Droschke (lokal: Blick +Z) ----------
function droschke(b) {
  const lack = '#18181a', trim = '#6a5a3a';
  b.box(-0.72, 0.75, -1.15, 0.72, 1.9, 0.45, lack, MAT.gloss);
  b.box(-0.76, 1.9, -1.2, 0.76, 2.0, 0.5, '#101012', MAT.gloss);
  for (const s of [-1, 1]) {
    b.box(s * 0.725, 1.2, -0.85, s * 0.732, 1.75, 0.1, '#3a464c', MAT.glass);
    b.box(s * 0.73, 0.8, -1.1, s * 0.74, 0.86, 0.4, trim, MAT.brass);
  }
  b.box(-0.65, 1.2, 0.45, 0.65, 1.55, 1.05, lack, MAT.gloss);
  b.box(-0.6, 1.55, 0.5, 0.6, 1.62, 1.0, '#3a2e26', MAT.cloth);
  b.box(-0.62, 0.9, 1.0, 0.62, 1.2, 1.08, lack, MAT.gloss);
  for (const [x, z, r] of [[-0.8, -0.65, 0.6], [0.72, -0.65, 0.6], [-0.72, 0.95, 0.42], [0.66, 0.95, 0.42]]) {
    b.cylX(x, r, z, r, 0.07, 16, '#2a1e16', MAT.wood);
    b.cylX(x - 0.02, r, z, r * 0.25, 0.11, 10, '#3a2e22', MAT.wood);
  }
  for (const s of [-0.45, 0.45]) b.rod([s, 0.95, 1.05], [s * 0.85, 1.05, 3.1], 0.025, '#3a2a1c', MAT.wood);
  b.cyl(0.74, 1.55, 0.4, 0.06, 0.05, 0.16, 6, '#c9a45a', MAT.brass);
  b.box(0.7, 1.58, 0.36, 0.78, 1.68, 0.44, '#f0c070', MAT.glow(0.9));
}

// ---------- Normaluhr ----------
function normaluhr(k, b, x, z) {
  b.cyl(x, 0, z, 0.2, 0.16, 0.4, 12, '#1f2622', MAT.iron);
  b.cyl(x, 0.4, z, 0.09, 0.07, 2.3, 10, '#1f2622', MAT.iron);
  b.cyl(x, 2.7, z, 0.12, 0.16, 0.12, 12, '#1f2622', MAT.iron);
  b.cylZ(x, 3.12, z - 0.17, 0.33, 0.34, 22, '#1c2420', MAT.iron);
  b.cyl(x, 3.44, z, 0.08, 0.02, 0.22, 8, '#1f2622', MAT.iron);
  b.sphere(x, 3.68, z, 0.05, 8, 6, '#c9a45a', MAT.brass);
  const hands = [];
  for (const yaw of [0, Math.PI]) {
    const zz = z + (yaw ? -0.17 : 0.17);
    orient(b, x, 3.12, zz, yaw, () => {
      b.cylZ(0, 0, 0, 0.3, 0.02, 22, '#c9a45a', MAT.brass);
      b.disc(0, 0, 0.021, 0.27, 24, '#ffffff', mat(P.PAPER, 1, 0.12, 0), k.dial());
    });
    hands.push(roundClockHands(k, x, 3.12, zz, yaw, 0.27));
  }
  return hands;
}
function roundClockHands(k, x, y, z, yaw, r) {
  const mk = (len, w, dz) => k.part('zeiger', (b) => {
    b.box(-w / 2, -len * 0.18, dz, w / 2, len, dz + 0.006, '#15100b', MAT.gloss);
  }, { pos: [x + Math.sin(yaw) * 0.025, y, z + Math.cos(yaw) * 0.025], rot: [0, yaw, 0], shadow: false });
  return { h: mk(r * 0.5, 0.022, 0), m: mk(r * 0.8, 0.014, 0.005) };
}

// ---------- Litfaßsäule ----------
function litfass(k, b, x, z) {
  const uv = k.tex(640, 360, (c, w, h) => {
    c.fillStyle = '#cfc3a4';
    c.fillRect(0, 0, w, h);
    const posters = [
      { x: 0, w: 220, bg: '#e8dcbc', fg: '#2a1e12', lines: [
        { t: 'Handwerker-Verein', size: 26 }, { t: 'Sophienstraße 15', size: 16, weight: 'normal' }, { t: 'ABEND-CURSE', size: 30 },
        { t: 'Mechanik · Elektricität', size: 16, weight: 'normal' }, { t: 'Zeichnen · Rechnen', size: 16, weight: 'normal' },
        { t: 'Montags u. Donnerstags', size: 15, weight: 'normal', style: 'italic' }, { t: 'Abends 8–10 Uhr', size: 22 }] },
      { x: 220, w: 210, bg: '#f2ecd8', fg: '#1a1410', lines: [
        { t: 'Bekanntmachung!', size: 28 }, { t: 'Wegen der Cholera', size: 17, weight: 'normal' }, { t: 'in Hamburg', size: 17, weight: 'normal' },
        { t: 'WASSER NUR', size: 30, color: '#8a1a12' }, { t: 'ABGEKOCHT', size: 30, color: '#8a1a12' }, { t: 'genießen!', size: 22 },
        { t: 'Der Polizei-Präsident', size: 14, weight: 'normal', style: 'italic' }] },
      { x: 430, w: 210, bg: '#2e3a52', fg: '#efe4c4', lines: [
        { t: 'Vortrag', size: 20, weight: 'normal', style: 'italic' }, { t: 'Die Einheitszeit', size: 26 }, { t: 'für das', size: 16, weight: 'normal' },
        { t: 'Deutsche Reich', size: 26 }, { t: 'Königl. Sternwarte', size: 15, weight: 'normal' }, { t: 'Dienstag, 22. Nov.', size: 17 }, { t: 'Abends 8 Uhr', size: 17 }] },
    ];
    for (const p of posters) {
      c.save();
      c.translate(p.x + 4, 6);
      const pw = p.w - 8, ph = h - 12;
      c.fillStyle = p.bg;
      c.fillRect(0, 0, pw, ph);
      c.strokeStyle = p.fg;
      c.lineWidth = 3;
      c.strokeRect(6, 6, pw - 12, ph - 12);
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      let y = 34;
      for (const L of p.lines) {
        c.font = `${L.style || ''} ${L.weight || 'bold'} ${L.size}px ${SERIF}`;
        let s = L.size;
        while (c.measureText(L.t).width > pw - 20 && s > 8) { s--; c.font = `${L.style || ''} ${L.weight || 'bold'} ${s}px ${SERIF}`; }
        c.fillStyle = L.color || p.fg;
        c.fillText(L.t, pw / 2, y);
        y += s * 1.45;
      }
      for (let i = 0; i < 90; i++) { c.fillStyle = `rgba(255,255,255,${Math.random() * 0.1})`; c.fillRect(Math.random() * pw, Math.random() * ph, 2 + Math.random() * 6, 1 + Math.random() * 3); }
      c.restore();
    }
  });
  b.cyl(x, 0, z, 0.66, 0.66, 0.3, 20, '#3a3a36', MAT.stone);
  b.cylUV(x, 0.3, z, 0.6, 2.25, 28, '#ffffff', MAT.paper, uv);
  b.cyl(x, 2.55, z, 0.64, 0.62, 0.18, 20, '#2e3a2e', MAT.iron);
  b.lathe([[0.64, 2.73], [0.66, 2.8], [0.5, 3.05], [0.2, 3.25], [0.05, 3.35], [0, 3.37]], 20, '#2e3a2e', MAT.iron, { x, z });
  b.sphere(x, 3.42, z, 0.07, 8, 6, '#c9a45a', MAT.brass);
}

// ---------- Straßenpumpe ----------
function pumpe(b, x, z) {
  const g = '#2e3a34';
  b.box(x - 0.3, 0, z - 0.3, x + 0.3, 0.12, z + 0.3, '#6a665c', MAT.stone);
  b.cyl(x, 0.12, z, 0.17, 0.14, 1.6, 12, g, MAT.iron);
  b.cyl(x, 1.72, z, 0.2, 0.2, 0.08, 12, g, MAT.iron);
  b.lathe([[0.2, 1.8], [0.16, 1.95], [0.06, 2.12], [0, 2.15]], 12, g, MAT.iron, { x, z });
  b.rod([x, 0.95, z + 0.12], [x, 0.7, z + 0.42], 0.04, g, MAT.iron);
  b.rod([x, 1.55, z - 0.1], [x, 1.85, z - 0.75], 0.03, g, MAT.iron);
  b.box(x - 0.25, 0, z + 0.4, x + 0.25, 0.1, z + 0.75, '#4a4640', MAT.stone);
}

const EXTRAS = [
  { id: 'frau1', x: 5.35, z: 4.7, look: [6.6, 0.6], spec: { height: 0.9, girth: 1.12, skin: '#e8c0a0', hair: '#6a4a30', hairStyle: 'bun', hat: 'bonnet', hatColor: '#3a2e2a', coat: 'dress', coatColor: '#4a3a46', collar: '#d8d0c0', apron: '#bdb4a0', apronTop: 0.2, apronBottom: -0.7, pose: 'stand', props: ['basket'] } },
  { id: 'mann1', x: 4.35, z: 3.75, look: [6.6, 0.6], spec: { height: 1.0, girth: 1.0, skin: '#e4b896', hair: '#3a2a20', hat: 'bowler', hatColor: '#26221e', coat: 'frock', coatColor: '#3c3a34', pants: '#2e2c28', mustache: 'kaiser', facial: '#3a2a20', pose: 'stand', props: ['newspaper'] } },
  { id: 'arbeiter', x: 5.75, z: -7.5, look: [6.6, 0.6], spec: { height: 0.98, girth: 1.05, skin: '#dcae8a', hair: '#5a4a3a', hat: 'cap', hatColor: '#3a3630', coat: 'jacket', coatColor: '#4a4a52', pants: '#3a3630', beard: 'full', facial: '#5a4a3a', pose: 'handsBack' } },
];

export function build(R) {
  const k = new Kit(R, { atlas: 1024 });
  const b = k.b;

  // ---------- Boden ----------
  const Z0 = -27, Z1 = 15;
  b.box(-4.6, -0.2, Z0, 4.6, 0, Z1, '#5d5850', mat(P.COBBLE, 1, 0, 0.42));
  for (const s of [-1, 1]) {
    const xa = s * 4.6, xb = s * 7.05;
    b.box(Math.min(xa, xb), -0.2, Z0, Math.max(xa, xb), 0, Z1, '#7a766c', mat(P.SLATE, 0.42, 0, 0.3));
    b.box(Math.min(s * 4.45, s * 4.62), -0.2, Z0, Math.max(s * 4.45, s * 4.62), 0.025, Z1, '#8a867c', MAT.stone);
    b.box(Math.min(s * 4.2, s * 4.45), -0.2, Z0, Math.max(s * 4.2, s * 4.45), 0.004, Z1, '#3a3834', mat(P.STONE, 1, 0, 0.9));
    b.box(Math.min(s * 6.35, s * 7.0), -0.2, Z0, Math.max(s * 6.35, s * 7.0), 0.006, Z1, '#6a665e', mat(P.COBBLE, 2.6, 0, 0.3));
  }
  for (const x of [-0.72, 0.72]) {
    b.box(x - 0.035, 0, Z0, x + 0.035, 0.014, Z1, '#4a4a4c', MAT.metal);
    b.box(x + (x > 0 ? -0.09 : 0.035), 0, Z0, x + (x > 0 ? -0.035 : 0.09), 0.004, Z1, '#24221e', MAT.matte);
  }
  // Querhaus am Ende der Straße
  orient(b, 0, 0, -26, 0, () => {
    wall(b, -12, 12, 0, 12, [], '#6e6a62', MAT.plaster, 0.3);
    const R = rnd(3);
    for (let x = -10; x < 10; x += 2.2) for (const y of [1.2, 4.9, 7.6]) {
      const lit = R() < 0.35;
      b.box(x, y, 0, x + 1.0, y + 1.7, 0.02, lit ? '#e0a860' : '#3a4044', lit ? MAT.glow(0.6) : MAT.glass);
    }
  });

  // ---------- Rechte Häuserzeile (Nr. 36–39) ----------
  let holmesWin = 2.9;
  onF(b, RIGHT, () => {
    // Nr. 39 – Bäckerei
    house(b, 5, 14, { color: '#a89a80', base: '#7e7462', seed: 11, holes: [{ x0: 6.0, x1: 7.0, y0: 0, y1: 2.6 }, { x0: 7.4, x1: 10.2, y0: 0.75, y1: 2.85 }] });
    doorway(b, 6.0, 7.0, 2.6, { glass: true, lit: 0.6, color: '#5a3a22', frame: '#3a2618' });
    step(b, 6.0, 7.0);
    windowFrame(b, 7.4, 10.2, 0.75, 2.85, { frame: '#4a3020', cols: 3, rows: 2, transom: 0.8, depth: 0.08, glass: false, sill: '#4a3020' });
    display(b, 7.4, 10.2, 0.75, 2.85, 0.7, { floor: '#b8a888', back: '#6a4a2e' });
    // Nr. 38 – Tiedemann
    const w38 = house(b, -6, 5, { color: '#9c937c', base: '#7a7262', seed: 5, wins: [-4.9, -2.8, -0.7, 1.3, 3.3],
      holes: [{ x0: -4.4, x1: -1.2, y0: 0, y1: 4.0 }, { x0: 0.0, x1: 1.1, y0: 0, y1: 2.6 }, { x0: 1.5, x1: 3.5, y0: 0.7, y1: 2.8 }, { x0: -5.75, x1: -4.95, y0: 1.0, y1: 2.6 }] });
    holmesWin = w38[4];
    doorway(b, 0.0, 1.1, 2.6, { glass: true, lit: 0.15, color: '#2c3a2a', frame: '#232a20' });
    step(b, 0.0, 1.1);
    windowFrame(b, -5.75, -4.95, 1.0, 2.6, { frame: '#2a2018', cols: 1, rows: 2, glass: '#e0b070', lit: 0.4, curtain: '#d8ccb0' });
    windowFrame(b, 1.5, 3.5, 0.7, 2.8, { frame: '#232a20', cols: 2, rows: 2, transom: 0.8, depth: 0.08, glass: false, sill: '#3a3a30' });
    display(b, 1.5, 3.5, 0.7, 2.8, 0.75, { floor: '#2e4a32', back: '#3a2616' });
    // Tor mit Rundbogen
    const cx = -2.8, r = 1.6, sy = 2.4;
    for (let y = sy; y < 4.0; y += 0.08) {
      const yy = Math.min(4.0, y + 0.08), ym = (y + yy) / 2;
      const hw = Math.sqrt(Math.max(0, r * r - (ym - sy) * (ym - sy)));
      b.box(-4.4, y, -0.3, cx - hw, yy, 0, '#857c6c', MAT.ashlar);
      b.box(cx + hw, y, -0.3, -1.2, yy, 0, '#857c6c', MAT.ashlar);
    }
    for (let i = 0; i <= 12; i++) {
      const a = Math.PI * (i / 12);
      b.push().translate(cx + Math.cos(a) * (r + 0.1), sy + Math.sin(a) * (r + 0.1), 0.02).rotateZ(a - Math.PI / 2);
      b.box(-0.12, -0.12, 0, 0.12, 0.12, 0.07, i === 6 ? '#b0a68e' : '#958b77', MAT.stone);
      b.pop();
    }
    for (const x of [-4.55, -1.05]) b.box(x - 0.15, 0, 0, x + 0.15, sy, 0.08, '#958b77', MAT.ashlar);
    // Durchfahrt
    b.box(-4.4, -0.2, -6.2, -1.2, 0, -0.3, '#56524a', mat(P.COBBLE, 1.2, 0, 0.3));
    b.box(-4.7, 0, -6.2, -4.4, 4.0, -0.3, '#8a8272', MAT.plaster);
    b.box(-1.2, 0, -6.2, -0.9, 4.0, -0.3, '#8a8272', MAT.plaster);
    b.box(-4.7, 3.98, -6.2, -0.9, 4.2, -0.3, '#6e675a', MAT.plaster);
    b.quad([-4.4, 0, -6.1], [-1.2, 0, -6.1], [-1.2, 4.0, -6.1], [-4.4, 4.0, -6.1], '#a7ae9e', mat(P.PLASTER, 1, 0.35, 0));
    b.box(-3.3, 0, -6.05, -2.3, 2.3, -6.0, '#3a3028', MAT.wood);
    // Schilder
    const uvT = k.sign(512, 96, { bg: '#1e2a20', fg: '#d9b86a', border: '#9a8040', lines: [{ t: 'C. F. TIEDEMANN', y: 0.42, size: 46, spacing: 5 }, { t: 'UHRMACHERMEISTER · GEGR. 1858', y: 0.8, size: 17, weight: 'normal', spacing: 2 }] });
    signBoard(b, -0.15, 3.65, 3.02, 3.78, uvT, '#2a2418');
    const uv38 = k.sign(96, 72, { bg: '#24344e', fg: '#f0ead8', border: '#f0ead8', grain: false, lines: [{ t: '38', y: 0.55, size: 46 }] });
    signBoard(b, -0.95, -0.55, 2.6, 2.9, uv38, '#1a2230');
    // Nr. 37 und 36
    house(b, -14, -6, { color: '#8e8a7a', base: '#706a5e', seed: 21, holes: [{ x0: -9.6, x1: -8.6, y0: 0, y1: 2.6 }, { x0: -12.6, x1: -11.4, y0: 1.0, y1: 2.8 }, { x0: -7.6, x1: -6.6, y0: 1.0, y1: 2.8 }] });
    doorway(b, -9.6, -8.6, 2.6, { color: '#3a2a1e', frame: '#2a1e14' });
    step(b, -9.6, -8.6);
    for (const [a, e] of [[-12.6, -11.4], [-7.6, -6.6]]) windowFrame(b, a, e, 1.0, 2.8, { frame: '#2a2018', glass: '#4a545a', curtain: '#cfc6b4' });
    house(b, -23, -14, { color: '#a49680', base: '#7a6e5e', seed: 31, holes: [{ x0: -20.5, x1: -17.5, y0: 0.7, y1: 2.8 }, { x0: -16.4, x1: -15.4, y0: 0, y1: 2.6 }] });
    windowFrame(b, -20.5, -17.5, 0.7, 2.8, { frame: '#2a2018', glass: '#c89858', lit: 0.5, cols: 3 });
    doorway(b, -16.4, -15.4, 2.6, { color: '#3a2a1e' });
  });
  const uvBack = k.sign(400, 72, { bg: '#e8dcc0', fg: '#5a2a16', border: '#5a2a16', grain: false, lines: [{ t: 'BÄCKEREI · W. KRÜGER', y: 0.55, size: 34, spacing: 2 }] });
  onF(b, RIGHT, () => signBoard(b, 6.0, 10.2, 3.05, 3.75, uvBack, '#4a3020'));

  // Auslage Tiedemann (alle Uhren auf 23:15)
  onF(b, RIGHT, () => {
    const d = -1.05;
    for (let i = 0; i < 6; i++) pocketWatch(k, b, 1.75 + i * 0.32, 0.78, d + 0.5 + (i % 2) * 0.08, 0.7);
    for (let i = 0; i < 5; i++) pocketWatch(k, b, 1.9 + i * 0.36, 0.99, d + 0.2, 0.4, 0.06);
    mantelClock(k, b, 2.5, 1.14, d + 0.1, 0, { s: 0.85, case: '#3a2010' });
    regulator(k, b, 3.15, 2.25, d + 0.02, 0, { w: 0.3, h: 0.75, paper: true, case: '#4a2a16' });
    regulator(k, b, 1.85, 2.3, d + 0.02, 0, { w: 0.26, h: 0.6, paper: true, case: '#5a3a1e' });
    b.box(1.7, 0.75, -0.62, 2.0, 0.84, -0.6, '#f2ecd8', MAT.paper);
  });
  glassPane(k, RIGHT, 1.5, 3.5, 0.7, 2.8, -0.12, 0.2);
  glassPane(k, RIGHT, 7.4, 10.2, 0.75, 2.85, -0.12, 0.16);
  // Bäckerei-Auslage: Schrippen und Brote
  onF(b, RIGHT, () => {
    const R = rnd(9);
    for (let i = 0; i < 16; i++) b.ellipsoid(7.6 + R() * 2.4, 0.84, -0.75 + R() * 0.3, 0.07, 0.045, 0.05, 8, 5, '#c08a48', MAT.plain);
    for (let i = 0; i < 5; i++) b.ellipsoid(7.8 + i * 0.5, 1.1, -0.85, 0.18, 0.09, 0.1, 10, 6, '#9a6a34', MAT.plain);
    for (let i = 0; i < 6; i++) b.ellipsoid(7.7 + i * 0.42, 1.33, -0.92, 0.12, 0.07, 0.08, 8, 6, '#b07a3c', MAT.plain);
  });

  // ---------- Linke Häuserzeile (gegenüber) ----------
  onF(b, LEFT, () => {
    house(b, -14, -4, { color: '#9a8e7a', base: '#76705f', seed: 41, holes: [{ x0: -11.4, x1: -10.4, y0: 0, y1: 2.6 }, { x0: -9.6, x1: -7.6, y0: 0.9, y1: 2.8 }, { x0: -6.6, x1: -5.4, y0: 0.9, y1: 2.8 }] });
    doorway(b, -11.4, -10.4, 2.6, { color: '#3a2a1e' });
    step(b, -11.4, -10.4);
    windowFrame(b, -9.6, -7.6, 0.9, 2.8, { frame: '#2a2018', glass: '#d8a868', lit: 0.45, cols: 2, curtain: '#c8b898' });
    windowFrame(b, -6.6, -5.4, 0.9, 2.8, { frame: '#2a2018', glass: '#4a545a' });
    // Voss – prächtiger Laden mit Gasglühlicht
    house(b, -4, 4, { color: '#b0a284', base: '#8a7e68', trim: '#d0c4a6', seed: 51, litChance: 0.4,
      holes: [{ x0: -0.7, x1: 0.3, y0: 0, y1: 2.7 }, { x0: -2.8, x1: -1.0, y0: 0.6, y1: 2.8 }, { x0: 0.9, x1: 2.6, y0: 0.6, y1: 2.8 }] });
    doorway(b, -0.7, 0.3, 2.7, { glass: true, lit: 0.9, color: '#1a1816', frame: '#c9a45a' });
    step(b, -0.7, 0.3);
    for (const [a, e] of [[-2.8, -1.0], [0.9, 2.6]]) {
      windowFrame(b, a, e, 0.6, 2.8, { frame: '#b8964a', cols: 1, rows: 2, transom: 0.82, depth: 0.08, glass: false, sill: '#b8964a' });
      display(b, a, e, 0.6, 2.8, 0.7, { floor: '#6a1e22', back: '#2a1a14' });
      for (let i = 0; i < 4; i++) pocketWatch(k, b, a + 0.25 + i * 0.4, 0.69, -0.6, 0.75, 0.06, '#e8c060');
      for (let i = 0; i < 3; i++) pocketWatch(k, b, a + 0.35 + i * 0.5, 0.9, -0.82, 0.4, 0.07, '#e8c060');
      b.sphere((a + e) / 2, 2.55, -0.7, 0.09, 10, 8, '#fff6dc', MAT.glow(2.6));
    }
    mantelClock(k, b, -1.9, 1.04, -0.92, 0, { s: 0.8, case: '#e4ddd0', min: 8 * 60 + 25 });
    mantelClock(k, b, 1.75, 1.04, -0.92, 0, { s: 0.7, case: '#2a1a10', min: 8 * 60 + 25 });
    // Destille
    house(b, 4, 13, { color: '#8a7e6c', base: '#6a6050', seed: 61, litChance: 0.35,
      holes: [{ x0: 8.1, x1: 9.1, y0: 0, y1: 2.6 }, { x0: 9.6, x1: 11.8, y0: 0.8, y1: 2.75 }, { x0: 5.4, x1: 7.6, y0: 0.8, y1: 2.75 }] });
    doorway(b, 8.1, 9.1, 2.6, { glass: true, lit: 0.8, color: '#4a2416', frame: '#2a1a10' });
    step(b, 8.1, 9.1);
    for (const [a, e] of [[9.6, 11.8], [5.4, 7.6]]) {
      windowFrame(b, a, e, 0.8, 2.75, { frame: '#3a2014', cols: 3, rows: 2, transom: 0.55, glass: '#f0a050', lit: 0.85 });
      b.box(a + 0.06, 0.86, -0.088, e - 0.06, 1.75, -0.07, '#e8dcc4', MAT.cloth);
      b.rod([a + 0.06, 1.77, -0.075], [e - 0.06, 1.77, -0.075], 0.012, '#c9a45a', MAT.brass);
    }
    house(b, 13, 23, { color: '#9e9480', base: '#787060', seed: 71, holes: [{ x0: 15.0, x1: 16.0, y0: 0, y1: 2.6 }, { x0: 17.2, x1: 19.6, y0: 0.9, y1: 2.8 }] });
    doorway(b, 15.0, 16.0, 2.6, { color: '#3a2a1e' });
    windowFrame(b, 17.2, 19.6, 0.9, 2.8, { frame: '#2a2018', glass: '#4a545a', cols: 3 });
    // Schilder
    const uvV = k.sign(512, 96, { bg: '#141210', fg: '#ecc65e', border: '#ecc65e', lines: [{ t: 'H. VOSS', y: 0.42, size: 50, spacing: 8 }, { t: 'UHREN & GOLDWAAREN', y: 0.8, size: 20, spacing: 4 }] });
    signBoard(b, -3.1, 2.9, 3.0, 3.8, uvV, '#b8964a');
    const uvD = k.sign(512, 80, { bg: '#4a1e14', fg: '#f0e2c0', border: '#c8a060', lines: [{ t: 'DESTILLE ZUM ROSENTHALER TOR', y: 0.42, size: 30, spacing: 2 }, { t: 'M. MAHNKE · KORN · KÜMMEL · WEISSE', y: 0.8, size: 15, weight: 'normal', spacing: 2 }] });
    signBoard(b, 5.3, 11.9, 3.0, 3.72, uvD, '#2a1a10');
  });
  glassPane(k, LEFT, -2.8, -1.0, 0.6, 2.8, -0.12, 0.18);
  glassPane(k, LEFT, 0.9, 2.6, 0.6, 2.8, -0.12, 0.18);

  // Zunftzeichen über Tiedemanns Tür
  const signX = 6.2, signZ = -0.45;
  b.rod([7, 3.95, signZ], [signX - 0.1, 3.95, signZ], 0.03, '#1e1a16', MAT.iron);
  b.rod([7, 4.3, signZ], [signX + 0.2, 3.97, signZ], 0.02, '#1e1a16', MAT.iron);
  orient(b, signX - 0.25, 3.6, signZ, 0, () => {
    b.cylZ(0, 0, -0.06, 0.3, 0.12, 22, '#c9a45a', MAT.brass);
    b.sphere(0, 0.34, 0, 0.06, 8, 6, '#c9a45a', MAT.brass);
    for (const e of [1, -1]) {
      b.push().rotateY(e > 0 ? 0 : Math.PI);
      b.disc(0, 0, 0.062, 0.26, 22, '#ffffff', MAT.paper, k.dial());
      clockHands(b, 0.26, 8 * 60 + 20, 0.064);
      b.pop();
    }
  });

  // ---------- Normaluhr, Litfaßsäule, Pumpe, Laternen ----------
  const UX = 4.95, UZ = -5.4;
  const uhr = normaluhr(k, b, UX, UZ);
  litfass(k, b, -5.9, 7.5);
  pumpe(b, -5.45, -4.7);
  const lamps = [[4.85, -8.2], [4.85, 6.2], [-4.85, -2.2], [-4.85, 10.2], [-4.85, -14.2], [4.85, -19]];
  for (const [x, z] of lamps) streetLamp(k, b, x, z, { h: 3.4, intensity: 1.05, range: 8, glow: 1.3 });
  // Licht aus den Läden
  k.light([6.3, 2.0, 2.5], '#ffcf90', 3.2, 0.45, { flicker: 0.03 });
  k.light([-6.35, 2.1, 1.0], '#fff0d4', 6.0, 1.25, { flicker: 0.01 });
  k.light([-6.3, 2.0, -8.6], '#ffaa58', 5.0, 0.9, { flicker: 0.06 });
  k.light([10.5, 2.4, -2.8], '#aab4bc', 4.5, 0.45);

  // ---------- Droschke mit Lotte ----------
  const dz = -12.4;
  k.part('droschke', (pb) => orient(pb, -3.7, 0, dz, 0, () => droschke(pb)));
  const lotte = k.part('lotte', (pb) => horse(pb, '#6a4228', { blanket: '#5a2e24' }), { pos: [-3.7, 0, dz + 3.4] });

  // ---------- Pferdebahn ----------
  const tram = k.group('pferdebahn');
  const tp = tramParts(k, tram);
  const T = { z: 30, dir: -1, pause: 4, rang: false, speed: 2.6 };
  tram.visible = false;

  // ---------- Neugierige ----------
  const extras = EXTRAS.map((e) => {
    const f = new Figure(R, { ...e.spec, id: e.id });
    f.setPos(e.x, e.z).setYaw(Math.atan2(e.look[0] - e.x, e.look[1] - e.z));
    k.root.add(f.root);
    return f;
  });

  // ---------- Regen und Nebel ----------
  k.rain([-7.5, 0, -24], [15, 10, 38], 1100);
  k.mist([-8, 0.2, -24], [16, 3.2, 38], 70, [0.42, 0.44, 0.48]);

  // ---------- Begehbarkeit ----------
  const nav = k.grid(-6.9, -21, 6.9, 12, 0.2);
  nav.walk(-6.55, -21, 6.55, 12);
  nav.blockCircle(UX, UZ, 0.18, 0.16);
  nav.blockCircle(-5.9, 7.5, 0.66, 0.18);
  nav.blockCircle(-5.45, -4.7, 0.3, 0.15);
  for (const [x, z] of lamps) nav.blockCircle(x, z, 0.13, 0.15);
  nav.block(-4.55, dz - 1.3, -2.85, dz + 4.75, 0.12);
  for (const e of EXTRAS) nav.blockCircle(e.x, e.z, 0.22, 0.14);

  // ---------- Spielpunkte ----------
  k.spawn('start', 6.0, -2.6, -Math.PI / 2);
  k.spawn('title', 6.0, -2.6, -Math.PI / 2);
  k.spawn('default', 6.0, -2.6, -Math.PI / 2);
  k.spawn('laden', 6.2, 0.55, -Math.PI / 2);
  k.spawn('tor', 6.0, -2.8, -Math.PI / 2);
  k.spawn('voss', -6.2, 0.2, Math.PI / 2);
  k.spawn('destille', -6.2, -8.6, Math.PI / 2);
  k.spot('krause', 6.45, 1.55, -Math.PI / 2, [5.5, 1.5]);
  k.spot('wenzel', 6.05, 0.35, -Math.PI / 2);

  k.exit('s_laden', 'Laden von Meister Tiedemann', { box: [6.85, 0, 0.0, 7.1, 2.6, 1.1], at: [6.3, 0.55], face: [7, 0.55], to: 'werkstatt', spawn: 'laden', sound: 'shopbell' });
  k.exit('s_tor', 'Durchfahrt zum Hof', { box: [6.9, 0, -4.4, 7.6, 3.9, -1.2], at: [6.1, -2.8], face: [7, -2.8], to: 'hof', spawn: 'durchfahrt', when: (g) => g.flag('zutritt') });
  k.exit('s_voss', 'Uhrenladen Voss', { box: [-7.1, 0, -0.3, -6.85, 2.7, 0.7], at: [-6.3, 0.2], face: [-7, 0.2], to: 'voss', spawn: 'tuer', sound: 'shopbell', when: (g) => g.flag('zutritt') });
  k.exit('s_destille', 'Destille »Zum Rosenthaler Tor«', { box: [-7.1, 0, -9.1, -6.85, 2.6, -8.1], at: [-6.3, -8.6], face: [-7, -8.6], to: 'kneipe', spawn: 'tuer', when: (g) => g.flag('zutritt') });
  k.hot('s_normaluhr', 'Normaluhr', { box: [UX - 0.35, 2.75, UZ - 0.35, UX + 0.35, 3.5, UZ + 0.35], at: [UX - 0.55, UZ + 0.75], face: [UX, UZ] });
  k.hot('s_litfass', 'Litfaßsäule', { box: [-6.5, 0.3, 6.9, -5.3, 2.55, 8.1], at: [-4.9, 6.9] });
  k.hot('s_fenster_t', 'Tiedemanns Schaufenster', { box: [6.82, 0.7, 1.6, 7.1, 2.8, 3.5], at: [6.0, 2.6] });
  k.hot('s_fenster_v', 'Schaufenster von Voss', { box: [-7.1, 0.6, 1.0, -6.82, 2.8, 2.8], at: [-6.0, 1.9], when: (g) => g.flag('zutritt') });
  k.hot('s_mein_fenster', 'Mein Fenster', { box: [6.85, 4.85, holmesWin - 0.55, 7.1, 6.6, holmesWin + 0.55], at: [5.4, holmesWin - 0.4] });
  k.hot('s_droschke', 'Droschke', { box: [-4.45, 0, dz - 1.2, -2.95, 2.1, dz + 1.2], at: [-2.5, dz + 0.4], when: (g) => g.flag('zutritt') });
  k.hot('s_pferdebahn', 'Pferdebahn', { node: tram, noWalk: true, dynamic: true, when: () => tram.visible && T.z > -16 && T.z < 12 });

  const env = {
    skyAmb: [0.38, 0.42, 0.49], groundAmb: [0.13, 0.13, 0.14],
    sun: { dir: [-0.35, -1, -0.45], color: [0.3, 0.32, 0.36], shadow: { center: [0, 0, -3], radius: 17 } },
    fog: { color: [0.2, 0.216, 0.24], density: 0.031, start: 7 },
    exposure: 1.18, sepia: 0.16, ao: 0.72, glowStrength: 0.42,
  };

  return k.finish({
    id: 'strasse', name: 'Rosenthaler Straße', env, ambience: 'strasse',
    cam: {
      target: [1, 1.4, -2], yaw: -0.2, pitch: 0.4, dist: 13, fov: 44, fitWidth: 15, fitWidthNarrow: 7.5,
      follow: [0.35, 0.85], bounds: [-4, -16, 4, 6], yawRange: [-0.5, 0.5], pitchRange: [-0.2, 0.35], zoomRange: [0.6, 1.4],
    },
    titleCam: { target: [1.5, 3.2, -4], yaw: -0.42, pitch: 0.2, dist: 15, fov: 40, fitWidth: 13, fitWidthNarrow: 9, autoOrbit: 0.05 },
    update: (dt, t, g) => {
      const min = g ? g.state.minutes : 8 * 60 + 25;
      for (const h of uhr) setHands(h, min);
      for (const f of extras) f.update(dt, t);
      lotte.rot[0] = Math.sin(t * 0.7) * 0.01;
      // Pferdebahn
      if (T.pause > 0) {
        T.pause -= dt;
        tram.visible = false;
        if (T.pause <= 0) { T.z = T.dir < 0 ? 30 : -42; tram.visible = true; }
        return;
      }
      const front = T.z + T.dir * 6.4;
      let blocked = false;
      if (g) {
        const figs = [g.holmes, ...Object.values(g.cast)];
        for (const f of figs) {
          if (!f.root.parent) continue;
          const ahead = (f.z - front) * T.dir;
          if (Math.abs(f.x) < 1.55 && ahead > -6.5 && ahead < 2.2) blocked = true;
        }
      }
      if (blocked) {
        if (!T.rang) { T.rang = true; if (g && g.mode === 'play') g.sfx('trambell'); }
      } else {
        if (T.rang) T.rang = false;
        T.z += T.dir * T.speed * dt;
      }
      tram.pos[2] = T.z;
      tram.rot[1] = T.dir > 0 ? 0 : Math.PI;
      for (let i = 0; i < tp.horses.length; i++) tp.horses[i].pos[1] = blocked ? 0 : Math.abs(Math.sin(t * 4.2 + i)) * 0.035;
      tp.driver.update(dt, t);
      if (T.dir < 0 && T.z < -44) { T.dir = 1; T.pause = 14 + Math.random() * 12; }
      else if (T.dir > 0 && T.z > 30) { T.dir = -1; T.pause = 14 + Math.random() * 12; }
    },
  });
}
