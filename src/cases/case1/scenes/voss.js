// Schauplatz: »H. Voss · Uhren & Goldwaaren« – hier gehen alle Uhren
import {
  Kit, MAT, mat, P, shade, orient, room, wallX, windowFrame, doorway, table, chair, stool, roundTable, shelf, cabinet,
  vitrine, rug, framed, panel, kanonenofen, pendantLamp, gasWallLamp, roundClock, regulator, mantelClock, longcase,
  setHands, tools, clockHands, windowBackdrop, SERIF, SCRIPT,
} from '../../../game/kit.js';

const LEFTW = (b, fn) => orient(b, -4.5, 0, 0, Math.PI / 2, fn); // lokale x = −Welt-z
const RIGHTW = (b, fn) => orient(b, 4.5, 0, 0, -Math.PI / 2, fn); // lokale x = Welt-z
const rnd = (seed) => { let s = seed; return () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; };

// Zusammengerollter Schirm im Ständer
function umbrella(b, x, z, lean, c, handle, ivory = false) {
  const top = [x + lean[0], 0.98, z + lean[1]];
  b.rod([x, 0.06, z], top, 0.009, '#2a2420', MAT.iron);
  const m = [x + lean[0] * 0.45, 0.48, z + lean[1] * 0.45];
  b.rod([x + lean[0] * 0.12, 0.2, z + lean[1] * 0.12], m, 0.035, c, MAT.cloth);
  b.rod(m, [x + lean[0] * 0.8, 0.86, z + lean[1] * 0.8], 0.028, c, MAT.cloth);
  if (ivory) {
    b.rod(top, [top[0] + 0.02, top[1] + 0.08, top[2] + 0.02], 0.016, handle, MAT.gloss);
    b.rod([top[0] + 0.02, top[1] + 0.08, top[2] + 0.02], [top[0] + 0.09, top[1] + 0.06, top[2] + 0.06], 0.016, handle, MAT.gloss);
    b.rod([top[0] + 0.09, top[1] + 0.06, top[2] + 0.06], [top[0] + 0.1, top[1] - 0.01, top[2] + 0.06], 0.014, handle, MAT.gloss);
    b.box(top[0] - 0.02, top[1] - 0.025, top[2] - 0.02, top[0] + 0.02, top[1] - 0.005, top[2] + 0.02, '#c9a45a', MAT.brass);
  } else {
    b.sphere(top[0], top[1] + 0.03, top[2], 0.03, 8, 6, handle, MAT.wood);
  }
}

