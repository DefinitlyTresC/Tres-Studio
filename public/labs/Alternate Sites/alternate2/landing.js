/* ════════════════════════════════════════════════════════════
   tres.studio v2 — particle field (Universe 02)
   ~30,000 particles forming five stacked compositions made of
   real project data from the Google Sheet. Mouse repels. Hold
   to enter dives into the matching page on the main site.
   ──────────────────────────────────────────────────────────── */

(() => {

/* ── Config ─────────────────────────────────────────────── */
const COLORS = {
  paper:     0xF2EDE2,
  ink:       [0.02, 0.02, 0.02],      // essentially pure black for max contrast
  yellow:    [1.00, 0.83, 0.36],
  yellowHot: [1.00, 0.85, 0.30],
};
const HOLD_MS       = 400;
const MOUSE_FORCE   = 1.0;
const SPRING        = 0.016;
const DAMP          = 0.93;

// Inverse-quadratic falloff — no hard radius, no perimeter. Attraction
// and repulsion both grow smoothly as the cursor approaches a particle.
// REPEL_K and ATTRACT_K are "half-power" lengths squared (in world units).
const REPEL_K       = 110 * 110;   // half-strength at ~110px
const ATTRACT_K     = 130 * 130;   // half-strength at ~130px
const FORCE_MAX_DIST2 = 460 * 460; // skip far particles for perf (force is negligible past this)

// Detect touch / coarse pointer (iOS, Android). On these, click-attract
// is disabled so touch-drag scrolls cleanly without weird interactions.
const IS_COARSE = !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches);

const SCENES = ['hero', 'architecture', 'personal', 'lab', 'contact'];

const DPR = Math.min(window.devicePixelRatio || 1, 2);
let W = window.innerWidth;
let H = window.innerHeight;


/* ── DOM ─────────────────────────────────────────────────── */
const canvas      = document.getElementById('stage');
const cursorEl    = document.getElementById('cursor');
const ringEl      = document.getElementById('cursorRing');
const readX       = document.getElementById('readX');
const readMode    = document.getElementById('readMode');
const navLinks    = document.querySelectorAll('.nav-link');
const progressFill= document.getElementById('progressFill');
const progressLabel = document.getElementById('progressLabel');
const hint        = document.getElementById('hint');
const loader      = document.getElementById('loader');
const interior    = document.getElementById('interior');
const interiorName= document.getElementById('interiorName');
const interiorMeta= document.getElementById('interiorMeta');
const interiorPath= document.getElementById('interiorPath');


/* ── Three.js setup ──────────────────────────────────────── */
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
renderer.setPixelRatio(DPR);
renderer.setClearColor(COLORS.paper, 1);
renderer.setSize(W, H);

const scene = new THREE.Scene();

const FOV = 50;
const distance = H / (2 * Math.tan((FOV * Math.PI / 180) / 2));
const camera = new THREE.PerspectiveCamera(FOV, W / H, 0.1, distance * 4);
camera.position.set(0, 0, distance);
camera.lookAt(0, 0, 0);


/* ── Particle shader ─────────────────────────────────────── */
const VERT = `
  attribute float aSize;
  attribute vec3 aColor;
  attribute float aOpacity;
  varying vec3 vColor;
  varying float vOpacity;
  void main() {
    vColor = aColor;
    vOpacity = aOpacity;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = aSize * (300.0 / -mv.z);
  }
`;
// Hard-edged dots for maximum density / readability
const FRAG = `
  varying vec3 vColor;
  varying float vOpacity;
  void main() {
    vec2 uv = gl_PointCoord - vec2(0.5);
    float d = length(uv);
    if (d > 0.5) discard;
    float alpha = 1.0 - smoothstep(0.46, 0.50, d);
    gl_FragColor = vec4(vColor, alpha * vOpacity);
  }
`;


/* ════════════════════════════════════════════════════════
   PROJECT DATA — fetched from sheet, with hardcoded fallback
   ──────────────────────────────────────────────────────── */
let PROJECTS = [];
let BUCKETS = { architecture: [], personal: [], lab: [] };

const FALLBACK_PROJECTS = [
  { slug: 'tucker',       name: 'The Pointe at Tucker Landing', category: 'architecture', location: 'Point Washington, FL', year: '2025' },
  { slug: 'ee13',         name: 'Alys Beach EE-13',             category: 'architecture', location: 'Alys Beach, FL',       year: '2024' },
  { slug: 'z07',          name: 'Alys Beach Z-07',              category: 'architecture', location: 'Alys Beach, FL',       year: '2024' },
  { slug: 'flatwood',     name: 'Flatwood Residence',           category: 'architecture', location: 'Grayton Beach, FL',    year: '2024' },
  { slug: 'creekbridge',  name: '19 Creekbridge Way',           category: 'architecture', location: 'Watersound, FL',       year: '2024' },
  { slug: 'drome',        name: 'Drome',                        category: 'architecture', location: 'Seaside, FL',          year: '2024' },
  { slug: 'urbanneighbors', name: 'Urban Neighbors',            category: 'architecture', location: 'Tampa, FL',            year: '2023' },
  { slug: 'variousdetails', name: 'Various Details',            category: 'architecture', location: '—',                   year: '2024' },
  { slug: 'thesis',       name: 'Thesis Project',               category: 'architecture', location: 'Auburn, AL',           year: '2022-23' },
  { slug: 'woodcomp',     name: 'Wood Competition 2020',        category: 'architecture', location: 'Auburn, AL',           year: '2020' },
  { slug: 'schoolwork',   name: 'Schoolwork',                   category: 'architecture', location: 'Auburn, AL',           year: '2018-22' },
  { slug: 'fithyearmini', name: 'Fifth Year Mini',              category: 'architecture', location: 'Auburn, AL',           year: '2021' },
  { slug: 'photography',  name: 'Photography',                  category: 'personal',     location: 'Alys Beach, FL',       year: '2025' },
  { slug: 'personalart',  name: 'Personal Art',                 category: 'personal',     location: 'Florida',              year: '2025' },
  { slug: 'lightboard',   name: 'Lightboard',                   category: 'personal',     location: '30A, FL',              year: '2025' },
  { slug: 'mystuff',      name: 'My Stuff',                     category: 'personal',     location: '30A, FL',              year: '2025' },
  { slug: 'drift',        name: 'Drift',                        category: 'lab',          location: '—',                   year: '2025' },
  { slug: 'plan',         name: 'Plan',                         category: 'lab',          location: '—',                   year: '2025' },
  { slug: 'birds',        name: 'Birds',                        category: 'lab',          location: '—',                   year: '2025' },
  { slug: 'field',        name: 'Field',                        category: 'lab',          location: '—',                   year: '2025' },
];

async function loadProjects() {
  try {
    if (window.DATA && window.DATA.getProjects) {
      const p = await window.DATA.getProjects();
      if (p && p.length > 0) {
        PROJECTS = p.map(x => ({
          slug: x.slug || '',
          name: x.name || x['Display Name'] || '',
          category: (x.category || '').toLowerCase(),
          location: x.location || '',
          year: String(x.year || ''),
        }));
        return;
      }
    }
  } catch (e) {
    console.warn('Sheet fetch failed, using fallback', e);
  }
  PROJECTS = FALLBACK_PROJECTS;
}

function bucketize() {
  BUCKETS.architecture = PROJECTS.filter(p => p.category === 'architecture');
  BUCKETS.personal     = PROJECTS.filter(p => p.category === 'personal');
  BUCKETS.lab          = PROJECTS.filter(p => p.category === 'lab');
  // Lab fallback to hardcoded if empty (sheet may not have lab rows)
  if (BUCKETS.lab.length === 0) {
    BUCKETS.lab = FALLBACK_PROJECTS.filter(p => p.category === 'lab');
  }
}


/* ════════════════════════════════════════════════════════
   COMPOSITION HELPERS
   ──────────────────────────────────────────────────────── */
function fitTextSize(ctx, text, maxWidth, family, weight) {
  let size = Math.max(60, maxWidth / 4);
  ctx.font = `${weight} ${size}px ${family}`;
  let m = ctx.measureText(text).width;
  if (m <= maxWidth) {
    // Scale up to fill
    while (m < maxWidth && size < 600) {
      size += 4;
      ctx.font = `${weight} ${size}px ${family}`;
      m = ctx.measureText(text).width;
    }
    size -= 4;
  } else {
    // Scale down to fit
    while (m > maxWidth && size > 20) {
      size -= 2;
      ctx.font = `${weight} ${size}px ${family}`;
      m = ctx.measureText(text).width;
    }
  }
  ctx.font = `${weight} ${size}px ${family}`;
  return size;
}


/* ════════════════════════════════════════════════════════
   SCENE COMPOSITIONS
   ──────────────────────────────────────────────────────── */
function drawHero(ctx, w, h) {
  ctx.fillStyle = '#000';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // HUGE "TRES" — fills ~62% viewport width
  const titleSize = fitTextSize(ctx, 'TRES', w * 0.62, '"Bebas Neue", sans-serif', '400');
  const titleCenterX = w * 0.50;
  const titleY = h * 0.42;
  ctx.fillText('TRES', titleCenterX, titleY);

  // Yellow period
  const textW = ctx.measureText('TRES').width;
  const periodX = titleCenterX + textW / 2 + titleSize * 0.06;
  const periodY = titleY + titleSize * 0.34;
  ctx.fillStyle = 'rgb(245,203,92)';
  ctx.beginPath();
  ctx.arc(periodX, periodY, titleSize * 0.08, 0, Math.PI * 2);
  ctx.fill();

  // Underline rule (sampled as particles)
  ctx.fillStyle = '#000';
  const ruleY = h * 0.55;
  const ruleW = titleSize * 1.1;
  for (let x = -ruleW; x < ruleW; x += 8) {
    ctx.fillRect(titleCenterX + x, ruleY, 4, 2);
  }
}

function drawDisciplineScene(ctx, w, h, opts) {
  // opts: { title }
  // Small text is rendered in DOM overlay for legibility. The canvas
  // only draws the huge wordmark + yellow period + underline rule.
  ctx.fillStyle = '#000';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // HUGE wordmark — scales to ~85% viewport width
  const titleSize = fitTextSize(ctx, opts.title, w * 0.85, '"Bebas Neue", sans-serif', '400');
  const titleCenterX = w * 0.50;
  const titleY = h * 0.40;
  ctx.fillText(opts.title, titleCenterX, titleY);

  // Yellow period
  const titleW = ctx.measureText(opts.title).width;
  const periodX = titleCenterX + titleW / 2 + titleSize * 0.05;
  const periodY = titleY + titleSize * 0.34;
  ctx.fillStyle = 'rgb(245,203,92)';
  ctx.beginPath();
  ctx.arc(periodX, periodY, titleSize * 0.055, 0, Math.PI * 2);
  ctx.fill();

  // Underline rule
  ctx.fillStyle = '#000';
  const ruleY = h * 0.55;
  for (let x = -titleW * 0.55; x < titleW * 0.55; x += 8) {
    ctx.fillRect(titleCenterX + x, ruleY, 4, 2);
  }
}

function drawArchitecture(ctx, w, h) { drawDisciplineScene(ctx, w, h, { title: 'ARCHITECTURE' }); }
function drawPersonal    (ctx, w, h) { drawDisciplineScene(ctx, w, h, { title: 'PERSONAL' }); }
function drawLab         (ctx, w, h) { drawDisciplineScene(ctx, w, h, { title: 'LAB' }); }

function drawContact(ctx, w, h) {
  // Wordmark only; contact info is DOM
  ctx.fillStyle = '#000';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const titleSize = fitTextSize(ctx, 'STUDIO', w * 0.70, '"Bebas Neue", sans-serif', '400');
  const titleCenterX = w * 0.50;
  const titleY = h * 0.36;
  ctx.fillText('STUDIO', titleCenterX, titleY);

  const textW = ctx.measureText('STUDIO').width;
  const periodX = titleCenterX + textW / 2 + titleSize * 0.06;
  const periodY = titleY + titleSize * 0.34;
  ctx.fillStyle = 'rgb(245,203,92)';
  ctx.beginPath();
  ctx.arc(periodX, periodY, titleSize * 0.07, 0, Math.PI * 2);
  ctx.fill();

  // Underline rule
  ctx.fillStyle = '#000';
  const ruleY = h * 0.50;
  for (let x = -textW * 0.55; x < textW * 0.55; x += 8) {
    ctx.fillRect(titleCenterX + x, ruleY, 4, 2);
  }
}

const SCENE_DRAW = {
  hero:         drawHero,
  architecture: drawArchitecture,
  personal:     drawPersonal,
  lab:          drawLab,
  contact:      drawContact,
};

/* Particle target counts per scene — denser wordmarks. Scaled down on
   coarse-pointer devices so iOS Safari stays smooth. */
const COUNT_SCALE = IS_COARSE ? 0.55 : 1.0;
const SCENE_COUNTS = {
  hero:         Math.round(34000 * COUNT_SCALE),
  architecture: Math.round(24000 * COUNT_SCALE),
  personal:     Math.round(20000 * COUNT_SCALE),
  lab:          Math.round(20000 * COUNT_SCALE),
  contact:      Math.round(18000 * COUNT_SCALE),
};
// Ambient scatter — particles spread across each scene's viewport,
// not part of any composition. Makes the page feel populated rather
// than empty space between wordmarks.
const AMBIENT_PER_SCENE = Math.round(3500 * COUNT_SCALE);


/* ── Composition sampler — iterates whole canvas once ───── */
function sampleScene(sceneIdx, sceneKey, targetCount) {
  const w = W;
  const h = H;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, w, h);
  SCENE_DRAW[sceneKey](ctx, w, h);
  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;
  const sceneCenterY = -sceneIdx * h;

  // First pass: collect every opaque pixel (lower threshold so we
  // include anti-aliased edges and thin strokes)
  const opaque = [];
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const i = (y * w + x) * 4;
      const a = data[i + 3];
      if (a > 40) {
        opaque.push([x, y, data[i], data[i + 1], data[i + 2]]);
      }
    }
  }
  if (opaque.length === 0) return [];

  // Second pass: random subsample to hit target count
  const particles = [];
  const keepRate = Math.min(1, targetCount / opaque.length);
  for (const [x, y, r, g, b] of opaque) {
    if (keepRate >= 1 || Math.random() < keepRate) {
      const isYellow = r > 200 && g > 140 && b < 130;
      particles.push({
        rx: x - w / 2,
        ry: sceneCenterY + h / 2 - y,
        rz: (Math.random() - 0.5) * 6,
        isYellow,
      });
      if (particles.length >= targetCount) break;
    }
  }
  return particles;
}


