import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import revedit from './tools/revedit/integration.mjs';
import bench from './tools/bench/integration.mjs';
import gaugebench from './tools/gaugebench/integration.mjs';

export default defineConfig({
  site: 'https://revaudio.net',
  // RevEdit overlay only exists when launched via `npm run edit` (EDIT=1).
  // Bench and gaugebench need no flag: both self-disable outside `dev` and
  // stay inert until a URL asks for them with ?bench / ?gauge — so plain
  // `npm run dev` is unaffected.
  integrations: [sitemap(), bench(), gaugebench(), ...(process.env.EDIT ? [revedit()] : [])],
  build: {
    inlineStylesheets: 'auto',
  },
});
