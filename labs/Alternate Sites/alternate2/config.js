// ────────────────────────────────────────────────────────
// EDIT THIS FILE TO CONFIGURE THE SITE
// ────────────────────────────────────────────────────────
const CONFIG = {

  // Google Sheets — published CSV URLs
  // The /e/{publishId}/pub portion is the publish key (different from the
  // spreadsheet ID in the editor URL). gid=NNN&single=true locks the fetch
  // to one specific tab, so adding more tabs to the workbook later won't
  // accidentally pull in unrelated data.
  PROJECTS_CSV_URL: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSdqh2xF0vWTaS8XRbqpqXcb7KfUy3g87q5uUG9l_Z7HeSwF5hGbeceRa8Pi_BYDfAASnvyiYbpGjMO/pub?output=csv',

  // Lab data is currently hardcoded in lab.html (the LAB_ICONS array), so
  // this URL is unused. If you ever add a Lab tab to the workbook and want
  // to drive it from the sheet instead, set the URL here with the new tab's
  // gid and data.js's getLabs() will start picking it up.
  LAB_CSV_URL:      '',

  // Cloudinary
  CLOUDINARY_BASE: 'https://res.cloudinary.com/dodk1b5l7/image/upload/f_auto,q_auto',

  // Image transforms (Cloudinary applies these on the fly)
  // THUMB used for gallery thumbnails + lightbox view; bumped higher so
  // text in detail-heavy images (pattern books, plans) stays legible at
  // jello-zoom (3.5x) and fullscreen lightbox sizes on retina/4K displays.
  // f_auto + q_auto keep the byte cost reasonable.
  THUMB_TRANSFORM: 'w_1800',
  HERO_TRANSFORM:  'w_2400',

  // Site
  SITE_TITLE:   'Tres Carter',
  CONTACT_EMAIL:'tres@tres.studio',
  INSTAGRAM:    '@trescarter',
};
