// Prozedurale Klangwelt mit der Web Audio API: Atmosphären, Uhrenticken, Glocken, Spieluhr-Melodie
const AMBIENCES = {
  title: { layers: [['rumble', 0.10], ['drizzle', 0.035]], events: [['hooves', 0.025], ['bellFar', 0.006]] },
  strasse: { layers: [['rumble', 0.16], ['drizzle', 0.05], ['wind', 0.05]], events: [['hooves', 0.03], ['voice', 0.09], ['cart', 0.015], ['bellFar', 0.004]] },
  werkstatt: { layers: [['room', 0.05], ['street', 0.04]], events: [['creak', 0.03], ['hooves', 0.008]] },
  hof: { layers: [['wind', 0.09], ['street', 0.035], ['drizzle', 0.025]], events: [['drip', 0.5], ['voice', 0.03], ['creak', 0.02]] },
  kneipe: { layers: [['murmur', 0.12], ['room', 0.04]], events: [['clink', 0.18], ['crackle', 1.4], ['laugh', 0.04]], tickers: [[1.0, 2600, 0.05]] },
  voss: { layers: [['room', 0.05], ['hiss', 0.012], ['street', 0.03]], events: [], tickers: [[0.5, 4200, 0.03], [0.6, 3100, 0.035], [0.75, 2500, 0.04], [1.0, 3600, 0.03], [1.0, 2000, 0.035], [1.2, 4700, 0.025]] },
  epilog: { layers: [['room', 0.05]], events: [], tickers: [[0.5, 4200, 0.03], [0.75, 2500, 0.04], [1.0, 3600, 0.03], [1.0, 2000, 0.035], [1.2, 4700, 0.025], [0.6, 3000, 0.03]] },
};

// Spieluhr-Thema (eigene Komposition), a-Moll, 3/4-Takt: [MIDI, Schläge]
const THEME = [
  [76, 1], [81, 1], [84, 1], [83, 2], [81, 1], [80, 1], [83, 1], [76, 1], [81, 3],
  [84, 1], [83, 1], [81, 1], [86, 2], [84, 1], [83, 1], [81, 1], [80, 1], [81, 2], [76, 1],
  [77, 1], [81, 1], [86, 1], [84, 2], [83, 1], [76, 1], [80, 1], [83, 1], [81, 3],
  [81, 1], [84, 1], [88, 1], [86, 1], [84, 1], [83, 1], [84, 1], [83, 1], [80, 1], [81, 3],
];
const THEME_BASS = [57, 52, 52, 57, 57, 50, 52, 57, 50, 57, 52, 57, 57, 50, 52, 57];

