// Schauplatz: Destille »Zum Rosenthaler Tor« von Emil Mahnke
import {
  Kit, MAT, mat, P, shade, orient, room, windowFrame, doorway, table, roundTable, chair, bench, shelf, counter,
  bottle, cup, barrel, framed, panel, kanonenofen, pendantLamp, regulator, setHands, SERIF, drawPaper,
} from '../../../game/kit.js';
import { Figure } from '../../../game/figures.js';

const LEFTW = (b, fn) => orient(b, -5, 0, 0, Math.PI / 2, fn); // lokale x = −Welt-z
const RIGHTW = (b, fn) => orient(b, 5, 0, 0, -Math.PI / 2, fn); // lokale x = Welt-z
const rnd = (seed) => { let s = seed; return () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; };

export function build(R) {
  const k = new Kit(R, { atlas: 1024 });
  const b = k.b;

  // ---------- Raum ----------
  room(b, {
    x0: -5, x1: 5, z0: -4, z1: 3, h: 3.2, t: 0.2, floor: '#5e4430', wall: '#7a6648', wallMat: mat(P.PLASTER, 1, 0, 0.03),
    leftHoles: [{ z0: 0.6, z1: 1.6, y0: 0, y1: 2.5 }, { z0: -1.4, z1: 0.2, y0: 1.0, y1: 2.5 }],
    rightHoles: [{ z0: -1.6, z1: -0.4, y0: 0, y1: 2.4 }],
    wainscot: '#3e2a1c', wainscotH: 1.15, cornice: '#5e4e38',
  });
  // Sägespäne auf dem Boden
  const Rs = rnd(3);
  for (let i = 0; i < 60; i++) {
    const x = -4.6 + Rs() * 9.2, z = -1.9 + Rs() * 4.7;
    b.box(x, 0, z, x + 0.05 + Rs() * 0.06, 0.003, z + 0.03 + Rs() * 0.05, '#a88a5a', MAT.matte);
  }
  LEFTW(b, () => {
    doorway(b, -1.6, -0.6, 2.5, { glass: true, lit: 0.6, color: '#4a2416', frame: '#2a1a10', knobLeft: true });
    windowFrame(b, -0.2, 1.4, 1.0, 2.5, { frame: '#3a2014', cols: 2, rows: 2, transom: 0.6, glass: '#9aa6ae', lit: 0.35, sill: '#3a2014' });
    b.box(-0.15, 1.0, 0.03, 1.35, 1.7, 0.05, '#e8dcc4', MAT.cloth);
    b.rod([-0.18, 1.72, 0.05], [1.38, 1.72, 0.05], 0.012, '#c9a45a', MAT.brass);
  });

  // ---------- Tresen, Zapfhähne, Gläser ----------
  counter(b, -2.8, -2.9, 2.8, -2.3, 1.05, '#3a2416', '#5a3a22');
  b.box(-2.84, 1.05, -2.94, 2.84, 1.09, -2.26, '#2a1a10', MAT.gloss);
  for (const x of [-1.6, -1.3, -1.0]) {
    b.cyl(x, 1.09, -2.65, 0.035, 0.03, 0.32, 10, '#c9a45a', MAT.brass);
    b.rod([x, 1.36, -2.65], [x, 1.33, -2.5], 0.015, '#c9a45a', MAT.brass);
    b.sphere(x, 1.46, -2.65, 0.035, 8, 6, '#e8e0d0', MAT.gloss);
  }
  const Rg = rnd(11);
  for (let i = 0; i < 9; i++) cup(b, 0.2 + i * 0.22, 1.09, -2.75 + Rg() * 0.15, '#d8e0d8', 0.032, 0.1 + Rg() * 0.04);
  bottle(b, 1.8, 1.09, -2.55, '#c8d8c8', 0.32, 0.04);
  cup(b, 1.95, 1.09, -2.45, '#e0e8e0', 0.022, 0.06);
  // Flaschenregal hinter dem Tresen
  const bc = ['#c8d8c8', '#3a6a3a', '#5a3018', '#c8a040', '#2a4a2a', '#8a2a22', '#e0d8b0'];
  for (const y of [1.3, 1.78, 2.26]) {
    shelf(b, -0.6, 2.6, y, -3.98, -3.68, '#3a2416', false);
    for (let x = -0.45; x < 2.45; x += 0.14 + Rg() * 0.06) bottle(b, x, y, -3.82, bc[Math.floor(Rg() * bc.length)], 0.28 + Rg() * 0.1, 0.035 + Rg() * 0.01);
  }
  b.box(-0.65, 1.0, -3.99, 2.65, 2.75, -3.97, '#2a1a10', MAT.wood);
  b.box(-0.65, 2.72, -3.99, 2.65, 2.8, -3.65, '#3a2416', MAT.wood);
  for (const x of [-0.65, 2.61]) b.box(x, 1.0, -3.98, x + 0.04, 2.72, -3.66, '#3a2416', MAT.wood);
  const uvDest = k.sign(384, 48, { bg: '#2a1a10', fg: '#e8c878', border: '#c8a060', lines: [{ t: 'DESTILLATION · E. MAHNKE', y: 0.55, size: 26, spacing: 2 }] });
  orient(b, 1.0, 0, -3.97, 0, () => {
    b.box(-1.55, 2.84, 0, 1.55, 3.03, 0.025, '#2a1a10', MAT.wood);
    panel(b, -1.5, 2.86, 1.5, 3.01, 0.027, uvDest);
  });
  // Fässer
  barrel(b, -3.35, -3.5, 0.32, 0.85, '#5a3a20');
  barrel(b, 3.4, -3.5, 0.3, 0.8, '#4a3018');
  b.box(3.05, 0.8, -3.8, 3.75, 0.84, -3.2, '#3a2a1a', MAT.wood);

  // ---------- Kreidetafel ----------
  const uvTafel = k.chalk(320, 248, [
    { t: '14. Nov. – 23 ¼ Uhr –', size: 23, color: 'rgba(255,244,210,0.96)' },
    { t: 'Runde Korn von H. Voss!!!', size: 23, color: 'rgba(255,236,190,1)' },
    { t: '~~~~~~~~~~~~~~', size: 16, color: 'rgba(240,236,224,0.5)' },
    { t: 'Molle 10 Pf. · Korn 10 Pf.', size: 19 },
    { t: 'Kümmel 10 Pf. · Weiße 15 Pf.', size: 19 },
    { t: 'Ede: 4 Molle, 2 Korn', size: 18, color: 'rgba(240,236,224,0.75)' },
    { t: 'Schuster Pohl: 1 M. 20', size: 18, color: 'rgba(240,236,224,0.75)' },
  ]);
  orient(b, -1.6, 0, -3.97, 0, () => framed(b, -0.7, 1.25, 0.7, 2.35, uvTafel, '#5a3a1c', { border: 0.05, mat: mat(P.PLAIN, 1, 0.1, 0.05) }));

  // ---------- Wanduhr, die drei Minuten vorgeht ----------
  const reg = regulator(k, b, 3.9, 2.35, -3.97, 0, { live: true, w: 0.36, h: 1.05, case: '#3e2210' });

  // ---------- Kanonenofen ----------
  kanonenofen(b, 4.2, 0.6, 2.7);
  b.lathe([[0.274, 0.38], [0.304, 0.6], [0.284, 0.82]], 16, '#9a2a10', mat(P.METAL, 1, 0.75, 0.2), { x: 4.2, z: 0.6 });
  b.rod([4.2, 2.7, 0.6], [4.98, 2.7, 0.6], 0.07, '#1a1918', MAT.iron);
  b.box(3.8, 0, 0.2, 4.6, 0.02, 1.0, '#3a3430', MAT.stone);
  b.box(4.3, 0, 1.15, 4.65, 0.35, 1.45, '#2a2620', MAT.iron);
  for (let i = 0; i < 5; i++) b.sphere(4.4 + (i % 3) * 0.08, 0.38, 1.25 + Math.floor(i / 3) * 0.1, 0.045, 6, 4, '#141416', MAT.gloss);
  const glut = k.light([4.2, 0.55, 0.95], '#ff7a30', 3.6, 0.9, { flicker: 0.18, glow: 0.35 });

  // ---------- Stammtisch ----------
  roundTable(b, -2.2, 1.0, 0.62, 0.76, '#4a3020');
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + 0.3;
    chair(b, -2.2 + Math.sin(a) * 0.85, 1.0 + Math.cos(a) * 0.85, a + Math.PI, '#3a2416');
  }
  const uvGH = k.sign(128, 48, { bg: '#e8dcc0', fg: '#3a1a10', border: '#3a1a10', grain: false, lines: [{ t: 'Gut Holz!', y: 0.55, size: 28, font: SERIF }] });
  b.cyl(-2.2, 0.76, 1.0, 0.07, 0.06, 0.05, 10, '#2a1a10', MAT.wood);
  b.cyl(-2.2, 0.81, 1.0, 0.018, 0.018, 0.32, 8, '#3a2416', MAT.wood);
  orient(b, -2.2, 1.13, 1.0, 0, () => {
    b.box(-0.2, 0, -0.015, 0.2, 0.15, 0.015, '#3a2416', MAT.wood);
    panel(b, -0.19, 0.01, 0.19, 0.14, 0.016, uvGH);
  });
  cup(b, -2.0, 0.76, 0.75, '#d0c090', 0.035, 0.11);
  pendantLamp(k, b, -2.2, 2.3, 1.0, { top: 3.2, shade: '#5a3a1e', intensity: 0.85, range: 5.5, color: '#ffc27a' });

  // ---------- Tisch des Kutschers ----------
  roundTable(b, 2.6, 0.05, 0.42, 0.76, '#4a3020');
  chair(b, 2.6, -0.6, 0, '#3a2416');
  cup(b, 2.45, 0.76, 0.0, '#d0c090', 0.035, 0.11);
  cup(b, 2.75, 0.76, 0.12, '#e0e8e0', 0.022, 0.06);
  // Weitere Tische
  table(b, -0.3, 0.9, 0.9, 1.6, 0.76, '#4a3020');
  bench(b, -0.3, 1.75, 0.9, 2.1, 0.45, '#3a2416', false);

  // ---------- Zeitungshalter ----------
  const uvZ = k.tex(240, 120, (c, w, h) => {
    const names = ['Berliner Tageblatt', 'Kladderadatsch', 'Vossische Zeitung'];
    for (let i = 0; i < 3; i++) {
      c.save();
      c.translate(i * 80, 0);
      drawPaper(c, 80, h, { bg: '#e6dcc4', top: 16, margin: 4, lines: [{ t: names[i], size: 10, weight: 'bold' }, { rule: true, size: 6 }, ...Array.from({ length: 7 }, () => ({ t: '▬▬▬▬▬▬▬▬▬▬', size: 7, color: '#6a6050' }))] });
      c.restore();
    }
  });
  LEFTW(b, () => {
    b.box(-2.75, 1.6, 0, -1.85, 1.66, 0.12, '#3a2416', MAT.wood);
    for (let i = 0; i < 3; i++) {
      const x0 = -2.72 + i * 0.3;
      b.box(x0, 1.56, 0.07, x0 + 0.26, 1.6, 0.11, '#5a3a22', MAT.wood);
      const u0 = uvZ[0] + ((uvZ[2] - uvZ[0]) / 3) * i, u1 = uvZ[0] + ((uvZ[2] - uvZ[0]) / 3) * (i + 1) - 0.002;
      panel(b, x0 + 0.01, 1.12, x0 + 0.25, 1.56, 0.095, [u0, uvZ[1], u1, uvZ[3]]);
    }
  });

  // ---------- Tür zur Kegelbahn ----------
  const uvKeg = k.sign(192, 48, { bg: '#2a1a10', fg: '#e8d4a0', border: '#c8a060', lines: [{ t: 'Zur Kegelbahn', y: 0.55, size: 24 }] });
  RIGHTW(b, () => {
    doorway(b, -1.6, -0.4, 2.4, { color: '#4a2e1c', frame: '#2a1a10', double: true });
    panel(b, -1.5, 2.55, -0.5, 2.8, 0.06, uvKeg);
    b.box(-1.55, 2.52, 0.03, -0.45, 2.83, 0.058, '#2a1a10', MAT.wood);
  });

  // ---------- Bilder, Garderobe ----------
  // Vergilbte Photographie des Kegelclubs
  const uvFoto = k.tex(128, 96, (c, w, h) => {
    const g = c.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#bca078');
    g.addColorStop(1, '#7a6044');
    c.fillStyle = g;
    c.fillRect(0, 0, w, h);
    c.fillStyle = 'rgba(46,30,16,0.82)';
    for (let i = 0; i < 6; i++) {
      const x = 14 + i * 20, y = 30 + (i % 2) * 5;
      c.beginPath();
      c.arc(x, y, 5, 0, Math.PI * 2);
      c.fill();
      c.fillRect(x - 7, y + 5, 14, 34);
    }
    c.fillStyle = '#e8dcc0';
    c.fillRect(0, h - 18, w, 18);
    c.fillStyle = '#3a2a1a';
    c.font = `italic 10px ${SERIF}`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText('Kegelclub »Alle Neune« 1888', w / 2, h - 9);
  });
  orient(b, 4.995, 0, 2.2, -Math.PI / 2, () => framed(b, -0.32, 1.55, 0.32, 2.03, uvFoto, '#5a4020'));
  // Garderobe neben dem Fenster
  const GX = -4.55, GZ = -1.8;
  b.cyl(GX, 0, GZ, 0.15, 0.1, 0.05, 10, '#2a1a10', MAT.wood);
  b.cyl(GX, 0.05, GZ, 0.025, 0.025, 1.8, 8, '#2a1a10', MAT.wood);
  for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2; b.rod([GX, 1.75, GZ], [GX + Math.cos(a) * 0.2, 1.85, GZ + Math.sin(a) * 0.2], 0.012, '#2a1a10', MAT.wood); }
  b.ellipsoid(GX - 0.02, 1.45, GZ + 0.12, 0.15, 0.38, 0.12, 10, 8, '#2e2c28', MAT.cloth);

  // ---------- Licht, Rauch ----------
  pendantLamp(k, b, -0.9, 2.35, -2.0, { top: 3.2, shade: '#5a3a1e', intensity: 0.9, range: 6, color: '#ffc27a' });
  pendantLamp(k, b, 1.5, 2.35, -2.0, { top: 3.2, shade: '#5a3a1e', intensity: 0.8, range: 6, color: '#ffc27a' });
  k.light([-4.4, 1.8, -0.6], '#aab6c2', 4.5, 0.55);
  k.light([0, 2.8, 2.6], '#ffd8a8', 8, 0.4);
  k.mist([-4.8, 1.4, -3.8], [9.6, 1.6, 6.6], 30, [0.55, 0.46, 0.36]);
  k.dust([-4.6, 0.4, -3.6], [9.2, 2.4, 6.2], 140, [1, 0.8, 0.55]);

  // ---------- Stammgast am Tresen ----------
  const gast = new Figure(R, {
    id: 'stammgast', height: 0.96, girth: 1.08, skin: '#dcac8c', hair: '#8a8a86', hairStyle: 'grey', hat: 'cap', hatColor: '#3a3632',
    coat: 'jacket', coatColor: '#4a4436', pants: '#3a3630', mustache: 'walrus', facial: '#9a9890', pose: 'counter',
  });
  gast.setPos(1.75, -1.85).setYaw(Math.PI);
  k.root.add(gast.root);

  // ---------- Begehbarkeit ----------
  const nav = k.grid(-5, -4, 5, 3, 0.2);
  nav.walk(-4.8, -2.1, 4.8, 2.85);
  nav.block(-2.84, -2.94, 2.84, -2.26, 0.16);
  nav.blockCircle(-2.2, 1.0, 1.05, 0.12);
  nav.blockCircle(2.6, 0.05, 0.42, 0.16);
  nav.blockCircle(2.6, -0.6, 0.22, 0.1);
  nav.block(-0.3, 0.9, 0.9, 2.1, 0.14);
  nav.blockCircle(4.2, 0.6, 0.3, 0.16);
  nav.block(4.3, 1.15, 4.65, 1.45, 0.1);
  nav.blockCircle(GX, GZ, 0.18, 0.12);
  nav.blockCircle(1.75, -1.85, 0.22, 0.12);

  // ---------- Spielpunkte ----------
  k.spawn('tuer', -4.3, 1.1, Math.PI / 2);
  k.spawn('default', -4.3, 1.1, Math.PI / 2);
  k.spot('mahnke', -0.5, -3.35, 0, [-0.5, -1.75]);
  k.spot('ede', 2.6, -0.6, 0, [1.85, -0.25]);

  k.exit('k_tuer', 'Zur Straße', { box: [-5.05, 0, 0.6, -4.85, 2.5, 1.6], at: [-4.35, 1.1], face: [-5, 1.1], to: 'strasse', spawn: 'destille' });
  k.hot('k_tafel', 'Kreidetafel', { box: [-2.35, 1.2, -3.98, -0.85, 2.4, -3.9], at: [-1.6, -1.85], face: [-1.6, -3.9] });
  k.hot('k_uhr', 'Wanduhr', { box: [3.7, 1.4, -3.98, 4.1, 2.75, -3.82], at: [3.6, -1.85] });
  k.hot('k_stammtisch', 'Stammtisch', { box: [-2.85, 0.6, 0.35, -1.55, 1.3, 1.65], at: [-2.2, -0.35], face: [-2.2, 1.0] });
  k.hot('k_zeitungen', 'Zeitungshalter', { box: [-4.98, 1.1, 1.85, -4.85, 1.7, 2.75], at: [-4.2, 2.25] });
  k.hot('k_kegelbahn', 'Tür zur Kegelbahn', { box: [4.85, 0, -1.6, 5.0, 2.4, -0.4], at: [4.2, -1.0] });
  k.hot('k_ofen', 'Kanonenofen', { box: [3.92, 0, 0.32, 4.48, 1.1, 0.88], at: [3.4, 0.9] });
  k.hot('k_flaschen', 'Flaschenregal', { box: [-0.6, 1.3, -3.98, 2.6, 2.6, -3.66], at: [0.9, -1.85], face: [0.9, -3.8] });

  const env = {
    skyAmb: [0.28, 0.24, 0.2], groundAmb: [0.11, 0.085, 0.065],
    sun: { dir: [0.5, -0.82, -0.3], color: [0.24, 0.22, 0.2], shadow: { center: [0, 0.5, -0.6], radius: 6.5 } },
    fog: { color: [0.05, 0.038, 0.028], density: 0.028, start: 3 },
    background: [0.02, 0.015, 0.012],
    exposure: 1.22, sepia: 0.22, ao: 0.7, glowStrength: 0.35,
  };

  return k.finish({
    id: 'kneipe', name: 'Destille »Zum Rosenthaler Tor«', env, ambience: 'kneipe', paule: true,
    cam: {
      target: [0, 1.2, -0.8], yaw: 0, pitch: 0.6, dist: 11, fov: 42, fitWidth: 10.6, fitWidthNarrow: 6,
      follow: [0.25, 0.25], bounds: [-3, -2, 3, 1], yawRange: [-0.45, 0.45], pitchRange: [-0.25, 0.25], zoomRange: [0.6, 1.35],
    },
    update: (dt, t, g) => {
      const min = (g ? g.state.minutes : 8 * 60 + 25) + 3;
      setHands(reg.hands, min);
      gast.update(dt, t);
      glut.intensity = 0.9 + Math.sin(t * 0.7) * 0.08;
    },
  });
}
