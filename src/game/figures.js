// Figuren im Stil bemalter Holzfiguren: aus Grundkörpern gebaut, mit Gelenken und einfacher Animation
import { MeshBuilder, MAT, col } from '../engine/geometry.js';
import { Node } from '../engine/scene.js';
import { damp, dampAngle, wrapAngle, clamp } from '../engine/math.js';

const PROFILES = {
  long: [[0.235, -0.42], [0.215, -0.2], [0.19, 0.0], [0.17, 0.18], [0.185, 0.36], [0.195, 0.47], [0.17, 0.54], [0.09, 0.585], [0.06, 0.61]],
  frock: [[0.215, -0.3], [0.2, -0.12], [0.185, 0.0], [0.168, 0.18], [0.185, 0.36], [0.195, 0.47], [0.168, 0.54], [0.09, 0.585], [0.06, 0.61]],
  jacket: [[0.19, -0.07], [0.182, 0.05], [0.165, 0.2], [0.18, 0.38], [0.19, 0.47], [0.165, 0.54], [0.09, 0.585], [0.06, 0.61]],
  uniform: [[0.205, -0.15], [0.19, -0.02], [0.17, 0.12], [0.182, 0.36], [0.195, 0.47], [0.168, 0.54], [0.09, 0.585], [0.06, 0.61]],
  dress: [[0.34, -0.92], [0.31, -0.62], [0.245, -0.3], [0.18, -0.05], [0.15, 0.08], [0.16, 0.28], [0.18, 0.42], [0.165, 0.52], [0.09, 0.575], [0.055, 0.61]],
  dressSit: [[0.2, -0.08], [0.16, 0.08], [0.165, 0.28], [0.18, 0.42], [0.165, 0.52], [0.09, 0.575], [0.055, 0.61]],
};
// Radius eines Profils auf Höhe y (für Knöpfe, Schürzen)
function radiusAt(prof, y) {
  for (let i = 0; i < prof.length - 1; i++) {
    const [r0, y0] = prof[i], [r1, y1] = prof[i + 1];
    if (y >= y0 && y <= y1) return r0 + (r1 - r0) * ((y - y0) / (y1 - y0 || 1));
  }
  return prof[prof.length - 1][0];
}

