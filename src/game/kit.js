// Baukasten für Schauplätze: Wände mit Öffnungen, Fenster, Türen, Möbel, Uhren, Lampen, Schilder, Partikel
import { MeshBuilder, MAT, col, mat, P, shade } from '../engine/geometry.js';
import { Node } from '../engine/scene.js';
import { NavGrid } from './nav.js';
import { Atlas, drawDial, drawSign, drawPaper, drawPoster, drawChalk, SERIF, SCRIPT } from './art.js';

export { MAT, col, mat, P, shade, SERIF, SCRIPT, drawSign, drawPaper, drawPoster, drawChalk, MeshBuilder };

const TAU = Math.PI * 2;

// Lokaler Punkt (lx,ly,lz) eines um yaw gedrehten Objekts bei (x,y,z) -> Welt
export function toWorld(x, y, z, yaw, lx, ly, lz) {
  const c = Math.cos(yaw), s = Math.sin(yaw);
  return [x + lx * c + lz * s, y + ly, z - lx * s + lz * c];
}

export function orient(b, x, y, z, yaw, fn) {
  b.push().translate(x, y, z);
  if (yaw) b.rotateY(yaw);
  fn(b);
  b.pop();
  return b;
}

export class Kit {
  constructor(R, opts = {}) {
    this.R = R;
    this.root = new Node('szene');
    this.atlas = new Atlas(opts.atlas || 1024);
    this.b = new MeshBuilder();
    this.hotspots = [];
    this.lights = [];
    this.glows = [];
    this.particles = [];
    this.anims = [];
    this.spawns = {};
    this.spots = {};
    this.named = {};
    this.nav = null;
    this._dial = null;
  }

  // ---------- Bausteine ----------
  part(name, build, o = {}) {
    const b = new MeshBuilder();
    build(b);
    const n = new Node(name, this.R.createMesh(b));
    if (o.pos) n.pos = o.pos.slice();
    if (o.rot) n.rot = o.rot.slice();
    if (o.shadow === false) n.castShadow = false;
    (o.parent || this.root).add(n);
    this.named[name] = n;
    return n;
  }
  group(name, o = {}) {
    const n = new Node(name);
    if (o.pos) n.pos = o.pos.slice();
    if (o.rot) n.rot = o.rot.slice();
    (o.parent || this.root).add(n);
    this.named[name] = n;
    return n;
  }
  hot(id, label, o = {}) {
    const h = { id, label, kind: 'look', ...o };
    this.hotspots.push(h);
    return h;
  }
  exit(id, label, o) { return this.hot(id, label, { kind: 'exit', ...o }); }
  spot(name, x, z, yaw = 0, at = null) { this.spots[name] = { x, z, yaw, at }; }
  spawn(name, x, z, yaw = 0) { this.spawns[name] = [x, z, yaw]; }
  grid(x0, z0, x1, z1, cell = 0.2) { this.nav = new NavGrid(x0, z0, x1, z1, cell); return this.nav; }
  light(pos, color, range = 6, intensity = 1, o = {}) {
    const L = { pos, color: col(color), range, intensity, flicker: o.flicker || 0, seed: Math.random() * 10, glow: o.glow || 0, glowColor: o.glowColor ? col(o.glowColor) : null };
    this.lights.push(L);
    return L;
  }
  glow(pos, color, size) {
    const G = { pos, color: col(color), size, visible: true };
    this.glows.push(G);
    return G;
  }
  rain(min, size, count = 900) {
    const p = { count, min, size, vel: [0.5, -7.5, 0.2], pointSize: 0.3, color: [0.55, 0.6, 0.66], opacity: 0.32, kind: 1, wobble: 0 };
    this.particles.push(p);
    return p;
  }
  dust(min, size, count = 240, color = [1, 0.85, 0.6]) {
    const p = { count, min, size, vel: [0.03, 0.025, 0.01], pointSize: 0.028, color, opacity: 0.22, kind: 0, wobble: 0.35 };
    this.particles.push(p);
    return p;
  }
  mist(min, size, count = 60, color = [0.5, 0.52, 0.55]) {
    const p = { count, min, size, vel: [0.12, 0.0, 0.03], pointSize: 2.2, color, opacity: 0.025, kind: 0, wobble: 0.8 };
    this.particles.push(p);
    return p;
  }

  // ---------- Texturen ----------
  tex(w, h, draw) { return this.atlas.add(w, h, draw); }
  dial() {
    if (!this._dial) this._dial = this.tex(192, 192, (c, w, h) => drawDial(c, w, h));
    return this._dial;
  }
  sign(w, h, o) { return this.tex(w, h, (c, W, H) => drawSign(c, W, H, o)); }
  paper(w, h, o) { return this.tex(w, h, (c, W, H) => drawPaper(c, W, H, o)); }
  poster(w, h, o) { return this.tex(w, h, (c, W, H) => drawPoster(c, W, H, o)); }
  chalk(w, h, lines) { return this.tex(w, h, (c, W, H) => drawChalk(c, W, H, lines)); }

  finish(o) {
    const stat = new Node('statisch', this.R.createMesh(this.b));
    if (stat.mesh) this.root.add(stat);
    const tex = this.atlas.upload(this.R);
    this.root.traverse((n) => { if (n.mesh) n.texture = tex; });
    const env = o.env;
    env.lights = this.lights;
    const world = { root: new Node('welt'), env, glows: this.glows, particles: this.particles };
    world.root.add(this.root);
    const anims = this.anims;
    return {
      id: o.id, name: o.name, world, root: this.root, nav: this.nav,
      cam: o.cam, titleCam: o.titleCam, spawns: this.spawns, spots: this.spots,
      hotspots: this.hotspots, ambience: o.ambience, paule: o.paule, nodes: this.named,
      onEnter: o.onEnter, navMod: o.navMod,
      update: (dt, t, g) => { for (const a of anims) a(dt, t, g); if (o.update) o.update(dt, t, g); },
    };
  }
}

