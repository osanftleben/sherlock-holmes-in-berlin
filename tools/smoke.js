// Rauchtest ohne Browser: baut alle Schauplätze und Figuren von Fall 1 mit Attrappen für Canvas und Renderer.
// Prüft Geometrie auf NaN, den Texturatlas auf Überlauf, Begehbarkeit und Erreichbarkeit aller Start-,
// Steh- und Hotspotpunkte, ob jeder Hotspot eine Aktion hat und ob die update-Funktionen fehlerfrei laufen.
// Aufruf: node tools/smoke.js
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const warnings = [];
console.warn = (...a) => warnings.push(a.join(' '));

// ---------- Attrappen ----------
function fakeCtx() {
  const grad = { addColorStop() {} };
  const t = {
    font: '10px serif',
    measureText(s) {
      const m = /(\d+(?:\.\d+)?)px/.exec(String(t.font));
      return { width: String(s).length * (m ? parseFloat(m[1]) : 10) * 0.55 };
    },
    createLinearGradient: () => grad,
    createRadialGradient: () => grad,
    createPattern: () => ({}),
    getImageData: (x, y, w, h) => ({ data: new Uint8ClampedArray(Math.max(1, w * h * 4)) }),
  };
  return new Proxy(t, {
    get: (o, k) => (k in o ? o[k] : () => {}),
    set: (o, k, v) => { o[k] = v; return true; },
  });
}
globalThis.document = { createElement: (tag) => ({ tagName: tag, width: 0, height: 0, style: {}, getContext: () => fakeCtx() }) };

const stats = { meshes: 0, tris: 0 };
const R = {
  createMesh(b) {
    const d = b.data;
    for (let i = 0; i < d.length; i++) if (!Number.isFinite(d[i])) throw new Error(`Ungültiger Zahlenwert in der Geometrie (Index ${i}, Vertex ${Math.floor(i / 15)})`);
    stats.meshes++;
    stats.tris += b.idx.length / 3;
    return { count: b.idx.length };
  },
  createTexture: () => ({}),
};

const imp = (p) => import(pathToFileURL(path.join(root, p)).href);
const { Atlas } = await imp('src/game/art.js');
const { Figure } = await imp('src/game/figures.js');
const C = (await imp('src/cases/case1/case.js')).default;

// Atlasbelegung mitschreiben
let atlasUse = 0;
const add0 = Atlas.prototype.add;
Atlas.prototype.add = function (w, h, draw) {
  const r = add0.call(this, w, h, draw);
  atlasUse = Math.max(atlasUse, (this.y + Math.max(this.rowH, h)) / this.size);
  return r;
};

// ---------- Hilfen ----------
function reachable(nav, x, z) {
  const seen = new Uint8Array(nav.w * nav.h);
  const i0 = nav.ci(x), j0 = nav.cj(z);
  if (!nav.ok(i0, j0)) return seen;
  const q = [[i0, j0]];
  seen[j0 * nav.w + i0] = 1;
  while (q.length) {
    const [i, j] = q.pop();
    for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const a = i + di, c = j + dj;
      if (nav.ok(a, c) && !seen[c * nav.w + a]) { seen[c * nav.w + a] = 1; q.push([a, c]); }
    }
  }
  return seen;
}

function fakeGame(flags = {}) {
  const fig = { x: 0, z: 0, root: { parent: {} } };
  return {
    state: { minutes: 8 * 60 + 25, flags: { ...flags } },
    flag: (n) => !!flags[n], has: () => false, solved: () => false, visited: () => false,
    holmes: fig, cast: {}, mode: 'play', sfx() {},
  };
}

let failures = 0;
const fail = (s) => { failures++; console.log('  ✗ ' + s); };

// ---------- Figuren ----------
console.log('Figuren');
for (const [id, spec] of Object.entries(C.characters)) {
  const variants = [null, ...Object.keys(spec.variants || {})];
  for (const v of variants) {
    try {
      const f = new Figure(R, { ...spec, ...(v ? spec.variants[v] : {}), id });
      for (let i = 0; i < 5; i++) f.update(0.05, i * 0.05);
    } catch (e) { fail(`${id}${v ? ':' + v : ''}: ${e.message}`); }
  }
}
console.log(`  ${Object.keys(C.characters).length} Figuren gebaut`);