function buildHead(b, s, H) {
  const skin = col(s.skin || '#e2b894');
  const hair = s.hair || '#3b2a1c';
  b.cyl(0, -0.05 * H, 0, 0.045, 0.045, 0.09 * H, 8, skin, MAT.skin);
  b.ellipsoid(0, 0.115 * H, 0.005, 0.098 * H, 0.115 * H, 0.105 * H, 14, 10, skin, MAT.skin);
  b.ellipsoid(0, 0.1 * H, 0.1 * H, 0.018, 0.028, 0.03, 8, 6, s.nose || shadeSkin(skin, 0.95), MAT.skin);
  b.sphere(0.035 * H, 0.13 * H, 0.089 * H, 0.011, 6, 4, '#1b1410', MAT.gloss);
  b.sphere(-0.035 * H, 0.13 * H, 0.089 * H, 0.011, 6, 4, '#1b1410', MAT.gloss);
  b.ellipsoid(0.098 * H, 0.11 * H, 0, 0.015, 0.03, 0.022, 6, 5, skin, MAT.skin);
  b.ellipsoid(-0.098 * H, 0.11 * H, 0, 0.015, 0.03, 0.022, 6, 5, skin, MAT.skin);
  // Brauen
  b.boxC(0.035 * H, 0.152 * H, 0.094 * H, 0.035, 0.008, 0.01, s.brows || hair, MAT.matte);
  b.boxC(-0.035 * H, 0.152 * H, 0.094 * H, 0.035, 0.008, 0.01, s.brows || hair, MAT.matte);
  const hs = s.hairStyle || 'short';
  if (hs === 'short' || hs === 'bun') b.ellipsoid(0, 0.14 * H, -0.015, 0.104 * H, 0.1 * H, 0.106 * H, 12, 8, hair, MAT.cloth);
  if (hs === 'bun') b.sphere(0, 0.17 * H, -0.105 * H, 0.052 * H, 10, 8, hair, MAT.cloth);
  if (hs === 'bald') b.ellipsoid(0, 0.095 * H, -0.035, 0.104 * H, 0.055 * H, 0.09 * H, 12, 6, hair, MAT.cloth);
  if (hs === 'grey') b.ellipsoid(0, 0.14 * H, -0.015, 0.104 * H, 0.1 * H, 0.106 * H, 12, 8, hair, MAT.cloth);
  const fh = s.facial || hair;
  if (s.mustache === 'kaiser') {
    b.push().translate(0.028, 0.07 * H, 0.104 * H).rotateZ(0.45).boxC(0.012, 0, 0, 0.05, 0.012, 0.016, fh, MAT.cloth).pop();
    b.push().translate(-0.028, 0.07 * H, 0.104 * H).rotateZ(-0.45).boxC(-0.012, 0, 0, 0.05, 0.012, 0.016, fh, MAT.cloth).pop();
  } else if (s.mustache === 'walrus') {
    b.boxC(0, 0.066 * H, 0.104 * H, 0.08, 0.026, 0.022, fh, MAT.cloth);
  } else if (s.mustache === 'thin') {
    b.boxC(0, 0.07 * H, 0.105 * H, 0.055, 0.01, 0.012, fh, MAT.cloth);
  }
  if (s.beard === 'full') b.ellipsoid(0, 0.045 * H, 0.06 * H, 0.072, 0.065, 0.06, 10, 8, fh, MAT.cloth);
  if (s.beard === 'chops') {
    b.ellipsoid(0.085 * H, 0.07 * H, 0.03, 0.026, 0.055, 0.045, 8, 6, fh, MAT.cloth);
    b.ellipsoid(-0.085 * H, 0.07 * H, 0.03, 0.026, 0.055, 0.045, 8, 6, fh, MAT.cloth);
  }
  if (s.glasses) {
    b.boxC(0.034 * H, 0.13 * H, 0.101 * H, 0.032, 0.024, 0.004, '#c9b48a', MAT.brass);
    b.boxC(-0.034 * H, 0.13 * H, 0.101 * H, 0.032, 0.024, 0.004, '#c9b48a', MAT.brass);
  }
  const hc = s.hatColor || '#1d1a17';
  switch (s.hat) {
    case 'deerstalker':
      b.ellipsoid(0, 0.19 * H, 0, 0.113 * H, 0.078 * H, 0.118 * H, 14, 8, hc, MAT.tweed);
      b.push().translate(0, 0.168 * H, 0.112 * H).rotateX(0.38).box(-0.065, -0.006, 0, 0.065, 0.006, 0.08, hc, MAT.tweed).pop();
      b.push().translate(0, 0.168 * H, -0.112 * H).rotateX(-0.38).box(-0.065, -0.006, -0.08, 0.065, 0.006, 0, hc, MAT.tweed).pop();
      b.boxC(0, 0.265 * H, 0, 0.13, 0.014, 0.035, hc, MAT.tweed);
      b.sphere(0, 0.272 * H, 0, 0.012, 6, 4, hc, MAT.tweed);
      break;
    case 'tophat':
      b.lathe([[0, 0.19 * H], [0.162, 0.19 * H], [0.168, 0.205 * H], [0.11, 0.21 * H], [0.102, 0.27 * H], [0.108, 0.39 * H], [0, 0.39 * H]], 18, hc, MAT.gloss, { smooth: false });
      break;
    case 'bowler':
      b.lathe([[0, 0.188 * H], [0.152, 0.188 * H], [0.158, 0.203 * H], [0.104, 0.208 * H], [0.112, 0.25 * H], [0.098, 0.3 * H], [0.055, 0.327 * H], [0, 0.333 * H]], 18, hc, MAT.gloss, { crease: 0.8 });
      break;
    case 'pickelhaube':
      b.lathe([[0, 0.16 * H], [0.126, 0.16 * H], [0.123, 0.2 * H], [0.112, 0.26 * H], [0.082, 0.3 * H], [0.032, 0.322 * H], [0, 0.325 * H]], 16, '#14120f', MAT.gloss, { crease: 0.85 });
      b.push().translate(0, 0.165 * H, 0.12 * H).rotateX(0.3).box(-0.08, -0.005, 0, 0.08, 0.005, 0.07, '#14120f', MAT.gloss).pop();
      b.cyl(0, 0.318 * H, 0, 0.03, 0.022, 0.025, 10, '#c9a45a', MAT.brass);
      b.cyl(0, 0.34 * H, 0, 0.02, 0.002, 0.085, 10, '#c9a45a', MAT.brass);
      b.push().translate(0, 0.225 * H, 0.112 * H).rotateX(-0.35).boxC(0, 0, 0, 0.065, 0.075, 0.012, '#d4b26a', MAT.brass).pop();
      break;
    case 'cap':
      b.ellipsoid(0, 0.212 * H, 0.012, 0.12 * H, 0.052 * H, 0.126 * H, 12, 6, hc, MAT.tweed);
      b.push().translate(0, 0.198 * H, 0.105 * H).rotateX(0.25).box(-0.075, -0.006, 0, 0.075, 0.006, 0.075, hc, MAT.cloth).pop();
      break;
    case 'bonnet':
      b.ellipsoid(0, 0.16 * H, -0.03, 0.112 * H, 0.102 * H, 0.1 * H, 12, 8, hc, MAT.cloth);
      b.cyl(0, 0.08 * H, -0.01, 0.112 * H, 0.112 * H, 0.012, 14, hc, MAT.cloth, false);
      break;
    case 'coachman':
      b.lathe([[0, 0.19 * H], [0.15, 0.19 * H], [0.155, 0.205 * H], [0.11, 0.21 * H], [0.104, 0.27 * H], [0.112, 0.34 * H], [0, 0.34 * H]], 16, hc, MAT.gloss, { smooth: false });
      break;
  }
  // Requisiten am Kopf
  for (const p of s.props || []) {
    if (p === 'pipe') {
      b.rod([0.02, 0.058 * H, 0.1 * H], [0.045, 0.035 * H, 0.17 * H], 0.0075, '#1a120c', MAT.gloss);
      b.cyl(0.048, 0.01 * H, 0.175 * H, 0.017, 0.02, 0.045, 10, '#4a2a16', MAT.wood);
    }
    if (p === 'cigar') {
      b.rod([-0.02, 0.06 * H, 0.104 * H], [-0.05, 0.05 * H, 0.175 * H], 0.0095, '#5a3a20', MAT.cloth);
      b.sphere(-0.051, 0.05 * H, 0.177 * H, 0.009, 6, 4, '#ff6a20', MAT.glow(2));
    }
  }
}
function shadeSkin(c, f) { return [c[0] * f, c[1] * f * 0.92, c[2] * f * 0.9]; }