// ---------- Wände ----------
// Wand in der lokalen XY-Ebene, Vorderseite bei z=0 (Blick +Z), Dicke nach hinten; holes: [{x0,x1,y0,y1}]
export function wall(b, x0, x1, y0, y1, holes, c, mt, t = 0.18) {
  const hs = holes.slice().sort((a, b2) => a.x0 - b2.x0);
  let x = x0;
  for (const h of hs) {
    if (h.x0 > x) b.box(x, y0, -t, h.x0, y1, 0, c, mt);
    if (h.y0 > y0) b.box(h.x0, y0, -t, h.x1, h.y0, 0, c, mt);
    if (h.y1 < y1) b.box(h.x0, h.y1, -t, h.x1, y1, 0, c, mt);
    x = h.x1;
  }
  if (x < x1) b.box(x, y0, -t, x1, y1, 0, c, mt);
}
// Rückwand bei z (Blick +Z)
export function wallZ(b, z, x0, x1, y0, y1, holes, c, mt, t = 0.18) {
  orient(b, 0, 0, z, 0, () => wall(b, x0, x1, y0, y1, holes, c, mt, t));
}
// Seitenwand bei x; dir=+1 Blick +X (linke Wand), dir=-1 Blick -X (rechte Wand); holes: [{z0,z1,y0,y1}]
export function wallX(b, x, z0, z1, y0, y1, holes, c, mt, t = 0.18, dir = 1) {
  if (dir > 0) {
    orient(b, x, 0, 0, Math.PI / 2, () => wall(b, -z1, -z0, y0, y1, holes.map((h) => ({ x0: -h.z1, x1: -h.z0, y0: h.y0, y1: h.y1 })), c, mt, t));
  } else {
    orient(b, x, 0, 0, -Math.PI / 2, () => wall(b, z0, z1, y0, y1, holes.map((h) => ({ x0: h.z0, x1: h.z1, y0: h.y0, y1: h.y1 })), c, mt, t));
  }
}

// Raumhülle: Boden, Rückwand, Seitenwände, Vertäfelung, Fußleiste, Gesims
export function room(b, o) {
  const { x0, x1, z0, z1, h } = o;
  const t = o.t || 0.2;
  b.box(x0 - t, -0.15, z0 - t, x1 + t, 0, z1, o.floor || '#6e5034', o.floorMat || MAT.planks);
  const back = o.backHoles || [], left = o.leftHoles || [], right = o.rightHoles || [];
  wallZ(b, z0, x0, x1, 0, h, back, o.wall, o.wallMat || MAT.wallpaper, t);
  wallX(b, x0, z0, z1, 0, h, left, o.wall, o.wallMat || MAT.wallpaper, t, 1);
  wallX(b, x1, z0, z1, 0, h, right, o.wall, o.wallMat || MAT.wallpaper, t, -1);
  // Schnittkanten der Wände dunkel (Diorama)
  const cap = o.cap || '#2a1d14';
  b.box(x0 - t, h, z0 - t, x1 + t, h + 0.04, z0, cap, MAT.matte);
  b.box(x0 - t, h, z0, x0, h + 0.04, z1, cap, MAT.matte);
  b.box(x1, h, z0, x1 + t, h + 0.04, z1, cap, MAT.matte);
  const lim = (holes, y) => holes.map((q) => ({ ...q, y0: Math.min(q.y0, y), y1: Math.max(q.y1, y) }));
  if (o.wainscot) {
    const wh = o.wainscotH || 1.0, wc = o.wainscot;
    const bh = lim(back, wh).filter((q) => q.y0 < wh), lh = lim(left, wh).filter((q) => q.y0 < wh), rh = lim(right, wh).filter((q) => q.y0 < wh);
    wallZ(b, z0 + 0.035, x0, x1, 0, wh, bh, wc, MAT.wood, 0.035);
    wallX(b, x0 + 0.035, z0 + 0.035, z1, 0, wh, lh, wc, MAT.wood, 0.035, 1);
    wallX(b, x1 - 0.035, z0 + 0.035, z1, 0, wh, rh, wc, MAT.wood, 0.035, -1);
    const rail = shade(wc, 0.75);
    wallZ(b, z0 + 0.06, x0, x1, wh - 0.05, wh + 0.02, bh, rail, MAT.wood, 0.03);
    wallX(b, x0 + 0.06, z0 + 0.06, z1, wh - 0.05, wh + 0.02, lh, rail, MAT.wood, 0.03, 1);
    wallX(b, x1 - 0.06, z0 + 0.06, z1, wh - 0.05, wh + 0.02, rh, rail, MAT.wood, 0.03, -1);
  }
  if (o.cornice) {
    const cc = o.cornice;
    wallZ(b, z0 + 0.08, x0, x1, h - 0.14, h, [], cc, MAT.plaster, 0.08);
    wallX(b, x0 + 0.08, z0 + 0.08, z1, h - 0.14, h, [], cc, MAT.plaster, 0.08, 1);
    wallX(b, x1 - 0.08, z0 + 0.08, z1, h - 0.14, h, [], cc, MAT.plaster, 0.08, -1);
  }
}

