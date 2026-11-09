// Spielsteuerung: Szenen, Figuren, Wegfindung, Interaktion, Gespräche, Hinweise, Zeit und Spielstand
import { OrbitCamera } from '../engine/camera.js';
import { Input } from '../engine/input.js';
import { rayAABB } from '../engine/math.js';
import { Figure } from './figures.js';
import { Notebook } from './notebook.js';
import { Minigames } from './minigames.js';

export const SAVE_KEY = 'shib.case1.save';
const SAVE_VERSION = 1;
export const wait = (s) => new Promise((r) => setTimeout(r, s * 1000));
export const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export function clockLabel(min) {
  const h = Math.floor(min / 60) % 24, m = Math.floor(min) % 60;
  return `${h}:${String(m).padStart(2, '0')} Uhr`;
}

export class Game {
  constructor(o) {
    this.R = o.R;
    this.ui = o.ui;
    this.audio = o.audio;
    this.C = o.caseDef;
    this.D = o.caseDef.dialogs;
    this.canvas = o.canvas;
    this.settings = o.settings;
    this.onQuit = o.onQuit || (() => {});
    this.cam = new OrbitCamera();
    this.scenes = {};
    this.figs = {};
    this.cast = {};
    this.scene = null;
    this.mode = 'idle';
    this.busy = 0;
    this.token = 0;
    this.lookMode = false;
    this.hover = null;
    this.hoverTick = 0;
    this.pauleT = 0;
    this.touch = matchMedia('(pointer: coarse)').matches;
    this.state = this.freshState();
    this.notebook = new Notebook(this);
    this.mini = new Minigames(this);
    this.holmes = this.fig('holmes');
    this.input = new Input(this.canvas, {
      tap: (p, type) => this.onTap(p, type),
      drag: (dx, dy) => { if (this.mode === 'play') this.cam.drag(dx, dy); },
      zoom: (f) => { if (this.mode === 'play') this.cam.zoomBy(f); },
      hover: () => {},
    });
    this.ui.setSpeakers(this.C.speakers);
    this.ui.onSpeaker = (id) => this.onSpeaker(id);
  }

  freshState() {
    return {
      v: SAVE_VERSION, scene: this.C.start.scene, pos: null,
      clues: {}, fresh: {}, flags: {}, deds: {}, seen: {}, visited: {}, examined: {}, announced: {},
      minutes: this.C.startMinutes, hints: 0, wrongDed: 0, wrongAccuse: 0, wrongPresent: 0,
      playMs: 0, objective: '', done: false,
    };
  }

  // ---------- Szenen ----------
  getScene(id) {
    if (!this.scenes[id]) {
      const t0 = performance.now();
      const sc = this.C.scenes[id](this.R);
      sc.nav.base = sc.nav.g.slice();
      this.scenes[id] = sc;
      console.info(`Szene „${id}“ gebaut in ${Math.round(performance.now() - t0)} ms`);
    }
    return this.scenes[id];
  }

  prebuild(ids) {
    const todo = ids.filter((id) => !this.scenes[id]);
    const step = () => {
      if (!todo.length) return;
      if (this.busy) { setTimeout(step, 400); return; }
      this.getScene(todo.shift());
      setTimeout(step, 120);
    };
    setTimeout(step, 300);
  }

  enterScene(id, spawn, pos = null) {
    if (this.scene) {
      for (const cid of Object.keys(this.cast)) this.despawn(cid);
      if (this.holmes.root.parent) this.holmes.root.parent.remove(this.holmes.root);
    }
    this.setHover(null);
    this.ui.setMarkers([], () => {});
    const sc = this.getScene(id);
    this.scene = sc;
    this.state.scene = id;
    const H = this.holmes;
    H.stop();
    H.talking = false;
    H.lookAt = null;
    const sp = pos || sc.spawns[spawn] || sc.spawns.default;
    H.setPos(sp[0], sp[1]).setYaw(sp[2] || 0);
    if (this.mode === 'play') sc.world.root.add(H.root);
    this.refreshCast(true);
    this.cam.setup(this.mode === 'title' && sc.titleCam ? sc.titleCam : sc.cam, true);
    this.audio.setAmbience(this.mode === 'title' ? 'title' : sc.ambience);
    sc.world.root.update(null);
    sc.onEnter?.(this);
    this.updateHUD();
  }

