/**
 * Simple in-memory image cache using blob URLs.
 * Prevents redundant network requests for member photos.
 */
import JWTManager from './jwt';

const cache = new Map<string, { blobUrl: string; timestamp: number }>();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

/** Global photo version — only changes when a photo is uploaded/deleted */
let globalPhotoVersion = 1;

export function bumpPhotoVersion(): number {
  globalPhotoVersion = Date.now();
  return globalPhotoVersion;
}

export function getPhotoVersion(): number {
  return globalPhotoVersion;
}

/** Invalidate cache entries for a specific employee or all */
export function invalidateImageCache(employeeId?: number): void {
  if (employeeId) {
    for (const [key, entry] of cache) {
      if (key.includes(`/employees/${employeeId}/`)) {
        URL.revokeObjectURL(entry.blobUrl);
        cache.delete(key);
      }
    }
  } else {
    for (const entry of cache.values()) {
      URL.revokeObjectURL(entry.blobUrl);
    }
    cache.clear();
  }
}

/**
 * Get a cached blob URL for an image, or fetch and cache it.
 * Returns the blob URL for the image.
 */
export async function getCachedImageUrl(url: string): Promise<string> {
  const entry = cache.get(url);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL) {
    return entry.blobUrl;
  }

  // Clean up old entry if expired
  if (entry) {
    URL.revokeObjectURL(entry.blobUrl);
    cache.delete(url);
  }

  // /uploads is authenticated (see backend MiddleWare/requireAuthForUploads.ts),
  // and <img src> cannot send an Authorization header — which is the whole
  // reason photos are fetched here and handed back as blob URLs. Carried over
  // from NAN-HR, which authenticates by cookie; CKD-Ticket uses bearer tokens.
  // getAccessToken, not getToken: getToken only returns the in-memory copy,
  // which is still null on the first paint after a page load, so photos would
  // 401 until a refresh happened to populate it. getAccessToken falls back to
  // localStorage and primes the in-memory value.
  const token = JWTManager.getAccessToken();
  const response = await fetch(url, {
    credentials: 'include',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  if (!response.ok) throw new Error(`Failed to fetch image: ${response.status}`);

  const blob = await response.blob();
  const blobUrl = URL.createObjectURL(blob);
  cache.set(url, { blobUrl, timestamp: Date.now() });

  // Evict old entries if cache grows too large
  if (cache.size > 200) {
    const oldest = cache.entries().next().value;
    if (oldest) {
      URL.revokeObjectURL(oldest[1].blobUrl);
      cache.delete(oldest[0]);
    }
  }

  return blobUrl;
}
