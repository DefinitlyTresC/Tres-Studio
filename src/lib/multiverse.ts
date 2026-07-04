// The multiverse registry — one entry per site. The dot-ring, the edge
// function count (netlify/edge-functions/roll.js — keep COUNT in sync), and
// each site's shell read from here.
export type Site = {
  id: number;
  name: string;
  paper: string; // background
  ink: string;   // text / curtain color
  swatch: string; // the site's dot on the ring
};

export const SITES: Site[] = [
  { id: 1, name: 'One', paper: '#FFEDDB', ink: '#2B1F1A', swatch: '#BF9270' },
  { id: 2, name: 'Two', paper: '#FAFAF7', ink: '#101010', swatch: '#9A9A9A' },
  { id: 3, name: 'Three', paper: '#FFFFFF', ink: '#141414', swatch: '#4A4A4A' },
  { id: 4, name: 'Four', paper: '#EC5B13', ink: '#141210', swatch: '#EC5B13' },
  { id: 5, name: 'Five', paper: '#FFFFFF', ink: '#0A0A0A', swatch: '#2431FF' },
  { id: 6, name: 'Six', paper: '#FAF8F3', ink: '#141310', swatch: '#1F8A70' },
];

// Serialized for the client scripts (ring, curtain).
export const MV_CLIENT = (current: number) =>
  `window.MV=${JSON.stringify({ current, sites: SITES })};`;
