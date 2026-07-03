/* ─────────────────────────────────────────────────────────────────────────
   The ink-blot curtain — the multiverse's signature transition.

   A full-screen WebGL blot: metaball lobes flood outward from a point until
   they swallow the viewport, with a grainy spray-dissolve edge (reference:
   Podium transition + Tres's ink-blot). A transition device, never layout.

   API (ES module):
     import { cover, autoReveal } from '/mv/curtain.js';
     cover({ x, y, color }) -> Promise    // flood from (x,y), resolves covered
     autoReveal()                         // call on page load: if the previous
                                          // page covered, start covered and
                                          // peel open; otherwise do nothing.
   Navigation pattern:
     await cover({x, y, color}); sessionStorage.setItem('mv:covered', color);
     location.href = dest;   // destination calls autoReveal() at boot.

   Reduced motion: cover/reveal resolve instantly (hard cut).
   No WebGL: falls back to a clip-path circle (clean edge, no grain).
   ──────────────────────────────────────────────────────────────────────── */

const DUR_COVER = 1050;   /* slowed per Tres, 2026-07-02 */
const DUR_REVEAL = 1250;
const EASE = (t) => 1 - Math.pow(1 - t, 2.6); // strong ease-out

let reduce = false;
try { reduce = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

/* ── canvas + GL setup (lazy — nothing is created until first use) ──────── */
let cv = null, gl = null, prog = null, U = {}, fallback = false;

function ensure() {
  if (cv) return;
  cv = document.createElement('canvas');
  cv.setAttribute('aria-hidden', 'true');
  cv.style.cssText = 'position:fixed;inset:0;z-index:2147483000;pointer-events:none;width:100vw;height:100vh;display:none';
  document.body.appendChild(cv);
  gl = cv.getContext('webgl', { alpha: true, antialias: false, premultipliedAlpha: true });
  if (!gl) { fallback = true; return; }

  const vs = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
  const fs = `
precision highp float;
uniform vec2 uRes;      /* viewport px */
uniform vec2 uOrigin;   /* flood origin px */
uniform float uT;       /* 0 none -> 1 covered */
uniform float uTime;    /* seconds, for edge shimmer */
uniform vec3 uInk;

/* value noise */
float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float n2(vec2 p){
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3. - 2. * f);
  return mix(mix(h(i), h(i + vec2(1., 0.)), u.x),
             mix(h(i + vec2(0., 1.)), h(i + vec2(1., 1.)), u.x), u.y);
}
float fbm(vec2 p){
  return n2(p) * .55 + n2(p * 2.7) * .28 + n2(p * 7.3) * .17;
}

void main(){
  vec2 px = gl_FragCoord.xy;
  vec2 o = vec2(uOrigin.x, uRes.y - uOrigin.y);
  float maxd = length(uRes) * 1.15;

  /* seven lobes leaving the origin in fixed directions — the blot's anatomy.
     Each lobe is a moving circle; field = sum r^2/d^2 (classic metaballs). */
  vec2 dir[7];
  dir[0] = vec2(0., 0.);
  dir[1] = vec2(.62, .18);  dir[2] = vec2(-.54, .34);
  dir[3] = vec2(.20, -.58); dir[4] = vec2(-.30, -.44);
  dir[5] = vec2(.44, .52);  dir[6] = vec2(-.62, -.10);
  float sz[7];
  sz[0] = 1.0; sz[1] = .62; sz[2] = .55; sz[3] = .48; sz[4] = .42; sz[5] = .38; sz[6] = .34;

  float g = uT * uT * (3. - 2. * uT);         /* smooth growth */
  float field = 0.;
  for (int i = 0; i < 7; i++) {
    vec2 c = o + dir[i] * g * maxd * .55;
    /* no radius floor: at uT=0 the blot truly reaches zero — no residual
       dot left to pop when the canvas hides */
    float r = sz[i] * g * 1.13 * maxd * .5;
    float d = max(length(px - c), 1.);
    field += (r * r) / (d * d);
  }

  /* grainy spray edge: noise breaks the iso-contour into speckle */
  float grain = fbm(px * .012 + uTime * .05) - .5;
  float speck = h(px * .5) - .5;                 /* per-pixel spray dust */
  /* end-of-travel dissolve: as the blot collapses (reveal) or first
     gathers (cover), edge noise scales up NEAR THE BLOT ONLY, eating it
     into scattering ink flecks instead of a shrinking hard disc */
  float diss = 1. - smoothstep(.0, .22, uT);
  float nearBlot = smoothstep(.04, .5, field);
  float f = field + (grain * .5 + speck * .22) * (1. + diss * 3.2 * nearBlot);

  float a = step(1., f);
  /* thicken the interior so lobes read solid ink, not soft blobs — but let
     the end-of-travel dissolve eat through the core so the last of the ink
     breaks into flecks instead of holding a hard disc */
  a = max(a, step(2.2, field) * (1. - step(.55, diss)));
  if (a < .01) discard;
  gl_FragColor = vec4(uInk * a, a);
}`;

  function sh(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { fallback = true; return null; }
    return s;
  }
  const v = sh(gl.VERTEX_SHADER, vs), f = sh(gl.FRAGMENT_SHADER, fs);
  if (fallback) return;
  prog = gl.createProgram();
  gl.attachShader(prog, v); gl.attachShader(prog, f); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { fallback = true; return; }
  gl.useProgram(prog);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  ['uRes', 'uOrigin', 'uT', 'uTime', 'uInk'].forEach((n) => { U[n] = gl.getUniformLocation(prog, n); });
}

function hexToRgb(hex) {
  const h = (hex || '#0A0806').replace('#', '');
  const x = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  return [0, 2, 4].map((i) => parseInt(x.slice(i, i + 2), 16) / 255);
}

function draw(t, origin, ink, time) {
  const dpr = Math.min(2, devicePixelRatio || 1);
  if (cv.width !== innerWidth * dpr || cv.height !== innerHeight * dpr) {
    cv.width = innerWidth * dpr; cv.height = innerHeight * dpr;
    gl.viewport(0, 0, cv.width, cv.height);
  }
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.uniform2f(U.uRes, cv.width, cv.height);
  gl.uniform2f(U.uOrigin, origin.x * dpr, origin.y * dpr);
  gl.uniform1f(U.uT, t);
  gl.uniform1f(U.uTime, time);
  gl.uniform3f(U.uInk, ink[0], ink[1], ink[2]);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
}

/* clip-path fallback (no grain, still organic-ish timing) */
let lastFb = null;
function fallbackRun(from, to, dur, origin, color) {
  return new Promise((res) => {
    const el = document.createElement('div');
    el.style.cssText = `position:fixed;inset:0;z-index:2147483000;pointer-events:none;background:${color};` +
      `clip-path:circle(${from * 160}% at ${origin.x}px ${origin.y}px);transition:clip-path ${dur}ms cubic-bezier(.23,1,.32,1)`;
    document.body.appendChild(el);
    lastFb = el;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      el.style.clipPath = `circle(${to * 160}% at ${origin.x}px ${origin.y}px)`;
    }));
    setTimeout(() => { if (to === 0) { el.remove(); if (lastFb === el) lastFb = null; } res(); }, dur + 40);
  });
}

