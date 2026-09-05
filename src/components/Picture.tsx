/**
 * <Picture> - every raster on the site goes through here.
 *
 * Looks the original URL up in the manifest the caller hands over (one of
 * src/data/images/*.generated.ts, so a page only ships the entries it can
 * draw) and renders AVIF, then WebP, then the largest WebP as the fallback,
 * with the real intrinsic width/height so nothing shifts while it loads, and
 * the blur placeholder painted underneath. Local files outside the manifest
 * fall through to a plain <img>; unknown remote URLs (a few legacy placeholder
 * hosts) render nothing rather than a broken image.
 */
import type { CSSProperties, ImgHTMLAttributes } from 'react'
import type { ImageVariant, OptimizedImage } from '../types/images'

const srcSet = (sources: ImageVariant[]) => sources.map((s) => `${s.src} ${s.w}w`).join(', ')

type Props = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'srcSet' | 'width' | 'height'> & {
  src?: string
  /** the manifest this image belongs to (src/data/images/<group>.generated.ts) */
  from: Record<string, OptimizedImage>
  alt: string
  /** the `sizes` attribute, e.g. "(min-width: 768px) 40vw, 100vw" */
  sizes?: string
  /** above-the-fold images set this so the browser fetches them first */
  priority?: boolean
  className?: string
  style?: CSSProperties
}

export function Picture({ src, from, alt, sizes = '100vw', priority = false, className, style, ...rest }: Props) {
  const img = src ? from[src] : undefined
  const loading = priority ? 'eager' : 'lazy'
  const fetchPriority = priority ? 'high' : undefined

  if (!img) {
    if (!src || /^https?:/.test(src)) return null
    return <img src={src} alt={alt} loading={loading} decoding="async" className={className} style={style} {...rest} />
  }

  if (img.svg) {
    return (
      <img
        src={img.svg}
        alt={alt}
        width={img.width}
        height={img.height}
        loading={loading}
        decoding="async"
        className={className}
        style={style}
        {...rest}
      />
    )
  }

  const placeholder: CSSProperties = img.lqip
    ? { backgroundImage: `url(${img.lqip})`, backgroundSize: 'cover', ...style }
    : { ...style }

  return (
    <picture>
      {img.avif.length > 0 && <source type="image/avif" srcSet={srcSet(img.avif)} sizes={sizes} />}
      {img.webp.length > 0 && <source type="image/webp" srcSet={srcSet(img.webp)} sizes={sizes} />}
      <img
        src={img.fallback}
        alt={alt}
        width={img.width}
        height={img.height}
        loading={loading}
        decoding="async"
        fetchPriority={fetchPriority}
        className={className}
        style={placeholder}
        {...rest}
      />
    </picture>
  )
}
