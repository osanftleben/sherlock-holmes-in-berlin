// WebGL2-Renderer: prozedurale Materialien, Punktlichter, Schattenkarte, Nebel, Leuchthöfe, Partikel
import { M4, V3 } from './math.js';

const MAIN_VS = `#version 300 es
layout(location=0) in vec3 aPos;
layout(location=1) in vec3 aNormal;
layout(location=2) in vec3 aColor;
layout(location=3) in vec4 aMat;
layout(location=4) in vec2 aUV;
uniform mat4 uViewProj;
uniform mat4 uModel;
uniform mat3 uNormalMat;
out vec3 vWorld;
out vec3 vNormal;
out vec3 vLocal;
out vec3 vLocalN;
out vec3 vColor;
flat out vec4 vMat;
out vec2 vUV;
void main() {
  vec4 w = uModel * vec4(aPos, 1.0);
  vWorld = w.xyz;
  vNormal = normalize(uNormalMat * aNormal);
  vLocal = aPos;
  vLocalN = aNormal;
  vColor = aColor;
  vMat = aMat;
  vUV = aUV;
  gl_Position = uViewProj * w;
}`;

const MAIN_FS = `#version 300 es
precision highp float;
precision highp int;
precision highp sampler2DShadow;
in vec3 vWorld;
in vec3 vNormal;
in vec3 vLocal;
in vec3 vLocalN;
in vec3 vColor;
flat in vec4 vMat;
in vec2 vUV;
uniform vec3 uCamPos;
uniform vec3 uSkyAmb;
uniform vec3 uGroundAmb;
uniform vec3 uSunDir;
uniform vec3 uSunCol;
uniform int uLightCount;
uniform vec4 uLightPos[8];
uniform vec3 uLightCol[8];
uniform vec3 uFogCol;
uniform float uFogDensity;
uniform float uFogStart;
uniform float uHighlight;
uniform vec3 uTint;
uniform float uAlpha;
uniform float uTime;
uniform float uExposure;
uniform float uSepia;
uniform float uAO;
uniform sampler2D uTex;
uniform sampler2DShadow uShadow;
uniform mat4 uShadowMat;
uniform float uShadowOn;
uniform float uShadowTexel;
out vec4 outColor;

float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash12(i), b = hash12(i + vec2(1.0, 0.0));
  float c = hash12(i + vec2(0.0, 1.0)), d = hash12(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}
float fbm(vec2 p) {
  float s = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++) { s += a * vnoise(p); p = p * 2.03 + vec2(17.1, 9.3); a *= 0.5; }
  return s;
}
vec2 planar(vec3 p, vec3 n) {
  vec3 a = abs(n);
  if (a.y >= a.x && a.y >= a.z) return p.xz;
  if (a.x >= a.z) return vec2(p.z, p.y);
  return p.xy;
}

vec3 pattern(int id, vec3 base, vec3 p, vec3 n, float sc, inout float spec) {
  vec2 uv = planar(p, n) * sc;
  bool horiz = abs(n.y) > 0.5;
  if (id == 1) {
    vec2 b = horiz ? vec2(uv.x / 0.26, uv.y / 0.13) : vec2(uv.x / 0.26, uv.y / 0.085);
    float row = floor(b.y);
    b.x += mod(row, 2.0) * 0.5;
    vec2 cell = floor(b);
    vec2 f = fract(b);
    float mortar = max(step(f.x, 0.045), step(f.y, 0.13));
    float h = hash12(cell);
    vec3 brick = base * (0.72 + 0.5 * h) * (0.88 + 0.24 * vnoise(uv * 35.0));
    return mix(brick, base * 0.45 + vec3(0.08, 0.075, 0.07), mortar);
  }
  if (id == 2) {
    vec2 b = uv * 7.5;
    float row = floor(b.y);
    b.x += mod(row, 2.0) * 0.5 + hash12(vec2(row, 1.0)) * 0.3;
    vec2 cell = floor(b);
    vec2 f = fract(b) - 0.5;
    float h = hash12(cell);
    float d = length(f * vec2(1.0, 1.2));
    float stone = 1.0 - smoothstep(0.36, 0.5, d);
    spec *= 0.35 + 0.65 * stone;
    vec3 c = base * (0.65 + 0.6 * h) * (0.85 + 0.3 * vnoise(uv * 30.0));
    return mix(base * 0.22, c * (0.9 + 0.3 * (0.5 - d)), stone);
  }
  if (id == 3) {
    vec2 b = vec2(uv.x / 1.7, uv.y / 0.17);
    float row = floor(b.y);
    b.x += hash12(vec2(row, 7.0)) * 5.0;
    vec2 cell = floor(b);
    vec2 f = fract(b);
    float seam = max(step(f.y, 0.05), step(f.x, 0.004));
    float h = hash12(cell);
    float grain = fbm(vec2(uv.x * 1.2 + h * 9.0, uv.y * 45.0));
    vec3 c = base * (0.78 + 0.4 * h) * (0.8 + 0.4 * grain);
    return mix(c, base * 0.28, seam);
  }
  if (id == 4) {
    float s = fract(uv.x / 0.16);
    float stripe = smoothstep(0.42, 0.47, s) - smoothstep(0.53, 0.58, s);
    vec2 q = fract(uv / vec2(0.16, 0.22)) - 0.5;
    float motif = 1.0 - smoothstep(0.08, 0.12, abs(q.x) + abs(q.y) * 0.75);
    vec3 c = base * (1.0 + 0.18 * stripe) * (1.0 - 0.14 * motif);
    return c * (0.85 + 0.25 * fbm(uv * 2.5));
  }
  if (id == 5) {
    float f = fbm(uv * 1.1);
    float g = vnoise(uv * 38.0);
    float soot = smoothstep(0.35, 0.85, fbm(uv * 0.35 + 7.0));
    float drip = smoothstep(0.6, 0.9, vnoise(vec2(uv.x * 3.0, uv.y * 0.25)));
    return base * (0.8 + 0.28 * f + 0.06 * g) * (1.0 - 0.28 * soot - 0.12 * drip);
  }
  if (id == 6) {
    float w = (p.x + p.z) * 2.5 * sc;
    float g = fbm(vec2(w, p.y * 18.0 * sc));
    float ring = 0.5 + 0.5 * sin((w + g * 3.0) * 9.0);
    return base * (0.8 + 0.2 * ring) * (0.85 + 0.3 * g);
  }
  if (id == 7) {
    return base * (0.85 + 0.3 * vnoise(uv * 22.0));
  }
  if (id == 9) {
    vec2 b = uv / 0.22;
    vec2 f = fract(b);
    float seam = max(step(f.x, 0.05), step(f.y, 0.05));
    float h = hash12(floor(b));
    vec2 e = f - 0.5;
    float bulge = 1.0 - dot(e, e) * 1.2;
    vec3 c = base * (0.85 + 0.25 * h) * bulge;
    spec *= 1.0 - seam;
    return mix(c, base * 0.35, seam);
  }
  if (id == 10) {
    float w = vnoise(uv * 140.0);
    return base * (0.9 + 0.12 * w) * (0.92 + 0.12 * fbm(uv * 4.0));
  }
  if (id == 11) {
    vec2 q = fract(uv / 0.06);
    float l = max(step(q.x, 0.16), step(q.y, 0.16));
    vec2 q2 = fract(uv / 0.18);
    float l2 = max(step(q2.x, 0.04), step(q2.y, 0.04));
    return base * (1.0 - 0.16 * l) * (1.0 + 0.25 * l2) * (0.9 + 0.15 * vnoise(uv * 160.0));
  }
  if (id == 12) {
    vec2 b = vec2(uv.x / 0.32, uv.y / 0.22);
    b.x += mod(floor(b.y), 2.0) * 0.5;
    vec2 f = fract(b);
    float edge = max(step(f.y, 0.08), step(f.x, 0.03));
    float h = hash12(floor(b));
    return mix(base * (0.75 + 0.4 * h), base * 0.3, edge);
  }
  if (id == 13) {
    return base * (0.94 + 0.06 * vnoise(uv * 90.0));
  }
  if (id == 14) {
    return base * (0.82 + 0.22 * fbm(uv * 3.5) + 0.06 * vnoise(uv * 60.0));
  }
  if (id == 15) {
    float f = fbm(uv * 0.9);
    float puddle = smoothstep(0.56, 0.62, fbm(uv * 0.32 + 3.7));
    vec3 c = base * (0.65 + 0.6 * f);
    spec = mix(spec, 1.0, puddle);
    return mix(c, c * 0.45, puddle);
  }
  if (id == 16) {
    vec2 b = horiz ? vec2(uv.x / 0.9, uv.y / 0.6) : vec2(uv.x / 0.8, uv.y / 0.4);
    b.x += mod(floor(b.y), 2.0) * 0.5;
    vec2 f = fract(b);
    float joint = max(step(f.x, 0.012), step(f.y, 0.02));
    float h = hash12(floor(b));
    vec3 c = base * (0.82 + 0.25 * h) * (0.88 + 0.22 * fbm(uv * 3.0));
    return mix(c, base * 0.4, joint);
  }
  if (id == 17) {
    vec2 q = fract(uv / vec2(0.25, 0.32)) - 0.5;
    float r = length(q * vec2(1.0, 0.8));
    float orn = (1.0 - smoothstep(0.2, 0.24, r)) * (0.5 + 0.5 * sin(atan(q.y, q.x) * 6.0));
    float s = fract(uv.x / 0.25);
    return base * (1.0 + 0.3 * orn) * (0.9 + 0.15 * fbm(uv * 2.0)) * (1.0 - 0.1 * step(0.96, s));
  }
  return base;
}

float shadowFactor(vec3 wp, vec3 n) {
  if (uShadowOn < 0.5) return 1.0;
  vec4 sp = uShadowMat * vec4(wp + n * 0.035, 1.0);
  vec3 c = sp.xyz / sp.w * 0.5 + 0.5;
  if (c.x <= 0.001 || c.x >= 0.999 || c.y <= 0.001 || c.y >= 0.999 || c.z >= 1.0) return 1.0;
  float t = uShadowTexel * 1.5;
  float z = c.z - 0.0015;
  float s = texture(uShadow, vec3(c.xy, z)) * 2.0;
  s += texture(uShadow, vec3(c.xy + vec2(-t, -t), z));
  s += texture(uShadow, vec3(c.xy + vec2(t, -t), z));
  s += texture(uShadow, vec3(c.xy + vec2(-t, t), z));
  s += texture(uShadow, vec3(c.xy + vec2(t, t), z));
  return s / 6.0;
}

void main() {
  vec4 tx = texture(uTex, vUV);
  if (tx.a < 0.35) discard;
  vec3 base = vColor * pow(tx.rgb, vec3(2.2)) * uTint;
  int pid = int(vMat.x + 0.5);
  float spec = vMat.w;
  vec3 N = normalize(vNormal);
  if (!gl_FrontFacing) N = -N;
  vec3 albedo = pattern(pid, base, vLocal, vLocalN, vMat.y, spec);
  vec3 V = normalize(uCamPos - vWorld);
  float ao = mix(uAO, 1.0, smoothstep(0.0, 1.3, vWorld.y));
  vec3 amb = mix(uGroundAmb, uSkyAmb, N.y * 0.5 + 0.5) * ao;
  vec3 L = -uSunDir;
  float ndl = max((dot(N, L) + 0.25) / 1.25, 0.0);
  float sh = shadowFactor(vWorld, N);
  vec3 diffuse = amb + uSunCol * ndl * mix(0.35, 1.0, sh) * (0.55 + 0.45 * sh);
  float shin = mix(10.0, 90.0, clamp(spec, 0.0, 1.0));
  vec3 H = normalize(L + V);
  vec3 specular = uSunCol * pow(max(dot(N, H), 0.0), shin) * spec * sh;
  for (int i = 0; i < 8; i++) {
    if (i >= uLightCount) break;
    vec3 lp = uLightPos[i].xyz - vWorld;
    float d = length(lp);
    vec3 l = lp / max(d, 0.0001);
    float att = clamp(1.0 - d / uLightPos[i].w, 0.0, 1.0);
    att *= att;
    float nl = max((dot(N, l) + 0.2) / 1.2, 0.0);
    diffuse += uLightCol[i] * nl * att;
    vec3 h = normalize(l + V);
    specular += uLightCol[i] * pow(max(dot(N, h), 0.0), shin) * spec * att;
  }
  vec3 col = albedo * diffuse * ao + specular * 0.55;
  if (pid == 8) {
    float fr = pow(1.0 - max(dot(N, V), 0.0), 3.0);
    col += uFogCol * (0.12 + 0.55 * fr) + vec3(0.03) * step(0.6, fract((vWorld.x + vWorld.y * 0.7 + vWorld.z) * 0.9));
  }
  col += albedo * vMat.z;
  if (uHighlight > 0.001) {
    float rim = pow(1.0 - max(dot(N, V), 0.0), 2.0);
    float pulse = 0.7 + 0.3 * sin(uTime * 4.5);
    col += vec3(1.0, 0.78, 0.42) * (rim * 0.85 + 0.12) * uHighlight * pulse;
  }
  float fd = max(length(vWorld - uCamPos) - uFogStart, 0.0);
  float fog = 1.0 - exp(-fd * fd * uFogDensity * uFogDensity);
  col = mix(col, uFogCol, clamp(fog, 0.0, 1.0));
  col *= uExposure;
  col = col / (1.0 + col * 0.55) * 1.2;
  float lum = dot(col, vec3(0.299, 0.587, 0.114));
  col = mix(col, lum * vec3(1.08, 0.97, 0.82), uSepia);
  col = pow(max(col, vec3(0.0)), vec3(1.0 / 2.2));
  outColor = vec4(col, uAlpha);
}`;