/* ── Ambient scatter — populates the empty space between compositions */
function generateAmbient(sceneIdx, count) {
  const w = W;
  const h = H;
  const sceneCenterY = -sceneIdx * h;
  const out = [];
  for (let i = 0; i < count; i++) {
    out.push({
      rx: (Math.random() - 0.5) * w * 1.02,
      ry: sceneCenterY + (Math.random() - 0.5) * h * 0.96,
      rz: (Math.random() - 0.5) * 14,
      isYellow: Math.random() < 0.04,   // ~4% yellow accent in the field
      ambient: true,                    // smaller, dimmer than wordmark particles
    });
  }
  return out;
}


/* ── Build particle systems ─────────────────────────────── */
let inkPoints = null, yellowPoints = null;
let inkData   = null, yellowData   = null;

function populateDOM() {
  // Project lists per discipline
  ['architecture', 'personal', 'lab'].forEach(key => {
    const list = document.querySelector(`[data-list="${key}"]`);
    const cnt  = document.querySelector(`[data-count="${key}"]`);
    if (!list) return;
    const bucket = BUCKETS[key] || [];
    list.innerHTML = bucket.map((p, i) => {
      const name = (p.name || '').toUpperCase();
      const yr = p.year || '';
      const slug = (p.slug || '').replace(/[^a-z0-9_-]/gi, '');
      return `<li class="sect-row" data-slug="${slug}">
        <span class="row-num">${String(i+1).padStart(2,'0')}</span>
        <span class="row-name">${name}</span>
        <span class="row-year">${yr}</span>
      </li>`;
    }).join('');
    if (cnt) {
      const noun = key === 'lab' ? 'EXPERIMENTS' : 'PROJECTS';
      const years = key === 'architecture' ? '2018–2026' : '2025';
      cnt.textContent = `${bucket.length} ${noun} · ${years}`;
    }
  });

  // Project row clicks navigate to that project on the main site
  document.querySelectorAll('.sect-row').forEach(row => {
    row.addEventListener('click', (e) => {
      const slug = row.dataset.slug;
      if (slug) window.location.href = `../../project.html?id=${slug}`;
    });
  });
}