  async gotoScene(id, spawn) {
    this.ui.showMarkers(false);
    await this.ui.fade(1, 380);
    this.enterScene(id, spawn);
    await wait(0.05);
    await this.ui.fade(0, 420);
    const first = !this.state.visited[id];
    this.state.visited[id] = 1;
    const enter = this.D.enter && this.D.enter[id];
    if (enter) await enter(this, first);
    this.save();
  }

  // ---------- Figuren ----------
  fig(id, variant = null) {
    const key = variant ? `${id}:${variant}` : id;
    if (!this.figs[key]) {
      const base = this.C.characters[id];
      if (!base) throw new Error('Unbekannte Figur: ' + id);
      const spec = { ...base, ...(variant && base.variants ? base.variants[variant] : {}), id };
      delete spec.variants;
      const f = new Figure(this.R, spec);
      f.key = key;
      f.cid = id;
      this.figs[key] = f;
    }
    return this.figs[key];
  }

  who(id) { return id === 'holmes' ? this.holmes : this.cast[id]; }

  spawn(id, x, z, yaw = 0, variant = null) {
    if (this.cast[id]) this.despawn(id);
    const f = this.fig(id, variant);
    f.stop();
    f.setPos(x, z).setYaw(yaw);
    f.lookAt = null;
    f.talking = false;
    f.follow = false;
    f.place = null;
    this.scene.world.root.add(f.root);
    this.cast[id] = f;
    return f;
  }

  despawn(id) {
    const f = this.cast[id];
    if (!f) return;
    f.stop();
    f.root.highlight = 0;
    if (f.root.parent) f.root.parent.remove(f.root);
    delete this.cast[id];
    if (this.hover && this.hover.npc === id) this.setHover(null);
  }

  refreshCast(force = false) {
    const sc = this.scene;
    if (!sc) return;
    const list = this.C.placements(sc.id, this) || [];
    const want = new Set(list.map((p) => p.id));
    const follow = this.mode === 'play' && this.flag('paule') && !want.has('paule') && sc.paule !== false && !this.flag('paule_weg');
    for (const id of Object.keys(this.cast)) {
      if (id === 'paule' && follow) continue;
      if (!want.has(id)) this.despawn(id);
    }
    for (const p0 of list) {
      const s = p0.spot ? sc.spots[p0.spot] : null;
      if (p0.spot && !s) console.warn('Unbekannter Standort:', p0.spot);
      const p = s ? { x: s.x, z: s.z, yaw: s.yaw, at: s.at, ...p0 } : p0;
      const key = p.variant ? `${p.id}:${p.variant}` : p.id;
      let f = this.cast[p.id];
      if (f && f.key !== key) { this.despawn(p.id); f = null; }
      if (!f) f = this.spawn(p.id, p.x, p.z, p.yaw || 0, p.variant);
      else if (force) { f.stop(); f.setPos(p.x, p.z).setYaw(p.yaw || 0); }
      f.place = p;
      f.follow = false;
    }
    if (follow && !this.cast.paule) {
      const H = this.holmes;
      const [x, z] = sc.nav.nearest(H.x - Math.sin(H.yaw) * 0.9 + Math.cos(H.yaw) * 0.6, H.z - Math.cos(H.yaw) * 0.9 - Math.sin(H.yaw) * 0.6);
      this.spawn('paule', x, z, H.yaw);
    }
    if (follow && this.cast.paule) this.cast.paule.follow = true;
    this.rebuildNav();
  }

  rebuildNav() {
    const nav = this.scene.nav;
    nav.g.set(nav.base);
    if (this.scene.navMod) this.scene.navMod(nav, this);
    for (const f of Object.values(this.cast)) {
      if (f.follow || (f.place && f.place.solid === false)) continue;
      nav.blockCircle(f.x, f.z, 0.2 * (f.G || 1), 0.16);
    }
  }

  npcApproach(id) {
    const f = this.cast[id];
    if (!f) return null;
    if (f.place && f.place.at) return f.place.at;
    const d = f.sitting ? 1.05 : 0.95;
    return this.scene.nav.nearest(f.x + Math.sin(f.yaw) * d, f.z + Math.cos(f.yaw) * d);
  }

