import type { ImageMetadata } from 'astro';

/**
 * Data-driven optimized images.
 *
 * The plugin catalog references images by *filename* (heroImage, galleryImages).
 * Drop the source file in `src/assets/plugins/` and Astro's <Image>/<Picture>
 * pipeline (astro:assets) will emit sized, modern-format variants at build.
 *
 * `public/` images are NOT processed — anything that should be optimized lives
 * under `src/assets/` and is resolved here.
 */
const modules = import.meta.glob<{ default: ImageMetadata }>(
  '../assets/plugins/*.{png,jpg,jpeg,webp,avif}',
  { eager: true },
);

const byFile: Record<string, ImageMetadata> = {};
for (const [path, mod] of Object.entries(modules)) {
  const file = path.split('/').pop();
  if (file) byFile[file] = mod.default;
}

/** Resolve a catalog image filename to an optimizable ImageMetadata, or undefined. */
export function pluginImage(file?: string | null): ImageMetadata | undefined {
  return file ? byFile[file] : undefined;
}