async function buildParticles() {
  if (document.fonts && document.fonts.ready) await document.fonts.ready;

  await loadProjects();
  bucketize();
  populateDOM();

  const all = [];
  SCENES.forEach((key, i) => {
    const parts = sampleScene(i, key, SCENE_COUNTS[key]);
    const amb   = generateAmbient(i, AMBIENT_PER_SCENE);
    all.push(...parts, ...amb);
  });

  const inkP = all.filter(p => !p.isYellow);
  const yelP = all.filter(p =>  p.isYellow);

  inkData    = createBuffers(inkP, false);
  yellowData = createBuffers(yelP, true);

  inkPoints    = createPoints(inkData,    THREE.NormalBlending,    false);
  yellowPoints = createPoints(yellowData, THREE.AdditiveBlending,  true);

  scene.add(inkPoints);
  scene.add(yellowPoints);

  loader.classList.add('done');
  setTimeout(() => hint.classList.add('show'), 700);
  setTimeout(() => hint.classList.add('hide'), 4800);
}

function createBuffers(particles, isYellow) {
  const n = particles.length;
  const pos   = new Float32Array(n * 3);
  const rest  = new Float32Array(n * 3);
  const vel   = new Float32Array(n * 3);
  const color = new Float32Array(n * 3);
  const size  = new Float32Array(n);
  const opac  = new Float32Array(n);

  for (let i = 0; i < n; i++) {
    const p = particles[i];
    // Start scattered around the viewport so they "fly in" on load
    const sx = (Math.random() - 0.5) * W * 1.6;
    const sy = (Math.random() - 0.5) * H * 1.6 + p.ry;
    const sz = (Math.random() - 0.5) * 80;
    pos[i*3]   = sx;
    pos[i*3+1] = sy;
    pos[i*3+2] = sz;
    rest[i*3]   = p.rx;
    rest[i*3+1] = p.ry;
    rest[i*3+2] = p.rz;
    const c = isYellow ? COLORS.yellow : COLORS.ink;
    color[i*3]   = c[0];
    color[i*3+1] = c[1];
    color[i*3+2] = c[2];
    // Wordmark particles dense + opaque; ambient scatter much smaller + dimmer
    if (p.ambient) {
      size[i] = isYellow ? (2.4 + Math.random() * 1.0) : (1.6 + Math.random() * 0.8);
      opac[i] = isYellow ? 0.85 : (0.32 + Math.random() * 0.18);
    } else {
      size[i] = isYellow ? (6.5 + Math.random() * 2.5) : (4.6 + Math.random() * 1.8);
      opac[i] = 1.0;
    }
  }

  return { n, pos, rest, vel, color, size, opac };
}

