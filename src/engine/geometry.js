// Prozedurale Geometrie: MeshBuilder sammelt Dreiecke mit Farbe, Material und UV.
// Vertex-Layout (15 Floats): pos(3) normal(3) color(3) mat(4: muster, skala, leuchten, glanz) uv(2)
import { M4, V3 } from './math.js';

const cache = new Map();
// sRGB-Hex -> lineares RGB
export function col(c) {
  if (Array.isArray(c)) return c;
  let v = cache.get(c);
  if (v) return v;
  let h = c.replace('#', '');
  if (h.length === 3) h = h.split('').map((x) => x + x).join('');
  const n = parseInt(h, 16);
  v = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((x) => Math.pow(x / 255, 2.2));
  cache.set(c, v);
  return v;
}
export function shade(c, f) {
  const v = col(c);
  return [v[0] * f, v[1] * f, v[2] * f];
}
export function mix(a, b, t) {
  const x = col(a), y = col(b);
  return [x[0] + (y[0] - x[0]) * t, x[1] + (y[1] - x[1]) * t, x[2] + (y[2] - x[2]) * t];
}

// Musterkennungen – müssen mit dem Fragment-Shader übereinstimmen
export const P = {
  PLAIN: 0, BRICK: 1, COBBLE: 2, PLANKS: 3, WALLPAPER: 4, PLASTER: 5, WOOD: 6, METAL: 7,
  GLASS: 8, TILES: 9, CLOTH: 10, TWEED: 11, SLATE: 12, PAPER: 13, STONE: 14, DIRT: 15, ASHLAR: 16, DAMASK: 17,
};
export const mat = (p = 0, scale = 1, emissive = 0, spec = 0.06) => [p, scale, emissive, spec];
export const MAT = {
  plain: mat(0, 1, 0, 0.06),
  matte: mat(0, 1, 0, 0),
  gloss: mat(0, 1, 0, 0.45),
  skin: mat(0, 1, 0, 0.12),
  brick: mat(P.BRICK, 1, 0, 0.03),
  cobble: mat(P.COBBLE, 1, 0, 0.35),
  planks: mat(P.PLANKS, 1, 0, 0.1),
  wallpaper: mat(P.WALLPAPER, 1, 0, 0.02),
  damask: mat(P.DAMASK, 1, 0, 0.05),
  plaster: mat(P.PLASTER, 1, 0, 0.02),
  wood: mat(P.WOOD, 1, 0, 0.22),
  metal: mat(P.METAL, 1, 0, 0.75),
  brass: mat(P.METAL, 1, 0, 1.0),
  iron: mat(P.METAL, 1, 0, 0.35),
  glass: mat(P.GLASS, 1, 0, 1.0),
  tiles: mat(P.TILES, 1, 0, 0.7),
  cloth: mat(P.CLOTH, 1, 0, 0.02),
  tweed: mat(P.TWEED, 1, 0, 0.02),
  slate: mat(P.SLATE, 1, 0, 0.25),
  paper: mat(P.PAPER, 1, 0, 0),
  stone: mat(P.STONE, 1, 0, 0.05),
  ashlar: mat(P.ASHLAR, 1, 0, 0.05),
  dirt: mat(P.DIRT, 1, 0, 0.15),
  glow: (e = 1) => mat(0, 1, e, 0),
};

const WHITE_UV = [0.006, 0.006];

export class MeshBuilder {
  constructor() {
    this.data = [];
    this.idx = [];
    this.m = null;
    this.nm = null;
    this.stack = [];
  }
  get count() { return this.data.length / 15; }
  get empty() { return this.idx.length === 0; }

  // --- Transformationsstapel (nachfolgende Operationen sind lokal) ---
  push() { this.stack.push(this.m ? new Float32Array(this.m) : null); return this; }
  pop() { this.m = this.stack.pop() || null; this._nm(); return this; }
  apply(t) {
    if (!this.m) this.m = new Float32Array(t);
    else M4.mul(this.m, this.m, t);
    this._nm();
    return this;
  }
  _nm() {
    if (!this.m) { this.nm = null; return; }
    if (!this.nm) this.nm = new Float32Array(9);
    M4.normalMat(this.nm, this.m);
  }
  translate(x, y, z) { return this.apply(M4.translation(x, y, z)); }
  rotateX(a) { return this.apply(M4.rotX(a)); }
  rotateY(a) { return this.apply(M4.rotY(a)); }
  rotateZ(a) { return this.apply(M4.rotZ(a)); }
  scale(x, y, z) { return this.apply(M4.scaling(x, y ?? x, z ?? x)); }