// ---------- Fenster und Türen (lokal: Blick +Z, Öffnung x0..x1, y0..y1, Wand bei z=0 mit Dicke nach hinten) ----------
export function windowFrame(b, x0, x1, y0, y1, o = {}) {
  const fc = o.frame || '#3b2a1c', t = o.bar || 0.055, d = o.depth || 0.18;
  b.box(x0, y0, -d, x0 + t, y1, 0.015, fc, MAT.wood);
  b.box(x1 - t, y0, -d, x1, y1, 0.015, fc, MAT.wood);
  b.box(x0, y1 - t, -d, x1, y1, 0.015, fc, MAT.wood);
  b.box(x0, y0, -d, x1, y0 + t, 0.015, fc, MAT.wood);
  b.box(x0 - 0.05, y0 - 0.06, -d, x1 + 0.05, y0, 0.09, o.sill || fc, MAT.wood);
  const gz = -d * 0.55;
  const cols = o.cols ?? 2, rows = o.rows ?? 2;
  for (let i = 1; i < cols; i++) {
    const x = x0 + ((x1 - x0) * i) / cols;
    b.box(x - t / 2, y0, gz - 0.02, x + t / 2, y1, gz + 0.02, fc, MAT.wood);
  }
  for (let j = 1; j < rows; j++) {
    const y = y0 + (y1 - y0) * (j === 1 && rows === 2 ? (o.transom ?? 0.66) : j / rows);
    b.box(x0, y - t / 2, gz - 0.02, x1, y + t / 2, gz + 0.02, fc, MAT.wood);
  }
  const gm = o.lit ? mat(P.GLASS, 1, o.lit, 1) : MAT.glass;
  if (o.glass !== false) b.quad([x0, y0, gz], [x1, y0, gz], [x1, y1, gz], [x0, y1, gz], o.glass || '#8b9ba4', gm);
  if (o.back && o.glass !== false) b.quad([x1, y0, gz - 0.005], [x0, y0, gz - 0.005], [x0, y1, gz - 0.005], [x1, y1, gz - 0.005], o.glassBack || o.glass || '#8b9ba4', o.backLit ? mat(P.GLASS, 1, o.backLit, 1) : MAT.glass);
  if (o.curtain) {
    const cc = o.curtain;
    b.box(x0 + 0.02, y0 + 0.1, 0.02, x0 + 0.02 + (x1 - x0) * 0.22, y1 - 0.04, 0.06, cc, MAT.cloth);
    b.box(x1 - 0.02 - (x1 - x0) * 0.22, y0 + 0.1, 0.02, x1 - 0.02, y1 - 0.04, 0.06, cc, MAT.cloth);
    b.box(x0 - 0.08, y1 - 0.02, 0.0, x1 + 0.08, y1 + 0.18, 0.08, shade(cc, 0.8), MAT.cloth);
  }
}

export function doorway(b, x0, x1, y1, o = {}) {
  const fc = o.frame || '#3b2a1c', d = o.depth || 0.18;
  b.box(x0 - 0.09, 0, -d, x0, y1 + 0.1, 0.05, fc, MAT.wood);
  b.box(x1, 0, -d, x1 + 0.09, y1 + 0.1, 0.05, fc, MAT.wood);
  b.box(x0 - 0.09, y1, -d, x1 + 0.09, y1 + 0.12, 0.05, fc, MAT.wood);
  if (o.open) return;
  const pc = o.color || '#4a2e1c';
  const z = o.inset ?? -d + 0.06;
  b.box(x0, 0, z - 0.05, x1, y1, z, pc, MAT.wood);
  const w = x1 - x0;
  const leaves = o.double ? 2 : 1;
  for (let l = 0; l < leaves; l++) {
    const a = x0 + (w / leaves) * l, e = a + w / leaves;
    const m = 0.09;
    if (o.glass) {
      b.box(a + m, y1 * 0.5, z, e - m, y1 - m, z + 0.01, '#7f8f98', o.lit ? mat(P.GLASS, 1, o.lit, 1) : MAT.glass);
      b.box(a + m, m + 0.1, z, e - m, y1 * 0.5 - 0.08, z + 0.03, shade(pc, 1.15), MAT.wood);
    } else {
      b.box(a + m, y1 * 0.55, z, e - m, y1 - m, z + 0.03, shade(pc, 1.15), MAT.wood);
      b.box(a + m, m + 0.1, z, e - m, y1 * 0.55 - 0.1, z + 0.03, shade(pc, 1.15), MAT.wood);
    }
    if (leaves === 2 && l === 0) b.box(e - 0.01, 0, z, e + 0.01, y1, z + 0.035, shade(pc, 0.7), MAT.wood);
  }
  b.sphere(o.knobLeft ? x0 + 0.1 : x1 - 0.1, 1.02, z + 0.04, 0.035, 8, 6, '#c9a45a', MAT.brass);
}