function createPoints(d, blending) {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(d.pos, 3));
  geo.setAttribute('aColor',   new THREE.BufferAttribute(d.color, 3));
  geo.setAttribute('aSize',    new THREE.BufferAttribute(d.size, 1));
  geo.setAttribute('aOpacity', new THREE.BufferAttribute(d.opac, 1));
  const mat = new THREE.ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: FRAG,
    transparent: true,
    depthWrite: false,
    blending,
  });
  return new THREE.Points(geo, mat);
}


/* ── Mouse + scroll state ───────────────────────────────── */
let mx = -9999, my = -9999;
let mouseWorld = new THREE.Vector3(0, 0, 0);
let mouseDown = false;
let pressStart = 0;
let smoothMx = 0, smoothMy = 0;

window.addEventListener('pointermove', (e) => {
  mx = e.clientX;
  my = e.clientY;
});

function updateMouseWorld() {
  mouseWorld.x = (mx - W / 2);
  mouseWorld.y = -(my - H / 2) + camera.position.y;
}


/* ── Smooth scroll ──────────────────────────────────────── */
let lenis = null;
let currentScroll = 0;
if (window.Lenis) {
  lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 1.0, smoothWheel: true, smoothTouch: false });
  lenis.on('scroll', (e) => { currentScroll = e.scroll; });
  function rafLenis(time) { lenis.raf(time); requestAnimationFrame(rafLenis); }
  requestAnimationFrame(rafLenis);
} else {
  window.addEventListener('scroll', () => { currentScroll = window.scrollY; });
}