const DEPTH_VS = `#version 300 es
layout(location=0) in vec3 aPos;
uniform mat4 uLightVP;
uniform mat4 uModel;
void main() { gl_Position = uLightVP * uModel * vec4(aPos, 1.0); }`;

const DEPTH_FS = `#version 300 es
precision mediump float;
out vec4 o;
void main() { o = vec4(1.0); }`;

const GLOW_VS = `#version 300 es
layout(location=0) in vec2 aCorner;
uniform mat4 uViewProj;
uniform vec3 uCenter;
uniform vec3 uRight;
uniform vec3 uUp;
uniform float uSize;
out vec2 vC;
void main() {
  vC = aCorner;
  vec3 p = uCenter + (uRight * aCorner.x + uUp * aCorner.y) * uSize;
  gl_Position = uViewProj * vec4(p, 1.0);
}`;

const GLOW_FS = `#version 300 es
precision mediump float;
in vec2 vC;
uniform vec3 uColor;
out vec4 o;
void main() {
  float d = dot(vC, vC);
  float a = exp(-d * 4.5) * (1.0 - smoothstep(0.55, 1.0, d));
  o = vec4(uColor * a, 1.0);
}`;

const PART_VS = `#version 300 es
layout(location=0) in vec4 aSeed;
uniform mat4 uViewProj;
uniform vec3 uBoxMin;
uniform vec3 uBoxSize;
uniform vec3 uVel;
uniform float uTime;
uniform float uSize;
uniform float uScale;
uniform float uWobble;
out float vR;
void main() {
  vec3 off = uVel * uTime * (0.75 + 0.5 * aSeed.w);
  off.x += sin(uTime * 0.7 + aSeed.w * 30.0) * uWobble;
  off.z += cos(uTime * 0.5 + aSeed.w * 20.0) * uWobble;
  vec3 p = uBoxMin + fract(aSeed.xyz + off / uBoxSize) * uBoxSize;
  vec4 cp = uViewProj * vec4(p, 1.0);
  gl_Position = cp;
  gl_PointSize = clamp(uSize * uScale / max(cp.w, 0.1), 1.0, 48.0);
  vR = aSeed.w;
}`;

