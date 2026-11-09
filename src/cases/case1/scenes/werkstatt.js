// Schauplatz: Laden und Werkstatt von Meister Tiedemann – alle Uhren stehen auf 23:15
import {
  Kit, MAT, mat, P, orient, room, windowFrame, doorway, table, chair, stool, shelf, cabinet, counter, vitrine,
  rug, framed, panel, kachelofen, pendantLamp, petroleumLamp, roundClock, regulator, mantelClock, longcase, blackForest,
  tools, clockHands, windowBackdrop, SERIF, SCRIPT, drawPaper,
} from '../../../game/kit.js';

const STOP = 23 * 60 + 15;
const LEFTW = (b, fn) => orient(b, -5, 0, 0, Math.PI / 2, fn); // lokale x = −Welt-z
const RIGHTW = (b, fn) => orient(b, 5, 0, 0, -Math.PI / 2, fn); // lokale x = Welt-z

function paperStrip(b, x, y, z) {
  b.box(x - 0.035, y - 0.1, z, x + 0.035, y, z + 0.006, '#f4f0e4', MAT.paper);
}

export function build(R) {
  const k = new Kit(R, { atlas: 1024 });
  const b = k.b;

  // ---------- Raum ----------
  room(b, {
    x0: -5, x1: 5, z0: -4, z1: 3, h: 3.3, t: 0.2, floor: '#6e4c30', wall: '#5c5a42', wallMat: MAT.wallpaper,
    leftHoles: [{ z0: 0.5, z1: 1.5, y0: 0, y1: 2.5 }, { z0: -2.8, z1: -0.2, y0: 0.7, y1: 2.8 }],
    rightHoles: [{ z0: -1.9, z1: -0.8, y0: 0, y1: 2.4 }],
    wainscot: '#4a3222', wainscotH: 1.0, cornice: '#6e6852',
  });
  rug(b, -4.3, -1.0, -0.9, 2.6, '#5a2a24', '#b08a4a');

  // Blick aus dem Schaufenster hinüber zu Voss (Kulisse im Lichtkasten)
  windowBackdrop(k, b, -5.2, -2.8, -0.2, 0.7, 2.8, (c, w, h) => {
    const g = c.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#a4acb2'); g.addColorStop(1, '#7a8086');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    c.fillStyle = '#6e6658'; c.fillRect(0, 0, w, h * 0.63);
    c.fillStyle = 'rgba(28,28,32,0.6)';
    for (let x = w * 0.07; x < w; x += w * 0.3) c.fillRect(x, h * 0.03, w * 0.12, h * 0.15);
    c.fillStyle = '#1a1612'; c.fillRect(w * 0.2, h * 0.25, w * 0.6, h * 0.075);
    c.fillStyle = '#e0bc60'; c.font = `bold ${Math.round(h * 0.055)}px ${SERIF}`; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText('H. VOSS', w / 2, h * 0.29);
    c.fillStyle = '#f6e2a8'; c.fillRect(w * 0.24, h * 0.36, w * 0.19, h * 0.21); c.fillRect(w * 0.57, h * 0.36, w * 0.19, h * 0.21);
    c.fillStyle = 'rgba(120,90,40,0.5)'; c.fillRect(w * 0.24, h * 0.5, w * 0.19, h * 0.07); c.fillRect(w * 0.57, h * 0.5, w * 0.19, h * 0.07);
    c.fillStyle = '#2a2018'; c.fillRect(w * 0.465, h * 0.35, w * 0.07, h * 0.28);
    c.fillStyle = '#4e4a44'; c.fillRect(0, h * 0.63, w, h * 0.05);
    c.fillStyle = '#3e3c3a'; c.fillRect(0, h * 0.68, w, h * 0.32);
    c.strokeStyle = 'rgba(160,150,130,0.35)'; c.lineWidth = 2;
    for (const y of [0.8, 0.87]) { c.beginPath(); c.moveTo(0, h * y); c.lineTo(w, h * y); c.stroke(); }
    c.fillStyle = 'rgba(150,160,170,0.3)'; c.fillRect(0, 0, w, h);
  });

  // Ladentür und Schaufenster (linke Wand)
  LEFTW(b, () => {
    doorway(b, -1.5, -0.5, 2.5, { glass: true, lit: 0.7, color: '#2c3a2a', frame: '#2a2a20', knobLeft: true });
    windowFrame(b, 0.2, 2.8, 0.7, 2.8, { frame: '#2a2a20', cols: 2, rows: 2, transom: 0.8, depth: 0.2, glass: false, sill: '#3a3020' });
  });
  const pane = k.part('scheibe', (pb) => pb.quad([-5.04, 0.7, -0.2], [-5.04, 0.7, -2.8], [-5.04, 2.8, -2.8], [-5.04, 2.8, -0.2], '#a8bcc6', MAT.glass), { shadow: false });
  pane.alpha = 0.16;
  // Auslage innen am Fenster
  b.box(-4.98, 0, -2.75, -4.55, 0.68, -0.25, '#3a2616', MAT.wood);
  b.box(-4.98, 0.68, -2.75, -4.5, 0.72, -0.25, '#2e4a32', MAT.cloth);
  mantelClock(k, b, -4.75, 0.72, -1.6, Math.PI / 2, { s: 0.8, case: '#3a2010' });
  mantelClock(k, b, -4.75, 0.72, -2.3, Math.PI / 2, { s: 0.65, case: '#5a3a1e' });

  // Hintertür (rechte Wand)
  RIGHTW(b, () => doorway(b, -1.9, -0.8, 2.4, { color: '#4a3020', frame: '#3a2618' }));

  // ---------- Laden ----------
  counter(b, -3.6, -1.9, -1.0, -1.3, 0.98, '#4a2e1c', '#6b4a2e');
  mantelClock(k, b, -1.6, 0.98, -1.6, 0, { s: 1.0, case: '#5a3418' }); // Stutzuhr mit Schlagwerk
  // Ladenkasse
  b.box(-3.25, 0.98, -1.8, -2.75, 1.16, -1.42, '#3a2416', MAT.wood);
  b.box(-3.22, 1.16, -1.78, -2.78, 1.2, -1.45, '#c9a45a', MAT.brass);
  b.box(-3.2, 1.0, -1.42, -2.8, 1.1, -1.4, '#5a3a22', MAT.wood);
  b.sphere(-2.95, 1.05, -1.395, 0.012, 6, 4, '#c9a45a', MAT.brass);
  b.cyl(-3.12, 1.2, -1.62, 0.035, 0.03, 0.04, 10, '#c9a45a', MAT.brass);
  // Regale an der Rückwand mit Stutzuhren
  for (const y of [1.35, 2.05]) {
    shelf(b, -4.85, -1.15, y, -3.98, -3.62, '#4a2e1c');
    for (let i = 0; i < 4; i++) mantelClock(k, b, -4.35 + i * 0.95, y, -3.8, 0, { s: 0.62 + (i % 2) * 0.1, case: ['#5a3418', '#3a2010', '#6a4424', '#2a1a10'][(i + (y > 2 ? 1 : 0)) % 4] });
  }
  b.box(-4.85, 0, -3.98, -1.15, 0.95, -3.55, '#3e2618', MAT.wood);
  for (let i = 0; i < 5; i++) b.box(-4.8 + i * 0.73, 0.1, -3.55, -4.18 + i * 0.73, 0.85, -3.535, '#4e3220', MAT.wood);
  // Meisterbrief und Medaille
  const uvMb = k.paper(160, 120, { bg: '#ece2c8', frame: '#8a6a3a', top: 26, lines: [
    { t: 'Meisterbrief', size: 22, weight: 'bold', font: SCRIPT }, { t: 'Carl Friedrich Tiedemann', size: 13 },
    { t: 'Uhrmacher', size: 12, style: 'italic' }, { t: 'Berlin, im Mai 1856', size: 11 }] });
  orient(b, -3.1, 0, -3.97, 0, () => framed(b, -0.32, 2.45, 0.32, 2.93, uvMb, '#6a4a22'));
  orient(b, -2.4, 0, -3.97, 0, () => {
    b.box(-0.14, 2.55, 0, 0.14, 2.85, 0.02, '#2a1a10', MAT.wood);
    b.cylZ(0, 2.7, 0.02, 0.08, 0.01, 16, '#c9a45a', MAT.brass);
  });
  longcase(k, b, -0.65, -3.72, 0);
  // Vitrine mit Taschenuhren
  vitrine(b, -4.8, 1.75, -4.2, 2.9, 1.0, '#4a2e1c', { glassTop: false });
  for (let i = 0; i < 6; i++) {
    const x = -4.62 + (i % 2) * 0.25, z = 1.95 + Math.floor(i / 2) * 0.33;
    b.push().translate(x, 0.745, z).rotateX(-Math.PI / 2);
    b.cylZ(0, 0, -0.012, 0.055, 0.012, 12, '#d2aa52', MAT.brass);
    b.disc(0, 0, 0.001, 0.046, 14, '#ffffff', MAT.paper, k.dial());
    clockHands(b, 0.046, STOP, 0.002);
    b.pop();
  }
  const vg = k.part('vitrinenglas', (pb) => {
    pb.quad([-4.8, 1.0, 2.9], [-4.2, 1.0, 2.9], [-4.2, 1.0, 1.75], [-4.8, 1.0, 1.75], '#b0c4cc', MAT.glass);
    pb.quad([-4.8, 0.73, 2.9], [-4.2, 0.73, 2.9], [-4.2, 1.0, 2.9], [-4.8, 1.0, 2.9], '#b0c4cc', MAT.glass);
    pb.quad([-4.2, 0.73, 2.9], [-4.2, 0.73, 1.75], [-4.2, 1.0, 1.75], [-4.2, 1.0, 2.9], '#b0c4cc', MAT.glass);
  }, { shadow: false });
  vg.alpha = 0.2;
  // Kundenstuhl (Clara)
  chair(b, -2.6, 0.9, 1.5, '#4a2e1c', { seat: 0.47, cushion: '#5a2a2a' });
  pendantLamp(k, b, -2.3, 2.45, -1.2, { top: 3.3, shade: '#3a4a2a', intensity: 0.75, range: 5.5 });

  // ---------- Werkstatt: Uhrenwand (mit Laden, Vitrine und Fenster: 37 Uhren) ----------
  const wz = -3.97;
  const rowTop = [0.85, 1.35, 1.85, 2.35, 2.85, 3.35, 3.85];
  for (let i = 0; i < rowTop.length; i++) {
    roundClock(k, b, rowTop[i], 3.0, wz, 0, { r: 0.1 + (i % 3) * 0.015, case: ['#5a3a22', '#3a2412', '#6a4a2a'][i % 3] });
  }
  for (const [x, w, h] of [[1.0, 0.32, 0.95], [2.05, 0.36, 1.05], [3.1, 0.3, 0.9]]) {
    regulator(k, b, x, 2.4, wz, 0, { w, h, paper: true, case: x > 2 && x < 3 ? '#3e2210' : '#4a2a16' });
  }
  for (const x of [1.53, 2.58, 3.62]) {
    roundClock(k, b, x, 2.45, wz, 0, { r: 0.15, case: '#4a2e18' });
    paperStrip(b, x, 2.26, wz + 0.05);
    roundClock(k, b, x, 1.8, wz, 0, { r: 0.12, case: '#5e3e20' });
    paperStrip(b, x, 1.64, wz + 0.05);
  }
  // Rechte Wand: zwei Regulatoren
  regulator(k, b, 4.97, 2.5, 0.9, -Math.PI / 2, { w: 0.3, h: 0.85, paper: true });
  regulator(k, b, 4.97, 2.55, -0.3, -Math.PI / 2, { w: 0.26, h: 0.7, paper: true, case: '#5a3a1e' });

  // Die Schwarzwälder Uhr: schiefes Pendel, Gehgewicht bei 68
  const BX = 0.3, BY = 2.15, BZ = -3.78;
  blackForest(k, b, BX, BY, BZ, 0, { tilt: 0.3, drop: 0.68, strikeDrop: 0.5 });
  const uvScale = k.tex(64, 512, (c, w, h) => {
    c.fillStyle = '#e2d6b4'; c.fillRect(0, 0, w, h);
    c.fillStyle = '#2a1a10'; c.textAlign = 'right'; c.textBaseline = 'middle';
    const top = 36.6, perCm = (493.6 - 36.6) / 100;
    for (let cm = 0; cm <= 100; cm += 2) {
      const y = top + cm * perCm;
      const big = cm % 10 === 0;
      c.fillRect(big ? 34 : 46, y - (big ? 1.2 : 0.6), big ? 30 : 18, big ? 2.4 : 1.2);
      if (big) { c.font = `bold 15px ${SERIF}`; c.fillText(String(cm), 31, y); }
    }
    c.font = `italic 11px ${SERIF}`; c.textAlign = 'center';
    c.fillText('aufgez.', 32, 14);
    c.strokeStyle = '#8a2a1a'; c.lineWidth = 2; c.strokeRect(2, 2, w - 4, h - 4);
  });
  panel(b, -0.02, 0.66, 0.13, 1.78, -3.925, uvScale, '#ffffff', mat(P.PAPER, 1, 0.08, 0));
  const uvGang = k.paper(128, 80, { bg: '#f0e8d4', top: 30, lines: [{ t: 'Gang:', size: 16, font: SCRIPT }, { t: '5 cm je Stunde', size: 17, font: SCRIPT }, { t: 'C. F. T.', size: 11, style: 'italic' }] });
  panel(b, 0.6, 1.5, 0.86, 1.66, -3.93, uvGang);
  b.box(0.6, 1.49, -3.935, 0.86, 1.67, -3.93, '#6a4a2a', MAT.wood);

  // ---------- Werkbank ----------
  table(b, 1.4, -3.98, 3.9, -3.35, 0.9, '#5a3c22', { top: 0.06, topColor: '#6a4a2c' });
  b.box(1.4, 0.9, -3.98, 3.9, 1.12, -3.92, '#4a3020', MAT.wood);
  cabinet(b, 3.0, -3.95, 3.85, -3.42, 0.72, '#4e3220', { drawers: 3 });
  // Seidenpapier-Rolle (angeschnitten) und Streifen
  b.push().translate(1.65, 0.97, -3.62).rotateZ(Math.PI / 2);
  b.cyl(0, -0.22, 0, 0.055, 0.055, 0.44, 14, '#f4f0e6', MAT.paper);
  b.pop();
  b.box(1.92, 0.905, -3.58, 2.12, 0.908, -3.4, '#f4f0e6', MAT.paper);
  // Abdruck im Staub, wo die Chronos-Uhr stand
  b.box(2.2, 0.9, -3.8, 2.52, 0.903, -3.55, '#8a6a4a', MAT.matte);
  // halb zerlegtes Werk, Lupe, Werkzeug
  for (const [x, z, r] of [[2.85, -3.6, 0.05], [2.95, -3.52, 0.035], [2.76, -3.5, 0.025]]) b.cyl(x, 0.9, z, r, r, 0.008, 14, '#c9a45a', MAT.brass);
  b.cyl(3.15, 0.9, -3.55, 0.025, 0.02, 0.05, 10, '#1a1a1a', MAT.gloss);
  tools(b, 1.55, 2.9, 1.1, -3.91);
  petroleumLamp(k, b, 3.55, 0.9, -3.7, { lit: false });
  pendantLamp(k, b, 2.6, 2.35, -3.15, { top: 3.3, shade: '#2f4a3a', intensity: 1.15, range: 6.5 });
  // Schild »Rauchen verboten«
  const uvSmoke = k.paper(192, 96, { bg: '#f2eee2', frame: '#1a1a1a', top: 30, lines: [
    { t: 'Das Rauchen in der', size: 15 }, { t: 'Werkstatt ist', size: 15 }, { t: 'streng verboten!', size: 18, weight: 'bold' }, { t: '– C. F. T.', size: 11, style: 'italic' }] });
  RIGHTW(b, () => framed(b, -3.0, 2.0, -2.5, 2.26, uvSmoke, '#1a1a1a', { border: 0.015, frameMat: MAT.gloss }));

  // ---------- Kachelofen ----------
  orient(b, 4.55, 0, -3.5, -Math.PI / 2, () => kachelofen(b, 0.78, 0.78, 2.1, '#5f7a5a'));
  b.box(3.95, 0, -3.25, 4.2, 0.35, -2.95, '#2a2620', MAT.iron);

  // ---------- Rechte Wand: Joppe, Stehpult, Schrank, Kalender ----------
  b.box(4.94, 1.62, -2.34, 4.98, 1.66, -2.26, '#2a2420', MAT.iron);
  b.ellipsoid(4.86, 1.25, -2.3, 0.1, 0.42, 0.24, 10, 8, '#5e5648', MAT.cloth);
  b.box(4.8, 1.55, -2.5, 4.96, 1.66, -2.1, '#4e4638', MAT.cloth);
  // Stehpult mit Auftragsbuch
  b.box(4.35, 0, 0.55, 4.95, 1.05, 1.25, '#4a2e1c', MAT.wood);
  b.push().translate(4.62, 1.12, 0.9).rotateZ(0.22);
  b.box(-0.32, -0.04, -0.4, 0.32, 0.04, 0.4, '#5a3a22', MAT.wood);
  b.box(-0.22, 0.04, -0.3, 0.2, 0.065, -0.005, '#efe8d6', MAT.paper);
  b.box(-0.22, 0.04, 0.005, 0.2, 0.065, 0.3, '#efe8d6', MAT.paper);
  b.box(-0.23, 0.035, -0.31, 0.21, 0.045, 0.31, '#5a1e16', MAT.cloth);
  b.pop();
  // Schubladenschrank (Mappe)
  cabinet(b, 4.45, 1.7, 4.95, 2.55, 1.2, '#4e3220', { drawers: 5, front: 'X' });
  // Kalender
  const uvKal = k.tex(128, 192, (c, w, h) => {
    drawPaper(c, w, h, { bg: '#f2ead6', top: 22, lines: [{ t: 'Dienstag', size: 14, style: 'italic' }, { t: '15', size: 48, weight: 'bold', lh: 1.0 }, { t: 'November 1892', size: 12 }] });
    c.fillStyle = '#2a2018';
    c.font = `10px ${SERIF}`;
    c.textAlign = 'center';
    for (let d = 1; d <= 30; d++) {
      const col = (d + 1) % 7, row = Math.floor((d + 1) / 7);
      c.fillText(String(d), 14 + col * 16.5, 118 + row * 14);
    }
    c.strokeStyle = '#a01a10'; c.lineWidth = 2;
    const col = 15 % 7, row = Math.floor(15 / 7);
    c.beginPath(); c.moveTo(14 + col * 16.5 - 6, 118 + row * 14 - 6); c.lineTo(14 + col * 16.5 + 6, 118 + row * 14 + 5);
    c.moveTo(14 + col * 16.5 + 6, 118 + row * 14 - 6); c.lineTo(14 + col * 16.5 - 6, 118 + row * 14 + 5); c.stroke();
  });
  RIGHTW(b, () => panel(b, 1.95, 1.55, 2.35, 2.15, 0.03, uvKal));

  // ---------- Tatort ----------
  // Leichnam unter dem Laken, die Hand zur Uhr gestreckt
  b.box(0.35, 0, -3.28, 1.95, 0.02, -2.62, '#e4e0d4', MAT.cloth);
  b.ellipsoid(0.58, 0.12, -2.95, 0.15, 0.12, 0.14, 10, 8, '#e8e4da', MAT.cloth);
  b.ellipsoid(1.05, 0.14, -2.95, 0.42, 0.14, 0.24, 12, 8, '#e8e4da', MAT.cloth);
  b.ellipsoid(1.62, 0.09, -2.95, 0.34, 0.09, 0.2, 12, 8, '#e8e4da', MAT.cloth);
  for (const z of [-2.86, -3.04]) b.box(1.9, 0.0, z - 0.05, 2.05, 0.12, z + 0.05, '#15110d', MAT.gloss);
  b.rod([0.62, 0.1, -3.1], [0.3, 0.13, -3.36], 0.045, '#2a2622', MAT.cloth);
  b.ellipsoid(0.25, 0.14, -3.4, 0.045, 0.03, 0.055, 8, 6, '#d8b494', MAT.skin);
  // Chronos-Bronzeuhr, umgestürzt
  orient(b, 0.9, 0.16, -2.35, 0.4, () => {
    b.rotateZ(Math.PI / 2);
    b.box(-0.16, -0.16, -0.12, 0.16, -0.06, 0.12, '#5a4426', MAT.brass);
    b.cylZ(0, 0.08, -0.07, 0.11, 0.14, 16, '#6a5230', MAT.brass);
    b.disc(0, 0.08, 0.072, 0.08, 16, '#ffffff', MAT.paper, k.dial());
    clockHands(b, 0.08, STOP, 0.074);
    b.ellipsoid(0.02, 0.27, 0, 0.07, 0.09, 0.06, 8, 6, '#5a4426', MAT.brass);
    b.sphere(0.02, 0.38, 0, 0.04, 8, 6, '#5a4426', MAT.brass);
    b.rod([0.1, -0.06, 0.02], [0.12, 0.42, 0.02], 0.008, '#5a4426', MAT.brass);
    b.rod([0.12, 0.42, 0.02], [-0.04, 0.47, 0.02], 0.008, '#5a4426', MAT.brass);
  });
  b.box(0.98, 0.0, -2.33, 1.04, 0.004, -2.27, '#5a0e0a', MAT.gloss);
  // Besucherstuhl, Asche, Bauchbinde
  chair(b, 2.2, -2.4, Math.PI, '#4a2e1c', { seat: 0.45 });
  for (let i = 0; i < 7; i++) b.box(2.45 + (i % 3) * 0.03, 0, -2.32 + Math.floor(i / 3) * 0.025, 2.47 + (i % 3) * 0.03, 0.006, -2.305 + Math.floor(i / 3) * 0.025, '#b4b2ac', MAT.matte);
  b.box(2.1, 0, -2.5, 2.16, 0.005, -2.475, '#a8221a', MAT.gloss);
  b.box(2.115, 0.005, -2.5, 2.145, 0.007, -2.475, '#d8b450', MAT.brass);

  // ---------- Hocker des Gesellen ----------
  stool(b, 4.35, -0.3, 0.5, '#5a3a22');

  // ---------- Licht ----------
  k.light([-4.2, 2.0, -1.5], '#b8c6d4', 5.5, 0.75);
  k.light([0.5, 2.9, 2.6], '#ffe6c0', 9, 0.55);
  k.dust([-4.6, 0.3, -3.8], [9.4, 2.8, 6.4], 200);

  // ---------- Begehbarkeit ----------
  const nav = k.grid(-5, -4, 5, 3, 0.2);
  nav.walk(-4.8, -3.8, 4.8, 2.85);
  nav.block(-3.62, -1.92, -0.98, -1.28, 0.16);
  nav.block(-4.85, -4, -1.15, -3.55, 0.12);
  nav.blockCircle(-0.65, -3.72, 0.3, 0.12);
  nav.block(-4.8, 1.75, -4.2, 2.9, 0.12);
  nav.block(-4.98, -2.75, -4.5, -0.25, 0.1);
  nav.block(1.4, -4, 3.9, -3.35, 0.14);
  nav.block(4.15, -3.9, 4.95, -3.1, 0.14);
  nav.block(3.95, -3.25, 4.2, -2.95, 0.08);
  nav.block(0.25, -3.3, 2.05, -2.6, 0.14);
  nav.blockCircle(0.9, -2.35, 0.2, 0.12);
  nav.blockCircle(2.2, -2.4, 0.26, 0.12);
  nav.block(4.35, 0.55, 4.95, 1.25, 0.14);
  nav.block(4.45, 1.7, 4.95, 2.55, 0.14);
  nav.blockCircle(-2.6, 0.9, 0.24, 0.1);
  nav.blockCircle(4.35, -0.3, 0.2, 0.1);

  // ---------- Spielpunkte ----------
  k.spawn('laden', -4.3, 1.0, Math.PI / 2);
  k.spawn('default', -4.3, 1.0, Math.PI / 2);
  k.spawn('hof', 4.3, -1.4, -Math.PI / 2);
  k.spot('wenzel', 1.4, -0.7, -0.4);
  k.spot('gustav', 4.35, -0.3, -Math.PI / 2, [3.4, -0.3]);
  k.spot('clara', -2.6, 0.9, 1.5, [-1.55, 0.95]);
  k.spot('f_holmes', 1.0, -0.3, -1.04);
  k.spot('f_voss', -1.6, 0.9, 2.0);
  k.spot('f_wenzel', 2.2, 1.0, -2.39);
  k.spot('f_krause', -2.4, 1.75, 2.08);
  k.spot('f_schulze', -3.2, 0.0, 1.64);
  k.spot('f_paule', 0.4, 1.8, 2.86);
  k.spot('f_gustav_frei', 3.2, -0.2, -0.9);
  k.spot('f_clara_frei', 2.7, 0.2, 2.25);

  k.exit('w_tuer', 'Zur Straße', { box: [-5.05, 0, 0.5, -4.85, 2.5, 1.5], at: [-4.4, 1.0], face: [-5, 1.0], to: 'strasse', spawn: 'laden', sound: 'shopbell' });
  k.exit('w_hintertuer', 'Hintertür zum Hof', { box: [4.85, 0, -1.9, 5.05, 2.4, -0.8], at: [4.35, -1.35], face: [5, -1.35], to: 'hof', spawn: 'werkstatt' });
  k.hot('w_uhrenwand', 'Uhrenwand', { box: [0.7, 1.45, -3.98, 4.0, 3.2, -3.75], at: [2.95, -2.1] });
  k.hot('w_schwarzwald', 'Schwarzwälder Uhr', { box: [0.02, 0.75, -3.98, 0.56, 2.45, -3.65], at: [-0.2, -2.65], face: [0.3, -3.8] });
  k.hot('w_leiche', 'Meister Tiedemann', { box: [0.3, 0, -3.25, 2.0, 0.32, -2.65], at: [1.15, -1.95] });
  k.hot('w_chronos', 'Bronzeuhr »Chronos«', { box: [0.72, 0, -2.55, 1.1, 0.4, -2.15], at: [0.55, -1.85] });
  k.hot('w_stuhl', 'Besucherstuhl', { box: [1.95, 0, -2.65, 2.45, 1.0, -2.15], at: [2.65, -1.8] });
  k.hot('w_schild', 'Schild an der Wand', { box: [4.9, 1.95, -3.0, 5.0, 2.3, -2.5], at: [4.0, -2.55] });
  k.hot('w_ofen', 'Kachelofen', { box: [4.15, 0, -3.9, 4.95, 2.1, -3.1], at: [3.8, -2.7] });
  k.hot('w_stutzuhr', 'Stutzuhr auf dem Ladentisch', { box: [-1.85, 0.98, -1.75, -1.35, 1.6, -1.45], at: [-1.6, -0.85] });
  k.hot('w_kasse', 'Ladenkasse', { box: [-3.28, 0.98, -1.82, -2.72, 1.25, -1.38], at: [-3.0, -0.85] });
  k.hot('w_pult', 'Stehpult mit Auftragsbuch', { box: [4.3, 0.95, 0.5, 4.95, 1.3, 1.3], at: [3.75, 0.9] });
  k.hot('w_schrank', 'Schubladenschrank', { box: [4.45, 0, 1.7, 4.95, 1.25, 2.55], at: [3.85, 2.1] });
  k.hot('w_joppe', 'Joppe am Haken', { box: [4.72, 0.85, -2.55, 4.98, 1.7, -2.05], at: [4.05, -1.95] });
  k.hot('w_werkbank', 'Werkbank', { box: [1.4, 0.85, -3.98, 3.9, 1.3, -3.35], at: [3.3, -2.85] });
  k.hot('w_meisterbrief', 'Meisterbrief', { box: [-3.45, 2.4, -3.98, -2.25, 3.0, -3.9], at: [-2.6, -2.75] });
  k.hot('w_kalender', 'Kalender', { box: [4.92, 1.55, 1.95, 5.0, 2.15, 2.35], at: [3.85, 2.0] });
  k.hot('w_vitrine', 'Ladenvitrine', { box: [-4.8, 0, 1.75, -4.2, 1.0, 2.9], at: [-3.7, 2.3] });

  const env = {
    skyAmb: [0.3, 0.29, 0.27], groundAmb: [0.12, 0.1, 0.085],
    sun: { dir: [0.55, -0.78, -0.3], color: [0.4, 0.42, 0.46], shadow: { center: [0, 0.5, -0.6], radius: 6.5 } },
    fog: { color: [0.032, 0.028, 0.024], density: 0.008, start: 4 },
    background: [0.02, 0.018, 0.016],
    exposure: 1.2, sepia: 0.2, ao: 0.72, glowStrength: 0.3,
  };

  return k.finish({
    id: 'werkstatt', name: 'Werkstatt Tiedemann', env, ambience: 'werkstatt', paule: true,
    cam: {
      target: [0, 1.2, -0.8], yaw: 0, pitch: 0.62, dist: 11, fov: 42, fitWidth: 10.8, fitWidthNarrow: 6,
      follow: [0.25, 0.25], bounds: [-3, -2, 3, 1], yawRange: [-0.45, 0.45], pitchRange: [-0.25, 0.25], zoomRange: [0.6, 1.35],
    },
  });
}