/* ── Physics step ───────────────────────────────────────── */
function stepParticles(data) {
  if (!data) return;
  const { n, pos, rest, vel } = data;
  const mxx = mouseWorld.x;
  const myy = mouseWorld.y;
  // On coarse pointers, click-attract is disabled so scroll/touch stays clean.
  const attractOn = mouseDown && !IS_COARSE;

  for (let i = 0; i < n; i++) {
    const i3 = i * 3;
    let x = pos[i3], y = pos[i3 + 1], z = pos[i3 + 2];
    let vx = vel[i3], vy = vel[i3 + 1], vz = vel[i3 + 2];
    const rx = rest[i3], ry = rest[i3 + 1], rz = rest[i3 + 2];

    // Mouse force — smooth inverse-quadratic falloff. No hard radius,
    // no buffer zone. Particles closer to the cursor feel a stronger
    // attraction (or repulsion when not pressed) that smoothly drops
    // off with distance. FORCE_MAX_DIST2 just skips particles where
    // the force is negligible to save CPU.
    const dx = x - mxx;
    const dy = y - myy;
    const d2 = dx * dx + dy * dy;
    if (d2 < FORCE_MAX_DIST2 && d2 > 0.5) {
      const dist = Math.sqrt(d2);
      const invDist = 1 / dist;
      if (attractOn) {
        // smoothly increasing attraction toward cursor
        const falloff = 1 / (1 + d2 / ATTRACT_K);
        const pull = falloff * 2.6;
        vx -= dx * invDist * pull;
        vy -= dy * invDist * pull;
      } else {
        // smoothly decaying repulsion as cursor passes
        const falloff = 1 / (1 + d2 / REPEL_K);
        const force = falloff * MOUSE_FORCE;
        vx += dx * invDist * force;
        vy += dy * invDist * force;
      }
    }

    // spring back to rest
    vx += (rx - x) * SPRING;
    vy += (ry - y) * SPRING;
    vz += (rz - z) * SPRING * 0.5;

    // damping
    vx *= DAMP;
    vy *= DAMP;
    vz *= DAMP;

    x += vx;
    y += vy;
    z += vz;

    pos[i3]   = x;
    pos[i3+1] = y;
    pos[i3+2] = z;
    vel[i3]   = vx;
    vel[i3+1] = vy;
    vel[i3+2] = vz;
  }
}