// ---------- Möbel ----------
export function table(b, x0, z0, x1, z1, h = 0.78, c = '#5a3a22', o = {}) {
  const tt = o.top || 0.05;
  b.box(x0, h - tt, z0, x1, h, z1, o.topColor || c, MAT.wood);
  b.box(x0 + 0.03, h - tt - 0.1, z0 + 0.03, x1 - 0.03, h - tt, z1 - 0.03, shade(c, 0.8), MAT.wood);
  const l = 0.05, i = 0.05;
  for (const [x, z] of [[x0 + i, z0 + i], [x1 - i - l, z0 + i], [x0 + i, z1 - i - l], [x1 - i - l, z1 - i - l]]) b.box(x, 0, z, x + l, h - tt, z + l, shade(c, 0.85), MAT.wood);
}
export function roundTable(b, x, z, r = 0.45, h = 0.76, c = '#5a3a22') {
  b.cyl(x, h - 0.05, z, r, r, 0.05, 20, c, MAT.wood);
  b.cyl(x, 0.06, z, 0.05, 0.05, h - 0.1, 8, shade(c, 0.8), MAT.wood);
  b.cyl(x, 0, z, 0.26, 0.08, 0.07, 12, shade(c, 0.8), MAT.wood);
}
// Stuhl, Sitzfläche zeigt nach +Z (lokal); yaw wie die sitzende Figur
export function chair(b, x, z, yaw = 0, c = '#4a2e1c', o = {}) {
  orient(b, x, 0, z, yaw, () => {
    const s = o.seat || 0.45, w = 0.21;
    b.box(-w, s - 0.05, -w, w, s, w, o.cushion || c, o.cushion ? MAT.cloth : MAT.wood);
    for (const [lx, lz] of [[-w, -w], [w - 0.04, -w], [-w, w - 0.04], [w - 0.04, w - 0.04]]) b.box(lx, 0, lz, lx + 0.04, s - 0.05, lz + 0.04, c, MAT.wood);
    b.box(-w, s, -w, -w + 0.04, s + 0.5, -w + 0.04, c, MAT.wood);
    b.box(w - 0.04, s, -w, w, s + 0.5, -w + 0.04, c, MAT.wood);
    b.box(-w, s + 0.32, -w, w, s + 0.48, -w + 0.03, c, MAT.wood);
    if (o.arms) {
      b.box(-w - 0.03, s + 0.18, -w, -w + 0.02, s + 0.23, w, c, MAT.wood);
      b.box(w - 0.02, s + 0.18, -w, w + 0.03, s + 0.23, w, c, MAT.wood);
    }
  });
}
export function stool(b, x, z, h = 0.5, c = '#5a3a22') {
  b.cyl(x, h - 0.05, z, 0.18, 0.18, 0.05, 14, c, MAT.wood);
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * TAU + 0.4;
    b.rod([x + Math.cos(a) * 0.1, h - 0.05, z + Math.sin(a) * 0.1], [x + Math.cos(a) * 0.17, 0, z + Math.sin(a) * 0.17], 0.02, c, MAT.wood);
  }
}
export function bench(b, x0, z0, x1, z1, h = 0.45, c = '#5a3a22', back = false) {
  b.box(x0, h - 0.05, z0, x1, h, z1, c, MAT.wood);
  b.box(x0 + 0.05, 0, z0 + 0.04, x0 + 0.1, h - 0.05, z1 - 0.04, c, MAT.wood);
  b.box(x1 - 0.1, 0, z0 + 0.04, x1 - 0.05, h - 0.05, z1 - 0.04, c, MAT.wood);
  if (back) b.box(x0, h, z0, x1, h + 0.45, z0 + 0.04, c, MAT.wood);
}
export function shelf(b, x0, x1, y, z0, z1, c = '#5a3a22', brackets = true) {
  b.box(x0, y - 0.03, z0, x1, y, z1, c, MAT.wood);
  if (brackets) for (const x of [x0 + 0.1, x1 - 0.12]) b.box(x, y - 0.18, z0, x + 0.025, y - 0.03, z0 + 0.12, shade(c, 0.8), MAT.wood);
}
export function cabinet(b, x0, z0, x1, z1, h, c = '#4a2e1c', o = {}) {
  b.box(x0, 0, z0, x1, h, z1, c, MAT.wood);
  b.box(x0 - 0.02, h, z0 - 0.02, x1 + 0.02, h + 0.04, z1 + 0.02, shade(c, 1.15), MAT.wood);
  const front = o.front || 'z';
  const n = o.drawers || 0;
  if (n) {
    for (let i = 0; i < n; i++) {
      const y0 = 0.08 + ((h - 0.12) * i) / n, y1 = 0.08 + ((h - 0.12) * (i + 1)) / n - 0.025;
      if (front === 'z') { b.box(x0 + 0.03, y0, z1, x1 - 0.03, y1, z1 + 0.015, shade(c, 1.1), MAT.wood); b.box((x0 + x1) / 2 - 0.05, (y0 + y1) / 2 - 0.01, z1 + 0.015, (x0 + x1) / 2 + 0.05, (y0 + y1) / 2 + 0.01, z1 + 0.03, '#c9a45a', MAT.brass); }
      if (front === 'X') { b.box(x0 - 0.015, y0, z0 + 0.03, x0, y1, z1 - 0.03, shade(c, 1.1), MAT.wood); b.box(x0 - 0.03, (y0 + y1) / 2 - 0.01, (z0 + z1) / 2 - 0.05, x0 - 0.015, (y0 + y1) / 2 + 0.01, (z0 + z1) / 2 + 0.05, '#c9a45a', MAT.brass); }
      if (front === 'x') { b.box(x1, y0, z0 + 0.03, x1 + 0.015, y1, z1 - 0.03, shade(c, 1.1), MAT.wood); b.box(x1 + 0.015, (y0 + y1) / 2 - 0.01, (z0 + z1) / 2 - 0.05, x1 + 0.03, (y0 + y1) / 2 + 0.01, (z0 + z1) / 2 + 0.05, '#c9a45a', MAT.brass); }
    }
  }
}
export function counter(b, x0, z0, x1, z1, h = 0.98, c = '#4a2e1c', top = '#6b4a2e') {
  b.box(x0, 0, z0, x1, h - 0.05, z1, c, MAT.wood);
  b.box(x0 - 0.04, h - 0.05, z0 - 0.04, x1 + 0.04, h, z1 + 0.04, top, MAT.wood);
  b.box(x0 + 0.02, 0, z1, x1 - 0.02, 0.1, z1 + 0.02, shade(c, 0.6), MAT.wood);
  const n = Math.max(1, Math.round((x1 - x0) / 0.7));
  for (let i = 0; i < n; i++) {
    const a = x0 + 0.06 + ((x1 - x0 - 0.12) * i) / n, e = x0 + 0.06 + ((x1 - x0 - 0.12) * (i + 1)) / n - 0.06;
    b.box(a, 0.18, z1, e, h - 0.16, z1 + 0.02, shade(c, 1.15), MAT.wood);
  }
}
export function vitrine(b, x0, z0, x1, z1, h = 1.0, c = '#4a2e1c', o = {}) {
  b.box(x0, 0, z0, x1, h - 0.3, z1, c, MAT.wood);
  b.box(x0, h - 0.3, z0, x1, h - 0.27, z1, '#d8ccb0', MAT.cloth);
  const g = o.glass || '#9fb0b8';
  b.box(x0, h - 0.27, z0, x0 + 0.02, h, z1, c, MAT.wood);
  b.box(x1 - 0.02, h - 0.27, z0, x1, h, z1, c, MAT.wood);
  b.box(x0, h - 0.27, z0, x1, h, z0 + 0.02, c, MAT.wood);
  b.box(x0, h - 0.27, z1 - 0.02, x1, h, z1, c, MAT.wood);
  if (o.glassTop !== false) b.quad([x0, h, z1], [x1, h, z1], [x1, h, z0], [x0, h, z0], g, mat(P.GLASS, 1, 0, 1));
}
export function bottle(b, x, y, z, c = '#2a4a2a', h = 0.3, r = 0.04) {
  b.cyl(x, y, z, r, r, h * 0.62, 10, c, MAT.glass);
  b.cyl(x, y + h * 0.62, z, r, r * 0.35, h * 0.14, 10, c, MAT.glass);
  b.cyl(x, y + h * 0.76, z, r * 0.33, r * 0.33, h * 0.24, 8, c, MAT.glass);
}
export function cup(b, x, y, z, c = '#d8d0c0', r = 0.035, h = 0.08) {
  b.cyl(x, y, z, r * 0.85, r, h, 10, c, MAT.glass);
}
export function crate(b, x0, y0, z0, x1, y1, z1, c = '#7a5a34') {
  b.box(x0, y0, z0, x1, y1, z1, c, MAT.wood);
  const s = shade(c, 0.75);
  b.box(x0 - 0.01, y0 + 0.02, z1, x1 + 0.01, y0 + 0.06, z1 + 0.01, s, MAT.wood);
  b.box(x0 - 0.01, y1 - 0.06, z1, x1 + 0.01, y1 - 0.02, z1 + 0.01, s, MAT.wood);
}
export function barrel(b, x, z, r = 0.3, h = 0.8, c = '#6a4a2a') {
  b.lathe([[r * 0.85, 0], [r, h * 0.25], [r * 1.05, h * 0.5], [r, h * 0.75], [r * 0.85, h], [0, h]], 16, c, MAT.wood, { x, z });
  for (const y of [0.1, h - 0.12]) b.cyl(x, y, z, r * 0.92, r * 0.92, 0.04, 16, '#2a2a2a', MAT.iron, false);
}
export function rug(b, x0, z0, x1, z1, c = '#6a2a22', border = '#c9a45a') {
  b.box(x0, 0, z0, x1, 0.012, z1, border, MAT.cloth);
  b.box(x0 + 0.08, 0.012, z0 + 0.08, x1 - 0.08, 0.016, z1 - 0.08, c, MAT.cloth);
}
// Gerahmtes Bild/Dokument an der Wand (lokal Blick +Z)
export function framed(b, x0, y0, x1, y1, uv, frame = '#5a3a1c', o = {}) {
  const f = o.border ?? 0.035;
  b.box(x0 - f, y0 - f, 0, x1 + f, y1 + f, 0.025, frame, o.frameMat || MAT.wood);
  b.quad([x0, y0, 0.027], [x1, y0, 0.027], [x1, y1, 0.027], [x0, y1, 0.027], '#ffffff', o.mat || MAT.paper, uv);
}
// Textfläche (lokal Blick +Z)
export function panel(b, x0, y0, x1, y1, z, uv, c = '#ffffff', mt = MAT.paper) {
  b.quad([x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z], c, mt, uv);
}
// Straßenkulisse hinter einem Fenster der linken Wand (Außenseite bei x = xo, Blick +X in den Raum):
// flacher, nach außen geschlossener Lichtkasten, damit die Kulisse nur durch das Fenster zu sehen ist.
// draw(c, w, h) malt die Ansicht; links im Bild = +Z (vom Raum aus gesehen).
export function windowBackdrop(k, b, xo, z0, z1, y0, y1, draw, o = {}) {
  const d = o.depth ?? 0.4, mz = o.marginZ ?? 0.6;
  const X = xo - d, Z0 = z0 - mz, Z1 = z1 + mz, Y0 = Math.max(0.02, y0 - (o.marginBottom ?? 0.55)), Y1 = y1 + (o.marginTop ?? 0.35);
  const ppm = o.ppm || 96;
  const uv = k.tex(Math.round((Z1 - Z0) * ppm), Math.round((Y1 - Y0) * ppm), draw);
  b.quad([X, Y0, Z1], [X, Y0, Z0], [X, Y1, Z0], [X, Y1, Z1], '#ffffff', mat(P.PLAIN, 1, o.glow ?? 0.75, 0), uv);
  const c = o.color || '#3e3a34', t = 0.06;
  b.box(X - t, Y0 - t, Z0 - t, xo, Y0, Z1 + t, c, MAT.stone);
  b.box(X - t, Y1, Z0 - t, xo, Y1 + t, Z1 + t, c, MAT.stone);
  b.box(X - t, Y0, Z0 - t, xo, Y1, Z0, c, MAT.stone);
  b.box(X - t, Y0, Z1, xo, Y1, Z1 + t, c, MAT.stone);
  b.box(X - t, Y0, Z0, X - 0.004, Y1, Z1, c, MAT.stone);
  return uv;
}
// Kachelofen (lokal: Front +Z, Mitte unten)
export function kachelofen(b, w = 0.8, d = 0.8, h = 2.1, c = '#5f7a5a') {
  b.box(-w / 2 - 0.05, 0, -d / 2 - 0.05, w / 2 + 0.05, 0.25, d / 2 + 0.05, shade(c, 0.6), MAT.stone);
  b.box(-w / 2, 0.25, -d / 2, w / 2, h - 0.35, d / 2, c, mat(P.TILES, 1.25, 0, 0.6));
  b.box(-w / 2 - 0.04, h - 0.35, -d / 2 - 0.04, w / 2 + 0.04, h - 0.27, d / 2 + 0.04, shade(c, 1.2), MAT.tiles);
  b.box(-w / 2 + 0.06, h - 0.27, -d / 2 + 0.06, w / 2 - 0.06, h - 0.07, d / 2 - 0.06, c, mat(P.TILES, 1.25, 0, 0.6));
  b.box(-w / 2 - 0.03, h - 0.07, -d / 2 - 0.03, w / 2 + 0.03, h, d / 2 + 0.03, shade(c, 1.2), MAT.tiles);
  b.box(-0.14, 0.42, d / 2, 0.14, 0.7, d / 2 + 0.03, '#2a2622', MAT.iron);
  b.box(-0.1, 0.46, d / 2 + 0.03, 0.1, 0.66, d / 2 + 0.045, '#3a342e', MAT.iron);
  b.sphere(0.07, 0.56, d / 2 + 0.06, 0.018, 6, 4, '#c9a45a', MAT.brass);
}
// Gusseiserner Kanonenofen (Mitte unten)
export function kanonenofen(b, x, z, pipeTo = 3.2) {
  b.cyl(x, 0, z, 0.26, 0.24, 0.12, 14, '#1e1c1a', MAT.iron);
  b.lathe([[0.2, 0.12], [0.27, 0.35], [0.3, 0.6], [0.28, 0.85], [0.22, 1.0], [0.12, 1.08], [0.07, 1.1]], 16, '#232120', MAT.iron, { x, z });
  b.box(x - 0.1, 0.42, z + 0.25, x + 0.1, 0.62, z + 0.31, '#3a2e26', mat(P.METAL, 1, 0.9, 0.3));
  b.cyl(x, 1.08, z, 0.07, 0.07, pipeTo - 1.08, 10, '#1a1918', MAT.iron, false);
}

