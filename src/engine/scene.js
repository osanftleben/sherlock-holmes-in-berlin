// Szenengraph-Knoten mit Position, Euler-Rotation (Y, X, Z) und Skalierung
import { M4 } from './math.js';

export class Node {
  constructor(name = '', mesh = null) {
    this.name = name;
    this.mesh = mesh;
    this.pos = [0, 0, 0];
    this.rot = [0, 0, 0];
    this.scl = [1, 1, 1];
    this.children = [];
    this.parent = null;
    this.visible = true;
    this.local = M4.create();
    this.world = M4.create();
    this.highlight = 0;
    this.tint = [1, 1, 1];
    this.alpha = 1;
    this.texture = null;
    this.castShadow = true;
    this.data = {};
  }
  add(...nodes) {
    for (const n of nodes) {
      if (!n) continue;
      if (n.parent) n.parent.remove(n);
      n.parent = this;
      this.children.push(n);
    }
    return this;
  }
  remove(n) {
    const i = this.children.indexOf(n);
    if (i >= 0) { this.children.splice(i, 1); n.parent = null; }
  }
  setPos(x, y, z) { this.pos[0] = x; this.pos[1] = y; this.pos[2] = z; return this; }
  setRot(x, y, z) { this.rot[0] = x; this.rot[1] = y; this.rot[2] = z; return this; }
  setScale(x, y, z) { this.scl[0] = x; this.scl[1] = y ?? x; this.scl[2] = z ?? x; return this; }
  update(parentWorld) {
    M4.compose(this.local, this.pos, this.rot, this.scl);
    if (parentWorld) M4.mul(this.world, parentWorld, this.local);
    else this.world.set(this.local);
    for (const c of this.children) c.update(this.world);
  }
  traverse(fn) {
    fn(this);
    for (const c of this.children) c.traverse(fn);
  }
  // Achsenparalleler Hüllquader in Weltkoordinaten (nach update())
  worldBounds(out = null) {
    out = out || { min: [Infinity, Infinity, Infinity], max: [-Infinity, -Infinity, -Infinity] };
    if (!this.visible) return out;
    if (this.mesh && this.mesh.bounds) {
      const { min, max } = this.mesh.bounds;
      const m = this.world;
      for (let i = 0; i < 8; i++) {
        const x = i & 1 ? max[0] : min[0], y = i & 2 ? max[1] : min[1], z = i & 4 ? max[2] : min[2];
        const wx = m[0] * x + m[4] * y + m[8] * z + m[12];
        const wy = m[1] * x + m[5] * y + m[9] * z + m[13];
        const wz = m[2] * x + m[6] * y + m[10] * z + m[14];
        if (wx < out.min[0]) out.min[0] = wx; if (wx > out.max[0]) out.max[0] = wx;
        if (wy < out.min[1]) out.min[1] = wy; if (wy > out.max[1]) out.max[1] = wy;
        if (wz < out.min[2]) out.min[2] = wz; if (wz > out.max[2]) out.max[2] = wz;
      }
    }
    for (const c of this.children) c.worldBounds(out);
    return out;
  }
}