/* ── Render + camera ────────────────────────────────────── */
function updateCamera() {
  camera.position.y = -currentScroll;
}

function pushBuffers() {
  if (inkPoints) {
    inkPoints.geometry.attributes.position.array = inkData.pos;
    inkPoints.geometry.attributes.position.needsUpdate = true;
  }
  if (yellowPoints) {
    yellowPoints.geometry.attributes.position.array = yellowData.pos;
    yellowPoints.geometry.attributes.position.needsUpdate = true;
  }
}


/* ── Cursor + HUD ───────────────────────────────────────── */
function updateCursorDOM() {
  smoothMx += (mx - smoothMx) * 0.4;
  smoothMy += (my - smoothMy) * 0.4;
  cursorEl.style.transform = `translate3d(${smoothMx}px, ${smoothMy}px, 0) translate(-50%, -50%)`;
  cursorEl.classList.toggle('show-readout', mx > 0 && mx < W);

  const sceneIdx = clamp(Math.round(currentScroll / H), 0, SCENES.length - 1);
  const hot = isPointerOverHotZone(sceneIdx);
  cursorEl.classList.toggle('hot', hot);

  readX.textContent = `${String(Math.round(mx)).padStart(4, '0')} / ${String(Math.round(my)).padStart(4, '0')}`;
  readMode.textContent = mouseDown ? (hot ? 'DIVE' : 'PULL') : (hot ? 'TARGET' : 'FREE');

  if (mouseDown && holdStart != null) {
    const ht = clamp((performance.now() - holdStart) / HOLD_MS, 0, 1);
    ringEl.style.background = `conic-gradient(${rgb(COLORS.yellowHot)} ${(ht * 360).toFixed(1)}deg, transparent 0deg)`;
  }
}

