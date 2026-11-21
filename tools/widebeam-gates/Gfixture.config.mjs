// Phase fixture for the WIDE BEAM gates: the real astro config + a Vite plugin that serves src/data/widebeam.ts with its
// flags flipped, from memory. Nothing in src/ is touched. The page's components read the data module on the server, so
// a browser route could never change the rendered words: this is how open / released / the YouTube facade get rendered.
//   WB_FIXTURE = open | released | youtube | open-youtube | released-youtube      WB_REPO = the repo (default: the one this folder sits in)
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = process.env.WB_REPO || path.resolve(HERE, '..', '..');
const FX = process.env.WB_FIXTURE || 'open';
const base = (await import(path.join(REPO, 'astro.config.mjs'))).default;

const patch = (src) => {
  // a flag the data module already carries (Gil's 7a92522 set gateWired, the price and the price id for real) is left as it is
  const swap = (from, to) => { if (src.includes(to)) return; if (!src.includes(from)) throw new Error('[Gfixture] the data module no longer has: ' + from); src = src.replace(from, to); };
  const phase = FX.startsWith('released') ? 'released' : FX.startsWith('open') || FX === 'youtube' ? 'open' : 'preopen';
  if (phase !== 'preopen') {
    swap("phase: 'preopen' as WidebeamPhase", `phase: '${phase}' as WidebeamPhase`);
    swap('gateWired: false', 'gateWired: true');
  }
  if (phase === 'released') {
    if (!/priceUsd: [1-9][0-9.]* as number \| null/.test(src)) swap('priceUsd: null as number | null', 'priceUsd: 9 as number | null');
    if (!/paddlePriceId: 'pri_[^']+' as string \| null/.test(src)) swap('paddlePriceId: null as string | null', "paddlePriceId: 'pri_fixture' as string | null");
    swap('winInstallTested: false', 'winInstallTested: true');
  }
  if (/youtube/.test(FX)) {
    swap('youtubeId: null as string | null', "youtubeId: 'FIXTUREvid1' as string | null");
    swap('length: null as string | null', "length: '2:10' as string | null");
    swap('transcript: null as string | null', "transcript: 'Fixture transcript.' as string | null");
  }
  return src;
};

// the launch-day plugins.ts entry: RevLimiter's shape, WIDE BEAM's slug, name, the fixture's price id and price, and the
// page's own formats line (formatsLine(): Mac VST3 · AU · Windows VST3), never RevLimiter's 'VST3, AU, AAX'
const RELEASED_ENTRY = "\nimport { formatsLine as __wbFormats } from './widebeam';\n" +
  "{ const __wb = plugins.find((p) => p.slug === 'widebeam'); if (__wb) __wb.systemReq = { ...__wb.systemReq, formats: __wbFormats() }; else { const __rl = plugins.find((p) => p.slug === 'revlimiter'); plugins.push({ ...__rl, slug: 'widebeam', name: 'WIDE BEAM', paddlePriceId: 'pri_fixture', introPriceUsd: 9, regularPriceUsd: 9, systemReq: { ...__rl.systemReq, formats: __wbFormats() } }); } }\n";

export default {
  ...base,
  cacheDir: process.env.WB_CACHE || path.join(HERE, 'runs', 'fixture-cache'),
  vite: {
    ...(base.vite || {}),
    cacheDir: process.env.WB_CACHE || path.join(HERE, 'runs', 'fixture-vite'),
    plugins: [...((base.vite && base.vite.plugins) || []), {
      name: 'wb-fixture', enforce: 'pre',
      load(id) {
        const f = id.split('?')[0], q = id.includes('?');
        if (f.endsWith('/src/data/widebeam.ts')) return { code: patch(fs.readFileSync(f, 'utf8')), map: null };
        // released = launch step 2 done (widebeam.ts header): Paddle sells it, so plugins.ts has a 'widebeam' entry with the
        // page's price id and price and the formats line (the cart drawer prints it; no AAX), and [slug].astro's OWN_ROUTE
        // keeps /widebeam for the page. Without them assertWidebeamConfig() refuses the phase (500 on /widebeam/).
        if (FX.startsWith('released') && !q && f.endsWith('/src/data/plugins.ts')) return { code: fs.readFileSync(f, 'utf8') + RELEASED_ENTRY, map: null };
        if (FX.startsWith('released') && !q && f.endsWith('/src/pages/[slug].astro')) {
          const src = fs.readFileSync(f, 'utf8'), from = "const OWN_ROUTE = new Set(['gas', 'gas2', 'drift', 'revfx']);";
          if (src.includes("'revfx', 'widebeam']")) return null; // already its own route (Gil's 7a92522)
          if (!src.includes(from)) throw new Error('[Gfixture] [slug].astro no longer has: ' + from);
          return { code: src.replace(from, "const OWN_ROUTE = new Set(['gas', 'gas2', 'drift', 'revfx', 'widebeam']);"), map: null };
        }
      },
    }],
  },
};
