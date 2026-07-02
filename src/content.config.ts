// ────────────────────────────────────────────────────────
// CONTENT COLLECTIONS — 'projects' baked from the published Google Sheet.
//
// Phase 2: the sheet content (fetched client-side at runtime by config.js +
// data.js in v1) now loads at BUILD time via a custom Astro content-layer
// loader. On a successful fetch the raw CSV is snapshotted to
// src/data/sheet-snapshot.csv; if the network fetch fails, the loader parses
// that committed snapshot instead so the build never breaks offline / when the
// sheet is unreachable. The snapshot is RAW CSV (not mapped JSON) so future
// parser changes retroactively apply to it.
// ────────────────────────────────────────────────────────
import { defineCollection, z } from 'astro:content';
import type { Loader } from 'astro/loaders';
import fs from 'node:fs';
import path from 'node:path';
import { parseProjects, type Project } from './lib/sheet';

// Published-CSV endpoint from config.js (PROJECTS_CSV_URL). Overridable via the
// SHEET_CSV_URL env var — loaders run in Node, so both import.meta.env (Astro's
// injected env) and process.env are consulted.
const DEFAULT_SHEET_CSV_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vSdqh2xF0vWTaS8XRbqpqXcb7KfUy3g87q5uUG9l_Z7HeSwF5hGbeceRa8Pi_BYDfAASnvyiYbpGjMO/pub?output=csv';

const SHEET_CSV_URL =
  import.meta.env.SHEET_CSV_URL ||
  process.env.SHEET_CSV_URL ||
  DEFAULT_SHEET_CSV_URL;

// Snapshot lives under src/data/ and is committed. Resolved from cwd (repo root
// at build time) to keep node:fs paths deterministic.
const SNAPSHOT_PATH = path.resolve(process.cwd(), 'src/data/sheet-snapshot.csv');

// Fetch the live CSV. Returns the raw text, or null on any failure (network
// error, non-200, empty body) so the caller can fall back to the snapshot.
async function fetchCsvText(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) {
      console.warn(`[projects] Sheet fetch failed: HTTP ${res.status} for ${url}`);
      return null;
    }
    const text = await res.text();
    if (!text || !text.trim()) {
      console.warn(`[projects] Sheet fetch returned an empty body for ${url}`);
      return null;
    }
    return text;
  } catch (err) {
    console.warn(`[projects] Sheet fetch threw for ${url}:`, (err as Error).message);
    return null;
  }
}

// Write the raw CSV snapshot (creating src/data/ if needed). Synchronous
// node:fs is fine inside a build-time loader.
function writeSnapshot(text: string): void {
  fs.mkdirSync(path.dirname(SNAPSHOT_PATH), { recursive: true });
  fs.writeFileSync(SNAPSHOT_PATH, text, 'utf8');
}

// Read the committed snapshot. Throws if missing/unreadable — that's the only
// case the loader is allowed to hard-fail on.
function readSnapshot(): string {
  return fs.readFileSync(SNAPSHOT_PATH, 'utf8');
}

const projectsLoader: Loader = {
  name: 'google-sheet-projects',
  async load({ store, logger }) {
    // 1. Try the live sheet.
    let csvText = await fetchCsvText(SHEET_CSV_URL);
    let projects: Project[] = csvText ? parseProjects(csvText) : [];

    if (csvText && projects.length > 0) {
      // SUCCESS: snapshot the raw CSV and use the freshly-parsed projects.
      writeSnapshot(csvText);
      logger.info(
        `Loaded ${projects.length} projects from live sheet; snapshot updated (${SHEET_CSV_URL}).`,
      );
    } else {
      // FAILURE (network error / non-200 / empty / garbage that yields 0
      // projects): warn loudly and fall back to the committed snapshot.
      console.warn(
        `[projects] Live sheet unusable (${
          csvText ? '0 projects parsed' : 'fetch failed'
        }). Falling back to snapshot: ${SNAPSHOT_PATH}`,
      );
      let snapshotText: string;
      try {
        snapshotText = readSnapshot();
      } catch (err) {
        // Only hard-fail when the snapshot is also missing/unreadable.
        throw new Error(
          `[projects] Live sheet failed AND snapshot is missing/unreadable at ${SNAPSHOT_PATH}: ${
            (err as Error).message
          }`,
        );
      }
      projects = parseProjects(snapshotText);
      logger.info(`Loaded ${projects.length} projects from snapshot fallback.`);
    }

    // Reset the store and populate entries keyed by slug.
    store.clear();
    for (const project of projects) {
      store.set({ id: project.slug, data: project });
    }
  },
};

// Zod schema matching the Project type from sheet.ts. Kept in sync with that
// interface — validates the baked entries and gives downstream pages types.
const projects = defineCollection({
  loader: projectsLoader,
  schema: z.object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
    category: z.string(),
    subcategory: z.string(),
    location: z.string(),
    year: z.string(),
    status: z.string(),
    order: z.number(),
    description: z.string(),
    heroImage: z.string(),
    designedAt: z.string(),
    designedAtUrl: z.string(),
    media: z.array(
      z.object({
        type: z.enum(['image', 'video']),
        path: z.string(),
      }),
    ),
  }),
});

export const collections = { projects };
