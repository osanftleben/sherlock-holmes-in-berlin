// Dioramakamera: umkreist einen Zielpunkt, folgt optional der Spielfigur, passt sich dem Seitenverhältnis an
import { M4, V3, clamp, damp } from './math.js';

export class OrbitCamera {
  constructor() {
    this.fov = (42 * Math.PI) / 180;
    this.near = 0.1;
    this.far = 220;
    this.view = M4.create();
    this.proj = M4.create();
    this.viewProj = M4.create();
    this.invViewProj = M4.create();
    this.eye = [0, 5, 10];
    this.target = [0, 1, 0];
    this.cfg = null;
    this.yaw = 0; this.pitch = 0.6; this.dist = 10;
    this.userYaw = 0; this.userPitch = 0; this.zoom = 1;
    this.focusPoint = null; this.focusDist = 5;
    this.orbit = 0; // automatische Drehung (Titelbild)
    this.aspect = 1;
  }

  setup(cfg, snap = true) {
    this.cfg = Object.assign({
      target: [0, 1, 0], yaw: 0, pitch: 0.6, dist: 12, fov: 42,
      yawRange: [-0.45, 0.45], pitchRange: [-0.25, 0.3], zoomRange: [0.6, 1.5],
      fitWidth: 10, fitWidthNarrow: null, follow: [0.3, 0.3], bounds: null,
    }, cfg);
    this.fov = (this.cfg.fov * Math.PI) / 180;
    this.userYaw = 0; this.userPitch = 0; this.zoom = 1;
    this.focusPoint = null;
    if (snap) {
      this.target = this.cfg.target.slice();
      this.yaw = this.cfg.yaw;
      this.pitch = this.cfg.pitch;
      this.dist = this.cfg.dist;
      this._snap = true;
    }
  }

  drag(dx, dy) {
    const c = this.cfg;
    if (!c) return;
    this.userYaw = clamp(this.userYaw - dx * 0.005, c.yawRange[0], c.yawRange[1]);
    this.userPitch = clamp(this.userPitch + dy * 0.003, c.pitchRange[0], c.pitchRange[1]);
  }
  zoomBy(f) {
    const c = this.cfg;
    if (!c) return;
    this.zoom = clamp(this.zoom * f, c.zoomRange[0], c.zoomRange[1]);
  }
  focus(p, dist = 5) { this.focusPoint = p.slice(); this.focusDist = dist; }
  unfocus() { this.focusPoint = null; }

  baseDistance(aspect) {
    const c = this.cfg;
    const hfov = 2 * Math.atan(Math.tan(this.fov / 2) * aspect);
    let fw = c.fitWidth;
    if (aspect < 1 && c.fitWidthNarrow) fw = c.fitWidthNarrow + (c.fitWidth - c.fitWidthNarrow) * clamp(aspect, 0, 1) ** 2;
    const fit = fw / 2 / Math.tan(hfov / 2);
    return Math.max(c.dist, fit);
  }

  update(dt, aspect, followPos) {
    const c = this.cfg;
    if (!c) return;
    this.aspect = aspect;
    let tgt = c.target.slice();
    let dist = this.baseDistance(aspect) * this.zoom;
    if (followPos) {
      const narrow = aspect < 1 ? 1 : 0;
      const fx = c.follow[0] + (narrow ? 0.45 : 0), fz = c.follow[1];
      tgt[0] += (followPos[0] - c.target[0]) * Math.min(1, fx);
      tgt[2] += (followPos[2] - c.target[2]) * Math.min(1, fz);
      if (c.bounds) {
        tgt[0] = clamp(tgt[0], c.bounds[0], c.bounds[2]);
        tgt[2] = clamp(tgt[2], c.bounds[1], c.bounds[3]);
      }
    }
    if (this.focusPoint) {
      tgt = this.focusPoint;
      dist = Math.min(dist, this.focusDist);
    }
    this.orbit += dt * (c.autoOrbit || 0);
    const yaw = c.yaw + this.userYaw + (c.autoOrbit ? Math.sin(this.orbit) * 0.35 : 0);
    const pitch = clamp(c.pitch + this.userPitch, 0.05, 1.45);
    if (this._snap) {
      this.target = tgt.slice(); this.yaw = yaw; this.pitch = pitch; this.dist = dist;
      this._snap = false;
    } else {
      const k = 4.5;
      for (let i = 0; i < 3; i++) this.target[i] = damp(this.target[i], tgt[i], k, dt);
      this.yaw = damp(this.yaw, yaw, 6, dt);
      this.pitch = damp(this.pitch, pitch, 6, dt);
      this.dist = damp(this.dist, dist, 4, dt);
    }
    const cp = Math.cos(this.pitch);
    this.eye = [
      this.target[0] + Math.sin(this.yaw) * cp * this.dist,
      this.target[1] + Math.sin(this.pitch) * this.dist,
      this.target[2] + Math.cos(this.yaw) * cp * this.dist,
    ];
    M4.lookAt(this.view, this.eye, this.target, [0, 1, 0]);
    M4.perspective(this.proj, this.fov, aspect, this.near, this.far);
    M4.mul(this.viewProj, this.proj, this.view);
    M4.invert(this.invViewProj, this.viewProj);
  }

  // Strahl durch normierte Bildschirmkoordinaten (-1..1)
  ray(nx, ny) {
    const a = M4.transform4(this.invViewProj, nx, ny, -1, 1);
    const b = M4.transform4(this.invViewProj, nx, ny, 1, 1);
    const p0 = [a[0] / a[3], a[1] / a[3], a[2] / a[3]];
    const p1 = [b[0] / b[3], b[1] / b[3], b[2] / b[3]];
    return { o: p0, d: V3.norm(V3.sub(p1, p0)) };
  }

  // Weltpunkt -> normierte Bildschirmkoordinaten; null wenn hinter der Kamera
  project(p) {
    const c = M4.transform4(this.viewProj, p[0], p[1], p[2], 1);
    if (c[3] <= 0.01) return null;
    return [c[0] / c[3], c[1] / c[3], c[2] / c[3]];
  }
}