// ---------- Lampen ----------
export function gasWallLamp(k, b, x, y, z, yaw = 0, o = {}) {
  orient(b, x, y, z, yaw, () => {
    b.box(-0.04, -0.06, 0, 0.04, 0.06, 0.03, '#c9a45a', MAT.brass);
    b.rod([0, 0, 0.02], [0, 0.05, 0.22], 0.012, '#c9a45a', MAT.brass);
    b.cyl(0, 0.05, 0.24, 0.03, 0.05, 0.03, 10, '#c9a45a', MAT.brass);
    b.lathe([[0.05, 0.08], [0.085, 0.14], [0.09, 0.2], [0.06, 0.27], [0.035, 0.28]], 12, o.glass || '#f6e2b8', mat(P.GLASS, 1, 1.6, 0.6), { z: 0.24 });
  });
  const p = toWorld(x, y, z, yaw, 0, 0.18, 0.24);
  return k.light(p, o.color || '#ffc77a', o.range || 5.5, o.intensity ?? 1.1, { flicker: 0.05, glow: o.glow ?? 0.55 });
}
export function pendantLamp(k, b, x, y, z, o = {}) {
  const top = o.top || 3.2;
  b.rod([x, top, z], [x, y + 0.3, z], 0.01, '#2a2420', MAT.iron);
  b.lathe([[0.04, y + 0.15], [0.3, y + 0.03], [0.32, y + 0.05], [0.04, y + 0.18]], 18, o.shade || '#2f4a3a', mat(P.METAL, 1, 0, 0.5), { x, z, smooth: false });
  b.cyl(x, y + 0.18, z, 0.04, 0.03, 0.12, 8, '#c9a45a', MAT.brass, false);
  b.sphere(x, y + 0.06, z, 0.07, 10, 8, '#fff0d0', MAT.glow(2.2));
  return k.light([x, y - 0.05, z], o.color || '#ffd08a', o.range || 6.5, o.intensity ?? 1.2, { flicker: o.flicker ?? 0.03, glow: o.glow ?? 0.7 });
}
export function petroleumLamp(k, b, x, y, z, o = {}) {
  b.cyl(x, y, z, 0.07, 0.05, 0.03, 12, '#c9a45a', MAT.brass);
  b.lathe([[0.05, 0.03], [0.08, 0.08], [0.075, 0.14], [0.03, 0.17]], 12, '#c9a45a', MAT.brass, { x, y, z });
  b.lathe([[0.03, 0.17], [0.05, 0.22], [0.035, 0.32], [0.028, 0.36]], 12, '#f4ead8', mat(P.GLASS, 1, o.lit === false ? 0 : 1.4, 0.7), { x, y, z });
  if (o.lit === false) return null;
  return k.light([x, y + 0.3, z], o.color || '#ffc070', o.range || 4.5, o.intensity ?? 0.9, { flicker: 0.07, glow: 0.45 });
}
export function streetLamp(k, b, x, z, o = {}) {
  const h = o.h || 3.3;
  b.cyl(x, 0, z, 0.13, 0.11, 0.35, 10, '#1f2420', MAT.iron);
  b.cyl(x, 0.35, z, 0.06, 0.045, h - 0.55, 8, '#1f2420', MAT.iron);
  b.box(x - 0.18, h - 0.32, z - 0.02, x + 0.18, h - 0.28, z + 0.02, '#1f2420', MAT.iron);
  b.cyl(x, h - 0.22, z, 0.09, 0.18, 0.04, 4, '#1f2420', MAT.iron);
  b.lathe([[0.12, h - 0.18], [0.2, h + 0.15], [0.2, h + 0.18]], 4, '#f2dca8', mat(P.GLASS, 1, 2.4, 0.8), { x, z, smooth: false });
  b.cyl(x, h + 0.18, z, 0.25, 0.05, 0.14, 4, '#1f2420', MAT.iron);
  b.sphere(x, h + 0.34, z, 0.04, 6, 4, '#1f2420', MAT.iron);
  return k.light([x, h + 0.02, z], o.color || '#ffc36e', o.range || 9, o.intensity ?? 1.5, { flicker: 0.04, glow: o.glow ?? 1.6 });
}

