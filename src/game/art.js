// Texturatlas und Zeichenfunktionen für Schilder, Zifferblätter, Plakate und Papiere (Canvas 2D)
export const SERIF = '"Palatino Linotype", "Book Antiqua", Palatino, Georgia, "Times New Roman", serif';
export const SCRIPT = '"Segoe Script", "Brush Script MT", "Lucida Handwriting", "Apple Chancery", cursive';

export class Atlas {
  constructor(size = 1024) {
    this.size = size;
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.canvas.height = size;
    this.ctx = this.canvas.getContext('2d');
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillRect(0, 0, 16, 16); // weißer Bereich für untexturierte Flächen
    this.x = 20; this.y = 0; this.rowH = 16; this.pad = 6;
  }
  add(w, h, draw) {
    const S = this.size, p = this.pad;
    if (this.x + w + p > S) { this.x = 0; this.y += this.rowH + p; this.rowH = 0; }
    if (this.y + h > S) { console.warn('Atlas voll'); return [0, 0, 0.01, 0.01]; }
    const x = this.x, y = this.y;
    const c = this.ctx;
    c.save();
    c.beginPath();
    c.rect(x, y, w, h);
    c.clip();
    c.translate(x, y);
    draw(c, w, h);
    c.restore();
    this.x += w + p;
    this.rowH = Math.max(this.rowH, h);
    const e = 0.5;
    return [(x + e) / S, (y + e) / S, (x + w - e) / S, (y + h - e) / S];
  }
  upload(R) { return R.createTexture(this.canvas); }
}

export function fitFont(c, text, maxW, size, weight = 'bold', family = SERIF, spacing = 0) {
  let s = size;
  for (; s > 6; s -= 1) {
    c.font = `${weight} ${s}px ${family}`;
    if (c.measureText(text).width + spacing * text.length <= maxW) break;
  }
  return s;
}
export function spaced(c, text, x, y, spacing) {
  if (!spacing) { c.fillText(text, x, y); return; }
  const total = c.measureText(text).width + spacing * (text.length - 1);
  let cx = x - (c.textAlign === 'center' ? total / 2 : 0);
  const align = c.textAlign;
  c.textAlign = 'left';
  for (const ch of text) { c.fillText(ch, cx, y); cx += c.measureText(ch).width + spacing; }
  c.textAlign = align;
}

// Römisches Zifferblatt
export function drawDial(c, w, h, opts = {}) {
  const r = Math.min(w, h) / 2;
  c.fillStyle = opts.bg || '#f1ead8';
  c.fillRect(0, 0, w, h);
  const g = c.createRadialGradient(w / 2, h / 2, r * 0.2, w / 2, h / 2, r);
  g.addColorStop(0, opts.bg || '#f6f0e0');
  g.addColorStop(1, opts.edge || '#d8ccb0');
  c.fillStyle = g;
  c.beginPath(); c.arc(w / 2, h / 2, r, 0, Math.PI * 2); c.fill();
  c.strokeStyle = '#2a2018';
  c.lineWidth = r * 0.025;
  c.beginPath(); c.arc(w / 2, h / 2, r * 0.93, 0, Math.PI * 2); c.stroke();
  c.beginPath(); c.arc(w / 2, h / 2, r * 0.82, 0, Math.PI * 2); c.lineWidth = r * 0.012; c.stroke();
  for (let i = 0; i < 60; i++) {
    const a = (i / 60) * Math.PI * 2;
    const r0 = r * (i % 5 ? 0.86 : 0.83), r1 = r * 0.92;
    c.lineWidth = i % 5 ? r * 0.01 : r * 0.022;
    c.beginPath();
    c.moveTo(w / 2 + Math.sin(a) * r0, h / 2 - Math.cos(a) * r0);
    c.lineTo(w / 2 + Math.sin(a) * r1, h / 2 - Math.cos(a) * r1);
    c.stroke();
  }
  const nums = ['XII', 'I', 'II', 'III', 'IIII', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];
  c.fillStyle = '#1e1712';
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    c.save();
    c.translate(w / 2 + Math.sin(a) * r * 0.68, h / 2 - Math.cos(a) * r * 0.68);
    c.rotate(a);
    c.font = `${Math.round(r * (nums[i].length > 2 ? 0.17 : 0.2))}px ${SERIF}`;
    c.fillText(nums[i], 0, 0);
    c.restore();
  }
  if (opts.label) {
    c.font = `italic ${Math.round(r * 0.1)}px ${SERIF}`;
    c.fillText(opts.label, w / 2, h / 2 + r * 0.33);
  }
}