  onSpeaker(id) {
    this.holmes.talking = id === 'holmes';
    for (const [cid, f] of Object.entries(this.cast)) f.talking = cid === id;
  }

  updatePaule(dt) {
    const P = this.cast.paule;
    if (!P || !P.follow) return;
    this.pauleT -= dt;
    if (this.pauleT > 0) return;
    this.pauleT = 0.45;
    const H = this.holmes;
    const d = Math.hypot(P.x - H.x, P.z - H.z);
    if (d > 1.9) {
      const a = H.yaw;
      const tx = H.x - Math.sin(a) * 0.9 + Math.cos(a) * 0.55;
      const tz = H.z - Math.cos(a) * 0.9 - Math.sin(a) * 0.55;
      const goal = this.scene.nav.nearest(tx, tz);
      const path = this.scene.nav.path([P.x, P.z], goal);
      if (path.length) P.walkPath(path);
    } else if (!P.moving && d > 0.3) {
      P.faceTo(H.x, H.z);
    }
  }

  // ---------- Hotspots ----------
  hotspots() {
    const out = [];
    for (const h of this.scene.hotspots) if (!h.when || h.when(this)) out.push(h);
    for (const [id, f] of Object.entries(this.cast)) {
      if ((f.place && f.place.talk === false) || !this.D.talk[id]) continue;
      if (!f._hot) f._hot = { id: 'npc:' + id, npc: id, kind: 'talk', label: (this.C.speakers[id] || {}).name || id };
      out.push(f._hot);
    }
    return out;
  }

  bounds(h) {
    let b;
    if (h.npc) {
      const f = this.cast[h.npc];
      if (!f) return null;
      const r = 0.3 * (f.G || 1);
      const top = (f.sitting ? 1.45 : 1.95) * f.H;
      b = { min: [f.x - r, 0, f.z - r], max: [f.x + r, top, f.z + r] };
    } else if (h.box) {
      b = { min: h.box.slice(0, 3), max: h.box.slice(3, 6) };
    } else if (h.node) {
      if (!h.node.visible) return null;
      b = h.node.worldBounds();
      if (!isFinite(b.min[0])) return null;
    } else return null;
    const m = this.touch ? 0.42 : 0.26;
    for (let i = 0; i < 3; i++) {
      const s = b.max[i] - b.min[i];
      if (s < m) { const c = (b.max[i] + b.min[i]) / 2; b.min[i] = c - m / 2; b.max[i] = c + m / 2; }
    }
    return b;
  }

  anchor(h) {
    if (h.anchor) return h.anchor;
    if (h.npc) {
      const f = this.cast[h.npc];
      return f ? [f.x, (f.sitting ? 1.5 : 2.08) * f.H, f.z] : null;
    }
    const b = this.bounds(h);
    if (!b) return null;
    const a = [(b.min[0] + b.max[0]) / 2, b.max[1] + 0.1, (b.min[2] + b.max[2]) / 2];
    if (!h.dynamic) h.anchor = a;
    return a;
  }

  center(h) {
    if (h.npc) { const f = this.cast[h.npc]; return f ? [f.x, f.z] : [0, 0]; }
    const b = this.bounds(h);
    return b ? [(b.min[0] + b.max[0]) / 2, (b.min[2] + b.max[2]) / 2] : [this.holmes.x, this.holmes.z - 1];
  }

  pick(px, py) {
    const w = this.canvas.clientWidth, hh = this.canvas.clientHeight;
    const ray = this.cam.ray((px / w) * 2 - 1, 1 - (py / hh) * 2);
    let best = null, bd = Infinity;
    for (const h of this.hotspots()) {
      const b = this.bounds(h);
      if (!b) continue;
      const d = rayAABB(ray.o, ray.d, b.min, b.max);
      if (d >= 0 && d < bd) { bd = d; best = h; }
    }
    let floor = null;
    if (ray.d[1] < -1e-4) {
      const t = -ray.o[1] / ray.d[1];
      floor = [ray.o[0] + ray.d[0] * t, ray.o[2] + ray.d[2] * t];
    }
    return { hot: best, floor };
  }

  setHover(h, m = null) {
    if (this.hover !== h) {
      this.hover = h;
      this.canvas.style.cursor = h ? 'pointer' : '';
    }
    if (h && m) this.ui.hoverLabel(h.label, m[0], m[1]);
    else this.ui.hoverLabel(null);
  }