/* bfcache: Back can restore a page that navigated away mid-cover — without
   this, the snapshot comes back still wearing the ink (or, worse, looking
   fine but with the caller's leaving-latches stuck; those reset themselves
   on the same event) */
addEventListener('pageshow', (e) => {
  if (!e.persisted) return;
  if (cv) cv.style.display = 'none';
  if (lastFb) { lastFb.remove(); lastFb = null; }
});

function run(from, to, dur, origin, color) {
  ensure();
  if (reduce) {
    if (!fallback && cv) cv.style.display = 'none';
    return Promise.resolve();
  }
  if (fallback || !gl) return fallbackRun(from, to, dur, origin, color);
  const ink = hexToRgb(color);
  cv.style.display = 'block';
  const t0 = performance.now();
  return new Promise((res) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      if (to === 0) cv.style.display = 'none';
      res();
    };
    /* failsafe: rAF can starve in throttled/backgrounded tabs — navigation
       must never hang on the animation */
    setTimeout(finish, dur + 600);
    (function frame(now) {
      if (done) return;
      const p = Math.min(1, (now - t0) / dur);
      let t = from + (to - from) * EASE(p);
      /* reveal tail: ink absorbs faster as the blot thins — compress the
         eased crawl through small sizes so no dot lingers */
      if (to === 0 && t < 0.2) t = 0.2 * Math.pow(t / 0.2, 2.2);
      draw(t, origin, ink, now / 1000);
      if (p < 1) requestAnimationFrame(frame);
      else finish();
    })(t0);
  });
}

export function cover(opts) {
  const o = opts || {};
  const origin = { x: o.x ?? innerWidth / 2, y: o.y ?? innerHeight / 2 };
  const color = o.color || '#0A0806';
  try { sessionStorage.setItem('mv:covered', color); } catch (e) {}
  return run(0, 1, DUR_COVER, origin, color);
}

export function autoReveal() {
  let color = null;
  try { color = sessionStorage.getItem('mv:covered'); sessionStorage.removeItem('mv:covered'); } catch (e) {}
  if (!color) return Promise.resolve();
  const origin = { x: innerWidth / 2, y: innerHeight * 0.42 };
  if (!reduce) { ensure(); if (!fallback && gl) { cv.style.display = 'block'; draw(1, origin, hexToRgb(color), 0); } }
  return run(1, 0, DUR_REVEAL, origin, color);
}
