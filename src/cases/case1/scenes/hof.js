// Schauplatz: Hinterhof von Nr. 38 – Portiersloge, Kohlenverschlag, Plumpe, Wäscheleinen
import {
  Kit, MAT, mat, P, shade, orient, wall, wallX, wallZ, windowFrame, doorway, framed, panel, barrel, gasWallLamp,
  SERIF, drawPaper,
} from '../../../game/kit.js';

const LEFTW = (b, fn) => orient(b, -5, 0, 0, Math.PI / 2, fn); // lokale x = −Welt-z
const RIGHTW = (b, fn) => orient(b, 5, 0, 0, -Math.PI / 2, fn); // lokale x = Welt-z
const rnd = (seed) => { let s = seed; return () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; };

function upperWindows(b, list, y0, y1, seed, o = {}) {
  const R = rnd(seed);
  for (const [x0, x1] of list) {
    const lit = R() < (o.lit ?? 0.3);
    windowFrame(b, x0, x1, y0, y1, { frame: o.frame || '#3a2c1e', glass: lit ? '#e8a85a' : '#4a5258', lit: lit ? 0.5 + R() * 0.4 : 0, curtain: R() < 0.5 ? '#d0c8b4' : null, sill: '#6a6458' });
  }
}

// Kahler Baum aus Ästen
function tree(b, x, z, seed) {
  const R = rnd(seed);
  const c = '#2e2620';
  const branch = (p, dir, len, r, depth) => {
    const e = [p[0] + dir[0] * len, p[1] + dir[1] * len, p[2] + dir[2] * len];
    b.rod(p, e, r, c, MAT.wood, depth > 2 ? 6 : 4);
    if (depth <= 0 || r < 0.012) return;
    const n = depth > 2 ? 3 : 2;
    for (let i = 0; i < n; i++) {
      const a = R() * Math.PI * 2;
      const nd = [dir[0] * 0.55 + Math.cos(a) * 0.6, dir[1] * 0.75 + 0.25, dir[2] * 0.55 + Math.sin(a) * 0.6];
      const l = Math.hypot(...nd);
      branch(e, nd.map((v) => v / l), len * (0.62 + R() * 0.2), r * 0.62, depth - 1);
    }
  };
  b.cyl(x, 0, z, 0.2, 0.15, 0.4, 10, c, MAT.wood);
  branch([x, 0.3, z], [0.05, 1, 0.02], 2.3, 0.15, 4);
}