  updateHover() {
    const m = this.input.mouse;
    if (!m || this.busy || this.ui.panelOpen || this.ui.dialogOpen) { if (this.hover) this.setHover(null); return; }
    if (++this.hoverTick % 3) { if (this.hover) this.ui.hoverLabel(this.hover.label, m[0], m[1]); return; }
    this.setHover(this.pick(m[0], m[1]).hot, m);
  }

  updateHighlights() {
    for (const h of this.scene.hotspots) if (h.node) h.node.highlight = 0;
    for (const f of Object.values(this.cast)) f.root.highlight = 0;
    if (this.busy || this.mode !== 'play') return;
    for (const h of this.hotspots()) {
      const v = this.hover === h ? 0.9 : this.lookMode ? 0.42 : 0;
      if (!v) continue;
      if (h.npc) { const f = this.cast[h.npc]; if (f) f.root.highlight = v * 0.7; }
      else if (h.node) h.node.highlight = v;
    }
  }

  updateMarkers() {
    const show = this.lookMode || this.settings.markers !== false;
    if (this.busy || !show || this.ui.panelOpen) { this.ui.showMarkers(false); return; }
    this.ui.showMarkers(true);
    this.ui.markers.classList.toggle('labels', this.lookMode);
    const w = this.canvas.clientWidth, hh = this.canvas.clientHeight;
    const list = [];
    for (const h of this.hotspots()) {
      const a = this.anchor(h);
      if (!a) continue;
      const p = this.cam.project(a);
      if (!p || p[2] > 1 || Math.abs(p[0]) > 1.04 || Math.abs(p[1]) > 1.04) continue;
      list.push({
        id: h.id, label: h.label, kind: h.kind || 'look',
        done: h.kind !== 'exit' && !h.npc && !!this.state.examined[h.id],
        x: (p[0] * 0.5 + 0.5) * w, y: (0.5 - p[1] * 0.5) * hh,
      });
    }
    this.ui.setMarkers(list, (id) => {
      this.audio.init();
      const h = this.hotspots().find((x) => x.id === id);
      if (h && !this.busy && !this.ui.dialogOpen) this.interact(h);
    });
  }

  toggleLook(v = !this.lookMode) {
    this.lookMode = v;
    document.body.classList.toggle('look', v);
    if (v) this.audio.sfx('click');
  }

  // ---------- Eingabe ----------
  tapFx(p, kind) {
    const fx = document.getElementById('fx');
    if (!fx) return;
    const d = document.createElement('div');
    d.className = 'tapfx ' + kind;
    d.style.transform = `translate(${p[0]}px, ${p[1]}px)`;
    fx.appendChild(d);
    setTimeout(() => d.remove(), 650);
  }

  onTap(p, type) {
    this.audio.init();
    if (type === 'touch') this.touch = true;
    else if (type === 'mouse') this.touch = false;
    if (this.mode !== 'play') return;
    if (this.ui.dialogOpen) { if (!this.ui.choiceResolve) this.ui.advance(); return; }
    if (this.busy || this.ui.panelOpen) return;
    const { hot, floor } = this.pick(p[0], p[1]);
    if (hot) { this.tapFx(p, 'hot'); this.interact(hot); return; }
    if (floor) {
      const tok = ++this.token;
      const H = this.holmes;
      const goal = this.scene.nav.nearest(floor[0], floor[1]);
      const path = this.scene.nav.path([H.x, H.z], goal);
      if (path.length) { this.tapFx(p, 'walk'); H.walkPath(path).then(() => { if (tok === this.token) this.save(); }); }
    }
  }

  async interact(h) {
    if (this.busy) return;
    const tok = ++this.token;
    const H = this.holmes;
    let at = h.at || null;
    if (h.npc) at = this.npcApproach(h.npc);
    if (at && !h.noWalk && !(h.npc && h.npc === 'paule')) {
      const goal = this.scene.nav.nearest(at[0], at[1]);
      const path = this.scene.nav.path([H.x, H.z], goal);
      if (path.length) {
        const ok = await H.walkPath(path);
        if (!ok || tok !== this.token) return;
      }
    }
    if (tok !== this.token || this.busy) return;
    const face = h.face || this.center(h);
    H.faceTo(face[0], face[1]);
    await this.run(() => this.activate(h));
  }