export function build(R) {
  const k = new Kit(R, { atlas: 1024 });
  const b = k.b;
  const clocks = [];

  // ---------- Laden ----------
  room(b, {
    x0: -4.5, x1: 4.5, z0: -3.5, z1: 2.5, h: 3.3, t: 0.2, floor: '#5a3c26', wall: '#6a2e30', wallMat: MAT.damask,
    leftHoles: [{ z0: 0.3, z1: 1.3, y0: 0, y1: 2.5 }, { z0: -2.7, z1: -0.5, y0: 0.65, y1: 2.8 }],
    rightHoles: [{ z0: -2.9, z1: -1.7, y0: 0, y1: 2.3 }],
    wainscot: '#3a2416', wainscotH: 1.05, cornice: '#9a7a44',
  });
  rug(b, -2.1, -1.05, 1.7, 1.35, '#5a1e24', '#c9a45a');

  // Blick hinüber zu Nr. 38: Tor, Ladentür mit Schutzmann, Tiedemanns Schaufenster
  windowBackdrop(k, b, -4.7, -2.7, -0.5, 0.65, 2.8, (c, w, h) => {
    const g = c.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#a8aeb4'); g.addColorStop(1, '#80868c');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    c.fillStyle = '#8a8270'; c.fillRect(0, 0, w, h * 0.64);
    c.fillStyle = 'rgba(40,38,40,0.55)';
    for (let x = w * 0.05; x < w; x += w * 0.31) c.fillRect(x, h * 0.03, w * 0.13, h * 0.15);
    c.fillStyle = '#22201c';
    c.beginPath(); c.moveTo(w * 0.06, h * 0.64); c.lineTo(w * 0.06, h * 0.44); c.arc(w * 0.16, h * 0.44, w * 0.1, Math.PI, 0); c.lineTo(w * 0.26, h * 0.64); c.fill();
    c.fillStyle = '#1b1915'; c.fillRect(w * 0.31, h * 0.24, w * 0.6, h * 0.075);
    c.fillStyle = '#d5b268'; c.font = `bold ${Math.round(h * 0.05)}px ${SERIF}`; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText('C. F. TIEDEMANN', w * 0.61, h * 0.278);
    c.fillStyle = '#2c2a26'; c.fillRect(w * 0.34, h * 0.33, w * 0.1, h * 0.31);
    c.fillStyle = '#3a4048'; c.fillRect(w * 0.55, h * 0.34, w * 0.3, h * 0.22);
    c.fillStyle = 'rgba(200,190,160,0.25)'; c.fillRect(w * 0.55, h * 0.34, w * 0.3, h * 0.04);
    // Schutzmann vor der Tür
    c.fillStyle = '#1a1e2a';
    c.fillRect(w * 0.465, h * 0.43, w * 0.045, h * 0.21);
    c.beginPath(); c.arc(w * 0.4875, h * 0.41, w * 0.018, 0, Math.PI * 2); c.fill();
    c.fillRect(w * 0.483, h * 0.365, w * 0.009, h * 0.03);
    c.fillStyle = '#56524a'; c.fillRect(0, h * 0.64, w, h * 0.05);
    c.fillStyle = '#403e3a'; c.fillRect(0, h * 0.69, w, h * 0.31);
    c.strokeStyle = 'rgba(170,160,140,0.35)'; c.lineWidth = 2;
    for (const y of [0.8, 0.87]) { c.beginPath(); c.moveTo(0, h * y); c.lineTo(w, h * y); c.stroke(); }
    c.fillStyle = 'rgba(150,160,170,0.28)'; c.fillRect(0, 0, w, h);
  });

  // Ladentür mit Glocke, Schaufenster (linke Wand)
  LEFTW(b, () => {
    doorway(b, -1.3, -0.3, 2.5, { glass: true, lit: 0.7, color: '#3a2418', frame: '#2a1a10', knobLeft: true });
    windowFrame(b, 0.5, 2.7, 0.65, 2.8, { frame: '#2a1a10', cols: 2, rows: 2, transom: 0.8, depth: 0.2, glass: false, sill: '#3a2416' });
    b.rod([-0.42, 2.62, 0.02], [-0.42, 2.62, 0.16], 0.008, '#c9a45a', MAT.brass);
    b.lathe([[0.0, -0.06], [0.04, -0.055], [0.045, -0.02], [0.03, 0.02], [0.0, 0.03]], 12, '#d8b860', MAT.brass, { x: -0.42, y: 2.56, z: 0.16 });
  });
  const pane = k.part('scheibe', (pb) => pb.quad([-4.54, 0.65, -0.5], [-4.54, 0.65, -2.7], [-4.54, 2.8, -2.7], [-4.54, 2.8, -0.5], '#a8bcc6', MAT.glass), { shadow: false });
  pane.alpha = 0.16;
  // Auslage: Etuis mit Taschenuhren, eine Kaminuhr aus Marmor
  b.box(-4.48, 0, -2.65, -4.05, 0.6, -0.55, '#3a2014', MAT.wood);
  b.box(-4.48, 0.6, -2.65, -4.0, 0.64, -0.55, '#4a1a20', MAT.cloth);
  const Rk = rnd(7);
  const etui = ['#5a1a2a', '#1e2a4a', '#2a4a32', '#4a1a3a'];
  for (let i = 0; i < 4; i++) {
    const z0 = -2.5 + i * 0.32 + (i > 1 ? 0.55 : 0), y0 = 0.64;
    b.box(-4.42, y0, z0, -4.14, y0 + 0.05, z0 + 0.22, etui[i], MAT.cloth);
    b.box(-4.43, y0 + 0.05, z0 + 0.0, -4.4, y0 + 0.2, z0 + 0.22, shade(etui[i], 0.8), MAT.cloth);
    b.push().translate(-4.28, y0 + 0.056, z0 + 0.11).rotateX(-Math.PI / 2);
    b.cylZ(0, 0, -0.006, 0.05, 0.006, 12, i % 2 ? '#d8b25a' : '#e0c070', MAT.brass);
    b.disc(0, 0, 0.001, 0.042, 14, '#ffffff', MAT.paper, k.dial());
    clockHands(b, 0.042, Math.floor(Rk() * 720), 0.002);
    b.pop();
  }
  clocks.push(mantelClock(k, b, -4.25, 0.64, -1.62, Math.PI / 2, { s: 0.75, case: '#d8d2c6', live: true }));

  // ---------- Rückwand: gehende Uhren, Patent ----------
  const wz = -3.47;
  clocks.push(regulator(k, b, -3.85, 2.15, wz, 0, { live: true, case: '#4a2a16' }).hands);
  clocks.push(regulator(k, b, -2.45, 2.25, wz, 0, { live: true, case: '#3a1e10', w: 0.34, h: 1.0 }).hands);
  clocks.push(roundClock(k, b, -3.15, 2.6, wz, 0, { r: 0.14, live: true, case: '#5a3a22' }));
  clocks.push(roundClock(k, b, -3.15, 1.78, wz, 0, { r: 0.11, live: true, case: '#3a2416' }));
  clocks.push(regulator(k, b, 3.05, 2.2, wz, 0, { live: true, case: '#4a2a16', w: 0.36 }).hands);
  clocks.push(roundClock(k, b, 3.85, 2.5, wz, 0, { r: 0.13, live: true, case: '#6a4424' }));
  clocks.push(roundClock(k, b, 3.85, 1.75, wz, 0, { r: 0.1, live: true, case: '#3a2416' }));
  const lc = longcase(k, b, 1.9, -3.27, 0, { live: true, case: '#3a1e10' });
  clocks.push(lc);

  // Patentblatt No. 46, gerahmt, unter Glas
  const uvPat = k.paper(150, 200, { bg: '#efe6cc', frame: '#7a6034', top: 24, margin: 12, lines: [
    { t: 'Patentblatt', size: 19, weight: 'bold' },
    { t: 'No. 46 · Berlin, 10. November 1892', size: 9 },
    { rule: true, size: 8 },
    { t: 'Anmeldungen', size: 11, style: 'italic' },
    { t: 'V 2117. H. Voss in Berlin:', size: 10, weight: 'bold' },
    { t: 'Synchron-Hemmung', size: 13, weight: 'bold' },
    { t: 'für Pendeluhren.', size: 10 },
    { t: 'Angemeldet am 11. October 1892.', size: 9 },
    { gap: 4 },
    { t: '▬▬▬▬▬▬▬▬▬▬▬▬▬▬', size: 7, color: '#7a7060' },
    { t: '▬▬▬▬▬▬▬▬▬▬▬▬', size: 7, color: '#7a7060' },
    { t: '▬▬▬▬▬▬▬▬▬▬▬▬▬', size: 7, color: '#7a7060' },
  ] });
  orient(b, -1.2, 0, -3.475, 0, () => framed(b, -0.25, 1.56, 0.25, 2.23, uvPat, '#b08a3a', { border: 0.045, frameMat: MAT.brass }));
  const pg = k.part('patentglas', (pb) => orient(pb, -1.2, 0, -3.475, 0, () => {
    pb.quad([-0.25, 1.56, 0.034], [0.25, 1.56, 0.034], [0.25, 2.23, 0.034], [-0.25, 2.23, 0.034], '#dfe8ec', MAT.glass);
  }), { shadow: false });
  pg.alpha = 0.1;
  gasWallLamp(k, b, -1.85, 2.1, -3.48, 0, { intensity: 0.55, range: 4.5 });

  // Schubladenschrank mit Regalen voller Etuis dahinter
  cabinet(b, -0.75, -3.48, 0.95, -3.05, 0.95, '#3a2014', { drawers: 3, front: 'z' });
  for (const y of [1.45, 2.05]) shelf(b, -0.75, 0.95, y, -3.48, -3.2, '#3a2014');
  const Rc = rnd(19);
  for (const [y, n] of [[1.45, 4], [2.05, 3]]) {
    for (let i = 0; i < n; i++) {
      const x0 = -0.7 + i * 0.27 + (y > 2 ? 0.55 : 0), h = 0.05 + Rc() * 0.03;
      for (let s = 0; s < 1 + Math.floor(Rc() * 3); s++) {
        const yy = y + s * (h + 0.004);
        b.box(x0, yy, -3.44, x0 + 0.22, yy + h, -3.28, etui[Math.floor(Rc() * 4)], MAT.cloth);
        b.box(x0 + 0.1, yy + h * 0.4, -3.282, x0 + 0.12, yy + h * 0.6, -3.274, '#d8b060', MAT.brass);
      }
    }
  }
  clocks.push(mantelClock(k, b, 0.6, 1.45, -3.33, 0, { s: 0.7, case: '#5a3418', live: true }));
  clocks.push(mantelClock(k, b, -0.45, 2.05, -3.33, 0, { s: 0.62, case: '#2a1a10', live: true }));

  // ---------- Glas-Ladentisch ----------
  vitrine(b, -1.6, -1.9, 1.2, -1.3, 1.0, '#3a2014', { glassTop: false });
  const Rw = rnd(31);
  for (let i = 0; i < 7; i++) {
    const x = -1.35 + i * 0.36, z = -1.62 + (i % 2 ? 0.1 : -0.06);
    b.push().translate(x, 0.745, z).rotateX(-Math.PI / 2);
    b.cylZ(0, 0, -0.012, 0.05, 0.012, 12, i % 3 ? '#d8b25a' : '#c8c8c4', MAT.brass);
    b.disc(0, 0, 0.001, 0.042, 14, '#ffffff', MAT.paper, k.dial());
    clockHands(b, 0.042, Math.floor(Rw() * 720), 0.002);
    b.pop();
    b.rod([x + 0.05, 0.742, z], [x + 0.14, 0.742, z + 0.05], 0.004, '#d8b25a', MAT.brass);
  }
  const vg = k.part('ladentischglas', (pb) => {
    pb.quad([-1.6, 1.0, -1.3], [1.2, 1.0, -1.3], [1.2, 1.0, -1.9], [-1.6, 1.0, -1.9], '#b0c4cc', MAT.glass);
    pb.quad([-1.6, 0.73, -1.3], [1.2, 0.73, -1.3], [1.2, 1.0, -1.3], [-1.6, 1.0, -1.3], '#b0c4cc', MAT.glass);
    pb.quad([1.2, 0.73, -1.3], [1.2, 0.73, -1.9], [1.2, 1.0, -1.9], [1.2, 1.0, -1.3], '#b0c4cc', MAT.glass);
    pb.quad([-1.6, 0.73, -1.9], [-1.6, 0.73, -1.3], [-1.6, 1.0, -1.3], [-1.6, 1.0, -1.9], '#b0c4cc', MAT.glass);
  }, { shadow: false });
  vg.alpha = 0.2;
  // Auf dem Tisch: Registrierkasse, Klingel, Cigarrenkistchen »Sumatra Imperial«
  b.box(-1.45, 1.0, -1.82, -1.0, 1.2, -1.45, '#c9a45a', MAT.brass);
  b.box(-1.42, 1.2, -1.8, -1.03, 1.32, -1.6, '#b8943a', MAT.brass);
  for (let i = 0; i < 4; i++) b.sphere(-1.38 + i * 0.1, 1.17, -1.43, 0.016, 6, 4, '#f0ead8', MAT.gloss);
  b.cyl(-0.55, 1.0, -1.5, 0.045, 0.05, 0.02, 12, '#2a1a10', MAT.wood);
  b.sphere(-0.55, 1.04, -1.5, 0.035, 10, 6, '#d8b860', MAT.brass);
  const uvCig = k.sign(160, 64, { bg: '#8a1a14', fg: '#e8c060', border: '#e8c060', grain: false, lines: [
    { t: 'SUMATRA', y: 0.36, size: 22, spacing: 2 }, { t: 'Imperial', y: 0.72, size: 16, font: SCRIPT, weight: 'normal' },
  ] });
  b.box(0.62, 1.0, -1.72, 0.98, 1.06, -1.48, '#6a3a1e', MAT.wood);
  b.box(0.62, 1.06, -1.72, 0.98, 1.088, -1.705, '#6a3a1e', MAT.wood);
  b.box(0.62, 1.06, -1.495, 0.98, 1.088, -1.48, '#6a3a1e', MAT.wood);
  b.box(0.62, 1.06, -1.705, 0.635, 1.088, -1.495, '#6a3a1e', MAT.wood);
  b.box(0.965, 1.06, -1.705, 0.98, 1.088, -1.495, '#6a3a1e', MAT.wood);
  for (let i = 0; i < 6; i++) {
    const x = 0.666 + i * 0.054;
    b.cylZ(x, 1.074, -1.695, 0.013, 0.19, 8, '#6a4422', MAT.cloth);
    b.box(x - 0.0135, 1.06, -1.66, x + 0.0135, 1.088, -1.64, '#c8282a', MAT.paper);
  }
  orient(b, 0.8, 1.06, -1.72, 0, () => {
    b.push().rotateX(-0.22);
    b.box(-0.18, 0, -0.012, 0.18, 0.24, 0, '#6a3a1e', MAT.wood);
    panel(b, -0.17, 0.01, 0.17, 0.23, 0.002, uvCig);
    b.pop();
  });
  b.cyl(0.25, 1.0, -1.45, 0.06, 0.07, 0.018, 14, '#c9a45a', MAT.brass);
  b.rod([0.22, 1.025, -1.45], [0.34, 1.03, -1.4], 0.009, '#5a3a20', MAT.cloth);
  // Auer'sches Gasglühlicht über dem Ladentisch
  const auer = pendantLamp(k, b, -0.2, 2.35, -1.0, { top: 3.3, shade: '#ece6d6', intensity: 1.35, range: 7.5, color: '#f6f2e2', glow: 1.0, flicker: 0.015 });

  // ---------- Vitrine mit Gold und der Mahnung ----------
  vitrine(b, 3.7, 0.2, 4.35, 1.6, 1.0, '#3a2014', { glassTop: false });
  b.box(3.85, 0.73, 0.55, 4.2, 0.8, 0.95, '#5a1a2a', MAT.cloth);
  const uvMahn = k.paper(72, 84, { bg: '#f4eee0', top: 13, margin: 5, lines: [
    { t: 'Bankhaus Leßmann', size: 8, weight: 'bold' },
    { t: 'Zweite Mahnung', size: 9, weight: 'bold', color: '#8a1a14' },
    { rule: true, size: 6 },
    { t: '▬▬▬▬▬▬▬▬', size: 6, color: '#6a6050' },
    { t: '3 800 Mark', size: 9, weight: 'bold' },
    { t: 'zum 1. December', size: 7 },
    { t: '▬▬▬▬▬▬▬', size: 6, color: '#6a6050' },
  ] });
  b.quad([3.8, 0.733, 1.12], [4.08, 0.733, 1.12], [4.08, 0.733, 0.82], [3.8, 0.733, 0.82], '#ffffff', MAT.paper, uvMahn);
  const Rg = rnd(53);
  for (const [x, z] of [[3.95, 0.68], [4.12, 0.68], [3.95, 0.86], [4.12, 0.86]]) {
    b.push().translate(x, 0.81, z).rotateX(-Math.PI / 2);
    b.cylZ(0, 0, -0.012, 0.048, 0.012, 12, '#e0b84e', MAT.brass);
    b.disc(0, 0, 0.001, 0.04, 14, '#ffffff', MAT.paper, k.dial());
    clockHands(b, 0.04, Math.floor(Rg() * 720), 0.002);
    b.pop();
  }
  for (let i = 0; i < 3; i++) b.cyl(3.88 + i * 0.12, 0.73, 1.35, 0.022, 0.022, 0.012, 10, '#e0b84e', MAT.brass);
  for (let i = 0; i < 4; i++) b.rod([3.82, 0.735, 0.35 + i * 0.05], [4.25, 0.735, 0.4 + i * 0.05], 0.004, '#d8b25a', MAT.brass);
  const vg2 = k.part('vitrinenglas', (pb) => {
    pb.quad([3.7, 1.0, 1.6], [4.35, 1.0, 1.6], [4.35, 1.0, 0.2], [3.7, 1.0, 0.2], '#b0c4cc', MAT.glass);
    pb.quad([3.7, 0.73, 0.2], [3.7, 0.73, 1.6], [3.7, 1.0, 1.6], [3.7, 1.0, 0.2], '#b0c4cc', MAT.glass);
    pb.quad([3.7, 0.73, 1.6], [4.35, 0.73, 1.6], [4.35, 1.0, 1.6], [3.7, 1.0, 1.6], '#b0c4cc', MAT.glass);
  }, { shadow: false });
  vg2.alpha = 0.2;

  // ---------- Schirmständer an der Tür ----------
  b.cyl(-3.9, 0, 1.9, 0.14, 0.13, 0.55, 14, '#b8943a', MAT.brass);
  b.cyl(-3.9, 0.55, 1.9, 0.15, 0.15, 0.03, 14, '#c9a45a', MAT.brass);
  umbrella(b, -3.94, 1.86, [-0.06, -0.05], '#8a8270', '#5a3a22');
  umbrella(b, -3.86, 1.95, [0.07, 0.03], '#6a6458', '#3a2a1a');
  umbrella(b, -3.9, 1.9, [0.02, 0.09], '#141416', '#f2ead4', true);
  b.box(-4.12, 0.0, 1.66, -3.7, 0.004, 2.12, '#2a2622', MAT.gloss);

  // ---------- Rauchtisch mit Sessel ----------
  roundTable(b, -2.7, 1.45, 0.32, 0.64, '#3a2014');
  chair(b, -2.0, 1.75, -1.95, '#3a2014', { seat: 0.46, cushion: '#5a2a2a', arms: true });
  b.cyl(-2.62, 0.64, 1.4, 0.07, 0.08, 0.02, 14, '#c9a45a', MAT.brass);
  b.box(-2.88, 0.64, 1.38, -2.66, 0.65, 1.62, '#e6dcc4', MAT.paper);

  // ---------- Vorhang zum Hinterzimmer (rechte Wand) ----------
  RIGHTW(b, () => {
    b.box(-3.0, 2.3, 0, -1.6, 2.4, 0.04, '#3a2014', MAT.wood);
    b.rod([-3.05, 2.36, 0.1], [-1.55, 2.36, 0.1], 0.016, '#c9a45a', MAT.brass);
    for (const x of [-3.05, -1.55]) b.sphere(x, 2.36, 0.1, 0.03, 8, 6, '#c9a45a', MAT.brass);
  });
  const VC = '#3a1a24';
  const zu = k.part('vorhang_zu', (pb) => {
    orient(pb, 4.5, 0, 0, -Math.PI / 2, () => {
      for (let i = 0; i < 9; i++) {
        const x0 = -2.98 + i * 0.152, dz = i % 2 ? 0.07 : 0.11;
        pb.box(x0, 0.02, dz - 0.035, x0 + 0.16, 2.34, dz + 0.035, i % 2 ? shade(VC, 0.8) : VC, MAT.cloth);
      }
      pb.box(-3.0, 2.2, 0.13, -1.6, 2.34, 0.16, shade(VC, 1.15), MAT.cloth);
    });
  });
  const auf = k.part('vorhang_auf', (pb) => {
    orient(pb, 4.5, 0, 0, -Math.PI / 2, () => {
      for (const [x0, x1] of [[-3.0, -2.75], [-1.85, -1.6]]) {
        pb.box(x0, 0.02, 0.05, x1, 2.34, 0.15, VC, MAT.cloth);
        pb.box(x0 - 0.01, 1.05, 0.04, x1 + 0.01, 1.11, 0.16, '#c9a45a', MAT.cloth);
      }
      pb.box(-3.0, 2.2, 0.13, -1.6, 2.34, 0.16, shade(VC, 1.15), MAT.cloth);
    });
  });
  auf.visible = false;

  // ---------- Hinterzimmer: Werkbank, Kanonenofen, verbrannte Zeichnungen ----------
  const BR = '#5e5446';
  b.box(4.7, -0.15, -3.7, 7.1, 0, -0.3, '#4a3424', MAT.planks);
  b.box(4.7, 0, -3.7, 7.1, 3.0, -3.5, BR, MAT.plaster);
  wallX(b, 6.9, -3.5, -0.3, 0, 3.0, [{ z0: -2.5, z1: -1.5, y0: 1.3, y1: 2.3 }], BR, MAT.plaster, 0.2, -1);
  b.box(4.7, 3.0, -3.7, 7.1, 3.04, -3.5, '#2a1d14', MAT.matte);
  b.box(6.9, 3.0, -3.5, 7.1, 3.04, -0.3, '#2a1d14', MAT.matte);
  b.box(4.7, 0, -3.5, 6.9, 0.12, -3.46, '#2a1e14', MAT.wood);
  b.box(6.86, 0, -3.5, 6.9, 0.12, -0.3, '#2a1e14', MAT.wood);
  orient(b, 6.9, 0, 0, -Math.PI / 2, () => {
    windowFrame(b, -2.5, -1.5, 1.3, 2.3, { frame: '#3a2a1c', cols: 2, rows: 2, glass: '#7a8a94', lit: 0.45, depth: 0.2 });
    for (let i = 1; i < 4; i++) b.box(-2.5 + i * 0.25 - 0.01, 1.3, 0.02, -2.5 + i * 0.25 + 0.01, 2.3, 0.04, '#1a1a1a', MAT.iron);
  });
  table(b, 5.0, -3.46, 6.6, -2.95, 0.9, '#4a3020');
  tools(b, 5.1, 6.2, 1.55, -3.48);
  b.box(5.05, 1.62, -3.5, 6.25, 1.66, -3.46, '#3a2416', MAT.wood);
  b.box(6.2, 0.9, -3.3, 6.42, 0.98, -3.1, '#3a3a3a', MAT.iron);
  b.box(6.27, 0.98, -3.25, 6.35, 1.06, -3.15, '#3a3a3a', MAT.iron);
  // Reißbrett mit Lineal
  orient(b, 5.55, 0.9, -3.25, 0, () => {
    b.push().rotateX(-0.35);
    b.box(-0.35, 0, -0.02, 0.35, 0.5, 0.0, '#c8b48a', MAT.wood);
    b.box(-0.33, 0.02, 0.0, 0.33, 0.48, 0.002, '#f0e8d4', MAT.paper);
    b.box(-0.36, 0.2, 0.002, 0.36, 0.23, 0.008, '#6a4a2a', MAT.wood);
    b.pop();
  });
  stool(b, 5.4, -2.3, 0.6, '#4a3020');
  // Ofen, noch warm, Aschkasten herausgezogen
  kanonenofen(b, 6.3, -1.3, 2.6);
  b.rod([6.3, 2.6, -1.3], [6.88, 2.6, -1.3], 0.07, '#1a1918', MAT.iron);
  b.box(5.95, 0, -1.65, 6.65, 0.02, -0.95, '#3a3430', MAT.stone);
  b.box(6.17, 0.02, -1.0, 6.43, 0.08, -0.78, '#2a2622', MAT.iron);
  b.box(6.19, 0.08, -0.98, 6.41, 0.085, -0.8, '#8a8680', MAT.matte);
  const Rb = rnd(43);
  for (let i = 0; i < 9; i++) {
    const x = 6.0 + Rb() * 0.6, z = -0.95 + Rb() * 0.45, w = 0.05 + Rb() * 0.07;
    b.box(x, 0.02, z, x + w, 0.024, z + w * 0.7, i % 3 ? '#1e1a16' : '#8a7a5a', MAT.matte);
  }
  b.box(6.05, 0.085, -0.92, 6.2, 0.088, -0.82, '#d8c8a4', MAT.paper);
  b.cyl(5.75, 0, -1.55, 0.13, 0.15, 0.3, 12, '#2a2622', MAT.iron);
  for (let i = 0; i < 4; i++) b.sphere(5.7 + (i % 2) * 0.09, 0.32, -1.58 + Math.floor(i / 2) * 0.07, 0.04, 6, 4, '#141416', MAT.gloss);
  const glut = k.light([6.3, 0.5, -0.9], '#ff8a40', 3.4, 0.85, { flicker: 0.16, glow: 0.3 });

  // ---------- Licht, Rauch ----------
  k.light([-3.9, 1.9, -1.6], '#b8c4d0', 5, 0.6);
  k.light([0.2, 2.8, 1.8], '#ffe8c8', 8, 0.35);
  k.light([6.5, 1.9, -2.0], '#a8b4c0', 3.5, 0.35);
  k.mist([-4.3, 1.2, -3.3], [8.6, 1.8, 5.6], 26, [0.5, 0.46, 0.42]);
  k.dust([-4.3, 0.4, -3.3], [11, 2.4, 5.6], 150, [1, 0.9, 0.75]);

  // ---------- Begehbarkeit ----------
  const nav = k.grid(-4.5, -3.5, 6.9, 2.5, 0.2);
  nav.walk(-4.3, -3.3, 4.3, 2.35);
  nav.walk(4.3, -2.8, 4.8, -1.8);
  nav.walk(4.8, -3.3, 6.7, -0.5);
  nav.block(-1.6, -1.9, 1.2, -1.3, 0.16);
  nav.block(-0.75, -3.5, 0.95, -3.05, 0.12);
  nav.block(1.63, -3.44, 2.17, -3.1, 0.12);
  nav.block(-4.5, -2.65, -4.0, -0.55, 0.1);
  nav.block(3.7, 0.2, 4.35, 1.6, 0.14);
  nav.blockCircle(-3.9, 1.9, 0.15, 0.12);
  nav.blockCircle(-2.7, 1.45, 0.32, 0.16);
  nav.blockCircle(-2.0, 1.75, 0.28, 0.1);
  nav.block(5.0, -3.5, 6.6, -2.95, 0.14);
  nav.blockCircle(6.3, -1.3, 0.3, 0.16);
  nav.blockCircle(5.4, -2.3, 0.18, 0.1);
  nav.blockCircle(5.75, -1.55, 0.15, 0.1);

  // ---------- Spielpunkte ----------
  k.spawn('tuer', -3.8, 0.8, Math.PI / 2);
  k.spawn('default', -3.8, 0.8, Math.PI / 2);
  k.spot('voss', -0.2, -2.35, 0, [-0.2, -0.75]);

  k.exit('v_tuer', 'Zur Straße', { box: [-4.55, 0, 0.3, -4.35, 2.5, 1.3], at: [-3.85, 0.8], face: [-4.5, 0.8], to: 'strasse', spawn: 'voss', sound: 'shopbell' });
  k.hot('v_patent', 'Gerahmtes Patentblatt', { box: [-1.5, 1.5, -3.48, -0.9, 2.3, -3.4], at: [-1.95, -2.3], face: [-1.2, -3.5] });
  k.hot('v_zigarren', 'Cigarrenkistchen', { box: [0.6, 1.0, -1.78, 1.0, 1.3, -1.45], at: [0.8, -0.85] });
  k.hot('v_vitrine', 'Vitrine', { box: [3.7, 0.6, 0.2, 4.35, 1.05, 1.6], at: [3.2, 0.9], face: [4.0, 0.9] });
  k.hot('v_schirme', 'Schirmständer', { box: [-4.08, 0, 1.72, -3.72, 1.1, 2.08], at: [-3.45, 1.55] });
  k.hot('v_vorhang', 'Vorhang', { box: [4.3, 0, -2.98, 4.52, 2.4, -1.62], at: [3.75, -2.3], face: [4.5, -2.3] });
  k.hot('v_ofen', 'Ofen im Hinterzimmer', { box: [5.95, 0, -1.65, 6.65, 1.15, -0.75], at: [5.85, -0.7], face: [6.3, -1.2], when: (g) => g.flag('voss_distracted') });
  k.hot('v_uhren', 'Gehende Uhren', { box: [-4.2, 1.2, -3.48, -2.1, 2.85, -3.3], at: [-3.1, -2.4], face: [-3.1, -3.5] });
  k.hot('v_lampe', 'Auer’sches Gasglühlicht', { box: [-0.55, 2.1, -1.35, 0.15, 2.75, -0.65], at: [0.35, -0.7], face: [-0.2, -1.0] });

  const env = {
    skyAmb: [0.3, 0.27, 0.26], groundAmb: [0.1, 0.085, 0.075],
    sun: { dir: [0.55, -0.78, -0.3], color: [0.3, 0.3, 0.32], shadow: { center: [1.0, 0.5, -1.0], radius: 7.5 } },
    fog: { color: [0.04, 0.03, 0.03], density: 0.01, start: 3 },
    background: [0.02, 0.016, 0.016],
    exposure: 1.2, sepia: 0.18, ao: 0.7, glowStrength: 0.4,
  };

  return k.finish({
    id: 'voss', name: 'H. Voss · Uhren & Goldwaaren', env, ambience: 'voss', paule: true,
    cam: {
      target: [1.0, 1.2, -0.7], yaw: 0, pitch: 0.62, dist: 11.5, fov: 42, fitWidth: 11.8, fitWidthNarrow: 6.5,
      follow: [0.3, 0.25], bounds: [-2.5, -2, 3.8, 1], yawRange: [-0.42, 0.42], pitchRange: [-0.25, 0.25], zoomRange: [0.6, 1.35],
    },
    navMod: (n, g) => { if (!g.flag('voss_distracted')) n.block(4.25, -2.9, 4.9, -1.7, 0.05); },
    update: (dt, t, g) => {
      const min = g ? g.state.minutes : 9 * 60;
      for (const c of clocks) if (c) setHands(c, min);
      const open = !!(g && g.flag('voss_distracted'));
      zu.visible = !open;
      auf.visible = open;
      glut.intensity = 0.85 + Math.sin(t * 0.9) * 0.08;
      auer.intensity = 1.35 + Math.sin(t * 13) * 0.01;
    },
  });
}
