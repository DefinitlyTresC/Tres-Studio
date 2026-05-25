// ────────────────────────────────────────────────────────
// DATA LAYER — reads Google Sheets, builds Cloudinary URLs
// ────────────────────────────────────────────────────────
const DATA = (() => {

  let _projects = null;
  let _labs = null;

  // Cloudinary uses /image/upload/ for images and /video/upload/ for video.
  // joinUrl swaps the base when kind === 'video' so a single sheet cell can
  // hold either a .png or a .mp4 and Just Work without extra config.
  function joinUrl(path, transform, kind) {
    if (!path) return null;
    const base = kind === 'video'
      ? CONFIG.CLOUDINARY_BASE.replace('/image/upload', '/video/upload')
      : CONFIG.CLOUDINARY_BASE;
    const t = transform ? '/' + transform : '';
    const cleanPath = path.replace(/^\/+/, '');
    return `${base}${t}/${cleanPath}`;
  }

  function isVideoPath(p) {
    return /\.(mp4|webm|mov|m4v)$/i.test(p);
  }

  async function fetchCSV(url) {
    if (!url) {
      console.warn('Sheet URL not configured in config.js');
      return [];
    }
    const res = await fetch(url, { cache: 'no-cache' });
    if (!res.ok) throw new Error('Sheet fetch failed: ' + res.status);
    const text = await res.text();

    // Parse without auto-header — the sheet has decorative title rows above the real headers.
    const allRows = Papa.parse(text, { skipEmptyLines: true }).data;

    // Find the real header row by looking for known column names.
    const headerIdx = allRows.findIndex(row =>
      row.some(cell => cell === '#' || cell === 'Display Name' || cell === 'Slug')
    );
    if (headerIdx === -1) {
      console.error('Could not find header row in sheet:', url);
      return [];
    }

    const headers = allRows[headerIdx];
    const dataRows = allRows.slice(headerIdx + 1);

    return dataRows.map(row => {
      const obj = {};
      headers.forEach((h, i) => { obj[h] = (row[i] != null ? row[i] : ''); });
      return obj;
    });
  }

  function rowToProject(row) {
    // Walk img_01 → img_100. Bumped from 50 to fit longer projects like the
    // 73-page thesis without forcing a re-edit every time something runs long.
    // Each cell becomes either an image or a video based on file extension —
    // .mp4/.webm/.mov/.m4v route through Cloudinary's video CDN.
    const media = [];
    for (let i = 1; i <= 100; i++) {
      const key = 'img_' + String(i).padStart(2, '0');
      const raw = row[key];
      if (!raw || !raw.trim()) continue;
      const path = raw.trim();
      if (isVideoPath(path)) {
        // No width transform on video — let the gallery cell size it, and
        // Cloudinary handles format/quality via the f_auto,q_auto on the base.
        media.push({ type: 'video', url: joinUrl(path, null, 'video') });
      } else {
        media.push({ type: 'image', url: joinUrl(path, CONFIG.THUMB_TRANSFORM) });
      }
    }
    // Legacy alias — older code may still reference `.images` as URLs only.
    // Kept so any other page that loops over images doesn't break.
    const images = media.map(m => m.url);

    return {
      id:           row['#'],
      name:         row['Display Name'],
      slug:         (row['Slug'] || '').trim(),
      category:     (row['Category'] || '').trim().toLowerCase(),
      subcategory:  row['Subcategory'],
      location:     row['Location'],
      year:         row['Year'],
      status:       (row['Status'] || '').trim(),
      order:        parseInt(row['Order']) || 999,
      description:  row['Description'],
      heroUrl:      joinUrl((row['Hero Image'] || '').trim(), CONFIG.HERO_TRANSFORM),
      heroUrlThumb: joinUrl((row['Hero Image'] || '').trim(), CONFIG.THUMB_TRANSFORM),
      // Designed At + URL come from the sheet's two new columns. When the
      // firm name is set, project.html renders it as a credit line; when
      // the URL is also set, that credit becomes a hidden link.
      designedAt:    (row['Designed At'] || '').trim(),
      designedAtUrl: (row['Designed At URL'] || '').trim(),
      media,
      images,
    };
  }

  async function getProjects() {
    if (_projects) return _projects;
    try {
      const rows = await fetchCSV(CONFIG.PROJECTS_CSV_URL);
      _projects = rows
        .map(rowToProject)
        .filter(p => p.slug && p.status !== 'Hidden')
        .sort((a, b) => a.order - b.order);
      return _projects;
    } catch (e) {
      console.error('Failed to load projects:', e);
      return [];
    }
  }

  async function getProjectBySlug(slug) {
    const all = await getProjects();
    return all.find(p => p.slug === slug);
  }

  async function getProjectsByCategory(cat) {
    const all = await getProjects();
    return all.filter(p => p.category === cat.toLowerCase());
  }

  async function getLabs() {
    if (_labs) return _labs;
    try {
      const rows = await fetchCSV(CONFIG.LAB_CSV_URL);
      _labs = rows.filter(r => (r['Slug'] || '').trim()).map(r => ({
        name:      r['Display Name'],
        slug:      r['Slug'],
        type:      r['Type'],
        status:    r['Status'],
        liveUrl:   r['Live URL'],
        repoUrl:   r['Repo URL'],
        stack:     r['Tech Stack'],
        desc:      r['Description'],
      }));
      return _labs;
    } catch (e) {
      console.error('Failed to load labs:', e);
      return [];
    }
  }

  return { getProjects, getProjectBySlug, getProjectsByCategory, getLabs };
})();