  async activate(h) {
    this.state.examined[h.id] = 1;
    if (h.kind === 'exit') {
      const block = this.D.exitBlock ? this.D.exitBlock(h, this) : null;
      if (typeof block === 'function') { await block(this); return; }
      if (block) { await this.think(block); return; }
      this.audio.sfx(h.sound || 'door');
      await this.gotoScene(h.to, h.spawn);
      return;
    }
    if (h.npc) { await this.talkTo(h.npc); return; }
    const fn = this.D.actions[h.id];
    if (fn) await fn(this, h);
    else await this.think('Nichts, was mir im Augenblick weiterhilft.');
  }

  async talkTo(id) {
    const f = this.cast[id];
    const H = this.holmes;
    if (f) {
      if (!f.sitting && !(f.place && f.place.fixed)) f.faceTo(H.x, H.z);
      f.lookAt = H.headPos();
      H.lookAt = f.headPos();
      H.faceTo(f.x, f.z);
      if (id !== 'paule') this.cam.focus([(H.x + f.x) / 2, 1.3, (H.z + f.z) / 2], 5.4);
    }
    const fn = this.D.talk[id];
    if (fn) await fn(this);
    if (f) f.lookAt = null;
    H.lookAt = null;
    this.cam.unfocus();
  }

  // Gesprächsmenü: items [{id, text, when, once, run}]
  async topics(npc, { greet, items, bye = 'Das wäre alles.' }) {
    const key = 'talk:' + npc;
    const first = !this.state.seen[key];
    this.state.seen[key] = 1;
    if (greet) await greet(this, first);
    for (;;) {
      const avail = items.filter((it) => (!it.when || it.when(this)) && !(it.once && this.state.seen[it.id]));
      const opts = avail.map((it) => ({ text: it.text, seen: !!this.state.seen[it.id], isNew: !first && !this.state.seen[it.id] }));
      opts.push({ text: bye, end: true });
      const i = await this.ui.choose(opts, { speaker: 'holmes', prompt: '' });
      if (i >= avail.length) break;
      const it = avail[i];
      this.state.seen[it.id] = 1;
      this.audio.sfx('click');
      const r = await it.run(this);
      if (r === 'end') break;
    }
  }

  // ---------- Skript-Hilfen ----------
  say(who, text) { return this.ui.say(who, text); }
  think(text) { return this.ui.say('holmes', text, { thought: true }); }
  narrate(text) { return this.ui.say(null, text); }
  choose(options, prompt = '') {
    return this.ui.choose(options.map((o) => (typeof o === 'string' ? { text: o } : o)), { speaker: 'holmes', prompt });
  }
  wait(s) { return wait(s); }
  sfx(n) { this.audio.sfx(n); }
  face(id, x, z, instant = false) { const f = this.who(id); if (f) f.faceTo(x, z, instant); }
  faceEach(a, b) {
    const A = this.who(a), B = this.who(b);
    if (A && B) { A.faceTo(B.x, B.z); B.faceTo(A.x, A.z); }
  }
  gesture(id, name, dur = 1.6) { const f = this.who(id); if (f) f.gesture(name, dur); }
  look(id, otherId) { const f = this.who(id), o = otherId && this.who(otherId); if (f) f.lookAt = o ? o.headPos() : null; }
  async walk(id, x, z) {
    const f = this.who(id);
    if (!f) return false;
    const goal = this.scene.nav.nearest(x, z);
    const path = this.scene.nav.path([f.x, f.z], goal);
    if (!path.length) return true;
    return f.walkPath(path);
  }
  walkDirect(id, pts) { const f = this.who(id); return f ? f.walkPath(pts) : Promise.resolve(false); }
  focus(p, d = 4.5) { this.cam.focus(p, d); }
  unfocus() { this.cam.unfocus(); }
  minigame(name, opts = {}) { return this.mini.run(name, opts); }
  present(prompt, opts = {}) { return this.notebook.pick(prompt, opts); }
  journal(o) { return this.notebook.journal(o); }

