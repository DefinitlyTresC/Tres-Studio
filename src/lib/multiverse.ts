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
  { id: 2, name: 'Two', paper: '#FFFFFF', ink: '#0A0A0A', swatch: '#0A0A0A' },
];

// Serialized for the client scripts (ring, curtain).
export const MV_CLIENT = (current: number) =>
  `window.MV=${JSON.stringify({ current, sites: SITES })};`;
