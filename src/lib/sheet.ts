// ────────────────────────────────────────────────────────
// DATA LAYER — parses the published Google Sheet CSV into typed projects.
//
// Phase 2 port of the runtime logic in data.js. PARITY IS THE LAW: the header
// detection, column mapping, row filtering, sorting and media typing here are a
// faithful port of DATA.fetchCSV + DATA.rowToProject + DATA.getProjects.
//
// KEY DEVIATION FROM data.js (by design, per the migration plan): these
// functions keep the RAW sheet paths (heroImage, media[].path) instead of
// pre-building Cloudinary URLs. URL construction moves to src/lib/cloudinary.ts
// so render-time helpers own the transforms. The legacy `images` string[] alias
// from data.js is intentionally dropped — nothing in the Astro build consumes it.
// ────────────────────────────────────────────────────────
import Papa from 'papaparse';

// A single gallery entry. `path` is the raw sheet cell value (e.g.
// "projects/foo/img.jpg"); the Cloudinary URL is built later by cloudinary.ts.
// `type` is derived from the file extension, exactly as data.js's isVideoPath.
export interface MediaItem {
  type: 'image' | 'video';
  path: string;
}

// One portfolio project. Field names/semantics mirror data.js's rowToProject
// return object, minus the pre-built URL fields (heroUrl/heroUrlThumb/images).
export interface Project {
  id: string;
  name: string;
  slug: string;
  category: string;
  subcategory: string;
  location: string;
  year: string;
  status: string;
  order: number;
  description: string;
  heroImage: string;
  designedAt: string;
  designedAtUrl: string;
  media: MediaItem[];
}

// Video files route through Cloudinary's /video/upload CDN. Same extensions,
// same case-insensitivity as data.js line 21-23.
function isVideoPath(p: string): boolean {
  return /\.(mp4|webm|mov|m4v)$/i.test(p);
}

// A raw parsed row: header string -> cell value. Cells are always strings
// (empty string when the sheet cell is blank), matching data.js's mapping.
type RawRow = Record<string, string>;

// Parse CSV text into raw rows keyed by the real header row.
//
// Port of data.js fetchCSV's parsing half (network is handled by the loader):
//   1. Papa.parse WITHOUT header mode (skipEmptyLines) -> array of arrays,
//      because decorative title rows sit above the real header.
//   2. Find the header row by scanning for a cell === '#' / 'Display Name' /
//      'Slug'. If none is found, return [] (data.js console.errors + returns []).
//   3. Map each subsequent row to an object keyed by the header cells, with
//      missing cells defaulting to '' (data.js: row[i] != null ? row[i] : '').
export function parseCsvToRows(text: string): RawRow[] {
  const parsed = Papa.parse<string[]>(text, { skipEmptyLines: true });
  const allRows = parsed.data;

  const headerIdx = allRows.findIndex((row) =>
    row.some((cell) => cell === '#' || cell === 'Display Name' || cell === 'Slug'),
  );
  if (headerIdx === -1) {
    console.error('[sheet] Could not find header row in CSV.');
    return [];
  }

  const headers = allRows[headerIdx];
  const dataRows = allRows.slice(headerIdx + 1);

  return dataRows.map((row) => {
    const obj: RawRow = {};
    headers.forEach((h, i) => {
      obj[h] = row[i] != null ? row[i] : '';
    });
    return obj;
  });
}

// Convert one raw row into a Project. Port of data.js rowToProject:
//   - media: img_01 .. img_100, 2-digit zero-padded keys; skip blank/whitespace;
//     trim; type by extension (video for .mp4/.webm/.mov/.m4v, else image).
//   - column mapping: category lowercased+trimmed; slug/status/heroImage/
//     designedAt/designedAtUrl trimmed; order parseInt with 999 default.
// Note: raw paths are retained on media[].path and heroImage — URLs built later.
export function rowToProject(row: RawRow): Project {
  const media: MediaItem[] = [];
  for (let i = 1; i <= 100; i++) {
    const key = 'img_' + String(i).padStart(2, '0');
    const raw = row[key];
    if (!raw || !raw.trim()) continue;
    const path = raw.trim();
    media.push({ type: isVideoPath(path) ? 'video' : 'image', path });
  }

  return {
    id: row['#'] || '',
    name: row['Display Name'] || '',
    slug: (row['Slug'] || '').trim(),
    category: (row['Category'] || '').trim().toLowerCase(),
    subcategory: row['Subcategory'] || '',
    location: row['Location'] || '',
    year: row['Year'] || '',
    status: (row['Status'] || '').trim(),
    order: parseInt(row['Order']) || 999,
    description: row['Description'] || '',
    heroImage: (row['Hero Image'] || '').trim(),
    designedAt: (row['Designed At'] || '').trim(),
    designedAtUrl: (row['Designed At URL'] || '').trim(),
    media,
  };
}

// Full pipeline: CSV text -> filtered, sorted Project[].
// Port of data.js getProjects's map/filter/sort:
//   - filter out rows with no slug or Status === 'Hidden'
//   - sort ascending by order
export function parseProjects(text: string): Project[] {
  return parseCsvToRows(text)
    .map(rowToProject)
    .filter((p) => p.slug && p.status !== 'Hidden')
    .sort((a, b) => a.order - b.order);
}