  has(id) { return !!this.state.clues[id]; }
  hasAll(...ids) { return ids.every((id) => this.state.clues[id]); }
  hasAny(...ids) { return ids.some((id) => this.state.clues[id]); }
  flag(n) { return !!this.state.flags[n]; }
  set(n, v = true) { if (v) this.state.flags[n] = v; else delete this.state.flags[n]; }
  solved(id) { return !!this.state.deds[id]; }
  seen(id) { return !!this.state.seen[id]; }
  visited(id) { return !!this.state.visited[id]; }

  addClue(id) {
    if (this.state.clues[id]) return false;
    const c = this.C.clues[id];
    if (!c) { console.warn('Unbekannter Hinweis:', id); return false; }
    this.state.clues[id] = Math.round(this.state.minutes);
    this.state.fresh[id] = 1;
    this.audio.sfx('clue');
    const kind = c.kind === 'aussage' ? 'Neue Aussage' : c.kind === 'dokument' ? 'Neues Dokument' : 'Neue Spur';
    this.ui.toast(`<small>${kind} im Notizbuch</small><b>${esc(c.title)}</b>`, 'clue');
    this.advanceTime(5);
    this.checkDeductions();
    this.updateBadge();
    return true;
  }

  dedAvailable(d) {
    return d.needs.every((c) => this.state.clues[c]) && (d.needsDed || []).every((x) => this.state.deds[x]);
  }

  checkDeductions() {
    for (const d of this.C.deductions) {
      if (this.state.deds[d.id] || this.state.announced[d.id] || !this.dedAvailable(d)) continue;
      this.state.announced[d.id] = 1;
      setTimeout(() => this.ui.toast(`<small>Kombinieren möglich</small><b>${esc(d.title)}</b>`, 'ded'), 900);
    }
  }

  solveDeduction(id) {
    if (this.state.deds[id]) return;
    this.state.deds[id] = Math.round(this.state.minutes);
    this.advanceTime(4);
    this.audio.sfx('success');
    this.checkDeductions();
    this.updateBadge();
    this.refreshObjective();
    this.save();
  }

  updateBadge() {
    const fresh = Object.keys(this.state.fresh).length;
    const ded = this.C.deductions.some((d) => !this.state.deds[d.id] && this.dedAvailable(d));
    const b = document.querySelector('#btn-book .badge');
    if (b) {
      b.classList.toggle('hidden', !fresh && !ded);
      b.textContent = ded ? '!' : fresh ? String(fresh) : '';
    }
  }

  advanceTime(m) {
    const before = Math.floor(this.state.minutes / 60);
    this.state.minutes += m;
    const after = Math.floor(this.state.minutes / 60);
    if (after > before && this.mode === 'play') {
      const hr = after % 12 || 12;
      setTimeout(() => this.audio.churchBell(hr), 700);
    }
    this.updateHUD();
  }

  timeLabel() { return 'Di., 15. Nov. 1892 · ' + clockLabel(this.state.minutes); }

  updateHUD() {
    if (!this.scene) return;
    this.ui.setLocation(this.scene.name, this.timeLabel());
  }

  refreshObjective(announce = true) {
    if (this.mode !== 'play') return;
    const o = this.C.objective(this);
    const el = document.getElementById('objective');
    if (o !== this.state.objective) {
      const had = this.state.objective;
      this.state.objective = o;
      if (announce && had) setTimeout(() => this.ui.toast(`<small>Nächster Schritt</small><b>${esc(o)}</b>`, 'goal'), 400);
    }
    if (el) el.textContent = o;
  }

  // ---------- Ablauf ----------
  async run(fn) {
    this.busy++;
    this.ui.showMarkers(false);
    this.setHover(null);
    document.body.classList.add('busy');
    try {
      await fn();
    } catch (e) {
      console.error(e);
      this.ui.toast(`<small>Fehler im Ablauf</small><b>${esc(e.message || e)}</b>`, 'error');
    } finally {
      this.busy = Math.max(0, this.busy - 1);
      if (!this.busy) {
        this.ui.hideDialog();
        this.cam.unfocus();
        if (this.mode === 'play') {
          this.refreshCast();
          this.refreshObjective();
          this.updateBadge();
          this.save();
        }
        document.body.classList.remove('busy');
      }
    }
  }