function rgb(c) { return `rgb(${Math.round(c[0]*255)},${Math.round(c[1]*255)},${Math.round(c[2]*255)})`; }

function isPointerOverHotZone(sceneIdx) {
  // The yellow "HOLD TO ENTER" line at y ≈ h * 0.92 of the current scene
  // Plus the discipline name itself (h * 0.36–0.46) for a generous click target.
  if (sceneIdx === 0 || sceneIdx === 4) return false;
  const yLocal = my;
  // hot in the wordmark band OR the hold-to-enter band
  const inWordmark = yLocal > H * 0.32 && yLocal < H * 0.48;
  const inAffordance = yLocal > H * 0.88 && yLocal < H * 0.96;
  return inWordmark || inAffordance;
}

function updateScrollHUD() {
  const max = (SCENES.length - 1) * H;
  const prog = clamp(currentScroll / max, 0, 1);
  progressFill.style.width = (prog * 100).toFixed(1) + '%';
  const sceneIdx = clamp(Math.round(currentScroll / H), 0, SCENES.length - 1);
  progressLabel.textContent = `${String(sceneIdx).padStart(2, '0')} / 04`;
  navLinks.forEach((el, i) => el.classList.toggle('active', i === sceneIdx));
}


/* ════════════════════════════════════════════════════════
   HOLD + DIVE (with real navigation to main site)
   ──────────────────────────────────────────────────────── */
let holdStart = null;
let holdTimeout = null;

// URLs that the dive transition navigates to (relative — assumes
// the universe site lives in a subfolder of the main site).
// Deploy target: Tres Studio v1.2/labs/Alternate Sites/ — so the main
// site root is two levels up.
const DIVE_URLS = {
  architecture: '../../category.html?cat=architecture',
  personal:     '../../category.html?cat=personal',
  lab:          '../../lab.html',
};
const DIVE_LABELS = {
  architecture: { title: 'ARCHITECTURE', meta: 'ENTERING / CATEGORY / ARCHITECTURE' },
  personal:     { title: 'PERSONAL',     meta: 'ENTERING / CATEGORY / PERSONAL' },
  lab:          { title: 'LAB',          meta: 'ENTERING / LAB INDEX' },
};