export class Figure {
  constructor(R, spec) {
    this.spec = spec;
    this.id = spec.id;
    const H = (this.H = spec.height ?? 1);
    const G = (this.G = spec.girth ?? 1);
    const coatType = spec.coat || 'jacket';
    this.sitting = spec.pose === 'sit' || spec.pose === 'cuffed';
    const coatC = spec.coatColor || '#3a3a3a';
    const coatMat = spec.coatMat === 'tweed' ? MAT.tweed : spec.coatMat === 'gloss' ? MAT.gloss : MAT.cloth;
    const sleeveC = spec.sleeves || coatC;
    const sleeveMat = spec.sleeves ? MAT.cloth : coatMat;
    const pantsC = spec.pants || '#2a2622';
    const shoeC = spec.shoes || '#15110d';
    const skin = spec.skin || '#e2b894';
    const handC = spec.gloves || skin;
    const mk = (b) => R.createMesh(b);

    this.root = new Node(spec.id || 'figur');
    this.hips = new Node('hips');
    this.hipY = this.sitting ? (spec.seat ?? 0.47) : 0.93 * H;
    this.hips.pos[1] = this.hipY;
    this.root.add(this.hips);

    // Rumpf
    const tb = new MeshBuilder();
    const isDress = coatType === 'dress';
    let profName = coatType;
    if (isDress && this.sitting) profName = 'dressSit';
    const prof = (PROFILES[profName] || PROFILES.jacket).map(([r, y]) => [r * G, y * H]);
    tb.lathe(prof, 16, coatC, coatMat);
    tb.cyl(0, prof[0][1], 0, prof[0][0] * 0.98, prof[0][0] * 0.98, 0.001, 16, coatC, coatMat, true);
    if (isDress && this.sitting) {
      tb.box(-0.21 * G, -0.1, -0.05, 0.21 * G, 0.1, 0.5, coatC, coatMat);
      tb.lathe([[0.3 * G, -0.47], [0.27 * G, -0.3], [0.23 * G, -0.05], [0.0, -0.04]], 14, coatC, coatMat, { z: 0.42 });
    }
    if (spec.vest) tb.box(-0.1 * G, 0.06 * H, radiusAt(prof, 0.3 * H) - 0.012, 0.1 * G, 0.46 * H, radiusAt(prof, 0.3 * H) + 0.004, spec.vest, MAT.cloth);
    if (spec.apron) {
      const top = spec.apronTop ?? 0.34, bot = spec.apronBottom ?? -0.55;
      const zr = radiusAt(prof, 0.0) + 0.012;
      tb.box(-0.17 * G, bot * H, zr, 0.17 * G, top * H, zr + 0.014, spec.apron, MAT.cloth);
    }
    tb.box(-0.045, 0.548 * H, radiusAt(prof, 0.55 * H) * 0.6, 0.045, 0.6 * H, radiusAt(prof, 0.55 * H) * 0.6 + 0.04, spec.collar || '#e9e2d2', MAT.cloth);
    if (spec.tie) tb.boxC(0, 0.53 * H, radiusAt(prof, 0.53 * H) + 0.006, 0.04, 0.05, 0.02, spec.tie, MAT.cloth);
    if (coatType === 'uniform') {
      for (let y = 0.06; y < 0.5; y += 0.09) tb.sphere(0, y * H, radiusAt(prof, y * H) + 0.004, 0.012, 6, 4, '#d6b56a', MAT.brass);
      tb.lathe([[0.19 * G, -0.0], [0.192 * G, 0.05]], 16, '#1a1410', MAT.gloss);
    }
    if (spec.cape) {
      tb.lathe([[0.33 * G, 0.17 * H], [0.3 * G, 0.29 * H], [0.245 * G, 0.43 * H], [0.18 * G, 0.52 * H], [0.1 * G, 0.575 * H], [0.065, 0.6 * H]], 18, spec.cape, MAT.tweed);
    }
    for (const p of spec.props || []) {
      if (p === 'bag') {
        tb.box(0.17 * G, -0.16, -0.12, 0.24 * G, 0.12, 0.12, '#5a3b22', MAT.cloth);
        tb.box(0.175 * G, 0.08, -0.08, 0.235 * G, 0.17, 0.08, '#ddd6c4', MAT.paper);
        tb.rod([-0.14, 0.5 * H, 0.15], [0.2, 0.1, 0.17], 0.012, '#4a301c', MAT.cloth);
      }
      if (p === 'saber') {
        tb.rod([0.21, 0.0, -0.06], [0.26, -0.75, -0.17], 0.013, '#9aa0a4', MAT.metal);
        tb.boxC(0.21, 0.04, -0.06, 0.03, 0.08, 0.03, '#c9a45a', MAT.brass);
      }
      if (p === 'chain') tb.rod([0.07, 0.22 * H, radiusAt(prof, 0.22 * H) + 0.006], [-0.08, 0.2 * H, radiusAt(prof, 0.2 * H) + 0.006], 0.005, '#d9b45a', MAT.brass);
    }
    this.torso = new Node('torso', mk(tb));
    this.torso.scl = [1.12, 1, 0.82];
    this.hips.add(this.torso);

    // Kopf
    const hb = new MeshBuilder();
    buildHead(hb, spec, H);
    this.neck = new Node('neck');
    this.neck.pos[1] = 0.6 * H;
    this.head = new Node('head', mk(hb));
    this.neck.add(this.head);
    this.hips.add(this.neck);

    // Arme
    const armNodes = (side) => {
      const sh = new Node('shoulder' + side);
      sh.pos = [side * 0.215 * G, 0.515 * H, 0];
      const ub = new MeshBuilder();
      ub.sphere(0, 0, 0, 0.062 * G, 8, 6, sleeveC, sleeveMat);
      ub.cyl(0, -0.29 * H, 0, 0.05 * G, 0.06 * G, 0.29 * H, 8, sleeveC, sleeveMat);
      const upper = new Node('upper', mk(ub));
      sh.add(upper);
      const el = new Node('elbow');
      el.pos[1] = -0.29 * H;
      const fb = new MeshBuilder();
      fb.sphere(0, 0, 0, 0.05 * G, 8, 6, sleeveC, sleeveMat);
      fb.cyl(0, -0.25 * H, 0, 0.044 * G, 0.05 * G, 0.25 * H, 8, sleeveC, sleeveMat);
      fb.cyl(0, -0.26 * H, 0, 0.047 * G, 0.047 * G, 0.03, 8, spec.cuff || '#e9e2d2', MAT.cloth, false);
      fb.ellipsoid(0, -0.3 * H, 0.005, 0.04, 0.05, 0.03, 8, 6, handC, MAT.skin);
      for (const p of spec.props || []) {
        if (p === 'cane' && side < 0) fb.rod([0, -0.3 * H, 0.04], [0, -0.3 * H - 0.86, 0.1], 0.012, '#2a1a10', MAT.gloss);
        if (p === 'plan' && side > 0) fb.rod([-0.13, -0.29 * H, 0.05], [0.13, -0.31 * H, 0.05], 0.028, '#c8d4dc', MAT.paper);
        if (p === 'newspaper' && side < 0) fb.boxC(0, -0.32 * H, 0.04, 0.02, 0.2, 0.14, '#e4dccb', MAT.paper);
        if (p === 'cuffs') fb.boxC(0, -0.24 * H, 0, 0.11, 0.025, 0.11, '#7d8186', MAT.metal);
        if (p === 'basket' && side > 0) {
          fb.box(-0.14, -0.5 * H, -0.12, 0.14, -0.38 * H, 0.12, '#8a6a3a', MAT.wood);
          fb.rod([-0.12, -0.38 * H, 0], [0, -0.31 * H, 0], 0.008, '#6a4a2a', MAT.wood);
          fb.rod([0.12, -0.38 * H, 0], [0, -0.31 * H, 0], 0.008, '#6a4a2a', MAT.wood);
        }
        if (p === 'whip' && side < 0) fb.rod([0, -0.3 * H, 0.03], [0, 0.6, 0.35], 0.008, '#2a1a10', MAT.gloss);
      }
      const fore = new Node('fore', mk(fb));
      el.add(fore);
      upper.add(el);
      // Lupe (für die Untersuchungsgeste)
      if (side < 0 && (spec.props || []).includes('lens')) {
        const lb = new MeshBuilder();
        lb.rod([0, -0.3 * H, 0.02], [0, -0.42 * H, 0.08], 0.01, '#2a1a10', MAT.wood);
        lb.push().translate(0, -0.47 * H, 0.1).rotateX(Math.PI / 2 - 0.4);
        lb.lathe([[0.045, -0.006], [0.052, -0.006], [0.052, 0.006], [0.045, 0.006], [0.045, -0.006]], 16, '#c9a45a', MAT.brass, { smooth: false });
        lb.cyl(0, -0.002, 0, 0.045, 0.045, 0.004, 16, '#cfe0e6', MAT.glass, true);
        lb.pop();
        this.lens = new Node('lens', mk(lb));
        this.lens.visible = false;
        el.add(this.lens);
      }
      this.hips.add(sh);
      return { sh, upper, el };
    };
    this.armL = armNodes(1);
    this.armR = armNodes(-1);

    // Beine
    const legNodes = (side) => {
      const hip = new Node('hip' + side);
      hip.pos = [side * 0.09 * G, -0.02, 0];
      const tbb = new MeshBuilder();
      tbb.cyl(0, -0.43 * H, 0, 0.062 * G, 0.078 * G, 0.43 * H, 8, pantsC, MAT.cloth);
      const thigh = new Node('thigh', mk(tbb));
      hip.add(thigh);
      const knee = new Node('knee');
      knee.pos[1] = -0.43 * H;
      const sb = new MeshBuilder();
      sb.sphere(0, 0, 0, 0.06 * G, 8, 6, pantsC, MAT.cloth);
      sb.cyl(0, -0.42 * H, 0, 0.05 * G, 0.06 * G, 0.42 * H, 8, spec.stockings || pantsC, MAT.cloth);
      sb.box(-0.052 * G, -0.5 * H, -0.065, 0.052 * G, -0.42 * H, 0.15, shoeC, MAT.gloss);
      const shin = new Node('shin', mk(sb));
      knee.add(shin);
      thigh.add(knee);
      this.hips.add(hip);
      return { hip, thigh, knee };
    };
    this.legL = legNodes(1);
    this.legR = legNodes(-1);

    // Schatten-Fleck unter der Figur (weich, dunkel)
    const bb = new MeshBuilder();
    bb.disc(0, 0, 0, 0.34 * G, 18, '#000000', MAT.matte);
    this.blob = new Node('blob', R.createMesh(bb));
    this.blob.rot[0] = -Math.PI / 2;
    this.blob.pos[1] = 0.012;
    this.blob.alpha = 0.32;
    this.blob.castShadow = false;
    this.root.add(this.blob);

    // Zustand
    this.path = [];
    this.speed = spec.speed || 1.6;
    this.walk = 0;
    this.phase = Math.random() * 6;
    this.yawGoal = null;
    this.lookAt = null;
    this.talking = false;
    this.seed = Math.random() * 100;
    this.headYaw = 0;
    this.idleTimer = 2 + Math.random() * 4;
    this.idleLook = 0;
    this.gestureT = 0;
    this.gestureName = null;
    this.onArrive = null;
    this.pose = spec.pose || 'stand';
  }

