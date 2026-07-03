// ────────────────────────────────────────────────────────
// CLOUDINARY URL BUILDER — render-time helpers for baked project data.
//
// Port of config.js's Cloudinary constants + data.js's joinUrl (lines 11-19).
// The data layer (sheet.ts) keeps only raw sheet paths; these helpers turn a
// path + transform into a full Cloudinary delivery URL at render time.
// ────────────────────────────────────────────────────────
import type { MediaItem, Project } from './sheet';

// Exact values copied from config.js.
export const CLOUDINARY_BASE =
  'https://res.cloudinary.com/dodk1b5l7/image/upload/f_auto,q_auto';

// THUMB used for gallery thumbnails + lightbox view (config.js: 'w_1800').
export const THUMB_TRANSFORM = 'w_1800';

// Grid tiles (the two-tier split): grid cells render ~400-650px wide, so
// w_900 covers 2x displays at a fraction of w_1800's weight. Lightbox keeps
// THUMB_TRANSFORM.
export const GRID_TRANSFORM = 'w_900';

// Hero images (config.js: 'w_2400').
export const HERO_TRANSFORM = 'w_2400';

// Build a Cloudinary URL from a raw sheet path.
//
// Faithful port of data.js joinUrl:
//   - null/empty path -> null
//   - kind === 'video' swaps '/image/upload' -> '/video/upload' in the base so
//     one sheet cell can hold a .png or .mp4 and Just Work
//   - transform, when present, is inserted as its own '/'-delimited segment
//   - leading slashes are stripped from the path before joining
export function joinUrl(
  path: string | null | undefined,
  transform: string | null,
  kind?: 'image' | 'video',
): string | null {
  if (!path) return null;
  const base =
    kind === 'video'
      ? CLOUDINARY_BASE.replace('/image/upload', '/video/upload')
      : CLOUDINARY_BASE;
  const t = transform ? '/' + transform : '';
  const cleanPath = path.replace(/^\/+/, '');
  return `${base}${t}/${cleanPath}`;
}

// Hero image URL for a project (data.js used HERO_TRANSFORM for heroUrl).
export function heroUrl(project: Project): string | null {
  return joinUrl(project.heroImage, HERO_TRANSFORM, 'image');
}

// Hero image at THUMB size (data.js exposed this as heroUrlThumb).
export function heroUrlThumb(project: Project): string | null {
  return joinUrl(project.heroImage, THUMB_TRANSFORM, 'image');
}

// Gallery media URL. Mirrors data.js rowToProject's per-item logic:
//   - video: no width transform (base f_auto,q_auto handles format/quality),
//     routed through /video/upload
//   - image: THUMB_TRANSFORM by default, overridable via `transform`
export function mediaUrl(
  item: MediaItem,
  transform: string | null = THUMB_TRANSFORM,
): string | null {
  if (item.type === 'video') {
    return joinUrl(item.path, null, 'video');
  }
  return joinUrl(item.path, transform, 'image');
}

// Grid-tier URL for gallery tiles (videos are unaffected by width transforms).
export function gridUrl(item: MediaItem): string | null {
  return mediaUrl(item, GRID_TRANSFORM);
}