  // --- Grundelemente ---
  v(px, py, pz, nx, ny, nz, c, mt, u = WHITE_UV[0], w = WHITE_UV[1]) {
    const m = this.m;
    if (m) {
      const x = px, y = py, z = pz;
      px = m[0] * x + m[4] * y + m[8] * z + m[12];
      py = m[1] * x + m[5] * y + m[9] * z + m[13];
      pz = m[2] * x + m[6] * y + m[10] * z + m[14];
      const n = this.nm;
      const a = nx, b = ny, d = nz;
      nx = n[0] * a + n[3] * b + n[6] * d;
      ny = n[1] * a + n[4] * b + n[7] * d;
      nz = n[2] * a + n[5] * b + n[8] * d;
      const l = Math.hypot(nx, ny, nz) || 1;
      nx /= l; ny /= l; nz /= l;
    }
    this.data.push(px, py, pz, nx, ny, nz, c[0], c[1], c[2], mt[0], mt[1], mt[2], mt[3], u, w);
    return this.count - 1;
  }

  // Viereck p0(unten links) p1(unten rechts) p2(oben rechts) p3(oben links), gegen den Uhrzeigersinn von vorn
  quad(p0, p1, p2, p3, c, mt = MAT.plain, uv = null) {
    c = col(c);
    const n = V3.norm(V3.cross(V3.sub(p1, p0), V3.sub(p3, p0)));
    let u0 = WHITE_UV[0], v0 = WHITE_UV[1], u1 = u0, v1 = v0;
    if (uv) { [u0, v0, u1, v1] = uv; }
    const i = this.v(p0[0], p0[1], p0[2], n[0], n[1], n[2], c, mt, u0, v1);
    this.v(p1[0], p1[1], p1[2], n[0], n[1], n[2], c, mt, u1, v1);
    this.v(p2[0], p2[1], p2[2], n[0], n[1], n[2], c, mt, u1, v0);
    this.v(p3[0], p3[1], p3[2], n[0], n[1], n[2], c, mt, u0, v0);
    this.idx.push(i, i + 1, i + 2, i, i + 2, i + 3);
    return this;
  }