// ---------- Uhren (lokal: Blick +Z) ----------
const STOP = 23 * 60 + 15;
function hand(b, a, len, w, z, c) {
  b.push().translate(0, 0, z).rotateZ(-a);
  b.box(-w / 2, -len * 0.18, 0, w / 2, len, 0.005, c, MAT.gloss);
  b.box(-w * 0.9, len * 0.62, 0, w * 0.9, len * 0.7, 0.005, c, MAT.gloss);
  b.pop();
}
export function clockHands(b, r, min, z, c = '#15100b') {
  const hA = ((((min / 60) % 12) + 12) % 12 / 12) * TAU, mA = (((min % 60) + 60) % 60 / 60) * TAU;
  hand(b, hA, r * 0.5, Math.max(0.008, r * 0.075), z, c);
  hand(b, mA, r * 0.78, Math.max(0.006, r * 0.05), z + 0.004, c);
  b.cylZ(0, 0, z, r * 0.06, 0.012, 8, '#c9a45a', MAT.brass);
}
// Bewegliche Zeiger als eigene Knoten (für gehende Uhren); Rückgabe {h, m}
export function liveHands(k, x, y, z, yaw, r, zf) {
  const p = toWorld(x, y, z, yaw, 0, 0, zf);
  const mk = (len, w, dz) => k.part('zeiger', (b) => {
    b.box(-w / 2, -len * 0.18, dz, w / 2, len, dz + 0.005, '#15100b', MAT.gloss);
    b.box(-w * 0.9, len * 0.62, dz, w * 0.9, len * 0.7, dz + 0.005, '#15100b', MAT.gloss);
  }, { pos: p, rot: [0, yaw, 0], shadow: false });
  return { h: mk(r * 0.5, Math.max(0.008, r * 0.075), 0), m: mk(r * 0.78, Math.max(0.006, r * 0.05), 0.004) };
}
export function setHands(hands, min) {
  hands.h.rot[2] = -((((min / 60) % 12) / 12) * TAU);
  hands.m.rot[2] = -(((min % 60) / 60) * TAU);
}
function dialFace(k, b, r, z, min, o) {
  b.cylZ(0, 0, z - 0.008, r * 1.06, 0.008, 22, o.bezel || '#c9a45a', MAT.brass);
  b.disc(0, 0, z + 0.001, r, 24, o.face || '#ffffff', MAT.paper, k.dial());
  if (!o.live) clockHands(b, r, min, z + 0.003);
}
// Runde Wanduhr
export function roundClock(k, b, x, y, z, yaw = 0, o = {}) {
  const r = o.r || 0.15, min = o.min ?? STOP;
  orient(b, x, y, z, yaw, () => {
    b.cylZ(0, 0, 0, r * 1.2, 0.05, 22, o.case || '#5a3a22', MAT.wood);
    dialFace(k, b, r, 0.058, min, o);
  });
  return o.live ? liveHands(k, x, y, z, yaw, r, 0.066) : null;
}
// Wiener Regulator: y = Mitte Zifferblatt, Gehäuse darunter
export function regulator(k, b, x, y, z, yaw = 0, o = {}) {
  const min = o.min ?? STOP, w = o.w || 0.38, hgt = o.h || 1.1, dep = 0.13, cc = o.case || '#4a2a16';
  const r = w * 0.34;
  orient(b, x, y, z, yaw, () => {
    const top = r + 0.08, bot = top - hgt;
    b.box(-w / 2, bot, 0, w / 2, top, 0.02, shade(cc, 0.55), MAT.wood);
    b.box(-w / 2, bot, 0.02, -w / 2 + 0.035, top, dep, cc, MAT.wood);
    b.box(w / 2 - 0.035, bot, 0.02, w / 2, top, dep, cc, MAT.wood);
    b.box(-w / 2 - 0.03, bot - 0.07, 0, w / 2 + 0.03, bot, dep + 0.02, cc, MAT.wood);
    b.box(-w / 2 - 0.03, top, 0, w / 2 + 0.03, top + 0.05, dep + 0.02, cc, MAT.wood);
    b.box(-w * 0.28, top + 0.05, 0.01, w * 0.28, top + 0.12, dep - 0.02, cc, MAT.wood);
    b.sphere(0, top + 0.16, dep / 2, 0.03, 8, 6, '#c9a45a', MAT.brass);
    b.box(-w / 2 + 0.03, -r - 0.04, dep - 0.02, w / 2 - 0.03, -r - 0.015, dep, cc, MAT.wood);
    b.box(-w / 2 + 0.03, bot, dep - 0.02, w / 2 - 0.03, bot + 0.03, dep, cc, MAT.wood);
    dialFace(k, b, r, 0.05, min, o);
    // Gewichte
    for (const gx of o.weights === 1 ? [0.0] : [-w * 0.22, w * 0.22]) {
      const gy = bot + 0.35 + (o.weightDrop || 0) * 0.1;
      b.rod([gx, -r - 0.05, 0.05], [gx, gy + 0.2, 0.05], 0.004, '#9a8a60', MAT.brass);
      b.cyl(gx, gy, 0.05, 0.028, 0.028, 0.2, 10, '#c9a45a', MAT.brass);
    }
    if (!o.live) {
      const L = hgt - r - 0.3;
      b.push().translate(0, -r - 0.06, 0.07).rotateZ(o.tilt || 0);
      b.box(-0.006, -L, -0.004, 0.006, 0, 0.004, '#c9a45a', MAT.brass);
      b.cylZ(0, -L, -0.012, 0.065, 0.024, 18, '#d8b86a', MAT.brass);
      b.pop();
      if (o.paper) {
        b.box(-0.045, -r - 0.32, 0.075, 0.045, -r - 0.2, 0.083, '#f4f0e4', MAT.paper);
        b.box(-0.012, -r - 0.33, 0.02, 0.012, -r - 0.19, 0.075, '#f4f0e4', MAT.paper);
      }
    }
  });
  let pend = null;
  if (o.live) {
    const L = hgt - r - 0.3;
    pend = k.part('pendel', (pb) => {
      pb.box(-0.006, -L, -0.004, 0.006, 0, 0.004, '#c9a45a', MAT.brass);
      pb.cylZ(0, -L, -0.012, 0.065, 0.024, 18, '#d8b86a', MAT.brass);
    }, { pos: toWorld(x, y, z, yaw, 0, -r - 0.06, 0.07), rot: [0, yaw, 0] });
    const ph = Math.random() * TAU, sp = o.speed || Math.PI * 2 / 2.0;
    k.anims.push((dt, t) => { pend.rot[2] = Math.sin(t * sp + ph) * 0.07; });
  }
  const hands = o.live ? liveHands(k, x, y, z, yaw, r, 0.058) : null;
  return { hands, pend };
}
// Stutzuhr / Tischuhr: y = Standfläche
export function mantelClock(k, b, x, y, z, yaw = 0, o = {}) {
  const min = o.min ?? STOP, s = o.s || 1, cc = o.case || '#4a2a16';
  orient(b, x, y, z, yaw, () => {
    b.scale(s, s, s);
    b.box(-0.2, 0, -0.11, 0.2, 0.04, 0.11, shade(cc, 0.8), MAT.wood);
    b.box(-0.17, 0.04, -0.09, 0.17, 0.36, 0.09, cc, MAT.wood);
    b.cylZ(0, 0.36, -0.09, 0.17, 0.18, 18, cc, MAT.wood);
    b.box(-0.18, 0.34, -0.1, 0.18, 0.37, 0.1, shade(cc, 1.2), MAT.wood);
    b.sphere(0, 0.56, 0, 0.03, 8, 6, '#c9a45a', MAT.brass);
    for (const fx of [-0.15, 0.15]) b.sphere(fx, 0.0, 0.08, 0.025, 6, 4, '#c9a45a', MAT.brass);
    b.push().translate(0, 0.3, 0);
    dialFace(k, b, 0.11, 0.095, min, o);
    b.pop();
  });
  return o.live ? liveHands(k, x, y + 0.3 * s, z, yaw, 0.11 * s, 0.098 * s) : null;
}
// Standuhr: Boden bei y=0
export function longcase(k, b, x, z, yaw = 0, o = {}) {
  const min = o.min ?? STOP, cc = o.case || '#3e2412';
  orient(b, x, 0, z, yaw, () => {
    b.box(-0.27, 0, -0.17, 0.27, 0.42, 0.17, cc, MAT.wood);
    b.box(-0.29, 0.42, -0.18, 0.29, 0.47, 0.18, shade(cc, 1.15), MAT.wood);
    b.box(-0.21, 0.47, -0.14, 0.21, 1.55, 0.14, cc, MAT.wood);
    b.box(-0.15, 0.62, 0.14, 0.15, 1.45, 0.15, o.live ? shade(cc, 0.42) : shade(cc, 1.18), MAT.wood);
    b.box(-0.27, 1.55, -0.17, 0.27, 2.08, 0.17, cc, MAT.wood);
    b.box(-0.3, 2.08, -0.19, 0.3, 2.14, 0.19, shade(cc, 1.2), MAT.wood);
    b.box(-0.2, 2.14, -0.12, 0.2, 2.24, 0.12, cc, MAT.wood);
    for (const fx of [-0.18, 0, 0.18]) b.sphere(fx, 2.28, 0, 0.035, 8, 6, '#c9a45a', MAT.brass);
    b.push().translate(0, 1.82, 0);
    dialFace(k, b, 0.18, 0.175, min, o);
    b.pop();
  });
  if (!o.live) return null;
  const hands = liveHands(k, x, 1.82, z, yaw, 0.18, 0.178);
  // Pendel hinter dem Fenster des Mittelteils
  const pend = k.part('pendel', (pb) => {
    pb.box(-0.006, -0.62, -0.004, 0.006, 0, 0.004, '#c9a45a', MAT.brass);
    pb.cylZ(0, -0.62, -0.012, 0.075, 0.024, 18, '#d8b86a', MAT.brass);
  }, { pos: toWorld(x, 0, z, yaw, 0, 1.5, 0.155), rot: [0, yaw, 0], shadow: false });
  const ph = Math.random() * TAU;
  k.anims.push((dt, t) => { pend.rot[2] = Math.sin(t * Math.PI + ph) * 0.06; });
  return { ...hands, pend };
}
// Schwarzwälder Schilduhr mit Vorderpendel, Ketten und Gewichten; y = Zifferblattmitte
export function blackForest(k, b, x, y, z, yaw = 0, o = {}) {
  const min = o.min ?? STOP;
  const paint = o.paint || '#e9dcb8';
  orient(b, x, y, z, yaw, () => {
    b.box(-0.15, -0.2, -0.2, 0.15, 0.15, 0, '#4a2e18', MAT.wood);
    b.box(-0.23, -0.24, 0, 0.23, 0.17, 0.035, paint, MAT.wood);
    b.cylZ(0, 0.17, 0, 0.23, 0.035, 20, paint, MAT.wood);
    b.box(-0.235, -0.245, 0.035, 0.235, -0.22, 0.045, '#8a2a22', MAT.wood);
    b.box(-0.235, -0.245, 0.035, -0.21, 0.17, 0.045, '#8a2a22', MAT.wood);
    b.box(0.21, -0.245, 0.035, 0.235, 0.17, 0.045, '#8a2a22', MAT.wood);
    for (let i = 0; i < 6; i++) {
      const a = 0.4 + (i / 5) * (Math.PI - 0.8);
      b.sphere(Math.cos(a) * 0.19, 0.17 + Math.sin(a) * 0.19, 0.04, 0.025, 6, 4, ['#b33a2a', '#3a7a3a', '#d8b040'][i % 3], MAT.matte);
    }
    dialFace(k, b, 0.13, 0.045, min, { ...o, bezel: '#7a5a2a' });
    // Ketten und Gewichte (Gehgewicht links)
    const top = -0.45;
    const drop = o.drop ?? 0.68, sdrop = o.strikeDrop ?? 0.52;
    for (const [gx, d] of [[-0.07, drop], [0.07, sdrop]]) {
      const gy = top - d;
      b.rod([gx, -0.2, -0.08], [gx, gy, -0.08], 0.005, '#8a7a5a', MAT.metal);
      b.lathe([[0.0, gy - 0.24], [0.035, gy - 0.2], [0.048, gy - 0.12], [0.045, gy - 0.04], [0.03, gy], [0.0, gy + 0.01]], 10, '#4a3a26', MAT.wood, { x: gx, z: -0.08 });
      b.sphere(gx, gy + 0.01, -0.08, 0.012, 6, 4, '#8a7a5a', MAT.metal);
    }
    // Pendel vorn
    b.push().translate(0, -0.22, 0.07).rotateZ(o.tilt || 0);
    b.box(-0.006, -0.62, -0.004, 0.006, 0, 0.004, '#3a2a1a', MAT.wood);
    b.cylZ(0, -0.62, -0.01, 0.07, 0.02, 16, '#c9a45a', MAT.brass);
    b.pop();
  });
}
// Gewichte am Schwarzwälder: lathe braucht absolute Mitte – Hilfsfunktion korrigiert x
export function pineWeight(b, x, y, z) {
  b.lathe([[0.0, -0.24], [0.035, -0.2], [0.048, -0.12], [0.045, -0.04], [0.03, 0], [0.0, 0.01]], 10, '#4a3a26', MAT.wood, { x, y, z });
}

// ---------- Kleinkram ----------
export function books(b, x0, x1, y, z0, z1, seed = 1) {
  let x = x0, s = seed;
  const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  const cols = ['#5a2a22', '#2a3a4a', '#3a4a2a', '#6a5a3a', '#4a2a3a', '#2a2a2a', '#7a4a2a'];
  while (x < x1 - 0.03) {
    const w = 0.03 + rnd() * 0.035, h = 0.18 + rnd() * 0.1;
    b.box(x, y, z0 + rnd() * 0.03, Math.min(x + w, x1), y + h, z1, cols[Math.floor(rnd() * cols.length)], MAT.cloth);
    x += w + 0.004;
  }
}
export function tools(b, x0, x1, y, z) {
  for (let x = x0, i = 0; x < x1; x += 0.07, i++) {
    const len = 0.12 + (i % 3) * 0.04;
    b.box(x, y - len, z, x + 0.012, y, z + 0.012, i % 2 ? '#8a8a8a' : '#6a4a2a', i % 2 ? MAT.metal : MAT.wood);
  }
}