export function build(R) {
  const k = new Kit(R, { atlas: 1024 });
  const b = k.b;
  const H = 9.2;

  // ---------- Boden ----------
  b.box(-5.2, -0.2, -5.2, 5.2, 0, 3, '#5a554c', mat(P.COBBLE, 1.1, 0, 0.4));
  b.cyl(1.2, -0.19, -2.5, 1.1, 1.1, 0.195, 18, '#4a3e30', mat(P.DIRT, 1.4, 0, 0.3));
  b.box(-0.6, 0, -1.2, 0.6, 0.004, 3, '#4e4a42', mat(P.STONE, 1, 0, 0.6));

  // ---------- Vorderhaus (links): Durchfahrt, Portiersloge, Werkstatt ----------
  wallX(b, -5, -5.2, 3, 0, 4.0, [
    { z0: 0.2, z1: 2.9, y0: 0, y1: 3.4 }, { z0: -1.2, z1: -0.4, y0: 0, y1: 2.4 },
    { z0: -2.75, z1: -2.0, y0: 1.0, y1: 2.3 }, { z0: -3.9, z1: -3.0, y0: 0, y1: 2.4 },
  ], '#7e786c', mat(P.PLASTER, 1, 0, 0.03), 0.3, 1);
  const leftUp = [[-2.6, -1.5], [-0.4, 0.7], [1.8, 2.9], [3.8, 4.9]].map(([a, e]) => ({ x0: a, x1: e }));
  LEFTW(b, () => {
    wall(b, -3, 5.2, 4.0, H, [...leftUp.map((w) => ({ ...w, y0: 4.6, y1: 6.3 })), ...leftUp.map((w) => ({ ...w, y0: 7.1, y1: 8.8 }))], '#878072', mat(P.PLASTER, 1, 0, 0.03), 0.3);
    upperWindows(b, leftUp.map((w) => [w.x0, w.x1]), 4.6, 6.3, 3);
    upperWindows(b, leftUp.map((w) => [w.x0, w.x1]), 7.1, 8.8, 4);
    b.box(-3, 3.95, 0, 5.2, 4.1, 0.1, '#6e685c', MAT.plaster);
    b.box(-3, H, -0.3, 5.2, H + 0.04, 0.05, '#17120d', MAT.matte);
    // Durchfahrt mit Bogen
    const cx = -1.55, r = 1.35, sy = 2.05;
    for (let y = sy; y < 3.4; y += 0.08) {
      const yy = Math.min(3.4, y + 0.08), ym = (y + yy) / 2;
      const hw = Math.sqrt(Math.max(0, r * r - (ym - sy) * (ym - sy)));
      b.box(-2.9, y, -0.3, cx - hw, yy, 0, '#7e786c', MAT.plaster);
      b.box(cx + hw, y, -0.3, -0.2, yy, 0, '#7e786c', MAT.plaster);
    }
    b.box(-2.9, -0.2, -4.0, -0.2, 0, -0.3, '#4e4a42', mat(P.COBBLE, 1.2, 0, 0.3));
    b.box(-3.1, 0, -4.0, -2.9, 3.4, -0.3, '#6e685a', MAT.plaster);
    b.box(-0.2, 0, -4.0, 0.0, 3.4, -0.3, '#6e685a', MAT.plaster);
    b.box(-3.1, 3.38, -4.0, 0.0, 3.6, -0.3, '#5a5448', MAT.plaster);
    b.quad([-2.9, 0, -3.9], [-0.2, 0, -3.9], [-0.2, 3.4, -3.9], [-2.9, 3.4, -3.9], '#8e969e', mat(P.PLASTER, 1, 0.45, 0));
    // Portiersloge
    doorway(b, 0.4, 1.2, 2.4, { glass: true, lit: 0.45, color: '#3e3022', frame: '#2a2018' });
    b.box(0.25, 0, 0, 1.35, 0.12, 0.35, '#6a665c', MAT.stone);
    // Werkstattfenster mit Gitter
    windowFrame(b, 2.0, 2.75, 1.0, 2.3, { frame: '#2a2018', cols: 2, rows: 2, glass: '#d89850', lit: 0.4, sill: '#5a564c' });
    for (let i = 1; i < 5; i++) b.rod([2.0 + i * 0.15, 1.0, 0.05], [2.0 + i * 0.15, 2.3, 0.05], 0.01, '#1e1c1a', MAT.iron);
    // Hintertür der Werkstatt
    doorway(b, 3.0, 3.9, 2.4, { color: '#4a3020', frame: '#3a2618', knobLeft: true });
    b.box(2.85, 0, 0, 4.05, 0.1, 0.3, '#6a665c', MAT.stone);
    // Fallrohr
    b.cyl(4.6, 0, 0.12, 0.06, 0.06, H, 8, '#4a4a48', MAT.metal, false);
  });
  // Hausordnung
  const uvHO = k.tex(160, 224, (c, w, h) => drawPaper(c, w, h, { bg: '#ebe2c8', frame: '#3a2a1a', top: 26, margin: 12, lines: [
    { t: 'Haus-Ordnung', size: 18, weight: 'bold' }, { t: 'Rosenthaler Str. 38', size: 10, style: 'italic' }, { rule: true, size: 8 },
    { t: '§ 1. Ruhe und Reinlichkeit', size: 10, align: 'left' }, { t: '§ 2. Teppichklopfen nur Sonnabends', size: 10, align: 'left' },
    { t: '§ 3. Kein Wasser verschütten', size: 10, align: 'left' }, { t: '§ 4. Die Hausthür wird um', size: 10, align: 'left', weight: 'bold' },
    { t: '10 Uhr Abends verschlossen.', size: 10, align: 'left', weight: 'bold' }, { t: 'Später Einlaß gegen Sperrgeld', size: 10, align: 'left', weight: 'bold' },
    { t: 'bei der Portiersfrau.', size: 10, align: 'left', weight: 'bold' }, { gap: 6 }, { t: 'Der Hauswirth: W. Prause', size: 10, style: 'italic' }] }));
  LEFTW(b, () => framed(b, 1.4, 1.25, 1.8, 1.95, uvHO, '#3a2a1a'));
  gasWallLamp(k, b, -4.98, 2.65, -0.8, Math.PI / 2, { intensity: 0.9, range: 5 });

  // ---------- Hinterhaus (hinten) ----------
  wallZ(b, -5, -5.2, 5.2, 0, H, [
    { x0: -0.5, x1: 0.6, y0: 0, y1: 2.5 },
    { x0: -3.6, x1: -2.6, y0: 1.1, y1: 2.6 }, { x0: 2.0, x1: 3.0, y0: 1.1, y1: 2.6 },
    ...[[-3.6, -2.6], [-1.4, -0.4], [0.8, 1.8], [3.0, 4.0]].flatMap(([a, e]) => [{ x0: a, x1: e, y0: 4.3, y1: 6.0 }, { x0: a, x1: e, y0: 6.9, y1: 8.6 }]),
  ], '#8a8274', mat(P.PLASTER, 1, 0, 0.03), 0.3);
  orient(b, 0, 0, -5, 0, () => {
    doorway(b, -0.5, 0.6, 2.5, { color: '#3e2e20', frame: '#2a2018', double: true });
    b.box(-0.7, 0, 0, 0.8, 0.14, 0.4, '#6a665c', MAT.stone);
    upperWindows(b, [[-3.6, -2.6], [2.0, 3.0]], 1.1, 2.6, 8, { lit: 0.5 });
    upperWindows(b, [[-3.6, -2.6], [-1.4, -0.4], [0.8, 1.8], [3.0, 4.0]], 4.3, 6.0, 9);
    upperWindows(b, [[-3.6, -2.6], [-1.4, -0.4], [0.8, 1.8], [3.0, 4.0]], 6.9, 8.6, 10);
    b.box(-5.2, 3.6, 0, 5.2, 3.75, 0.1, '#6e685c', MAT.plaster);
    b.box(-5.2, H, -0.3, 5.2, H + 0.04, 0.05, '#17120d', MAT.matte);
    const uvAuf = k.sign(160, 40, { bg: '#e8e0cc', fg: '#2a2018', grain: false, lines: [{ t: 'Hinterhaus · Aufgang B', y: 0.55, size: 18 }] });
    panel(b, -0.45, 2.62, 0.55, 2.87, 0.02, uvAuf);
  });

  // ---------- Brandmauer (rechts) ----------
  wallX(b, 5, -5.2, 3, 0, H, [], '#7a4a36', mat(P.BRICK, 1, 0, 0.03), 0.3, -1);
  const uvAd = k.tex(512, 160, (c, w, h) => {
    c.fillStyle = 'rgba(0,0,0,0)';
    c.clearRect(0, 0, w, h);
    c.fillStyle = '#7a4a36'; c.fillRect(0, 0, w, h);
    c.fillStyle = 'rgba(230,220,190,0.5)';
    c.font = `bold 70px ${SERIF}`; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText('KOHLEN · KOKS', w / 2, 56);
    c.font = `bold 34px ${SERIF}`;
    c.fillText('Briketts frei Haus – Gebr. Sasse', w / 2, 122);
  });
  RIGHTW(b, () => {
    panel(b, -3.8, 5.4, 1.6, 7.0, 0.004, uvAd, '#ffffff', mat(P.BRICK, 1, 0, 0.02));
    b.box(-5.2, H, -0.3, 3, H + 0.04, 0.05, '#17120d', MAT.matte);
  });

  // ---------- Kohlenverschlag mit Eimer ----------
  const kc = '#5a4630';
  b.box(4.05, 0, 0.3, 4.95, 2.05, 1.7, kc, MAT.wood);
  for (let z = 0.35; z < 1.7; z += 0.17) b.box(4.03, 0.05, z, 4.05, 2.0, z + 0.12, shade(kc, 0.85 + (z * 7 % 1) * 0.3), MAT.wood);
  b.box(3.98, 2.0, 0.25, 5.0, 2.12, 1.75, '#3a2e22', MAT.wood);
  b.box(4.01, 0.1, 0.55, 4.03, 1.85, 1.35, '#4a3a28', MAT.wood);
  b.box(3.99, 1.0, 1.25, 4.02, 1.08, 1.3, '#1e1c1a', MAT.iron);
  b.box(3.96, 1.45, 1.53, 4.0, 1.5, 1.57, '#1e1c1a', MAT.iron);
  b.cyl(3.86, 1.05, 1.55, 0.12, 0.15, 0.32, 12, '#3a3a3a', MAT.iron);
  b.rod([3.74, 1.38, 1.55], [3.98, 1.38, 1.55], 0.008, '#2a2a2a', MAT.iron);
  const uvCFT = k.sign(64, 32, { bg: '#3a3a3a', fg: '#e8e0c8', grain: false, lines: [{ t: 'C. F. T.', y: 0.55, size: 18 }] });
  orient(b, 3.86, 0, 1.55, -Math.PI / 2, () => panel(b, -0.08, 1.12, 0.08, 1.2, 0.152, uvCFT));
  for (let i = 0; i < 9; i++) b.sphere(4.2 + (i % 3) * 0.12, 0.05, 1.8 + Math.floor(i / 3) * 0.1, 0.05, 6, 4, '#16161a', MAT.gloss);

  // ---------- Plumpe ----------
  const px = 4.35, pz = -1.0, pc = '#2e3a34';
  b.box(px - 0.4, 0, pz - 0.4, px + 0.4, 0.1, pz + 0.4, '#6a665c', MAT.stone);
  b.cyl(px, 0.1, pz, 0.16, 0.13, 1.55, 12, pc, MAT.iron);
  b.lathe([[0.19, 1.65], [0.15, 1.8], [0.05, 1.98], [0, 2.0]], 12, pc, MAT.iron, { x: px, z: pz });
  b.cyl(px, 1.62, pz, 0.19, 0.19, 0.06, 12, pc, MAT.iron);
  b.rod([px - 0.1, 0.95, pz], [px - 0.42, 0.72, pz], 0.04, pc, MAT.iron);
  b.rod([px + 0.05, 1.5, pz], [px + 0.15, 1.75, pz + 0.7], 0.03, pc, MAT.iron);
  b.box(px - 0.75, 0, pz - 0.3, px - 0.4, 0.3, pz + 0.3, '#5a5a56', MAT.stone);
  const uvPl = k.paper(96, 64, { bg: '#f0ead8', top: 18, lines: [{ t: 'Wasser nur', size: 12 }, { t: 'abgekocht', size: 14, weight: 'bold' }, { t: 'trinken!', size: 12 }] });
  orient(b, px, 0, pz, -Math.PI / 2, () => panel(b, -0.1, 1.15, 0.1, 1.29, 0.155, uvPl));

  // ---------- Müllkästen ----------
  for (const [z0, z1, c] of [[-3.85, -3.25, '#4a4234'], [-3.15, -2.6, '#3e382c']]) {
    b.box(4.35, 0, z0, 4.95, 0.85, z1, c, MAT.wood);
    b.box(4.3, 0.85, z0 - 0.04, 5.0, 0.92, z1 + 0.04, shade(c, 0.8), MAT.wood);
  }
  b.cyl(4.1, 0, -2.4, 0.04, 0.04, 0.24, 8, '#4a6a5a', MAT.glass);
  b.box(4.0, 0, -2.55, 4.08, 0.03, -2.48, '#4a6a5a', MAT.glass);

  // ---------- Teppichstange, Regentonne, Handwagen ----------
  for (const x of [1.9, 3.5]) b.cyl(x, 0, 1.95, 0.035, 0.035, 1.85, 8, '#2a2a28', MAT.iron);
  b.rod([1.9, 1.82, 1.95], [3.5, 1.82, 1.95], 0.03, '#2a2a28', MAT.iron);
  barrel(b, -4.5, -4.45, 0.32, 0.85, '#5a4228');
  b.box(2.45, 0.2, -4.75, 3.45, 0.55, -4.25, '#6a5034', MAT.wood);
  b.cylX(2.4, 0.26, -4.5, 0.26, 0.05, 12, '#3a2a1c', MAT.wood);
  b.cylX(3.45, 0.26, -4.5, 0.26, 0.05, 12, '#3a2a1c', MAT.wood);
  b.rod([2.95, 0.5, -4.25], [2.95, 0.95, -3.5], 0.02, '#4a3a28', MAT.wood);

  // ---------- Baum und Wäscheleinen ----------
  tree(b, 1.2, -2.5, 17);
  const Rw = rnd(5);
  for (const [z, y0, y1] of [[-1.4, 3.3, 3.1], [-3.4, 3.5, 3.3]]) {
    b.rod([-4.95, y0, z], [4.95, y1, z], 0.008, '#c8c0b0', MAT.cloth);
    for (let x = -3.8; x < 3.8; x += 0.75 + Rw() * 0.6) {
      const t = (x + 4.95) / 9.9, y = y0 + (y1 - y0) * t - Math.sin(t * Math.PI) * 0.12;
      const w = 0.3 + Rw() * 0.4, h = 0.4 + Rw() * 0.5;
      b.box(x - w / 2, y - h, z - 0.015, x + w / 2, y, z + 0.015, ['#e4e0d6', '#c8c4b8', '#b8c4cc', '#d8ccb4'][Math.floor(Rw() * 4)], MAT.cloth);
    }
  }

  // ---------- Licht, Wetter ----------
  k.light([-5.6, 1.8, -2.4], '#ffc070', 3.2, 0.7, { flicker: 0.04 });
  k.light([0.05, 2.9, -4.6], '#e8c090', 4.0, 0.5, { flicker: 0.03 });
  k.light([0, 4.5, 2.5], '#c8d0dc', 10, 0.45);
  k.rain([-5, 0, -5], [10, 9.5, 8], 520);
  k.mist([-5, 0.3, -5], [10, 2.5, 8], 26, [0.4, 0.42, 0.46]);

  // ---------- Begehbarkeit ----------
  const nav = k.grid(-5, -5, 5, 3, 0.2);
  nav.walk(-4.75, -4.75, 4.75, 2.85);
  nav.blockCircle(1.2, -2.5, 0.22, 0.16);
  nav.block(4.05, 0.3, 4.95, 1.7, 0.14);
  nav.blockCircle(3.86, 1.55, 0.15, 0.06);
  nav.block(px - 0.75, pz - 0.4, px + 0.4, pz + 0.4, 0.1);
  nav.block(4.3, -3.9, 5, -2.55, 0.14);
  nav.blockCircle(1.9, 1.95, 0.05, 0.16);
  nav.blockCircle(3.5, 1.95, 0.05, 0.16);
  nav.blockCircle(-4.5, -4.45, 0.33, 0.12);
  nav.block(2.4, -4.75, 3.5, -4.25, 0.1);

  // ---------- Spielpunkte ----------
  k.spawn('durchfahrt', -4.0, 1.6, Math.PI / 2);
  k.spawn('default', -4.0, 1.6, Math.PI / 2);
  k.spawn('werkstatt', -4.2, -3.45, Math.PI / 2);
  k.spot('schulze', -4.25, -0.8, Math.PI / 2, [-3.3, -0.7]);
  k.spot('prause', 0.8, 0.4, -0.6);

  k.exit('h_durchfahrt', 'Durchfahrt zur Straße', { box: [-5.2, 0, 0.2, -4.9, 3.4, 2.9], at: [-4.3, 1.55], face: [-5, 1.55], to: 'strasse', spawn: 'tor' });
  k.exit('h_hintertuer', 'Hintertür der Werkstatt', { box: [-5.15, 0, -3.9, -4.9, 2.4, -3.0], at: [-4.3, -3.45], face: [-5, -3.45], to: 'werkstatt', spawn: 'hof' });
  k.hot('h_hausordnung', 'Hausordnung', { box: [-5.0, 1.25, -1.8, -4.9, 1.95, -1.4], at: [-4.15, -1.6] });
  k.hot('h_kohlen', 'Kohlenverschlag', { box: [3.7, 0.9, 1.35, 4.05, 1.45, 1.75], at: [3.25, 1.2] });
  k.hot('h_plumpe', 'Plumpe', { box: [px - 0.45, 0, pz - 0.25, px + 0.25, 2.0, pz + 0.25], at: [3.2, -0.7] });
  k.hot('h_teppich', 'Teppichstange', { box: [1.85, 1.0, 1.85, 3.55, 1.9, 2.05], at: [2.7, 1.3] });
  k.hot('h_muell', 'Müllkästen', { box: [4.3, 0, -3.9, 5.0, 0.95, -2.55], at: [3.65, -3.2] });
  k.hot('h_hinterhaus', 'Aufgang zum Hinterhaus', { box: [-0.5, 0, -5.05, 0.6, 2.5, -4.85], at: [0.05, -4.2] });
  k.hot('h_fenster', 'Werkstattfenster', { box: [-5.05, 1.0, -2.75, -4.85, 2.3, -2.0], at: [-4.2, -2.35] });
  k.hot('h_baum', 'Kastanie', { box: [0.9, 0.3, -2.8, 1.5, 2.6, -2.2], at: [1.25, -1.65] });

  const env = {
    skyAmb: [0.42, 0.45, 0.5], groundAmb: [0.12, 0.12, 0.13],
    sun: { dir: [-0.25, -1, -0.4], color: [0.26, 0.28, 0.32], shadow: { center: [0, 0, -1], radius: 7.5 } },
    fog: { color: [0.18, 0.19, 0.21], density: 0.022, start: 6 },
    exposure: 1.15, sepia: 0.18, ao: 0.7, glowStrength: 0.4,
  };

  return k.finish({
    id: 'hof', name: 'Hinterhof', env, ambience: 'hof', paule: true,
    cam: {
      target: [0, 1.2, -1.0], yaw: 0, pitch: 0.6, dist: 12, fov: 42, fitWidth: 11, fitWidthNarrow: 6.5,
      follow: [0.3, 0.3], bounds: [-3, -3, 3, 1], yawRange: [-0.45, 0.45], pitchRange: [-0.25, 0.25], zoomRange: [0.6, 1.35],
    },
  });
}
