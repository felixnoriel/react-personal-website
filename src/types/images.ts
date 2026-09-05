// GENERATED support types for scripts/optimize-images.ts - do not edit
// (this file itself is hand-written; only src/data/images.generated.ts is generated)

/** One resolution variant of an optimized image, for a <source srcset> entry. */
export interface ImageVariant {
  /** Path under /public, e.g. "/img/genopets-mobile1-a1b2c3d4-960.webp" */
  src: string
  /** Rendered pixel width of this variant. */
  w: number
}

/** Everything a component needs to render a zero-CLS <picture> for one source image. */
export interface OptimizedImage {
  /** Intrinsic width of the original source image (or SVG viewBox width). */
  width: number
  /** Intrinsic height of the original source image (or SVG viewBox height). */
  height: number
  /** AVIF variants, smallest to largest. Empty for SVG sources. */
  avif: ImageVariant[]
  /** WebP variants, smallest to largest. Empty for SVG sources. */
  webp: ImageVariant[]
  /** Universal fallback <img src> (largest WebP variant, or the SVG path). */
  fallback: string
  /** Base64 data: URI of a tiny blurred placeholder. Empty string for SVG sources. */
  lqip: string
  /** Present only for SVG sources: the copied-as-is SVG path under /public. */
  svg?: string
}