// ---------- Schauplätze ----------
const actions = C.dialogs.actions;
const allSpots = {};
const built = {};
for (const [id, build] of Object.entries(C.scenes)) {
  const m0 = stats.meshes, t0 = stats.tris;
  atlasUse = 0;
  const w0 = warnings.length;
  let sc;
  try { sc = build(R); } catch (e) { fail(`${id}: Aufbau fehlgeschlagen – ${e.stack.split('\n').slice(0, 3).join(' | ')}`); continue; }
  console.log(`${id} – ${sc.name}: ${stats.meshes - m0} Meshes, ${Math.round(stats.tris - t0)} Dreiecke, Atlas ${Math.round(atlasUse * 100)} %, ${sc.world.env.lights.length} Lichter, ${sc.hotspots.length} Hotspots`);
  for (const w of warnings.slice(w0)) fail(`${id}: Warnung – ${w}`);
  allSpots[id] = sc.spots;
  built[id] = sc;

  const nav = sc.nav;
  nav.base = nav.g.slice();
  const sp = sc.spawns.default || Object.values(sc.spawns)[0];
  const reach = reachable(nav, sp[0], sp[1]);
  const check = (what, x, z) => {
    if (!nav.isWalkable(x, z)) { fail(`${id}: ${what} (${x}, ${z}) ist nicht begehbar`); return; }
    if (!reach[nav.cj(z) * nav.w + nav.ci(x)]) fail(`${id}: ${what} (${x}, ${z}) ist vom Startpunkt aus nicht erreichbar`);
  };
  for (const [n, [x, z]] of Object.entries(sc.spawns)) check(`Startpunkt »${n}«`, x, z);
  for (const [n, s] of Object.entries(sc.spots)) if (s.at) check(`Ansprechpunkt von »${n}«`, s.at[0], s.at[1]);
  const ids = new Set();
  for (const h of sc.hotspots) {
    if (ids.has(h.id)) fail(`${id}: Hotspot-ID ${h.id} doppelt`);
    ids.add(h.id);
    if (h.at && !h.noWalk) check(`Hotspot »${h.id}«`, h.at[0], h.at[1]);
    if (h.kind === 'look' && !actions[h.id]) fail(`${id}: Hotspot ${h.id} hat keine Aktion`);
    if (h.kind === 'exit') {
      if (!C.scenes[h.to]) fail(`${id}: Ausgang ${h.id} führt zu unbekanntem Schauplatz ${h.to}`);
    }
    if (h.box && (h.box[0] > h.box[3] || h.box[1] > h.box[4] || h.box[2] > h.box[5])) fail(`${id}: Hotspot ${h.id} hat eine verdrehte Box`);
  }
  if (sc.navMod) {
    sc.navMod(nav, fakeGame());
    nav.g.set(nav.base);
  }
  // update-Funktion: ohne und mit Spiel, mit verschiedenen Flags
  try {
    for (let i = 0; i < 30; i++) sc.update(0.05, i * 0.05, null);
    for (const fl of [{}, { voss_distracted: true, zutritt: true }]) {
      const g = fakeGame(fl);
      for (let i = 0; i < 30; i++) sc.update(0.05, 2 + i * 0.05, g);
    }
  } catch (e) { fail(`${id}: update – ${e.stack.split('\n').slice(0, 3).join(' | ')}`); }
}

// ---------- Platzierungen gegen Standorte ----------
for (const flags of [{}, { finale: true }, { finale: true, geloest: true, gustav_frei: true }, { wenzel_draussen: true }]) {
  const g = fakeGame(flags);
  for (const id of Object.keys(C.scenes)) {
    for (const p of C.placements(id, g) || []) {
      if (p.spot && !(allSpots[id] || {})[p.spot]) fail(`${id}: Standort »${p.spot}« für ${p.id} fehlt in der Szene`);
      if (!C.characters[p.id]) fail(`${id}: Figur ${p.id} ist nicht definiert`);
    }
  }
}

// ---------- Ausgänge: Zielstartpunkte vorhanden? ----------
for (const [id, sc] of Object.entries(built)) {
  for (const h of sc.hotspots) {
    if (h.kind !== 'exit' || !built[h.to]) continue;
    if (h.spawn && !built[h.to].spawns[h.spawn]) fail(`${id}: Ausgang ${h.id} zielt auf fehlenden Startpunkt »${h.spawn}« in ${h.to}`);
  }
}
const st = C.start;
if (!built[st.scene] || !built[st.scene].spawns[st.spawn]) fail(`Spielstart ${st.scene}/${st.spawn} existiert nicht`);

console.log(failures ? `\n${failures} Problem(e) gefunden.` : '\nRauchtest bestanden.');
process.exit(failures ? 1 : 0);
