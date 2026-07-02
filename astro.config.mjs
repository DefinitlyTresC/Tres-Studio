import { defineConfig } from 'astro/config';

// Fully static output — no SSR. Netlify builds this and publishes dist/.
// V4 note: React Three Fiber islands can be added later via @astrojs/react;
// do not add integrations before they're needed.
export default defineConfig({
  site: 'https://tres.studio',
});
