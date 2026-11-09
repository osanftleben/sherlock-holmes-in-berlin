// Begehbarkeitsraster mit A*-Wegsuche und Wegglättung
export class NavGrid {
  constructor(x0, z0, x1, z1, cell = 0.2) {
    this.x0 = x0; this.z0 = z0; this.cell = cell;
    this.w = Math.ceil((x1 - x0) / cell);
    this.h = Math.ceil((z1 - z0) / cell);
    this.g = new Uint8Array(this.w * this.h);
  }
  ci(x) { return Math.floor((x - this.x0) / this.cell); }
  cj(z) { return Math.floor((z - this.z0) / this.cell); }
  cx(i) { return this.x0 + (i + 0.5) * this.cell; }
  cz(j) { return this.z0 + (j + 0.5) * this.cell; }
  ok(i, j) { return i >= 0 && j >= 0 && i < this.w && j < this.h && this.g[j * this.w + i] === 1; }
  _rect(x0, z0, x1, z1, v) {
    if (x0 > x1) [x0, x1] = [x1, x0];
    if (z0 > z1) [z0, z1] = [z1, z0];
    for (let j = 0; j < this.h; j++) {
      const z = this.cz(j);
      if (z < z0 || z > z1) continue;
      for (let i = 0; i < this.w; i++) {
        const x = this.cx(i);
        if (x >= x0 && x <= x1) this.g[j * this.w + i] = v;
      }
    }
    return this;
  }
  walk(x0, z0, x1, z1) { return this._rect(x0, z0, x1, z1, 1); }
  block(x0, z0, x1, z1, pad = 0.18) { return this._rect(x0 - pad, z0 - pad, x1 + pad, z1 + pad, 0); }
  blockCircle(x, z, r, pad = 0.18) {
    const R = r + pad;
    for (let j = 0; j < this.h; j++) for (let i = 0; i < this.w; i++) {
      if (Math.hypot(this.cx(i) - x, this.cz(j) - z) <= R) this.g[j * this.w + i] = 0;
    }
    return this;
  }
  isWalkable(x, z) { return this.ok(this.ci(x), this.cj(z)); }
  nearest(x, z) {
    let bi = this.ci(x), bj = this.cj(z);
    if (this.ok(bi, bj)) return [x, z];
    let best = null, bd = Infinity;
    for (let r = 1; r < Math.max(this.w, this.h); r++) {
      for (let dj = -r; dj <= r; dj++) for (let di = -r; di <= r; di++) {
        if (Math.abs(di) !== r && Math.abs(dj) !== r) continue;
        const i = bi + di, j = bj + dj;
        if (!this.ok(i, j)) continue;
        const d = Math.hypot(this.cx(i) - x, this.cz(j) - z);
        if (d < bd) { bd = d; best = [this.cx(i), this.cz(j)]; }
      }
      if (best) return best;
    }
    return [x, z];
  }
  los(ax, az, bx, bz) {
    const d = Math.hypot(bx - ax, bz - az);
    const n = Math.ceil(d / (this.cell * 0.4));
    for (let k = 0; k <= n; k++) {
      const t = k / Math.max(1, n);
      if (!this.isWalkable(ax + (bx - ax) * t, az + (bz - az) * t)) return false;
    }
    return true;
  }
  // Liefert Wegpunkte (ohne Startpunkt) oder [] wenn bereits da / unerreichbar
  path(from, to) {
    const [tx, tz] = this.nearest(to[0], to[1]);
    let [fx, fz] = from;
    if (!this.isWalkable(fx, fz)) [fx, fz] = this.nearest(fx, fz);
    if (Math.hypot(tx - from[0], tz - from[1]) < 0.05) return [];
    if (this.los(fx, fz, tx, tz)) return [[tx, tz]];
    const si = this.ci(fx), sj = this.cj(fz), gi = this.ci(tx), gj = this.cj(tz);
    const W = this.w, N = W * this.h;
    const gs = new Float32Array(N).fill(Infinity);
    const came = new Int32Array(N).fill(-1);
    const closed = new Uint8Array(N);
    const heap = [];
    const push = (f, k) => {
      heap.push([f, k]);
      let i = heap.length - 1;
      while (i > 0) { const p = (i - 1) >> 1; if (heap[p][0] <= heap[i][0]) break; [heap[p], heap[i]] = [heap[i], heap[p]]; i = p; }
    };
    const pop = () => {
      const top = heap[0], last = heap.pop();
      if (heap.length) {
        heap[0] = last;
        let i = 0;
        for (;;) {
          const l = i * 2 + 1, r = l + 1;
          let m = i;
          if (l < heap.length && heap[l][0] < heap[m][0]) m = l;
          if (r < heap.length && heap[r][0] < heap[m][0]) m = r;
          if (m === i) break;
          [heap[m], heap[i]] = [heap[i], heap[m]];
          i = m;
        }
      }
      return top;
    };
    const hcost = (i, j) => Math.hypot(i - gi, j - gj);
    const s = sj * W + si, goal = gj * W + gi;
    gs[s] = 0;
    push(hcost(si, sj), s);
    let found = false;
    while (heap.length) {
      const [, k] = pop();
      if (closed[k]) continue;
      if (k === goal) { found = true; break; }
      closed[k] = 1;
      const i = k % W, j = (k / W) | 0;
      for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
        if (!di && !dj) continue;
        const ni = i + di, nj = j + dj;
        if (!this.ok(ni, nj)) continue;
        if (di && dj && (!this.ok(i + di, j) || !this.ok(i, j + dj))) continue;
        const nk = nj * W + ni;
        const ng = gs[k] + (di && dj ? 1.4142 : 1);
        if (ng < gs[nk]) { gs[nk] = ng; came[nk] = k; push(ng + hcost(ni, nj), nk); }
      }
    }
    if (!found) return [];
    const cells = [];
    for (let k = goal; k !== -1 && k !== s; k = came[k]) cells.push([this.cx(k % W), this.cz((k / W) | 0)]);
    cells.reverse();
    cells[cells.length - 1] = [tx, tz];
    // Glätten: so weit wie möglich geradeaus
    const out = [];
    let cur = [fx, fz], idx = 0;
    while (idx < cells.length) {
      let far = idx;
      for (let k = cells.length - 1; k > idx; k--) {
        if (this.los(cur[0], cur[1], cells[k][0], cells[k][1])) { far = k; break; }
      }
      out.push(cells[far]);
      cur = cells[far];
      idx = far + 1;
    }
    return out;
  }
}
