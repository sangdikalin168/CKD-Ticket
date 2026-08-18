import React from 'react';
import { useCachedImage } from '../../hooks/useCachedImage';

interface CachedImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src: string | null | undefined;
  fallback?: string;
}

/**
 * Image component that uses in-memory blob cache.
 * Falls back to placeholder while loading or on error.
 */
export const CachedImage: React.FC<CachedImageProps> = ({
  src,
  fallback = '/placeholder-avatar.svg',
  alt,
  ...props
}) => {
  const { url, loading } = useCachedImage(src);

  return (
    <img
      src={url || fallback}
      alt={alt}
      {...props}
      style={{
        ...props.style,
        opacity: loading ? 0.5 : 1,
        transition: 'opacity 0.2s',
      }}
    />
  );
};
