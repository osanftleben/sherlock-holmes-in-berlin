// Einheitliche Eingabe für Maus und Touch: Tippen, Ziehen (Kamera), Zwei-Finger-Zoom, Mausrad, Hover
export class Input {
  constructor(el, h) {
    this.el = el;
    this.h = h;
    this.pointers = new Map();
    this.dragging = false;
    this.start = null;
    this.pinchDist = 0;
    this.mouse = null;
    el.addEventListener('pointerdown', (e) => this.down(e));
    el.addEventListener('pointermove', (e) => this.move(e));
    el.addEventListener('pointerup', (e) => this.up(e));
    el.addEventListener('pointercancel', (e) => this.cancel(e));
    el.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') { this.mouse = null; h.hover?.(null); } });
    el.addEventListener('wheel', (e) => { e.preventDefault(); h.zoom?.(Math.exp(e.deltaY * 0.0012)); }, { passive: false });
    el.addEventListener('contextmenu', (e) => e.preventDefault());
    // iOS: Gesten-Zoom der Seite unterbinden
    document.addEventListener('gesturestart', (e) => e.preventDefault());
  }
  pos(e) {
    const r = this.el.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top];
  }
  down(e) {
    const [x, y] = this.pos(e);
    try { this.el.setPointerCapture(e.pointerId); } catch (_) { /* egal */ }
    this.pointers.set(e.pointerId, { x, y });
    if (this.pointers.size === 1) {
      this.start = { x, y, t: performance.now(), type: e.pointerType };
      this.dragging = false;
    } else if (this.pointers.size === 2) {
      this.dragging = true;
      const [a, b] = [...this.pointers.values()];
      this.pinchDist = Math.hypot(a.x - b.x, a.y - b.y);
    }
  }
  move(e) {
    const [x, y] = this.pos(e);
    if (e.pointerType === 'mouse') { this.mouse = [x, y]; this.h.hover?.([x, y]); }
    const p = this.pointers.get(e.pointerId);
    if (!p) return;
    const dx = x - p.x, dy = y - p.y;
    p.x = x; p.y = y;
    if (this.pointers.size === 1) {
      if (!this.dragging && this.start && Math.hypot(x - this.start.x, y - this.start.y) > 9) this.dragging = true;
      if (this.dragging) this.h.drag?.(dx, dy);
    } else if (this.pointers.size === 2) {
      const [a, b] = [...this.pointers.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (this.pinchDist > 0 && d > 0) this.h.zoom?.(this.pinchDist / d);
      this.pinchDist = d;
    }
  }
  up(e) {
    const [x, y] = this.pos(e);
    const had = this.pointers.has(e.pointerId);
    this.pointers.delete(e.pointerId);
    if (had && !this.dragging && this.pointers.size === 0 && this.start && performance.now() - this.start.t < 700) {
      this.h.tap?.([x, y], e.pointerType);
    }
    if (this.pointers.size === 0) { this.dragging = false; this.start = null; }
  }
  cancel(e) {
    this.pointers.delete(e.pointerId);
    if (this.pointers.size === 0) { this.dragging = false; this.start = null; }
  }
}