const PART_FS = `#version 300 es
precision mediump float;
in float vR;
uniform vec3 uColor;
uniform float uOpacity;
uniform int uKind;
out vec4 o;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float a;
  if (uKind == 1) {
    a = (1.0 - smoothstep(0.0, 0.08, abs(c.x))) * (1.0 - smoothstep(0.2, 0.5, abs(c.y)));
  } else {
    a = 1.0 - smoothstep(0.1, 0.5, length(c));
  }
  o = vec4(uColor * a * uOpacity * (0.55 + 0.45 * vR), 1.0);
}`;

function compile(gl, type, src) {
  const s = gl.createShader(type);
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(s);
    gl.deleteShader(s);
    throw new Error('Shader-Fehler: ' + log);
  }
  return s;
}
function makeProgram(gl, vsSrc, fsSrc) {
  const p = gl.createProgram();
  gl.attachShader(p, compile(gl, gl.VERTEX_SHADER, vsSrc));
  gl.attachShader(p, compile(gl, gl.FRAGMENT_SHADER, fsSrc));
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error('Programm-Fehler: ' + gl.getProgramInfoLog(p));
  const u = {};
  const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < n; i++) {
    const info = gl.getActiveUniform(p, i);
    u[info.name.replace(/\[0\]$/, '')] = gl.getUniformLocation(p, info.name);
  }
  return { p, u };
}