  get x() { return this.root.pos[0]; }
  get z() { return this.root.pos[2]; }
  get yaw() { return this.root.rot[1]; }
  get moving() { return this.path.length > 0; }
  setPos(x, z) { this.root.pos[0] = x; this.root.pos[2] = z; return this; }
  setYaw(a) { this.root.rot[1] = a; this.yawGoal = null; return this; }
  faceTo(x, z, instant = false) {
    const a = Math.atan2(x - this.x, z - this.z);
    if (instant) this.setYaw(a); else this.yawGoal = a;
  }
  headPos() { return [this.x, 1.95 * this.H, this.z]; }
  walkPath(pts) {
    if (this.onArrive) { const f = this.onArrive; this.onArrive = null; f(false); }
    this.path = pts.slice();
    return new Promise((res) => {
      if (!this.path.length) { res(true); return; }
      this.onArrive = res;
    });
  }
  stop() {
    this.path = [];
    if (this.onArrive) { const f = this.onArrive; this.onArrive = null; f(false); }
  }
  gesture(name, dur = 1.6) { this.gestureName = name; this.gestureT = dur; }

  update(dt, t) {
    // Bewegung entlang des Pfades
    let moving = false;
    if (this.path.length) {
      const [tx, tz] = this.path[0];
      const dx = tx - this.x, dz = tz - this.z, d = Math.hypot(dx, dz);
      const step = this.speed * dt;
      if (d <= step || d < 1e-4) {
        this.setPos(tx, tz);
        this.path.shift();
        if (!this.path.length && this.onArrive) { const f = this.onArrive; this.onArrive = null; f(true); }
      } else {
        this.setPos(this.x + (dx / d) * step, this.z + (dz / d) * step);
        this.yawGoal = Math.atan2(dx, dz);
      }
      moving = this.path.length > 0 || d > step;
    }
    this.walk = damp(this.walk, moving ? 1 : 0, 9, dt);
    if (this.yawGoal != null) this.root.rot[1] = dampAngle(this.root.rot[1], this.yawGoal, moving ? 10 : 7, dt);
    if (moving) this.phase += dt * this.speed * 5.2;
    const s = Math.sin(this.phase), w = this.walk;
    const L = this.legL, Rr = this.legR, A = this.armL, B = this.armR;

    // Beine
    if (this.sitting) {
      L.thigh.rot[0] = Rr.thigh.rot[0] = -Math.PI / 2;
      L.knee.rot[0] = Rr.knee.rot[0] = Math.PI / 2;
      L.thigh.rot[2] = 0.06; Rr.thigh.rot[2] = -0.06;
    } else {
      L.thigh.rot[0] = -0.5 * s * w;
      Rr.thigh.rot[0] = 0.5 * s * w;
      L.knee.rot[0] = w * 0.75 * Math.max(0, -Math.cos(this.phase + 0.4));
      Rr.knee.rot[0] = w * 0.75 * Math.max(0, Math.cos(this.phase + 0.4));
    }
    // Rumpf
    const breath = Math.sin(t * 1.7 + this.seed) * 0.006;
    this.torso.scl[1] = 1 + breath * (1 - w);
    this.hips.pos[1] = this.hipY + (this.sitting ? 0 : (Math.abs(Math.cos(this.phase)) - 0.6) * 0.045 * w);
    this.hips.rot[0] = (this.sitting ? 0.04 : 0.07 * w) + (this.pose === 'counter' ? 0.12 : 0);

    // Arme je nach Haltung
    let aL = [0.06, 0, 0.06], aR = [0.06, 0, -0.06], eL = -0.22, eR = -0.22;
    if (this.pose === 'cuffed') { aL = [-0.45, 0, -0.32]; aR = [-0.45, 0, 0.32]; eL = -1.05; eR = -1.05; }
    else if (this.pose === 'handsBack') { aL = [0.45, 0, 0.12]; aR = [0.45, 0, -0.12]; eL = -0.25; eR = -0.25; }
    else if (this.pose === 'counter') { aL = [-0.75, 0, 0.1]; aR = [-0.75, 0, -0.1]; eL = -0.55; eR = -0.55; }
    else if (this.pose === 'hips') { aL = [0.1, 0, 0.55]; aR = [0.1, 0, -0.55]; eL = -1.6; eR = -1.6; }
    else if (this.sitting) { aL = [-0.35, 0, 0.1]; aR = [-0.35, 0, -0.1]; eL = -0.9; eR = -0.9; }
    if (w > 0.05 && !this.sitting && this.pose !== 'cuffed') {
      aL = [0.4 * s * w + aL[0] * (1 - w), 0, 0.06];
      aR = [-0.4 * s * w + aR[0] * (1 - w), 0, -0.06];
      eL = -0.25 - 0.15 * w; eR = eL;
    }
    // Gesten
    if (this.gestureT > 0) {
      this.gestureT -= dt;
      const k = clamp(Math.min(this.gestureT, 1.6 - this.gestureT) * 5, 0, 1);
      if (this.gestureName === 'lens') {
        aR = [aR[0] * (1 - k) - 1.15 * k, 0, aR[2]];
        eR = eR * (1 - k) - 0.7 * k;
        if (this.lens) this.lens.visible = k > 0.3;
      } else if (this.gestureName === 'point') {
        aR = [aR[0] * (1 - k) - 1.35 * k, 0, aR[2] - 0.2 * k];
        eR = eR * (1 - k) - 0.1 * k;
      }
      if (this.gestureT <= 0 && this.lens) this.lens.visible = false;
    }
    if (this.talking && this.gestureT <= 0 && !this.sitting && this.pose === 'stand') {
      aR = [aR[0] - 0.25 - Math.sin(t * 2.3 + this.seed) * 0.12, 0, aR[2]];
      eR = eR - 0.55 - Math.sin(t * 3.1) * 0.15;
    }
    const sm = (node, r) => { node.rot[0] = damp(node.rot[0], r[0], 10, dt); node.rot[2] = damp(node.rot[2], r[2], 10, dt); };
    sm(A.sh, aL); sm(B.sh, aR);
    A.el.rot[0] = damp(A.el.rot[0], eL, 10, dt);
    B.el.rot[0] = damp(B.el.rot[0], eR, 10, dt);

    // Kopf: Blickrichtung
    let hy = 0;
    if (this.lookAt) {
      const a = Math.atan2(this.lookAt[0] - this.x, this.lookAt[2] - this.z);
      hy = clamp(wrapAngle(a - this.yaw), -1.0, 1.0);
    } else {
      this.idleTimer -= dt;
      if (this.idleTimer < 0) { this.idleTimer = 2.5 + Math.random() * 5; this.idleLook = (Math.random() - 0.5) * 1.1; }
      hy = moving ? 0 : this.idleLook;
    }
    this.headYaw = damp(this.headYaw, hy, 5, dt);
    this.neck.rot[1] = this.headYaw;
    this.neck.rot[0] = this.talking ? Math.sin(t * 7 + this.seed) * 0.04 : Math.sin(t * 0.9 + this.seed) * 0.02;
  }
}

export function buildFigure(R, spec) {
  return new Figure(R, spec);
}