export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.volume = 0.8;
    this.musicOn = true;
    this.amb = { type: null, nodes: [], tickers: [], events: [] };
    this.theme = null;
  }

  init() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ctx = (this.ctx = new AC());
    this.master = ctx.createGain();
    this.master.gain.value = this.volume;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14;
    comp.ratio.value = 3;
    comp.connect(this.master);
    this.master.connect(ctx.destination);
    this.sfxBus = ctx.createGain(); this.sfxBus.gain.value = 0.9; this.sfxBus.connect(comp);
    this.ambBus = ctx.createGain(); this.ambBus.gain.value = 0.9; this.ambBus.connect(comp);
    this.musicBus = ctx.createGain(); this.musicBus.gain.value = this.musicOn ? 0.7 : 0; this.musicBus.connect(comp);
    const sr = ctx.sampleRate;
    const n = sr * 3;
    this.white = ctx.createBuffer(1, n, sr);
    const w = this.white.getChannelData(0);
    for (let i = 0; i < n; i++) w[i] = Math.random() * 2 - 1;
    this.brown = ctx.createBuffer(1, n, sr);
    const b = this.brown.getChannelData(0);
    let last = 0;
    for (let i = 0; i < n; i++) { last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02; b[i] = last * 3.5; }
    document.addEventListener('visibilitychange', () => {
      if (!this.ctx) return;
      if (document.hidden) this.ctx.suspend(); else this.ctx.resume();
    });
    if (this.pendingAmb) { const t = this.pendingAmb; this.pendingAmb = null; this.setAmbience(t); }
  }

  get now() { return this.ctx ? this.ctx.currentTime : 0; }
  setVolume(v) { this.volume = v; if (this.master) this.master.gain.setTargetAtTime(v, this.now, 0.05); }
  setMusic(on) {
    this.musicOn = on;
    if (this.musicBus) this.musicBus.gain.setTargetAtTime(on ? 0.7 : 0, this.now, 0.1);
  }

  // ---------- Bausteine ----------
  noise({ t = this.now, dur = 0.05, freq = 1000, q = 1, gain = 0.1, type = 'bandpass', bus = this.sfxBus, attack = 0.002, buf = this.white, rate = 1 }) {
    const ctx = this.ctx;
    if (!ctx) return;
    const s = ctx.createBufferSource();
    s.buffer = buf;
    s.playbackRate.value = rate;
    const f = ctx.createBiquadFilter();
    f.type = type; f.frequency.value = freq; f.Q.value = q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(gain, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f).connect(g).connect(bus);
    s.start(t, Math.random() * 2);
    s.stop(t + dur + 0.05);
  }
  tone({ t = this.now, freq = 440, freqEnd = null, dur = 0.2, gain = 0.1, type = 'sine', bus = this.sfxBus, attack = 0.005 }) {
    const ctx = this.ctx;
    if (!ctx) return;
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (freqEnd) o.frequency.exponentialRampToValueAtTime(freqEnd, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(gain, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(bus);
    o.start(t);
    o.stop(t + dur + 0.05);
  }
  bell(t, f, gain = 0.2, dur = 3, bus = this.sfxBus, partials = [[0.5, 0.5, 1.2], [1, 1, 1], [1.19, 0.5, 0.7], [1.5, 0.35, 0.6], [2, 0.45, 0.5], [2.52, 0.2, 0.35], [3.01, 0.15, 0.3], [4.2, 0.08, 0.2]], lowpass = 0) {
    const ctx = this.ctx;
    if (!ctx) return;
    let out = bus;
    if (lowpass) {
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass'; lp.frequency.value = lowpass;
      lp.connect(bus);
      out = lp;
    }
    for (const [m, a, d] of partials) {
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = f * m;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(gain * a, t + 0.006);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur * d);
      o.connect(g).connect(out);
      o.start(t);
      o.stop(t + dur * d + 0.1);
    }
  }
  mbNote(t, midi, gain = 0.12, bus = this.musicBus) {
    const f = 440 * Math.pow(2, (midi - 69) / 12);
    const len = Math.max(0.6, 2.2 - (midi - 50) * 0.03);
    this.bell(t, f, gain, len, bus, [[1, 1, 1], [2, 0.3, 0.55], [3.01, 0.14, 0.4], [4.17, 0.1, 0.28], [5.43, 0.05, 0.2]]);
  }

  // ---------- Effekte ----------
  sfx(name) {
    if (!this.ctx) return;
    const t = this.now;
    switch (name) {
      case 'click': this.noise({ t, dur: 0.03, freq: 2400, q: 2, gain: 0.08 }); break;
      case 'page':
        this.noise({ t, dur: 0.18, freq: 3500, q: 0.6, gain: 0.06, attack: 0.03 });
        this.noise({ t: t + 0.08, dur: 0.12, freq: 1800, q: 0.8, gain: 0.04, attack: 0.02 });
        break;
      case 'clue':
        this.mbNote(t, 88, 0.16, this.sfxBus);
        this.mbNote(t + 0.14, 93, 0.14, this.sfxBus);
        break;
      case 'success':
        [81, 84, 88, 93].forEach((m, i) => this.mbNote(t + i * 0.11, m, 0.14, this.sfxBus));
        break;
      case 'fail':
        this.tone({ t, freq: 140, freqEnd: 70, dur: 0.35, gain: 0.25 });
        this.noise({ t, dur: 0.15, freq: 300, q: 1, gain: 0.08, type: 'lowpass' });
        break;
      case 'door':
        this.noise({ t, dur: 0.25, freq: 220, q: 1.2, gain: 0.2, type: 'lowpass', buf: this.brown });
        this.noise({ t: t + 0.18, dur: 0.08, freq: 900, q: 2, gain: 0.1 });
        break;
      case 'shopbell':
        this.bell(t, 1880, 0.07, 0.9, this.sfxBus, [[1, 1, 1], [1.34, 0.6, 0.7], [2.1, 0.3, 0.4]]);
        this.bell(t + 0.12, 1960, 0.05, 0.8, this.sfxBus, [[1, 1, 1], [1.34, 0.6, 0.7], [2.1, 0.3, 0.4]]);
        break;
      case 'trambell':
        this.bell(t, 1250, 0.08, 0.7, this.ambBus, [[1, 1, 1], [2.4, 0.4, 0.5]]);
        this.bell(t + 0.22, 1250, 0.07, 0.7, this.ambBus, [[1, 1, 1], [2.4, 0.4, 0.5]]);
        break;
      case 'strike':
        this.bell(t, 620, 0.16, 2.6, this.sfxBus, [[1, 1, 1], [2.76, 0.4, 0.6], [5.4, 0.15, 0.35], [0.5, 0.2, 0.8]]);
        break;
      case 'paper': this.noise({ t, dur: 0.25, freq: 5000, q: 0.5, gain: 0.05, attack: 0.04 }); break;
      case 'rub': this.noise({ t, dur: 0.07, freq: 3000 + Math.random() * 1500, q: 0.8, gain: 0.035, attack: 0.01 }); break;
      case 'whistle':
        this.tone({ t, freq: 2300, freqEnd: 2900, dur: 0.35, gain: 0.06, type: 'triangle' });
        this.tone({ t: t + 0.4, freq: 2900, freqEnd: 2200, dur: 0.4, gain: 0.06, type: 'triangle' });
        break;
      case 'tick': this.noise({ t, dur: 0.015, freq: 3200, q: 8, gain: 0.12 }); break;
    }
  }
  clockStrikes(n, gap = 1.25) {
    if (!this.ctx) return;
    for (let i = 0; i < n; i++) setTimeout(() => this.sfx('strike'), i * gap * 1000);
  }
  churchBell(n) {
    if (!this.ctx) return;
    const t = this.now;
    for (let i = 0; i < n; i++) this.bell(t + i * 2.4, 196, 0.12, 6, this.ambBus, undefined, 1400);
  }

  // ---------- Atmosphäre ----------
  _loop(kind, level) {
    const ctx = this.ctx;
    const src = ctx.createBufferSource();
    src.loop = true;
    const g = ctx.createGain();
    g.gain.value = 0;
    let chain = [];
    const filt = (type, f, q = 0.7) => { const x = ctx.createBiquadFilter(); x.type = type; x.frequency.value = f; x.Q.value = q; return x; };
    let lfo = null;
    switch (kind) {
      case 'rumble': src.buffer = this.brown; chain = [filt('lowpass', 260)]; break;
      case 'street': src.buffer = this.brown; chain = [filt('lowpass', 380), filt('highpass', 60)]; break;
      case 'room': src.buffer = this.brown; chain = [filt('lowpass', 160)]; break;
      case 'drizzle': src.buffer = this.white; chain = [filt('highpass', 2600), filt('lowpass', 9000)]; break;
      case 'hiss': src.buffer = this.white; chain = [filt('highpass', 6000)]; break;
      case 'wind': src.buffer = this.brown; chain = [filt('bandpass', 520, 0.6)]; lfo = 0.09; break;
      case 'murmur': src.buffer = this.brown; chain = [filt('bandpass', 520, 1.1), filt('peaking', 1200, 1)]; lfo = 0.6; src.playbackRate.value = 1.6; break;
    }
    let node = src;
    for (const c of chain) { node.connect(c); node = c; }
    node.connect(g).connect(this.ambBus);
    const nodes = [src, g];
    if (lfo) {
      const o = ctx.createOscillator();
      o.frequency.value = lfo;
      const d = ctx.createGain();
      d.gain.value = level * 0.45;
      o.connect(d).connect(g.gain);
      o.start();
      nodes.push(o);
    }
    src.start(0, Math.random() * 2);
    g.gain.setTargetAtTime(level, this.now, 0.6);
    return { nodes, gain: g };
  }

  setAmbience(type) {
    if (!this.ctx) { this.pendingAmb = type; return; }
    if (this.amb.type === type) return;
    const old = this.amb;
    const t = this.now;
    for (const l of old.nodes) {
      l.gain.gain.cancelScheduledValues(t);
      l.gain.gain.setTargetAtTime(0, t, 0.4);
      setTimeout(() => { for (const n of l.nodes) { try { n.stop(); } catch (_) { /* schon gestoppt */ } } }, 2500);
    }
    const def = AMBIENCES[type] || { layers: [], events: [] };
    this.amb = {
      type,
      nodes: def.layers.map(([k, lv]) => this._loop(k, lv)),
      tickers: (def.tickers || []).map(([p, f, g], i) => ({ period: p, freq: f, gain: g, next: t + 0.3 + i * 0.13, n: 0 })),
      events: def.events || [],
    };
  }

  _event(kind) {
    const t = this.now, A = this.ambBus;
    switch (kind) {
      case 'hooves': {
        const n = 10 + Math.floor(Math.random() * 10), rate = 0.19 + Math.random() * 0.05;
        for (let i = 0; i < n; i++) {
          const env = Math.sin((i / n) * Math.PI);
          const tt = t + i * rate + (i % 2 ? 0.05 : 0);
          this.noise({ t: tt, dur: 0.05, freq: 650 + Math.random() * 300, q: 3, gain: 0.05 * env, bus: A });
          this.tone({ t: tt, freq: 150, dur: 0.05, gain: 0.03 * env, bus: A });
        }
        break;
      }
      case 'cart':
        this.noise({ t, dur: 3.5, freq: 180, q: 0.8, gain: 0.08, type: 'lowpass', buf: this.brown, attack: 1.2, bus: A });
        this._event('hooves');
        break;
      case 'voice':
        for (let i = 0; i < 3; i++) this.noise({ t: t + i * 0.22, dur: 0.18, freq: 380 + Math.random() * 500, q: 4, gain: 0.025, attack: 0.04, bus: A });
        break;
      case 'laugh':
        for (let i = 0; i < 5; i++) this.noise({ t: t + i * 0.14, dur: 0.1, freq: 700 + Math.random() * 300, q: 5, gain: 0.03, attack: 0.02, bus: A });
        break;
      case 'creak': this.tone({ t, freq: 220 + Math.random() * 80, freqEnd: 180, dur: 0.4, gain: 0.012, type: 'sawtooth', bus: A, attack: 0.15 }); break;
      case 'drip': this.tone({ t, freq: 1700 + Math.random() * 900, freqEnd: 800, dur: 0.07, gain: 0.025, bus: A }); break;
      case 'clink': this.bell(t, 3000 + Math.random() * 1400, 0.025, 0.5, A, [[1, 1, 1], [1.5, 0.5, 0.6]]); break;
      case 'crackle': this.noise({ t, dur: 0.015 + Math.random() * 0.02, freq: 2500, q: 1, gain: 0.03 * Math.random(), type: 'highpass', bus: A }); break;
      case 'bellFar': this.bell(t, 233, 0.05, 5, A, undefined, 900); break;
    }
  }

  update(dt) {
    if (!this.ctx || this.ctx.state !== 'running') return;
    const t = this.now;
    for (const tk of this.amb.tickers) {
      while (tk.next < t + 0.2) {
        const acc = tk.n % 2 ? 0.75 : 1;
        this.noise({ t: tk.next, dur: 0.014, freq: tk.freq * (tk.n % 2 ? 0.86 : 1), q: 9, gain: tk.gain * acc, bus: this.ambBus });
        tk.next += tk.period;
        tk.n++;
      }
    }
    for (const [kind, rate] of this.amb.events) if (Math.random() < rate * dt) this._event(kind);
    // Spieluhr-Thema
    if (this.theme) {
      const th = this.theme;
      while (th.next < t + 0.35) {
        if (th.i >= THEME.length) { th.i = 0; th.beat = 0; th.next += 2.4; continue; }
        const [m, beats] = THEME[th.i];
        if (th.beat % 3 === 0) {
          const bar = Math.floor(th.beat / 3);
          this.mbNote(th.next, THEME_BASS[bar % THEME_BASS.length], 0.07);
        }
        this.mbNote(th.next, m, 0.1);
        th.next += beats * th.spb;
        th.beat += beats;
        th.i++;
      }
    }
  }

  startTheme() {
    if (!this.ctx || this.theme) return;
    this.theme = { i: 0, beat: 0, next: this.now + 0.4, spb: 0.56 };
  }
  stopTheme() { this.theme = null; }
}