// Ladenschild: lines = [{t, size, font, weight, color, spacing, y}]
export function drawSign(c, w, h, o) {
  c.fillStyle = o.bg || '#1b1915';
  c.fillRect(0, 0, w, h);
  if (o.grain !== false) {
    for (let i = 0; i < 80; i++) {
      c.fillStyle = `rgba(255,255,255,${Math.random() * 0.025})`;
      c.fillRect(0, Math.random() * h, w, 1 + Math.random() * 2);
    }
  }
  if (o.border) {
    c.strokeStyle = o.border;
    c.lineWidth = Math.max(2, h * 0.05);
    c.strokeRect(h * 0.08, h * 0.08, w - h * 0.16, h - h * 0.16);
  }
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  for (const L of o.lines) {
    const size = fitFont(c, L.t, w * 0.9, L.size || h * 0.5, L.weight || 'bold', L.font || SERIF, L.spacing || 0);
    c.font = `${L.weight || 'bold'} ${size}px ${L.font || SERIF}`;
    if (L.shadow !== false) {
      c.fillStyle = 'rgba(0,0,0,0.5)';
      spaced(c, L.t, w / 2 + size * 0.04, L.y * h + size * 0.05, L.spacing || 0);
    }
    c.fillStyle = L.color || o.fg || '#d5b268';
    spaced(c, L.t, w / 2, L.y * h, L.spacing || 0);
  }
}

// Papier / Bekanntmachung mit Textzeilen
export function drawPaper(c, w, h, o) {
  c.fillStyle = o.bg || '#e8dcc0';
  c.fillRect(0, 0, w, h);
  for (let i = 0; i < 300; i++) {
    c.fillStyle = `rgba(120,90,50,${Math.random() * 0.06})`;
    c.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * 3, 1 + Math.random() * 3);
  }
  const g = c.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.3, w / 2, h / 2, Math.max(w, h) * 0.75);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(90,60,20,0.25)');
  c.fillStyle = g;
  c.fillRect(0, 0, w, h);
  if (o.frame) { c.strokeStyle = o.frame; c.lineWidth = 3; c.strokeRect(6, 6, w - 12, h - 12); }
  c.fillStyle = o.ink || '#2a2018';
  c.textBaseline = 'alphabetic';
  let y = o.top ?? h * 0.12;
  for (const L of o.lines) {
    if (L.gap) { y += L.gap; continue; }
    const size = L.size || 14;
    c.font = `${L.style || ''} ${L.weight || 'normal'} ${size}px ${L.font || SERIF}`;
    c.textAlign = L.align || 'center';
    const x = L.align === 'left' ? (o.margin ?? 14) : L.align === 'right' ? w - (o.margin ?? 14) : w / 2;
    if (L.rule) {
      c.fillRect(w * 0.2, y - size * 0.3, w * 0.6, 1.5);
    } else {
      const s = fitFont(c, L.t, w - 2 * (o.margin ?? 14), size, L.weight || 'normal', L.font || SERIF);
      c.font = `${L.style || ''} ${L.weight || 'normal'} ${s}px ${L.font || SERIF}`;
      if (L.color) c.fillStyle = L.color;
      c.fillText(L.t, x, y);
      c.fillStyle = o.ink || '#2a2018';
    }
    y += (L.lh || 1.35) * size;
  }
}

// Plakat für die Litfaßsäule
export function drawPoster(c, w, h, o) {
  c.fillStyle = o.bg;
  c.fillRect(0, 0, w, h);
  c.strokeStyle = o.fg;
  c.lineWidth = 4;
  c.strokeRect(6, 6, w - 12, h - 12);
  c.fillStyle = o.fg;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  let y = h * 0.12;
  for (const L of o.lines) {
    const s = fitFont(c, L.t, w * 0.86, L.size, L.weight || 'bold', L.font || SERIF);
    c.font = `${L.style || ''} ${L.weight || 'bold'} ${s}px ${L.font || SERIF}`;
    c.fillStyle = L.color || o.fg;
    c.fillText(L.t, w / 2, y + s / 2);
    y += s * (L.lh || 1.25);
  }
  // Abnutzung
  for (let i = 0; i < 160; i++) {
    c.fillStyle = `rgba(255,255,255,${Math.random() * 0.08})`;
    c.fillRect(Math.random() * w, Math.random() * h, 2 + Math.random() * 6, 1 + Math.random() * 3);
  }
}

// Kreidetafel
export function drawChalk(c, w, h, lines) {
  c.fillStyle = '#23272a';
  c.fillRect(0, 0, w, h);
  for (let i = 0; i < 400; i++) {
    c.fillStyle = `rgba(255,255,255,${Math.random() * 0.04})`;
    c.fillRect(Math.random() * w, Math.random() * h, 2 + Math.random() * 10, 1 + Math.random() * 2);
  }
  c.strokeStyle = '#6a4a2a';
  c.lineWidth = 10;
  c.strokeRect(5, 5, w - 10, h - 10);
  c.textAlign = 'left';
  c.textBaseline = 'middle';
  let y = 34;
  for (const L of lines) {
    c.font = `${L.size || 22}px ${L.font || SCRIPT}`;
    c.fillStyle = L.color || 'rgba(240,236,224,0.92)';
    c.fillText(L.t, L.x ?? 22, y);
    y += (L.size || 22) * 1.35;
  }
}