export const QUALITY = {
  niedrig: { dpr: 1.0, shadows: false, shadowSize: 512 },
  mittel: { dpr: 1.5, shadows: true, shadowSize: 1024 },
  hoch: { dpr: 2.0, shadows: true, shadowSize: 2048 },
};

export class Renderer {
  constructor(canvas) {
    const gl = canvas.getContext('webgl2', {
      antialias: true, alpha: false, depth: true, stencil: false,
      powerPreference: 'high-performance', premultipliedAlpha: false, preserveDrawingBuffer: false,
    });
    if (!gl) throw new Error('WEBGL2');
    this.gl = gl;
    this.canvas = canvas;
    this.main = makeProgram(gl, MAIN_VS, MAIN_FS);
    this.depth = makeProgram(gl, DEPTH_VS, DEPTH_FS);
    this.glowP = makeProgram(gl, GLOW_VS, GLOW_FS);
    this.partP = makeProgram(gl, PART_VS, PART_FS);
    this.aniso = gl.getExtension('EXT_texture_filter_anisotropic');
    this.white = this.createTextureRGBA(1, 1, new Uint8Array([255, 255, 255, 255]));
    this.nm = new Float32Array(9);
    this.lightPos = new Float32Array(32);
    this.lightCol = new Float32Array(24);
    this.shadowVP = M4.create();
    this.tmpA = M4.create();
    this.tmpB = M4.create();
    this.width = 1; this.height = 1;
    this.shadowTex = null; this.shadowFBO = null; this.shadowSize = 0;
    // Quad für Leuchthöfe
    this.glowVAO = gl.createVertexArray();
    gl.bindVertexArray(this.glowVAO);
    const qb = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, qb);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);
    this.setQuality('mittel');
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);
    this.drawCalls = 0;
  }

  setQuality(q) {
    const cfg = QUALITY[q] || QUALITY.mittel;
    this.quality = q in QUALITY ? q : 'mittel';
    this.dprCap = cfg.dpr;
    this.shadowsOn = cfg.shadows;
    this.initShadow(cfg.shadows ? cfg.shadowSize : 16);
  }

  initShadow(size) {
    const gl = this.gl;
    if (this.shadowSize === size && this.shadowTex) return;
    if (this.shadowTex) gl.deleteTexture(this.shadowTex);
    if (this.shadowFBO) gl.deleteFramebuffer(this.shadowFBO);
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT24, size, size, 0, gl.DEPTH_COMPONENT, gl.UNSIGNED_INT, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_MODE, gl.COMPARE_REF_TO_TEXTURE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_FUNC, gl.LEQUAL);
    const fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, tex, 0);
    gl.drawBuffers([gl.NONE]);
    gl.readBuffer(gl.NONE);
    const ok = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    this.shadowTex = tex;
    this.shadowFBO = fbo;
    this.shadowSize = size;
    if (!ok) this.shadowsOn = false;
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, this.dprCap);
    const w = Math.max(1, Math.round(this.canvas.clientWidth * dpr));
    const h = Math.max(1, Math.round(this.canvas.clientHeight * dpr));
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }
    this.width = w;
    this.height = h;
  }

  createMesh(b) {
    if (!b || b.empty) return null;
    const gl = this.gl;
    const data = new Float32Array(b.data);
    const idx = new Uint32Array(b.idx);
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    const vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    const S = 60;
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, S, 0);
    gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 3, gl.FLOAT, false, S, 12);
    gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2, 3, gl.FLOAT, false, S, 24);
    gl.enableVertexAttribArray(3); gl.vertexAttribPointer(3, 4, gl.FLOAT, false, S, 36);
    gl.enableVertexAttribArray(4); gl.vertexAttribPointer(4, 2, gl.FLOAT, false, S, 52);
    const ibo = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, idx, gl.STATIC_DRAW);
    gl.bindVertexArray(null);
    const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
    for (let i = 0; i < data.length; i += 15) {
      for (let k = 0; k < 3; k++) {
        const v = data[i + k];
        if (v < min[k]) min[k] = v;
        if (v > max[k]) max[k] = v;
      }
    }
    return { vao, vbo, ibo, count: idx.length, bounds: { min, max } };
  }

  deleteMesh(m) {
    if (!m) return;
    const gl = this.gl;
    gl.deleteVertexArray(m.vao);
    gl.deleteBuffer(m.vbo);
    gl.deleteBuffer(m.ibo);
  }

  createTextureRGBA(w, h, data) {
    const gl = this.gl;
    const t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return t;
  }

  createTexture(source) {
    const gl = this.gl;
    const t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    if (this.aniso) gl.texParameterf(gl.TEXTURE_2D, this.aniso.TEXTURE_MAX_ANISOTROPY_EXT, 4);
    return t;
  }

  // Gleiche Farbkurve wie im Shader – für den Hintergrund
  displayColor(c, env) {
    const e = env.exposure ?? 1, sep = env.sepia ?? 0;
    let r = c[0] * e, g = c[1] * e, b = c[2] * e;
    r = (r / (1 + r * 0.55)) * 1.2; g = (g / (1 + g * 0.55)) * 1.2; b = (b / (1 + b * 0.55)) * 1.2;
    const l = r * 0.299 + g * 0.587 + b * 0.114;
    r += (l * 1.08 - r) * sep; g += (l * 0.97 - g) * sep; b += (l * 0.82 - b) * sep;
    const p = (x) => Math.pow(Math.max(0, Math.min(1, x)), 1 / 2.2);
    return [p(r), p(g), p(b)];
  }

  computeShadowVP(env) {
    const sun = env.sun;
    const s = sun.shadow;
    const dir = V3.norm(sun.dir);
    const r = s.radius;
    const eye = V3.sub(s.center, V3.scale(dir, r * 2));
    const up = Math.abs(dir[1]) > 0.95 ? [0, 0, 1] : [0, 1, 0];
    M4.lookAt(this.tmpA, eye, s.center, up);
    M4.ortho(this.tmpB, -r, r, -r, r, 0.1, r * 4);
    M4.mul(this.shadowVP, this.tmpB, this.tmpA);
  }

  render(world, cam, time) {
    const gl = this.gl;
    const env = world.env;
    this.drawCalls = 0;
    world.root.update(null);

    const opaque = [], transparent = [];
    const collect = (n, hl) => {
      if (!n.visible) return;
      const h = n.highlight > hl ? n.highlight : hl;
      if (n.mesh) (n.alpha < 0.999 ? transparent : opaque).push(n, h);
      for (let i = 0; i < n.children.length; i++) collect(n.children[i], h);
    };
    collect(world.root, 0);

    // --- Schattenpass ---
    const useShadow = this.shadowsOn && env.sun && env.sun.shadow;
    if (useShadow) {
      this.computeShadowVP(env);
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.shadowFBO);
      gl.viewport(0, 0, this.shadowSize, this.shadowSize);
      gl.clear(gl.DEPTH_BUFFER_BIT);
      gl.useProgram(this.depth.p);
      gl.uniformMatrix4fv(this.depth.u.uLightVP, false, this.shadowVP);
      gl.enable(gl.POLYGON_OFFSET_FILL);
      gl.polygonOffset(1.6, 3.0);
      gl.disable(gl.CULL_FACE);
      for (let i = 0; i < opaque.length; i += 2) {
        const n = opaque[i];
        if (!n.castShadow) continue;
        gl.uniformMatrix4fv(this.depth.u.uModel, false, n.world);
        gl.bindVertexArray(n.mesh.vao);
        gl.drawElements(gl.TRIANGLES, n.mesh.count, gl.UNSIGNED_INT, 0);
      }
      gl.enable(gl.CULL_FACE);
      gl.disable(gl.POLYGON_OFFSET_FILL);
    }

    // --- Hauptpass ---
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, this.width, this.height);
    const bg = this.displayColor(env.background || env.fog.color, env);
    gl.clearColor(bg[0], bg[1], bg[2], 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    const P = this.main, u = P.u;
    gl.useProgram(P.p);
    gl.uniformMatrix4fv(u.uViewProj, false, cam.viewProj);
    gl.uniform3fv(u.uCamPos, cam.eye);
    gl.uniform3fv(u.uSkyAmb, env.skyAmb);
    gl.uniform3fv(u.uGroundAmb, env.groundAmb);
    const sun = env.sun || { dir: [0, -1, 0], color: [0, 0, 0] };
    gl.uniform3fv(u.uSunDir, V3.norm(sun.dir));
    gl.uniform3fv(u.uSunCol, sun.color);
    gl.uniform3fv(u.uFogCol, env.fog.color);
    gl.uniform1f(u.uFogDensity, env.fog.density);
    gl.uniform1f(u.uFogStart, env.fog.start || 0);
    gl.uniform1f(u.uTime, time);
    gl.uniform1f(u.uExposure, env.exposure ?? 1);
    gl.uniform1f(u.uSepia, env.sepia ?? 0);
    gl.uniform1f(u.uAO, env.ao ?? 0.6);
    gl.uniform1f(u.uShadowOn, useShadow ? 1 : 0);
    gl.uniform1f(u.uShadowTexel, 1 / this.shadowSize);
    gl.uniformMatrix4fv(u.uShadowMat, false, this.shadowVP);

    // Lichter (max. 8, die nächsten zum Blickpunkt)
    let lights = env.lights || [];
    if (lights.length > 8) {
      const f = cam.target;
      lights = lights.slice().sort((a, b) => V3.dist(a.pos, f) - V3.dist(b.pos, f)).slice(0, 8);
    }
    for (let i = 0; i < lights.length; i++) {
      const L = lights[i];
      let k = L.intensity ?? 1;
      if (L.flicker) {
        const ph = i * 1.7 + (L.seed || 0);
        k *= 1 + L.flicker * (Math.sin(time * 13.1 + ph) * 0.5 + Math.sin(time * 7.3 + ph * 2.1) * 0.35 + Math.sin(time * 23.7 + ph) * 0.15);
      }
      L._k = k;
      this.lightPos.set([L.pos[0], L.pos[1], L.pos[2], L.range], i * 4);
      this.lightCol.set([L.color[0] * k, L.color[1] * k, L.color[2] * k], i * 3);
    }
    gl.uniform1i(u.uLightCount, lights.length);
    gl.uniform4fv(u.uLightPos, this.lightPos);
    gl.uniform3fv(u.uLightCol, this.lightCol);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.shadowTex);
    gl.uniform1i(u.uShadow, 1);
    gl.activeTexture(gl.TEXTURE0);
    gl.uniform1i(u.uTex, 0);
    let bound = null;
    const draw = (n, h) => {
      gl.uniformMatrix4fv(u.uModel, false, n.world);
      M4.normalMat(this.nm, n.world);
      gl.uniformMatrix3fv(u.uNormalMat, false, this.nm);
      gl.uniform1f(u.uHighlight, h);
      gl.uniform3fv(u.uTint, n.tint);
      gl.uniform1f(u.uAlpha, n.alpha);
      const tex = n.texture || this.white;
      if (tex !== bound) { gl.bindTexture(gl.TEXTURE_2D, tex); bound = tex; }
      gl.bindVertexArray(n.mesh.vao);
      gl.drawElements(gl.TRIANGLES, n.mesh.count, gl.UNSIGNED_INT, 0);
      this.drawCalls++;
    };
    for (let i = 0; i < opaque.length; i += 2) draw(opaque[i], opaque[i + 1]);

    if (transparent.length) {
      const list = [];
      for (let i = 0; i < transparent.length; i += 2) {
        const n = transparent[i];
        const d = V3.dist([n.world[12], n.world[13], n.world[14]], cam.eye);
        list.push([d, n, transparent[i + 1]]);
      }
      list.sort((a, b) => b[0] - a[0]);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.depthMask(false);
      for (const [, n, h] of list) draw(n, h);
      gl.depthMask(true);
      gl.disable(gl.BLEND);
    }

    // --- Leuchthöfe ---
    const glows = [];
    for (const L of lights) if (L.glow) glows.push([L.pos, L.glowColor || L.color, L.glow, (L._k || 1) / (L.intensity || 1)]);
    if (world.glows) for (const g of world.glows) if (g.visible !== false) glows.push([g.pos, g.color, g.size, 1]);
    if (glows.length) {
      const G = this.glowP;
      gl.useProgram(G.p);
      gl.uniformMatrix4fv(G.u.uViewProj, false, cam.viewProj);
      const v = cam.view;
      gl.uniform3f(G.u.uRight, v[0], v[4], v[8]);
      gl.uniform3f(G.u.uUp, v[1], v[5], v[9]);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE);
      gl.depthMask(false);
      gl.disable(gl.CULL_FACE);
      gl.bindVertexArray(this.glowVAO);
      const gs = env.glowStrength ?? 0.35;
      for (const [p, c, s, k] of glows) {
        const toCam = V3.norm(V3.sub(cam.eye, p));
        const cpos = V3.add(p, V3.scale(toCam, 0.35));
        gl.uniform3fv(G.u.uCenter, cpos);
        gl.uniform1f(G.u.uSize, s);
        gl.uniform3f(G.u.uColor, c[0] * gs * k, c[1] * gs * k, c[2] * gs * k);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      }
      gl.enable(gl.CULL_FACE);
      gl.depthMask(true);
      gl.disable(gl.BLEND);
    }

    // --- Partikel ---
    if (world.particles && world.particles.length) {
      const Q = this.partP;
      gl.useProgram(Q.p);
      gl.uniformMatrix4fv(Q.u.uViewProj, false, cam.viewProj);
      gl.uniform1f(Q.u.uTime, time);
      gl.uniform1f(Q.u.uScale, cam.proj[5] * this.height * 0.5);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE);
      gl.depthMask(false);
      for (const ps of world.particles) {
        if (ps.visible === false) continue;
        if (!ps._vao) {
          ps._vao = gl.createVertexArray();
          gl.bindVertexArray(ps._vao);
          const buf = gl.createBuffer();
          const seeds = new Float32Array(ps.count * 4);
          for (let i = 0; i < seeds.length; i++) seeds[i] = Math.random();
          gl.bindBuffer(gl.ARRAY_BUFFER, buf);
          gl.bufferData(gl.ARRAY_BUFFER, seeds, gl.STATIC_DRAW);
          gl.enableVertexAttribArray(0);
          gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 0, 0);
        }
        gl.bindVertexArray(ps._vao);
        gl.uniform3fv(Q.u.uBoxMin, ps.min);
        gl.uniform3fv(Q.u.uBoxSize, ps.size);
        gl.uniform3fv(Q.u.uVel, ps.vel);
        gl.uniform1f(Q.u.uSize, ps.pointSize);
        gl.uniform1f(Q.u.uWobble, ps.wobble || 0);
        gl.uniform3fv(Q.u.uColor, ps.color);
        gl.uniform1f(Q.u.uOpacity, ps.opacity);
        gl.uniform1i(Q.u.uKind, ps.kind || 0);
        gl.drawArrays(gl.POINTS, 0, ps.count);
      }
      gl.depthMask(true);
      gl.disable(gl.BLEND);
    }
    gl.bindVertexArray(null);
  }
}