  async askHint() {
    if (this.busy || this.mode !== 'play') return;
    await this.run(async () => {
      const P = this.cast.paule;
      if (P) { P.faceTo(this.holmes.x, this.holmes.z); P.lookAt = this.holmes.headPos(); }
      await this.D.hint(this);
      if (P) P.lookAt = null;
    });
  }

  showTitle() {
    this.mode = 'title';
    this.busy = 0;
    document.body.classList.remove('busy', 'look');
    this.lookMode = false;
    this.ui.hideDialog();
    this.ui.closePanel();
    this.ui.closeOverlay();
    this.ui.showHUD(false);
    this.ui.showMarkers(false);
    this.state = this.freshState();
    this.enterScene(this.C.titleScene || this.C.start.scene, 'title');
  }

  async newGame() {
    Game.clearSave();
    await this.ui.fade(1, 450);
    this.state = this.freshState();
    this.mode = 'play';
    this.enterScene(this.C.start.scene, this.C.start.spawn);
    this.ui.showHUD(true);
    this.updateHUD();
    this.refreshObjective(false);
    this.updateBadge();
    this.run(() => this.D.intro(this));
  }

  async continueGame() {
    await this.ui.fade(1, 400);
    if (!this.loadState()) { this.newGame(); return; }
    this.mode = 'play';
    this.enterScene(this.state.scene, 'default', this.state.pos);
    this.ui.showHUD(true);
    this.updateHUD();
    this.refreshObjective(false);
    this.updateBadge();
    await wait(0.05);
    await this.ui.fade(0, 500);
    this.ui.toast(`<small>Spielstand geladen</small><b>${esc(this.scene.name)} · ${clockLabel(this.state.minutes)}</b>`);
    if (this.D.resume) this.run(() => this.D.resume(this));
  }

  async finish() {
    this.state.done = true;
    Game.clearSave();
    const st = this.state;
    const stats = {
      minutes: Math.round(st.playMs / 60000),
      clues: Object.keys(st.clues).length,
      cluesTotal: Object.keys(this.C.clues).length,
      wrongDed: st.wrongDed, wrongAccuse: st.wrongAccuse, wrongPresent: st.wrongPresent, hints: st.hints,
    };
    await this.notebook.endScreen(stats);
    this.onQuit();
  }

  // ---------- Spielstand ----------
  save() {
    if (this.mode !== 'play' || this.state.done || !this.scene) return;
    try {
      const H = this.holmes;
      this.state.pos = [+H.x.toFixed(2), +H.z.toFixed(2), +H.yaw.toFixed(2)];
      this.state.scene = this.scene.id;
      localStorage.setItem(SAVE_KEY, JSON.stringify(this.state));
    } catch (_) { /* Speichern nicht möglich (privater Modus) */ }
  }
  loadState() {
    try {
      const s = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null');
      if (s && s.v === SAVE_VERSION && !s.done) { this.state = Object.assign(this.freshState(), s); return true; }
    } catch (_) { /* beschädigt */ }
    return false;
  }
  static hasSave() {
    try {
      const s = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null');
      return !!(s && s.v === SAVE_VERSION && !s.done);
    } catch (_) { return false; }
  }
  static clearSave() { try { localStorage.removeItem(SAVE_KEY); } catch (_) { /* egal */ } }

  // ---------- Schleife ----------
  update(dt, t) {
    const sc = this.scene;
    if (!sc) return;
    if (this.mode === 'play' && !document.hidden) this.state.playMs += dt * 1000;
    const H = this.holmes;
    if (H.root.parent) H.update(dt, t);
    for (const f of Object.values(this.cast)) {
      if (!this.busy && this.mode === 'play' && f !== this.cast.paule) {
        const d = Math.hypot(f.x - H.x, f.z - H.z);
        f.lookAt = d < 3.2 ? H.headPos() : null;
      }
      f.update(dt, t);
    }
    if (this.mode === 'play') this.updatePaule(dt);
    if (sc.update) sc.update(dt, t, this);
    const aspect = this.R.width / Math.max(1, this.R.height);
    this.cam.update(dt, aspect, this.mode === 'play' ? [H.x, 0, H.z] : null);
    if (this.mode === 'play') {
      this.updateHover();
      this.updateHighlights();
      this.updateMarkers();
    }
  }

  render(t) {
    if (this.scene) this.R.render(this.scene.world, this.cam, t);
  }
}