function tryStartHold() {
  holdStart = performance.now();
  pressStart = holdStart;
  ringEl.classList.add('active');
  ringEl.style.background = `conic-gradient(${rgb(COLORS.yellowHot)} 0deg, transparent 0deg)`;

  if (holdTimeout) clearTimeout(holdTimeout);
  holdTimeout = setTimeout(() => {
    const sceneIdx = clamp(Math.round(currentScroll / H), 0, SCENES.length - 1);
    const sceneKey = SCENES[sceneIdx];
    if (document.body.classList.contains('diving')) {
      exitInterior();
    } else if (DIVE_URLS[sceneKey] && isPointerOverHotZone(sceneIdx)) {
      commitDive(sceneKey);
    }
    // Attract continues until pointerup; ring just fades.
    holdStart = null;
    if (holdTimeout) { clearTimeout(holdTimeout); holdTimeout = null; }
    ringEl.classList.remove('active');
  }, HOLD_MS);
}

function endHold() {
  // No toggle. Releasing the pointer simply stops the attract.
  mouseDown = false;
  pressStart = 0;
  if (holdTimeout) { clearTimeout(holdTimeout); holdTimeout = null; }
  holdStart = null;
  ringEl.classList.remove('active');
}

window.addEventListener('pointerdown', (e) => {
  // Don't activate attract from clicks on UI elements (nav, CTA, rows, links).
  if (e.target.closest('.nav-link, .sect-cta, .sect-row, .contact-line, .back-link, .lab-reset')) {
    return;
  }
  // On coarse pointers (iOS), skip the press-attract so touch-drag scrolls
  // cleanly without any drag-toggle weirdness. The hold-for-dive still works.
  if (!IS_COARSE) mouseDown = true;
  tryStartHold();
});
window.addEventListener('pointerup',     endHold);
window.addEventListener('pointercancel', endHold);
window.addEventListener('blur',          endHold);

window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && interior.classList.contains('visible')) exitInterior();
});

// DOM CTA buttons dive directly (no hold needed — they're discrete UI)
document.querySelectorAll('.sect-cta').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const key = btn.dataset.dive;
    if (key && DIVE_URLS[key]) commitDive(key);
  });
});

function commitDive(sceneKey) {
  const labels = DIVE_LABELS[sceneKey];
  if (!labels) return;
  document.body.classList.add('diving');
  setTimeout(() => {
    interiorName.textContent = labels.title;
    interiorPath.textContent = `/ ${labels.title}`;
    interiorMeta.textContent = labels.meta;
    interior.classList.add('visible');
    interior.setAttribute('aria-hidden', 'false');
  }, 520);
  // Navigate to the real page after the dive completes
  setTimeout(() => {
    if (DIVE_URLS[sceneKey]) {
      window.location.href = DIVE_URLS[sceneKey];
    }
  }, 1400);
}

function exitInterior() {
  interior.classList.remove('visible');
  interior.setAttribute('aria-hidden', 'true');
  setTimeout(() => document.body.classList.remove('diving'), 480);
}

// Top-right nav also navigates / scrolls
navLinks.forEach((el, i) => {
  el.addEventListener('click', (e) => {
    e.preventDefault();
    if (lenis) lenis.scrollTo(i * H, { duration: 1.4, easing: t => 1 - Math.pow(1 - t, 3) });
    else window.scrollTo({ top: i * H, behavior: 'smooth' });
  });
});


/* ── Resize ─────────────────────────────────────────────── */
function onResize() {
  W = window.innerWidth;
  H = window.innerHeight;
  renderer.setSize(W, H);
  camera.aspect = W / H;
  const d = H / (2 * Math.tan((FOV * Math.PI / 180) / 2));
  camera.position.z = d;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', onResize);


/* ── Main loop ──────────────────────────────────────────── */
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

function loop() {
  updateCamera();
  updateMouseWorld();

  stepParticles(inkData);
  stepParticles(yellowData);
  pushBuffers();

  renderer.render(scene, camera);

  updateCursorDOM();
  updateScrollHUD();

  requestAnimationFrame(loop);
}


/* ── Init ───────────────────────────────────────────────── */
async function init() {
  await buildParticles();
  requestAnimationFrame(loop);
}
init();

})();