  // Achsenparalleler Quader von (x0,y0,z0) bis (x1,y1,z1)
  box(x0, y0, z0, x1, y1, z1, c, mt = MAT.plain, skip = '') {
    if (x0 > x1) [x0, x1] = [x1, x0];
    if (y0 > y1) [y0, y1] = [y1, y0];
    if (z0 > z1) [z0, z1] = [z1, z0];
    c = col(c);
    if (!skip.includes('x')) this.quad([x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], c, mt);
    if (!skip.includes('X')) this.quad([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], c, mt);
    if (!skip.includes('t')) this.quad([x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], c, mt);
    if (!skip.includes('b')) this.quad([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], c, mt);
    if (!skip.includes('z')) this.quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], c, mt);
    if (!skip.includes('Z')) this.quad([x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], c, mt);
    return this;
  }
  // Quader um Mittelpunkt
  boxC(cx, cy, cz, sx, sy, sz, c, mt = MAT.plain, skip = '') {
    return this.box(cx - sx / 2, cy - sy / 2, cz - sz / 2, cx + sx / 2, cy + sy / 2, cz + sz / 2, c, mt, skip);
  }

  // Kegelstumpf entlang +Y, Grundfläche bei (x,y,z)
  cyl(x, y, z, rb, rt, h, seg, c, mt = MAT.plain, caps = true) {
    c = col(c);
    const base = this.count;
    const slope = (rb - rt) / h;
    for (let i = 0; i <= seg; i++) {
      const a = (i / seg) * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a);
      const n = V3.norm([ca, slope, sa]);
      this.v(x + rb * ca, y, z + rb * sa, n[0], n[1], n[2], c, mt);
      this.v(x + rt * ca, y + h, z + rt * sa, n[0], n[1], n[2], c, mt);
    }
    for (let i = 0; i < seg; i++) {
      const b0 = base + i * 2, t0 = b0 + 1, b1 = base + (i + 1) * 2, t1 = b1 + 1;
      this.idx.push(b1, b0, t0, b1, t0, t1);
    }
    if (caps) {
      if (rt > 0.0001) {
        const ct = this.v(x, y + h, z, 0, 1, 0, c, mt);
        const s = this.count;
        for (let i = 0; i <= seg; i++) {
          const a = (i / seg) * Math.PI * 2;
          this.v(x + rt * Math.cos(a), y + h, z + rt * Math.sin(a), 0, 1, 0, c, mt);
        }
        for (let i = 0; i < seg; i++) this.idx.push(ct, s + i + 1, s + i);
      }
      if (rb > 0.0001) {
        const cb = this.v(x, y, z, 0, -1, 0, c, mt);
        const s = this.count;
        for (let i = 0; i <= seg; i++) {
          const a = (i / seg) * Math.PI * 2;
          this.v(x + rb * Math.cos(a), y, z + rb * Math.sin(a), 0, -1, 0, c, mt);
        }
        for (let i = 0; i < seg; i++) this.idx.push(cb, s + i, s + i + 1);
      }
    }
    return this;
  }

  // Zylindermantel mit Texturkoordinaten (z. B. Litfaßsäule)
  cylUV(x, y, z, r, h, seg, c, mt, uv) {
    c = col(c);
    const [u0, v0, u1, v1] = uv;
    const base = this.count;
    for (let i = 0; i <= seg; i++) {
      const t = i / seg, a = t * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a);
      const u = u0 + (u1 - u0) * (1 - t);
      this.v(x + r * ca, y, z + r * sa, ca, 0, sa, c, mt, u, v1);
      this.v(x + r * ca, y + h, z + r * sa, ca, 0, sa, c, mt, u, v0);
    }
    for (let i = 0; i < seg; i++) {
      const b0 = base + i * 2, t0 = b0 + 1, b1 = base + (i + 1) * 2, t1 = b1 + 1;
      this.idx.push(b1, b0, t0, b1, t0, t1);
    }
    return this;
  }

  sphere(x, y, z, r, segW, segH, c, mt = MAT.plain) {
    c = col(c);
    const base = this.count;
    for (let j = 0; j <= segH; j++) {
      const th = (j / segH) * Math.PI, st = Math.sin(th), ct = Math.cos(th);
      for (let i = 0; i <= segW; i++) {
        const ph = (i / segW) * Math.PI * 2;
        const nx = st * Math.cos(ph), ny = ct, nz = st * Math.sin(ph);
        this.v(x + r * nx, y + r * ny, z + r * nz, nx, ny, nz, c, mt);
      }
    }
    const row = segW + 1;
    for (let j = 0; j < segH; j++) {
      for (let i = 0; i < segW; i++) {
        const a = base + j * row + i, b = a + row, cc = b + 1, d = a + 1;
        this.idx.push(a, cc, b, a, d, cc);
      }
    }
    return this;
  }

  // Ellipsoid über lokale Skalierung
  ellipsoid(x, y, z, rx, ry, rz, segW, segH, c, mt = MAT.plain) {
    this.push().translate(x, y, z).scale(rx, ry, rz);
    this.sphere(0, 0, 0, 1, segW, segH, c, mt);
    return this.pop();
  }

  // Rotationskörper: Profil [[r,y],...] von unten nach oben (Außenseite rechts der Laufrichtung)
  lathe(profile, seg, c, mt = MAT.plain, o = {}) {
    c = col(c);
    const cx = o.x || 0, cy = o.y || 0, cz = o.z || 0;
    const smooth = o.smooth !== false, crease = o.crease ?? 0.55;
    const n = profile.length;
    const sn = [];
    for (let k = 0; k < n - 1; k++) {
      const dr = profile[k + 1][0] - profile[k][0], dy = profile[k + 1][1] - profile[k][1];
      const l = Math.hypot(dr, dy);
      sn.push(l < 1e-7 ? null : [dy / l, -dr / l]);
    }
    const avg = (a, b) => { const x = a[0] + b[0], y = a[1] + b[1], l = Math.hypot(x, y) || 1; return [x / l, y / l]; };
    for (let k = 0; k < n - 1; k++) {
      const s = sn[k];
      if (!s) continue;
      let nA = s, nB = s;
      if (smooth) {
        const p = k > 0 ? sn[k - 1] : null, q = k < n - 2 ? sn[k + 1] : null;
        if (p && p[0] * s[0] + p[1] * s[1] > crease) nA = avg(p, s);
        if (q && q[0] * s[0] + q[1] * s[1] > crease) nB = avg(q, s);
      }
      const base = this.count;
      const [ra, ya] = profile[k], [rb, yb] = profile[k + 1];
      for (let i = 0; i <= seg; i++) {
        const a = (i / seg) * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a);
        this.v(cx + ra * ca, cy + ya, cz + ra * sa, nA[0] * ca, nA[1], nA[0] * sa, c, mt);
        this.v(cx + rb * ca, cy + yb, cz + rb * sa, nB[0] * ca, nB[1], nB[0] * sa, c, mt);
      }
      for (let i = 0; i < seg; i++) {
        const b0 = base + i * 2, t0 = b0 + 1, b1 = base + (i + 1) * 2, t1 = b1 + 1;
        this.idx.push(b1, b0, t0, b1, t0, t1);
      }
    }
    return this;
  }

  // Scheibe in der XY-Ebene, Blickrichtung +Z (z. B. Zifferblätter)
  disc(cx, cy, cz, r, seg, c, mt = MAT.plain, uv = null) {
    c = col(c);
    let uc = WHITE_UV[0], vc = WHITE_UV[1], ru = 0, rv = 0;
    if (uv) { uc = (uv[0] + uv[2]) / 2; vc = (uv[1] + uv[3]) / 2; ru = (uv[2] - uv[0]) / 2; rv = (uv[3] - uv[1]) / 2; }
    const base = this.v(cx, cy, cz, 0, 0, 1, c, mt, uc, vc);
    for (let i = 0; i <= seg; i++) {
      const a = (i / seg) * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a);
      this.v(cx + r * ca, cy + r * sa, cz, 0, 0, 1, c, mt, uc + ru * ca, vc - rv * sa);
    }
    for (let i = 0; i < seg; i++) this.idx.push(base, base + 1 + i, base + 2 + i);
    return this;
  }

  // Zylinder entlang +Z (Uhrgehäuse, Räder …): Grundfläche bei z, Länge d
  cylZ(x, y, z, r, d, seg, c, mt = MAT.plain) {
    this.push().translate(x, y, z).rotateX(Math.PI / 2);
    this.cyl(0, 0, 0, r, r, d, seg, c, mt, true);
    return this.pop();
  }
  // Zylinder entlang +X
  cylX(x, y, z, r, d, seg, c, mt = MAT.plain) {
    this.push().translate(x, y, z).rotateZ(-Math.PI / 2);
    this.cyl(0, 0, 0, r, r, d, seg, c, mt, true);
    return this.pop();
  }

  // Dünner Stab zwischen zwei Punkten (Ketten, Geländer, Äste)
  rod(a, b, r, c, mt = MAT.plain, seg = 5) {
    const d = V3.sub(b, a), len = V3.len(d);
    if (len < 1e-5) return this;
    const dir = V3.scale(d, 1 / len);
    // Rotation, die +Y auf dir abbildet
    const yaw = Math.atan2(dir[0], dir[2]);
    const pitch = Math.acos(Math.max(-1, Math.min(1, dir[1])));
    this.push().translate(a[0], a[1], a[2]).rotateY(yaw).rotateX(pitch);
    this.cyl(0, 0, 0, r, r, len, seg, c, mt, false);
    return this.pop();
  }

  append(other) {
    const off = this.count;
    for (let i = 0; i < other.data.length; i++) this.data.push(other.data[i]);
    for (let i = 0; i < other.idx.length; i++) this.idx.push(other.idx[i] + off);
    return this;
  }
}
