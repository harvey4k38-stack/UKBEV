/**
 * Responsive sources for the bundled photography in /src/assets/images.
 * Each JPG has -768.webp and -1376.webp siblings (generated at build time of the assets).
 */
export function responsiveImg(src: string, sizes = '100vw') {
  const m = src.match(/^(\/src\/assets\/images\/.+)\.jpg$/);
  if (!m) return { src };
  const base = m[1];
  return {
    src,
    srcSet: `${base}-768.webp 768w, ${base}-1376.webp 1376w`,
    sizes,
  };
}
