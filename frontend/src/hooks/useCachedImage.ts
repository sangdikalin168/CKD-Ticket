import { useState, useEffect } from 'react';
import { getCachedImageUrl } from '../utils/imageCache';

/**
 * Hook that returns a cached blob URL for an image.
 * Fetches once and caches in memory — subsequent renders use the cached version.
 */
export function useCachedImage(src: string | null | undefined): {
  url: string | undefined;
  loading: boolean;
} {
  const [url, setUrl] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!src) {
      setUrl(undefined);
      return;
    }

    let cancelled = false;
    setLoading(true);

    getCachedImageUrl(src).then(
      (blobUrl) => {
        if (!cancelled) {
          setUrl(blobUrl);
          setLoading(false);
        }
      },
      () => {
        if (!cancelled) {
          setUrl(undefined);
          setLoading(false);
        }
      }
    );

    return () => { cancelled = true; };
  }, [src]);

  return { url, loading };
}
